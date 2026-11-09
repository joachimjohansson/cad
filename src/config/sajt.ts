/**
 * Sajtens enda konfigurationsfil.
 *
 * Här bestäms vilka spår som finns, i vilken ordning de visas och vilka
 * kontaktvägar som syns. Lägg till, ta bort eller byt ordning på spår här,
 * ingen annan kod behöver ändras. Varje spår pekar på ett av de tre temana
 * (industri, spel eller kawaii). Två spår kan dela tema.
 */

export type Tema = 'industri' | 'spel' | 'kawaii';
export type Sprak = 'en' | 'sv';
export type Text = Record<Sprak, string>;

export interface Spar {
  /** Används i adressen, till exempel /industri. Bara små bokstäver, siffror och bindestreck. */
  slug: string;
  /** Vilket av de tre temana spåret använder. */
  tema: Tema;
  namn: Text;
  /** En kort rad som visas på dörren på startsidan. */
  beskrivning: Text;
  /** Ingress överst på spårets sida. */
  ingress: Text;
}

export const spar: Spar[] = [
  {
    slug: 'industri',
    tema: 'industri',
    namn: { sv: 'Industri', en: 'Industrial' },
    beskrivning: {
      sv: 'CAD-modeller och ritningar för tillverkning',
      en: 'CAD models and drawings for manufacturing',
    },
    ingress: {
      sv: 'Exakta modeller och ritningsunderlag, från första skiss till färdig tillverkningsritning.',
      en: 'Precise models and drawings, from the first sketch to a drawing ready for manufacturing.',
    },
  },
  {
    slug: 'spel',
    tema: 'spel',
    namn: { sv: 'Spel', en: 'Games' },
    beskrivning: {
      sv: '3D-figurer och animation för spel',
      en: '3D characters and animation for games',
    },
    ingress: {
      sv: 'Figurer som rör sig, riggade och animerade för att leva i en spelvärld.',
      en: 'Characters that move, rigged and animated to live inside a game world.',
    },
  },
  {
    slug: 'kawaii',
    tema: 'kawaii',
    namn: { sv: 'Kawaii', en: 'Kawaii' },
    beskrivning: {
      sv: 'Små gulliga illustrationer och berättelser',
      en: 'Small cute illustrations and stories',
    },
    ingress: {
      sv: 'Små varelser med stora känslor, ritade för att man ska vilja krama dem.',
      en: 'Tiny creatures with big feelings, drawn to be hugged.',
    },
  },
];

export const sajt = {
  namn: 'Vicky Variety',
  person: 'Victoria Wendelid',
  url: 'https://vickyvariety.com',
  roll: {
    sv: 'Illustratör och 3D-formgivare',
    en: 'Illustrator and 3D designer',
  } satisfies Text,
  hjalte: {
    sv: 'Jag modellerar industridetaljer på tiondels millimeter, ger spelfigurer liv och ritar små varelser som vill bli kramade. Välj en dörr.',
    en: 'I model industrial parts to a tenth of a millimetre, bring game characters to life and draw small creatures that want to be hugged. Pick a door.',
  } satisfies Text,
};

/**
 * Kontaktvägar. Lämna ett fält tomt ('') så visas det inte.
 * E-post visas som text som går att kopiera.
 */
export const kontakt = {
  epost: '',
  linkedin: '',
  artstation: '',
  instagram: '',
  behance: '',
  sketchfab: '',
};

/** Hjälpfunktioner, behöver inte ändras. */
export const sparSlugs = spar.map((s) => s.slug);
export function hittaSpar(slug: string): Spar | undefined {
  return spar.find((s) => s.slug === slug);
}
