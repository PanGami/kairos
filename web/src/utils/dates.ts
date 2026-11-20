/** Trading-day approximation: skips weekends only (exchange holidays are not modeled). */
export function addTradingDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) left -= 1;
  }
  return d.toISOString().slice(0, 10);
}
