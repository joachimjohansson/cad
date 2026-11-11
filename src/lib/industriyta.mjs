/**
 * Industriutseende för 3D-modeller: mörkgrå halvmetall mot ljus bakgrund.
 *
 * Används både på sajten (Modell3D.astro) och när posterbilden renderas
 * (scripts/media.mjs), så att poster och interaktiv modell ser likadana ut.
 * Ren JavaScript utan beroenden, eftersom media.mjs serverar filen som den är.
 */

/** Mörka gråtoner i sRGB. Varje material i modellen får nästa ton i tur och ordning. */
export const GRATONER = ['#2b2f33', '#3a3f45', '#23262a', '#474c53', '#31353a'];

/** Attribut på <model-viewer> som ger ljusa reflexer längs kanter och avfasningar. */
export const INDUSTRILJUS = {
  'environment-image': 'neutral',
  'tone-mapping': 'neutral',
  exposure: '1.25',
  'shadow-intensity': '1.2',
  'shadow-softness': '0.6',
};

/** sRGB-hex till linjära värden, som glTF:s baseColorFactor kräver. */
function linjar(hex) {
  return hex
    .match(/\w\w/g)
    .map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
}

/** Sätter ljuset. Anropas innan modellen laddas. */
export function industriljus(mv) {
  for (const [namn, varde] of Object.entries(INDUSTRILJUS)) mv.setAttribute(namn, varde);
}

/** Byter alla material till mörkgrå halvmetall. Anropas när modellen har laddats. */
export function industriyta(mv) {
  const material = mv.model?.materials ?? [];
  material.forEach((m, i) => {
    const pbr = m.pbrMetallicRoughness;
    const [r, g, b] = linjar(GRATONER[i % GRATONER.length]);
    pbr.baseColorTexture?.setTexture(null);
    pbr.metallicRoughnessTexture?.setTexture(null);
    pbr.setBaseColorFactor([r, g, b, 1]);
    pbr.setMetallicFactor(0.55);
    pbr.setRoughnessFactor(0.38);
    m.emissiveTexture?.setTexture(null);
    m.setEmissiveFactor([0, 0, 0]);
  });
}
