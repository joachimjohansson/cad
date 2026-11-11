#!/usr/bin/env node
/**
 * Gör visningsversioner av 3D-modeller och filmer.
 *
 *   npm run media                 alla projekt, hoppar över det som redan är klart
 *   npm run media -- ventilhus-v40   bara ett projekt
 *   npm run media -- --tvinga     gör om allt
 *
 * Originalen ligger i projektmappen (src/content/projekt/<id>/) och publiceras aldrig.
 * Resultatet hamnar här:
 *   public/modeller/<id>/<namn>.glb       komprimerad 3D-modell
 *   public/film/<id>/<namn>.mp4           webbfilm (H.264)
 *   src/content/projekt/<id>/<namn>.poster.webp   posterbild som går genom Astros bildflöde
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const rot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projektMapp = join(rot, 'src', 'content', 'projekt');
const require = createRequire(import.meta.url);

/** Gränser som styr varningarna. */
const MAX_TRIANGLAR = 100_000;
const MAX_MODELL_MB = 8;
const MAX_FILM_MB = 20;
const MAX_FILM_TOTALT_MB = 200;
const MAX_TEXTUR = 2048;

const args = process.argv.slice(2);
const tvinga = args.includes('--tvinga');
const urval = args.find((a) => !a.startsWith('--'));

const sammanfattning = { modeller: [], filmer: [], hoppade: [], varningar: [], fel: [] };

const mb = (byte) => (byte / 1024 / 1024).toFixed(2).replace('.', ',');
const tusen = (n) => Math.round(n).toLocaleString('sv-SE');
const varna = (text) => {
  sammanfattning.varningar.push(text);
  console.warn(`  VARNING: ${text}`);
};
const misslyckades = (text) => {
  sammanfattning.fel.push(text);
  console.error(`  FEL: ${text}`);
};

/** Läser de fält vi behöver ur frontmatter, utan att dra in ett yaml-paket. */
function lasFrontmatter(fil) {
  const text = readFileSync(fil, 'utf8').replace(/\r\n/g, '\n');
  const traff = text.match(/^---\n([\s\S]*?)\n---/);
  const falt = {};
  if (!traff) return falt;
  for (const rad of traff[1].split('\n')) {
    const m = rad.match(/^(modell|film|filmTyp|spar):\s*(.*?)\s*$/);
    if (!m) continue;
    falt[m[1]] = m[2].replace(/\s+#.*$/, '').replace(/^["']|["']$/g, '');
  }
  return falt;
}

/** Vilket tema ett spår har, ur src/config/sajt.ts. Bara industritemat ändrar posterbilden. */
function sparTema(slug) {
  const sajt = readFileSync(join(rot, 'src', 'config', 'sajt.ts'), 'utf8');
  const m = sajt.match(new RegExp(`slug:\\s*'${slug}',\\s*tema:\\s*'([a-z-]+)'`));
  return m?.[1];
}

const basnamn = (fil) => fil.replace(/^\.\//, '').replace(/\.[^.]+$/, '');
const nyare = (utfil, kalla) => existsSync(utfil) && statSync(utfil).mtimeMs >= statSync(kalla).mtimeMs;

/* ------------------------------------------------------------------ */
/* 3D-modeller                                                         */
/* ------------------------------------------------------------------ */

function raknaTriangler(dokument) {
  let summa = 0;
  const meshTriangler = (mesh) => {
    let n = 0;
    for (const prim of mesh.listPrimitives()) {
      if (prim.getMode() !== 4) continue; // bara TRIANGLES
      const index = prim.getIndices();
      const pos = prim.getAttribute('POSITION');
      n += index ? index.getCount() / 3 : pos ? pos.getCount() / 3 : 0;
    }
    return n;
  };
  let instanser = 0;
  for (const nod of dokument.getRoot().listNodes()) {
    const mesh = nod.getMesh();
    if (mesh) {
      summa += meshTriangler(mesh);
      instanser += 1;
    }
  }
  if (instanser === 0) for (const mesh of dokument.getRoot().listMeshes()) summa += meshTriangler(mesh);
  return summa;
}

async function optimeraModell(kalla, utfil) {
  const { NodeIO, Logger } = await import('@gltf-transform/core');
  const { ALL_EXTENSIONS, EXTMeshoptCompression } = await import('@gltf-transform/extensions');
  const { dedup, prune, weld, simplify, resample, textureCompress, reorder, quantize } = await import('@gltf-transform/functions');
  const { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } = await import('meshoptimizer');
  await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

  const dokument = await io.read(kalla);
  dokument.setLogger(new Logger(Logger.Verbosity.WARN));
  const fore = raknaTriangler(dokument);

  await dokument.transform(dedup(), prune(), weld());
  let efter = raknaTriangler(dokument);
  if (efter > MAX_TRIANGLAR) {
    const forhallande = MAX_TRIANGLAR / efter;
    console.log(`  Förenklar nätet: ${tusen(efter)} trianglar, mål ${tusen(MAX_TRIANGLAR)} (kvot ${forhallande.toFixed(2)})`);
    await dokument.transform(simplify({ simplifier: MeshoptSimplifier, ratio: forhallande, error: 0.01 }));
    efter = raknaTriangler(dokument);
  }

  await dokument.transform(
    resample(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [MAX_TEXTUR, MAX_TEXTUR], quality: 85 }),
    reorder({ encoder: MeshoptEncoder }),
    quantize(),
    prune(),
  );
  dokument
    .createExtension(EXTMeshoptCompression)
    .setRequired(true)
    .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });

  mkdirSync(dirname(utfil), { recursive: true });
  await io.write(utfil, dokument);
  return { fore, efter };
}

/* ------------------------------------------------------------------ */
/* Posterbild för modell via headless Chromium + model-viewer          */
/* ------------------------------------------------------------------ */

async function hittaPlaywright() {
  try {
    return require('playwright');
  } catch {
    try {
      const modul = await import('playwright');
      return modul.default ?? modul;
    } catch {
      return null;
    }
  }
}

async function skapaModellposter(glb, utfil, industri = false) {
  const playwright = await hittaPlaywright();
  if (!playwright) {
    throw new Error(
      'Playwright hittades inte, så posterbilden kan inte renderas. Installera det med  npm i -g playwright  och kör  npx playwright install chromium  en gång, kör sedan  npm run media  igen.',
    );
  }
  const mvSokvag = join(rot, 'node_modules', '@google', 'model-viewer', 'dist', 'model-viewer.min.js');
  if (!existsSync(mvSokvag)) throw new Error('Hittar inte @google/model-viewer i node_modules. Kör  npm install  först.');

  const sida = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;overflow:hidden;background:#eef1f4}model-viewer{display:block;width:1600px;height:1200px;background:#eef1f4;--poster-color:#eef1f4}</style>
<script type="module">
  const { ModelViewerElement } = await import('/mv.js');
  const { industriljus, industriyta } = await import('/yta.js');
  const industri = ${industri};
  (ModelViewerElement ?? customElements.get('model-viewer')).meshoptDecoderLocation = '/meshopt_decoder.js';
  const mv = document.createElement('model-viewer');
  mv.id = 'm';
  mv.setAttribute('src', '/modell.glb');
  mv.setAttribute('camera-orbit', '35deg 70deg auto');
  mv.setAttribute('shadow-intensity', '1.1');
  mv.setAttribute('exposure', '1.05');
  mv.setAttribute('environment-image', 'neutral');
  mv.setAttribute('interaction-prompt', 'none');
  mv.setAttribute('loading', 'eager');
  mv.setAttribute('reveal', 'auto');
  if (industri) {
    industriljus(mv);
    mv.addEventListener('load', () => industriyta(mv), { once: true });
  }
  document.body.append(mv);
  window.__klar = true;
</script>`;

  const server = createServer((req, res) => {
    const url = req.url.split('?')[0];
    if (url === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(sida);
    } else if (url === '/mv.js') {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      res.end(readFileSync(mvSokvag));
    } else if (url === '/yta.js') {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      res.end(readFileSync(join(rot, 'src', 'lib', 'industriyta.mjs')));
    } else if (url === '/meshopt_decoder.js') {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      res.end(readFileSync(join(rot, 'node_modules', 'meshoptimizer', 'meshopt_decoder.cjs')));
    } else if (url === '/modell.glb') {
      res.writeHead(200, { 'content-type': 'model/gltf-binary' });
      res.end(readFileSync(glb));
    } else {
      res.writeHead(404).end();
    }
  });
  await new Promise((klar) => server.listen(0, '127.0.0.1', klar));
  const port = server.address().port;

  let webblasare;
  try {
    const flaggor = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
    try {
      webblasare = await playwright.chromium.launch();
    } catch {
      webblasare = await playwright.chromium.launch({ args: flaggor });
    }
    const flik = await webblasare.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
    await flik.goto(`http://127.0.0.1:${port}/`);
    await flik.waitForFunction(() => window.__klar === true, null, { timeout: 30000 });
    await flik.evaluate(
      () =>
        new Promise((klar, fel) => {
          const mv = document.getElementById('m');
          const timer = setTimeout(() => fel(new Error('Modellen laddades inte inom 60 sekunder.')), 60000);
          const fardig = () => {
            if (mv.modelIsVisible) {
              clearTimeout(timer);
              setTimeout(klar, 500);
            } else {
              mv.addEventListener('model-visibility', () => fardig(), { once: true });
            }
          };
          mv.addEventListener('error', (h) => {
            clearTimeout(timer);
            fel(new Error('model-viewer rapporterade fel: ' + (h.detail?.sourceError?.message ?? 'okänt')));
          });
          if (mv.loaded) fardig();
          else mv.addEventListener('load', fardig, { once: true });
        }),
    );
    const png = await flik.screenshot({ type: 'png' });
    mkdirSync(dirname(utfil), { recursive: true });
    await sharp(png).webp({ quality: 85 }).toFile(utfil);
  } finally {
    await webblasare?.close();
    server.close();
  }
}

/* ------------------------------------------------------------------ */
/* Film                                                                */
/* ------------------------------------------------------------------ */

function ffmpegFinns() {
  return spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' }).status === 0;
}

function filmLangd(kalla) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', kalla], { encoding: 'utf8' });
  const m = (r.stderr ?? '').match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
}

function konverteraFilm(kalla, utfil, tyst) {
  mkdirSync(dirname(utfil), { recursive: true });
  const ffArgs = [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', kalla,
    '-vf', "scale='min(1280,iw)':-2",
    '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    ...(tyst ? ['-an'] : ['-c:a', 'aac', '-b:a', '128k']),
    utfil,
  ];
  const r = spawnSync('ffmpeg', ffArgs, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg misslyckades:\n${r.stderr}`);
}

async function skapaFilmposter(kalla, utfil) {
  const langd = filmLangd(kalla);
  const tid = langd >= 1.5 ? '1' : '0';
  const r = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-loglevel', 'error', '-ss', tid, '-i', kalla, '-frames:v', '1',
      '-vf', "scale='min(1600,iw)':-2", '-f', 'image2pipe', '-vcodec', 'png', '-'],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  if (r.status !== 0 || !r.stdout?.length) throw new Error(`Kunde inte plocka en bild ur filmen:\n${r.stderr}`);
  mkdirSync(dirname(utfil), { recursive: true });
  await sharp(r.stdout).webp({ quality: 82 }).toFile(utfil);
}

function mappstorlek(mapp) {
  if (!existsSync(mapp)) return 0;
  let summa = 0;
  for (const post of readdirSync(mapp, { withFileTypes: true })) {
    const vag = join(mapp, post.name);
    summa += post.isDirectory() ? mappstorlek(vag) : statSync(vag).size;
  }
  return summa;
}

/* ------------------------------------------------------------------ */
/* Huvudflöde                                                          */
/* ------------------------------------------------------------------ */

async function bearbetaProjekt(id) {
  const mapp = join(projektMapp, id);
  const index = join(mapp, 'index.md');
  if (!existsSync(index)) return;
  const fm = lasFrontmatter(index);

  if (fm.modell) {
    const namn = basnamn(fm.modell);
    const kalla = join(mapp, fm.modell);
    const utfil = join(rot, 'public', 'modeller', id, `${namn}.glb`);
    const poster = join(mapp, `${namn}.poster.webp`);
    console.log(`\n3D-modell: ${id}/${fm.modell}`);
    if (!existsSync(kalla)) {
      misslyckades(`Hittar inte originalmodellen src/content/projekt/${id}/${fm.modell}. Lägg filen i projektmappen eller ta bort raden "modell" i index.md.`);
    } else if (!tvinga && nyare(utfil, kalla) && nyare(poster, kalla)) {
      console.log('  Redan klar, hoppar över (använd --tvinga för att göra om).');
      sammanfattning.hoppade.push(`${id}/${fm.modell}`);
    } else {
      try {
        const { fore, efter } = await optimeraModell(kalla, utfil);
        const fMb = statSync(kalla).size;
        const eMb = statSync(utfil).size;
        console.log(`  Storlek: ${mb(fMb)} MB -> ${mb(eMb)} MB`);
        console.log(`  Trianglar: ${tusen(fore)} -> ${tusen(efter)}`);
        if (eMb > MAX_MODELL_MB * 1024 * 1024) varna(`${id}/${namn}.glb är ${mb(eMb)} MB (över ${MAX_MODELL_MB} MB). Det kan bli för tungt för mobiler, särskilt iPhone.`);
        if (efter > MAX_TRIANGLAR) varna(`${id}/${namn}.glb har ${tusen(efter)} trianglar (över ${tusen(MAX_TRIANGLAR)}). Det kan bli för tungt för mobiler, särskilt iPhone.`);
        console.log('  Renderar posterbild ...');
        await skapaModellposter(utfil, poster, sparTema(fm.spar) === 'industri');
        console.log(`  Skrev ${poster.replace(rot + '/', '')}`);
        sammanfattning.modeller.push({ id, fil: `${namn}.glb`, fore: fMb, efter: eMb, triFore: fore, triEfter: efter });
      } catch (e) {
        misslyckades(`${id}/${fm.modell}: ${e.message}`);
      }
    }
  }

  if (fm.film) {
    if (/^https:\/\//.test(fm.film)) {
      console.log(`\nFilm: ${id} använder en extern adress, inget att konvertera.`);
      return;
    }
    const namn = basnamn(fm.film);
    const kalla = join(mapp, fm.film);
    const utfil = join(rot, 'public', 'film', id, `${namn}.mp4`);
    const poster = join(mapp, `${namn}.poster.webp`);
    console.log(`\nFilm: ${id}/${fm.film}`);
    if (!existsSync(kalla)) {
      misslyckades(`Hittar inte originalfilmen src/content/projekt/${id}/${fm.film}. Lägg filen i projektmappen eller ta bort raden "film" i index.md.`);
    } else if (!ffmpegFinns()) {
      misslyckades('ffmpeg saknas. Installera det med  sudo apt install ffmpeg  (Linux),  brew install ffmpeg  (macOS) eller  winget install ffmpeg  (Windows).');
    } else if (!tvinga && nyare(utfil, kalla) && nyare(poster, kalla)) {
      console.log('  Redan klar, hoppar över (använd --tvinga för att göra om).');
      sammanfattning.hoppade.push(`${id}/${fm.film}`);
    } else {
      try {
        const tyst = (fm.filmTyp ?? 'loop') === 'loop';
        konverteraFilm(kalla, utfil, tyst);
        await skapaFilmposter(kalla, poster);
        const fByte = statSync(kalla).size;
        const eByte = statSync(utfil).size;
        console.log(`  Storlek: ${mb(fByte)} MB -> ${mb(eByte)} MB (${tyst ? 'utan ljud' : 'med ljud'})`);
        console.log(`  Skrev ${poster.replace(rot + '/', '')}`);
        if (eByte > MAX_FILM_MB * 1024 * 1024) varna(`${id}/${namn}.mp4 är ${mb(eByte)} MB (över ${MAX_FILM_MB} MB). Korta filmen, sänk upplösningen eller lägg den på Cloudflare Stream eller Bunny Stream.`);
        sammanfattning.filmer.push({ id, fil: `${namn}.mp4`, fore: fByte, efter: eByte });
      } catch (e) {
        misslyckades(`${id}/${fm.film}: ${e.message}`);
      }
    }
  }
}

async function main() {
  console.log('Media: optimerar 3D-modeller och filmer');
  if (tvinga) console.log('Flaggan --tvinga är på, allt görs om.');
  if (!existsSync(projektMapp)) {
    console.error(`Hittar inte mappen ${projektMapp}.`);
    process.exit(1);
  }
  const alla = readdirSync(projektMapp, { withFileTypes: true }).filter((p) => p.isDirectory()).map((p) => p.name).sort();
  if (urval && !alla.includes(urval)) {
    console.error(`Projektet "${urval}" finns inte i src/content/projekt. Tillgängliga: ${alla.join(', ')}`);
    process.exit(1);
  }
  for (const id of urval ? [urval] : alla) await bearbetaProjekt(id);

  const filmTotalt = mappstorlek(join(rot, 'public', 'film'));
  if (filmTotalt > MAX_FILM_TOTALT_MB * 1024 * 1024) {
    varna(
      `Filmerna i public/film väger ${mb(filmTotalt)} MB tillsammans (över ${MAX_FILM_TOTALT_MB} MB). Flytta filmerna till Cloudflare Stream eller Bunny Stream med HLS och skriv https-adressen (.m3u8) som värde för  film:  i index.md.`,
    );
  }

  console.log('\n=== Sammanfattning ===');
  for (const m of sammanfattning.modeller)
    console.log(`3D   ${m.id}/${m.fil}: ${mb(m.fore)} -> ${mb(m.efter)} MB, ${tusen(m.triFore)} -> ${tusen(m.triEfter)} trianglar`);
  for (const f of sammanfattning.filmer) console.log(`Film ${f.id}/${f.fil}: ${mb(f.fore)} -> ${mb(f.efter)} MB`);
  if (sammanfattning.hoppade.length) console.log(`Hoppade över (redan klara): ${sammanfattning.hoppade.join(', ')}`);
  if (!sammanfattning.modeller.length && !sammanfattning.filmer.length && !sammanfattning.hoppade.length && !sammanfattning.fel.length)
    console.log('Inga modeller eller filmer att bearbeta. Lägg  modell:  eller  film:  i ett projekts index.md.');
  console.log(`Varningar: ${sammanfattning.varningar.length}, fel: ${sammanfattning.fel.length}`);
  if (sammanfattning.fel.length) {
    console.error('\nNågot gick fel:');
    for (const f of sammanfattning.fel) console.error(` - ${f}`);
    process.exit(1);
  }
  console.log('Klart.');
}

// Postersteget kan importeras för sig, till exempel för att rendera om en poster utan att komprimera om modellen.
export { skapaModellposter, sparTema };

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`\nOväntat fel: ${e.stack ?? e.message}`);
    process.exit(1);
  });
}
