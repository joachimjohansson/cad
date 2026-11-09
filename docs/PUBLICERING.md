# Publicering och skydd

Sajten publiceras på Cloudflare Pages. Varje push till grenen `main` bygger och publicerar sajten automatiskt.

## Vad skyddet klarar och inte klarar

Allt som visas i en webbläsare går att spara. En bild som syns på skärmen har redan laddats ner, och en 3D-modell som går att rotera ligger redan i besökarens dator. Därför går det inte att hindra en enskild person som verkligen vill kopiera något. Målet är i stället att göra massinsamling och AI-träning svår, dyr och tydligt otillåten.

Sajten gör så här:

Bilderna publiceras som högst 1 800 pixlar på längsta sidan. Från 600 pixlars bredd får de märket som en diskret vattenstämpel i hörnet, och upphovsrätt och förbehåll skrivs in i bildernas metadata. Detta sker i byggsteget (`src/lib/bildtjanst.ts`), och originalen kopieras aldrig till den publicerade mappen.

3D-modellerna på sajten är komprimerade visningsversioner som skapas av `npm run media`. Produktionsfiler och originalmodeller ignoreras av git och hamnar varken på GitHub eller på sajten.

`robots.txt` stänger ute kända AI-botar. Varje sida skickar `tdm-reservation: 1` både som header och som metatagg, och `/.well-known/tdmrep.json` innehåller förbehållet enligt EU:s DSM-direktiv 2019/790 artikel 4. Dessutom finns metataggarna `noai` och `noimageai`.

Högerklick blockeras inte och inga osynliga lager läggs över bilderna. Sådant stör riktiga besökare men stoppar ingen.

## Gör repot privat först

Repot `joachimjohansson/cad` är just nu publikt. Då kan vem som helst ladda ner originalbilderna i full upplösning direkt från GitHub, och då hjälper begränsningen på sajten inte. Gör så här:

1. Öppna repot på GitHub och gå till Settings.
2. Längst ner under Danger Zone väljer du Change visibility och sedan Make private.

Cloudflare Pages fungerar lika bra med privata repon.

## Koppla Cloudflare Pages

1. Logga in på Cloudflare och gå till Workers & Pages. Välj Create, sedan Pages och Connect to Git.
2. Välj repot `joachimjohansson/cad` och grenen `main`.
3. Under Build settings väljer du Framework preset Astro. Build command är `npm run build` och Build output directory är `dist`.
4. Lägg till miljövariabeln `NODE_VERSION` med värdet `24`.
5. Spara och starta bygget. Sajten får först en adress som slutar på `.pages.dev`.

## Domänen

1. Köp domänen, till exempel `vickyvariety.com`, helst direkt hos Cloudflare Registrar. Annars flyttar du domänens namnservrar till Cloudflare.
2. I Pages-projektet går du till Custom domains och lägger till domänen och `www`-varianten.
3. Står domänen inte på `vickyvariety.com` ändrar du `site` i `astro.config.mjs`, adresserna i `public/robots.txt`, `public/_headers` och `public/.well-known/`.

## Slå på botskyddet i Cloudflare

Inställningarna gäller domänen, så de går att slå på först när domänen är kopplad.

1. Gå till domänen i Cloudflare och välj Security, sedan Bots.
2. Slå på Bot Fight Mode.
3. Slå på Block AI bots (kallas ibland Block AI Scrapers and Crawlers) och välj att det gäller hela domänen.
4. Slå på AI Labyrinth om alternativet finns. Det skickar AI-botar som struntar i robots.txt in i en labyrint av meningslösa sidor.
5. Under Manage robots.txt kan Cloudflare också lägga till sina egna AI-regler. Sajtens egen robots.txt fungerar oavsett.

Cloudflare byter ibland namn på menyerna. Hittar du inte en inställning, sök på namnet i Cloudflares hjälp.

## Film

Korta loopar och visningsfilmer ligger som egna MP4-filer i `public/film/`. Säger `npm run media` att filmerna tillsammans är över 200 MB, flytta de längre filmerna till Cloudflare Stream eller Bunny Stream. Där strömmas filmen med HLS i den kvalitet besökarens uppkoppling klarar. Skriv sedan strömningsadressen som slutar på `.m3u8` i projektets `film:`-fält.

## Kontrollera efter publicering

Öppna sajten på en riktig iPhone i Safari och gå igenom varje spår. Öppna minst en 3D-modell och en film. WebGL-minnet på iPhone tar slut tidigare än på datorn, och vissa layoutfel syns bara på telefonen. Kontrollera också att `https://<domänen>/robots.txt` och `https://<domänen>/.well-known/tdmrep.json` går att öppna.
