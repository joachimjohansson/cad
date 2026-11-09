import type { Sprak } from '../config/sajt';

/** Alla fasta texter i gränssnittet på båda språken. */
const ord = {
  hoppaTillInnehall: { sv: 'Hoppa till innehållet', en: 'Skip to content' },
  huvudmeny: { sv: 'Huvudmeny', en: 'Main menu' },
  start: { sv: 'Start', en: 'Home' },
  om: { sv: 'Om', en: 'About' },
  kontakt: { sv: 'Kontakt', en: 'Contact' },
  sprakNamn: { sv: 'Svenska', en: 'English' },
  bytSprak: { sv: 'In English', en: 'På svenska' },
  spar: { sv: 'Spår', en: 'Track' },
  ar: { sv: 'År', en: 'Year' },
  projekt: { sv: 'Projekt', en: 'Projects' },
  ingaProjekt: {
    sv: 'Inga projekt här än. Nya projekt läggs till som mappar i src/content/projekt.',
    en: 'No projects here yet.',
  },
  fleraProjekt: { sv: 'Fler projekt i spåret', en: 'More in this track' },
  tillbakaTill: { sv: 'Tillbaka till', en: 'Back to' },
  visa3D: { sv: 'Visa i 3D', en: 'View in 3D' },
  laddar3D: { sv: 'Laddar 3D-modellen', en: 'Loading the 3D model' },
  visaIAR: { sv: 'Visa i ditt rum', en: 'View in your space' },
  modellHjalp: {
    sv: 'Dra för att rotera, nyp eller scrolla för att zooma.',
    en: 'Drag to rotate, pinch or scroll to zoom.',
  },
  spelaFilm: { sv: 'Spela filmen', en: 'Play the film' },
  pausaFilm: { sv: 'Pausa filmen', en: 'Pause the film' },
  modellFel: {
    sv: 'Det gick inte att ladda 3D-modellen. Försök igen om en stund.',
    en: 'The 3D model could not be loaded. Please try again in a moment.',
  },
  filmFel: {
    sv: 'Det gick inte att spela filmen.',
    en: 'The film could not be played.',
  },
  oppnaFilm: { sv: 'Öppna filmen', en: 'Open the film' },
  bild: { sv: 'Bild', en: 'Image' },
  saknarEngelska: {
    sv: '',
    en: 'This project is only described in Swedish so far.',
  },
  kopiera: { sv: 'Kopiera', en: 'Copy' },
  kopierad: { sv: 'Kopierad', en: 'Copied' },
  rattigheter: {
    sv: 'Alla bilder och modeller är skyddade av upphovsrätt. Text- och datautvinning är förbehållen enligt EU-direktiv 2019/790 artikel 4.',
    en: 'All images and models are protected by copyright. Text and data mining is reserved under EU Directive 2019/790, Article 4.',
  },
  omRubrik: { sv: 'Om Victoria', en: 'About Victoria' },
} satisfies Record<string, Record<Sprak, string>>;

export type OrdNyckel = keyof typeof ord;

export function t(sprak: Sprak, nyckel: OrdNyckel): string {
  return ord[nyckel][sprak];
}

/** Bygger en adress för rätt språk. Engelska ligger på roten, svenska under /sv. */
export function lank(sprak: Sprak, sokvag = '/'): string {
  const ren = sokvag.startsWith('/') ? sokvag : `/${sokvag}`;
  if (sprak === 'en') return ren;
  return ren === '/' ? '/sv/' : `/sv${ren}`;
}

/** Samma sida på det andra språket. */
export function andraSprak(sprak: Sprak): Sprak {
  return sprak === 'en' ? 'sv' : 'en';
}
