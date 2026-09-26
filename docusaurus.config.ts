import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// Served from the custom domain gh27.bat.or.th (GitHub Pages; geth-hackathon.github.io/GH27/ redirects here).
// Override with SITE_URL / BASE_URL to build for another host or sub-path.
const url = process.env.SITE_URL ?? 'https://gh27.bat.or.th';
const baseUrl = process.env.BASE_URL ?? '/';

const config: Config = {
  title: 'GeTH Hackathon 2027',
  tagline: 'Unlocking 50,000 Thai genomes for national precision medicine.',
  favicon: 'img/favicon.svg',
  future: {v4: true},
  url,
  baseUrl,
  trailingSlash: true,
  organizationName: 'GeTH-Hackathon',
  projectName: 'GH27',
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  i18n: {defaultLocale: 'en', locales: ['en']},
  headTags: [
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.googleapis.com'}},
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous'}},
    {
      // Hides the hero parts only while its intro is about to run; removed by the intro, or after 1.5s regardless.
      tagName: 'script',
      attributes: {},
      innerHTML:
        "(function(){try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){var d=document.documentElement;d.setAttribute('data-motion-intro','');setTimeout(function(){d.removeAttribute('data-motion-intro')},1500)}}catch(e){}})();",
    },
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
    // Light by default for every visitor; the navbar toggle switches to dark and remembers the choice.
    colorMode: {defaultMode: 'light', disableSwitch: false, respectPrefersColorScheme: false},
    navbar: {
      title: 'GeTH Hackathon',
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
