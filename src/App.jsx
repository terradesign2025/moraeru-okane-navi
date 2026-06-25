import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Bell, MapPin, User, ChevronRight, ChevronLeft,
  Heart, Home, Baby, Bike, Map, Award, Sparkles, Star,
  TrendingUp, CheckCircle2, Mail, ArrowRight,
  ExternalLink, Settings, LogOut, Shield, Zap, Trophy, Wrench, Leaf, Info,
  Phone, Lock, ChevronUp, Plane, MoveRight, BookOpen,
} from 'lucide-react';
import {
  META, ALL_TRENDS, ALL_CITIES, SUBSIDIES, CITY_RECYCLERS, SPONSOR_INQUIRY_EMAIL,
  PICKUP_ITEMS, CHILDCARE_RANKING, CHILDCARE_CITY_SUBSIDIES,
  REFORM_TYPES, ECO_APPLIANCES, PRIVACY_POLICY,
} from './data/master';

// 移住支援金データ（SUBSIDIESから移住関連を抽出・重複ID除去）
const IJYU_SUBSIDIES = (() => {
  const seen = new Set();
  return SUBSIDIES.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return (s.title && s.title.includes('移住')) || (s.desc && s.desc.includes('移住'));
  }).slice(0, 60);
})();

// 移住先都道府県別の最高額をまとめる
const IJYU_PREF_SUMMARY = (() => {
  const map = {};
  IJYU_SUBSIDIES.forEach(s => {
    if (!map[s.pref]) map[s.pref] = { pref: s.pref, cities: [], maxAmount: '' };
    if (!map[s.pref].cities.includes(s.city)) map[s.pref].cities.push(s.city);
    if (!map[s.pref].maxAmount && s.amount && s.amount.includes('万円')) map[s.pref].maxAmount = s.amount;
  });
  return Object.values(map).filter(p => p.cities.length > 0).slice(0, 12);
})();

const ICON_MAP = { Map, Award, Sparkles, Star, Baby, Heart, Home, Bike, TrendingUp };
const Ic = ({ name, size = 16, className = '' }) => { const Icon = ICON_MAP[name] || Sparkles; return <Icon size={size} className={className} />; };

// 「あてはまるもの」追加条件（補助金タイトルのキーワードで自動判定）
// condition='all' のデータでも、下記キーワードを含む制度は該当条件のチェック時のみ表示する
const KEYWORD_CONDITIONS = {
  isNewlywed:     /結婚|新婚/,
  isPregnant:     /妊娠|妊婦|出産|不妊/,
  isRelocating:   /移住|定住/,
  isSingleParent: /ひとり親|母子|父子/,
  hasDisability:  /障害|障がい/,
};

// 国土地理院 muni.js（市区町村コード→名称マップ）を遅延ロード
let _gsiMuniPromise = null;
const loadGsiMuniMap = () => {
  if (!_gsiMuniPromise) {
    _gsiMuniPromise = new Promise((resolve) => {
      if (window.GSI?.MUNI_ARRAY) return resolve(window.GSI.MUNI_ARRAY);
      const s = document.createElement('script');
      s.src = 'https://maps.gsi.go.jp/js/muni.js';
      s.onload = () => resolve(window.GSI?.MUNI_ARRAY || null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }
  return _gsiMuniPromise;
};

const REGION_MAP = {
  '関東':       { emoji: '🗼', img: '/images/icons/region-kanto.png',           color: 'bg-blue-600',   prefs: ['茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県'], hasData: true },
  '北海道・東北': { emoji: '❄️', img: '/images/icons/region-tohoku.png',          color: 'bg-sky-500',    prefs: ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県'], hasData: true },
  '中部':       { emoji: '⛰️', img: '/images/icons/region-chubu.png',           color: 'bg-green-600',  prefs: ['新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県'], hasData: true },
  '近畿':       { emoji: '🏯', img: '/images/icons/region-kinki.png',           color: 'bg-orange-500', prefs: ['滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県'], hasData: true },
  '中国・四国': { emoji: '🌊', img: '/images/icons/region-chugoku-shikoku.png', color: 'bg-teal-500',   prefs: ['鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県'], hasData: true },
  '九州・沖縄': { emoji: '🌺', img: '/images/icons/region-kyushu-okinawa.png',  color: 'bg-pink-500',   prefs: ['福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'], hasData: true },
};

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
  const now = new Date();
  const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 31;
};

// period が [終了] または [期限確認中] で始まるかチェック
const isExpiredPeriod = (period) => period && (period.startsWith('[終了]') || period.startsWith('[期限確認中]'));
const isCheckingPeriod = (period) => period && period.startsWith('[期限確認中]');

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
  const [selectedTrend, setSelectedTrend]     = useState(null);
  const [accountForm, setAccountForm]         = useState({ name: MOCK_USER.name, email: MOCK_USER.email, area: MOCK_USER.area });
  const [account, setAccount]                 = useState({ name: MOCK_USER.name, email: MOCK_USER.email, area: MOCK_USER.area });
  const [accountSaved, setAccountSaved]       = useState(false);
  const [userProfile, setUserProfile]         = useState({
    name: '', email: '', age: '',
    hasChildren: false, hasElderly: false, ownsHome: false, usesBike: false,
    isNewlywed: false, isPregnant: false, isRelocating: false, isSingleParent: false, hasDisability: false,
  });
  const [pushEnabled, setPushEnabled]         = useState(false);
  const [registerBackTo, setRegisterBackTo]   = useState('results');
  const [selectedRegion, setSelectedRegion]   = useState('');
  const [dataNotReadyMsg, setDataNotReadyMsg] = useState('');
  const [gpsState, setGpsState]               = useState('idle'); // 'idle'|'loading'|'found'|'error'|'notfound'
  const [gpsFoundCity, setGpsFoundCity]       = useState('');
  const [showScrollTop, setShowScrollTop]     = useState(false);
  const searchRef = useRef(null);
  const cityListRef = useRef(null);

  const filteredSubsidies = SUBSIDIES
    .filter(i => !selectedCity || i.city === selectedCity)
    .filter(i => {
      if (i.condition !== 'all') return !!userProfile[i.condition];
      // condition='all' でもタイトルがキーワード条件に該当する場合はチェック時のみ表示
      const kw = Object.entries(KEYWORD_CONDITIONS).find(([, re]) => re.test(i.title || ''));
      return kw ? !!userProfile[kw[0]] : true;
    });

  // TOP画面PR枠：初回マウント時にランダムで市区を固定
  const [topPrCity] = useState(() => {
    const cities = Object.keys(CITY_RECYCLERS).filter(c => CITY_RECYCLERS[c].recommended?.length > 0);
    return cities.length > 0 ? cities[Math.floor(Math.random() * cities.length)] : '八王子市';
  });
  // 全ページ共通スポンサー：市区選択中はその市区、未選択はランダム固定
  const sponsorCity = (selectedCity && CITY_RECYCLERS[selectedCity]) ? selectedCity : topPrCity;
  const currentSponsor = CITY_RECYCLERS[sponsorCity] ?? CITY_RECYCLERS['八王子市'];

  // 全ページに表示するスポンサー枠コンポーネント
  const GlobalSponsorBlock = ({ compact = false }) => {
    if (!currentSponsor) return null;
    const sp = currentSponsor.sponsor;
    const recs = currentSponsor.recommended || [];
    return (
      <div className="px-4 py-4 bg-gray-50">
        {/* メインスポンサー（契約者がいる場合のみ表示） */}
        {sp && (
          <div className={`bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl ${compact ? 'p-4' : 'p-5'} mb-3 text-white relative overflow-hidden shadow-md shadow-emerald-200`}>
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white text-emerald-700">PR</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">{sponsorCity} スポンサー</span>
              </div>
              <h3 className="text-base font-black mb-1 flex items-center gap-2">💰 {sp.name}</h3>
              <p className="text-sm font-bold mb-1.5">{sp.catchcopy}</p>
              {!compact && <p className="text-emerald-50 text-xs leading-relaxed mb-3">{sp.detail}</p>}
              <a href={sp.url} target="_blank" rel="noopener noreferrer"
                className="block w-full bg-white text-emerald-600 hover:bg-emerald-50 font-black py-2.5 rounded-xl text-xs text-center transition-all">
                詳細・無料相談はこちら <ExternalLink size={11} className="inline ml-1" />
              </a>
            </div>
          </div>
        )}
        {/* PR：エリアのお金のプロ */}
        {recs.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
            <p className="text-[10px] font-black text-gray-400 mb-2 px-1">🏢 {sponsorCity} のおすすめ企業</p>
            <div className="space-y-1.5">
              {recs.slice(0, 3).map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">PR</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{r.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{r.tag}</p>
                  </div>
                  <ExternalLink size={10} className="text-gray-300 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
        {/* PR枠募集（FP・税理士・社労士向け） */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black bg-white text-blue-600 px-2 py-0.5 rounded">PR枠</span>
            <span className="text-xs font-bold opacity-90">{sponsorCity} エリア</span>
          </div>
          <p className="text-sm font-black mb-1">💼 FP・税理士・社労士の方へ<br/>PR掲載のご案内</p>
          <p className="text-[11px] text-blue-100 mb-3 leading-relaxed">補助金を調べている{sponsorCity}エリアのユーザーへ、あなたのサービスを届けませんか。地域密着の士業・専門家の方を募集しています。</p>
          <div className="flex gap-2">
            <a href={`mailto:${SPONSOR_INQUIRY_EMAIL}?subject=${encodeURIComponent(`【PR掲載】${sponsorCity}の掲載について`)}&body=${encodeURIComponent('もらえるお金ナビ PR掲載問い合わせ\n\n事務所名：\nご担当者：\n対象エリア：' + sponsorCity + '\nご質問・ご要望：\n')}`}
              className="flex-1 bg-white text-blue-700 font-black text-xs py-2 rounded-lg text-center hover:bg-blue-50 transition-colors">
              メールで問い合わせ
            </a>
            <a href={`/sponsor_lp.html?city=${encodeURIComponent(sponsorCity)}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 bg-blue-500 text-white font-black text-xs py-2 rounded-lg text-center border border-blue-400 hover:bg-blue-400 transition-colors">
              詳細を見る <ExternalLink size={10} className="inline ml-0.5" />
            </a>
          </div>
        </div>
      </div>
    );
  };
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

  const handleGpsLocate = () => {
    if (!navigator.geolocation) { setGpsState('error'); return; }
    setGpsState('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // 第1候補: 国土地理院 逆ジオコーダ（日本国内特化・利用制限が緩い）
          let rawPref = '';
          let rawCity = '';
          try {
            const res = await fetch(`https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const muniCd = data?.results?.muniCd;
            if (muniCd) {
              const muniMap = await loadGsiMuniMap();
              const entry = muniMap?.[String(parseInt(muniCd, 10))];
              if (entry) {
                const parts = entry.split(',');
                rawPref = parts[1] || '';
                rawCity = (parts[3] || '').replace(/[\s　]/g, '');
              }
            }
          } catch { /* GSI失敗時は下のNominatimフォールバックへ */ }
          // 第2候補（フォールバック）: Nominatim
          if (!rawCity) {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ja`
            );
            const data = await res.json();
            const addr = data.address || {};
            rawPref = addr.state || '';
            rawCity = addr.city || addr.town || addr.county || addr.municipality || '';
          }
          // ALL_CITIES から一致する市区を探す（前方一致・部分一致含む）
          const cityMatch = ALL_CITIES.find(c =>
            c.city === rawCity ||
            rawCity.startsWith(c.city) ||
            c.city.startsWith(rawCity)
          ) || ALL_CITIES.find(c =>
            (rawPref && c.pref.includes(rawPref.replace(/[都道府県]$/, ''))) &&
            rawCity.includes(c.city.replace(/[市区町村]$/, ''))
          );
          // REGION_MAP から地方を特定
          const regionEntry = Object.entries(REGION_MAP).find(([, info]) =>
            info.prefs.some(p => rawPref.includes(p.replace(/[都道府県]$/, '')) || p.includes(rawPref.replace(/[都道府県]$/, '')))
          );
          if (cityMatch) {
            const re = Object.entries(REGION_MAP).find(([, info]) => info.prefs.includes(cityMatch.pref));
            if (re) setSelectedRegion(re[0]);
            setSelectedPref(cityMatch.pref);
            setSelectedCity(cityMatch.city);
            setGpsFoundCity(cityMatch.city);
            setGpsState('found');
            setTimeout(() => setView('condition'), 800);
          } else if (regionEntry) {
            setSelectedRegion(regionEntry[0]);
            const prefMatch = regionEntry[1].prefs.find(p =>
              rawPref.includes(p.replace(/[都道府県]$/, '')) || p.includes(rawPref.replace(/[都道府県]$/, ''))
            );
            if (prefMatch) setSelectedPref(prefMatch);
            setGpsFoundCity(rawCity || rawPref);
            setGpsState('notfound');
          } else {
            setGpsState('error');
          }
        } catch {
          setGpsState('error');
        }
      },
      () => setGpsState('error'),
      { timeout: 10000, maximumAge: 60000 }
    );
  };
  const handleSearchExecute = () => {
    const cityRow = ALL_CITIES.find(c => c.pref === selectedPref && c.city === selectedCity);
    if (cityRow?.hasData) { setDataNotReadyMsg(''); setView('results'); }
    else { setDataNotReadyMsg(`「${selectedCity}」はComing Soon（データ準備中）です。現在${META.completedCities}市区・${META.totalSubsidies.toLocaleString()}件を収録済み、全国${META.totalCities.toLocaleString()}市区町村へ順次拡充中です。`); }
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

  // スクロール量に応じて「上に戻る」フローティングボタンを表示
  useEffect(() => {
    const h = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  // フローティング「もどる」の戻り先（画面ごとの遷移マップ）
  const backTargetOf = (v) => ({
    allTopics: 'top', trendDetail: 'allTopics', area: 'top', condition: 'area',
    results: 'condition', detail: detailBackTo, sponsorDetail: 'detail',
    ijyu: 'top', dataInfo: 'top', pickup1: 'top', pickup2: 'top', pickup3: 'top',
    notifications: 'top', accountSettings: 'profile', privacy: 'profile',
    register: registerBackTo,
  })[v];

  useEffect(() => { setTopicsPage(0); }, [activeTab]);
  useEffect(() => { window.scrollTo(0, 0); }, [view]);
  // エリア選択後、accountForm.area を自動反映（変更ボタン経由のフロー）
  useEffect(() => {
    if (selectedPref && selectedCity) {
      setAccountForm(prev => ({ ...prev, area: `${selectedPref} ${selectedCity}` }));
    }
  }, [selectedPref, selectedCity]);

  const Back = ({ to, label = 'もどる' }) => (
    <div className="flex items-center justify-between mb-4">
      <button onClick={() => setView(to)} className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors">
        <ChevronLeft size={17} />{label}
      </button>
      <button onClick={() => setView('top')} className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors">
        <Home size={12} /> ホーム
      </button>
    </div>
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
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm shadow-blue-200 shrink-0">
              <img src="/images/icons/app-icon.png" alt="もらえるお金ナビ" className="w-full h-full object-cover" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-black text-gray-900">もらえるお金ナビ</p>
              <p className="text-[10px] text-gray-400">全国{META.completedCities}市区・{META.totalSubsidies.toLocaleString()}件の補助金</p>
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
                  <TopicCard key={item.id} item={item} onClick={() => { setSelectedTrend(item); setView('trendDetail'); }} />
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
                  <p className="text-blue-100 text-xs leading-relaxed mb-4">全国{META.totalSubsidies.toLocaleString()}件の補助金・助成金から<br />あなたの条件に合ったものを見つけます</p>
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
                          {item.hasData ? <span className="ml-2 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">データあり</span> : <span className="ml-2 text-[10px] text-gray-400">Coming Soon</span>}
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
              {/* GPS 現在地ボタン（トップ） */}
              <button onClick={handleGpsLocate} disabled={gpsState === 'loading'}
                className={`w-full mt-2 border-2 active:scale-[0.98] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${gpsState === 'found' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700'}`}>
                {gpsState === 'loading' ? (
                  <><svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" /></svg>現在地を取得中…</>
                ) : gpsState === 'found' ? (
                  <><CheckCircle2 size={16} className="shrink-0" />現在地：{gpsFoundCity} を検出しました</>
                ) : (
                  <><MapPin size={16} className="shrink-0" />現在地（GPS）からさがす</>
                )}
              </button>
              {gpsState === 'error' && (
                <p className="text-[11px] text-red-500 text-center mt-1.5">現在地を取得できませんでした。エリア選択をご利用ください。</p>
              )}
              {gpsState === 'notfound' && (
                <p className="text-[11px] text-amber-600 text-center mt-1.5">現在地（{gpsFoundCity}）はデータ準備中です。エリア選択からお近くの市区をお選びください。</p>
              )}
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

            <div className="h-2 bg-gray-100" />

            {/* 移住支援金特集バナー */}
            <section className="bg-white px-4 py-5">
              <div className="flex items-center gap-1.5 mb-3">
                <Plane size={15} className="text-emerald-600" />
                <h3 className="text-sm font-black text-gray-900">住んでいない場所でも もらえるお金がある！</h3>
              </div>
              <button
                onClick={() => setView('ijyu')}
                className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-5 text-left shadow-md shadow-emerald-100 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
                <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-white/10 rounded-full" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black bg-white text-emerald-700 px-2 py-0.5 rounded">移住特集</span>
                    <span className="text-[10px] text-emerald-100 font-bold">{IJYU_SUBSIDIES.length}件の移住補助金を掲載中</span>
                  </div>
                  <h4 className="text-white text-lg font-black leading-tight mb-2">移住したら<br />最大<span className="text-yellow-300">100万円</span>もらえる！</h4>
                  <p className="text-emerald-100 text-xs leading-relaxed mb-3">東京圏から地方へ移住すると、<br />移住先の自治体から支援金をもらえます。</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {['長野県', '岩手県', '島根県', '高知県', '沖縄県'].map(p => (
                      <span key={p} className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                    <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">他 全国対応</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/20 rounded-xl py-2 px-3">
                    <MoveRight size={14} className="text-yellow-300 shrink-0" />
                    <span className="text-white text-xs font-bold">移住でもらえる補助金を全国から探す</span>
                  </div>
                </div>
              </button>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { emoji: '💰', label: '世帯最大100万円', sub: '単身は60万円' },
                  { emoji: '👶', label: '子ども加算あり', sub: '1人+30万円' },
                  { emoji: '🏡', label: '全国対応', sub: `${IJYU_SUBSIDIES.length}件掲載中` },
                ].map(item => (
                  <div key={item.label} className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-center">
                    <div className="text-lg mb-0.5">{item.emoji}</div>
                    <p className="text-[10px] font-black text-emerald-800 leading-tight">{item.label}</p>
                    <p className="text-[9px] text-emerald-500">{item.sub}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-2 bg-gray-100" />

            {/* お役立ち情報（ブログ） */}
            <section className="bg-white px-4 py-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <BookOpen size={14} className="text-blue-500" />
                  <h3 className="text-sm font-black text-gray-900">お役立ち情報</h3>
                </div>
                <a href="/blog/" className="text-[11px] text-blue-500 font-bold flex items-center gap-0.5 hover:text-blue-700 transition-colors">
                  一覧を見る <ChevronRight size={12} />
                </a>
              </div>
              <div className="space-y-2">
                {[
                  { emoji: '✈️', cat: '移住支援', catColor: 'text-emerald-700 bg-emerald-50', title: '東京にいながら長野の移住支援金100万円がもらえる！申請方法を完全解説', file: '001-ijyu-nagano.html' },
                  { emoji: '👶', cat: '子育て', catColor: 'text-pink-700 bg-pink-50', title: 'ベビー用品・保育料……知らないと損する出産・子育て給付金まとめ', file: '002-kosodate-joseikin.html' },
                  { emoji: '🏠', cat: '住まい', catColor: 'text-blue-700 bg-blue-50', title: '窓の断熱リフォームで最大200万円補助！先進的窓リノベの条件と申請方法', file: '003-mado-renovate.html' },
                  { emoji: '💍', cat: '結婚', catColor: 'text-rose-700 bg-rose-50', title: '結婚したら60万円もらえる！婚姻新生活支援制度の対象条件と申請手順', file: '012-kekkon-60man.html' },
                ].map(post => (
                  <a
                    key={post.file}
                    href={`/blog/${post.file}`}
                    className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3 hover:border-blue-200 hover:bg-blue-50/40 transition-all no-underline"
                  >
                    <span className="text-xl shrink-0 mt-0.5">{post.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${post.catColor} inline-block mb-1`}>{post.cat}</span>
                      <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2">{post.title}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </section>

            <div className="h-2 bg-gray-100" />

            {/* グローバルスポンサー枠（TOP） */}
            <GlobalSponsorBlock />
          </div>
        )}

        {/* 移住支援金特集 */}
        {view === 'ijyu' && (
          <div className="pb-6">
            {/* ヘッダー */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-4 pt-5 pb-6 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
              <button onClick={() => setView('top')} className="flex items-center gap-1 text-emerald-100 text-sm font-bold mb-3 hover:text-white transition-colors">
                <ChevronLeft size={17} />もどる
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Plane size={18} className="text-white" />
                <span className="text-[11px] font-black bg-white/20 text-white px-2.5 py-0.5 rounded-full">移住特集</span>
              </div>
              <h1 className="text-white text-2xl font-black leading-tight mb-2">住んでいない場所でも<br />もらえるお金がある</h1>
              <p className="text-emerald-100 text-xs leading-relaxed">今の住まいを変えて地方へ移住すると、<br />移住先の自治体から支援金をもらえます。<br />子ども1人につき<span className="text-yellow-300 font-black">+30万円</span>の加算も。</p>
            </div>

            {/* 仕組みを解説 */}
            <div className="px-4 py-4 bg-white border-b border-gray-100">
              <h2 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-1.5">
                <Info size={14} className="text-blue-500" /> 移住支援金の仕組み
              </h2>
              <div className="space-y-2.5">
                {[
                  { step: '1', color: 'bg-blue-500', text: '東京23区に「在住・在勤」していた人が対象' },
                  { step: '2', color: 'bg-teal-500', text: '地方へ移住し、対象企業に就業 or 起業する' },
                  { step: '3', color: 'bg-emerald-500', text: '移住先の自治体から支援金が支給される' },
                ].map(item => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full ${item.color} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-[10px] font-black">{item.step}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-700">{item.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  ⚠️ 支援金は「移住先」の自治体が出します。今住んでいる市ではなく、<span className="font-black">これから移住する市区町村が対象</span>。
                  申請には就業・起業の要件あり。詳細は各自治体へご確認ください。
                </p>
              </div>
            </div>

            {/* 金額ポイント */}
            <div className="px-4 py-4 bg-emerald-50 border-b border-emerald-100">
              <h2 className="text-sm font-black text-gray-900 mb-3">💡 もらえる金額の目安</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '単身移住', amount: '60万円', color: 'bg-white border-emerald-200' },
                  { label: '世帯移住', amount: '100万円', color: 'bg-white border-emerald-300' },
                  { label: '子ども加算', amount: '+30万円/人', color: 'bg-yellow-50 border-yellow-300' },
                ].map(item => (
                  <div key={item.label} className={`${item.color} border rounded-xl p-3 text-center`}>
                    <p className="text-[10px] text-gray-500 mb-1">{item.label}</p>
                    <p className="text-sm font-black text-emerald-700">{item.amount}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 都道府県別一覧 */}
            <div className="px-4 py-4 bg-white border-b border-gray-100">
              <h2 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-600" /> 移住支援金がある都道府県
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {IJYU_PREF_SUMMARY.map(item => (
                  <button
                    key={item.pref}
                    onClick={() => {
                      setSelectedPref(item.pref);
                      setSelectedCity('');
                      setView('area');
                    }}
                    className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-left hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                  >
                    <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin size={13} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate">{item.pref}</p>
                      <p className="text-[10px] text-emerald-600 font-bold">{item.cities.length}市区対応</p>
                    </div>
                    <ChevronRight size={12} className="text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* 移住支援金一覧 */}
            <div className="px-4 py-4 bg-white">
              <h2 className="text-sm font-black text-gray-900 mb-3">全国の移住支援金 一覧（{IJYU_SUBSIDIES.length}件）</h2>
              <div className="space-y-2">
                {IJYU_SUBSIDIES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => goDetail(s, 'ijyu')}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3 text-left hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Plane size={14} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">{s.pref}</span>
                          <span className="text-[10px] text-gray-500 font-bold">{s.city}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 truncate">{s.title}</p>
                        <p className="text-xs font-black text-emerald-600 mt-0.5">{s.amount}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 shrink-0 mt-2" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="px-4 py-4">
              <button
                onClick={() => setView('area')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
              >
                <Search size={15} /> 自分のエリアの補助金を探す
              </button>
            </div>
            <div className="-mx-0 px-4">
              <GlobalSponsorBlock compact />
            </div>
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
              {pagedTrends.map(item => <TopicCard key={item.id} item={item} onClick={() => { setSelectedTrend(item); setView('trendDetail'); }} />)}
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

            <div className="flex gap-2 mb-5">
              <button onClick={() => setView('area')} className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
                <Search size={15} /> エリアを検索する
              </button>
              <button onClick={() => setView('top')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
                <Home size={15} /> トップへ戻る
              </button>
            </div>
            {/* スポンサー枠 */}
            <div className="-mx-4">
              <GlobalSponsorBlock compact />
            </div>
          </div>
        )}

        {/* TREND DETAIL */}
        {view === 'trendDetail' && selectedTrend && (() => {
          const t = selectedTrend;
          const isFeatured = t.featured;
          return (
            <div className="p-4 pt-5">
              <Back to="allTopics" />
              <div className={`rounded-2xl p-5 mb-4 ${isFeatured ? 'bg-orange-50 border-2 border-orange-300' : 'bg-blue-50 border border-blue-100'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-10 h-10 ${t.bg} rounded-xl flex items-center justify-center`}>
                    <Ic name={t.icon} size={20} className={t.color} />
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isFeatured ? 'bg-orange-500 text-white' : 'bg-blue-100 text-blue-700'}`}>
                    {isFeatured ? '注目' : t.tab === 'unique' ? 'ユニーク' : t.tab === 'family' ? '子育て' : t.tab === 'home' ? '住まい' : 'エコ'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-bold mb-1">{t.city}</p>
                <h2 className="text-xl font-black text-gray-900 mb-2">{t.title}</h2>
                <p className={`text-2xl font-black ${isFeatured ? 'text-orange-500' : 'text-blue-600'}`}>{t.amount}</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">概要</p>
                <p className="text-sm text-gray-700 leading-relaxed">{t.desc}</p>
                {t.detail && (
                  <>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-4 mb-2 pt-3 border-t border-gray-100">詳しい内容</p>
                    <p className="text-[13px] text-gray-600 leading-relaxed">{t.detail}</p>
                  </>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
                <p className="text-[10px] font-black text-gray-400 mb-1">出典</p>
                <p className="text-sm font-bold text-gray-700">{t.source}</p>
                <p className="text-[10px] text-gray-400 mt-1">確認日: {t.lastChecked}</p>
              </div>

              {/* 移住系トピック → 全国移住支援金一覧への導線 */}
              {((t.title && t.title.includes('移住')) || (t.desc && t.desc.includes('移住'))) && (
                <button onClick={() => setView('ijyu')}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mb-4 text-sm">
                  <Plane size={15} /> 全国の移住支援金 一覧を見る（{IJYU_SUBSIDIES.length}件）
                </button>
              )}

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 mb-4">
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  💡 詳しい申請条件・期限は自治体公式サイトでご確認ください。下のボタンで検索できます。
                </p>
              </div>

              {t.officialUrl ? (
                <a href={t.officialUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mb-3 text-sm">
                  <ExternalLink size={15} /> 公式サイトで詳細を見る
                </a>
              ) : (
                <button
                  onClick={() => {
                    const q = encodeURIComponent(`${t.city} ${t.title}`);
                    window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mb-3 text-sm">
                  <ExternalLink size={15} /> 「{t.title}」を検索する
                </button>
              )}
              <button onClick={() => setView('area')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm mb-5">
                <Search size={15} /> 自分のエリアの補助金を探す
              </button>
              {/* 他の地域の同カテゴリトピック */}
              {(() => {
                const related = ALL_TRENDS.filter(x => x.tab === t.tab && x.id !== t.id).slice(0, 3);
                if (related.length === 0) return null;
                const tabLabel = t.tab === 'unique' ? 'ユニーク' : t.tab === 'family' ? '子育て' : t.tab === 'home' ? '住まい' : 'エコ';
                return (
                  <div className="mb-5">
                    <p className="text-xs font-black text-gray-900 mb-2">🗾 他の地域の「{tabLabel}」注目トピック</p>
                    <div className="grid grid-cols-3 gap-2">
                      {related.map(item => (
                        <TopicCard key={item.id} item={item} onClick={() => { setSelectedTrend(item); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                      ))}
                    </div>
                  </div>
                );
              })()}
              {/* スポンサー枠 */}
              <div className="-mx-4">
                <GlobalSponsorBlock compact />
              </div>
            </div>
          );
        })()}

        {/* STEP 1: エリア選択 */}
        {view === 'area' && (
          <div className="p-4 pt-5">
            <Back to="top" />
            <Steps step="area" />
            <h2 className="text-xl font-black text-gray-900 text-center mb-1">お住まいの地方は？</h2>
            <p className="text-xs text-gray-400 text-center mb-4">地方 → 都道府県 → 市区町村の順に選んでください</p>

            {/* GPS 現在地ボタン */}
            <button
              onClick={handleGpsLocate}
              disabled={gpsState === 'loading'}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm mb-5 transition-all border-2 ${
                gpsState === 'found'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                  : gpsState === 'error'
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : gpsState === 'notfound'
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : gpsState === 'loading'
                  ? 'bg-blue-50 border-blue-200 text-blue-500 cursor-wait'
                  : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-500 active:scale-[0.98]'
              }`}
            >
              {gpsState === 'loading' ? (
                <><svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" /></svg>現在地を取得中…</>
              ) : gpsState === 'found' ? (
                <><CheckCircle2 size={16} className="shrink-0" />現在地：{gpsFoundCity} を検出しました</>
              ) : gpsState === 'notfound' ? (
                <><MapPin size={16} className="shrink-0" />{gpsFoundCity} 周辺を検出（手動で市区を選択してください）</>
              ) : gpsState === 'error' ? (
                <><Info size={16} className="shrink-0" />現在地の取得に失敗しました（手動で選択してください）</>
              ) : (
                <><MapPin size={16} className="shrink-0" />現在地から自動でエリアを特定</>
              )}
            </button>

            {/* STEP 1-A: 地方選択 */}
            {!selectedRegion && (
              <div className="space-y-2">
                {Object.entries(REGION_MAP).map(([region, info]) => (
                  <button key={region} onClick={() => { setSelectedRegion(region); setSelectedPref(''); setSelectedCity(''); }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 text-left transition-all ${info.hasData ? 'border-blue-500 bg-blue-50 hover:bg-blue-100' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className={`w-12 h-12 ${info.color} rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden`}>
                      {info.img ? <img src={info.img} alt={region} className="w-full h-full object-cover" /> : info.emoji}
                    </div>
                    <div className="flex-1">
                      <p className={`text-base font-black ${info.hasData ? 'text-blue-700' : 'text-gray-700'}`}>{region}</p>
                      <p className="text-xs text-gray-400">{info.prefs.slice(0,3).join('・')} 他</p>
                    </div>
                    {info.hasData
                      ? <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-1 rounded-full">データあり</span>
                      : <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-full">準備中</span>
                    }
                    <ChevronRight size={16} className={info.hasData ? 'text-blue-400' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
            )}

            {/* STEP 1-B: 都道府県・市区選択 */}
            {selectedRegion && (
              <div>
                <button onClick={() => { setSelectedRegion(''); setSelectedPref(''); setSelectedCity(''); }}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 mb-4 hover:opacity-80">
                  <ChevronLeft size={16} /> {selectedRegion} に戻る
                </button>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* 都道府県 */}
                  <div className="p-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 mb-2">{selectedRegion}の都道府県</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {REGION_MAP[selectedRegion].prefs.map(pref => (
                        <button key={pref} onClick={() => { setSelectedPref(pref); setTimeout(() => cityListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); }}
                          className={`text-left px-3 py-2.5 rounded-xl font-bold text-sm flex justify-between items-center transition-all ${selectedPref === pref ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-700 hover:border-blue-200'}`}>
                          {pref}{selectedPref === pref && <ChevronRight size={13} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 市区町村 */}
                  <div className="p-3" ref={cityListRef}>
                    {!selectedPref ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                        <Map size={36} className="mb-2" /><p className="text-sm text-gray-400">都道府県を選んでください</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] font-black text-blue-600 mb-2">{selectedPref} の市区町村</p>
                        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                          {[...new Map(ALL_CITIES.filter(c => c.pref === selectedPref).map(c => [`${c.pref}:${c.city}`, c])).values()]
                            .sort((a, b) => (b.hasData ? 1 : 0) - (a.hasData ? 1 : 0))
                            .map(c => (
                            <button key={c.city} onClick={() => handleCitySelect(c.city)}
                              className="w-full text-left px-3 py-2.5 border border-gray-100 rounded-xl font-bold text-sm text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex justify-between items-center">
                              <span>{c.city}</span>
                              <div className="flex items-center gap-2">
                                {c.hasData
                                  ? <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">データあり</span>
                                  : <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Coming Soon</span>}
                                <ChevronRight size={14} className="text-gray-300" />
                              </div>
                            </button>
                          ))}
                        </div>
                        {!ALL_CITIES.some(c => c.pref === selectedPref && c.hasData) && (
                          <p className="text-xs text-amber-600 mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">※{selectedPref}のデータはComing Soon（順次追加予定）です。</p>
                        )}
                        {dataNotReadyMsg && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                            <Info size={14} className="text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700">{dataNotReadyMsg}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                    { key: 'hasChildren',    label: '子供がいる（18歳以下）',           Icon: Baby,   cc: 'bg-pink-50 text-pink-500' },
                    { key: 'usesBike',       label: '自転車に乗る',                   Icon: Bike,   cc: 'bg-purple-50 text-purple-500' },
                    { key: 'ownsHome',       label: '持ち家（一戸建て/マンション）',   Icon: Home,   cc: 'bg-green-50 text-green-600' },
                    { key: 'hasElderly',     label: '高齢者が同居している',            Icon: User,   cc: 'bg-blue-50 text-blue-500' },
                    { key: 'isNewlywed',     label: '結婚予定・新婚',                 Icon: Heart,  cc: 'bg-rose-50 text-rose-500' },
                    { key: 'isPregnant',     label: '妊娠中・出産予定（不妊治療含む）', Icon: Baby,   cc: 'bg-amber-50 text-amber-500' },
                    { key: 'isRelocating',   label: '移住・住み替えを検討中',          Icon: Plane,  cc: 'bg-emerald-50 text-emerald-600' },
                    { key: 'isSingleParent', label: 'ひとり親世帯',                   Icon: User,   cc: 'bg-indigo-50 text-indigo-500' },
                    { key: 'hasDisability',  label: '障害のある家族がいる',            Icon: Shield, cc: 'bg-teal-50 text-teal-600' },
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
        {view === 'results' && (() => {
          const allCitySubsidies = SUBSIDIES.filter(i => !selectedCity || i.city === selectedCity);
          const showAll = filteredSubsidies.length === 0 && allCitySubsidies.length > 0;
          const displaySubsidies = showAll ? allCitySubsidies : filteredSubsidies;
          return (
          <div className="p-4 pt-5">
            <Back to="condition" />
            <Steps step="results" />
            <div className={`rounded-2xl p-5 mb-5 text-white relative overflow-hidden ${showAll ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-blue-600 to-indigo-500'}`}>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
              <p className="text-blue-200 text-[11px] font-bold mb-1 relative z-10">{selectedCity}</p>
              <h2 className="text-base font-black mb-2 relative z-10">
                {showAll ? `${selectedCity}の補助金 全件` : 'あなたへの該当補助金'}
              </h2>
              <div className="flex items-end gap-2 relative z-10">
                <span className="text-4xl font-black">{displaySubsidies.length}</span>
                <span className="text-blue-200 text-sm font-bold mb-1">件</span>
                {!showAll && <span className="text-blue-200 text-xs font-medium mb-1">/ 全{allCitySubsidies.length}件中</span>}
              </div>
            </div>

            {/* 0件の場合のEmpty State */}
            {filteredSubsidies.length === 0 && allCitySubsidies.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search size={28} className="text-gray-300" />
                </div>
                <p className="text-base font-black text-gray-700 mb-1">まだデータがありません</p>
                <p className="text-xs text-gray-400 leading-relaxed mb-5">{selectedCity}の補助金データは現在準備中です。<br />他のエリアで試してみてください。</p>
                <button onClick={() => setView('area')} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl text-sm">別のエリアを選ぶ</button>
              </div>
            )}

            {/* 条件マッチ0件・エリア全件表示 */}
            {showAll && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
                <span className="text-amber-500 text-lg shrink-0">💡</span>
                <div>
                  <p className="text-sm font-black text-amber-800 mb-0.5">選択した条件に合う補助金が見つかりませんでした</p>
                  <p className="text-xs text-amber-700 leading-relaxed">{selectedCity}で受け取れる可能性がある補助金を全件表示しています。条件に戻って変更することもできます。</p>
                  <button onClick={() => setView('condition')} className="mt-2 text-xs font-bold text-amber-700 underline underline-offset-2">← 条件を変更する</button>
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {displaySubsidies.map(item => (
                <div key={item.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isExpiredPeriod(item.period) ? 'border-gray-200 opacity-70' : 'border-gray-100'}`}>
                  <div className="px-4 pt-3.5 pb-2.5 border-b border-gray-50 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">{item.category}</span>
                    {isExpiredPeriod(item.period) && !isCheckingPeriod(item.period) && (
                      <span className="text-[10px] font-black text-white bg-red-400 px-2 py-0.5 rounded-full">受付終了</span>
                    )}
                    {isCheckingPeriod(item.period) && (
                      <span className="text-[10px] font-black text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">期限確認中</span>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-400 mb-3">{item.desc}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400">支給目安</p>
                        <p className={`text-lg font-black ${isExpiredPeriod(item.period) ? 'text-gray-400' : 'text-red-500'}`}>{item.amount}</p>
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
            {/* エリア別 メインスポンサー（有料契約者がいる場合のみ表示） */}
            {CITY_RECYCLERS[selectedCity]?.sponsor && (() => {
              const sp = CITY_RECYCLERS[selectedCity].sponsor;
              return (
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 mb-3 text-white relative overflow-hidden shadow-md shadow-emerald-200">
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white text-emerald-700">PR</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">{selectedCity} スポンサー</span>
                    </div>
                    <h3 className="text-base font-black mb-1 flex items-center gap-2">💰 {sp.name}</h3>
                    <p className="text-sm font-bold mb-2 leading-snug">{sp.catchcopy}</p>
                    <p className="text-emerald-50 text-xs leading-relaxed mb-4">{sp.detail}</p>
                    <a href={sp.url} target="_blank" rel="noopener noreferrer"
                      className="block w-full bg-white text-emerald-600 hover:bg-emerald-50 active:scale-[0.98] font-black py-3 rounded-xl text-sm text-center transition-all">
                      詳細・無料相談はこちら <ExternalLink size={12} className="inline ml-1" />
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* おすすめ枠：お金のプロ */}
            {CITY_RECYCLERS[selectedCity]?.recommended?.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
                <p className="text-[10px] font-black text-gray-400 mb-2 px-1">🏢 {selectedCity} のおすすめ企業</p>
                <div className="space-y-1.5">
                  {CITY_RECYCLERS[selectedCity].recommended.map((r, i) => (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">PR</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{r.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{r.tag}</p>
                      </div>
                      <ExternalLink size={10} className="text-gray-300 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-4 mb-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black bg-white text-blue-600 px-2 py-0.5 rounded">PR枠</span>
                <span className="text-xs font-bold opacity-90">{selectedCity || 'このエリア'} エリア</span>
              </div>
              <p className="text-sm font-black mb-1">💼 FP・税理士・社労士の方へ<br/>PR掲載のご案内</p>
              <p className="text-[11px] text-blue-100 mb-3 leading-relaxed">補助金を調べている{selectedCity || 'このエリア'}のユーザーへ、あなたのサービスを届けませんか。地域密着の士業・専門家の方を募集しています。</p>
              <div className="flex gap-2">
                <a href={`mailto:${SPONSOR_INQUIRY_EMAIL}?subject=${encodeURIComponent(`【PR掲載】${selectedCity || 'このエリア'}の掲載について`)}&body=${encodeURIComponent('もらえるお金ナビ PR掲載問い合わせ\n\n事務所名：\nご担当者：\n対象エリア：' + (selectedCity || '') + '\nご質問・ご要望：\n')}`}
                  className="flex-1 bg-white text-blue-700 font-black text-xs py-2 rounded-lg text-center hover:bg-blue-50 transition-colors">
                  メールで問い合わせ
                </a>
                <a href={`/sponsor_lp.html?city=${encodeURIComponent(selectedCity || '')}`} target="_blank"
                  className="flex-1 bg-blue-500 text-white font-black text-xs py-2 rounded-lg text-center border border-blue-400 hover:bg-blue-400 transition-colors">
                  詳細を見る <ExternalLink size={10} className="inline ml-0.5" />
                </a>
              </div>
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
          );
        })()}

        {/* DETAIL */}
        {view === 'detail' && selectedSubsidy && (
          <div className="p-4 pt-5">
            <Back to={detailBackTo} />
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">{selectedSubsidy.category}</span>
            <h2 className="text-xl font-black text-gray-900 mt-2 mb-4">{selectedSubsidy.title}</h2>
            {isExpiredPeriod(selectedSubsidy.period) && !isCheckingPeriod(selectedSubsidy.period) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                <span className="text-red-500 text-base shrink-0">⚠️</span>
                <p className="text-xs font-bold text-red-700">この補助金は受付が終了している可能性があります。最新情報は公式サイトでご確認ください。</p>
              </div>
            )}
            {isCheckingPeriod(selectedSubsidy.period) && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                <span className="text-orange-500 text-base shrink-0">🔍</span>
                <p className="text-xs font-bold text-orange-700">この制度の令和8年度継続を確認中です。公式サイトで最新情報をご確認ください。</p>
              </div>
            )}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-4 mb-4 flex items-center justify-between">
              <div><p className="text-xs text-gray-400 font-bold mb-1">支給目安</p><p className="text-3xl font-black text-red-500">{selectedSubsidy.amount}</p></div>
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center"><Zap size={22} className="text-red-400" /></div>
            </div>
            <div className="space-y-3 mb-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">制度の概要</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedSubsidy.overview || selectedSubsidy.desc}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">対象条件</p>
                <div className="space-y-2">
                  {(selectedSubsidy.eligible || [`${selectedSubsidy.city}に住民票があること`, '対象要件を満たすこと', '申請期間内に手続きを完了すること']).map((e, i) => (
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
                  {(selectedSubsidy.how || ['担当窓口またはオンラインで申請書を入手・記入', '必要書類（証明書類・領収書等）を揃えて提出', '審査後、指定口座に振込（通常2〜4週間）']).map((step, i) => (
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
                <p className="text-[10px] text-gray-400 mt-1">確認日: {selectedSubsidy.lastChecked ?? META.lastUpdated} ／ 出典: {selectedSubsidy.source || '各自治体公式サイト'}</p>
              </div>
            </div>

            {/* 公式サイト/検索リンク */}
            {!isExpiredPeriod(selectedSubsidy.period) && selectedSubsidy.verified ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-2 mb-2 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                <p className="text-xs font-bold text-green-700">公式サイトで確認済み（{selectedSubsidy.lastChecked ?? META.lastUpdated}）</p>
              </div>
            ) : !isExpiredPeriod(selectedSubsidy.period) ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 mb-2 flex items-center gap-2">
                <Info size={14} className="text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-700">参考情報。最新の詳細は公式サイトでご確認ください</p>
              </div>
            ) : null}
            <button
              onClick={() => {
                const raw = selectedSubsidy.applicationUrl || '';
                const isValidUrl = raw.startsWith('http://') || raw.startsWith('https://');
                const url = isValidUrl
                  ? raw
                  : `https://www.google.com/search?q=${encodeURIComponent(`${selectedSubsidy.pref} ${selectedSubsidy.city} ${selectedSubsidy.title}`)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              className="w-full bg-blue-50 border border-blue-200 text-blue-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mb-3 hover:bg-blue-100 text-sm">
              <ExternalLink size={15} /> {selectedSubsidy.verified ? '公式サイトで詳細を確認' : `「${selectedSubsidy.title}」を検索する`}
            </button>

            {/* 補助金申請をサポートできるお金のプロPR */}
            {CITY_RECYCLERS[selectedSubsidy?.city]?.recommended?.length > 0 && (
              <div className="mb-4 bg-white border border-gray-100 rounded-xl p-3">
                <p className="text-[10px] font-black text-gray-400 mb-2 px-1">🏢 {selectedSubsidy.city} のおすすめ企業</p>
                <div className="space-y-1.5">
                  {CITY_RECYCLERS[selectedSubsidy.city].recommended.slice(0, 2).map((r, i) => (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">PR</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{r.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{r.tag}</p>
                      </div>
                      <ExternalLink size={10} className="text-gray-300 shrink-0" />
                    </a>
                  ))}
                </div>
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
                {[{ l: '最終更新日', v: META.lastUpdated }, { l: '次回更新予定', v: META.nextUpdate + '（毎月27日）' }, { l: 'バージョン', v: META.version }, { l: 'データ収録都市数', v: `${META.completedCities}市区町村（Phase${META.phase}）` }].map(({ l, v }) => (
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
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black border border-white/20">{account.name.charAt(0) || MOCK_USER.avatarChar}</div>
                <div><p className="text-lg font-black">{account.name}</p><p className="text-blue-200 text-xs">{account.email}</p><p className="text-blue-200 text-[10px] mt-0.5">登録日：{MOCK_USER.since}</p></div>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><p className="text-[10px] font-black text-gray-400">登録エリア</p></div>
                <div className="px-4 py-3 flex items-center gap-2"><MapPin size={14} className="text-blue-500" /><p className="text-sm font-bold text-gray-900">{account.area}</p></div>
              </div>
              {/* アラート設定（メール + プッシュのみ） */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><p className="text-[10px] font-black text-gray-400">アラート設定</p></div>
                <div className="divide-y divide-gray-50">
                  {/* メール通知（常時オン） */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div><p className="text-sm font-bold text-gray-900">メール通知</p><p className="text-[11px] text-gray-400">{account.email}</p></div>
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
              <a href="/legal/terms.html" target="_blank" rel="noopener noreferrer" className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <Info size={16} className="text-gray-600" /><span className="text-sm font-bold text-gray-600">利用規約</span><ExternalLink size={14} className="text-gray-300 ml-auto" />
              </a>
              <a href="/legal/disclaimer.html" target="_blank" rel="noopener noreferrer" className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <Info size={16} className="text-gray-600" /><span className="text-sm font-bold text-gray-600">免責事項</span><ExternalLink size={14} className="text-gray-300 ml-auto" />
              </a>
              <a href="/legal/tokushoho.html" target="_blank" rel="noopener noreferrer" className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <Info size={16} className="text-gray-600" /><span className="text-sm font-bold text-gray-600">特定商取引法に基づく表記</span><ExternalLink size={14} className="text-gray-300 ml-auto" />
              </a>
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
                      <span className="text-sm text-gray-700 flex-1">{accountForm.area}</span>
                      <button onClick={() => setView('area')} className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors">変更</button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">※ エリアを変更すると登録した補助金アラートも更新されます</p>
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
            {accountSaved && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-green-600" />
                <p className="text-xs font-bold text-green-700">変更を保存しました</p>
              </div>
            )}
            <button
              onClick={() => {
                setAccount({ ...account, name: accountForm.name, email: accountForm.email, area: accountForm.area });
                setAccountSaved(true);
                setTimeout(() => setAccountSaved(false), 3000);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-sm shadow-blue-200 transition-all mb-3">
              変更を保存する
            </button>
            <button
              onClick={() => {
                if (window.confirm('アカウントを削除すると登録情報・通知設定がすべて失われます。本当に削除しますか？')) {
                  alert('（デモ）アカウント削除リクエストを受け付けました。');
                  setView('top');
                }
              }}
              className="w-full bg-white border border-red-200 text-red-500 font-bold py-3 rounded-xl text-sm hover:bg-red-50 transition-colors">
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
            <p className="text-[10px] text-gray-400 mb-5">制定日: 2026年1月1日（最終改定: 2026年6月10日）／ 株式会社テラデザイン</p>
            <div className="space-y-3">
              {PRIVACY_POLICY.map((section, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <h4 className="text-sm font-black text-gray-900 mb-2">{section.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{section.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
              <p className="text-[11px] text-gray-400">もらえるお金ナビ / 株式会社テラデザイン<br />terradesignik@gmail.com</p>
            </div>
          </div>
        )}

      </main>

      {/* Bottom Nav */}
      {/* フローティング操作ボタン（もどる・上へ） */}
      {(() => {
        const bt = backTargetOf(view);
        if (!bt && !showScrollTop) return null;
        return (
          <div className="fixed bottom-20 right-[max(1rem,calc(50%-11rem))] z-30 flex flex-col gap-2 items-end">
            {showScrollTop && (
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="ページの先頭に戻る"
                className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 flex items-center justify-center active:scale-90 transition-all">
                <ChevronUp size={22} />
              </button>
            )}
            {bt && (
              <button onClick={() => { setView(bt); window.scrollTo({ top: 0 }); }} aria-label="前の画面にもどる"
                className="h-11 px-4 rounded-full bg-white border-2 border-gray-300 text-gray-700 font-bold text-xs shadow-lg flex items-center gap-1 active:scale-90 transition-all hover:border-blue-400 hover:text-blue-700">
                <ChevronLeft size={15} /> もどる
              </button>
            )}
          </div>
        );
      })()}

      <nav className="bg-white border-t border-gray-100 fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-16 flex items-center justify-around px-6 z-20">
        {[
          { id: 'top',           Icon: Home,   label: 'ホーム',    vs: ['top', 'allTopics', 'trendDetail', 'pickup1', 'pickup2', 'pickup3', 'dataInfo', 'ijyu'] },
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
