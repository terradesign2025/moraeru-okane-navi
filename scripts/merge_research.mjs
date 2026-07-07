// =============================================================
// リサーチ結果CSV（data/research/*.csv）→ マスターCSVへ統合
// 実行: node scripts/merge_research.mjs
// 重複（URL・事務所名）は除外。1市区最大10件まで
// =============================================================
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';

const MAX_PER_CITY = 10;
const MASTER = 'data/pr_money_advisors.csv';
const DIR = 'data/research';

const parseLine = (line) => {
  // 簡易: クォートなし前提のバッチCSV（カンマ4分割・5個目以降は無視）
  const parts = line.split(',');
  if (parts.length < 4) return null;
  return [parts[0].trim(), parts[1].trim(), parts[2].trim(), parts.slice(3).join('・').trim()];
};

// マスター読み込み
const masterText = readFileSync(MASTER, 'utf8').replace(/^﻿/, '');
const masterLines = masterText.split(/\r?\n/).filter(l => l.trim());
const header = masterLines[0];
const rows = masterLines.slice(1).map(l => l.split(','));

const countByCity = {};
const seen = new Set();
for (const r of rows) {
  if (r[1]) { countByCity[r[0]] = (countByCity[r[0]] || 0) + 1; seen.add(r[2]); seen.add(r[0] + '|' + r[1]); }
}

let added = 0, skipDup = 0, skipMax = 0, skipBad = 0;
const newRows = [];
if (existsSync(DIR)) {
  for (const f of readdirSync(DIR).filter(f => f.endsWith('.csv'))) {
    const text = readFileSync(`${DIR}/${f}`, 'utf8').replace(/^﻿/, '');
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim() || line.startsWith('市区,')) continue;
      const p = parseLine(line);
      if (!p) { skipBad++; continue; }
      const [city, name, url, tag] = p;
      if (!city || !name || !/^https?:\/\//.test(url)) { skipBad++; continue; }
      if (seen.has(url) || seen.has(city + '|' + name)) { skipDup++; continue; }
      if ((countByCity[city] || 0) >= MAX_PER_CITY) { skipMax++; continue; }
      newRows.push([city, name, url, tag, '', `リサーチ追加 ${new Date().toISOString().slice(0, 10)}`]);
      countByCity[city] = (countByCity[city] || 0) + 1;
      seen.add(url); seen.add(city + '|' + name);
      added++;
    }
  }
}

// 「募集枠のみ」プレースホルダー行は、実データが入った市区から削除
const cityHasData = new Set(newRows.map(r => r[0]).concat(rows.filter(r => r[1]).map(r => r[0])));
const kept = rows.filter(r => r[1] || !cityHasData.has(r[0]));

const esc = (v) => /[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : v;
const all = [header, ...kept.map(r => r.join(',')), ...newRows.map(r => r.map(esc).join(','))];
writeFileSync(MASTER, '﻿' + all.join('\r\n'));
console.log(`統合完了: 追加${added}件（重複除外${skipDup}・上限超過${skipMax}・不正行${skipBad}）→ ${MASTER}`);
