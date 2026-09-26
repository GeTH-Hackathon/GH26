// Fixed locale so SSR and every browser render "51,461" identically.
export const fmt = (n: number): string => n.toLocaleString('en-US');
