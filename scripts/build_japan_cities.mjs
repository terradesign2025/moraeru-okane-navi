// 国土地理院 muni.js から全国市区町村マスターを生成するスクリプト
// 出力: src/data/japan_cities.js（export const JAPAN_CITIES = [{pref, city}, ...]）
// 政令指定都市の行政区（例: 札幌市中央区）は親の市（札幌市）に集約。
// 郡部の町村は「○○郡」を外して町村名のみにする（例: 上川郡東川町 → 東川町）。
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outFile = join(__dirname, '..', 'src', 'data', 'japan_cities.js');
const localSource = join(__dirname, '..', 'data', 'muni_gsi_source.js');

// ローカル保存済みの muni.js を優先、なければ国土地理院から取得
let text;
if (existsSync(localSource)) {
  text = readFileSync(localSource, 'utf-8');
} else {
  const res = await fetch('https://maps.gsi.go.jp/js/muni.js');
  if (!res.ok) { console.error('muni.js の取得に失敗:', res.status); process.exit(1); }
  text = await res.text();
}

const seen = new Map(); // key: pref|city
// 形式: GSI.MUNI_ARRAY["1100"] = '1,北海道,1100,札幌市';
const re = /\["(\d+)"\]\s*=\s*'([^']+)'/g;
let m;
while ((m = re.exec(text)) !== null) {
  const val = m[2];
  const parts = val.split(',');
  if (parts.length < 4) continue;
  const pref = parts[1].trim();
  let city = parts[3].replace(/[\s　]/g, '');
  if (!pref || !city) continue;
  // 政令市の行政区 → 親の市に集約（東京23区は「市」を含まないのでそのまま残る）
  const wardMatch = city.match(/^(.+?市).+区$/);
  if (wardMatch) city = wardMatch[1];
  // 郡部の町村 → 郡名を外す
  city = city.replace(/^.+?郡/, '');
  const key = `${pref}|${city}`;
  if (!seen.has(key)) seen.set(key, { pref, city });
}

const list = [...seen.values()];
const prefCount = new Set(list.map(c => c.pref)).size;
console.log(`取得: ${list.length}市区町村 / ${prefCount}都道府県`);
if (list.length < 1500 || prefCount !== 47) { console.error('件数が想定外のため出力を中止します'); process.exit(1); }

const body = list.map(c => `  { pref:'${c.pref}', city:'${c.city}' }`).join(',\n');
const output = `// =============================================================
// 全国市区町村マスター（国土地理院 muni.js より自動生成）
// 生成日: ${new Date().toISOString().slice(0, 10)} / ${list.length}市区町村
// 再生成: node scripts/build_japan_cities.mjs
// =============================================================

export const JAPAN_CITIES = [
${body},
];
`;
writeFileSync(outFile, output, 'utf-8');
console.log(`✅ 生成完了: ${outFile}`);
