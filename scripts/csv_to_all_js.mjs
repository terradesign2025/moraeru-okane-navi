// 全CSVファイルを読み込んでall_subsidies.jsを生成するスクリプト
// 関東版 + 大阪・福岡・東京多摩残り etc. に対応
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const outFile = join(__dirname, '..', 'src', 'data', 'all_subsidies.js');

// 読み込むCSVファイル（存在するもののみ自動スキップ）
const CSV_FILES = [
  // 関東 ─────────────────────────────
  'kanto_subsidies_master_v2.csv',
  // 政令指定都市追加（千葉市など ID:601-720）─────
  'phase2_seirei_cities.csv',
  'session2_tokyo23k_A.csv',
  'session2_tokyo23k_B.csv',
  'session2_tokyo23k_C.csv',
  'session2_tokyo_tama.csv',
  'session2_tokyo_tama_remaining.csv',
  'session2_chiba.csv',
  'session2_ibaraki_tochigi.csv',
  'session2_gunma_kanagawa.csv',
  'session2_saitama_add.csv',
  // 近畿 ─────────────────────────────
  'session3_osaka.csv',
  'session3_osaka_add.csv',
  'session3_kyoto.csv',
  'session3_hyogo.csv',
  // 九州・福岡 ────────────────────────
  'session3_fukuoka.csv',
  'session3_fukuoka_add.csv',
  // 中部 ─────────────────────────────
  'session3_aichi.csv',
  // 東北・北海道（session3） ────────────
  'session3_tohoku.csv',
  // session4 全国展開 ─────────────────
  'session4_hokuriku_koshin.csv',    // 北陸・甲信越
  'session5_tohoku_expanded.csv',            // 東北残り（青森・岩手・秋田・山形・福島）
  'session6_chubu.csv',                      // 中部残り（岐阜・静岡・三重）
  'session5_kinki_shiga_nara_wakayama.csv', // 近畿残り（滋賀・奈良・和歌山）
  'session4_chugoku.csv',                   // 中国地方（鳥取・島根・岡山・広島・山口）
  'session5_shikoku.csv',                   // 四国（徳島・香川・愛媛・高知）
  'session4_kyushu_a.csv',                  // 九州A（佐賀・長崎・熊本・大分）
  'session4_kyushu_okinawa.csv',            // 九州B・沖縄（宮崎・鹿児島・沖縄）
  // session7 全国追加展開 ─────────────────
  'session7_nationwide_expanded.csv',       // 全国55都市追加（北海道・東北・中部・中国・四国・九州・沖縄・関東）
  // session8 全国追加（2026-06-10）─────────
  'session8_kanto_south.csv',               // 関東南部10市（鎌倉・秦野・座間・青梅・昭島・小金井・習志野・佐倉・野田・印西）
  'session8_kanto_north.csv',               // 関東北部10市（土浦・取手・古河・栃木・佐野・館林・深谷・狭山・ふじみ野・八潮）
  'session8_kinki_chubu.csv',               // 近畿・中部10市（宝塚・加古川・川西・池田・箕面・泉佐野・藤枝・焼津・小牧・稲沢）
  // session9 データ薄い県の拡充（2026-06-11）──
  'session9_thin_prefs.csv',                // 石川・富山・福井・山梨・秋田・香川の12市（小松・七尾・野々市・射水・鯖江・越前・富士吉田・笛吹・大仙・由利本荘・坂出・観音寺）
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
    if (vals.length !== headers.length) {
      console.warn(`⚠ 列数不一致 (期待${headers.length}列/実際${vals.length}列): "${line.slice(0, 60)}..."`);
    }
    const obj = {};
    headers.forEach((h, idx) => { obj[h.trim()] = (vals[idx] ?? '').trim(); });
    rows.push(obj);
  }
  return rows;
}

function esc(s) {
  return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const allRows = [];
for (const file of CSV_FILES) {
  const filePath = join(dataDir, file);
  if (!existsSync(filePath)) {
    console.log(`SKIP (未作成): ${file}`);
    continue;
  }
  try {
    const content = readFileSync(filePath, 'utf-8');
    const rows = parseCsv(content);
    console.log(`${file}: ${rows.length}件`);
    allRows.push(...rows);
  } catch (e) {
    console.warn(`ERROR: ${file} (${e.message})`);
  }
}

// 空行・無効行除去 → 重複ID除去（後ろ優先）
const seen = new Map();
let dupCount = 0;
let brokenCount = 0;
for (const row of allRows) {
  if (!row.id || !row.prefecture || !row.city || isNaN(parseInt(row.id, 10))) continue;
  // フィールドずれ検知: lastChecked が日付形式でない行は列ずれの可能性が高い
  if (row.lastChecked && !/^\d{4}-\d{2}-\d{2}$/.test(row.lastChecked.trim())) {
    console.warn(`⚠ 列ずれ疑い: id=${row.id} ${row.city} (lastChecked="${row.lastChecked}") — 元CSVの金額等のカンマをダブルクォートで囲んでください`);
    brokenCount++;
  }
  if (seen.has(row.id)) dupCount++;
  seen.set(row.id, row);
}
const unique = [...seen.values()];
console.log(`\n合計: ${unique.length}件 (重複除去後 / 重複ID:${dupCount}件 / 列ずれ疑い:${brokenCount}件)`);

// 都道府県別集計
const prefCount = {};
for (const row of unique) {
  prefCount[row.prefecture] = (prefCount[row.prefecture] || 0) + 1;
}
console.log('\n都道府県別件数:');
Object.entries(prefCount).sort((a,b) => b[1]-a[1]).forEach(([p,c]) => console.log(`  ${p}: ${c}件`));

// JS配列に変換
const jsRows = unique.map(r => {
  const id = parseInt(r.id, 10);
  const verified = r.verified === 'TRUE' || r.verified === 'true';
  return `  { id:${id}, pref:'${esc(r.prefecture)}', city:'${esc(r.city)}', title:'${esc(r.title)}', category:'${esc(r.category)}', amount:'${esc(r.amount)}', condition:'${esc(r.condition)}', desc:'${esc(r.desc)}', period:'${esc(r.period)}', contact:'${esc(r.contact)}', applicationUrl:'${esc(r.applicationUrl)}', verified:${verified}, lastChecked:'${esc(r.lastChecked)}' }`;
});

// 市区ごとのCITIES生成
const citySet = new Map();
for (const row of unique) {
  const key = `${row.prefecture}:${row.city}`;
  if (!citySet.has(key)) citySet.set(key, { pref: row.prefecture, city: row.city });
}
const citiesJs = [...citySet.values()].map(c => `  { pref:'${esc(c.pref)}', city:'${esc(c.city)}', hasData:true }`);

const output = `// =============================================================
// もらえるお金ナビ — 全国補助金データ（自動生成）
// 生成日: ${new Date().toISOString().slice(0,10)}
// 総件数: ${unique.length}件 / ${citySet.size}市区
// =============================================================

export const ALL_SUBSIDIES = [
${jsRows.join(',\n')}
];

export const ALL_SUBSIDY_CITIES = [
${citiesJs.join(',\n')}
];

// 後方互換（既存コードが KANTO_SUBSIDIES / KANTO_CITIES を参照している場合）
export const KANTO_SUBSIDIES = ALL_SUBSIDIES;
export const KANTO_CITIES = ALL_SUBSIDY_CITIES;
`;

writeFileSync(outFile, output, 'utf-8');
console.log(`\n✅ 生成完了: ${outFile}`);
console.log(`   ${unique.length}件 / ${citySet.size}市区`);
