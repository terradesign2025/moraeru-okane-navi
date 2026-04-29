// =============================================================
// もらえるお金ナビ — データマスター
// =============================================================
// 最終更新日  : 2026-04-27
// 次回更新予定: 2026-05-27（毎月27日 定期更新）
// 管理担当    : テラデザイン株式会社
// Excelマスター: /data/master_trends.csv
//               /data/master_subsidies.csv
//               /data/master_cities.csv
// データソース:
//   - e-Gov 法令検索（デジタル庁）https://elaws.e-gov.go.jp
//   - 各自治体公式ウェブサイト
//   - 経済産業省 補助金ポータル https://hojyokin-portal.jp
//   - 国土交通省 住宅局
//   - 内閣府 子ども・子育て本部
// =============================================================
// 【データ収集進捗】
// Phase 1（完了）: 東京都八王子市 サンプルデータ
// Phase 2（未着手）: 全国815市区町村データ収集
//   収集予定: 都道府県ごとに主要都市から順次追加（月1回更新）
//   優先順位: master_cities.csv の updatePriority 列参照
// =============================================================

export const META = {
  lastUpdated: '2026-04-27',
  version: '1.0.0',
  nextUpdate: '2026-05-27',
  phase: 1,
  totalCities: 815,
  completedCities: 1,
  sources: [
    'e-Gov 法令検索（デジタル庁）',
    '各自治体公式ウェブサイト',
    '総務省 自治行政局',
    '内閣府 子ども・子育て本部',
    '国土交通省 住宅局',
    '経済産業省 補助金ポータル',
  ],
};

// ─── 全国注目トピック ─────────────────────────────────────────
// featured: true → カードをオレンジ枠で強調表示（注目度・金額高）
export const ALL_TRENDS = [
  { id: 6,  tab: 'unique', city: '長野県',        title: '移住支援金',           amount: '最大100万円',  desc: '東京圏から移住して就業・起業すると支給。ファミリー加算あり。', icon: 'Map',       color: 'text-emerald-600', bg: 'bg-emerald-50', interest: 5, featured: true,  source: '長野県公式サイト', lastChecked: '2026-04-27' },
  { id: 4,  tab: 'unique', city: '石川県',         title: '婚活応援クーポン',     amount: '飲食代割引',   desc: '市が認定した婚活イベントの費用を自治体が補助。全国でも珍しい制度。', icon: 'Award', color: 'text-orange-500',  bg: 'bg-orange-50',  interest: 5, featured: true,  source: '加賀市公式サイト', lastChecked: '2026-04-27' },
  { id: 8,  tab: 'home',   city: '全国',           title: '先進的窓リノベ',       amount: '最大200万円',  desc: '国の補助事業。断熱窓へのリフォームで高額補助。予算消化が早い！', icon: 'Sparkles', color: 'text-yellow-500',  bg: 'bg-yellow-50',  interest: 4, featured: true,  source: '国土交通省', lastChecked: '2026-04-27' },
  { id: 9,  tab: 'unique', city: '北海道東川町',   title: '職人の家具プレゼント', amount: '約30万円相当', desc: '移住者に地元職人が作った高品質な家具を贈呈。全国から注目。', icon: 'Star',     color: 'text-pink-500',    bg: 'bg-pink-50',    interest: 4, featured: true,  source: '東川町公式サイト', lastChecked: '2026-04-27' },
  { id: 5,  tab: 'family', city: '兵庫県明石市',   title: 'おむつ定期便',         amount: '毎月無料',     desc: '満1歳まで毎月おむつなどの育児用品が自宅に届く超人気制度。', icon: 'Baby',    color: 'text-blue-500',    bg: 'bg-blue-50',    interest: 4, featured: true,  source: '明石市公式サイト', lastChecked: '2026-04-27' },
  { id: 1,  tab: 'family', city: '岐阜県海津市',   title: '結婚新生活支援',       amount: '最大30万円',   desc: '新婚の家賃・引越し費用を自治体がサポート。所得要件あり。', icon: 'Heart',    color: 'text-pink-500',    bg: 'bg-pink-50',    interest: 3, featured: false, source: '海津市公式サイト', lastChecked: '2026-04-27' },
  { id: 3,  tab: 'home',   city: '鳥取県',         title: '県産材での家づくり',   amount: '最大50万円',   desc: '地元の木を使った新築で支給。移住者は上乗せ補助あり。', icon: 'Home',     color: 'text-green-600',   bg: 'bg-green-50',   interest: 3, featured: false, source: '鳥取県公式サイト', lastChecked: '2026-04-27' },
  { id: 7,  tab: 'eco',    city: '東京都',         title: '電動自転車購入補助',   amount: '最大10万円',   desc: '子乗せ電動アシスト自転車の購入費を助成。環境にも家計にも優しい。', icon: 'Bike', color: 'text-purple-500',  bg: 'bg-purple-50',  interest: 2, featured: false, source: '東京都公式サイト', lastChecked: '2026-04-27' },
  { id: 2,  tab: 'eco',    city: '北海道',         title: '冬の暖房費助成',       amount: '1万円〜',      desc: '厳しい冬の灯油代を自治体が一部負担。所得制限あり。', icon: 'TrendingUp', color: 'text-blue-500',   bg: 'bg-blue-50',    interest: 2, featured: false, source: '北海道庁公式サイト', lastChecked: '2026-04-27' },
];

// ─── 市区町村マスター（検索オートコンプリート用）──────────────
export const ALL_CITIES = [
  { pref: '北海道',   city: '札幌市',    hasData: false },
  { pref: '北海道',   city: '函館市',    hasData: false },
  { pref: '北海道',   city: '旭川市',    hasData: false },
  { pref: '北海道',   city: '帯広市',    hasData: false },
  { pref: '北海道',   city: '釧路市',    hasData: false },
  { pref: '宮城県',   city: '仙台市',    hasData: false },
  { pref: '宮城県',   city: '石巻市',    hasData: false },
  { pref: '宮城県',   city: '大崎市',    hasData: false },
  { pref: '東京都',   city: '千代田区',  hasData: false },
  { pref: '東京都',   city: '新宿区',    hasData: false },
  { pref: '東京都',   city: '渋谷区',    hasData: false },
  { pref: '東京都',   city: '世田谷区',  hasData: false },
  { pref: '東京都',   city: '八王子市',  hasData: true  },
  { pref: '東京都',   city: '町田市',    hasData: false },
  { pref: '東京都',   city: '立川市',    hasData: false },
  { pref: '東京都',   city: '府中市',    hasData: false },
  { pref: '東京都',   city: '調布市',    hasData: false },
  { pref: '東京都',   city: '三鷹市',    hasData: false },
  { pref: '東京都',   city: '武蔵野市',  hasData: false },
  { pref: '神奈川県', city: '横浜市',    hasData: false },
  { pref: '神奈川県', city: '川崎市',    hasData: false },
  { pref: '神奈川県', city: '相模原市',  hasData: false },
  { pref: '神奈川県', city: '横須賀市',  hasData: false },
  { pref: '神奈川県', city: '藤沢市',    hasData: false },
  { pref: '愛知県',   city: '名古屋市',  hasData: false },
  { pref: '愛知県',   city: '豊田市',    hasData: false },
  { pref: '愛知県',   city: '岡崎市',    hasData: false },
  { pref: '愛知県',   city: '一宮市',    hasData: false },
  { pref: '大阪府',   city: '大阪市',    hasData: false },
  { pref: '大阪府',   city: '堺市',      hasData: false },
  { pref: '大阪府',   city: '吹田市',    hasData: false },
  { pref: '大阪府',   city: '豊中市',    hasData: false },
  { pref: '大阪府',   city: '東大阪市',  hasData: false },
  { pref: '福岡県',   city: '福岡市',    hasData: false },
  { pref: '福岡県',   city: '北九州市',  hasData: false },
  { pref: '福岡県',   city: '久留米市',  hasData: false },
];

// ─── 補助金マスター ───────────────────────────────────────────
// deadline: ISO日付文字列。1ヶ月以内なら赤表示。null=期限なし(随時)
// applicationUrl: 電子申請URL（実装時に各自治体URLに差替え）
export const SUBSIDIES = [
  {
    id: 101, title: '自転車ヘルメット購入補助', amount: '最大2,000円', category: '安全', condition: 'usesBike',
    pref: '東京都', city: '八王子市', source: '八王子市公式サイト', lastChecked: '2026-04-27',
    deadline: '2026-03-31',
    applicationUrl: 'https://www.city.hachioji.tokyo.jp/kurashi/douro/1004840.html',
    desc: 'SGマーク付ヘルメット購入時に適用。',
    overview: '八王子市が対象の自転車用ヘルメット購入に対して補助を行う制度です。',
    eligible: ['八王子市民であること', 'SGマーク等の安全基準を満たすヘルメットを購入', '申請時点で同補助金を未受給であること'],
    period: '令和8年3月31日まで（予算なくなり次第終了）',
    how: ['ヘルメットを購入し、レシートを保管する', '市役所または郵送で申請書を提出', '審査後、登録口座に振込（約2〜3週間）'],
    contact: '八王子市 道路・交通安全課',
  },
  {
    id: 102, title: 'おむつ専用ごみ袋の無料配布', amount: 'ごみ袋 年数冊', category: '子育て', condition: 'hasChildren',
    pref: '東京都', city: '八王子市', source: '八王子市公式サイト', lastChecked: '2026-04-27',
    deadline: null,
    applicationUrl: 'https://www.city.hachioji.tokyo.jp/kurashi/kosodate/1003588.html',
    desc: '3歳未満のお子さんがいる家庭に指定袋を配布。',
    overview: '3歳未満のお子さんがいる家庭に、おむつ用指定ごみ袋を無料で配布する制度です。',
    eligible: ['八王子市民', '3歳未満の子供がいる家庭', '児童手当受給者'],
    period: '通年（お子さんが3歳になるまで毎年申請）',
    how: ['子育て支援課に申請（オンライン可）', '審査後に冊子を郵送', '翌年度は更新申請が必要'],
    contact: '八王子市 子育て支援課',
  },
  {
    id: 103, title: '居住環境整備補助金', amount: '最大100万円', category: '住まい', condition: 'ownsHome',
    pref: '東京都', city: '八王子市', source: '八王子市公式サイト', lastChecked: '2026-04-27',
    deadline: '2026-06-30',
    applicationUrl: 'https://www.city.hachioji.tokyo.jp/kurashi/sumai/1004220.html',
    desc: '耐震・バリアフリー・断熱改修などの工事に。',
    overview: '耐震・バリアフリー・断熱など住まいの改善工事に対して補助する制度です。工事着工前の申請が必須です。',
    eligible: ['八王子市内の建物の所有者', '市税・都税の滞納がないこと', '工事着工前に申請が必要'],
    period: '令和8年6月30日まで（要事前申請）',
    how: ['工事前に市の窓口へ相談・申請', '申請書類を提出し審査を受ける', '承認後に工事を実施', '完了報告書と領収書を提出して補助金交付'],
    contact: '八王子市 建築指導課',
  },
  {
    id: 104, title: '物価高騰対応子育て手当', amount: '2万円/人', category: '子育て', condition: 'hasChildren',
    pref: '東京都', city: '八王子市', source: '八王子市公式サイト', lastChecked: '2026-04-27',
    deadline: '2026-06-30',
    applicationUrl: 'https://www.city.hachioji.tokyo.jp/kurashi/kosodate/kyuhukin/1006000.html',
    desc: '令和8年度の臨時給付金。申請期限に注意！',
    overview: '物価高騰への対応として、18歳以下の子供1人につき2万円を支給する臨時給付金です。申請期限があります。',
    eligible: ['八王子市に住民票がある', '18歳以下の子供がいる（高校生まで）', '申請期限内に手続きを完了すること'],
    period: '令和8年6月30日まで（申請期限）',
    how: ['市から送付される案内通知を確認', 'オンラインまたは郵送で申請', '審査後、指定口座に振込（約1ヶ月）'],
    contact: '八王子市 子ども家庭部 給付金係',
  },
  {
    id: 105, title: '省エネ家電買い替え補助', amount: '最大3万円', category: 'エコ', condition: 'all',
    pref: '東京都', city: '八王子市', source: '八王子市公式サイト', lastChecked: '2026-04-27',
    deadline: '2026-07-31',
    applicationUrl: 'https://www.city.hachioji.tokyo.jp/kurashi/kankyo/shoene/1005500.html',
    desc: '古い冷蔵庫やエアコンを省エネ型に替えると支給。',
    overview: '古い家電を省エネ基準適合製品に買い替えた際に、購入費の一部を補助する制度です。',
    eligible: ['八王子市民', '対象の省エネ家電（冷蔵庫・エアコン・給湯器等）を購入', '廃棄した古い家電の処分証明が必要'],
    period: '令和8年7月31日まで（予算なくなり次第終了）',
    how: ['対象家電を購入し、廃棄処分の証明を取得', '市役所で申請（来庁またはオンライン）', '補助金振込（約3週間）'],
    contact: '八王子市 環境部 省エネ推進課',
  },
];

// ─── スポンサーマスター ─────────────────────────────────────
export const SPONSOR_MAP = {
  101: { id: 101, companyName: '○○サイクル 八王子店', catchcopy: 'SGマーク付きヘルメット、当店で取扱中！', detail: 'この画面を提示でさらに5%OFFに。補助金申請書の書き方もスタッフが丁寧にご案内します。', cta: '店舗詳細・在庫を確認する', badge: 'ヘルメット補助対応店', accent: 'blue',   address: '東京都八王子市○○町1-2-3', tel: '042-XXX-XXXX', hours: '10:00〜19:00（水曜定休）' },
  103: { id: 103, companyName: '○○工務店',            catchcopy: 'リフォーム補助金を使った工事はお任せ！',  detail: '耐震・断熱・バリアフリー工事に対応。申請書類の作成サポートも無料です。',             cta: '無料見積もりを依頼する',    badge: 'リフォーム補助金対応',  accent: 'green',  address: '東京都八王子市○○町4-5-6', tel: '042-YYY-YYYY', hours: '9:00〜18:00（日曜定休）' },
  104: { id: 104, companyName: 'FPオフィス八王子',      catchcopy: '給付金の申請、一緒に確認しませんか？',   detail: 'こどもの臨時給付金は申請期限があります。まずは無料で手続きの流れを確認しましょう。',   cta: '申請サポートを無料相談する', badge: 'FP相談・申請代行',     accent: 'purple', address: '東京都八王子市○○町7-8-9', tel: '042-ZZZ-ZZZZ', hours: '平日 10:00〜17:00' },
  105: { id: 105, companyName: '○○電気 八王子店',       catchcopy: '古いエアコンの買い替えで最大3万円！',    detail: '補助金申請の代行も無料サポート。省エネ家電の在庫は随時入荷中です。',                   cta: 'まずは無料相談する',        badge: '省エネ補助金サポート店', accent: 'orange', address: '東京都八王子市○○町10-11', tel: '042-AAA-AAAA', hours: '10:30〜19:30（第2水曜定休）' },
};

// ─── 今月のピックアップ ─────────────────────────────────────
export const PICKUP_ITEMS = [
  { id: 'p1', icon: 'Baby',     colClass: 'bg-pink-100 text-pink-600',   title: '子育て支援 充実エリアランキング',  sub: '2026年版・全国トップ10自治体',   view: 'pickup1' },
  { id: 'p2', icon: 'Home',     colClass: 'bg-green-100 text-green-600', title: 'リフォーム補助金 まるわかりガイド', sub: '耐震・断熱・バリアフリーの申請手順', view: 'pickup2' },
  { id: 'p3', icon: 'Sparkles', colClass: 'bg-blue-100 text-blue-600',   title: '省エネ家電 補助額シミュレーター',   sub: 'エアコン・冷蔵庫・給湯器対応',    view: 'pickup3' },
];

// ─── 子育てランキング ────────────────────────────────────────
export const CHILDCARE_RANKING = [
  { rank: 1,  pref: '兵庫県', city: '明石市',   score: 98, tag: '全国No.1', highlights: ['おむつ定期便（毎月無料）', '18歳まで医療費完全無料', '第2子以降の保育料無料', '子育て相談センター充実'] },
  { rank: 2,  pref: '東京都', city: '武蔵野市', score: 94, tag: 'トップ圏', highlights: ['待機児童ゼロ継続中', '子育てコンシェルジュ常駐', '一時預かり充実', '保育料補助手厚い'] },
  { rank: 3,  pref: '千葉県', city: '流山市',   score: 91, tag: 'トップ圏', highlights: ['駅前送迎保育ステーション', '待機児童ゼロ', '子育て世代移住支援充実', '公園整備率高い'] },
  { rank: 4,  pref: '福岡県', city: '福岡市',   score: 88, tag: '優秀',     highlights: ['出産祝い金10万円', '給食費無償化', 'こども未来局設置', '保育所増設中'] },
  { rank: 5,  pref: '大阪府', city: '吹田市',   score: 86, tag: '優秀',     highlights: ['小中学校給食費無料', '子ども医療費18歳まで無料', '放課後学習支援充実'] },
  { rank: 6,  pref: '宮城県', city: '仙台市',   score: 83, tag: '注目',     highlights: ['第3子以降の保育料無料', '出産・子育て応援給付金10万円', '産後ケア充実'] },
  { rank: 7,  pref: '愛知県', city: '豊田市',   score: 81, tag: '注目',     highlights: ['子育て支援センター全市展開', '企業主導型保育所多数', '学童保育完全無料'] },
  { rank: 8,  pref: '神奈川', city: '藤沢市',   score: 79, tag: '注目',     highlights: ['海沿いの子育て環境', '図書館・公民館充実', '子育て広場ネットワーク'] },
  { rank: 9,  pref: '北海道', city: '札幌市',   score: 77, tag: '注目',     highlights: ['冬の暖房費助成あり', '子育て世代移住パッケージ', '認定こども園多数'] },
  { rank: 10, pref: '東京都', city: '世田谷区', score: 75, tag: '注目',     highlights: ['区独自の子育て支援給付', '保育所待機児童対策', '多世代交流施設充実'] },
];

// ─── 自治体別 子育て補助金データ ────────────────────────────
// 各ランキング都市の実際の子育て支援制度一覧
export const CHILDCARE_CITY_SUBSIDIES = {
  '明石市': [
    { title: 'おむつ定期便',         amount: '毎月無料',    category: '育児', desc: '満1歳まで毎月おむつ・育児用品を自宅に配送。' },
    { title: '子ども医療費助成',      amount: '18歳まで無料', category: '医療', desc: '入院・通院を問わず18歳まで医療費の窓口負担なし。' },
    { title: '第2子以降の保育料無料', amount: '保育料全額',   category: '保育', desc: '第2子以降は認可保育所・幼稚園の利用料が完全無料。' },
    { title: '出産応援給付金',        amount: '10万円',      category: '出産', desc: '妊娠・出産をした方に市独自の給付金を支給。' },
  ],
  '武蔵野市': [
    { title: '子育て世帯家賃補助',    amount: '最大3万円/月',  category: '住まい', desc: '子育て世帯が市内に転入した際の家賃を最大2年補助。' },
    { title: '保育料補助',           amount: '最大5万円/月',  category: '保育',  desc: '認可外保育施設を利用する場合の費用を補助。' },
    { title: '子育て支援一時金',      amount: '5万円',        category: '出産',  desc: '第1子出産時に市独自の一時金を支給。' },
    { title: '学童保育完全無料化',    amount: '利用料無料',   category: '教育',  desc: '放課後の学童保育（学童クラブ）の利用料が無料。' },
  ],
  '流山市': [
    { title: '送迎保育ステーション',  amount: '月額0〜2万円', category: '保育',  desc: '駅前で子供を預け、保育所へ送迎してくれる画期的サービス。' },
    { title: '子育て世代移住支援',    amount: '最大50万円',   category: '移住',  desc: '市外から転入した子育て世帯に引越し費用などを補助。' },
    { title: 'こども医療費助成',      amount: '中学生まで無料', category: '医療', desc: '中学3年生まで医療費の窓口負担なし。' },
    { title: '出産祝い品',           amount: '育児用品セット', category: '出産', desc: '市内で出産した家庭に育児用品セットをプレゼント。' },
  ],
  '福岡市': [
    { title: '出産祝い金',           amount: '10万円',       category: '出産',  desc: '市内で出産した家庭に祝い金を支給（第1子から対象）。' },
    { title: '給食費無償化',         amount: '給食費全額',   category: '教育',  desc: '市立小中学校の給食費が無償化（令和6年度〜）。' },
    { title: 'こども医療費助成',      amount: '小学生まで無料', category: '医療', desc: '小学6年生まで医療費の窓口負担なし。' },
    { title: '保育所整備助成',        amount: '保育料補助',   category: '保育',  desc: '認可保育所の整備を推進。待機児童ゼロを目指す。' },
  ],
  '吹田市': [
    { title: 'こども医療費助成',      amount: '18歳まで無料', category: '医療', desc: '18歳（高校3年生の年度末）まで医療費の窓口負担なし。' },
    { title: '給食費無償化',         amount: '給食費全額',   category: '教育', desc: '市立小中学校の給食費が完全無料。' },
    { title: '保育料軽減措置',        amount: '最大1万円/月', category: '保育', desc: '市独自の上乗せ補助で認可保育所の保育料を軽減。' },
    { title: '子育て相談窓口',        amount: '無料相談',    category: '相談',  desc: '専門スタッフが子育ての悩みをワンストップで支援。' },
  ],
  '仙台市': [
    { title: '出産・子育て応援給付金', amount: '10万円',      category: '出産',  desc: '妊娠・出産・養育について継続的な相談支援と給付金10万円。' },
    { title: '第3子以降の保育料無料', amount: '保育料全額',   category: '保育',  desc: '第3子以降の認可保育所・幼稚園の利用料が完全無料。' },
    { title: 'こども医療費助成',      amount: '中学生まで無料', category: '医療', desc: '中学3年生まで医療費の自己負担なし。' },
    { title: '産後ケア事業',          amount: '最大7日間',   category: '産後',  desc: '産後の体力・精神面のケアを宿泊・日帰りで提供。' },
  ],
  '豊田市': [
    { title: '学童保育完全無料',      amount: '利用料無料',   category: '教育',  desc: '放課後の学童保育（放課後クラブ）の利用料が無料。' },
    { title: 'こども医療費助成',      amount: '高校生まで無料', category: '医療', desc: '高校3年生まで医療費の窓口負担なし。' },
    { title: '出産祝い金',           amount: '5万円（第1子）', category: '出産', desc: '第1子5万円、第2子10万円、第3子以降20万円を支給。' },
    { title: '企業主導型保育助成',    amount: '保育料補助',   category: '保育',  desc: '企業の設置する保育施設の利用料を市が補助。' },
  ],
  '藤沢市': [
    { title: 'こども医療費助成',      amount: '高校生まで無料', category: '医療', desc: '高校3年生まで入通院の医療費の窓口負担なし。' },
    { title: '子育て世帯住宅支援',    amount: '最大30万円',   category: '住まい', desc: '市内で住宅を取得した子育て世帯に費用の一部を補助。' },
    { title: '保育士宿舎借り上げ',    amount: '保育士向け',   category: '保育',  desc: '保育士の確保のため宿舎費用を補助し保育所充実化。' },
    { title: '児童遊園整備',          amount: '整備支援',    category: '環境',  desc: '海沿いの公園整備など子供の遊び場を充実させる事業。' },
  ],
  '札幌市': [
    { title: '冬の子育て暖房費助成',  amount: '最大1万円',    category: 'エコ',  desc: '子育て世帯の冬の暖房費（灯油代等）を市が一部負担。' },
    { title: '子ども医療費助成',      amount: '中学生まで無料', category: '医療', desc: '中学3年生まで入通院の医療費自己負担なし。' },
    { title: '移住子育て支援金',      amount: '最大60万円',   category: '移住',  desc: '道外から移住した子育て世帯に支援金を支給。' },
    { title: '認定こども園整備',      amount: '保育料補助',   category: '保育',  desc: '市内全区に認定こども園を整備し待機児童解消を推進。' },
  ],
  '世田谷区': [
    { title: '区独自子育て支援給付',   amount: '3万円',       category: '出産',  desc: '出産時に区独自の給付金を支給（国の給付と別途）。' },
    { title: 'こども医療費助成',      amount: '18歳まで無料', category: '医療',  desc: '18歳まで医療費の窓口負担なし（国民健康保険等の適用分）。' },
    { title: '保育所待機児童対策',     amount: '補助あり',    category: '保育',  desc: '認可外保育施設の費用を補助し待機児童問題を軽減。' },
    { title: '多世代交流施設利用',     amount: '無料〜低額',   category: '環境',  desc: '子育て支援センターや児童館を無料〜低額で利用可能。' },
  ],
};

// ─── リフォームガイドデータ ─────────────────────────────────
export const REFORM_TYPES = [
  { id: 'taishin', name: '耐震改修',       emoji: '🏠', maxAmount: '最大150万円', desc: '旧耐震基準（1981年以前）の建物の耐震性能を向上させる工事が対象。', points: ['診断費用も補助対象になる場合あり', '木造・非木造いずれも対象', '専門業者による耐震診断が必要'],    nationalProgram: '住宅の耐震改修促進のための税制（国土交通省）' },
  { id: 'dannetsu', name: '断熱改修',      emoji: '🪟', maxAmount: '最大200万円', desc: '窓・外壁・屋根・床の断熱改修が対象。光熱費削減にも効果的。',          points: ['先進的窓リノベ事業が最大補助', '高性能断熱材の使用が条件', '工事前に交付申請が必要'],          nationalProgram: '先進的窓リノベ2024事業（国土交通省）' },
  { id: 'barrier',  name: 'バリアフリー', emoji: '♿', maxAmount: '最大50万円',  desc: '手すり設置・段差解消・トイレ改修など、高齢者・障害者向けの改修が対象。', points: ['介護保険の住宅改修と組み合わせ可', '市区町村ごとに補助額が異なる', '事前申請が原則必要'],        nationalProgram: '介護保険制度 住宅改修費支給（厚生労働省）' },
  { id: 'shoene',   name: '省エネリフォーム', emoji: '💡', maxAmount: '最大30万円', desc: '給湯器・エコキュート・太陽光発電などの省エネ設備の設置が対象。', points: ['給湯省エネ2024事業の活用で高額補助', 'ZEH基準を満たすと加算あり', '既存住宅のリフォームも対象'], nationalProgram: '給湯省エネ2024事業（経済産業省）' },
];

// ─── 省エネシミュレーターデータ ────────────────────────────
export const ECO_APPLIANCES = [
  { id: 'aircon', name: 'エアコン',  emoji: '❄️',  base: 20000, ages: ['〜5年', '6〜10年', '11年以上'], bonuses: [0, 5000, 10000], note: '省エネ基準達成製品（★5）が対象' },
  { id: 'fridge', name: '冷蔵庫',   emoji: '🧊',  base: 15000, ages: ['〜5年', '6〜10年', '11年以上'], bonuses: [0, 5000, 10000], note: '400L以上の大型が対象になりやすい' },
  { id: 'water',  name: '給湯器',   emoji: '🚿',  base: 30000, ages: ['〜7年', '8〜12年', '13年以上'], bonuses: [0, 8000, 15000], note: 'エコジョーズ・エコキュートが対象' },
  { id: 'wash',   name: '洗濯機',   emoji: '👕',  base: 10000, ages: ['〜5年', '6〜10年', '11年以上'], bonuses: [0, 3000, 7000],  note: 'ドラム式の方が補助額が高い傾向' },
  { id: 'tv',     name: 'テレビ',   emoji: '📺',  base: 8000,  ages: ['〜5年', '6〜10年', '11年以上'], bonuses: [0, 2000, 5000],  note: '省エネ基準達成の4K対応が対象' },
];

// ─── プライバシーポリシーテキスト ────────────────────────────
export const PRIVACY_POLICY = [
  {
    title: '1. 個人情報の取得',
    body: '当サービスは、補助金・助成金アラートの通知サービス提供のため、お名前・メールアドレス・お住まいのエリア情報を取得します。取得は利用者の任意の入力によるものに限り、不正な手段による取得は行いません。',
  },
  {
    title: '2. 利用目的',
    body: '取得した個人情報は、①補助金・助成金情報のメール通知、②サービス改善のための統計分析（個人を特定しない形式）、③重要なお知らせの送付、にのみ使用します。',
  },
  {
    title: '3. 第三者提供',
    body: '法令に基づく開示を除き、利用者の同意なく個人情報を第三者に提供することはありません。ただし、スポンサー広告のクリック先への遷移については、各スポンサー企業のプライバシーポリシーが適用されます。',
  },
  {
    title: '4. 安全管理',
    body: '個人情報の漏洩・滅失・毀損を防止するため、適切なセキュリティ措置を講じます。データは暗号化して保管し、アクセス権限を厳格に管理します。',
  },
  {
    title: '5. 情報の開示・訂正・削除',
    body: '利用者は、ご自身の個人情報の開示・訂正・削除を請求できます。ご希望の方は下記の問い合わせ先までご連絡ください。確認後、速やかに対応いたします。',
  },
  {
    title: '6. Cookieの使用',
    body: '当サービスは、利便性向上のためCookieを使用する場合があります。ブラウザの設定でCookieを無効にすることも可能ですが、一部機能が制限される場合があります。',
  },
  {
    title: '7. お問い合わせ',
    body: '個人情報の取扱いに関するお問い合わせは、メール（info@moraeru-navi.example.com）にてお受けしております。テラデザイン株式会社 個人情報管理担当。',
  },
];
