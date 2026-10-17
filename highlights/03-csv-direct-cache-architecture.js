// Source: genitus-ticker-terminal (BIG_TICKET.html)
// Context: a performance decision. Instead of calling a dividend/yield API per symbol
// (slow, rate-limited, costs money at scale), this terminal reads a single pre-scanned
// CSV (233k symbols / 83 exchanges, built once by a background pipeline, refreshed on a
// schedule) directly via a raw.githubusercontent.com URL. Zero extra API calls for the
// entire dividend/yield/streak feature set -- one static file fetch, parsed client-side.

const TICKER_CACHE_URL = 'https://raw.githubusercontent.com/Babybounce500/genitus-ticker-cache/main/ticker-cache.csv';

// 61k+ confirmed/historical dividend payers across all 83 exchanges, pre-scanned
// by background agents. Loaded once from the same genitus-ticker-cache repo as
// the base ticker list above -- zero extra API calls, just one more static CSV.
const DIV_SUMMARY_URL = 'https://raw.githubusercontent.com/Babybounce500/genitus-ticker-cache/main/dividend-summary.csv';
const DIV_CACHE_ASOF = '2026-10-07'; // date of the last batch re-scan -- update whenever dividend-summary.csv is regenerated
const DIV_STREAK_ASOF_YEAR = 2025;   // last complete calendar year counted in StreakYears (scan excludes the year it ran in, even partially) -- bump alongside DIV_CACHE_ASOF

let dividendCacheMap = null;     // Map<fullSymbol, {yieldPct,yieldUnreliable,cachedPrice,streakYears,streakDirection,paymentCount,lastDate,lastAmount,lastCurrency}>
let dividendCacheLoading = null;

function loadDividendCache() {
  if (dividendCacheLoading) return dividendCacheLoading; // in-flight de-dupe, never fetch twice
  dividendCacheLoading = fetch(DIV_SUMMARY_URL)
    .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.text(); })
    .then(text => {
      const lines = text.split('\n').filter(Boolean);
      const map = new Map();
      for (let i = 1; i < lines.length; i++) { // skip header row
        const [fullSymbol, , , , count, streakYears, streakDir, cachedYield, cachedPrice, lastDate, lastAmount, lastCurrency] = parseCSVLine(lines[i]);
        if (!fullSymbol) continue;
        const yieldPct = parseFloat(cachedYield) || 0;
        // >50% is almost always a stale-price or FX-mismatch artifact (trailing dividend
        // sum / a cached closing price that's now days-to-weeks old), not a real yield --
        // flagged as unreliable rather than silently shown as 0.00%, which would wrongly
        // imply "doesn't pay a dividend" when payment history clearly exists.
        map.set(fullSymbol, {
          yieldPct: yieldPct > 50 ? 0 : yieldPct, yieldUnreliable: yieldPct > 50,
          cachedPrice: cachedPrice ? parseFloat(cachedPrice) : null,
          streakYears: parseInt(streakYears) || 1, streakDirection: streakDir || 'new',
          paymentCount: parseInt(count) || 0, lastDate: lastDate || '',
          lastAmount: parseFloat(lastAmount) || 0, lastCurrency: lastCurrency || '',
        });
      }
      dividendCacheMap = map;
      console.log(`Dividend cache: ${lines.length - 1} payers (${map.size} unique symbols)`);
      return map;
    })
    .catch(e => {
      console.warn('Dividend cache unavailable:', e.message);
      dividendCacheMap = new Map(); // graceful degradation -- table still renders without yield/streak columns
      return dividendCacheMap;
    });
  return dividendCacheLoading;
}

module.exports = { loadDividendCache };
