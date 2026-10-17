// Source: genitus-midpoint-terminal (live: https://babybounce500.github.io/genitus-midpoint-terminal/composite-score.html)
// This is the backtest behind the Composite-Score terminal: combines the 5 strongest
// validated signals from an earlier 11-strategy sweep into one equally-weighted score.
// Real output on 1,426 real symbol-year observations: best decile hit a 74.65% forward
// 12-month win rate vs. 52.70% for the worst decile -- cleaner separation than any single
// factor tested alone (e.g. Value by itself: 68.1% vs 56.4%). Full script below, unedited.

// Composite-Score backtest: combines the 5 most validated factors from this session's
// strategy sweep into one equally-weighted score and tests whether the COMBINATION
// outperforms any single factor alone.
//   Fundamental pillars (annual resolution): Piotroski F-Score, Value (P/E+P/B+EV/EBITDA), Magic Formula (EY+ROIC)
//   Technical pillars (weekly, aligned to same fiscal-year test dates): Bollinger %B, 52W-High proximity
// Resolution is capped at ANNUAL by the fundamental pillars (5 fiscal-year columns per symbol),
// same limitation disclosed for the standalone fundamental backtests.
const fs = require('fs');
const bilanz = JSON.parse(fs.readFileSync('E:/0-EVERYWHERE/dividend-cache-parts/bilanz-data.json', 'utf8'));
const priceData = JSON.parse(fs.readFileSync('E:/0-EVERYWHERE/dividend-cache-parts/price-history-data.json', 'utf8'));

function nearestIdx(sym, dateStr) {
  const series = priceData[sym]?.series;
  if (!series) return null;
  const target = new Date(dateStr).getTime();
  let bestIdx = -1, bestDiff = Infinity;
  series.forEach((r, i) => { const diff = Math.abs(new Date(r[0]).getTime() - target); if (diff < bestDiff) { bestDiff = diff; bestIdx = i; } });
  return bestDiff < 30 * 86400000 ? bestIdx : null;
}
function fwdReturn(sym, fromDate, weeksFwd) {
  const series = priceData[sym]?.series;
  if (!series) return null;
  const idx = nearestIdx(sym, fromDate);
  if (idx == null) return null;
  const toIdx = idx + weeksFwd;
  if (toIdx >= series.length) return null;
  return (series[toIdx][2] / series[idx][2] - 1) * 100;
}
function sma(arr, idx, w) { let s = 0; for (let k = idx - w + 1; k <= idx; k++) s += arr[k]; return s / w; }

const symbols = Object.keys(bilanz).filter(s => priceData[s]);
console.log('candidate symbols:', symbols.length);

const obs = [];

for (const sym of symbols) {
  const b = bilanz[sym];
  const incCols = b.income?.columns || [];
  if (incCols.length < 2) continue;
  const series = priceData[sym].series;
  const adj = series.map(r => r[2]);

  for (let c = 0; c < incCols.length - 1; c++) {
    const fyDate = incCols[c];
    const g = (statement, row, col) => { const arr = b[statement]?.rows?.[row]; return arr ? arr[col] : null; };

    // ---------- PIOTROSKI ----------
    const netIncome = g('income','Net Income', c), netIncomePrev = g('income','Net Income', c+1);
    const totalAssets = g('balance','Total Assets', c), totalAssetsPrev = g('balance','Total Assets', c+1);
    const cfo = g('cashflow','Operating Cash Flow', c);
    const longDebt = g('balance','Long Term Debt', c), longDebtPrev = g('balance','Long Term Debt', c+1);
    const currAssets = g('balance','Current Assets', c), currAssetsPrev = g('balance','Current Assets', c+1);
    const currLiab = g('balance','Current Liabilities', c), currLiabPrev = g('balance','Current Liabilities', c+1);
    const shares = g('income','Diluted Average Shares', c), sharesPrev = g('income','Diluted Average Shares', c+1);
    const grossProfit = g('income','Gross Profit', c), revenue = g('income','Total Revenue', c);
    const grossProfitPrev = g('income','Gross Profit', c+1), revenuePrev = g('income','Total Revenue', c+1);
    if ([netIncome,netIncomePrev,totalAssets,totalAssetsPrev,cfo,longDebt,longDebtPrev,currAssets,currAssetsPrev,currLiab,currLiabPrev,shares,sharesPrev,grossProfit,revenue,grossProfitPrev,revenuePrev].some(v => v==null || !isFinite(v))) continue;
    if (totalAssets<=0 || totalAssetsPrev<=0 || currLiab<=0 || currLiabPrev<=0 || revenue<=0 || revenuePrev<=0) continue;
    const roa = netIncome/totalAssets, roaPrev = netIncomePrev/totalAssetsPrev;
    const currentRatio = currAssets/currLiab, currentRatioPrev = currAssetsPrev/currLiabPrev;
    const grossMargin = grossProfit/revenue, grossMarginPrev = grossProfitPrev/revenuePrev;
    const assetTurnover = revenue/totalAssets, assetTurnoverPrev = revenuePrev/totalAssetsPrev;
    let piotroski = 0;
    if (roa>0) piotroski++; if (cfo>0) piotroski++; if (roa>roaPrev) piotroski++; if (cfo>netIncome) piotroski++;
    if (longDebt<longDebtPrev) piotroski++; if (currentRatio>currentRatioPrev) piotroski++;
    if (shares<=sharesPrev*1.01) piotroski++; if (grossMargin>grossMarginPrev) piotroski++; if (assetTurnover>assetTurnoverPrev) piotroski++;

    // ---------- VALUE + MAGIC FORMULA (need price at fyDate) ----------
    const idx = nearestIdx(sym, fyDate);
    if (idx == null || idx < 52) continue; // need 52w history for the technical pillars too
    const px = series[idx][1]; // raw close
    const eps = g('income','Diluted EPS', c);
    const bookEquity = g('balance','Stockholders Equity', c);
    const ebitda = g('income','EBITDA', c);
    const ebit = g('income','EBIT', c);
    const investedCapital = g('balance','Invested Capital', c);
    const totalDebt = g('balance','Total Debt', c), cash = g('balance','Cash And Cash Equivalents', c);
    if (!(eps>0 && bookEquity>0 && shares>0 && ebitda>0 && ebit!=null && investedCapital>0)) continue;
    const peRatio = px/eps, pbRatio = px/(bookEquity/shares);
    const marketCap = px*shares, ev = marketCap + (totalDebt||0) - (cash||0);
    const evEbitda = ev/ebitda;
    if (!(peRatio>0 && peRatio<200 && pbRatio>0 && pbRatio<50 && evEbitda>0 && evEbitda<100 && ev>0)) continue;
    const earningsYield = ebit/ev, roic = ebit/investedCapital;

    // ---------- TECHNICAL PILLARS at same date (dividend-adjusted close) ----------
    const bbMean = sma(adj, idx, 20);
    let bbSd = 0; for (let k = idx-19; k <= idx; k++) bbSd += (adj[k]-bbMean)**2; bbSd = Math.sqrt(bbSd/20);
    const bbUpper = bbMean+2*bbSd, bbLower = bbMean-2*bbSd;
    const pctB = bbSd>0 ? (adj[idx]-bbLower)/(bbUpper-bbLower) : 0.5;
    let hi52 = -Infinity; for (let k = idx-51; k <= idx; k++) if (adj[k]>hi52) hi52 = adj[k];
    const pct52wHigh = adj[idx]/hi52*100;

    const fwd = fwdReturn(sym, fyDate, 52);
    if (fwd == null) continue;

    obs.push({ symbol: sym, fyDate, piotroski, peRatio, pbRatio, evEbitda, earningsYield, roic, pctB, pct52wHigh, fwd });
  }
}

console.log('composite obs (all 5 pillars available):', obs.length);

function pctRank(arr, keyFn, ascendingIsBetter) {
  // returns Map(obs -> rank fraction in [0,1], 0 = best)
  const sorted = arr.slice().sort((a,b) => ascendingIsBetter ? keyFn(a)-keyFn(b) : keyFn(b)-keyFn(a));
  const n = sorted.length;
  const map = new Map();
  sorted.forEach((o,i) => map.set(o, n>1 ? i/(n-1) : 0));
  return map;
}

// Pillar 1: Piotroski -- higher score = better
const piotroskiRank = pctRank(obs, o=>o.piotroski, false);
// Pillar 2: Value composite (sub-rank of pe+pb+ev, lower sum = cheaper = better)
const peRank = pctRank(obs, o=>o.peRatio, true);
const pbRank = pctRank(obs, o=>o.pbRatio, true);
const evRank = pctRank(obs, o=>o.evEbitda, true);
obs.forEach(o => { o._valueSubRank = peRank.get(o)+pbRank.get(o)+evRank.get(o); });
const valueRank = pctRank(obs, o=>o._valueSubRank, true);
// Pillar 3: Magic Formula (sub-rank of EY+ROIC, higher = better)
const eyRank = pctRank(obs, o=>o.earningsYield, false);
const roicRank = pctRank(obs, o=>o.roic, false);
obs.forEach(o => { o._magicSubRank = eyRank.get(o)+roicRank.get(o); });
const magicRank = pctRank(obs, o=>o._magicSubRank, true); // sub-rank already 0=best when summed ascending sort
// Pillar 4: Bollinger %B -- lower = more oversold = better (mean-reversion edge)
const bbRank = pctRank(obs, o=>o.pctB, true);
// Pillar 5: 52W-High proximity -- higher = better (momentum edge)
const w52Rank = pctRank(obs, o=>o.pct52wHigh, false);

obs.forEach(o => {
  o.overallScore = (piotroskiRank.get(o) + valueRank.get(o) + magicRank.get(o) + bbRank.get(o) + w52Rank.get(o)) / 5;
});

function bucketByScore(arr, scoreFn, nBuckets) {
  const sorted = arr.slice().sort((a,b)=>scoreFn(a)-scoreFn(b)); // ascending score = best first
  const size = Math.floor(sorted.length/nBuckets);
  const buckets = [];
  for (let d=0;d<nBuckets;d++){ const slice = sorted.slice(d*size, d===nBuckets-1?sorted.length:(d+1)*size); buckets.push(slice.map(s=>s.fwd)); }
  return buckets.map((arr,idx) => { if(!arr.length) return null; const avg=arr.reduce((a,b)=>a+b,0)/arr.length; const variance=arr.reduce((a,b)=>a+(b-avg)**2,0)/arr.length; return {bucket:idx,n:arr.length,avg:+avg.toFixed(3),std:+Math.sqrt(variance).toFixed(3),winRate:+(arr.filter(x=>x>0).length/arr.length*100).toFixed(2)}; });
}

const deciles = bucketByScore(obs, o=>o.overallScore, 10);
console.log('COMPOSITE deciles:');
deciles.forEach(d => console.log(JSON.stringify(d)));

// comparison baseline: overall population average/winrate (unconditional)
const allFwd = obs.map(o=>o.fwd);
const baseAvg = allFwd.reduce((a,b)=>a+b,0)/allFwd.length;
const baseWin = allFwd.filter(x=>x>0).length/allFwd.length*100;
console.log('BASELINE (all obs, unconditional): avg', baseAvg.toFixed(3), 'winRate', baseWin.toFixed(2));

fs.writeFileSync('E:/0-EVERYWHERE/dividend-cache-parts/strat-composite-result.json', JSON.stringify({
  totalObs: obs.length,
  deciles,
  baseline: { avg: +baseAvg.toFixed(3), winRate: +baseWin.toFixed(2) },
  note: 'decile 0 = best overall (avg of 5 percentile ranks: Piotroski, Value P/E+P/B+EV/EBITDA, Magic Formula EY+ROIC, Bollinger %B oversold, 52W-High proximity), decile 9 = worst',
  generatedAt: new Date().toISOString(),
}, null, 1));
console.log('Saved strat-composite-result.json');
