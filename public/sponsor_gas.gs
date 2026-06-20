// ================================================================
// もらえるお金ナビ — スポンサー申込みデータ Google Sheets 記録スクリプト
// ================================================================
// 使い方:
//   1. https://script.google.com/ を開く
//   2. 「新しいプロジェクト」を作成し、このコードを貼り付ける
//   3. SPREADSHEET_ID を自分のスプレッドシートIDに差し替える
//      （スプレッドシートURLの /d/XXXXXXXXXX/edit の XXXXXXXXXX 部分）
//   4. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
//      実行ユーザー: 自分 / アクセス: 全員 → デプロイ → URLをコピー
//   5. sponsor_lp.html の GAS_WEBHOOK_URL にそのURLを貼る
// ================================================================

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // ← ここを差し替える
const SHEET_NAME     = 'スポンサー申込み';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet   = ss.getSheetByName(SHEET_NAME);

    // シートがなければ作成してヘッダーを追加
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        '受信日時', '会社名', '担当者名', 'メールアドレス',
        '電話番号', '希望市区', '希望プラン', 'メッセージ'
      ]);
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');
    }

    // データを追記
    sheet.appendRow([
      new Date().toLocaleString('ja-JP'),
      data.company  || '',
      data.name     || '',
      data.email    || '',
      data.tel      || '',
      data.area     || '',
      data.plan     || '',
      data.message  || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// テスト用（GASエディタから実行してシートに書き込めるか確認）
function testWrite() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['受信日時','会社名','担当者名','メールアドレス','電話番号','希望市区','希望プラン','メッセージ']);
  }
  sheet.appendRow([new Date().toLocaleString('ja-JP'), 'テスト株式会社', 'テスト 太郎', 'test@example.com', '', '八王子市', '2年プラン', 'テスト送信']);
  Logger.log('書き込み完了');
}
