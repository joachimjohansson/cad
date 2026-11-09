/**
 * Innehållsmodellen för projekt.
 *
 * Varje projekt är en mapp i src/content/projekt/<namn-på-projektet>/ med
 *   index.md      projektet på svenska (krävs)
 *   index.en.md   samma projekt på engelska (valfritt)
 *   bilder        jpg, png, webp eller avif i samma mapp
 *
 * Felmeddelandena nedan visas när sajten byggs, så de är skrivna för den som
 * lägger till projekt och inte för en utvecklare.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { sparSlugs } from './config/sajt';

const BILD = /\.(jpe?g|png|webp|avif)$/i;
const FILM = /\.(mp4|mov|m4v|webm|mkv)$/i;

/** Text som måste finnas, med ett exempel i felmeddelandet. */
function text(falt: string, exempel: string, max?: number) {
  let s = z.string({
    error: (fel) =>
      fel.input === undefined
        ? `Fältet "${falt}" saknas. Lägg till en rad som till exempel:  ${falt}: ${exempel}`
        : `"${falt}" ska vara text. Exempel:  ${falt}: ${exempel}`,
  }).trim().min(1, { error: `"${falt}" är tomt. Skriv till exempel:  ${falt}: ${exempel}` });
  if (max) {
    s = s.max(max, { error: `"${falt}" är för lång. Håll den under ${max} tecken.` });
  }
  return s;
}

const giltigaSpar = sparSlugs.map((s) => `"${s}"`).join(', ');

const bildpost = z.union(
  [
    z.string().regex(BILD),
    z.object({
      fil: z.string().regex(BILD, { error: 'Filnamnet under "bilder" måste sluta på .jpg, .png, .webp eller .avif.' }),
      alt: z.string().optional(),
      bildtext: z.string().optional(),
    }),
  ],
  {
    error:
      'Varje rad under "bilder" ska vara ett filnamn, till exempel "- 02-skiss.jpg", eller fil, alt och bildtext. Se INSTRUKTION.md.',
  },
);

const projekt = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: './src/content/projekt',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    titel: text('titel', 'Ventilhus V-40', 90),
    spar: z
      .string({ error: `Fältet "spar" saknas. Skriv vilket spår projektet hör till: ${giltigaSpar}.` })
      .refine((v) => sparSlugs.includes(v), {
        error: (fel) => `Spåret "${String(fel.input)}" finns inte. Välj ett av ${giltigaSpar}. Spåren ändras i src/config/sajt.ts.`,
      }),
    ar: z
      .number({ error: 'Fältet "ar" ska vara ett årtal utan citattecken, till exempel:  ar: 2026' })
      .int({ error: '"ar" ska vara ett helt årtal, till exempel 2026.' })
      .min(1990, { error: '"ar" verkar fel. Skriv årtalet med fyra siffror, till exempel 2026.' })
      .max(2100, { error: '"ar" verkar fel. Skriv årtalet med fyra siffror, till exempel 2026.' }),
    beskrivning: text('beskrivning', 'En kort mening om projektet som visas på kortet.', 220),
    omslag: z
      .string({ error: 'Fältet "omslag" saknas. Skriv filnamnet på omslagsbilden, till exempel:  omslag: omslag.jpg' })
      .regex(BILD, { error: 'Omslagsbilden måste vara en .jpg, .png, .webp eller .avif.' }),
    omslagAlt: text('omslagAlt', 'Ventilhuset i genomskärning med flödet markerat i rött.', 200),
    modell: z
      .string()
      .regex(/\.glb$/i, { error: '"modell" måste vara en .glb-fil, till exempel:  modell: ventilhus.glb' })
      .optional(),
    modellAlt: z.string().max(200).optional(),
    film: z
      .string()
      .refine((v) => FILM.test(v) || /^https:\/\//.test(v), {
        error: '"film" ska vara ett filnamn som slutar på .mp4, .mov eller .webm, eller en https-adress från Cloudflare Stream eller Bunny Stream.',
      })
      .optional(),
    filmTyp: z
      .enum(['loop', 'visning'], {
        error: '"filmTyp" ska vara loop (kort, tyst slinga) eller visning (längre film med ljud och kontroller).',
      })
      .default('loop'),
    bilder: z.array(bildpost, { error: '"bilder" ska vara en lista, en bild per rad som börjar med bindestreck.' }).optional(),
    utvald: z.boolean({ error: '"utvald" ska vara true eller false.' }).default(false),
    utkast: z.boolean({ error: '"utkast" ska vara true eller false.' }).default(false),
  }),
});

/** Engelsk text till ett projekt. Allt annat hämtas från den svenska filen. */
const projektEn = defineCollection({
  loader: glob({
    pattern: '*/index.en.md',
    base: './src/content/projekt',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    titel: text('titel', 'Valve housing V-40', 90),
    beskrivning: text('beskrivning', 'One short sentence shown on the card.', 220),
    omslagAlt: z.string().optional(),
    modellAlt: z.string().optional(),
    /** Engelska alt-texter per bild, till exempel  02-skiss.jpg: Pencil sketch of the housing */
    alt: z.record(z.string(), z.string()).optional(),
    /** Engelska bildtexter per bild. */
    bildtext: z.record(z.string(), z.string()).optional(),
  }),
});

export const collections = { projekt, projektEn };

