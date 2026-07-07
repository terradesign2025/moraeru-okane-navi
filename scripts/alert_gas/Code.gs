// =============================================================
// もらえるお金ナビ — 無料アラート登録 受信スクリプト（GAS）
// 役割: 登録フォームの内容をスプレッドシートに記録し、
//       オーナー（terradesignik@gmail.com）へ即時メール通知する
// セットアップ手順は README_セットアップ.md を参照
// =============================================================

const NOTIFY_EMAIL = 'terradesignik@gmail.com'; // 通知先
const SHEET_NAME = 'アラート登録者';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 1) スプレッドシートに1行追記
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['登録日時', 'お名前', 'メールアドレス', '年齢', 'エリア', '当てはまる条件']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#1E3A8A').setFontColor('#FFFFFF');
    }
    sheet.appendRow([
      Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss'),
      data.name || '',
      data.email || '',
      data.age || '',
      data.area || '',
      data.conditions || '',
    ]);

    // 2) オーナーへ即時メール通知
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: `【もらえるお金ナビ】新規アラート登録: ${data.name || '名前なし'}（${data.area || 'エリア未選択'}）`,
      body: [
        'もらえるお金ナビに新しいアラート登録がありました。',
        '',
        `お名前　　: ${data.name || ''}`,
        `メール　　: ${data.email || ''}`,
        `年齢　　　: ${data.age || '未入力'}`,
        `エリア　　: ${data.area || ''}`,
        `条件　　　: ${data.conditions || 'なし'}`,
        `登録日時　: ${Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm')}`,
        '',
        `一覧: ${ss.getUrl()}`,
      ].join('\n'),
    });

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 動作テスト用（GASエディタから実行して権限承認に使う）
function testAppend() {
  doPost({ postData: { contents: JSON.stringify({
    name: 'テスト太郎', email: 'test@example.com', age: '40',
    area: '東京都 八王子市', conditions: '子供がいる・持ち家',
  }) } });
}
