import useBrokenLinks from '@docusaurus/useBrokenLinks';

// Registers a section id with Docusaurus' broken-anchor checker (onBrokenAnchors: 'throw').
export function useAnchor(id: string): string {
  useBrokenLinks().collectAnchor(id);
  return id;
}
