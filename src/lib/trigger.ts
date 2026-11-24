// src/lib/trigger.ts
/**
 * Simple keyword‑based detection of CBT vs ERP mode.
 * Returns 'cbt' if CBT‑related words are found, 'erp' if ERP‑related words are found,
 * otherwise undefined.
 */
export function detectModeFromText(text: string): 'cbt' | 'erp' | undefined {
  const lower = text.toLowerCase();
  const cbtKeywords = ['anxiety', 'panic', 'stress', 'worry', 'fear', 'overwhelm', 'obsess', 'ruminate'];
  const erpKeywords = ['contamination', 'wash', 'clean', 'germ', 'ritual', 'checking', 'order', 'symmetry'];

  const hasCbt = cbtKeywords.some(k => lower.includes(k));
  const hasErp = erpKeywords.some(k => lower.includes(k));

  if (hasCbt && !hasErp) return 'cbt';
  if (hasErp && !hasCbt) return 'erp';
  return undefined;
}
