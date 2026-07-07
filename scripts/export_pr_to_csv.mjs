// =============================================================
// CITY_RECYCLERS（お金のプロPR枠）→ CSV書き出し
// 実行: node scripts/export_pr_to_csv.mjs
// 出力: data/pr_money_advisors.csv（スプレッドシート管理のマスター）
// ※ master.js をテキスト解析（Vite外のNode直実行でも動くように）
// =============================================================
import { readFileSync, writeFileSync } from 'fs';

const src = readFileSync('src/data/master.js', 'utf8');
const start = src.indexOf('export const CITY_RECYCLERS');
const end = src.indexOf('\n};', start);
const block = src.slice(start, end);

const rows = [['市区', '事務所名', 'URL', 'タグ（業種・得意分野）', 'スポンサー契約', '備考']];
let currentCity = null;
let currentCount = 0;
const flushEmpty = () => { if (currentCity && currentCount === 0) rows.push([currentCity, '', '', '', '', '募集枠のみ（掲載0件）']); };
for (const line of block.split('\n')) {
  const cityM = line.match(/^\s{2}'([^']+)':\s*\{/);
  if (cityM) { flushEmpty(); currentCity = cityM[1]; currentCount = 0; continue; }
  const entM = line.match(/name:\s*'([^']+)'.*?url:\s*'([^']+)'.*?tag:\s*'([^']+)'/);
  if (entM && currentCity) { rows.push([currentCity, entM[1], entM[2], entM[3], '', '']); currentCount++; }
}
flushEmpty();

const esc = (v) => /[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : v;
const csv = '﻿' + rows.map(r => r.map(esc).join(',')).join('\r\n');
writeFileSync('data/pr_money_advisors.csv', csv);
const cities = new Set(rows.slice(1).map(r => r[0]));
console.log(`書き出し完了: ${rows.length - 1}件・${cities.size}市区 → data/pr_money_advisors.csv`);
