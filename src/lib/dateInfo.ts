export function currentDateInfo(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formatted = now.toLocaleDateString(undefined, options);
  return `[CURRENT DATE: ${formatted}]`;
}
