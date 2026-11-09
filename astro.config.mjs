// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://vickyvariety.com',
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
      i18n: { defaultLocale: 'en', locales: { en: 'en', sv: 'sv-SE' } },
    }),
  ],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
