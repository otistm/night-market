const ROMANS = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV',
] as const;

export function romans(n: number): string {
  return ROMANS[n - 1] ?? String(n);
}
