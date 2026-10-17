// Source: genitus-midpoint-terminal -- shared helpers used by every backtest script in
// the 11-strategy sweep (Golden Cross, Value, Magic Formula, Piotroski, Composite-Score, ...).
//
// The one rule that makes a backtest trustworthy instead of make-believe: every signal is
// computed using ONLY data available at time T, and the forward return is measured STRICTLY
// after T. These two helpers enforce that mechanically, so it can't be violated by accident
// in any of the strategy scripts that call them.

function priceNear(priceData, sym, dateStr) {
  const series = priceData[sym]?.series;
  if (!series) return null;
  const target = new Date(dateStr).getTime();
  let best = null, bestDiff = Infinity;
  for (const r of series) {
    const diff = Math.abs(new Date(r[0]).getTime() - target);
    if (diff < bestDiff) { bestDiff = diff; best = r; }
  }
  // within 30 days only -- a looser match would silently pair a fiscal-year date with a
  // price from the wrong period and corrupt every downstream ratio (P/E, P/B, EV/EBITDA).
  return bestDiff < 30 * 86400000 ? best : null;
}

function fwdReturn(priceData, sym, fromDate, weeksFwd) {
  const series = priceData[sym]?.series;
  if (!series) return null;
  const fromTarget = new Date(fromDate).getTime();
  let fromIdx = -1, bestDiff = Infinity;
  series.forEach((r, i) => {
    const diff = Math.abs(new Date(r[0]).getTime() - fromTarget);
    if (diff < bestDiff) { bestDiff = diff; fromIdx = i; }
  });
  if (fromIdx < 0 || bestDiff > 30 * 86400000) return null;
  const toIdx = fromIdx + weeksFwd; // STRICTLY forward from fromIdx, never backward
  if (toIdx >= series.length) return null; // no peeking past the end of real data either
  return (series[toIdx][2] / series[fromIdx][2] - 1) * 100; // dividend-adjusted close, see 01-*.js
}

module.exports = { priceNear, fwdReturn };
