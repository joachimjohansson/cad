/**
 * Bildtjänst för bygget. Bygger på Astros sharp-tjänst och lägger till tre saker:
 *
 * 1. Ingen bild publiceras större än MAX_SIDA pixlar på längsta sidan.
 * 2. Bilder från 600 pixlars bredd får en diskret vattenstämpel (märket) i hörnet.
 * 3. Upphovsrätt och förbehåll mot AI-träning skrivs in i bildens metadata.
 *
 * Originalen i src/content kopieras aldrig till den publicerade sajten,
 * bara de bearbetade versionerna.
 */
import type { LocalImageService } from 'astro';
import sharpService from 'astro/assets/services/sharp';
import sharp from 'sharp';

const MAX_SIDA = 1800;
const MIN_FOR_STAMPEL = 600;
const UPPHOV = 'Victoria Wendelid, vickyvariety.com';
const FORBEHALL =
  'All rights reserved. Text and data mining, including AI training, is reserved under EU Directive 2019/790 Art. 4.';

function stampel(bredd: number): Buffer {
  const storlek = Math.round(Math.max(28, bredd * 0.045));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${storlek}" height="${Math.round(storlek * 1.05)}" viewBox="20 22 160 176">
  <g fill="none" stroke-linejoin="round">
    <g stroke="#000" stroke-opacity="0.28" stroke-width="16">
      <polygon points="100,30 170,70 100,110 30,70"/><polygon points="30,70 100,110 100,190 30,150"/><polygon points="100,110 170,70 170,150 100,190"/>
    </g>
    <g stroke="#fff" stroke-opacity="0.62" stroke-width="8">
      <polygon points="100,30 170,70 100,110 30,70"/><polygon points="30,70 100,110 100,190 30,150"/><polygon points="100,110 170,70 170,150 100,190"/>
    </g>
  </g>
  <g transform="matrix(0.7,0.4,0,0.8,30,70)" fill="#fff" fill-opacity="0.62">
    <ellipse cx="34" cy="48" rx="7" ry="9"/><ellipse cx="66" cy="48" rx="7" ry="9"/>
  </g>
</svg>`;
  return Buffer.from(svg);
}

const tjanst: LocalImageService = {
  ...sharpService,

  async transform(indata, alternativ, konfig, logger) {
    const opts = { ...alternativ };

    // Begränsa begärd storlek.
    if (opts.width && opts.width > MAX_SIDA) {
      if (opts.height) opts.height = Math.round((opts.height * MAX_SIDA) / opts.width);
      opts.width = MAX_SIDA;
    }

    // Krymp källan först så att ingen utdata kan bli större än MAX_SIDA.
    const meta = await sharp(indata).metadata();
    let kalla: Uint8Array = indata;
    if (meta.format !== 'svg' && meta.format !== 'gif' && Math.max(meta.width ?? 0, meta.height ?? 0) > MAX_SIDA) {
      kalla = await sharp(indata, { failOn: 'none' })
        .rotate()
        .resize({ width: MAX_SIDA, height: MAX_SIDA, fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }

    const resultat = await sharpService.transform(kalla, opts, konfig, logger);
    if (resultat.format === 'svg' || resultat.format === 'gif') return resultat;

    const bild = sharp(resultat.data);
    const { width = 0, height = 0 } = await bild.metadata();
    const lager: sharp.OverlayOptions[] = [];
    if (width >= MIN_FOR_STAMPEL) {
      const marg = Math.round(width * 0.025);
      const s = stampel(width);
      const sm = await sharp(s).metadata();
      lager.push({
        input: s,
        left: Math.max(0, width - (sm.width ?? 0) - marg),
        top: Math.max(0, height - (sm.height ?? 0) - marg),
      });
    }

    let ut = bild.composite(lager).withExif({
      IFD0: { Copyright: `© ${UPPHOV}. ${FORBEHALL}`, Artist: UPPHOV },
    });
    if (resultat.format === 'webp') ut = ut.webp({ quality: 80 });
    else if (resultat.format === 'avif') ut = ut.avif({ quality: 60 });
    else if (resultat.format === 'png') ut = ut.png();
    else ut = ut.jpeg({ quality: 82, mozjpeg: true });

    return { data: await ut.toBuffer(), format: resultat.format };
  },
};

export default tjanst;
