// Single source of editable event facts. Resolve a TBA by editing this file only.

export type ImportantDate = {label: string; date: string; exact: boolean};
export type ExternalLink = {label: string; href: string; note: string};
export type PartnerRole = 'Organizer' | 'Supported by' | 'Data partner';
export type Partner = {role: PartnerRole; name: string; href: string | null; logo: string | null};
export type DataType = {name: string; description: string};

export type EventInfo = {
  name: string;
  tagline: string;
  statusLine: string;
  dateRange: string;
  dateNote: string;
  venue: {name: string | null; city: string; country: string; airport: string};
  formUrl: string | null;
  applyOpensLabel: string;
  seatsLabel: string;
  contactEmail: string | null;
  copyright: string;
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
  tagline: 'Unlocking 50,000 Thai genomes for national precision medicine.',
  statusLine: 'FEB 7–12 2027 \\ CHIANG MAI \\ 50K GENOMES',
  dateRange: '7–12 February 2027',
  dateNote: 'Sunday afternoon to Friday morning. Six days on site.',
  venue: {
    name: null,
    city: 'Chiang Mai',
    country: 'Thailand',
    airport: 'Chiang Mai International Airport (CNX)',
  },
  formUrl: null,
  applyOpensLabel: 'Applications open November 2026',
  seatsLabel: 'About 50 seats',
  contactEmail: null,
  copyright: '© 2026 Faculty of Medicine, Chiang Mai University',
  objectives: [
    "Build a research community able to analyse Thailand's first 50,000 genomes.",
    'Stress-test a secure, no-download Trusted Research Environment at population scale.',
    'Produce a national Genomic Landscape Report and a prototype genomic and population dashboard.',
  ],
  audience: ['Researchers', 'Bioinformaticians', 'Clinicians', 'Data scientists'],
  criteria: [
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
