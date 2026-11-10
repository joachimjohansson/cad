# Vicky Variety

Portfolio för Vicky Variety, illustratör och 3D-formgivare. Byggd med Astro och publicerad på Cloudflare Pages.

## Kom igång

Du behöver Node.js 24 (se `.nvmrc`). Har du `nvm` räcker `nvm use`.

```bash
npm install
```

```bash
npm run dev
```

Öppna sedan adressen som visas, oftast http://localhost:4321.

## Kommandon

`npm run dev` startar en förhandsgranskning som uppdateras medan du arbetar.

`npm run media` komprimerar 3D-modeller och filmer i projektmapparna och skapar posterbilder. Det kräver ffmpeg och Playwright lokalt och körs innan du committar ett projekt med modell eller film.

`npm run build` bygger sajten till `dist/`.

`npm run preview` visar den byggda sajten.

## Var saker finns

`INSTRUKTION.md` beskriver hur man lägger till ett projekt.

`docs/PUBLICERING.md` beskriver publicering, domän och skydd mot AI-insamling.

`src/config/sajt.ts` innehåller spåren och kontaktuppgifterna.

`src/content/projekt/` innehåller ett projekt per mapp.

`src/styles/tokens.css` innehåller temana. `src/styles/signatur.css` innehåller varje temas signaturelement.

`.claude/skills/nytt-projekt/` innehåller skillen som låter Claude lägga till ett projekt från en mapp med bilder.

## Temasystemet

All struktur är gemensam. Ett spår är ett tema som sätts med `data-spar` på `<html>` och bara byter design-tokens: färg, typsnitt, hörnradie, linjer och rörelse. Varje tema har ett signaturelement. För Industri är det måttlinjer och rutnät, för Spel glöd och klippta kanter och för Kawaii handritade understrykningar och blobbar. Byte mellan spår animeras med View Transitions i webbläsare som stöder det.
