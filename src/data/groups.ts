// 'ink' follows the theme via CSS; on the always-dark Data panel it is drawn white.
const INK = 'var(--ink)';
const PAPER = '#ffffff';

// One tint per disease group, drawn from accent / ink / mute.
export const groupColors: Record<string, string> = {
  'Rare Diseases': '#ff4a1c',
  NCD: INK,
  Cancer: '#9a9a9a',
  Pharmacogenomics: '#ff9a7f',
  'Infectious Diseases': '#4d4d4d',
  Popgen: '#ffc8b8',
  'Non-Rare & Non-Cancer': '#cfcfcf',
};

export function groupColor(group: string, onDark = false): string {
  const c = groupColors[group] ?? '#9a9a9a';
  return onDark && c === INK ? PAPER : c;
}
