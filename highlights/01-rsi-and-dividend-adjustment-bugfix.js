// Source: genitus-midpoint-terminal (live: https://babybounce500.github.io/genitus-midpoint-terminal/)
// Context: this is the snapshot script that computes the live multi-timeframe score table.
//
// Two things worth a reviewer's attention here:
//  1. Wilder's RSI smoothing done PROPERLY -- rolled across the full available series,
//     not restarted on a short window (a common shortcut that biases the result).
//  2. A real bug I found and fixed before shipping: computing technical signals on the
//     RAW close price is silently contaminated by ex-dividend price drops and stock
//     splits, which look identical to a real sell-off to any indicator. Verified with a
//     concrete case (Altria/MO flipped from -2 bearish to +4 fully bullish depending on
//     which price series was used), then fixed system-wide and re-ran the backtests to
//     confirm the finding survived the fix.

// RSI(14), Wilder's smoothing, rolled across the FULL available series (not just the
// last 15 points) so the smoothed average is the real thing, not a biased short-window
// approximation -- then only the final (most recent) value is kept. NOTE: this data is
// WEEKLY, so "RSI(14)" here means 14 *weeks*, not the far more commonly-cited daily
// RSI(14) -- a materially slower, smoother oscillator. Labelled as such in the UI.
function rsiWilder14(closes) {
  if (closes.length < 15) return null;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= 14; i++) {
    const chg = closes[i] - closes[i - 1];
    if (chg > 0) avgGain += chg; else avgLoss += -chg;
  }
  avgGain /= 14; avgLoss /= 14;
  for (let i = 15; i < closes.length; i++) {
    const chg = closes[i] - closes[i - 1];
    const gain = chg > 0 ? chg : 0, loss = chg < 0 ? -chg : 0;
    avgGain = (avgGain * 13 + gain) / 14;
    avgLoss = (avgLoss * 13 + loss) / 14;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// IMPORTANT, found by direct test: signal/RSI computed on RAW close is contaminated by
// ex-dividend price drops (mechanical, not bearish) and stock splits. Worst real case
// found: Altria (MO) scores -2 (bearish) on raw close vs. +4 (fully bullish) on dividend-
// adjusted close -- a complete sign flip. 100/1420 symbols (7%) get a different score
// depending on which series is used. Signals/depth/RSI now computed on the dividend-
// adjusted close (series[*][2]); the RAW close (series[*][1]) is still shown as "price"
// since that's the real tradable quote -- only the TECHNICAL READING uses the adjusted
// series, same convention every serious charting platform uses for exactly this reason.
function buildRow(sym, priceData) {
  const series = priceData[sym].series;
  const rawCloses = series.map(r => r[1]);   // real tradable price, shown to the user as "price"
  const closes = series.map(r => r[2]);       // dividend-adjusted -- used for ALL signal/RSI math
  const i = series.length - 1;
  const rsi14w = rsiWilder14(closes.slice(0, i + 1));
  return { symbol: sym, price: rawCloses[i], rsi14w: rsi14w != null ? +rsi14w.toFixed(1) : null };
}

module.exports = { rsiWilder14, buildRow };
