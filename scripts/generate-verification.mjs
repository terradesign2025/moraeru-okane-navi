// 検証用CSV/HTMLジェネレーター
// 使い方: node scripts/generate-verification.mjs
import { SUBSIDIES, ALL_CITIES } from '../src/data/master.js';
import fs from 'fs';
import path from 'path';

// 自治体公式サイトのURL推測マップ
// （明らかなパターンは推測、不明な場合は Google 検索フォールバック）
const CITY_OFFICIAL_URL = {
  // 関東
  '八王子市': 'https://www.city.hachioji.tokyo.jp/',
  '新宿区': 'https://www.city.shinjuku.lg.jp/',
  '世田谷区': 'https://www.city.setagaya.lg.jp/',
  '練馬区': 'https://www.city.nerima.tokyo.jp/',
  '江東区': 'https://www.city.koto.lg.jp/',
  '町田市': 'https://www.city.machida.tokyo.jp/',
  '立川市': 'https://www.city.tachikawa.lg.jp/',
  'さいたま市': 'https://www.city.saitama.lg.jp/',
  '川口市': 'https://www.city.kawaguchi.lg.jp/',
  '川越市': 'https://www.city.kawagoe.saitama.jp/',
  '所沢市': 'https://www.city.tokorozawa.saitama.jp/',
  '越谷市': 'https://www.city.koshigaya.saitama.jp/',
  '熊谷市': 'https://www.city.kumagaya.lg.jp/',
  '横浜市': 'https://www.city.yokohama.lg.jp/',
  '川崎市': 'https://www.city.kawasaki.jp/',
  '相模原市': 'https://www.city.sagamihara.kanagawa.jp/',
  '横須賀市': 'https://www.city.yokosuka.kanagawa.jp/',
  '藤沢市': 'https://www.city.fujisawa.kanagawa.jp/',
  '平塚市': 'https://www.city.hiratsuka.kanagawa.jp/',
  '千葉市': 'https://www.city.chiba.jp/',
  '船橋市': 'https://www.city.funabashi.lg.jp/',
  '松戸市': 'https://www.city.matsudo.chiba.jp/',
  '市川市': 'https://www.city.ichikawa.lg.jp/',
  '柏市': 'https://www.city.kashiwa.lg.jp/',
  '流山市': 'https://www.city.nagareyama.chiba.jp/',
  '水戸市': 'https://www.city.mito.lg.jp/',
  'つくば市': 'https://www.city.tsukuba.lg.jp/',
  '日立市': 'https://www.city.hitachi.lg.jp/',
  '宇都宮市': 'https://www.city.utsunomiya.lg.jp/',
  '小山市': 'https://www.city.oyama.tochigi.jp/',
  '足利市': 'https://www.city.ashikaga.tochigi.jp/',
  '前橋市': 'https://www.city.maebashi.gunma.jp/',
  '高崎市': 'https://www.city.takasaki.gunma.jp/',
  '太田市': 'https://www.city.ota.gunma.jp/',
  // 中部
  '名古屋市': 'https://www.city.nagoya.jp/',
  '豊田市': 'https://www.city.toyota.aichi.jp/',
  '岡崎市': 'https://www.city.okazaki.lg.jp/',
  '一宮市': 'https://www.city.ichinomiya.aichi.jp/',
  '静岡市': 'https://www.city.shizuoka.lg.jp/',
  '岐阜市': 'https://www.city.gifu.lg.jp/',
  // 関西
  '大阪市': 'https://www.city.osaka.lg.jp/',
  '堺市': 'https://www.city.sakai.lg.jp/',
  '吹田市': 'https://www.city.suita.osaka.jp/',
  '東大阪市': 'https://www.city.higashiosaka.lg.jp/',
  '京都市': 'https://www.city.kyoto.lg.jp/',
  '神戸市': 'https://www.city.kobe.lg.jp/',
  '西宮市': 'https://www.nishi.or.jp/',
  '明石市': 'https://www.city.akashi.lg.jp/',
  // 北海道・東北
  '札幌市': 'https://www.city.sapporo.jp/',
  '青森市': 'https://www.city.aomori.aomori.jp/',
  '盛岡市': 'https://www.city.morioka.iwate.jp/',
  '仙台市': 'https://www.city.sendai.jp/',
  '秋田市': 'https://www.city.akita.lg.jp/',
  '山形市': 'https://www.city.yamagata-yamagata.lg.jp/',
  '福島市': 'https://www.city.fukushima.fukushima.jp/',
  // 北陸・甲信
  '新潟市': 'https://www.city.niigata.lg.jp/',
  '富山市': 'https://www.city.toyama.toyama.jp/',
  '金沢市': 'https://www4.city.kanazawa.lg.jp/',
  '福井市': 'https://www.city.fukui.lg.jp/',
  '甲府市': 'https://www.city.kofu.yamanashi.jp/',
  '長野市': 'https://www.city.nagano.nagano.jp/',
  // 中部・近畿補完
  '津市': 'https://www.info.city.tsu.mie.jp/',
  '大津市': 'https://www.city.otsu.lg.jp/',
  '奈良市': 'https://www.city.nara.lg.jp/',
  '和歌山市': 'https://www.city.wakayama.wakayama.jp/',
  // 中国
  '鳥取市': 'https://www.city.tottori.lg.jp/',
  '松江市': 'https://www.city.matsue.lg.jp/',
  '岡山市': 'https://www.city.okayama.jp/',
  '広島市': 'https://www.city.hiroshima.lg.jp/',
  '山口市': 'https://www.city.yamaguchi.lg.jp/',
  // 四国
  '徳島市': 'https://www.city.tokushima.tokushima.jp/',
  '高松市': 'https://www.city.takamatsu.kagawa.jp/',
  '松山市': 'https://www.city.matsuyama.ehime.jp/',
  '高知市': 'https://www.city.kochi.kochi.jp/',
  // 九州・沖縄
  '福岡市': 'https://www.city.fukuoka.lg.jp/',
  '北九州市': 'https://www.city.kitakyushu.lg.jp/',
  '佐賀市': 'https://www.city.saga.lg.jp/',
  '長崎市': 'https://www.city.nagasaki.lg.jp/',
  '熊本市': 'https://www.city.kumamoto.jp/',
  '大分市': 'https://www.city.oita.oita.jp/',
  '宮崎市': 'https://www.city.miyazaki.miyazaki.jp/',
  '鹿児島市': 'https://www.city.kagoshima.lg.jp/',
  '那覇市': 'https://www.city.naha.okinawa.jp/',
};

// 検証ステータス（verifiedフラグ優先・Phase別フォールバック）
const getStatus = (subsidy) => {
  if (subsidy.verified) return '✓ 公式確認済み';
  const id = subsidy.id;
  if (id >= 201 && id <= 256) return 'テンプレート（関東Phase2）';
  if (id >= 257 && id <= 298) return 'テンプレート（中部・関西Phase3）';
  if (id >= 299 && id <= 325) return 'テンプレート（北関東Phase4）';
  if (id >= 326 && id <= 430) return 'テンプレート（全国Phase5）';
  return '不明';
};

// CSV生成
const csvHeader = ['ID', '都道府県', '市区町村', '補助金名', 'カテゴリ', '金額', '対象条件', '申請期限', '担当窓口', '市公式サイト', 'Google検索URL', '検証ステータス'];
const csvRows = SUBSIDIES.map(s => {
  const officialUrl = CITY_OFFICIAL_URL[s.city] || `https://www.google.com/search?q=${encodeURIComponent(s.pref + s.city + ' 公式')}`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(s.pref + ' ' + s.city + ' ' + s.title)}`;
  return [s.id, s.pref, s.city, s.title, s.category, s.amount, s.condition, s.period || '通年', s.contact, officialUrl, searchUrl, getStatus(s)];
});

const csvContent = [csvHeader, ...csvRows]
  .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  .join('\n');

// BOM付きUTF-8でExcel互換に
fs.writeFileSync('verification/subsidies_verification.csv', '﻿' + csvContent, 'utf8');
console.log('✅ CSV生成完了: verification/subsidies_verification.csv (' + csvRows.length + '件)');

// HTML生成（クリック可能リンク付き）
const htmlRows = SUBSIDIES.map(s => {
  const cityOfficial = CITY_OFFICIAL_URL[s.city] || `https://www.google.com/search?q=${encodeURIComponent(s.pref + s.city + ' 公式')}`;
  // 検証済みなら applicationUrl が公式URL、それ以外は Google検索
  const officialUrl = s.verified ? s.applicationUrl : cityOfficial;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(s.pref + ' ' + s.city + ' ' + s.title)}`;
  const status = getStatus(s);
  const statusColor = s.verified ? '#22c55e' : '#f59e0b';
  return `<tr style="${s.verified ? 'background: #f0fdf4;' : ''}">
    <td>${s.id}</td>
    <td>${s.pref}</td>
    <td>${s.city}</td>
    <td><strong>${s.title}</strong></td>
    <td>${s.category}</td>
    <td>${s.amount}</td>
    <td>${s.condition}</td>
    <td>${s.period || '通年'}</td>
    <td><a href="${officialUrl}" target="_blank">公式サイト</a></td>
    <td><a href="${searchUrl}" target="_blank">Google検索</a></td>
    <td style="color: ${statusColor}; font-weight: bold; font-size: 11px;">${status}</td>
  </tr>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>もらえるお金ナビ｜補助金データ検証用一覧（${csvRows.length}件）</title>
<style>
  body { font-family: 'Noto Sans JP', sans-serif; padding: 20px; background: #f9fafb; }
  h1 { color: #1f2937; }
  .summary { background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .summary p { margin: 4px 0; font-size: 14px; }
  .legend span { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 8px; font-weight: bold; }
  .filter { margin: 12px 0; }
  .filter input { padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; width: 300px; font-size: 14px; }
  table { border-collapse: collapse; width: 100%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
  thead { background: #1e40af; color: white; position: sticky; top: 0; }
  th { padding: 10px 8px; font-size: 12px; text-align: left; }
  td { padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; vertical-align: top; }
  tr:hover { background: #fef3c7; }
  a { color: #2563eb; text-decoration: none; font-size: 12px; }
  a:hover { text-decoration: underline; }
  .pref-jump { background: #fff; padding: 12px; border-radius: 8px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .pref-jump a { display: inline-block; margin: 2px 4px; padding: 4px 8px; background: #eff6ff; border-radius: 4px; font-size: 12px; }
</style>
</head>
<body>
  <h1>📊 補助金データ検証用一覧（${csvRows.length}件）</h1>
  <div class="summary">
    <p><strong>収録: 47都道府県・83市区・${csvRows.length}件の補助金</strong></p>
    <p>各行の「公式サイト」リンクから自治体トップへ、「Google検索」から該当補助金の検索結果へ遷移できます。</p>
    <p class="legend">
      <span style="background: #dcfce7; color: #14532d;">緑：実URL付きの確認済データ</span>
      <span style="background: #fef3c7; color: #92400e;">黄：要確認（テンプレートベース）</span>
    </p>
    <p style="font-size: 12px; color: #6b7280;">⚠️ 黄色のデータは「典型的な補助金パターンを各市に当てはめた」もので、実際に存在するか・金額や期限が正しいかは公式サイトで要確認です。</p>
  </div>

  <div class="filter">
    🔍 <input type="text" id="search" placeholder="都道府県名・市名・補助金名で絞り込み..." oninput="filterTable()">
  </div>

  <table id="dataTable">
    <thead>
      <tr>
        <th>ID</th><th>都道府県</th><th>市区町村</th><th>補助金名</th><th>カテゴリ</th><th>金額</th><th>条件</th><th>期限</th><th>公式サイト</th><th>Google検索</th><th>検証ステータス</th>
      </tr>
    </thead>
    <tbody>
${htmlRows}
    </tbody>
  </table>

  <script>
    function filterTable() {
      const filter = document.getElementById('search').value.toLowerCase();
      const rows = document.querySelectorAll('#dataTable tbody tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;

fs.writeFileSync('verification/subsidies_verification.html', html, 'utf8');
console.log('✅ HTML生成完了: verification/subsidies_verification.html');

console.log('\n📂 ファイル一覧:');
console.log('  - verification/subsidies_verification.csv (Excel用、UTF-8 BOM付き)');
console.log('  - verification/subsidies_verification.html (ブラウザで開いて検証)');
