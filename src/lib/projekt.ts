/**
 * Hämtar projekten och kopplar ihop dem med bilder, 3D-modeller och film.
 * Saknas en fil stoppas bygget med ett felmeddelande på svenska.
 */
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { hittaSpar, type Spar, type Sprak } from '../config/sajt';
import { medBas } from '../i18n/ord';

const bildfiler = import.meta.glob<ImageMetadata>('/src/content/projekt/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', {
  eager: true,
  import: 'default',
});

/** Alla bilder i ett projekts mapp, nyckel = filnamn. */
function bilderI(id: string): Map<string, ImageMetadata> {
  const prefix = `/src/content/projekt/${id}/`;
  const karta = new Map<string, ImageMetadata>();
  for (const [vag, bild] of Object.entries(bildfiler)) {
    if (vag.startsWith(prefix)) karta.set(vag.slice(prefix.length), bild);
  }
  return karta;
}

function basnamn(fil: string): string {
  return fil.replace(/^\.\//, '').replace(/\.[^.]+$/, '');
}

function fel(id: string, meddelande: string): never {
  throw new Error(`\n\nProjektet "${id}" (src/content/projekt/${id}/index.md):\n${meddelande}\n`);
}

export interface Galleribild {
  fil: string;
  bild: ImageMetadata;
  alt: Record<Sprak, string>;
  bildtext?: Record<Sprak, string | undefined>;
}

export interface Projekt {
  id: string;
  spar: Spar;
  ar: number;
  utvald: boolean;
  titel: Record<Sprak, string>;
  beskrivning: Record<Sprak, string>;
  harEngelska: boolean;
  omslag: ImageMetadata;
  omslagAlt: Record<Sprak, string>;
  bilder: Galleribild[];
  modell?: { src: string; poster: ImageMetadata; alt: Record<Sprak, string>; storlek: number };
  film?: { src: string; poster?: ImageMetadata; typ: 'loop' | 'visning'; hls: boolean };
  sv: CollectionEntry<'projekt'>;
  en?: CollectionEntry<'projektEn'>;
}

let cache: Promise<Projekt[]> | undefined;

export function allaProjekt(): Promise<Projekt[]> {
  cache ??= laddaProjekt();
  return cache;
}

async function laddaProjekt(): Promise<Projekt[]> {
  const svenska = await getCollection('projekt', ({ data }) => import.meta.env.DEV || !data.utkast);
  const engelska = new Map((await getCollection('projektEn')).map((e) => [e.id, e]));

  for (const id of engelska.keys()) {
    if (!svenska.some((s) => s.id === id)) {
      console.warn(`Varning: src/content/projekt/${id}/index.en.md har ingen svensk index.md bredvid sig och visas inte.`);
    }
  }

  const lista = svenska.map((sv): Projekt => {
    const { id, data } = sv;
    const en = engelska.get(id);
    const spar = hittaSpar(data.spar) ?? fel(id, `Spåret "${data.spar}" finns inte i src/config/sajt.ts.`);
    const filer = bilderI(id);

    const omslag =
      filer.get(data.omslag.replace(/^\.\//, '')) ??
      fel(id, `Hittar inte omslagsbilden "${data.omslag}". Kontrollera att filen ligger i projektmappen och att namnet stavas exakt likadant, även stora och små bokstäver.`);

    // Galleri: listade bilder först i angiven ordning, sedan resten i bokstavsordning.
    const listade = (data.bilder ?? []).map((b) => (typeof b === 'string' ? { fil: b } : b));
    const ovriga = [...filer.keys()]
      .filter((f) => !f.includes('.poster.') && f !== data.omslag.replace(/^\.\//, ''))
      .filter((f) => !listade.some((l) => l.fil.replace(/^\.\//, '') === f))
      .sort((a, b) => a.localeCompare(b, 'sv'))
      .map((fil) => ({ fil }) as { fil: string; alt?: string; bildtext?: string });
    let nummer = 0;
    const bilder: Galleribild[] = [...listade, ...ovriga].map((post) => {
      const fil = post.fil.replace(/^\.\//, '');
      const bild = filer.get(fil) ?? fel(id, `Bilden "${post.fil}" under "bilder" finns inte i projektmappen.`);
      nummer += 1;
      return {
        fil,
        bild,
        bildtext: { sv: post.bildtext, en: en?.data.bildtext?.[fil] ?? post.bildtext },
        alt: {
          sv: post.alt ?? `${data.titel}, bild ${nummer}`,
          en: en?.data.alt?.[fil] ?? post.alt ?? `${en?.data.titel ?? data.titel}, image ${nummer}`,
        },
      };
    });

    let modell: Projekt['modell'];
    if (data.modell) {
      const namn = basnamn(data.modell);
      const publik = join(process.cwd(), 'public', 'modeller', id, `${namn}.glb`);
      if (!existsSync(publik)) {
        fel(id, `3D-modellen "${data.modell}" har ingen visningsversion än. Kör  npm run media  så komprimeras modellen och en posterbild skapas.`);
      }
      const poster = filer.get(`${namn}.poster.webp`) ?? fel(id, `Posterbilden "${namn}.poster.webp" saknas. Kör  npm run media.`);
      modell = {
        src: medBas(`/modeller/${id}/${namn}.glb`),
        poster,
        storlek: statSync(publik).size,
        alt: {
          sv: data.modellAlt ?? data.omslagAlt,
          en: en?.data.modellAlt ?? en?.data.omslagAlt ?? data.modellAlt ?? data.omslagAlt,
        },
      };
    }

    let film: Projekt['film'];
    if (data.film) {
      if (data.film.startsWith('https://')) {
        film = { src: data.film, typ: data.filmTyp, hls: /\.m3u8(\?|$)/.test(data.film) };
      } else {
        const namn = basnamn(data.film);
        if (!existsSync(join(process.cwd(), 'public', 'film', id, `${namn}.mp4`))) {
          fel(id, `Filmen "${data.film}" har ingen webbversion än. Kör  npm run media  så konverteras den till MP4 med posterbild.`);
        }
        film = { src: medBas(`/film/${id}/${namn}.mp4`), poster: filer.get(`${namn}.poster.webp`), typ: data.filmTyp, hls: false };
      }
    }

    return {
      id,
      spar,
      ar: data.ar,
      utvald: data.utvald,
      titel: { sv: data.titel, en: en?.data.titel ?? data.titel },
      beskrivning: { sv: data.beskrivning, en: en?.data.beskrivning ?? data.beskrivning },
      harEngelska: Boolean(en),
      omslag,
      omslagAlt: { sv: data.omslagAlt, en: en?.data.omslagAlt ?? data.omslagAlt },
      bilder,
      modell,
      film,
      sv,
      en,
    };
  });

  return lista.sort((a, b) => b.ar - a.ar || a.titel.sv.localeCompare(b.titel.sv, 'sv'));
}

export async function projektISpar(slug: string): Promise<Projekt[]> {
  return (await allaProjekt()).filter((p) => p.spar.slug === slug);
}
