import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// Overridden in CI so forks and renamed repos deploy correctly.
const url = process.env.SITE_URL ?? 'https://geth-hackathon.github.io';
const baseUrl = process.env.BASE_URL ?? '/GH26/';

const config: Config = {
  title: 'GeTH Hackathon 2027',
  tagline: 'Unlocking 50,000 Thai genomes for national precision medicine.',
  favicon: 'img/favicon.svg',
  future: {v4: true},
  url,
  baseUrl,
  trailingSlash: true,
  organizationName: 'GeTH-Hackathon',
  projectName: 'GH26',
  onBrokenLinks: 'throw',
  i18n: {defaultLocale: 'en', locales: ['en']},
  headTags: [
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.googleapis.com'}},
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous'}},
  ],
  stylesheets: ['https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&display=swap'],
  presets: [
    [
      'classic',
      {
        docs: false,
        blog: false,
        theme: {customCss: './src/css/custom.css'},
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    colorMode: {defaultMode: 'light', disableSwitch: true, respectPrefersColorScheme: false},
    navbar: {
      title: 'geth.',
      items: [
        {to: '/#objectives', label: 'Objectives', position: 'left'},
        {to: '/#data', label: 'Data', position: 'left'},
        {to: '/#dates', label: 'Dates & Venue', position: 'left'},
        {to: '/#schedule', label: 'Schedule', position: 'left'},
        {to: '/#organizers', label: 'Organizers', position: 'left'},
        {to: '/#apply', label: 'Apply', position: 'right', className: 'navbar-apply'},
      ],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
