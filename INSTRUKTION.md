# Så lägger du till ett projekt

Du behöver inte röra någon kod. Ett projekt är en mapp med bilder och en textfil.

## Det enklaste sättet

Be Claude: "Lägg till ett projekt från mappen Skrivbord/Nytt projekt. Det är en riggad räv för ett mobilspel från 2026." Claude använder då skillen `nytt-projekt`, som skapar textfilen, optimerar bilder, modeller och film och visar en förhandsgranskning innan något publiceras.

## Att göra det själv

1. Skapa en ny mapp i `src/content/projekt/`. Mappens namn blir projektets adress, så använd små bokstäver och bindestreck, till exempel `raven-i-snon`.
2. Lägg bilderna i mappen. Döp omslagsbilden till `omslag.jpg`. De andra bilderna visas i bokstavsordning, så det är praktiskt att börja namnen med siffror, till exempel `02-skiss.jpg` och `03-fardig.jpg`.
3. Har du en 3D-modell eller en film, lägg den också i mappen, till exempel `raven.glb` eller `springer.mp4`. Originalen laddas aldrig upp. Kör `npm run media` så görs en lättare visningsversion och en posterbild.
4. Skapa filen `index.md` i mappen. Utgå från exemplet nedan.
5. Vill du ha engelsk text, skapa också `index.en.md`. Annars visas den svenska texten på den engelska sidan med en kort notis.
6. Kör `npm run dev` och öppna adressen som visas för att se resultatet. När allt ser bra ut sparar du med git och pushar. Sajten publiceras av sig själv.

## Exempel

Mappen `src/content/projekt/raven-i-snon/` innehåller

```
index.md
index.en.md
omslag.jpg
02-skiss.jpg
03-rigg.jpg
raven.glb
springer.mp4
```

och `index.md` ser ut så här:

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

`index.en.md` innehåller bara texterna:

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

## Fälten

`titel`, `spar`, `ar`, `beskrivning`, `omslag` och `omslagAlt` måste finnas. Resten är valfritt.

`spar` är spåret projektet hör till. Det måste vara ett av spåren i `src/config/sajt.ts`, just nu `industri`, `spel` eller `kawaii`.

`ar` skrivs som en siffra utan citattecken.

`omslagAlt` och `alt` beskriver bilden för den som inte ser den. Skriv vad bilden faktiskt visar, inte vad den betyder.

`modell` är en `.glb`-fil. Över ungefär 8 MB eller 100 000 trianglar varnar `npm run media`, eftersom modellen då kan bli för tung för mobiler.

`filmTyp` är `loop` för korta tysta slingor eller `visning` för längre filmer med ljud och kontroller. Filmen kan också vara en adress från Cloudflare Stream eller Bunny Stream.

`bilder` bestämmer ordningen och alt-texterna. Bilder som inte står i listan visas efteråt i bokstavsordning.

`utvald: true` visar projektet på startsidan.

`utkast: true` döljer projektet på den publicerade sajten men visar det när du kör `npm run dev`.

Allt under den andra raden med tre bindestreck är berättelsen. Skriv den som vanlig text. En tom rad ger ett nytt stycke och `## ` ger en mellanrubrik.

## Om något blir fel

Saknas ett fält eller är något felstavat stannar bygget med ett meddelande på svenska som säger vilket projekt och vilket fält det gäller, och hur det ska se ut. Rätta och spara, så fortsätter förhandsgranskningen av sig själv.

## Spåren

Spåren ändras i `src/config/sajt.ts`. Där kan du byta namn, ändra ordning, ta bort ett spår eller lägga till ett nytt som använder ett av de tre temana. Där finns också kontaktuppgifterna. Ett tomt fält visas inte.
