// Single source of editable event facts. Resolve a TBA by editing this file only.

export type ImportantDate = {label: string; date: string; exact: boolean};
export type ExternalLink = {label: string; href: string; note: string};
export type PartnerRole = 'Organizer' | 'Supported by' | 'Data partner';
export type Partner = {role: PartnerRole; name: string; href: string | null; logo: string | null};
export type DataType = {name: string; description: string};

export type EventInfo = {
  name: string;
  brand: string;
  tagline: string;
  statusLine: string;
  dateRange: string;
  dateNote: string;
  venue: {name: string | null; city: string; country: string; airport: string};
  formUrl: string | null;
  applyOpensLabel: string;
  seatsLabel: string;
  eligibility: string;
  contactEmail: string | null;
  copyright: string;
  objectivesIntro: string[];
  objectives: string[];
  audience: string[];
  criteria: string[];
  accessNote: string;
  dataNote: string;
  dataPortal: ExternalLink;
  dataTypes: DataType[];
  importantDates: ImportantDate[];
  partners: Partner[];
  links: ExternalLink[];
};

const dataPortal: ExternalLink = {
  label: 'data.genomicsthailand.com',
  href: 'https://data.genomicsthailand.com',
  note: 'Genomics Thailand data portal',
};

export const event: EventInfo = {
  name: 'GeTH Hackathon 2027',
  brand: 'GeTH Hackathon',
  tagline: '50,000 Thai genomes. Six days in Chiang Mai. Real clinical questions.',
  statusLine: 'FEB 7–12 2027 \\ CHIANG MAI \\ 50K GENOMES',
  dateRange: '7–12 February 2027',
  dateNote: 'Sunday afternoon to Friday morning. Six days on site.',
  venue: {
    name: null,
    city: 'Chiang Mai',
    country: 'Thailand',
    airport: 'Chiang Mai International Airport (CNX)',
  },
  formUrl: 'https://forms.gle/f76Bmzxu144CktoC6',
  applyOpensLabel: 'Applications open November 2026',
  seatsLabel: 'About 50 seats',
  eligibility: 'Open to Thai nationals only, because the hackathon works with sensitive national health data.',
  contactEmail: null,
  copyright: '© 2026 Faculty of Medicine, Chiang Mai University',
  objectivesIntro: [
    'The Genomics Thailand (GeTH) Hackathon brings bioinformaticians, clinicians and data scientists together around 50,000 whole genomes from the Genomics Thailand programme. We hack on questions that matter at the bedside and in the lab: why diseases present differently in Thai and Southeast Asian populations, which variants change how patients respond to drugs, and how families with rare diseases can reach a diagnosis sooner.',
    'We also want to explore how reproducible workflows, standard ontologies and AI, including large language models, can turn variant calls into interpretable, clinically meaningful knowledge. All analysis happens inside a Trusted Research Environment: participants analyse in place and share only aggregate results. Through collaborative, hands-on hacking, we aim to incubate ideas and solutions that move genomic medicine in Thailand forward.',
  ],
  objectives: [
    'Tackle real clinical and biological questions with Thai genomic data: disease risk, rare-disease diagnosis, pharmacogenomics and population health.',
    'Characterise the genetic diversity of the Thai population and how it differs from global reference panels.',
    'Build reusable tools and reproducible workflows for population-scale analysis inside a Trusted Research Environment.',
    'Explore how AI and large language models can help interpret variants and link genomic findings to clinical knowledge.',
    'Grow a lasting community of Thai researchers, clinicians and data scientists working with national genomic data.',
  ],
  audience: ['Researchers', 'Bioinformaticians', 'Clinicians', 'Data scientists'],
  criteria: [
    'Thai nationality (required)',
    'Technical skill in genomic or data analysis',
    'Experience with genomics data',
    'Affiliation with a non-profit organisation',
    'Ability to comply with data-security requirements',
  ],
  accessNote:
    'Accepted participants sign a non-disclosure agreement and a data-use agreement before they receive access to the Trusted Research Environment.',
  dataNote:
    "Pseudonymised. Analysed in place inside NSTDA's Secure Data Environment. No download; only aggregate results leave through an airlock review.",
  dataPortal,
  dataTypes: [
    {name: 'VCF', description: 'Variant Call Format files of small variants (SNVs and indels).'},
    {name: 'PLINK', description: 'Genotypes in PLINK binary format for population-genetic and association analysis.'},
    {name: 'HLA', description: 'HLA allele calls for immunogenetics and drug-hypersensitivity research.'},
    {name: 'CYP', description: 'Cytochrome P450 (CYP) star-allele calls for pharmacogenomics.'},
    {name: 'Structural variants', description: 'Larger genomic rearrangements such as deletions and duplications.'},
    {name: 'Demographics', description: 'Basic pseudonymised metadata such as age, sex, region and disease group.'},
  ],
  importantDates: [
    {label: 'Applications open', date: 'November 2026', exact: false},
    {label: 'Application deadline', date: 'December 2026', exact: false},
    {label: 'Participants announced', date: 'January 2027', exact: false},
    {label: 'Hackathon', date: '7–12 February 2027', exact: true},
  ],
  partners: [
    {role: 'Organizer', name: 'Faculty of Medicine, Chiang Mai University', href: 'https://www.med.cmu.ac.th', logo: null},
    {role: 'Supported by', name: 'Health Systems Research Institute (HSRI)', href: 'https://www.hsri.or.th', logo: null},
    {role: 'Data partner', name: 'National Science and Technology Development Agency (NSTDA)', href: 'https://www.nstda.or.th', logo: null},
    {role: 'Data partner', name: 'Genomics Thailand', href: 'https://data.genomicsthailand.com', logo: null},
  ],
  links: [
    dataPortal,
    {label: 'BioHackathon 2026', href: 'https://2026.biohackathon.org', note: 'The DBCLS event that inspired ours'},
  ],
};
