---
name: nytt-projekt
description: Lägger till ett nytt projekt i Vicky Varietys portfolio från en mapp med bilder (och eventuellt .glb-modell eller film) och en kort beskrivning. Skapar projektmappen, index.md och index.en.md, optimerar media och visar en förhandsgranskning. Använd när någon ber om att lägga till, skapa eller publicera ett projekt, till exempel "lägg till projektet i mappen X, det är en räv för ett mobilspel".
---

# Nytt projekt

Målet är att Victoria eller Joachim ska kunna lägga till ett projekt med en mening. Allt sker i projektmappen, ingen kod ändras.

## Indata

Du behöver en källmapp med filer och en kort beskrivning. Fråga bara om det som inte går att lista ut:

- Vilket spår projektet hör till. Giltiga spår står i `src/config/sajt.ts` (`spar[].slug`). Gissa utifrån beskrivningen och bilderna och fråga bara om det är oklart.
- Årtal. Använd innevarande år om inget annat sägs.
- Vilken bild som är omslag. Välj den bild som bäst visar det färdiga resultatet om inget sägs.

## Steg

1. **Läs källmappen.** Lista filerna. Titta på varje bild med Read, så att texterna beskriver vad bilderna faktiskt visar.
2. **Välj mappnamn.** Små bokstäver, siffror och bindestreck, utan å, ä och ö (å blir a, ä blir a, ö blir o). Kontrollera att `src/content/projekt/<namn>/` inte redan finns.
3. **Kopiera filerna** till `src/content/projekt/<namn>/`. Omslaget döps till `omslag.<ändelse>`. Övriga bilder får ett nummerprefix i den ordning de ska visas (`02-…`, `03-…`). Konvertera HEIC, TIFF och PSD till JPG med sharp först. Bilder större än 4000 pixlar krymps till 4000 på längsta sidan. `.glb` och film kopieras med enkla namn. Originalen i källmappen rörs inte.
4. **Skriv `index.md`** enligt `INSTRUKTION.md` och schemat i `src/content.config.ts`. Berättelsen skrivs i jagform som Victoria, 120 till 300 ord, med början, problem, ett beslut och slut. Hitta inte på fakta om kunder, siffror eller namn. Saknas underlag, skriv kortare och markera med en HTML-kommentar `<!-- Komplettera: … -->` vad Victoria bör fylla i. Skriv alt-texter för alla bilder.
5. **Skriv `index.en.md`** med samma innehåll på naturlig engelska. Den har bara fälten `titel`, `beskrivning`, `omslagAlt`, `modellAlt`, `alt` och `bildtext`.
6. **Skrivregler:** inga rubriker eller etiketter med enbart versaler, inga punktlistor i brödtexten, inga tankstreck. Skriv vardagligt och konkret.
7. **Optimera media.** Finns `.glb` eller film, kör `npm run media <namn>`. Visa varningarna om storlek och trianglar för användaren. Är modellen för tung, föreslå att den förenklas i 3D-programmet innan den läggs in igen.
8. **Bygg.** Kör `npx astro build`. Om bygget stoppas av ett fel i frontmatter, rätta det och bygg igen.
9. **Förhandsgranska.** Starta `npx astro preview --port 4329` i bakgrunden. Ta skärmdumpar med Playwright av `/<spår>/<namn>/` och `/sv/<spår>/<namn>/` i 390 och 1280 pixlars bredd. Kontrollera att inget går utanför sidan i sidled. Visa skärmdumparna för användaren och stoppa servern.
10. **Fråga innan publicering.** Committa och pusha bara när användaren säger till. Commit-meddelandet skrivs på svenska, till exempel "Lägg till projektet Räven i snön".

## Kontrollera innan du är klar

- Bygget går igenom.
- Inga originalfiler för 3D eller film hamnar i git (`git status` ska inte visa `.glb`, `.mov` eller `.mp4` i `src/content`).
- Alla bilder har alt-text på båda språken.
