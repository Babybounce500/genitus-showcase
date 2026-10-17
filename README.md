# GENITUS Showcase

Kuratierter Auszug aus einem größeren Set von GitHub-Repos (134 insgesamt) -- die 46
tatsächlich funktionsfähigen Tools/Terminals, ohne die ~80 reinen Bild-/Asset-/Export-Repos
und ohne die alten Spielerei-Repos aus 2023. Gebaut über mehrere Wochen, im Finance-
Analytics-Bereich (Dividenden-, Fundamental- und technische Analyse über 83 Börsen und
~1.400-2.000 Titel), jeweils als eigenständiges, live deploytes Terminal auf GitHub Pages.

## Wie ich arbeite

Ich nutze Claude Code (Anthropic) als KI-Entwicklungspartner, um sehr schnell von Idee zu
validiertem, deployten Produkt zu kommen -- das ist aus meiner Sicht nicht der Gegensatz zu
"selbst coden können", sondern genau der Workflow, um den es in einer Rolle wie "Forward
Deployed Engineer / AI Consultant" geht: direkt mit AI-Tools, LLMs und Agenten bauen, nicht
nur über deren theoretisches Potenzial sprechen. Architektur-Entscheidungen, Bug-Funde und
die Validierungs-Disziplin unten sind meine eigenen Leitplanken für diese Zusammenarbeit --
die Highlights-Dateien in diesem Repo zeigen konkret, was das in der Praxis bedeutet.

## Methodik-Prinzipien (durchgezogen über alle 46 Tools)

- **Nie behaupten, immer validieren.** Jede Strategie/jeder Befund wurde auf echten Daten
  gegengerechnet, bevor er ausgeliefert wurde -- siehe `highlights/02-composite-factor-backtest.js`.
- **Ehrliche negative Befunde.** Wenn ein Faktor (z.B. Shareholder Yield) keine Edge zeigt,
  steht das genauso im Terminal wie ein positiver Befund -- nicht schönrechnen.
- **Performance vor Bequemlichkeit.** Ein API-Call pro Symbol skaliert nicht auf 233k Symbole
  -- siehe `highlights/03-csv-direct-cache-architecture.js` für die Lösung (eine statische
  CSV, einmal pro Batch-Lauf neu generiert, null Live-Calls für die gesamte Dividend-Yield-
  Funktion).
- **Datenfehler aktiv jagen, nicht nur hoffen, dass sie nicht auftreten.** Ein echter Bug
  (Ex-Dividende-Kursabschlag verfälscht RSI/Signale) wurde durch einen direkten Test
  gefunden, nicht vermutet -- siehe `highlights/01-rsi-and-dividend-adjustment-bugfix.js`.
- **Kein Lookahead-Bias.** Jeder Backtest nutzt nur Daten, die zum Zeitpunkt T echt verfügbar
  waren -- siehe `highlights/04-lookahead-free-backtest-helpers.js`.

## Code-Highlights (`/highlights`)

| Datei | Zeigt |
|---|---|
| [`01-rsi-and-dividend-adjustment-bugfix.js`](highlights/01-rsi-and-dividend-adjustment-bugfix.js) | Wilder-RSI-Smoothing korrekt über die volle Serie, plus ein echter gefundener und gefixter Bug (Altria/MO: Score kippt von -2 auf +4 je nach Kursbasis) |
| [`02-composite-factor-backtest.js`](highlights/02-composite-factor-backtest.js) | 5-Faktor-Kombi-Backtest (Piotroski+Value+Magic-Formula+Bollinger+52W-Hoch) auf 1.426 echten Beobachtungen -- 74.65% vs. 52.70% Trefferquote zwischen bestem/schlechtestem Dezil |
| [`03-csv-direct-cache-architecture.js`](highlights/03-csv-direct-cache-architecture.js) | Performance-Architektur: 233k Symbole über eine statische CSV statt Live-API-Calls pro Symbol |
| [`04-lookahead-free-backtest-helpers.js`](highlights/04-lookahead-free-backtest-helpers.js) | Die beiden Helper-Funktionen, die Lookahead-Bias in jedem Backtest-Skript mechanisch verhindern |

## Live-Terminals (46 Repos)

### Quant / Backtesting (stärkste technische Tiefe)
- [genitus-midpoint-terminal](https://github.com/Babybounce500/genitus-midpoint-terminal) -- 11 Strategien, jede mit echtem Backtest (Mean-Reversion, Momentum, Value, Quality, Kombi-Score)
- [genitus-score-vs-performance](https://github.com/Babybounce500/genitus-score-vs-performance) -- Korrelationstest: sagt ein Fundamental-Score echte Performance voraus?
- [genitus-dividend-risk-live](https://github.com/Babybounce500/genitus-dividend-risk-live) -- echte Sharpe/Sortino/VaR/Max-Drawdown-Berechnung
- [genitus-dividend-markov](https://github.com/Babybounce500/genitus-dividend-markov)

### Multi-API-Integration & Breite
- [genitus-world-data](https://github.com/Babybounce500/genitus-world-data) -- 16 Dashboards, je eine andere öffentliche API
- [genitus-macro-yield-curve](https://github.com/Babybounce500/genitus-macro-yield-curve) -- US-Treasury-Kurve, live
- [genitus-sector-heatmap](https://github.com/Babybounce500/genitus-sector-heatmap)
- [genitus-global-heatmap](https://github.com/Babybounce500/genitus-global-heatmap)
- [genitus-global-100](https://github.com/Babybounce500/genitus-global-100)

### Performance-Architektur (Cache statt Live-API)
- [genitus-ticker-terminal](https://github.com/Babybounce500/genitus-ticker-terminal) -- 83 Börsen, Symbol-Cache statt Live-Calls
- [genitus-dividend-terminal](https://github.com/Babybounce500/genitus-dividend-terminal) -- 10.499 bestätigte Dividendenzahler
- [genitus-dividend-aristocrats](https://github.com/Babybounce500/genitus-dividend-aristocrats)
- [genitus-new-payers-radar](https://github.com/Babybounce500/genitus-new-payers-radar)
- [genitus-dividend-calendar](https://github.com/Babybounce500/genitus-dividend-calendar)

### Fundamentaldaten (S&P 500 + DAX 40)
- [genitus-bilanz-terminal](https://github.com/Babybounce500/genitus-bilanz-terminal) -- live Yahoo-Financials, Health Score
- [genitus-bilanz-screener](https://github.com/Babybounce500/genitus-bilanz-screener)
- [genitus-bilanz-cached](https://github.com/Babybounce500/genitus-bilanz-cached)
- [genitus-growth-analysis](https://github.com/Babybounce500/genitus-growth-analysis)
- [genitus-sektor-rotation](https://github.com/Babybounce500/genitus-sektor-rotation)
- [genitus-cagr-rechner](https://github.com/Babybounce500/genitus-cagr-rechner)

### Dividenden-Analyse-Suite
- [genitus-dividend-analysis](https://github.com/Babybounce500/genitus-dividend-analysis)
- [genitus-dividend-risk](https://github.com/Babybounce500/genitus-dividend-risk)
- [genitus-dividend-deep](https://github.com/Babybounce500/genitus-dividend-deep)
- [genitus-dividend-correlation](https://github.com/Babybounce500/genitus-dividend-correlation)
- [genitus-dividend-institutional](https://github.com/Babybounce500/genitus-dividend-institutional)
- [genitus-dividend-compare](https://github.com/Babybounce500/genitus-dividend-compare)
- [genitus-dividend-growth](https://github.com/Babybounce500/genitus-dividend-growth)
- [genitus-dividend-factsheet](https://github.com/Babybounce500/genitus-dividend-factsheet)
- [genitus-dividend-income-goal](https://github.com/Babybounce500/genitus-dividend-income-goal)
- [genitus-haette-ich-gekauft](https://github.com/Babybounce500/genitus-haette-ich-gekauft)

### Client-/Business-Tools
- [genitus-corporate-terminal](https://github.com/Babybounce500/genitus-corporate-terminal)
- [genitus-corporate-workshell](https://github.com/Babybounce500/genitus-corporate-workshell)
- [genitus-client-dossier](https://github.com/Babybounce500/genitus-client-dossier)
- [genitus-screening-suite](https://github.com/Babybounce500/genitus-screening-suite)
- [genitus-workshell](https://github.com/Babybounce500/genitus-workshell) -- zentraler Einstiegspunkt für den gesamten Dividend/Ticker-Stack, PWA-installierbar
- [genitus-rheinmetall-report](https://github.com/Babybounce500/genitus-rheinmetall-report)
- [genitus-charts-terminal](https://github.com/Babybounce500/genitus-charts-terminal)
- [genitus-charts-bot](https://github.com/Babybounce500/genitus-charts-bot)

### Methodik / Case Studies
- [genitus-kip-study](https://github.com/Babybounce500/genitus-kip-study) -- 1-Tages-Build-Analyse im wissenschaftlichen Report-Format
- [genitus-case-study](https://github.com/Babybounce500/genitus-case-study) -- KI-Build vs. klassischer Team-Aufwand/Kosten

### Außerhalb Finance
- [ai-fachvokabular-glossar](https://github.com/Babybounce500/ai-fachvokabular-glossar) -- 240 Fachbegriffe über 38 Domänen, jeweils mit konkretem Prompt-Nutzen
- [do-it-yourself-library](https://github.com/Babybounce500/do-it-yourself-library) -- 105 kuratierte DIY-Projektseiten, review-geprüft mit Sicherheitshinweisen
- [monolith-games-playtest](https://github.com/Babybounce500/monolith-games-playtest) -- browserspielbarer Playtest-Build
- [orbitron-novels-reader](https://github.com/Babybounce500/orbitron-novels-reader)
- [orbitron-scifi-promos](https://github.com/Babybounce500/orbitron-scifi-promos)
- [vektor-learning](https://github.com/Babybounce500/vektor-learning)

---

*Nicht in diesem Showcase: ~20 reine AI-Bild-/Asset-Repos (Stock-Images, Gallery-CDN),
~5 Daten-Export-Repos (Embeddings/Fundamentals als reine Ergebnis-Dateien ohne Pipeline-Code)
und ~41 alte Test-Repos aus 2023 ohne Produktionszweck -- bewusst ausgelassen, weil sie
nichts über Code-Qualität oder Architektur-Entscheidungen aussagen.*
