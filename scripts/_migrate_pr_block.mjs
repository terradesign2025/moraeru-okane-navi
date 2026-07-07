// 一回限りの移行スクリプト: master.js の CITY_RECYCLERS ハードコードを pr_companies.js 参照へ
import { readFileSync, writeFileSync } from 'fs';

let src = readFileSync('src/data/master.js', 'utf8');
const start = src.indexOf('export const CITY_RECYCLERS = {');
const end = src.indexOf('\n};', start) + 3;
if (start < 0 || end < 3) { console.error('ブロックが見つかりません'); process.exit(1); }
const removed = src.slice(start, end).split('\n').length;
const replacement = [
  '// ※ 2026-07-07 スプレッドシート管理へ移行。実体は data/pr_money_advisors.csv',
  '//   編集手順: CSVを編集 → node scripts/csv_to_pr_js.mjs → ビルド',
  'export const CITY_RECYCLERS = PR_COMPANIES;',
].join('\n');
src = src.slice(0, start) + replacement + src.slice(end);

const anchor = "import { JAPAN_CITIES } from './japan_cities';";
if (!src.includes("from './pr_companies'")) {
  src = src.replace(anchor, anchor + "\nimport { PR_COMPANIES } from './pr_companies';");
}
writeFileSync('src/data/master.js', src);
console.log(`置換完了: ${removed}行のハードコードを自動生成参照に変更`);
