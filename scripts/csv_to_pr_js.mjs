// =============================================================
// お金の相談窓口CSV → アプリデータ自動生成
// 実行: node scripts/csv_to_pr_js.mjs
// 入力: data/pr_money_advisors.csv（スプレッドシート管理マスター）
//   列: 市区,事務所名,URL,タグ（業種・得意分野）,スポンサー契約,備考
// 出力: src/data/pr_companies.js（CITY_RECYCLERSの実体）
// 運用: スプレッドシートを編集 → CSVで上書き保存 → このスクリプト → ビルド
// =============================================================
import { readFileSync, writeFileSync } from 'fs';

const MAX_PER_CITY = 10;

// 簡易CSVパーサ（ダブルクォート対応）
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some(v => v !== '')) rows.push(row); }
  return rows;
}

const text = readFileSync('data/pr_money_advisors.csv', 'utf8').replace(/^﻿/, '');
const rows = parseCsv(text).slice(1); // ヘッダー除去

const cities = {};
let skippedHttp = 0;
for (const [city, name, url, tag] of rows) {
  if (!city) continue;
  if (!cities[city]) cities[city] = { sponsor: null, recommended: [] };
  if (!name || !url) continue; // 募集枠のみの市区
  if (!/^https?:\/\//.test(url)) { skippedHttp++; continue; }
  if (cities[city].recommended.length >= MAX_PER_CITY) continue;
  if (cities[city].recommended.some(r => r.url === url || r.name === name)) continue; // 重複除去
  cities[city].recommended.push({ name: name.trim(), url: url.trim(), tag: (tag || '').trim() });
}

const lines = [
  '// =============================================================',
  '// エリア別 お金の相談窓口（FP・行政書士・税理士・住宅ローンアドバイザー）',
  '// ※ このファイルは自動生成。直接編集しないこと',
  '// 編集は data/pr_money_advisors.csv（スプレッドシート）→ node scripts/csv_to_pr_js.mjs',
  `// 生成元: pr_money_advisors.csv／最大${MAX_PER_CITY}件/市区`,
  '// =============================================================',
  'export const PR_COMPANIES = {',
];
for (const [city, info] of Object.entries(cities)) {
  // JSON.stringifyでJSリテラル化（改行・引用符・特殊文字をExcel手編集で混入しても壊れない）
  lines.push(`  ${JSON.stringify(city)}: {`);
  lines.push('    sponsor: null,');
  lines.push('    recommended: [');
  for (const r of info.recommended) {
    lines.push(`      { name: ${JSON.stringify(r.name)}, url: ${JSON.stringify(r.url)}, tag: ${JSON.stringify(r.tag)} },`);
  }
  lines.push('    ],');
  lines.push('  },');
}
lines.push('};');
writeFileSync('src/data/pr_companies.js', lines.join('\n') + '\n');

const total = Object.values(cities).reduce((a, c) => a + c.recommended.length, 0);
console.log(`生成完了: ${Object.keys(cities).length}市区・${total}件 → src/data/pr_companies.js${skippedHttp ? `（URL不正で除外: ${skippedHttp}件）` : ''}`);
