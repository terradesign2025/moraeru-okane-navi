import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Bell, MapPin, User, ChevronRight, ChevronLeft,
  Heart, Home, Baby, Bike, Map, Award, Sparkles, Star,
  TrendingUp, CheckCircle2, Mail, ArrowRight,
  ExternalLink, Settings, LogOut, Shield, Zap, Trophy, Wrench, Leaf, Info,
  Phone, Lock, Edit3, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  META, ALL_TRENDS, ALL_CITIES, SUBSIDIES, SPONSOR_MAP,
  PICKUP_ITEMS, CHILDCARE_RANKING, CHILDCARE_CITY_SUBSIDIES,
  REFORM_TYPES, ECO_APPLIANCES, PRIVACY_POLICY,
} from './data/master';

const ICON_MAP = { Map, Award, Sparkles, Star, Baby, Heart, Home, Bike, TrendingUp };
const Ic = ({ name, size = 16, className = '' }) => { const Icon = ICON_MAP[name] || Sparkles; return <Icon size={size} className={className} />; };

const ACCENT = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   badge: 'bg-blue-100 text-blue-700',    btn: 'bg-blue-600 hover:bg-blue-700' },
  green:  { bg: 'bg-green-50',  border: 'border-green-100',  badge: 'bg-green-100 text-green-700',  btn: 'bg-green-600 hover:bg-green-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-100', badge: 'bg-purple-100 text-purple-700',btn: 'bg-purple-600 hover:bg-purple-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-100', badge: 'bg-orange-100 text-orange-700',btn: 'bg-orange-500 hover:bg-orange-600' },
};

const MOCK_USER = {
  name: '田中 美咲', email: 'misaki.tanaka@example.com', area: '東京都 八王子市',
  avatarChar: '田', since: '2026年2月15日', age: '34',
};

// 通知データ（subsidyId=該当補助金ID、nullなら一般情報）
const NOTIFICATIONS = [
  { id: 1, type: 'new',  badge: '新着',    title: '省エネ家電補助の受付が開始されました',       sub: '八王子市 › エコ',   time: '今日 10:32', read: false, subsidyId: 105 },
  { id: 2, type: 'warn', badge: '締切',    title: 'ヘルメット補助金の期限まであと14日です',      sub: '八王子市 › 安全',   time: '昨日',       read: false, subsidyId: 101 },
  { id: 3, type: 'new',  badge: '新着',    title: '物価高騰対応子育て手当の申請書類が届きました', sub: '八王子市 › 子育て', time: '2日前',      read: true,  subsidyId: 104 },
  { id: 4, type: 'info', badge: 'お知らせ', title: '先進的窓リノベの予算が50%消化されました',     sub: '全国 › 住まい',     time: '3日前',      read: true,  subsidyId: null },
  { id: 5, type: 'info', badge: 'お知らせ', title: '移住支援金の制度内容が更新されました',        sub: '長野県 › ユニーク', time: '1週間前',    read: true,  subsidyId: null },
];

// 申請期限が今日から1ヶ月以内かチェック
const isDeadlineSoon = (deadlineStr) => {
  if (!deadlineStr) return false;
  const deadline = new Date(deadlineStr);
  const now = new Date('2026-04-27');
  const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 31;
};

const SponsorBanner = ({ sponsor, onDetail }) => {
  const s = ACCENT[sponsor.accent] ?? ACCENT.blue;
  return (
    <div className={`rounded-2xl border ${s.bg} ${s.border} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${s.badge}`}>PR</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{sponsor.badge}</span>
        <span className="text-xs font-bold text-gray-700">{sponsor.companyName}</span>
      </div>
      <p className="text-sm font-semibold text-gray-800 mb-1">{sponsor.catchcopy}</p>
      <p className="text-xs text-gray-500 leading-relaxed mb-3">{sponsor.detail}</p>
      <button onClick={() => onDetail(sponsor)} className={`w-full ${s.btn} text-white text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors`}>
        {sponsor.cta} <ExternalLink size={13} />
      </button>
    </div>
  );
};

const TOPICS_PER_PAGE = 6;

export default function App() {
  const [view, setView]                       = useState('top');
  const [activeTab, setActiveTab]             = useState('all');
  const [selectedPref, setSelectedPref]       = useState('');
  const [selectedCity, setSelectedCity]       = useState('');
  const [selectedSubsidy, setSelectedSubsidy] = useState(null);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [detailBackTo, setDetailBackTo]       = useState('results');
  const [notifRead, setNotifRead]             = useState(new Set());
  const [searchQuery, setSearchQuery]         = useState('');
  const [suggestions, setSuggestions]         = useState([]);
  const [topicsPage, setTopicsPage]           = useState(0);
  const [rankCity, setRankCity]               = useState(null);
  const [ecoAppliance, setEcoAppliance]       = useState(null);
  const [ecoAge, setEcoAge]                   = useState(null);
  const [accountForm, setAccountForm]         = useState({ name: MOCK_USER.name, email: MOCK_USER.email });
  const [userProfile, setUserProfile]         = useState({
    name: '', email: '', age: '',
    hasChildren: false, hasElderly: false, ownsHome: false, usesBike: false,
  });
  const [pushEnabled, setPushEnabled]         = useState(false);
  const searchRef = useRef(null);

  const filteredSubsidies = SUBSIDIES.filter(i => i.condition === 'all' || userProfile[i.condition]);
  const unreadCount = NOTIFICATIONS.filter(n => !notifRead.has(n.id) && !n.read).length;
  const displayedTrends = activeTab === 'all' ? ALL_TRENDS : ALL_TRENDS.filter(t => t.tab === activeTab);
  const totalPages = Math.ceil(displayedTrends.length / TOPICS_PER_PAGE);
  const pagedTrends = displayedTrends.slice(topicsPage * TOPICS_PER_PAGE, (topicsPage + 1) * TOPICS_PER_PAGE);

  const handleSearchInput = (val) => {
    setSearchQuery(val);
    if (!val.trim()) { setSuggestions([]); return; }
    setSuggestions(ALL_CITIES.filter(c => c.city.includes(val.trim()) || c.pref.includes(val.trim())).slice(0, 6));
  };
  const selectSuggestion = (item) => {
    setSelectedPref(item.pref); setSelectedCity(item.city);
    setSearchQuery(''); setSuggestions([]);
    setTimeout(() => setView('condition'), 100);
  };
  const handleCitySelect = (city) => { setSelectedCity(city); setTimeout(() => setView('condition'), 200); };
  const handleSearchExecute = () => {
    if (selectedCity.includes('八王子')) { setView('results'); }
    else { alert(`現在は「八王子市」のサンプルのみ公開中です。\n（${selectedCity}のデータは準備中です）`); }
  };
  const goDetail = (s, backTo = 'results') => { setSelectedSubsidy(s); setDetailBackTo(backTo); setView('detail'); };
  const goSponsor = (s) => { setSelectedSponsor(s); setView('sponsorDetail'); };

  // 通知クリック → 詳細へ or 既読のみ
  const handleNotifClick = (notif) => {
    setNotifRead(prev => new Set([...prev, notif.id]));
    if (notif.subsidyId) {
      const sub = SUBSIDIES.find(s => s.id === notif.subsidyId);
      if (sub) { goDetail(sub, 'notifications'); }
    }
  };

  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSuggestions([]); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setTopicsPage(0); }, [activeTab]);

  const Back = ({ to, label = 'もどる' }) => (
    <button onClick={() => setView(to)} className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-gray-700 mb-4 transition-colors">
      <ChevronLeft size={17} />{label}
    </button>
  );

  const Steps = ({ step }) => {
    const list = [{ id: 'area', l: 'エリア' }, { id: 'condition', l: '条件' }, { id: 'results', l: '結果' }];
    const cur = list.findIndex(s => s.id === step);
    return (
      <div className="flex items-center justify-center mb-5 px-2">
        {list.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm mb-1 ${i < cur ? 'bg-blue-600 text-white' : i === cur ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                {i < cur ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`text-[10px] font-bold ${i <= cur ? 'text-blue-600' : 'text-gray-400'}`}>{s.l}</span>
            </div>
            {i < list.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full ${i < cur ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const TabBar = () => (
    <div className="flex gap-1.5 overflow-x-auto px-4 mb-3">
      {[{id:'all',l:'すべて'},{id:'unique',l:'ユニーク'},{id:'family',l:'子育て'},{id:'home',l:'住まい'},{id:'eco',l:'エコ'}].map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500'}`}>
          {tab.l}
        </button>
      ))}
    </div>
  );

  const TopicCard = ({ item, onClick }) => {
    const isFeatured = item.featured;
    return (
      <button onClick={onClick}
        className={`rounded-2xl p-2.5 text-left transition-all active:scale-95 relative ${isFeatured ? 'bg-orange-50 border-2 border-orange-400 shadow-sm shadow-orange-100' : 'bg-gray-50 border-2 border-gray-300 hover:border-gray-400'}`}>
        {isFeatured && (
          <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">注目</span>
        )}
        <div className={`w-8 h-8 ${item.bg} rounded-xl flex items-center justify-center mb-2`}>
          <Ic name={item.icon} size={15} className={item.color} />
        </div>
        <p className="text-[9px] text-gray-400 font-medium leading-tight mb-0.5 truncate">{item.city}</p>
        <p className={`text-[11px] font-bold leading-snug mb-1 line-clamp-2 ${isFeatured ? 'text-gray-900' : 'text-gray-800'}`}>{item.title}</p>
        <p className={`font-black text-[11px] ${isFeatured ? 'text-orange-500' : 'text-blue-600'}`}>{item.amount}</p>
      </button>
    );
  };

  return (
    <div className="max-w-sm mx-auto bg-gray-50 min-h-screen flex flex-col" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30">
        <div className="flex justify-between items-center">
          <button onClick={() => setView('top')} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
              <span className="text-white font-black text-sm">¥</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-black text-gray-900">もらえるお金ナビ</p>
              <p className="text-[10px] text-gray-400">全国の補助金・助成金</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('notifications')} className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell size={17} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-[9px] text-white w-4 h-4 rounded-full flex items-center justify-center font-black border border-white">{unreadCount}</span>}
            </button>
            <button onClick={() => setView('profile')} className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-blue-200">
              {MOCK_USER.avatarChar}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20">

        {/* TOP */}
        {view === 'top' && (
          <div>
            <section className="bg-white pt-5 pb-5">
              <div className="flex items-center justify-between px-4 mb-3">
                <div className="flex items-center gap-1.5">
                  <Zap size={15} className="text-orange-500 fill-orange-400" />
                  <h2 className="text-sm font-black text-gray-900">全国の注目トピック</h2>
                  <span className="text-[9px] text-orange-500 font-bold bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">オレンジ枠=注目</span>
                </div>
                <button onClick={() => setView('allTopics')} className="text-xs font-bold text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">全て見る →</button>
              </div>
              <TabBar />
              <div className="grid grid-cols-3 gap-2 px-4">
                {displayedTrends.slice(0, 9).map(item => (
                  <TopicCard key={item.id} item={item} onClick={() => setView('allTopics')} />
                ))}
              </div>
              <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">更新日: {META.lastUpdated} ／ 出典: {META.sources[0]} 他</p>
            </section>

            <div className="h-2 bg-gray-100" />

            <section className="bg-white px-4 py-5">
              <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 rounded-2xl p-5 mb-4 overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full mb-3"><Search size={11} /> 無料診断</span>
                  <h2 className="text-white text-xl font-black leading-tight mb-2">あなたの<br />もらえるお金は？</h2>
                  <p className="text-blue-100 text-xs leading-relaxed mb-4">全国3,000以上の補助金・助成金から<br />あなたの条件に合ったものを見つけます</p>
                  <div className="flex gap-4">
                    {[['完全無料', '✓'], ['1分で完了', '✓'], ['登録不要', '✓']].map(([l, i]) => (
                      <div key={l} className="flex items-center gap-1 text-white/80 text-[10px] font-medium">
                        <span className="text-green-300 font-black">{i}</span>{l}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div ref={searchRef} className="relative mb-3">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 gap-2 focus-within:border-blue-400 focus-within:bg-blue-50/60 transition-all">
                  <Search size={16} className="text-gray-400 shrink-0" />
                  <input type="text" placeholder="市区町村を入力（例：八王子）" value={searchQuery}
                    onChange={e => handleSearchInput(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none" />
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden mt-1">
                    {suggestions.map((item, i) => (
                      <button key={i} onClick={() => selectSuggestion(item)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 text-left">
                        <MapPin size={14} className={`shrink-0 ${item.hasData ? 'text-blue-500' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <span className="text-sm font-bold text-gray-900">{item.pref} {item.city}</span>
                          {item.hasData ? <span className="ml-2 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">データあり</span> : <span className="ml-2 text-[10px] text-gray-400">準備中</span>}
                        </div>
                        <ChevronRight size={14} className="text-gray-300" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setView('area')} className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl shadow-sm shadow-blue-200 flex items-center justify-center gap-2 transition-all">
                <MapPin size={16} /> エリアを選んで検索する
              </button>
            </section>

            <div className="h-2 bg-gray-100" />

            <section className="bg-white px-4 py-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5"><Star size={14} className="text-yellow-400 fill-yellow-400" /><h3 className="text-sm font-black text-gray-900">今月のピックアップ</h3></div>
                <button onClick={() => setView('dataInfo')} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"><Info size={11} /> データについて</button>
              </div>
              <p className="text-[10px] text-gray-400 mb-3">各自治体公式発表 + 独自調査（{META.lastUpdated}時点）</p>
              <div className="space-y-2">
                {PICKUP_ITEMS.map(card => {
                  const Icon = ICON_MAP[card.icon] || Sparkles;
                  return (
                    <button key={card.id} onClick={() => setView(card.view)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3 flex items-center gap-3 text-left hover:border-blue-200 hover:bg-blue-50/60 transition-all">
                      <div className={`w-9 h-9 rounded-xl ${card.colClass} flex items-center justify-center shrink-0`}><Icon size={16} /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900">{card.title}</p><p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p></div>
                      <ChevronRight size={14} className="text-gray-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ALL TOPICS with pagination */}
        {view === 'allTopics' && (
          <div className="p-4 pt-5">
            <Back to="top" />
            <div className="flex items-center gap-2 mb-1">
              <Zap size={18} className="text-orange-500 fill-orange-400" />
              <h2 className="text-lg font-black text-gray-900">全国の注目トピック</h2>
            </div>
            <p className="text-[10px] text-gray-400 mb-4">更新日: {META.lastUpdated} ／ オレンジ枠 = 注目度・金額が高い制度</p>
            <TabBar />
            <div className="grid grid-cols-3 gap-2 mb-5">
              {pagedTrends.map(item => <TopicCard key={item.id} item={item} onClick={() => {}} />)}
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mb-5">
                <button onClick={() => setTopicsPage(p => Math.max(0, p - 1))} disabled={topicsPage === 0}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${topicsPage === 0 ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}>
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setTopicsPage(i)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${topicsPage === i ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setTopicsPage(p => Math.min(totalPages - 1, p + 1))} disabled={topicsPage === totalPages - 1}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${topicsPage === totalPages - 1 ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setView('area')} className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
                <Search size={15} /> エリアを検索する
              </button>
              <button onClick={() => setView('top')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
                <Home size={15} /> トップへ戻る
              </button>
            </div>
          </div>
        )}

        {/* STEP 1 */}
        {view === 'area' && (
          <div className="p-4 pt-5">
            <Back to="top" />
            <Steps step="area" />
            <h2 className="text-xl font-black text-gray-900 text-center mb-1">お住まいのエリアは？</h2>
            <p className="text-xs text-gray-400 text-center mb-5">都道府県と市区町村を選んでください</p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-3 bg-gray-50 border-b border-gray-100">
                <p className="text-[10px] font-black text-gray-400 mb-2">都道府県</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {['北海道', '宮城県', '東京都', '神奈川県', '愛知県', '大阪府', '福岡県'].map(pref => (
                    <button key={pref} onClick={() => setSelectedPref(pref)}
                      className={`text-left px-3 py-2.5 rounded-xl font-bold text-sm flex justify-between items-center transition-all ${selectedPref === pref ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-700 hover:border-blue-200'}`}>
                      {pref}{selectedPref === pref && <ChevronRight size={13} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3">
                {!selectedPref ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                    <Map size={36} className="mb-2" /><p className="text-sm text-gray-400">都道府県を選んでください</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] font-black text-blue-600 mb-2">{selectedPref} の市区町村</p>
                    <div className="space-y-1.5">
                      {ALL_CITIES.filter(c => c.pref === selectedPref).map(c => (
                        <button key={c.city} onClick={() => handleCitySelect(c.city)}
                          className="w-full text-left px-3 py-2.5 border border-gray-100 rounded-xl font-bold text-sm text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex justify-between items-center">
                          <span>{c.city}</span>
                          <div className="flex items-center gap-2">
                            {c.hasData && <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">データあり</span>}
                            <ChevronRight size={14} className="text-gray-300" />
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedPref !== '東京都' && <p className="text-xs text-amber-600 mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">※デモ版のため「東京都 › 八王子市」のデータのみ公開中です。</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {view === 'condition' && (
          <div className="p-4 pt-5">
            <Back to="area" />
            <Steps step="condition" />
            <div className="text-center mb-5">
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-full text-xs border border-blue-100 mb-3">
                <MapPin size={11} /> {selectedPref} {selectedCity}
              </span>
              <h2 className="text-xl font-black text-gray-900 mb-1">あなたの状況を教えてください</h2>
              <p className="text-xs text-gray-400">条件に合った補助金のみを絞り込みます</p>
            </div>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <label className="block text-[11px] font-black text-gray-400 mb-2">ご年齢</label>
                <div className="flex items-center gap-3">
                  <input type="number" placeholder="例：35"
                    className="flex-1 border border-gray-200 rounded-xl p-3 text-base bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                    value={userProfile.age} onChange={e => setUserProfile({ ...userProfile, age: e.target.value })} />
                  <span className="text-gray-500 font-bold text-sm">歳</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <label className="block text-[11px] font-black text-gray-400 mb-3">当てはまるもの（複数可）</label>
                <div className="space-y-2">
                  {[
                    { key: 'hasChildren', label: '3歳以下の子供がいる',          Icon: Baby,  cc: 'bg-pink-50 text-pink-500' },
                    { key: 'usesBike',    label: '自転車に乗る',                 Icon: Bike,  cc: 'bg-purple-50 text-purple-500' },
                    { key: 'ownsHome',    label: '持ち家（一戸建て/マンション）', Icon: Home,  cc: 'bg-green-50 text-green-600' },
                    { key: 'hasElderly', label: '高齢者が同居している',          Icon: User,  cc: 'bg-blue-50 text-blue-500' },
                  ].map(({ key, label, Icon, cc }) => (
                    <label key={key} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${userProfile[key] ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${userProfile[key] ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                        {userProfile[key] && <CheckCircle2 size={11} className="text-white" />}
                      </div>
                      <input type="checkbox" className="sr-only" checked={userProfile[key]} onChange={e => setUserProfile({ ...userProfile, [key]: e.target.checked })} />
                      <div className={`w-7 h-7 rounded-lg ${cc} flex items-center justify-center shrink-0`}><Icon size={14} /></div>
                      <span className="text-sm font-semibold text-gray-800">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={handleSearchExecute}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-sm shadow-blue-200 flex items-center justify-center gap-2 transition-all">
                <Sparkles size={17} /> 診断結果を見る
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {view === 'results' && (
          <div className="p-4 pt-5">
            <Back to="condition" />
            <Steps step="results" />
            <div className="bg-gradient-to-br from-blue-600 to-indigo-500 rounded-2xl p-5 mb-5 text-white relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
              <p className="text-blue-200 text-[11px] font-bold mb-1 relative z-10">{selectedCity}</p>
              <h2 className="text-base font-black mb-2 relative z-10">あなたへの該当補助金</h2>
              <div className="flex items-end gap-2 relative z-10">
                <span className="text-4xl font-black">{filteredSubsidies.length}</span>
                <span className="text-blue-200 text-sm font-bold mb-1">件見つかりました</span>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              {filteredSubsidies.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 pt-3.5 pb-2.5 border-b border-gray-50">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">{item.category}</span>
                  </div>
                  <div className="px-4 py-3">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-400 mb-3">{item.desc}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400">支給目安</p>
                        <p className="text-lg font-black text-red-500">{item.amount}</p>
                      </div>
                      <button onClick={() => goDetail(item, 'results')}
                        className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-blue-600 hover:text-white transition-all">
                        詳細を見る <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-4 mb-5 text-center">
              <p className="text-[11px] text-gray-400 font-bold mb-1">地域のお店・企業様へ</p>
              <p className="text-xs text-gray-500 mb-2">補助金と連動した広告枠を受け付けています。</p>
              <button className="text-xs font-bold text-blue-600 border border-blue-200 px-4 py-1.5 rounded-full hover:bg-blue-50 transition-colors">
                スポンサー掲載について問い合わせる
              </button>
            </div>
            <div className="bg-orange-500 text-white rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <Bell className="mb-2" size={26} />
                <h3 className="text-base font-black mb-2">新しい補助金を見逃していませんか？</h3>
                <p className="text-orange-100 text-xs leading-relaxed mb-4">
                  登録しておくとあなたに合った補助金・助成金のお知らせが届きます。<br />
                  補助金は予算上限に達した時点で早い者勝ちとなるので、ぜひ登録してください。
                </p>
                <button onClick={() => setView('register')} className="w-full bg-white hover:bg-orange-50 active:scale-[0.98] text-orange-600 font-bold py-3 rounded-xl transition-all text-sm">
                  無料アラートを設定する →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DETAIL */}
        {view === 'detail' && selectedSubsidy && (
          <div className="p-4 pt-5">
            <Back to={detailBackTo} />
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">{selectedSubsidy.category}</span>
            <h2 className="text-xl font-black text-gray-900 mt-2 mb-4">{selectedSubsidy.title}</h2>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-4 mb-4 flex items-center justify-between">
              <div><p className="text-xs text-gray-400 font-bold mb-1">支給目安</p><p className="text-3xl font-black text-red-500">{selectedSubsidy.amount}</p></div>
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center"><Zap size={22} className="text-red-400" /></div>
            </div>
            <div className="space-y-3 mb-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">制度の概要</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedSubsidy.overview}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">対象条件</p>
                <div className="space-y-2">
                  {selectedSubsidy.eligible.map((e, i) => (
                    <div key={i} className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 shrink-0" /><p className="text-sm text-gray-700">{e}</p></div>
                  ))}
                </div>
              </div>
              <div className={`rounded-2xl border p-4 shadow-sm ${isDeadlineSoon(selectedSubsidy.deadline) ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                <p className={`text-[10px] font-black uppercase tracking-wider mb-1.5 ${isDeadlineSoon(selectedSubsidy.deadline) ? 'text-red-500' : 'text-gray-400'}`}>
                  申請期間 {isDeadlineSoon(selectedSubsidy.deadline) ? '⚠️ まもなく締切！' : ''}
                </p>
                <p className={`text-sm font-bold ${isDeadlineSoon(selectedSubsidy.deadline) ? 'text-red-700' : 'text-gray-800'}`}>{selectedSubsidy.period}</p>
                {isDeadlineSoon(selectedSubsidy.deadline) && (
                  <p className="text-xs text-red-500 mt-1 font-medium">期限まで1ヶ月以内です。お早めにお手続きください。</p>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">申請方法</p>
                <div className="space-y-2.5">
                  {selectedSubsidy.how.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5"><span className="text-white text-[10px] font-black">{i + 1}</span></div>
                      <p className="text-sm text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                <p className="text-[10px] font-black text-gray-400 mb-1">お問い合わせ先</p>
                <p className="text-sm font-bold text-gray-700">{selectedSubsidy.contact}</p>
                <p className="text-[10px] text-gray-400 mt-1">確認日: {selectedSubsidy.lastChecked} ／ 出典: {selectedSubsidy.source}</p>
              </div>
            </div>

            {/* 電子申請リンク */}
            <button
              onClick={() => window.open(selectedSubsidy.applicationUrl, '_blank')}
              className="w-full bg-blue-50 border border-blue-200 text-blue-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mb-3 hover:bg-blue-100 text-sm">
              <ExternalLink size={15} /> 電子申請・詳細はこちら（公式サイト）
            </button>

            {SPONSOR_MAP[selectedSubsidy.id] && (
              <div className="mb-4">
                <p className="text-[11px] text-gray-400 font-bold mb-2">この補助金に対応した地元のお店</p>
                <SponsorBanner sponsor={SPONSOR_MAP[selectedSubsidy.id]} onDetail={goSponsor} />
              </div>
            )}
            <button onClick={() => setView('register')}
              className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
              <Bell size={15} /> この補助金のアラートを設定する
            </button>
          </div>
        )}

        {/* SPONSOR DETAIL */}
        {view === 'sponsorDetail' && selectedSponsor && (() => {
          const s = ACCENT[selectedSponsor.accent] ?? ACCENT.blue;
          return (
            <div className="p-4 pt-5">
              <Back to="detail" />
              <div className={`${s.bg} border ${s.border} rounded-2xl p-5 mb-5`}>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${s.badge} inline-block mb-3`}>PR</span>
                <h2 className="text-lg font-black text-gray-900 mb-1">{selectedSponsor.companyName}</h2>
                <p className="text-sm font-bold text-gray-600 mb-3">{selectedSponsor.catchcopy}</p>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${s.badge}`}>{selectedSponsor.badge}</span>
              </div>
              <div className="space-y-3 mb-5">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 mb-3">店舗情報</p>
                  {[{ Icon: MapPin, text: selectedSponsor.address }, { Icon: Phone, text: selectedSponsor.tel }, { Icon: CheckCircle2, text: selectedSponsor.hours }].map(({ Icon, text }, i) => (
                    <div key={i} className="flex items-start gap-3 mb-2"><Icon size={14} className="text-gray-400 mt-0.5 shrink-0" /><p className="text-sm text-gray-700">{text}</p></div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 mb-2">詳細</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedSponsor.detail}</p>
                </div>
              </div>
              <button className={`w-full ${s.btn} text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm mb-2`}>
                <Phone size={15} /> 電話で問い合わせる
              </button>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl text-sm transition-all">地図を開く</button>
            </div>
          );
        })()}

        {/* PICKUP 1: 子育てランキング */}
        {view === 'pickup1' && (
          <div className="p-4 pt-5">
            <Back to="top" />
            <div className="flex items-center gap-2 mb-1"><Trophy size={20} className="text-yellow-500" /><h2 className="text-lg font-black text-gray-900">子育て支援 充実エリアランキング</h2></div>
            <p className="text-[10px] text-gray-400 mb-5">2026年版 ／ 各自治体公式発表 + 独自調査（{META.lastUpdated}時点）タップで詳細を確認</p>

            {!rankCity ? (
              <>
                {/* 水平スクロールカード */}
                <div className="space-y-3">
                  {CHILDCARE_RANKING.map(item => (
                    <button key={item.rank} onClick={() => setRankCity(item)}
                      className={`w-full text-left bg-white rounded-2xl border p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all ${item.rank === 1 ? 'border-yellow-300 bg-yellow-50/30' : item.rank <= 3 ? 'border-gray-200' : 'border-gray-100'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${item.rank === 1 ? 'bg-yellow-400 text-white' : item.rank === 2 ? 'bg-gray-300 text-white' : item.rank === 3 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-500'}`}>{item.rank}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-black text-gray-900">{item.pref} {item.city}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.rank <= 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{item.tag}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-gray-600">総合スコア</span>
                            <span className="text-sm font-black text-blue-600">{item.score}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.score}%` }} /></div>
                          </div>
                          {/* 水平タグ表示 */}
                          <div className="flex overflow-x-auto gap-1" style={{ scrollbarWidth: 'none' }}>
                            {item.highlights.map((h, i) => <span key={i} className="whitespace-nowrap text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">{h}</span>)}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-[11px] text-gray-500 leading-relaxed">※ スコアは独自基準（医療費助成・育児用品支援・保育所充実度・出産祝い金・子育て相談体制）を総合評価したものです。{META.lastUpdated}時点。</p>
                </div>
              </>
            ) : (
              /* 都市詳細 */
              <div>
                <button onClick={() => setRankCity(null)} className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-gray-700 mb-4 transition-colors">
                  <ChevronLeft size={17} /> ランキング一覧に戻る
                </button>
                <div className={`rounded-2xl p-4 mb-5 ${rankCity.rank === 1 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-blue-50 border border-blue-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${rankCity.rank === 1 ? 'bg-yellow-400 text-white' : rankCity.rank === 2 ? 'bg-gray-300 text-white' : rankCity.rank === 3 ? 'bg-orange-300 text-white' : 'bg-blue-200 text-blue-800'}`}>{rankCity.rank}</div>
                    <div>
                      <p className="text-lg font-black text-gray-900">{rankCity.pref} {rankCity.city}</p>
                      <p className="text-xs text-gray-500">総合スコア: <span className="font-black text-blue-600">{rankCity.score}</span></p>
                    </div>
                  </div>
                </div>
                <h3 className="text-sm font-black text-gray-900 mb-3">主な子育て支援制度</h3>
                <div className="space-y-3 mb-5">
                  {(CHILDCARE_CITY_SUBSIDIES[rankCity.city] || []).map((sub, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{sub.category}</span>
                          <h4 className="font-bold text-gray-900 text-sm mt-1">{sub.title}</h4>
                        </div>
                        <p className="text-base font-black text-red-500 shrink-0 ml-2">{sub.amount}</p>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{sub.desc}</p>
                      {sub.period && <p className="text-[10px] text-gray-400 mt-1">対象期間: {sub.period}</p>}
                    </div>
                  ))}
                </div>
                <button onClick={() => setView('area')} className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
                  <Search size={15} /> お住まいの補助金を調べる
                </button>
              </div>
            )}
          </div>
        )}

        {/* PICKUP 2: リフォームガイド */}
        {view === 'pickup2' && (
          <div className="p-4 pt-5">
            <Back to="top" />
            <div className="flex items-center gap-2 mb-1"><Wrench size={20} className="text-green-600" /><h2 className="text-lg font-black text-gray-900">リフォーム補助金 まるわかりガイド</h2></div>
            <p className="text-[10px] text-gray-400 mb-5">出典: 国土交通省・経済産業省（{META.lastUpdated}時点）</p>
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-4 mb-5 text-white relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
              <p className="text-green-100 text-xs mb-1 relative z-10">補助金 合計（最大）</p>
              <p className="text-3xl font-black relative z-10">430万円</p>
              <p className="text-green-200 text-xs mt-1 relative z-10">複数制度の組み合わせで高額補助も可能</p>
            </div>
            <div className="space-y-3 mb-5">
              {REFORM_TYPES.map(type => (
                <div key={type.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{type.emoji}</span>
                    <div><h3 className="font-black text-gray-900 text-sm">{type.name}</h3><span className="text-red-500 font-black text-base">{type.maxAmount}</span></div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">{type.desc}</p>
                  <div className="space-y-1 mb-3">{type.points.map((p, i) => (<div key={i} className="flex items-start gap-2"><CheckCircle2 size={12} className="text-green-500 mt-0.5 shrink-0" /><p className="text-xs text-gray-600">{p}</p></div>))}</div>
                  <div className="bg-gray-50 rounded-xl p-2.5"><p className="text-[10px] text-gray-400 font-bold">国の制度</p><p className="text-xs font-bold text-blue-700">{type.nationalProgram}</p></div>
                </div>
              ))}
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-4">
              <h4 className="text-sm font-black text-gray-900 mb-2">申請の基本的な流れ</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {['事前申請', '工事実施', '完了報告', '補助金交付'].map((step, i, arr) => (
                  <React.Fragment key={step}><span className="text-xs font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full">{step}</span>{i < arr.length - 1 && <ArrowRight size={12} className="text-orange-300" />}</React.Fragment>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-2">※ 多くの制度で着工前申請が必要です。</p>
            </div>
            <button onClick={() => setView('area')} className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
              <Search size={15} /> お住まいの補助金を調べる
            </button>
          </div>
        )}

        {/* PICKUP 3: 省エネシミュレーター */}
        {view === 'pickup3' && (
          <div className="p-4 pt-5">
            <Back to="top" />
            <div className="flex items-center gap-2 mb-1"><Leaf size={20} className="text-blue-500" /><h2 className="text-lg font-black text-gray-900">省エネ家電 補助額シミュレーター</h2></div>
            <p className="text-[10px] text-gray-400 mb-5">参考: 経済産業省 補助金ポータル（{META.lastUpdated}時点の目安額）</p>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
              <p className="text-xs font-black text-gray-500 mb-3">① 買い替える家電を選んでください</p>
              <div className="grid grid-cols-3 gap-2">
                {ECO_APPLIANCES.map(a => (
                  <button key={a.id} onClick={() => { setEcoAppliance(a); setEcoAge(null); }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${ecoAppliance?.id === a.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-blue-200'}`}>
                    <p className="text-2xl mb-1">{a.emoji}</p><p className="text-xs font-bold text-gray-800">{a.name}</p>
                  </button>
                ))}
              </div>
            </div>
            {ecoAppliance && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
                <p className="text-xs font-black text-gray-500 mb-3">② 現在の{ecoAppliance.name}の年式</p>
                <div className="grid grid-cols-3 gap-2">
                  {ecoAppliance.ages.map((age, i) => (
                    <button key={i} onClick={() => setEcoAge(i)}
                      className={`py-3 rounded-xl border-2 text-center transition-all text-sm font-bold ${ecoAge === i ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-blue-200'}`}>
                      {age}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">※ {ecoAppliance.note}</p>
              </div>
            )}
            {ecoAppliance && ecoAge !== null && (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-500 rounded-2xl p-5 text-white relative overflow-hidden mb-4">
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
                <p className="text-blue-200 text-xs mb-1 relative z-10">{ecoAppliance.emoji} {ecoAppliance.name} の買い替え補助（目安）</p>
                <p className="text-4xl font-black relative z-10 mb-1">{((ecoAppliance.base + ecoAppliance.bonuses[ecoAge]) / 10000).toFixed(1)}万円</p>
                <p className="text-blue-200 text-xs relative z-10">基本額 {(ecoAppliance.base / 10000).toFixed(1)}万 + 年式加算 {(ecoAppliance.bonuses[ecoAge] / 10000).toFixed(1)}万</p>
                <p className="text-[10px] text-blue-300 mt-3 relative z-10">※ 実際の補助額はお住まいの自治体・製品スペックにより異なります。</p>
              </div>
            )}
            <button onClick={() => setView('area')} className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
              <Search size={15} /> お住まいの正確な補助額を調べる
            </button>
          </div>
        )}

        {/* DATA INFO */}
        {view === 'dataInfo' && (
          <div className="p-4 pt-5">
            <Back to="top" />
            <h2 className="text-lg font-black text-gray-900 mb-5">データについて</h2>
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-[11px] font-black text-gray-400 mb-2">更新情報</p>
                {[{ l: '最終更新日', v: META.lastUpdated }, { l: '次回更新予定', v: META.nextUpdate + '（毎月27日）' }, { l: 'バージョン', v: META.version }, { l: 'データ収録都市数', v: `${META.completedCities}市区町村（Phase1）` }].map(({ l, v }) => (
                  <div key={l} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500">{l}</span><span className="text-xs font-bold text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-[11px] font-black text-gray-400 mb-2">データソース</p>
                <div className="space-y-1.5">{META.sources.map((src, i) => (<div key={i} className="flex items-start gap-2"><CheckCircle2 size={12} className="text-blue-500 mt-0.5 shrink-0" /><p className="text-xs text-gray-700">{src}</p></div>))}</div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-[11px] font-black text-blue-700 mb-1">Excelマスター管理</p>
                <p className="text-xs text-gray-600 leading-relaxed">data/ フォルダ内CSVで管理。<br />master_trends.csv ／ master_subsidies.csv ／ master_cities.csv</p>
              </div>
              <p className="text-[10px] text-gray-400 text-center leading-relaxed px-2">申請前に必ず各自治体窓口にご確認ください。</p>
            </div>
          </div>
        )}

        {/* REGISTER */}
        {view === 'register' && (
          <div className="p-4 pt-5">
            <Back to="results" />
            <div className="mb-5">
              <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center mb-3"><Bell size={20} className="text-orange-500" /></div>
              <h2 className="text-xl font-black text-gray-900 mb-1">無料アラート登録</h2>
              <p className="text-xs text-gray-400">あなたに合った補助金情報をいち早くお届けします</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4 mb-4">
              {[
                { key: 'name',  label: 'お名前',        type: 'text',  Icon: User, ph: '田中 美咲' },
                { key: 'email', label: 'メールアドレス', type: 'email', Icon: Mail, ph: 'taro@example.com' },
              ].map(({ key, label, type, Icon, ph }) => (
                <div key={key}>
                  <label className="block text-[11px] font-black text-gray-400 mb-1.5">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400"><Icon size={14} /></span>
                    <input type={type} placeholder={ph}
                      className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                      value={userProfile[key] || ''} onChange={e => setUserProfile({ ...userProfile, [key]: e.target.value })} />
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-black text-gray-400 mb-1.5">ご年齢（任意）</label>
                <div className="flex items-center gap-3">
                  <input type="number" placeholder="例：34"
                    className="flex-1 border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                    value={userProfile.age || ''} onChange={e => setUserProfile({ ...userProfile, age: e.target.value })} />
                  <span className="text-gray-500 text-sm font-bold">歳</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center mb-4">登録することで<span className="text-blue-600 font-bold">利用規約</span>・<span className="text-blue-600 font-bold">プライバシーポリシー</span>に同意したものとみなされます</p>
            <button onClick={() => setView('success')} className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-sm shadow-orange-200 transition-all">登録を完了する</button>
          </div>
        )}

        {/* SUCCESS */}
        {view === 'success' && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-5"><CheckCircle2 size={44} /></div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">登録完了！</h2>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm max-w-xs w-full text-left mb-8">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-bold text-blue-600">{userProfile.name || 'ゲスト'}</span> さん、設定が完了しました。<br /><br />
                <span className="font-bold">{selectedCity || '登録エリア'}</span> で新しい補助金が発表された際、<span className="font-bold border-b border-gray-300">{userProfile.email || '登録アドレス'}</span> 宛にいち早くお知らせします。
              </p>
            </div>
            <button onClick={() => { setView('top'); setSelectedPref(''); setSelectedCity(''); }} className="font-bold text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-full hover:bg-blue-50 transition-colors text-sm">トップへ戻る</button>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {view === 'notifications' && (
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <button onClick={() => setView('top')} className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors"><ChevronLeft size={17} /></button>
                <h2 className="text-lg font-black text-gray-900">通知</h2>
              </div>
              <button onClick={() => setNotifRead(new Set(NOTIFICATIONS.map(n => n.id)))} className="text-xs font-bold text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">すべて既読</button>
            </div>
            <div className="space-y-2">
              {NOTIFICATIONS.map(notif => {
                const isRead = notifRead.has(notif.id) || notif.read;
                const isClickable = !!notif.subsidyId;
                return (
                  <button key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full text-left bg-white rounded-2xl border p-4 transition-all ${isRead ? 'border-gray-100' : 'border-blue-100 bg-blue-50/30'} ${isClickable ? 'hover:border-blue-300 hover:shadow-sm' : 'cursor-default'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${isRead ? 'bg-gray-200' : 'bg-blue-500'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${notif.type === 'new' ? 'bg-blue-100 text-blue-700' : notif.type === 'warn' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{notif.badge}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{notif.time}</span>
                          {isClickable && <span className="text-[9px] text-blue-400 font-bold">詳細を見る →</span>}
                        </div>
                        <p className={`text-sm font-bold leading-snug ${isRead ? 'text-gray-600' : 'text-gray-900'}`}>{notif.title}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{notif.sub}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PROFILE */}
        {view === 'profile' && (
          <div className="p-4 pt-5">
            <Back to="top" />
            <div className="bg-gradient-to-br from-blue-600 to-indigo-500 rounded-2xl p-5 mb-5 text-white relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black border border-white/20">{MOCK_USER.avatarChar}</div>
                <div><p className="text-lg font-black">{MOCK_USER.name}</p><p className="text-blue-200 text-xs">{MOCK_USER.email}</p><p className="text-blue-200 text-[10px] mt-0.5">登録日：{MOCK_USER.since}</p></div>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><p className="text-[10px] font-black text-gray-400">登録エリア</p></div>
                <div className="px-4 py-3 flex items-center gap-2"><MapPin size={14} className="text-blue-500" /><p className="text-sm font-bold text-gray-900">{MOCK_USER.area}</p></div>
              </div>
              {/* アラート設定（メール + プッシュのみ） */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><p className="text-[10px] font-black text-gray-400">アラート設定</p></div>
                <div className="divide-y divide-gray-50">
                  {/* メール通知（常時オン） */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div><p className="text-sm font-bold text-gray-900">メール通知</p><p className="text-[11px] text-gray-400">{MOCK_USER.email}</p></div>
                    <div className="w-10 h-5 rounded-full flex items-center px-0.5 bg-blue-600">
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm translate-x-5" />
                    </div>
                  </div>
                  {/* プッシュ通知（トグル可能） */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div><p className="text-sm font-bold text-gray-900">プッシュ通知</p><p className="text-[11px] text-gray-400">このブラウザ・アプリに通知</p></div>
                      <button onClick={() => setPushEnabled(v => !v)} className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all ${pushEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${pushEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    {!pushEnabled && (
                      <button onClick={() => setPushEnabled(true)} className="w-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold py-2 rounded-xl hover:bg-blue-100 transition-colors">
                        プッシュ通知を許可する
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><p className="text-[10px] font-black text-gray-400">登録中の補助金アラート</p></div>
                <div className="divide-y divide-gray-50">
                  {[{ title: '省エネ家電買い替え補助', city: '八王子市', cc: 'bg-green-100 text-green-700' }, { title: '物価高騰対応子育て手当', city: '八王子市', cc: 'bg-blue-100 text-blue-700' }, { title: '移住支援金', city: '長野県', cc: 'bg-emerald-100 text-emerald-700' }].map((item, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <div><p className="text-sm font-bold text-gray-900">{item.title}</p><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.cc}`}>{item.city}</span></div>
                      <Bell size={13} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <button onClick={() => setView('accountSettings')} className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <Settings size={16} className="text-gray-600" /><span className="text-sm font-bold text-gray-600">アカウント設定</span><ChevronRight size={14} className="text-gray-300 ml-auto" />
              </button>
              <button onClick={() => setView('privacy')} className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <Shield size={16} className="text-gray-600" /><span className="text-sm font-bold text-gray-600">プライバシーポリシー</span><ChevronRight size={14} className="text-gray-300 ml-auto" />
              </button>
              <button className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <LogOut size={16} className="text-red-500" /><span className="text-sm font-bold text-red-500">ログアウト</span>
              </button>
            </div>
          </div>
        )}

        {/* ACCOUNT SETTINGS */}
        {view === 'accountSettings' && (
          <div className="p-4 pt-5">
            <Back to="profile" />
            <div className="flex items-center gap-2 mb-5">
              <Settings size={20} className="text-gray-600" />
              <h2 className="text-lg font-black text-gray-900">アカウント設定</h2>
            </div>
            <div className="space-y-3 mb-5">
              {/* 基本情報 */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><p className="text-[10px] font-black text-gray-400">基本情報</p></div>
                <div className="p-4 space-y-4">
                  {[
                    { key: 'name',  label: 'お名前',        Icon: User, type: 'text'  },
                    { key: 'email', label: 'メールアドレス', Icon: Mail, type: 'email' },
                  ].map(({ key, label, Icon, type }) => (
                    <div key={key}>
                      <label className="block text-[11px] font-black text-gray-400 mb-1.5">{label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400"><Icon size={14} /></span>
                        <input type={type}
                          className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                          value={accountForm[key]}
                          onChange={e => setAccountForm({ ...accountForm, [key]: e.target.value })} />
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 mb-1.5">登録エリア</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700 flex-1">{MOCK_USER.area}</span>
                      <button onClick={() => setView('area')} className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors">変更</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* パスワード変更 */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><p className="text-[10px] font-black text-gray-400">セキュリティ</p></div>
                <div className="p-4 space-y-3">
                  {[
                    { label: '現在のパスワード', ph: '現在のパスワード' },
                    { label: '新しいパスワード', ph: '8文字以上' },
                    { label: 'パスワード確認',   ph: '再入力' },
                  ].map(({ label, ph }) => (
                    <div key={label}>
                      <label className="block text-[11px] font-black text-gray-400 mb-1.5">{label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400"><Lock size={14} /></span>
                        <input type="password" placeholder={ph} className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-sm shadow-blue-200 transition-all mb-3">
              変更を保存する
            </button>
            <button className="w-full bg-white border border-red-200 text-red-500 font-bold py-3 rounded-xl text-sm hover:bg-red-50 transition-colors">
              アカウントを削除する
            </button>
          </div>
        )}

        {/* PRIVACY POLICY */}
        {view === 'privacy' && (
          <div className="p-4 pt-5">
            <Back to="profile" />
            <div className="flex items-center gap-2 mb-2">
              <Shield size={20} className="text-gray-600" />
              <h2 className="text-lg font-black text-gray-900">プライバシーポリシー</h2>
            </div>
            <p className="text-[10px] text-gray-400 mb-5">制定日: 2026年1月1日 ／ テラデザイン株式会社</p>
            <div className="space-y-3">
              {PRIVACY_POLICY.map((section, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <h4 className="text-sm font-black text-gray-900 mb-2">{section.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{section.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
              <p className="text-[11px] text-gray-400">もらえるお金ナビ / テラデザイン株式会社<br />info@moraeru-navi.example.com</p>
            </div>
          </div>
        )}

      </main>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-gray-100 fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-16 flex items-center justify-around px-6 z-20">
        {[
          { id: 'top',           Icon: Home,   label: 'ホーム',    vs: ['top', 'allTopics', 'pickup1', 'pickup2', 'pickup3', 'dataInfo'] },
          { id: 'area',          Icon: Search, label: 'さがす',    vs: ['area', 'condition', 'results', 'detail', 'sponsorDetail'] },
          { id: 'notifications', Icon: Bell,   label: '通知',      vs: ['notifications'] },
          { id: 'profile',       Icon: User,   label: 'マイページ', vs: ['profile', 'register', 'success', 'accountSettings', 'privacy'] },
        ].map(({ id, Icon, label, vs }) => {
          const isActive = vs.includes(view);
          return (
            <button key={id} onClick={() => setView(id)}
              className={`flex flex-col items-center gap-0.5 relative transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
              {id === 'notifications' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-[8px] text-white w-4 h-4 rounded-full flex items-center justify-center font-black">{unreadCount}</span>
              )}
              <Icon size={21} /><span className="text-[10px] font-bold">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
