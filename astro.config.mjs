// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // SITE och BASE sätts av GitHub Pages-bygget. Utan dem byggs sajten för den riktiga domänen.
  site: process.env.SITE ?? 'https://vickyvariety.com',
  base: process.env.BASE ?? '/',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'sv'],
    routing: { prefixDefaultLocale: false },
  },
  image: {
    // Egen bildtjänst: begränsad upplösning, vattenstämpel och upphovsrätt i metadata.
    service: { entrypoint: './src/lib/bildtjanst.ts' },
  },
  integrations: [
    sitemap({
      // Instruktionen nås bara via direktlänk.
      filter: (sida) => !sida.includes('/instruktion/'),
      i18n: { defaultLocale: 'en', locales: { en: 'en', sv: 'sv-SE' } },
    }),
  ],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
