// Pure, dependency-free so node:test can import it directly (Node strips the types).
export type SearchableProject = {id: string; type: string; group: string; name: string; wgs: number};

// Case-insensitive; every whitespace-separated word must appear in id, type, group or name.
export function filterProjects<T extends SearchableProject>(projects: T[], query: string): T[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return projects;
  return projects.filter((p) => {
    const haystack = `${p.id} ${p.type} ${p.group} ${p.name}`.toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}
