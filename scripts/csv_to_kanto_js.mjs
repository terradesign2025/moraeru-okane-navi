// CSVファイルを読み込んでkanto_subsidies.jsを生成するスクリプト
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const outFile = join(__dirname, '..', 'src', 'data', 'kanto_subsidies.js');

// 読み込むCSVファイル（既存 + 新規）
const CSV_FILES = [
  'kanto_subsidies_master_v2.csv',
  'session2_tokyo23k_A.csv',
  'session2_tokyo23k_B.csv',
  'session2_tokyo23k_C.csv',
  'session2_tokyo_tama.csv',
  'session2_chiba.csv',
  'session2_ibaraki_tochigi.csv',
  'session2_gunma_kanagawa.csv',
  'session2_saitama_add.csv',
];

function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && !inQuote) { inQuote = true; }
    else if (ch === '"' && inQuote) { inQuote = false; }
    else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

function parseCsv(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const headers = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, idx) => { obj[h.trim()] = (vals[idx] ?? '').trim(); });
    rows.push(obj);
  }
  return rows;
}

const allRows = [];
for (const file of CSV_FILES) {
  const filePath = join(dataDir, file);
  try {
    const content = readFileSync(filePath, 'utf-8');
    const rows = parseCsv(content);
    console.log(`${file}: ${rows.length}件`);
    allRows.push(...rows);
  } catch (e) {
    console.warn(`SKIP: ${file} (${e.message})`);
  }
}

// 重複ID除去（後ろ優先）
const seen = new Map();
for (const row of allRows) {
  seen.set(row.id, row);
}
const unique = [...seen.values()];
console.log(`\n合計: ${unique.length}件 (重複除去後)`);

// JS配列に変換
const jsRows = unique.map(r => {
  const id = parseInt(r.id, 10);
  const verified = r.verified === 'TRUE' || r.verified === 'true';
  return `  { id:${id}, pref:'${esc(r.prefecture)}', city:'${esc(r.city)}', title:'${esc(r.title)}', category:'${esc(r.category)}', amount:'${esc(r.amount)}', condition:'${esc(r.condition)}', desc:'${esc(r.desc)}', period:'${esc(r.period)}', contact:'${esc(r.contact)}', applicationUrl:'${esc(r.applicationUrl)}', verified:${verified}, lastChecked:'${esc(r.lastChecked)}' }`;
});

function esc(s) {
  return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// 市区ごとに整理してALL_KANTO_CITIESも生成
const citySet = new Map();
for (const row of unique) {
  const key = `${row.prefecture}:${row.city}`;
  if (!citySet.has(key)) citySet.set(key, { pref: row.prefecture, city: row.city });
}
const citiesJs = [...citySet.values()].map(c => `  { pref:'${esc(c.pref)}', city:'${esc(c.city)}', hasData:true }`);

const output = `// =============================================================
// もらえるお金ナビ — 関東版補助金データ
// 自動生成: ${new Date().toISOString().slice(0,10)}
// 総件数: ${unique.length}件 / ${citySet.size}市区
// =============================================================

export const KANTO_SUBSIDIES = [
${jsRows.join(',\n')}
];

export const KANTO_CITIES = [
${citiesJs.join(',\n')}
];
`;

writeFileSync(outFile, output, 'utf-8');
console.log(`\n✅ 生成完了: ${outFile}`);
console.log(`   ${unique.length}件 / ${citySet.size}市区`);
