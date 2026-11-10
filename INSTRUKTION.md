# Så lägger du till ett projekt

Ett projekt är en mapp med bilder och en textfil. Du behöver inte röra någon kod. Den här sidan visar hela vägen, från tom mapp till publicerat projekt, med ett påhittat exempel: en riggad räv för ett mobilspel.

## Det enklaste sättet

Lägg bilderna, modellen och filmen i en mapp var som helst på datorn och be Claude:

```text
Lägg till ett projekt från mappen Skrivbord/Räven. Det är en riggad räv
för ett mobilspel från 2026, spår spel.
```

Claude använder då skillen `nytt-projekt`. Den gör stegen nedan åt dig, skriver förslag på text och alt-texter och visar en förhandsgranskning. Den frågar innan något publiceras. Läs vidare om du vill veta exakt vad som händer, eller göra det själv.

## Steg 1. Skapa projektmappen

Skapa en ny mapp i `src/content/projekt/`. Mappens namn blir projektets adress på sajten, så använd små bokstäver och bindestreck, och inga å, ä eller ö.

```text
src/content/projekt/raven-i-snon/
```

Projektet hamnar då på `/spel/raven-i-snon/`.

## Steg 2. Lägg in filerna

Lägg bilderna i mappen. Omslagsbilden döps till `omslag.jpg`. De andra bilderna visas i bokstavsordning, så det är praktiskt att börja namnen med siffror. Har du en 3D-modell eller en film lägger du den också här.

```text
src/content/projekt/raven-i-snon/
  omslag.jpg
  02-skiss.jpg
  03-rigg.jpg
  raven.glb        3D-modellen, originalet
  springer.mp4     filmen, originalet
```

Bilder får vara `.jpg`, `.png`, `.webp` eller `.avif`. Ladda gärna in dem i full storlek. Sajten gör själv mindre versioner med vattenstämpel, och originalbilden publiceras aldrig.

3D-modeller och filmer i projektmappen sparas aldrig till GitHub och publiceras aldrig. Det är bara de lättare visningsversionerna från steg 5 som hamnar på sajten.

## Steg 3. Skriv index.md

Skapa filen `index.md` i mappen. Överst står fälten mellan två rader med tre bindestreck. Under dem skriver du berättelsen.

```markdown
---
titel: Räven i snön
spar: spel
ar: 2026
beskrivning: En riggad räv för ett mobilspel, med en springcykel som håller på små skärmar.
omslag: omslag.jpg
omslagAlt: En orange räv i lågpoly som springer genom snö i blått kvällsljus.
modell: raven.glb
modellAlt: Räven i 3D som går att vrida och zooma.
film: springer.mp4
filmTyp: loop
bilder:
  - fil: 02-skiss.jpg
    alt: Blyertsskiss av räven i tre olika poser.
    bildtext: De första poserna.
  - fil: 03-rigg.jpg
    alt: Rävens skelett med kontroller för ben och svans.
utvald: true
---

Det började med en fråga från studion: hur får man en räv att kännas snabb på en skärm som är mindre än en handflata?

Jag testade först en realistisk springcykel, men på telefonen blev benen till en grå suddighet. Lösningen blev att överdriva svansen. Den rör sig långsammare än kroppen och syns tydligt även när räven är liten.

## Det jag lärde mig

Ibland är det detaljen som inte rör sig som gör att resten ser snabb ut.
```

Fälten förklaras längre ner på sidan.

## Steg 4. Engelsk text, om du vill

Skapa `index.en.md` i samma mapp. Den innehåller bara texterna. Allt annat hämtas från den svenska filen. Finns ingen engelsk fil visas den svenska texten på den engelska sidan, med en kort notis.

```markdown
---
titel: The fox in the snow
beskrivning: A rigged fox for a mobile game, with a run cycle that holds up on small screens.
omslagAlt: An orange low-poly fox running through snow in blue evening light.
modellAlt: The fox in 3D, which you can rotate and zoom.
alt:
  02-skiss.jpg: Pencil sketch of the fox in three poses.
  03-rigg.jpg: The fox skeleton with controls for legs and tail.
bildtext:
  02-skiss.jpg: The first poses.
---

It started with a question from the studio...
```

## Steg 5. Gör visningsversioner av modell och film

Det här steget behövs bara om projektet har en 3D-modell eller en film. Öppna en terminal i sajtens mapp och kör:

```bash
npm run media -- raven-i-snon
```

Skriptet komprimerar modellen, förenklar den om den är för tung, gör en webbversion av filmen och tar fram en posterbild till var och en. Så här ser det ut:

```text
Media: optimerar 3D-modeller och filmer

3D-modell: raven-i-snon/raven.glb
  Förenklar nätet: 184 220 trianglar, mål 100 000 (kvot 0.54)
  Storlek: 24,80 MB -> 4,12 MB
  Trianglar: 184 220 -> 99 870
  Renderar posterbild ...
  Skrev src/content/projekt/raven-i-snon/raven.poster.webp

Film: raven-i-snon/springer.mp4
  Storlek: 61,30 MB -> 6,85 MB (utan ljud)
  Skrev src/content/projekt/raven-i-snon/springer.poster.webp

=== Sammanfattning ===
3D   raven-i-snon/raven.glb: 24,80 -> 4,12 MB, 184 220 -> 99 870 trianglar
Film raven-i-snon/springer.mp4: 61,30 -> 6,85 MB
Varningar: 0, fel: 0
Klart.
```

Efteråt finns visningsversionerna här:

```text
public/modeller/raven-i-snon/raven.glb
public/film/raven-i-snon/springer.mp4
src/content/projekt/raven-i-snon/raven.poster.webp
src/content/projekt/raven-i-snon/springer.poster.webp
```

Blir något för tungt får du en varning, men skriptet fortsätter:

```text
  VARNING: raven-i-snon/raven.glb är 9,40 MB (över 8 MB). Det kan bli för tungt för mobiler, särskilt iPhone.
  VARNING: raven-i-snon/springer.mp4 är 23,10 MB (över 20 MB). Korta filmen, sänk upplösningen eller lägg den på Cloudflare Stream eller Bunny Stream.
```

Saknas en fil som står i `index.md` stannar skriptet med ett fel som säger vad du ska göra:

```text
  FEL: Hittar inte originalmodellen src/content/projekt/raven-i-snon/raven.glb. Lägg filen i projektmappen eller ta bort raden "modell" i index.md.
```

Kör du `npm run media` utan projektnamn går skriptet igenom alla projekt och hoppar över det som redan är klart. Med `npm run media -- --tvinga` görs allt om. Skriptet behöver ffmpeg för film och Playwright för modellernas posterbilder. Saknas något av dem står det i felmeddelandet hur du installerar det.

## Steg 6. Förhandsgranska

```bash
npm run dev
```

Terminalen visar en adress, oftast `http://localhost:4321/`. Öppna projektet direkt på `http://localhost:4321/sv/spel/raven-i-snon/`, eller den engelska sidan på `http://localhost:4321/spel/raven-i-snon/`. Projektet syns också i sitt spår, och på startsidan om det har `utvald: true`. Titta gärna i ett smalt fönster också, eller på telefonen.

Sidan uppdateras av sig själv när du sparar en ändring. Avsluta med Ctrl+C i terminalen.

## Steg 7. Om något blir fel

Saknas ett fält eller är något felstavat visar förhandsgranskningen ett meddelande. Första raden är på engelska och säger vilket projekt det gäller. Raderna under är på svenska och säger vilket fält som är fel och hur det ska se ut. Har du till exempel skrivit `spar: spell` och glömt `omslagAlt` ser det ut så här:

```text
[InvalidContentEntryDataError] projekt → raven-i-snon data does not match collection schema.

  spar: Spåret "spell" finns inte. Välj ett av "industri", "spel", "kawaii". Spåren ändras i src/config/sajt.ts.
  omslagAlt: Fältet "omslagAlt" saknas. Lägg till en rad som till exempel:  omslagAlt: Ventilhuset i genomskärning med flödet markerat i rött.
```

Skriver du årtalet med citattecken, `ar: "2026"`, står det:

```text
  ar: Fältet "ar" ska vara ett årtal utan citattecken, till exempel:  ar: 2026
```

Det som står under felet, som Hint och Stack trace, kan du hoppa över. Rätta och spara, så fortsätter förhandsgranskningen av sig själv.

## Steg 8. Publicera

När allt ser bra ut sparar du med git och skickar upp ändringen. Ta med visningsversionerna från steg 5 om projektet har modell eller film.

```bash
git add src/content/projekt/raven-i-snon public/modeller/raven-i-snon public/film/raven-i-snon
git commit -m "Nytt projekt: Räven i snön"
git push
```

Sajten byggs och publiceras av sig själv inom ett par minuter. Om bygget stoppas finns samma svenska felmeddelande som i steg 7 i byggloggen, och den gamla versionen av sajten ligger kvar tills felet är rättat.

## Ändra, dölja eller ta bort

Ändra text genom att redigera `index.md` och publicera igen. Byt en bild genom att ersätta filen med en ny med samma namn. Byter du modell eller film kör du `npm run media` igen för det projektet.

Vill du dölja ett projekt utan att ta bort det skriver du `utkast: true`. Då syns det i förhandsgranskningen men inte på den publicerade sajten. Ta bort ett projekt genom att radera dess mapp, och dess mappar i `public/modeller` och `public/film` om de finns, och publicera.

## Fälten

`titel`, `spar`, `ar`, `beskrivning`, `omslag` och `omslagAlt` måste finnas. Resten är valfritt.

`spar` är spåret projektet hör till. Det måste vara ett av spåren i `src/config/sajt.ts`, just nu `industri`, `spel` eller `kawaii`.

`ar` skrivs som en siffra utan citattecken.

`beskrivning` är en kort mening som visas på projektkortet, högst 220 tecken.

`omslagAlt` och `alt` beskriver bilden för den som inte ser den. Skriv vad bilden faktiskt visar, inte vad den betyder.

`modell` är en `.glb`-fil. Över ungefär 8 MB eller 100 000 trianglar varnar `npm run media`, eftersom modellen då kan bli för tung för mobiler.

`filmTyp` är `loop` för korta tysta slingor eller `visning` för längre filmer med ljud och kontroller. Filmen kan också vara en https-adress från Cloudflare Stream eller Bunny Stream.

`bilder` bestämmer ordningen, alt-texterna och bildtexterna. Bilder som inte står i listan visas efteråt i bokstavsordning.

`utvald: true` visar projektet på startsidan.

`utkast: true` döljer projektet på den publicerade sajten men visar det i förhandsgranskningen.

Allt under den andra raden med tre bindestreck är berättelsen. Skriv den som vanlig text. En tom rad ger ett nytt stycke och `## ` ger en mellanrubrik.

## Spåren

Spåren ändras i `src/config/sajt.ts`. Där kan du byta namn, ändra ordning, ta bort ett spår eller lägga till ett nytt som använder ett av de tre temana. Där finns också kontaktuppgifterna. Ett tomt fält visas inte.
