'use strict';

// ==================== 静态配置 ====================
// 卡牌相关配置（体系/画风/卡名/图标/战斗数值/效果文本/分层权重）见 cards.js
const RARITIES = {
  N:  { base: 8 },
  R:  { base: 25 },
  SR: { base: 80 },
  UR: { base: 240 },
};

const SPECIAL_FINISHES = {
  foil:     { name: '闪膜版', icon: '✦', mult: 1.7 },
  holo:     { name: '镭射版', icon: '◇', mult: 2.7 },
  signed:   { name: '签名版', icon: '✍', mult: 5.5 },
  numbered: { name: '限量编号版', icon: '#', mult: 8.0 },
};

const NPC_QUALITY = [
  { name: '普通玩家', threshold: 0, budget: null },
  { name: '体系爱好者', threshold: 20, budget: [250, 500] },
  { name: '资深藏家', threshold: 60, budget: [500, 1500] },
  { name: '高端卡商', threshold: 120, budget: [1500, 4000] },
  { name: '私人收藏家', threshold: 250, budget: [4000, 10000] },
  { name: '传奇藏家', threshold: 500, budget: [10000, 20000] },
];

const MARKET_SIZE = 12;
const BASE_MARKET_BUY_MARKUP = 1.15; // 公开市场基础买入加价 15%
const BASE_MARKET_SELL_RATE = 0.80;  // 公开市场基础回收率 80%
const CONSIGN_PRICE_OPTIONS = [100, 115, 130, 150];
const AUCTION_RESERVE_OPTIONS = [90, 110, 130];
const SAVE_KEY = 'tcgmvp_save_v1';
const CAREER_KEY = 'tcgmvp_career_v1';
const PACK_ANIMATION_KEY = 'tcgmvp_skip_pack_animation';
const NAV_HINT_KEY = 'tcgmvp_mobile_nav_hint_seen';
const SETTLEMENT_SKIP_KEY = 'tcgmvp_skip_settlement_modal';

const PACK_TYPES = {
  standard: { name: '标准卡包', face: '赛季补充包', price: 60, size: 3, unlockLv: 0, css: 'standard', desc: '3 张当季随机卡牌' },
  discount: { name: '优惠标准包', face: '特惠补充包', price: 50, size: 3, unlockLv: 1, css: 'discount', dailyLimit: 1, desc: '同标准包内容，每日限购 1 包' },
  jumbo:    { name: '大包', face: '巨型补充包', price: 150, size: 8, unlockLv: 2, css: 'jumbo', dailyLimit: 1, guarantee: 'R', desc: '8 张当季卡，至少 1 张 R 以上' },
  theme:    { name: '赛季主题包', face: '主题精选包', price: 90, size: 4, unlockLv: 3, css: 'theme', dailyLimit: 2, guarantee: 'R', themed: true, desc: '4 张本季主题体系卡，至少 1 张 R 以上' },
  classic:  { name: '经典纪念包', face: '经典纪念包', price: 110, size: 4, unlockLv: 4, css: 'classic', dailyLimit: 1, guarantee: 'SR', classic: true, desc: '4 张随机往季版本，至少 1 张 SR 以上' },
};

const SEASON_LENGTH = 10;         // 每赛季天数
const SEASON_VALUE_FACTORS = [1, 0.95, 0.90]; // 当季 / 上季 / 上上季；S1 到 S4 时退环境
const ROTATED_VALUE_FACTOR = 0.12; // 退环境后保留少量收藏价值
const REPRINT_FACTOR = 0.9;       // 复刻期间的价值系数
const REPRINT_CHANCE = 0.08;      // 每天自然触发复刻的概率
const STAT_ROLL_VERSION = 2;      // 赛季数值规则版本，供旧存档迁移

const THEME_USAGE_MULT = 1.5;     // 赛季主题体系的使用率加成
const PATCH_CHANCE = 0.30;        // 每天出平衡补丁的概率

const ROUTES = ['home', 'shop', 'market', 'private', 'commission', 'achievements', 'collection', 'upgrade', 'news'];
const collectionView = { batchMode: false, selected: new Set() };
const marketServiceUI = { consignPct: 115, reservePct: 110 };

const COMMISSION_DIFFICULTIES = {
  normal:   { name: '普通', icon: '🟢', targetBase: 52, rewardMult: 0.9, repMult: 0.9,  repCap: 8 },
  advanced: { name: '进阶', icon: '🔵', targetBase: 56, rewardMult: 1,   repMult: 1,    repCap: 12 },
  elite:    { name: '精英', icon: '🟣', targetBase: 60, rewardMult: 1.2, repMult: 1.25, repCap: 18 },
};

const COMMISSION_TYPES = {
  standard: {
    name: '常规征集', icon: '📋', weights: { theme: 0.50, construction: 0.32, strength: 0.18 },
    desc: '均衡考察体系、构筑与强度',
  },
  passion: {
    name: '体系情怀', icon: '🔥', weights: { theme: 0.60, construction: 0.27, strength: 0.13 },
    desc: '体系分权重提高到 60%',
  },
  competitive: {
    name: '竞技挑战', icon: '🏆', weights: { theme: 0.50, construction: 0.32, strength: 0.18 },
    desc: '曲线与强度提供额外分，但禁用退环境卡',
  },
  anime: {
    name: '二次元企划', icon: '🌸', weights: { theme: 0.50, construction: 0.32, strength: 0.18 },
    desc: '萌系画风占比越高，额外分越多',
  },
  nostalgic: {
    name: '怀旧收藏', icon: '🕰️', weights: { theme: 0.50, construction: 0.32, strength: 0.18 },
    desc: '往赛季印次占比越高，额外分越多',
  },
};

const REPUTATION_UPGRADES = {
  board:      { name: '委托人脉', icon: '📨', maxLv: 2, costs: [10, 22], desc: '每日可选委托 +1' },
  locks:      { name: '优先预约', icon: '🔒', maxLv: 2, costs: [8, 18], desc: '可锁定委托 +1' },
  seasonCap:  { name: '行业认证', icon: '📜', maxLv: 2, costs: [12, 26], desc: '每赛季接取上限 +1' },
  concurrent: { name: '项目管理', icon: '🗂️', maxLv: 1, costs: [18], desc: '同时进行上限 +1' },
  reward:     { name: '金牌口碑', icon: '💰', maxLv: 2, costs: [16, 32], desc: '委托固定报酬 +5%' },
  carryLock:  { name: '长期合约', icon: '🤝', maxLv: 1, costs: [25], desc: '跨赛季保留已锁定的目标委托' },
  collectors: { name: '藏家人脉', icon: '💎', maxLv: 5, costs: [10, 22, 40, 65, 100], desc: '提高高级藏家来访率；高等级来客可能出售签名与编号卡' },
};

const RUN_CHALLENGES = [
  { id: 'profit_3000', icon: '📈', name: '白手起家', desc: '30 天内净身价相对开局增长 ¥3000', metric: 'maxProfit', target: 3000, deadline: 30, points: 25 },
  { id: 'commission_10', icon: '📋', name: '使命必达', desc: '5 个赛季内完成 10 份委托', metric: 'commissionsCompleted', target: 10, deadline: 50, points: 25 },
  { id: 'collection_100', icon: '🗃️', name: '百卡藏家', desc: '3 个赛季内同时持有 100 张卡牌', metric: 'maxOwned', target: 100, deadline: 30, points: 20 },
  { id: 'haggle_15', icon: '🗣️', name: '三寸不烂之舌', desc: '3 个赛季内成功讲价 15 次', metric: 'hagglesWon', target: 15, deadline: 30, points: 20 },
  { id: 'sales_100', icon: '💸', name: '百卡流转', desc: '5 个赛季内累计卖出 100 张卡牌', metric: 'cardsSold', target: 100, deadline: 50, points: 25 },
  { id: 'elite_5', icon: '👑', name: '精英承包商', desc: '5 个赛季内以 85+ 分完成 5 份精英委托', metric: 'eliteHighScore', target: 5, deadline: 50, points: 35 },
  { id: 'reputation_50', icon: '🏅', name: '声名鹊起', desc: '5 个赛季内通过委托获得 50 声望', metric: 'reputationEarned', target: 50, deadline: 50, points: 30 },
  { id: 'cores_30', icon: '💠', name: '核心猎手', desc: '3 个赛季内累计获得 30 张体系核心', metric: 'coresAcquired', target: 30, deadline: 30, points: 25 },
  { id: 'unique_120', icon: '📚', name: '图鉴冲刺', desc: '5 个赛季内同时持有 120 种不同卡牌', metric: 'uniqueOwnedMax', target: 120, deadline: 50, points: 35 },
];

const CAREER_MILESTONE_GROUPS = [
  { key: 'packsOpened', icon: '🎁', name: '开包专家', unit: '包', tiers: [[10, 5], [50, 15], [200, 35]] },
  { key: 'cardsAcquired', icon: '🃏', name: '万卡归仓', unit: '张', tiers: [[50, 5], [250, 15], [1000, 35]] },
  { key: 'cardsSold', icon: '💸', name: '流通大户', unit: '张', tiers: [[25, 5], [150, 15], [750, 35]] },
  { key: 'tradeDeals', icon: '🤝', name: '交易大师', unit: '笔', tiers: [[20, 5], [100, 15], [500, 35]] },
  { key: 'commissionsCompleted', icon: '📋', name: '金牌承包人', unit: '份', tiers: [[5, 8], [25, 20], [100, 45]] },
  { key: 'moneyEarned', icon: '💰', name: '财源广进', unit: '资金', tiers: [[1000, 5], [10000, 18], [50000, 40]] },
  { key: 'hagglesWon', icon: '🗣️', name: '谈判大师', unit: '次', tiers: [[10, 8], [50, 20], [200, 45]] },
  { key: 'reputationEarned', icon: '🏅', name: '声望远扬', unit: '声望', tiers: [[25, 8], [100, 22], [500, 50]] },
  { key: 'reputationSpent', icon: '🛠️', name: '长期投资', unit: '声望', tiers: [[20, 8], [100, 22], [400, 45]] },
  { key: 'coresAcquired', icon: '💠', name: '核心收藏家', unit: '张核心', tiers: [[10, 8], [50, 22], [200, 50]] },
  { key: 'urAcquired', icon: '✨', name: '传说猎手', unit: '张 UR', tiers: [[5, 10], [30, 25], [150, 55]] },
  { key: 'uniqueOwnedMax', icon: '📚', name: '图鉴规模', unit: '种', tiers: [[30, 8], [100, 25], [160, 60]] },
  { key: 'archetypesMastered', icon: '🧩', name: '体系博物馆', unit: '套完整体系', tiers: [[1, 15], [5, 40], [10, 80]] },
  { key: 'specialCardsAcquired', icon: '🌈', name: '特效收藏家', unit: '张特效卡', tiers: [[1, 8], [10, 25], [50, 60]] },
  { key: 'premiumSpecialsAcquired', icon: '✍️', name: '顶级藏品', unit: '张签名/编号卡', tiers: [[1, 15], [5, 40], [20, 90]] },
  { key: 'consignmentsSold', icon: '🏷️', name: '寄售经理', unit: '笔寄售', tiers: [[5, 8], [30, 25], [150, 60]] },
  { key: 'auctionsSold', icon: '🔨', name: '拍卖行常客', unit: '场成交', tiers: [[1, 12], [10, 35], [50, 80]] },
  { key: 'npcFriendships', icon: '💞', name: '收藏圈名人', unit: '位挚友', tiers: [[1, 12], [5, 35], [12, 75]] },
];

const emptyProgressStats = () => ({
  packsOpened: 0, cardsOpened: 0, cardsAcquired: 0, cardsSold: 0,
  tradeDeals: 0, hagglesWon: 0, commissionsCompleted: 0,
  moneyEarned: 0, maxOwned: 0, eliteHighScore: 0,
  maxProfit: 0, reputationEarned: 0, reputationSpent: 0,
  coresAcquired: 0, urAcquired: 0, uniqueOwnedMax: 0, archetypesMastered: 0,
  specialCardsAcquired: 0, premiumSpecialsAcquired: 0,
  consignmentsSold: 0, auctionsSold: 0, npcFriendships: 0,
});

const career = { stats: emptyProgressStats(), completed: {}, challenges: {}, masteredArchetypes: {}, points: 0 };

// 升级线
const UPGRADES = {
  supply: {
    name: '卡包货源', icon: '📦', maxLv: 7, baseCost: 60, costMult: 1.45,
    desc: '每级让每日共享卡包货源 +1 包并扩大批发容量；关键等级解锁新的批次和采购折扣',
  },
  promo: {
    name: '宣传推广', icon: '📣', maxLv: 5, baseCost: 90, costMult: 1.6,
    desc: '打广告招揽客人，每级让每天来访的 NPC +1 位，并提高 13% 店内成交机会',
  },
  intel: {
    name: '情报信源', icon: '🕵️', maxLv: 3, baseCost: 100, costMult: 1.6,
    desc: '发展情报网络；除传闻与削弱标注外，逐级提供店内需求、成交率区间和精确成交率',
  },
  packs: {
    name: '卡包经营许可', icon: '🎫', maxLv: 4, baseCost: 120, costMult: 1.55,
    desc: '逐级解锁优惠包、大包、主题包与经典纪念包，同时取得对应批发商品的经营许可',
  },
  broker: {
    name: '市场渠道', icon: '🏦', maxLv: 5, baseCost: 90, costMult: 1.5,
    desc: '优化交易渠道；Lv.2 解锁寄售，Lv.4 解锁特效卡拍卖，并逐级降低各渠道手续费',
  },
};

const STORE_LEVELS = [
  { name: '收藏小摊', icon: '🧺', cost: 0,     worth: 0,     season: 1, upgrades: 0,  slots: 2,  customers: 1 },
  { name: '街边卡店', icon: '🏪', cost: 400,   worth: 800,   season: 1, upgrades: 3,  slots: 4,  customers: 1 },
  { name: '人气店铺', icon: '✨', cost: 1200,  worth: 2500,  season: 2, upgrades: 7,  slots: 6,  customers: 2 },
  { name: '区域名店', icon: '🏬', cost: 3500,  worth: 8000,  season: 3, upgrades: 12, slots: 8,  customers: 2 },
  { name: '城市旗舰店', icon: '🌆', cost: 9000, worth: 25000, season: 4, upgrades: 18, slots: 10, customers: 3 },
  { name: '连锁品牌', icon: '👑', cost: 24000, worth: 70000, season: 6, upgrades: 24, slots: 12, customers: 4 },
];

const RETAIL_PRICE_OPTIONS = [90, 100, 110, 125, 140, 160];
const BRANCH_MAX = 10;
const BRANCH_SLOTS = 4;

const WHOLESALE_TYPES = {
  standard: {
    name: '标准批次', icon: '📦', supplyLv: 2, packsLv: 0, season: 1, count: 15, days: 1, priceFactor: 0.92,
    desc: '当季常规混装，数量稳定，适合作为基础货架库存',
  },
  clearance: {
    name: '清仓托盘', icon: '🏷️', supplyLv: 3, packsLv: 1, season: 1, count: 28, days: 1, priceFactor: 0.88,
    desc: 'N、R 卡为主的大宗尾货，便宜但需要时间消化',
  },
  theme: {
    name: '体系批次', icon: '🎯', supplyLv: 4, packsLv: 3, season: 1, count: 20, days: 2, priceFactor: 0.94,
    desc: '集中供应本季主题体系，需求较高但采购价也更高',
  },
  classic: {
    name: '老卡仓库', icon: '🕰️', supplyLv: 6, packsLv: 4, season: 2, count: 22, days: 2, priceFactor: 0.90,
    desc: '往季库存与少量退环境卡，价值和流动性差异很大',
  },
  premium: {
    name: '高端藏品批次', icon: '💎', supplyLv: 7, packsLv: 4, season: 3, count: 8, days: 3, priceFactor: 0.97,
    desc: '至少两张 SR 以上，资金占用时间长，适合成熟店铺',
  },
};

// ==================== 工具 ====================
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const randf = (a, b) => Math.random() * (b - a) + a;
// 两次均匀随机取平均：仍覆盖完整区间，但中间值比极端值更常见。
const triRandf = (a, b) => (randf(a, b) + randf(a, b)) / 2;
const triRand = (a, b) => Math.round(triRandf(a, b));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const $ = id => document.getElementById(id);

// ==================== 卡池生成 ====================
const cardPool = [];

function rollRarity() {
  const r = Math.random() * 100;
  if (r < 62) return 'N';
  if (r < 88) return 'R';
  if (r < 98) return 'SR';
  return 'UR';
}

function rollBodyStats(t) {
  const [eMin, eMax] = EFFICIENCY_RANGE[t.rarity];
  const total = Math.max(2, Math.round(t.cost * 2 * triRandf(eMin, eMax)));
  const atk = clamp(Math.round(total * triRandf(...ATTACK_SHARE_RANGE)), 1, total - 1);
  t.atk = atk;
  t.hp = total - atk;
}

function rollEffectValue(t, effect) {
  if (effect.k === 'ult') {
    const ult = CORE_ULTS[t.archetype];
    return triRand(ult.vMin, ult.vMax);
  }
  const [vMin, vMax] = EFFECT_VALUE_RANGE[effect.k];
  const costCap = Math.max(1, Math.round(t.cost * 0.65));
  const cap = Math.min(vMax, RARITY_EFFECT_CAP[t.rarity], costCap);
  return triRand(vMin, Math.max(vMin, cap));
}

function rollEffectKinds(t) {
  const cfg = EFFECT_COUNT_ROLL[t.rarity];
  let n = cfg.min;
  if (cfg.oneChance && Math.random() < cfg.oneChance) n = 1;
  if (cfg.twoChance && Math.random() < cfg.twoChance) n = 2;
  if (t.cost <= 1) n = 0;
  const keys = Object.keys(EFFECTS);
  const effects = [];
  while (effects.length < n) {
    const k = pick(keys);
    if (!effects.some(e => e.k === k)) effects.push({ k, v: 1 });
  }
  return effects;
}

function rollCost(t, range, isSeasonReroll) {
  if (!isSeasonReroll || typeof t.cost !== 'number') return triRand(...range);
  // 费用是强度波动最大的杠杆：每季 50% 不变、25% 各升降 1，且不越过稀有度边界。
  return clamp(t.cost + pick([-1, 0, 0, 1]), range[0], range[1]);
}

// 初次生成决定效果类型；之后每赛季只重投数值，保留卡牌身份。
function rollCardStats(t, keepEffectKinds) {
  if (t.tier === 'core') {
    const costRange = CORE_COST_RANGES[t.rarity] || CORE_COST_RANGES.UR;
    t.cost = rollCost(t, costRange, keepEffectKinds);
    rollBodyStats(t);
    const ult = CORE_ULTS[t.archetype];
    const ultMax = t.rarity === 'R' ? ult.vMin : t.rarity === 'SR' ? Math.max(ult.vMin, ult.vMax - 1) : ult.vMax;
    t.effects = [{ k: 'ult', v: triRand(ult.vMin, ultMax) }];
    return;
  }
  t.cost = rollCost(t, COST_RANGE[t.rarity], keepEffectKinds);
  rollBodyStats(t);
  if (!keepEffectKinds || !Array.isArray(t.effects)) t.effects = rollEffectKinds(t);
  t.effects.forEach(e => { e.v = rollEffectValue(t, e); });
}

function genStats(t) {
  rollCardStats(t, false);
}

// 体系核心：固定UR、高费、携带体系绝招
function genCoreStats(t) {
  rollCardStats(t, false);
}

function makeTemplate(id, name, rarity, arch, tier) {
  const t = {
    id, name, rarity, archetype: arch,
    artStyle: pick(Object.keys(ARTSTYLES)),
    tier, usageMod: null,
  };
  if (tier === 'core') t.coreRank = rarity === 'UR' ? 'primary' : rarity === 'SR' ? 'advanced' : 'entry';
  if (tier === 'core') genCoreStats(t); else genStats(t);
  return t;
}

// 体系核心卡名：核心词保留给核心卡
const coreWordsOf = arch => [CORE_WORD[arch]];

function buildPool() {
  const used = new Set();
  let id = 0;
  for (const arch of Object.keys(ARCHETYPES)) {
    const partWords = CORES[arch].filter(w => !coreWordsOf(arch).includes(w));
    // 体系核心（每体系1张，UR）
    let coreName;
    do { coreName = pick(PREFIX) + CORE_WORD[arch]; } while (used.has(coreName));
    used.add(coreName);
    cardPool.push(makeTemplate(id++, coreName, 'UR', arch, 'core'));
    // 两张容易获得的启动核心，让玩家没有 UR 时也能搭起体系骨架。
    for (const rarity of ['R', 'SR']) {
      let name;
      do { name = pick(PREFIX) + pick(partWords); } while (used.has(name));
      used.add(name);
      cardPool.push(makeTemplate(id++, name, rarity, arch, 'core'));
    }
    // 体系组件
    for (let i = 0; i < PARTS_PER_ARCH; i++) {
      let name;
      do { name = pick(PREFIX) + pick(partWords); } while (used.has(name));
      used.add(name);
      const rarity = i === 0 ? 'SR' : rollRarity();   // 每体系保底一张SR组件
      cardPool.push(makeTemplate(id++, name, rarity, arch, 'part'));
    }
    // 泛用强卡
    for (let i = 0; i < GENERICS_PER_ARCH; i++) {
      let name;
      do { name = pick(PREFIX) + pick(partWords); } while (used.has(name));
      used.add(name);
      cardPool.push(makeTemplate(id++, name, rollRarity(), arch, 'generic'));
    }
  }
}

// 旧档迁移：为已加载卡池补充分层与数量（新体系整套生成，旧体系补足组件/泛用）
function ensureTiers() {
  let nextId = Math.max(...cardPool.map(t => t.id)) + 1;
  const used = new Set(cardPool.map(t => t.name));
  cardPool.forEach(t => { if (!t.tier) t.tier = 'part'; });
  for (const arch of Object.keys(ARCHETYPES)) {
    const partWords = CORES[arch].filter(w => !coreWordsOf(arch).includes(w));
    if (!cardPool.some(t => t.archetype === arch && t.tier === 'core')) {
      let coreName;
      do { coreName = pick(PREFIX) + CORE_WORD[arch]; } while (used.has(coreName));
      used.add(coreName);
      cardPool.push(makeTemplate(nextId++, coreName, 'UR', arch, 'core'));
    }
    const cores = cardPool.filter(t => t.archetype === arch && t.tier === 'core');
    const primary = cores.find(t => t.rarity === 'UR') || cores[0];
    if (primary) primary.coreRank = 'primary';
    // 旧存档迁移：从原有 13 张组件中各晋升一张 R / SR 核心，卡池总量保持不变。
    for (const spec of [{ rarity: 'R', rank: 'entry' }, { rarity: 'SR', rank: 'advanced' }]) {
      if (cores.some(t => t.rarity === spec.rarity)) continue;
      const candidates = cardPool.filter(t => t.archetype === arch && t.tier === 'part');
      const promoted = candidates.find(t => t.rarity === spec.rarity) || candidates[0];
      if (!promoted) continue;
      promoted.tier = 'core';
      promoted.rarity = spec.rarity;
      promoted.coreRank = spec.rank;
      genCoreStats(promoted);
      cores.push(promoted);
    }
    const p = cardPool.filter(t => t.archetype === arch && t.tier === 'part').length;
    for (let i = p; i < PARTS_PER_ARCH; i++) {
      let name;
      do { name = pick(PREFIX) + pick(partWords); } while (used.has(name));
      used.add(name);
      const rarity = p === 0 && i === 0 ? 'SR' : rollRarity();  // 全新体系保底一张SR组件
      cardPool.push(makeTemplate(nextId++, name, rarity, arch, 'part'));
    }
    const g = cardPool.filter(t => t.archetype === arch && t.tier === 'generic').length;
    for (let i = g; i < GENERICS_PER_ARCH; i++) {
      let name;
      do { name = pick(PREFIX) + pick(partWords); } while (used.has(name));
      used.add(name);
      cardPool.push(makeTemplate(nextId++, name, rollRarity(), arch, 'generic'));
    }
  }
}

// ==================== 赛季与估值 ====================
const curSeason = () => Math.floor((state.day - 1) / SEASON_LENGTH) + 1;

// 收藏键：模板ID_赛季
const keyOf = (id, s) => `${id}_${s}`;
function parseKey(k) {
  const [id, s] = k.split('_').map(Number);
  return { id, s };
}

const seasonAge = s => Math.max(0, curSeason() - s);
const isRotated = s => seasonAge(s) >= 3;

// 赛季价值系数直接乘最终估值：S1 在 S2/S3 为 95%/90%，S4 起退环境为 12%。
function seasonFactor(s) {
  if (state.reprint && state.reprint.season === s) return REPRINT_FACTOR;
  const age = seasonAge(s);
  return age < SEASON_VALUE_FACTORS.length ? SEASON_VALUE_FACTORS[age] : ROTATED_VALUE_FACTOR;
}

// ==================== 强度指标与meta模拟 ====================
// 单卡强度 = (攻击+生命+Σ效果强度×效果数值)/费用；绝招强度系数来自 CORE_ULTS
function cardPower(t) {
  const fx = t.effects.reduce((s, e) =>
    s + (e.k === 'ult' ? CORE_ULTS[t.archetype].str : EFFECTS[e.k]) * e.v, 0);
  return (t.atk + t.hp + fx) / t.cost;
}

// 新赛季重投所有模板的数值。效果种类不变；所有印次共享本赛季规则数值。
function rerollSeasonStats() {
  const changes = cardPool.map(t => {
    const before = cardPower(t);
    const old = { cost: t.cost, atk: t.atk, hp: t.hp };
    rollCardStats(t, true);
    const after = cardPower(t);
    const pct = before > 0 ? Math.round((after / before - 1) * 100) : 0;
    t.seasonDelta = {
      season: curSeason(),
      cost: t.cost - old.cost,
      atk: t.atk - old.atk,
      hp: t.hp - old.hp,
      powerPct: pct,
    };
    t.usageMod = null;
    delete t.wr;
    delete t.usage;
    delete t.prevHeat;
    return { t, pct };
  });
  state.statRollSeason = curSeason();
  state.statRollVersion = STAT_ROLL_VERSION;
  return changes;
}

// 标准化：返回 {z: Map(模板->z分)}，标准差为0时全为0
function zScores(vals) {
  const n = vals.length;
  const mean = vals.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / n) || 1;
  return vals.map(v => (v - mean) / sd);
}

// 强度指标 = 自身权重×z(单卡强度) + 体系权重×z(体系强度)，权重按分层区分
// 体系强度 = 分层加权的体系内单卡强度（核心权重最大，泛用最小）
function computeIndex() {
  const cps = cardPool.map(cardPower);
  const zCard = zScores(cps);
  const archAvg = {};
  for (const a of Object.keys(ARCHETYPES)) {
    const ts = cardPool.filter(t => t.archetype === a);
    let wSum = 0, pSum = 0;
    ts.forEach(t => {
      const w = TIER_ARCH_CONTRIB[t.tier] || 1;
      wSum += w;
      pSum += cardPower(t) * w;
    });
    archAvg[a] = pSum / wSum;
  }
  const zArchVals = zScores(Object.keys(ARCHETYPES).map(a => archAvg[a]));
  const zArch = {};
  Object.keys(ARCHETYPES).forEach((a, i) => { zArch[a] = zArchVals[i]; });
  const index = cardPool.map((t, i) =>
    (TIER_SELF_W[t.tier] || 1) * zCard[i] + (TIER_ARCH_W[t.tier] || 1) * zArch[t.archetype]);
  // 强度百分位 p：1=最强 0=最弱
  const order = index.map((v, i) => i).sort((a, b) => index[b] - index[a]);
  const p = new Array(cardPool.length);
  order.forEach((id, rank) => { p[id] = 1 - rank / (cardPool.length - 1); });
  return { p, zCard, index };
}

// 隐性热度：由使用率与胜率推导，不向玩家展示
// 热度允许突破 100：100 代表“版本热门”，不再是估值硬上限。
// 胜率与使用率仍受各自上限约束，因此原始热度本身也有自然边界。
const hiddenHeat = t => Math.max(3, Math.round(t.usage * Math.pow(2, (t.wr - 50) / 6)));

// 每日meta模拟：强度排名 → 胜率/使用率基准 → 向基准回归
function simMeta() {
  const { p } = computeIndex();
  cardPool.forEach((t, i) => {
    const themed = state.themes.includes(t.archetype);
    const wrBase = 42 + 16 * p[i];
    const usageBase = clamp((10 + 50 * Math.pow(p[i], 1.5)) * (themed ? THEME_USAGE_MULT : 1), 5, 95);
    const mod = t.usageMod ? t.usageMod.mult : 1;
    if (typeof t.wr !== 'number') { t.wr = wrBase; t.usage = clamp(usageBase * mod, 5, 95); }
    t.prevHeat = hiddenHeat(t);
    t.wr = clamp(Math.round((t.wr + (wrBase - t.wr) * 0.25 + randf(-1.5, 1.5)) * 10) / 10, 35, 65);
    t.usage = clamp(Math.round((t.usage + (usageBase - t.usage) * 0.25 + randf(-1.5, 1.5)) * mod * 10) / 10, 5, 95);
  });
  refreshNerfWatch();
}

// 被调整率评分：受单卡强度影响更大（0.7），强度指标占0.3
function nerfScores() {
  const { zCard, index } = computeIndex();
  const zIdx = zScores(index);
  return cardPool.map((t, i) => 0.7 * zCard[i] + 0.3 * zIdx[i]);
}

function refreshNerfWatch() {
  const scores = nerfScores();
  state.nerfWatch = scores.map((s, i) => i).sort((a, b) => scores[b] - scores[a]).slice(0, 3);
}

const effectiveHeat = (t, s) => Math.round(hiddenHeat(t) * seasonFactor(s));

// 热度系数：0热度=0.3x，100热度=2.0x
// 0~100 沿用原曲线；突破 100 后改用对数增长，热门核心能继续升值但不会失控。
// 例如 UR 在热度 100/150/250/400 时约值 480/563/667/763。
const heatMult = h => h <= 100
  ? 0.3 + (h / 100) * 1.7
  : 2 + 0.85 * Math.log(h / 100);
const cardValueAtFactor = (t, factor) =>
  Math.max(1, Math.round(RARITIES[t.rarity].base * heatMult(hiddenHeat(t)) * factor));
const cardValue = (t, s) => cardValueAtFactor(t, seasonFactor(s));

function specialSerialFactor(serial) {
  if (!serial) return 1;
  if (serial === 1) return 2.5;
  if (serial <= 10) return 1.6;
  if (serial <= 30) return 1.25;
  return 1;
}

function specialValue(card) {
  const t = cardPool[card.id];
  if (!t || !SPECIAL_FINISHES[card.finish]) return 0;
  const finish = SPECIAL_FINISHES[card.finish];
  const permanentPremium = cardValueAtFactor(t, 1) * (finish.mult - 1) * specialSerialFactor(card.serial);
  return Math.max(1, Math.round(cardValue(t, card.s) + permanentPremium));
}

function specialLabel(card) {
  if (!card || !SPECIAL_FINISHES[card.finish]) return '';
  return `${SPECIAL_FINISHES[card.finish].icon} ${SPECIAL_FINISHES[card.finish].name}${card.serial ? ` · ${String(card.serial).padStart(3, '0')}/100` : ''}`;
}

function makeSpecialCard(id, s, finish, source, serial = 0) {
  return {
    uid: `sp-${state.day}-${Math.random().toString(36).slice(2, 10)}`,
    id, s, finish, serial: finish === 'numbered' ? (serial || rand(1, 100)) : 0,
    source: source || '未知来源', locked: true,
  };
}

function rollPackFinish() {
  const r = Math.random();
  if (r < 0.0001) return 'numbered';
  if (r < 0.0005) return 'signed';
  if (r < 0.0035) return 'holo';
  if (r < 0.0185) return 'foil';
  return '';
}

function rollMarketFinish() {
  const r = Math.random();
  if (r < 0.0001) return 'numbered';
  if (r < 0.0004) return 'signed';
  if (r < 0.0019) return 'holo';
  if (r < 0.0099) return 'foil';
  return '';
}

function addSpecialCard(card) {
  state.specialCards.push(card);
  recordProgress('specialCardsAcquired', 1);
  if (card.finish === 'signed' || card.finish === 'numbered') recordProgress('premiumSpecialsAcquired', 1);
}

// ==================== 游戏状态 ====================
const state = {
  day: 1,
  money: 300,
  collection: {},   // "templateId_赛季" -> 数量
  cardLocks: {},    // 收藏保护：锁定后不参与自动上架和出售
  specialCards: [], // 独立特效卡实例 [{uid,id,s,finish,serial,source,locked}]
  market: [],       // [{id, s, price}]
  consignments: [], // 普通卡寄售 [{id,s,askPct,daysLeft}]
  auctions: [],     // 特效卡拍卖 [{card,reservePct,endDay,currentBid,bidders}]
  lastMarketReport: { day: 0, consignSold: 0, consignNet: 0, auctionsSold: 0, auctionNet: 0 },
  dealers: [],      // 今日私下交易访客实例
  offers: [],       // [{dealerId, mode:'buy'|'sell', id, s, price, rounds}]
  rumors: [],       // [{kind, target, delta, src, chance}] 关于明天的传闻
  log: [],          // [{t, c}] 市场动态
  trades: [],       // [{t, c}] 我的交易
  history: [],      // [{d, v}] 每日身价
  upgrades: { supply: 0, promo: 0, intel: 0, packs: 0, broker: 0 },
  storeLevel: 0,
  storeBranches: 0,
  retailListings: [], // [{key, pricePct}]：从收藏中陈列一张，成交后扣除
  lastRetailReport: { day: 0, sales: 0, gross: 0, net: 0 },
  wholesaleOffers: [],
  wholesaleOrders: [],
  wholesaleSpent: 0,
  lastWholesaleReport: { day: 0, orders: 0, cards: 0, value: 0 },
  packsBought: 0,   // 今日已购卡包数
  packTypeBought: {}, // 今日各特殊卡包购买数
  reprint: null,    // {season, daysLeft} 复刻活动
  themes: [],       // 本赛季主题体系（2个）
  nerfWatch: [],    // 削弱风险最高的模板id（供情报标注）
  statRollSeason: 1,// 最近一次完成数值重投的赛季
  statRollVersion: STAT_ROLL_VERSION,
  commissions: [], // 今日委托池
  activeCommissions: [],
  commissionAccepted: 0,
  commissionSeason: 1,
  reputation: 0,
  lifetimeReputation: 0,
  collectorHeat: 0,
  npcRelationships: {}, // "profile:name" -> 信任、成交、预约目标
  npcReservation: null,
  reputationUpgrades: { board: 0, locks: 0, seasonCap: 0, concurrent: 0, reward: 0, carryLock: 0, collectors: 0 },
  runStats: emptyProgressStats(),
  runStartWorth: 300,
};

function netWorth() {
  let v = state.money;
  for (const k of Object.keys(state.collection)) {
    const { id, s } = parseKey(k);
    v += cardValue(cardPool[id], s) * state.collection[k];
  }
  v += state.specialCards.reduce((sum, card) => sum + specialValue(card), 0);
  v += state.consignments.reduce((sum, item) => sum + cardValue(cardPool[item.id], item.s), 0);
  v += state.auctions.reduce((sum, item) => sum + specialValue(item.card), 0);
  return v;
}

function addLog(msg, cls = '') {
  state.log.push({ t: `第${state.day}天　${msg}`, c: cls });
  if (state.log.length > 80) state.log.shift();
  renderLog();
}

// 自己的交易行为单独记录，与市场动态分开
function addTrade(msg, cls = '') {
  state.trades.push({ t: `第${state.day}天　${msg}`, c: cls });
  if (state.trades.length > 80) state.trades.shift();
  renderTrades();
}

function flash(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(flash._t);
  flash._t = setTimeout(() => t.classList.remove('show'), 1500);
}

// ==================== 存档 ====================
function saveGame() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      day: state.day,
      money: state.money,
      collection: state.collection,
      cardLocks: state.cardLocks,
      specialCards: state.specialCards,
      market: state.market,
      consignments: state.consignments,
      auctions: state.auctions,
      lastMarketReport: state.lastMarketReport,
      dealers: state.dealers,
      offers: state.offers,
      rumors: state.rumors,
      log: state.log,
      trades: state.trades,
      history: state.history,
      upgrades: state.upgrades,
      storeLevel: state.storeLevel,
      storeBranches: state.storeBranches,
      retailListings: state.retailListings,
      lastRetailReport: state.lastRetailReport,
      wholesaleOffers: state.wholesaleOffers,
      wholesaleOrders: state.wholesaleOrders,
      wholesaleSpent: state.wholesaleSpent,
      lastWholesaleReport: state.lastWholesaleReport,
      packsBought: state.packsBought,
      packTypeBought: state.packTypeBought,
      reprint: state.reprint,
      themes: state.themes,
      statRollSeason: state.statRollSeason,
      statRollVersion: state.statRollVersion,
      commissions: state.commissions,
      activeCommissions: state.activeCommissions,
      commissionAccepted: state.commissionAccepted,
      commissionSeason: state.commissionSeason,
      reputation: state.reputation,
      lifetimeReputation: state.lifetimeReputation,
      collectorHeat: state.collectorHeat,
      npcRelationships: state.npcRelationships,
      npcReservation: state.npcReservation,
      reputationUpgrades: state.reputationUpgrades,
      runStats: state.runStats,
      runStartWorth: state.runStartWorth,
      pool: cardPool,
    }));
  } catch (e) { /* 存档失败不阻塞游戏 */ }
  saveCareer();
}

function saveCareer() {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(CAREER_KEY, JSON.stringify(career)); } catch (e) {}
}

function loadCareer() {
  if (typeof localStorage === 'undefined') return;
  try {
    const d = JSON.parse(localStorage.getItem(CAREER_KEY) || 'null');
    if (!d) return;
    career.stats = { ...emptyProgressStats(), ...(d.stats || {}) };
    career.completed = d.completed || {};
    career.challenges = d.challenges || {};
    career.masteredArchetypes = d.masteredArchetypes || {};
    career.points = d.points || 0;
  } catch (e) {}
}

function currentOwnedCards() {
  return Object.values(state.collection).reduce((sum, n) => sum + n, 0)
    + state.specialCards.length + state.consignments.length + state.auctions.length;
}

function checkAchievements() {
  state.runStats.maxOwned = Math.max(state.runStats.maxOwned || 0, currentOwnedCards());
  const uniqueOwned = new Set([
    ...Object.keys(state.collection),
    ...state.specialCards.map(c => `${c.id}_${c.s}_${c.finish}_${c.serial || 0}`),
  ]).size;
  state.runStats.uniqueOwnedMax = Math.max(state.runStats.uniqueOwnedMax || 0, uniqueOwned);
  career.stats.uniqueOwnedMax = Math.max(career.stats.uniqueOwnedMax || 0, uniqueOwned);
  const ownedTemplateIds = new Set([...Object.keys(state.collection).map(k => parseKey(k).id), ...state.specialCards.map(c => c.id)]);
  const completeArchetypes = Object.keys(ARCHETYPES).filter(arch =>
    cardPool.filter(t => t.archetype === arch).every(t => ownedTemplateIds.has(t.id)));
  state.runStats.archetypesMastered = Math.max(state.runStats.archetypesMastered || 0, completeArchetypes.length);
  completeArchetypes.forEach(arch => { career.masteredArchetypes[arch] = true; });
  career.stats.archetypesMastered = Object.keys(career.masteredArchetypes).length;
  state.runStats.maxProfit = Math.max(state.runStats.maxProfit || 0, netWorth() - state.runStartWorth);
  RUN_CHALLENGES.forEach(a => {
    if (career.challenges[a.id] || state.day > a.deadline || (state.runStats[a.metric] || 0) < a.target) return;
    career.challenges[a.id] = { day: state.day };
    career.points += a.points;
    addLog(`🏆 永久完成单局挑战【${a.name}】，成就点 +${a.points}`, 'good');
  });
  CAREER_MILESTONE_GROUPS.forEach(group => group.tiers.forEach(([target, points], tier) => {
    const id = `${group.key}_${target}`;
    if (career.completed[id] || (career.stats[group.key] || 0) < target) return;
    career.completed[id] = { day: state.day, tier: tier + 1 };
    career.points += points;
    addLog(`🌟 达成生涯里程碑【${group.name} ${['Ⅰ', 'Ⅱ', 'Ⅲ'][tier]}】，成就点 +${points}`, 'good');
  }));
  saveCareer();
}

function recordProgress(key, amount = 1) {
  state.runStats[key] = (state.runStats[key] || 0) + amount;
  career.stats[key] = (career.stats[key] || 0) + amount;
  checkAchievements();
}

function recordCardAcquisition(templates) {
  const cards = Array.isArray(templates) ? templates : [templates];
  state.runStats.cardsAcquired += cards.length;
  career.stats.cardsAcquired += cards.length;
  const cores = cards.filter(t => t && t.tier === 'core').length;
  const urs = cards.filter(t => t && t.rarity === 'UR').length;
  state.runStats.coresAcquired += cores;
  career.stats.coresAcquired += cores;
  state.runStats.urAcquired += urs;
  career.stats.urAcquired += urs;
  checkAchievements();
}

function loadGame() {
  if (typeof localStorage === 'undefined') return false;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.pool) || !d.pool.length) return false;
    cardPool.length = 0;
    // 旧存档迁移：无战斗数值的模板补齐，移除热度字段
    d.pool.forEach(t => {
      if (typeof t.cost !== 'number') genStats(t);
      delete t.heat;
      delete t.baseHeat;
      if (t.usageMod === undefined) t.usageMod = null;
      cardPool.push(t);
    });
    ensureTiers();
    state.day = d.day || 1;
    state.money = d.money || 0;
    // 旧存档迁移：无赛季的收藏键归入第1赛季
    state.collection = {};
    for (const [k, v] of Object.entries(d.collection || {})) {
      state.collection[k.includes('_') ? k : `${k}_1`] = v;
    }
    state.cardLocks = Object.fromEntries(Object.keys(d.cardLocks || {}).filter(k => state.collection[k]).map(k => [k, true]));
    state.specialCards = (Array.isArray(d.specialCards) ? d.specialCards : []).filter(c =>
      c && cardPool[c.id] && SPECIAL_FINISHES[c.finish] && Number.isFinite(c.s))
      .map(c => ({ ...c, uid: c.uid || `sp-load-${Math.random().toString(36).slice(2)}`, locked: c.locked !== false }));
    state.market = (d.market || []).map(l => ({ ...l, s: l.s || 1 }));
    state.consignments = (Array.isArray(d.consignments) ? d.consignments : [])
      .filter(x => x && cardPool[x.id] && Number.isFinite(x.s))
      .map(x => ({ ...x, askPct: CONSIGN_PRICE_OPTIONS.includes(Number(x.askPct)) ? Number(x.askPct) : 115, daysLeft: Math.max(1, Number(x.daysLeft) || 1) }));
    state.auctions = (Array.isArray(d.auctions) ? d.auctions : [])
      .filter(x => x && x.card && cardPool[x.card.id] && SPECIAL_FINISHES[x.card.finish])
      .map(x => ({ ...x, reservePct: AUCTION_RESERVE_OPTIONS.includes(Number(x.reservePct)) ? Number(x.reservePct) : 110, endDay: Math.max(state.day + 1, Number(x.endDay) || state.day + 1), currentBid: Math.max(0, Number(x.currentBid) || 0), bidders: Math.max(0, Number(x.bidders) || 0) }));
    state.lastMarketReport = d.lastMarketReport && typeof d.lastMarketReport === 'object'
      ? { day: 0, consignSold: 0, consignNet: 0, auctionsSold: 0, auctionNet: 0, ...d.lastMarketReport }
      : { day: 0, consignSold: 0, consignNet: 0, auctionsSold: 0, auctionNet: 0 };
    state.dealers = (Array.isArray(d.dealers) ? d.dealers : []).map(dealer => {
      const profile = NPC_PROFILES.find(p => p.key === dealer.profile);
      const quality = clamp(Number(dealer.quality) || 0, 0, NPC_QUALITY.length - 1);
      const budgetCap = quality ? NPC_QUALITY[quality].budget[1] : profile ? profile.budget[1] : 200;
      const maxTrades = Math.max(2, dealer.maxTrades || (profile ? rand(profile.trades[0], profile.trades[1]) : 2));
      return {
        ...dealer,
        quality,
        budget: Math.min(dealer.budget || 0, budgetCap),
        maxBudget: Math.min(dealer.maxBudget || budgetCap, budgetCap),
        maxTrades,
        tradesDone: dealer.tradesDone || 0,
      };
    });
    state.offers = (d.offers || []).map(o => ({ ...o, s: o.s || 1, rounds: o.rounds || 0 }));
    state.rumors = (d.rumors || []).filter(r => r.v === 2);
    state.log = d.log || [];
    state.trades = d.trades || [];
    state.history = d.history || [];
    state.upgrades = {
      supply: 0, promo: 0, intel: 0, packs: 0, broker: 0,
      ...(d.upgrades || {}),
    };
    state.storeLevel = clamp(Number(d.storeLevel) || 0, 0, STORE_LEVELS.length - 1);
    state.storeBranches = clamp(Math.floor(Number(d.storeBranches) || 0), 0, BRANCH_MAX);
    state.retailListings = (Array.isArray(d.retailListings) ? d.retailListings : [])
      .filter(l => l && typeof l.key === 'string' && RETAIL_PRICE_OPTIONS.includes(Number(l.pricePct)))
      .map(l => ({ key: l.key, pricePct: Number(l.pricePct) }))
      .slice(0, STORE_LEVELS[state.storeLevel].slots + state.storeBranches * BRANCH_SLOTS);
    state.lastRetailReport = d.lastRetailReport && typeof d.lastRetailReport === 'object'
      ? { day: 0, sales: 0, gross: 0, net: 0, ...d.lastRetailReport }
      : { day: 0, sales: 0, gross: 0, net: 0 };
    state.wholesaleOffers = Array.isArray(d.wholesaleOffers) ? d.wholesaleOffers : [];
    state.wholesaleOrders = Array.isArray(d.wholesaleOrders) ? d.wholesaleOrders : [];
    state.wholesaleSpent = Math.max(0, Number(d.wholesaleSpent) || 0);
    state.lastWholesaleReport = d.lastWholesaleReport && typeof d.lastWholesaleReport === 'object'
      ? { day: 0, orders: 0, cards: 0, value: 0, ...d.lastWholesaleReport }
      : { day: 0, orders: 0, cards: 0, value: 0 };
    state.packsBought = d.packsBought || 0;
    state.packTypeBought = d.packTypeBought || {};
    state.reprint = d.reprint || null;
    state.themes = Array.isArray(d.themes) && d.themes.length === 2 ? d.themes : rollThemes();
    // 旧档从下一个赛季开始使用新版重投，避免读档瞬间改变现有行情。
    state.statRollSeason = d.statRollSeason || curSeason();
    state.statRollVersion = d.statRollVersion || 1;
    state.commissions = (Array.isArray(d.commissions) ? d.commissions : []).map(c => ({ ...c, type: c.type || 'standard' }));
    state.activeCommissions = (Array.isArray(d.activeCommissions) ? d.activeCommissions : [])
      .map(c => ({ ...c, type: c.type || 'standard', deck: c.deck && typeof c.deck === 'object' ? c.deck : {} }));
    state.commissionAccepted = d.commissionAccepted || 0;
    state.commissionSeason = d.commissionSeason || curSeason();
    state.reputation = Math.max(0, d.reputation || 0);
    state.lifetimeReputation = Math.max(state.reputation, d.lifetimeReputation || 0);
    state.collectorHeat = Math.max(0, Number(d.collectorHeat) || 0);
    state.npcRelationships = {};
    for (const [key, rel] of Object.entries(d.npcRelationships && typeof d.npcRelationships === 'object' ? d.npcRelationships : {})) {
      if (!rel || typeof rel !== 'object') continue;
      state.npcRelationships[key] = {
        trust: clamp(Number(rel.trust) || 0, 0, 60), deals: Math.max(0, Number(rel.deals) || 0),
        haggles: Math.max(0, Number(rel.haggles) || 0),
        targetArch: ARCHETYPES[rel.targetArch] ? rel.targetArch : pick(Object.keys(ARCHETYPES)),
        wantedArch: ARCHETYPES[rel.wantedArch] ? rel.wantedArch : '', friendshipRecorded: !!rel.friendshipRecorded,
      };
    }
    state.npcReservation = d.npcReservation && typeof d.npcReservation === 'object' ? d.npcReservation : null;
    state.reputationUpgrades = {
      board: 0, locks: 0, seasonCap: 0, concurrent: 0, reward: 0, carryLock: 0, collectors: 0,
      ...(d.reputationUpgrades || {}),
    };
    state.runStats = { ...emptyProgressStats(), ...(d.runStats || {}) };
    state.runStartWorth = Number.isFinite(d.runStartWorth) ? d.runStartWorth : 300;
    state.nerfWatch = [];
    if (cardPool.some(t => typeof t.usage !== 'number')) simMeta();
    refreshNerfWatch();
    ensureInsiderRumor();
    // 旧版私人交易只保存静态 npcIdx，无法对应随机访客；读档时重建当天来客。
    if (!state.dealers.length || state.offers.some(o => !o.dealerId)) makeOffers();
    if (state.commissionSeason !== curSeason()) resetCommissionSeason();
    if (!state.commissions.length) refreshCommissions(false);
    return true;
  } catch (e) { return false; }
}

function newGame() {
  if (!confirm('确定要重开一局吗？未完成的单局挑战进度会清空；已完成挑战、生涯里程碑和成就点永久保留。')) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

// ==================== 主题切换 ====================
const THEME_KEY = 'tcgmvp_theme';
function toggleTheme() {
  const root = document.documentElement;
  const dark = root.dataset.theme !== 'dark';
  if (dark) root.dataset.theme = 'dark'; else delete root.dataset.theme;
  try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch (e) {}
  renderThemeBtn();
}
function renderThemeBtn() {
  const b = $('themeBtn');
  if (!b) return;
  const dark = document.documentElement.dataset.theme === 'dark';
  b.textContent = dark ? '☀️' : '🌙';
  b.title = dark ? '切换到浅色主题' : '切换到深色主题';
}

// ==================== 路由 ====================
function currentRoute() {
  const h = (location.hash || '').replace('#/', '');
  return ROUTES.includes(h) ? h : 'home';
}

function renderRoute() {
  const r = currentRoute();
  document.querySelectorAll('.page').forEach(p =>
    p.classList.toggle('active', p.id === 'page-' + r));
  let activeTab = null;
  document.querySelectorAll('#nav a').forEach(a => {
    const active = a.dataset.route === r;
    a.classList.toggle('active', active);
    if (active) activeTab = a;
  });
  if (activeTab && typeof matchMedia === 'function' && matchMedia('(max-width: 700px)').matches) {
    requestAnimationFrame(() => activeTab.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'nearest', inline: 'center',
    }));
  }
  requestAnimationFrame(updateNavScrollCue);
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', renderRoute);
}

function updateNavScrollCue() {
  const nav = $('nav');
  const cue = $('navScrollCue');
  if (!nav || !cue) return;
  const overflowing = nav.scrollWidth > nav.clientWidth + 2;
  const atEnd = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 3;
  cue.classList.toggle('visible', overflowing && !atEnd);
}

function dismissNavSwipeHint() {
  const hint = $('navSwipeHint');
  if (hint) hint.classList.remove('show');
  try { localStorage.setItem(NAV_HINT_KEY, '1'); } catch (e) {}
}

function scrollNavForward() {
  const nav = $('nav');
  if (!nav) return;
  nav.scrollBy({ left: Math.max(180, nav.clientWidth * 0.7), behavior: 'smooth' });
  dismissNavSwipeHint();
}

function setupMobileNavGuide() {
  const nav = $('nav');
  if (!nav) return;
  nav.addEventListener('scroll', () => {
    updateNavScrollCue();
    if (nav.scrollLeft > 8) dismissNavSwipeHint();
  }, { passive: true });
  window.addEventListener('resize', updateNavScrollCue);
  requestAnimationFrame(() => {
    updateNavScrollCue();
    if (typeof matchMedia !== 'function' || !matchMedia('(max-width: 560px)').matches || nav.scrollWidth <= nav.clientWidth + 2) return;
    let seen = false;
    try { seen = localStorage.getItem(NAV_HINT_KEY) === '1'; } catch (e) {}
    if (!seen) {
      $('navSwipeHint').classList.add('show');
      setTimeout(dismissNavSwipeHint, 4500);
    }
  });
}

// ==================== 升级 ====================
const dailyPackLimit = () => 3 + state.upgrades.supply;
const dailyGuestCount = () => Math.min(1 + state.upgrades.promo, NPC_PROFILES.length);
const marketBuyMarkup = () => Math.max(1.05, BASE_MARKET_BUY_MARKUP - state.upgrades.broker * 0.02);
const marketSellRate = () => Math.min(0.95, BASE_MARKET_SELL_RATE + state.upgrades.broker * 0.03);

function upgradeCost(key) {
  const u = UPGRADES[key];
  return Math.round(u.baseCost * Math.pow(u.costMult, state.upgrades[key]) / 10) * 10;
}

function upgradeEffect(key, lv) {
  if (key === 'supply') {
    const batches = Object.values(WHOLESALE_TYPES).filter(x => x.supplyLv <= lv).map(x => x.name);
    return `每日共享货源 ${3 + lv} 包 · 批发容量 ¥${300 + lv * 300}${batches.length ? ` · 货源：${batches.join('、')}` : ''}`;
  }
  if (key === 'promo') return `每日 ${Math.min(1 + lv, NPC_PROFILES.length)} 位 NPC · 店内成交机会 +${lv * 13}%`;
  if (key === 'intel') return `每日额外传闻 +${lv}`
    + (lv >= 1 ? ` · 店内${['', '需求趋势', '成交率区间', '精确成交率'][lv]}` : '')
    + (lv >= 2 ? ' · 每日保底「内部线人」 · 行情板标注削弱风险' : '');
  if (key === 'packs') {
    const unlocked = ['标准卡包', '优惠标准包', '大包', '赛季主题包', '经典纪念包'].slice(0, lv + 1);
    const batches = Object.values(WHOLESALE_TYPES).filter(x => x.packsLv <= lv && x.packsLv > 0).map(x => x.name);
    return `可售：${unlocked.join('、')}${batches.length ? ` · 批发许可：${batches.join('、')}` : ''}`;
  }
  if (key === 'broker') {
    const buyFee = Math.round((marketBuyMarkupAt(lv) - 1) * 100);
    const sellRate = Math.round(marketSellRateAt(lv) * 100);
    const channels = lv >= 4 ? ` · 寄售 ${consignmentSlotsAt(lv)} 格/费率 ${consignmentFeeAt(lv)}% · 拍卖 ${auctionSlotsAt(lv)} 格/费率 ${auctionFeeAt(lv)}%`
      : lv >= 2 ? ` · 寄售 ${consignmentSlotsAt(lv)} 格/费率 ${consignmentFeeAt(lv)}%` : '';
    return `买入加价 ${buyFee}% · 卖出回收 ${sellRate}% · 店内实收 ${Math.round((0.92 + Math.min(5, lv) * 0.01) * 100)}%${channels}`;
  }
  return '';
}

const marketBuyMarkupAt = lv => Math.max(1.05, BASE_MARKET_BUY_MARKUP - lv * 0.02);
const marketSellRateAt = lv => Math.min(0.95, BASE_MARKET_SELL_RATE + lv * 0.03);
const consignmentSlotsAt = lv => lv < 2 ? 0 : lv;
const consignmentFeeAt = lv => Math.max(6, 11 - lv);
const auctionSlotsAt = lv => lv < 4 ? 0 : lv - 3;
const auctionFeeAt = lv => Math.max(7, 17 - lv * 2);

function buyUpgrade(key) {
  const u = UPGRADES[key];
  if (!u || state.upgrades[key] >= u.maxLv) return;
  const cost = upgradeCost(key);
  if (state.money < cost) { flash('钱不够啦！'); return; }
  state.money -= cost;
  state.upgrades[key]++;
  if (key === 'intel' && state.upgrades.intel >= 2) {
    refreshNerfWatch();
    ensureInsiderRumor();
  }
  if (key === 'broker') refreshMarket();
  addLog(`🚀 【${u.name}】升到 Lv.${state.upgrades[key]}：${upgradeEffect(key, state.upgrades[key])}`, 'good');
  renderAll();
}

// ==================== 店铺经营 ====================
const totalUpgradeLevels = () => Object.values(state.upgrades).reduce((sum, lv) => sum + lv, 0);
const storeDef = () => STORE_LEVELS[state.storeLevel];
const storeShelfSlots = () => storeDef().slots + state.storeBranches * BRANCH_SLOTS;
const retailNetRate = () => Math.min(0.97, 0.92 + state.upgrades.broker * 0.01);
const branchCost = () => Math.round(30000 * Math.pow(1.55, state.storeBranches) / 1000) * 1000;

function openStoreBranch() {
  if (state.storeLevel < STORE_LEVELS.length - 1) { flash('总店达到连锁品牌后才能开设分店'); return; }
  if (state.storeBranches >= BRANCH_MAX) return;
  const cost = branchCost();
  if (state.money < cost) { flash(`开设下一家分店需要 ¥${cost}`); return; }
  state.money -= cost;
  state.storeBranches++;
  addLog(`🏙️ 第 ${state.storeBranches} 家分店开业：货架位 +${BRANCH_SLOTS}，每日最大成交量 +1`, 'good');
  renderAll();
}

function commissionReservedQty(key) {
  return state.activeCommissions.reduce((sum, c) => sum + Number((c.deck || {})[key] || 0), 0);
}

const isCardLocked = key => !!state.cardLocks[key];

function toggleCardLock(key) {
  if (!state.collection[key]) return;
  if (state.cardLocks[key]) delete state.cardLocks[key];
  else {
    state.cardLocks[key] = true;
    state.retailListings = state.retailListings.filter(l => l.key !== key);
    collectionView.selected.delete(key);
  }
  renderAll();
}

function toggleSpecialLock(uid) {
  const card = state.specialCards.find(c => c.uid === uid);
  if (!card) return;
  card.locked = !card.locked;
  renderAll();
}

function sellSpecialToMarket(uid) {
  const index = state.specialCards.findIndex(c => c.uid === uid);
  if (index < 0) return;
  const card = state.specialCards[index];
  if (card.locked) { flash('这张特效卡默认受保护，请先解锁'); return; }
  const price = Math.max(1, Math.round(specialValue(card) * marketSellRate()));
  state.specialCards.splice(index, 1);
  state.money += price;
  recordProgress('cardsSold', 1);
  recordProgress('tradeDeals', 1);
  recordProgress('moneyEarned', price);
  addTrade(`🌈 售出【${cardPool[card.id].name}·${specialLabel(card)}】，收入 ¥${price}`);
  renderAll();
}

function retailCardIsFree(key) {
  return !isCardLocked(key) && (state.collection[key] || 0) > commissionReservedQty(key);
}

function storeUpgradeBlockers(level = state.storeLevel + 1) {
  const def = STORE_LEVELS[level];
  if (!def) return [];
  const blockers = [];
  if (curSeason() < def.season) blockers.push(`到达 S${def.season}`);
  if (netWorth() < def.worth) blockers.push(`身价达到 ¥${def.worth}`);
  if (totalUpgradeLevels() < def.upgrades) blockers.push(`经营升级合计 ${def.upgrades} 级`);
  if (state.money < def.cost) blockers.push(`准备建设费 ¥${def.cost}`);
  return blockers;
}

function upgradeStore() {
  const nextLevel = state.storeLevel + 1;
  const def = STORE_LEVELS[nextLevel];
  if (!def) return;
  const blockers = storeUpgradeBlockers(nextLevel);
  if (blockers.length) { flash(`暂不能扩建：${blockers.join(' · ')}`); return; }
  state.money -= def.cost;
  state.storeLevel = nextLevel;
  addLog(`🏗️ 店铺扩建完成：正式升级为【${def.name}】，陈列位增至 ${def.slots} 个`, 'good');
  renderAll();
}

function cleanRetailListings() {
  const seen = new Set();
  state.retailListings = state.retailListings.filter(l => {
    if (!l || seen.has(l.key) || !retailCardIsFree(l.key)) return false;
    const { id, s } = parseKey(l.key);
    if (!cardPool[id] || !Number.isFinite(s)) return false;
    seen.add(l.key);
    return true;
  }).slice(0, storeShelfSlots());
}

function addRetailListing() {
  cleanRetailListings();
  const select = $('retailCardSelect');
  const price = $('retailPriceSelect');
  const key = select && select.value;
  const pricePct = Number(price && price.value);
  if (!key || !retailCardIsFree(key)) { flash('这张卡已被委托占用或不在收藏中'); return; }
  if (state.retailListings.length >= storeShelfSlots()) { flash('陈列位已经满了，先撤下一张或扩建店铺'); return; }
  if (state.retailListings.some(l => l.key === key)) { flash('这张卡已经在陈列了'); return; }
  state.retailListings.push({ key, pricePct: RETAIL_PRICE_OPTIONS.includes(pricePct) ? pricePct : 110 });
  addLog(`🛍️ ${cardPool[parseKey(key).id].name} 已上架店内陈列`, 'good');
  renderAll();
}

function listHighestValueCards() {
  cleanRetailListings();
  const freeSlots = storeShelfSlots() - state.retailListings.length;
  if (freeSlots <= 0) { flash('陈列位已经满了'); return; }
  const listed = new Set(state.retailListings.map(l => l.key));
  const candidates = Object.keys(state.collection)
    .filter(key => !listed.has(key) && retailCardIsFree(key))
    .sort((a, b) => {
      const pa = parseKey(a), pb = parseKey(b);
      return cardValue(cardPool[pb.id], pb.s) - cardValue(cardPool[pa.id], pa.s);
    })
    .slice(0, freeSlots);
  if (!candidates.length) { flash('没有可上架的未占用卡牌'); return; }
  candidates.forEach(key => state.retailListings.push({ key, pricePct: 110 }));
  addLog(`🛍️ 已自动上架 ${candidates.length} 张当前价值最高的未占用卡牌`, 'good');
  renderAll();
}

function removeRetailListing(index) {
  if (!state.retailListings[index]) return;
  state.retailListings.splice(index, 1);
  renderAll();
}

function setRetailPrice(index, pricePct) {
  if (!state.retailListings[index] || !RETAIL_PRICE_OPTIONS.includes(Number(pricePct))) return;
  state.retailListings[index].pricePct = Number(pricePct);
  renderAll();
}

function retailPriceFactor(pct) {
  const table = { 90: 1.6, 100: 1.25, 110: 1, 125: 0.68, 140: 0.38, 160: 0.15 };
  return table[pct] || 1;
}

function retailSaleChance(listing) {
  const { id, s } = parseKey(listing.key);
  const t = cardPool[id];
  const heat = clamp(hiddenHeat(t), 0, 160);
  const heatFactor = 0.72 + heat / 250;
  const promoFactor = 1 + state.upgrades.promo * 0.13;
  const themeFactor = state.themes.includes(t.archetype) ? 1.12 : 1;
  const hotFactor = t.archetype === hottestArchetype() ? 1.12 : 1;
  const seasonFactor = s === curSeason() ? 1.08 : isRotated(s) ? 0.72 : 0.94;
  return clamp(0.32 * retailPriceFactor(listing.pricePct) * heatFactor * promoFactor * themeFactor * hotFactor * seasonFactor, 0.03, 0.92);
}

function retailChanceText(listing) {
  const chance = retailSaleChance(listing);
  if (state.upgrades.intel <= 0) return '成交率尚未评估';
  if (state.upgrades.intel === 1) return `需求${chance >= 0.45 ? '旺盛' : chance >= 0.25 ? '平稳' : '冷淡'}`;
  if (state.upgrades.intel === 2) {
    const low = Math.floor(chance * 10) * 10;
    return `预计成交率 ${low}%～${Math.min(100, low + 10)}%`;
  }
  return `预计成交率 ${Math.round(chance * 100)}%`;
}

function processRetailSales() {
  cleanRetailListings();
  const capacity = storeDef().customers + Math.floor(state.upgrades.promo / 2) + state.storeBranches;
  const shuffled = [...state.retailListings].sort(() => Math.random() - 0.5);
  const sold = [];
  let gross = 0;
  for (const listing of shuffled) {
    if (sold.length >= capacity || Math.random() >= retailSaleChance(listing)) continue;
    if (!(state.collection[listing.key] > 0)) continue;
    const { id, s } = parseKey(listing.key);
    const price = Math.max(1, Math.round(cardValue(cardPool[id], s) * listing.pricePct / 100));
    state.collection[listing.key]--;
    if (state.collection[listing.key] <= 0) delete state.collection[listing.key];
    gross += price;
    sold.push({ ...listing, name: cardPool[id].name, price });
  }
  const soldKeys = new Set(sold.map(x => x.key));
  state.retailListings = state.retailListings.filter(l => !soldKeys.has(l.key));
  const net = Math.round(gross * retailNetRate());
  if (sold.length) {
    state.money += net;
    recordProgress('cardsSold', sold.length);
    addLog(`🛍️ 店内零售成交 ${sold.length} 张，扣除运营成本后收入 ¥${net}`, 'good');
    addTrade(`店内售出 ${sold.map(x => x.name).join('、')}，回款 ¥${net}`, 'good');
  }
  state.lastRetailReport = { day: state.day, sales: sold.length, gross, net };
  return state.lastRetailReport;
}

// ==================== 批发订货 ====================
const wholesaleDailyCapacity = () => 300 + state.upgrades.supply * 300;
const wholesaleCapacityLeft = () => Math.max(0, wholesaleDailyCapacity() - state.wholesaleSpent);
const wholesaleOrderLimit = () => 1 + Math.floor(state.storeLevel / 2);
const wholesaleDiscountAt = lv => (lv >= 5 ? 0.05 : 0) + (lv >= 7 ? 0.05 : 0);
const wholesaleDiscount = () => wholesaleDiscountAt(state.upgrades.supply);

function wholesaleUnlocked(def) {
  return state.upgrades.supply >= def.supplyLv && state.upgrades.packs >= def.packsLv && curSeason() >= def.season;
}

function wholesaleRarity(type, index) {
  if (type === 'premium' && index < 2) return rollRarityAtLeast('SR');
  if (type === 'clearance') {
    const r = Math.random();
    return r < 0.78 ? 'N' : r < 0.97 ? 'R' : 'SR';
  }
  return rollRarity();
}

function makeWholesaleItems(type, def) {
  const items = [];
  for (let i = 0; i < def.count; i++) {
    const rarity = wholesaleRarity(type, i);
    const season = type === 'classic' ? rand(1, Math.max(1, curSeason() - 1)) : curSeason();
    const scope = type === 'theme' ? cardPool.filter(t => state.themes.includes(t.archetype)) : cardPool;
    let candidates = scope.filter(t => t.rarity === rarity);
    if (!candidates.length) candidates = scope;
    items.push({ id: pick(candidates).id, s: season });
  }
  return items;
}

function wholesaleItemsValue(items) {
  return items.reduce((sum, item) => sum + cardValue(cardPool[item.id], item.s), 0);
}

function makeWholesaleOffer(type, def) {
  const unlockCapacity = 300 + def.supplyLv * 300;
  const unlockDiscount = wholesaleDiscountAt(def.supplyLv);
  let items, value, baseCost;
  for (let attempt = 0; attempt < 20; attempt++) {
    items = makeWholesaleItems(type, def);
    value = wholesaleItemsValue(items);
    baseCost = Math.max(50, Math.round(value * def.priceFactor * randf(0.90, 1.10) / 10) * 10);
    if (Math.round(baseCost * (1 - unlockDiscount) / 10) * 10 <= unlockCapacity) break;
  }
  return {
    uid: `w${state.day}-${type}`,
    type,
    items,
    baseCost,
    purchased: false,
  };
}

function refreshWholesaleOffers() {
  state.wholesaleOffers = Object.entries(WHOLESALE_TYPES).map(([type, def]) => makeWholesaleOffer(type, def));
}

function wholesalePrice(offer) {
  return Math.max(1, Math.round(offer.baseCost * (1 - wholesaleDiscount()) / 10) * 10);
}

function buyWholesale(type) {
  const def = WHOLESALE_TYPES[type];
  const offer = state.wholesaleOffers.find(o => o.type === type);
  if (!def || !offer || offer.purchased) return;
  if (!wholesaleUnlocked(def)) { flash(`需要货源 Lv.${def.supplyLv}、经营许可 Lv.${def.packsLv}${def.season > 1 ? `，并到达 S${def.season}` : ''}`); return; }
  if (state.wholesaleOrders.length >= wholesaleOrderLimit()) { flash(`当前店铺最多同时处理 ${wholesaleOrderLimit()} 笔批发订单`); return; }
  const price = wholesalePrice(offer);
  if (price > wholesaleCapacityLeft()) { flash(`今日采购容量还剩 ¥${wholesaleCapacityLeft()}`); return; }
  if (state.money < price) { flash('现金不足，批发订单需要立即支付全款'); return; }
  state.money -= price;
  state.wholesaleSpent += price;
  offer.purchased = true;
  state.wholesaleOrders.push({
    uid: offer.uid, type, items: offer.items, paid: price,
    placedDay: state.day, arriveDay: state.day + def.days,
  });
  addLog(`🚚 已支付 ¥${price} 订购【${def.name}】，预计第 ${state.day + def.days} 天到货`);
  renderAll();
}

function deliverWholesaleOrders() {
  const arrived = state.wholesaleOrders.filter(order => order.arriveDay <= state.day);
  state.wholesaleOrders = state.wholesaleOrders.filter(order => order.arriveDay > state.day);
  let cards = 0, value = 0;
  arrived.forEach(order => {
    order.items.forEach(item => {
      const k = keyOf(item.id, item.s);
      state.collection[k] = (state.collection[k] || 0) + 1;
      cards++;
      value += cardValue(cardPool[item.id], item.s);
    });
    recordCardAcquisition(order.items.map(item => cardPool[item.id]));
    addTrade(`🚚 【${WHOLESALE_TYPES[order.type].name}】到货 ${order.items.length} 张，当前估值 ¥${wholesaleItemsValue(order.items)}`, 'good');
  });
  if (arrived.length) addLog(`📦 ${arrived.length} 笔批发订单到货，共入库 ${cards} 张卡，当前估值 ¥${value}`, 'good');
  state.lastWholesaleReport = { day: state.day, orders: arrived.length, cards, value };
  return state.lastWholesaleReport;
}

function wholesaleEstimateText(offer) {
  const value = wholesaleItemsValue(offer.items);
  if (state.upgrades.intel <= 0) return '内容与估值尚未鉴定';
  if (state.upgrades.intel === 1) {
    const high = offer.items.filter(x => ['SR', 'UR'].includes(cardPool[x.id].rarity)).length;
    return high >= 3 ? '货品质感：精品' : high ? '货品质感：尚可' : '货品质感：基础';
  }
  if (state.upgrades.intel === 2) return `预估总值 ¥${Math.round(value * 0.85)}～¥${Math.round(value * 1.15)}`;
  return `当前精确估值 ¥${value}`;
}

// ==================== 委托 ====================
const commissionBoardSize = () => 3 + state.reputationUpgrades.board;
const commissionLockLimit = () => 1 + state.reputationUpgrades.locks;
const commissionSeasonLimit = () => 4 + state.reputationUpgrades.seasonCap;
const commissionConcurrentLimit = () => 2 + state.reputationUpgrades.concurrent;
const commissionFixedReward = c => Math.round(c.baseReward * (1 + state.reputationUpgrades.reward * 0.05));

function rollCommissionDifficulty() {
  const r = Math.random();
  return r < 0.55 ? 'normal' : r < 0.87 ? 'advanced' : 'elite';
}

function rollCommissionType() {
  const pool = curSeason() > 1
    ? ['standard', 'standard', 'passion', 'competitive', 'anime', 'nostalgic']
    : ['standard', 'standard', 'passion', 'competitive', 'anime'];
  return pick(pool);
}

function makeCommission() {
  const difficulty = rollCommissionDifficulty();
  const def = COMMISSION_DIFFICULTIES[difficulty];
  const size = clamp(triRand(4, 12), 4, 12);
  const target = Math.round((def.targetBase + 2.5 * (size - 4)) * 10) / 10;
  const baseReward = Math.round((20 + 6 * size + 2 * (target - 50)) * def.rewardMult / 5) * 5;
  return {
    uid: `c${state.day}-${Math.random().toString(36).slice(2, 9)}`,
    archetype: pick(Object.keys(ARCHETYPES)), difficulty, type: rollCommissionType(), size, target, baseReward,
    locked: false, createdDay: state.day,
  };
}

function refreshCommissions(showLog = true) {
  const kept = state.commissions.filter(c => c.locked);
  state.commissions = kept.slice(0, commissionLockLimit());
  while (state.commissions.length < commissionBoardSize()) state.commissions.push(makeCommission());
  if (showLog) addLog(`📋 委托中心已刷新：保留 ${state.commissions.filter(c => c.locked).length} 个锁定目标，放出 ${state.commissions.length} 份委托`);
}

function resetCommissionSeason(showLog = false) {
  const expired = state.activeCommissions.length;
  const carry = state.reputationUpgrades.carryLock > 0;
  const carried = carry ? state.commissions.filter(c => c.locked).slice(0, commissionLockLimit()) : [];
  state.activeCommissions = [];
  state.commissions = carried;
  state.commissionAccepted = 0;
  state.commissionSeason = curSeason();
  refreshCommissions(false);
  if (showLog && expired) addLog(`⌛ 新赛季开始，${expired} 份未完成委托已经失效`, 'bad');
}

function toggleCommissionLock(uid) {
  const c = state.commissions.find(x => x.uid === uid);
  if (!c) return;
  if (!c.locked && state.commissions.filter(x => x.locked).length >= commissionLockLimit()) {
    flash(`最多锁定 ${commissionLockLimit()} 份委托`); return;
  }
  c.locked = !c.locked;
  renderAll();
}

function acceptCommission(uid) {
  const i = state.commissions.findIndex(x => x.uid === uid);
  if (i < 0) return;
  if (state.commissionAccepted >= commissionSeasonLimit()) { flash('本赛季接取次数已经用完'); return; }
  if (state.activeCommissions.length >= commissionConcurrentLimit()) { flash('同时进行的委托已经满了'); return; }
  const c = state.commissions.splice(i, 1)[0];
  state.activeCommissions.push({ ...c, locked: false, acceptedSeason: curSeason(), deck: {} });
  state.commissionAccepted++;
  while (state.commissions.length < commissionBoardSize()) state.commissions.push(makeCommission());
  addLog(`📋 接取${ARCHETYPES[c.archetype].name}委托：提交 ${c.size} 张，目标 ${c.target} 分`);
  renderAll();
}

function abandonCommission(uid) {
  const i = state.activeCommissions.findIndex(x => x.uid === uid);
  if (i < 0 || !confirm('确定放弃这份委托吗？本赛季接取次数不会返还。')) return;
  const c = state.activeCommissions.splice(i, 1)[0];
  addLog(`🗑️ 放弃了${ARCHETYPES[c.archetype].name}委托`, 'bad');
  renderAll();
}

function commissionDeckCount(c) {
  return Object.values(c.deck || {}).reduce((sum, n) => sum + n, 0);
}

function commissionCardAllowed(c, t, s) {
  return (c.type || 'standard') !== 'competitive' || !isRotated(s);
}

function changeCommissionCard(uid, k, delta) {
  const c = state.activeCommissions.find(x => x.uid === uid);
  if (!c || !state.collection[k]) return;
  const current = c.deck[k] || 0;
  const { id, s } = parseKey(k);
  if (delta > 0 && !commissionCardAllowed(c, cardPool[id], s)) { flash('竞技挑战不能使用退环境卡'); return; }
  if (delta > 0 && commissionDeckCount(c) >= c.size) { flash(`这份委托只需要 ${c.size} 张牌`); return; }
  const next = clamp(current + delta, 0, state.collection[k]);
  if (next) c.deck[k] = next; else delete c.deck[k];
  renderAll();
}

function curveBucket(cost) {
  return cost <= 2 ? 0 : cost <= 4 ? 1 : cost <= 6 ? 2 : 3;
}

function scoreCommission(c) {
  const cards = [];
  Object.entries(c.deck || {}).forEach(([k, qty]) => {
    const { id, s } = parseKey(k);
    const t = cardPool[id];
    const usableQty = Math.min(qty, state.collection[k] || 0);
    for (let i = 0; t && i < usableQty; i++) cards.push({ t, s, k });
  });
  const n = cards.length;
  const type = COMMISSION_TYPES[c.type || 'standard'];
  const illegal = cards.filter(({ t, s }) => !commissionCardAllowed(c, t, s)).length;
  const intendedN = c.size;
  const threshold = Math.ceil((intendedN - 1) * 0.55);
  let cores = 0, parts = 0, generics = 0, offTarget = 0;
  cards.forEach(({ t }) => {
    if (t.tier === 'generic') generics++;
    else if (t.archetype !== c.archetype) offTarget++;
    else if (t.tier === 'core') cores++;
    else parts++;
  });
  const themeRaw = (cores ? 20 + Math.max(0, cores - 1) * 2 : 0)
    + Math.min(parts, threshold) * 5 + Math.max(0, parts - threshold) * 1.5
    + generics * 3 - offTarget * 4;
  const themeIdeal = 20 + threshold * 5 + (intendedN - 1 - threshold) * 3;
  const theme = clamp(themeRaw / themeIdeal * 100, 0, 100);

  const kinds = new Set();
  cards.forEach(({ t }) => (t.effects || []).forEach(e => { if (e.k !== 'ult') kinds.add(e.k); }));
  const wantedKinds = clamp(Math.round(2 + (intendedN - 4) * 0.5), 2, 6);
  const coverage = clamp(kinds.size / wantedKinds * 100, 0, 100);
  const minCost = n ? Math.min(...cards.map(x => x.t.cost)) : 99;
  const minCostScore = ({ 1: 100, 2: 90, 3: 65, 4: 35 })[minCost] || 10;
  const actualCurve = [0, 0, 0, 0];
  cards.forEach(({ t }) => actualCurve[curveBucket(t.cost)]++);
  const desiredCurve = [0.30, 0.35, 0.25, 0.10];
  const curveError = n ? actualCurve.reduce((sum, count, i) => sum + Math.abs(count / n - desiredCurve[i]), 0) : 2;
  const curve = clamp(100 - curveError * 72, 0, 100);
  const construction = coverage * 0.4 + minCostScore * 0.2 + curve * 0.4;

  const powerPercentiles = computeIndex().p;
  const strength = n ? cards.reduce((sum, { t }) => sum + (powerPercentiles[cardPool.indexOf(t)] || 0) * 100, 0) / n : 0;
  let bonus = 0, bonusLabel = '';
  if ((c.type || 'standard') === 'competitive') {
    bonus = curve * 0.05 + strength * 0.05;
    bonusLabel = `竞技加分：曲线 ${curve.toFixed(0)} ×5% + 强度 ${strength.toFixed(0)} ×5%`;
  } else if (c.type === 'anime') {
    const moeCount = cards.filter(({ t }) => t.artStyle === 'moe').length;
    bonus = n ? moeCount / n * 10 : 0;
    bonusLabel = `萌系画风 ${moeCount}/${n || intendedN} 张`;
  } else if (c.type === 'nostalgic') {
    const pastCount = cards.filter(({ s }) => s < curSeason()).length;
    bonus = n ? pastCount / n * 10 : 0;
    bonusLabel = `往赛季印次 ${pastCount}/${n || intendedN} 张`;
  }
  const weights = type.weights;
  const total = clamp(theme * weights.theme + construction * weights.construction + strength * weights.strength + bonus, 0, 100);
  const value = cards.reduce((sum, { t, s }) => sum + cardValue(t, s), 0);
  const difficulty = COMMISSION_DIFFICULTIES[c.difficulty];
  const rep = n === intendedN && total >= c.target
    ? Math.min(difficulty.repCap, Math.floor((total - c.target) * intendedN / 16 * difficulty.repMult)) : 0;
  return { n, cards, theme, construction, strength, coverage, minCostScore, curve, total, value, rep, bonus, bonusLabel, illegal, weights, cores, parts, generics, offTarget, wantedKinds, kinds: kinds.size };
}

function submitCommission(uid) {
  const i = state.activeCommissions.findIndex(x => x.uid === uid);
  if (i < 0) return;
  const c = state.activeCommissions[i];
  const score = scoreCommission(c);
  if (score.illegal) { flash('竞技挑战中含有退环境卡，请先移除'); return; }
  if (score.n !== c.size) { flash(`还需要配满 ${c.size} 张牌`); return; }
  if (score.total + 1e-6 < c.target) { flash(`当前 ${score.total.toFixed(1)} 分，尚未达到目标`); return; }
  for (const [k, qty] of Object.entries(c.deck)) {
    if ((state.collection[k] || 0) < qty) { flash('收藏数量发生变化，请重新配牌'); renderAll(); return; }
  }
  Object.entries(c.deck).forEach(([k, qty]) => {
    state.collection[k] -= qty;
    if (state.collection[k] <= 0) delete state.collection[k];
  });
  const refund = Math.round(score.value * 0.95);
  const fixed = commissionFixedReward(c);
  state.money += refund + fixed;
  state.reputation += score.rep;
  state.lifetimeReputation += score.rep;
  if (score.rep) recordProgress('reputationEarned', score.rep);
  state.activeCommissions.splice(i, 1);
  recordProgress('commissionsCompleted', 1);
  recordProgress('moneyEarned', refund + fixed);
  if (c.difficulty === 'elite' && score.total >= 85) recordProgress('eliteHighScore', 1);
  addTrade(`📋 完成${ARCHETYPES[c.archetype].name}委托，评分 ${score.total.toFixed(1)}，获得 ¥${refund + fixed}${score.rep ? ` 与 ${score.rep} 声望` : ''}`, 'good');
  renderAll();
}

function buyReputationUpgrade(key) {
  const u = REPUTATION_UPGRADES[key];
  const lv = state.reputationUpgrades[key] || 0;
  if (!u || lv >= u.maxLv) return;
  const cost = u.costs[lv];
  if (state.reputation < cost) { flash('可用声望不足'); return; }
  state.reputation -= cost;
  state.reputationUpgrades[key] = lv + 1;
  recordProgress('reputationSpent', cost);
  if (key === 'board') while (state.commissions.length < commissionBoardSize()) state.commissions.push(makeCommission());
  addLog(`🏅 永久升级【${u.name}】升到 Lv.${lv + 1}`, 'good');
  renderAll();
}

// ==================== 开包 ====================
const RARITY_ORDER = ['N', 'R', 'SR', 'UR'];
function rollRarityAtLeast(minRarity) {
  const min = RARITY_ORDER.indexOf(minRarity);
  let rarity;
  do { rarity = rollRarity(); } while (RARITY_ORDER.indexOf(rarity) < min);
  return rarity;
}

function generatePack(def) {
  const editionSeason = def.classic ? rand(1, curSeason() - 1) : curSeason();
  const got = [];
  for (let i = 0; i < def.size; i++) {
    const guaranteed = def.guarantee && i === def.size - 1;
    const rarity = guaranteed ? rollRarityAtLeast(def.guarantee) : rollRarity();
    const scope = def.themed ? cardPool.filter(c => state.themes.includes(c.archetype)) : cardPool;
    let candidates = scope.filter(c => c.rarity === rarity);
    if (!candidates.length && guaranteed) {
      const min = RARITY_ORDER.indexOf(def.guarantee);
      candidates = scope.filter(c => RARITY_ORDER.indexOf(c.rarity) >= min);
    }
    if (!candidates.length) candidates = scope;
    got.push({ t: pick(candidates), s: editionSeason });
  }
  return got;
}

function buyPack(typeKey = 'standard') {
  const def = PACK_TYPES[typeKey];
  if (!def) return;
  if (state.upgrades.packs < def.unlockLv) { flash(`需要卡包经营许可 Lv.${def.unlockLv}`); return; }
  if (def.classic && curSeason() <= 1) { flash('经典纪念包将在第 2 赛季开放'); return; }
  if (state.packsBought >= dailyPackLimit()) { flash('今天的卡包已经卖完了，明天再来吧！'); return; }
  const typeBought = state.packTypeBought[typeKey] || 0;
  if (def.dailyLimit && typeBought >= def.dailyLimit) { flash(`今天的${def.name}已经售罄`); return; }
  if (state.money < def.price) { flash('钱不够啦！'); return; }
  const got = generatePack(def);
  state.money -= def.price;
  state.packsBought++;
  state.packTypeBought[typeKey] = typeBought + 1;
  for (const item of got) {
    const finish = rollPackFinish();
    if (finish) {
      item.special = makeSpecialCard(item.t.id, item.s, finish, `${def.name}开出`);
      addSpecialCard(item.special);
      addLog(`🌈 从${def.name}开出【${item.t.name}】${specialLabel(item.special)}！`, 'good');
    } else {
      const k = keyOf(item.t.id, item.s);
      state.collection[k] = (state.collection[k] || 0) + 1;
    }
  }
  recordProgress('packsOpened', 1);
  recordProgress('cardsOpened', got.length);
  recordCardAcquisition(got.map(x => x.t));
  showPack(got, def);
  renderAll();
}

let packRevealTimer = null;
let packModalPhase = 'closed';

function shouldSkipPackAnimation() {
  try { return localStorage.getItem(PACK_ANIMATION_KEY) === '1'; } catch (e) { return false; }
}

function setSkipPackAnimation(skip) {
  try { localStorage.setItem(PACK_ANIMATION_KEY, skip ? '1' : '0'); } catch (e) {}
}

function revealPackResults() {
  clearTimeout(packRevealTimer);
  packRevealTimer = null;
  $('packOpening').classList.add('hidden');
  $('packOpening').classList.remove('is-playing');
  const results = $('packResults');
  results.classList.remove('hidden');
  const cards = [...$('packCards').children];
  cards.forEach(el => { el.style.animation = 'none'; });
  void results.offsetWidth;
  cards.forEach(el => { el.style.removeProperty('animation'); });
  packModalPhase = 'results';
}

function showPack(got, def = PACK_TYPES.standard) {
  $('packCards').innerHTML = got.map(({ t, s, special }, i) =>
    `<div class="pack-card" style="animation-delay:${Math.min(i, 5) * 0.12}s">${cardHTML(t, { season: s, special })}</div>`).join('');
  const modal = $('packModal');
  const opening = $('packOpening');
  const results = $('packResults');
  const visual = $('openingPackVisual');
  visual.className = `booster-pack opening-pack pack-kind-${def.css}`;
  $('openingPackName').textContent = def.face;
  $('openingPackCount').textContent = `${def.size} CARDS`;
  $('packResultTitle').textContent = `✨ ${def.name}结果 ✨`;
  const edition = got.length ? got[0].s : curSeason();
  $('openingPackSeason').textContent = def.classic ? `CLASSIC S${edition}` : `SEASON ${curSeason()}`;
  clearTimeout(packRevealTimer);
  opening.classList.remove('is-playing');
  results.classList.add('hidden');
  modal.classList.remove('hidden');

  const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (shouldSkipPackAnimation() || reducedMotion) {
    revealPackResults();
    return;
  }
  opening.classList.remove('hidden');
  packModalPhase = 'opening';
  requestAnimationFrame(() => requestAnimationFrame(() => opening.classList.add('is-playing')));
  packRevealTimer = setTimeout(revealPackResults, 1750);
}

function hidePack() {
  clearTimeout(packRevealTimer);
  packRevealTimer = null;
  $('packModal').classList.add('hidden');
  $('packOpening').classList.remove('is-playing');
  packModalPhase = 'closed';
}

function handlePackModalClick() {
  if (packModalPhase === 'opening') revealPackResults();
  else if (packModalPhase === 'results') hidePack();
}

// ==================== 公开市场 ====================
function rollMarketSeason() {
  const current = curSeason();
  if (current === 1) return current;
  const r = Math.random();
  if (r < 0.70) return current;
  // 25% 为仍在环境的前两季版本；仅 5% 槽位出现退环境收藏品。
  if (r < 0.95 || current <= 3) return rand(Math.max(1, current - 2), current - 1);
  return rand(1, current - 3);
}

function refreshMarket() {
  state.market = [];
  for (let i = 0; i < MARKET_SIZE; i++) {
    const t = pick(cardPool);
    const s = rollMarketSeason();
    const finish = rollMarketFinish();
    const special = finish ? makeSpecialCard(t.id, s, finish, '公开市场') : null;
    const base = special ? specialValue(special) : cardValue(t, s);
    const scarcity = finish ? (finish === 'foil' ? randf(1.3, 1.8) : randf(1.8, 3.5)) : randf(0.95, 1.1);
    const price = Math.max(1, Math.round(base * marketBuyMarkup() * scarcity));
    state.market.push({ id: t.id, s, price, finish: special ? special.finish : '', serial: special ? special.serial : 0 });
  }
}

function buyFromMarket(i) {
  const l = state.market[i];
  if (!l) return;
  if (state.money < l.price) { flash('钱不够啦！'); return; }
  state.money -= l.price;
  if (l.finish) addSpecialCard(makeSpecialCard(l.id, l.s, l.finish, '公开市场', l.serial));
  else {
    const k = keyOf(l.id, l.s);
    state.collection[k] = (state.collection[k] || 0) + 1;
  }
  state.market.splice(i, 1);
  recordCardAcquisition(cardPool[l.id]);
  recordProgress('tradeDeals', 1);
  const variant = l.finish ? ` ${SPECIAL_FINISHES[l.finish].name}${l.serial ? ` ${String(l.serial).padStart(3, '0')}/100` : ''}` : '';
  addTrade(`🛒 从市场买入【${cardPool[l.id].name}·S${l.s}${variant}】，花费 ¥${l.price}`);
  renderAll();
}

function sellToMarket(k) {
  if (!state.collection[k]) return;
  if (isCardLocked(k)) { flash('这张卡已锁定，请先在收藏中解锁'); return; }
  const { id, s } = parseKey(k);
  const t = cardPool[id];
  const price = Math.max(1, Math.round(cardValue(t, s) * marketSellRate()));
  state.collection[k]--;
  if (state.collection[k] <= 0) delete state.collection[k];
  state.money += price;
  recordProgress('cardsSold', 1);
  recordProgress('tradeDeals', 1);
  recordProgress('moneyEarned', price);
  addTrade(`💰 把【${t.name}·S${s}】卖给市场，收入 ¥${price}`);
  renderAll();
}

// ==================== 寄售与拍卖 ====================
const consignmentSlots = () => consignmentSlotsAt(state.upgrades.broker);
const consignmentFee = () => consignmentFeeAt(state.upgrades.broker);
const auctionSlots = () => auctionSlotsAt(state.upgrades.broker);
const auctionFee = () => auctionFeeAt(state.upgrades.broker);

function listConsignment(k, askPct = 115) {
  askPct = Number(askPct);
  if (state.upgrades.broker < 2) { flash('市场渠道 Lv.2 才能使用寄售'); return; }
  if (state.consignments.length >= consignmentSlots()) { flash('寄售位已经满了'); return; }
  if (!state.collection[k] || isCardLocked(k)) { flash('这张卡不可寄售，请检查库存和锁定状态'); return; }
  if (commissionReservedQty(k) >= state.collection[k] || state.retailListings.some(x => x.key === k)) {
    flash('这张卡正被委托或店内货架占用'); return;
  }
  if (!CONSIGN_PRICE_OPTIONS.includes(askPct)) askPct = 115;
  const { id, s } = parseKey(k);
  state.collection[k]--;
  if (state.collection[k] <= 0) { delete state.collection[k]; delete state.cardLocks[k]; }
  state.consignments.push({ id, s, askPct, daysLeft: 3, listedDay: state.day });
  addTrade(`🏷️ 将【${cardPool[id].name}·S${s}】以行情 ${askPct}% 委托寄售，最长展示 3 天`);
  renderAll();
}

function cancelConsignment(i) {
  const item = state.consignments[i];
  if (!item) return;
  const k = keyOf(item.id, item.s);
  state.collection[k] = (state.collection[k] || 0) + 1;
  state.consignments.splice(i, 1);
  addTrade(`↩️ 撤回【${cardPool[item.id].name}·S${item.s}】的寄售`);
  renderAll();
}

function listAuction(uid, reservePct = 110) {
  reservePct = Number(reservePct);
  if (state.upgrades.broker < 4) { flash('市场渠道 Lv.4 才能使用拍卖'); return; }
  if (state.auctions.length >= auctionSlots()) { flash('拍卖席位已经满了'); return; }
  const index = state.specialCards.findIndex(c => c.uid === uid);
  if (index < 0) return;
  const card = state.specialCards[index];
  if (card.locked) { flash('请先解除这张特效卡的收藏保护'); return; }
  if (!AUCTION_RESERVE_OPTIONS.includes(reservePct)) reservePct = 110;
  state.specialCards.splice(index, 1);
  state.auctions.push({ card, reservePct, endDay: state.day + 2, currentBid: 0, bidders: 0, listedDay: state.day });
  addTrade(`🔨 将【${cardPool[card.id].name}·${specialLabel(card)}】送拍，保留价为估值 ${reservePct}%`);
  renderAll();
}

function cancelAuction(i) {
  const item = state.auctions[i];
  if (!item) return;
  if (item.bidders > 0) { flash('已经有人出价，不能撤拍'); return; }
  state.specialCards.push(item.card);
  state.auctions.splice(i, 1);
  addTrade(`↩️ 撤回【${cardPool[item.card.id].name}·${specialLabel(item.card)}】的拍卖`);
  renderAll();
}

function processMarketServices() {
  const report = { day: state.day, consignSold: 0, consignNet: 0, auctionsSold: 0, auctionNet: 0 };
  const returned = [];
  state.consignments = state.consignments.filter(item => {
    const t = cardPool[item.id];
    if (!t) return false;
    const ask = Math.max(1, Math.round(cardValue(t, item.s) * item.askPct / 100));
    const baseChance = { 100: 0.76, 115: 0.54, 130: 0.31, 150: 0.13 }[item.askPct] || 0.45;
    const chance = clamp(baseChance + state.upgrades.broker * 0.025 + state.upgrades.promo * 0.012, 0.08, 0.9);
    if (Math.random() < chance) {
      const gross = Math.max(1, Math.round(ask * randf(0.97, 1.04)));
      const net = Math.max(1, Math.round(gross * (1 - consignmentFee() / 100)));
      state.money += net;
      report.consignSold++;
      report.consignNet += net;
      recordProgress('cardsSold', 1); recordProgress('tradeDeals', 1);
      recordProgress('moneyEarned', net); recordProgress('consignmentsSold', 1);
      addTrade(`🏷️ 寄售成交【${t.name}·S${item.s}】，落槌 ¥${gross}，扣费后入账 ¥${net}`, 'good');
      return false;
    }
    item.daysLeft--;
    if (item.daysLeft <= 0) {
      const k = keyOf(item.id, item.s);
      state.collection[k] = (state.collection[k] || 0) + 1;
      returned.push(`【${t.name}】`);
      return false;
    }
    return true;
  });
  if (returned.length) addTrade(`📭 寄售到期未成交，已退回 ${returned.join('、')}`);

  state.auctions = state.auctions.filter(item => {
    const value = specialValue(item.card);
    const finishPull = { foil: 0.02, holo: 0.08, signed: 0.16, numbered: 0.24 }[item.card.finish] || 0;
    const interest = clamp(0.58 + finishPull + state.upgrades.broker * 0.045, 0.45, 0.95);
    if (Math.random() < interest) {
      const ceiling = Math.round(value * triRandf(0.84, 1.42 + finishPull + state.upgrades.broker * 0.035));
      if (ceiling > item.currentBid) {
        item.currentBid = ceiling;
        item.bidders += rand(1, 3);
      }
    }
    if (state.day < item.endDay) return true;
    const reserve = Math.round(value * item.reservePct / 100);
    if (item.currentBid >= reserve) {
      const net = Math.max(1, Math.round(item.currentBid * (1 - auctionFee() / 100)));
      state.money += net;
      report.auctionsSold++;
      report.auctionNet += net;
      recordProgress('cardsSold', 1); recordProgress('tradeDeals', 1);
      recordProgress('moneyEarned', net); recordProgress('auctionsSold', 1);
      addTrade(`🔨 拍卖成交【${cardPool[item.card.id].name}·${specialLabel(item.card)}】，${item.bidders} 人竞价，净入账 ¥${net}`, 'good');
    } else {
      state.specialCards.push(item.card);
      addTrade(`🔨 拍卖流拍【${cardPool[item.card.id].name}·${specialLabel(item.card)}】，最高出价未达保留价`);
    }
    return false;
  });
  state.lastMarketReport = report;
}

// ==================== NPC 私下交易 ====================
// 最热体系：按平均使用率（热度已隐藏，跟风跟的是使用率）
function hottestArchetype() {
  let best = null, bestAvg = -1;
  for (const a of Object.keys(ARCHETYPES)) {
    const ts = cardPool.filter(t => t.archetype === a);
    const avg = ts.reduce((sum, t) => sum + t.usage, 0) / ts.length;
    if (avg > bestAvg) { bestAvg = avg; best = a; }
  }
  return best;
}

const NPC_PROFILES = [
  {
    key: 'cute', emoji: '🌸', names: ['桃桃', '小葵', '蜜柑', '铃音', '可可', '莓莓'], budget: [90, 190], trades: [2, 2], mult: 1.48,
    tag: () => '萌系卡面收藏家', score: t => t.artStyle === 'moe' ? 2 : ['fairy', 'mage', 'angel'].includes(t.archetype) ? 1 : t.artStyle === 'dark' ? -1 : 0,
    buyText: '好可爱的卡面！如果价格合适，我想收进展示册。', sellText: '这张卡很漂亮，不过和我的收藏重复了。',
  },
  {
    key: 'competitive', emoji: '🏆', names: ['周教练', '阿策', '凌锋', 'K哥', '小北', '胜仔'], budget: [130, 250], trades: [2, 2], mult: 1.42,
    tag: () => '竞技强度党', score: (t, s) => s === curSeason() && effectiveHeat(t, s) >= 65 ? 2 : s === curSeason() && effectiveHeat(t, s) >= 35 ? 1 : isRotated(s) ? -1 : 0,
    buyText: '我只为能进比赛卡组的牌付溢价。', sellText: '备牌调整，这张暂时用不上了。',
  },
  {
    key: 'nostalgia', emoji: '🕰️', names: ['陈伯', '老罗', '秦叔', '梅姨', '古月先生', '陶老板'], budget: [100, 210], trades: [2, 2], mult: 1.38, grace: 1,
    tag: () => '往季情怀收藏家', score: (t, s) => s < curSeason() ? 2 : t.rarity === 'UR' ? 1 : 0,
    buyText: '老版本有老版本的味道，我愿意出个体面价。', sellText: '这张老卡跟了我很久，交给懂它的人吧。',
  },
  {
    key: 'trend', emoji: '📈', names: ['阿豪', '小凯', '子轩', '潮哥', '沐风', '热榜哥'], budget: [100, 220], trades: [2, 2], mult: 1.45,
    tag: () => `跟风买手 · 追${ARCHETYPES[hottestArchetype()].name}`, score: (t, s) => s === curSeason() && t.archetype === hottestArchetype() ? 2 : s === curSeason() ? 1 : isRotated(s) ? -1 : 0,
    buyText: '榜单热度就是硬通货，趁还火我想多囤几张。', sellText: '热度轮动太快，这张你要不要接手？',
  },
  {
    key: 'rarity', emoji: '💎', names: ['金姐', '宝叔', '曜石', '白老板', '珍妮', '陆掌柜'], budget: [180, 360], trades: [2, 2], mult: 1.52,
    tag: () => '高罕贵卡藏家', score: t => t.rarity === 'UR' ? 2 : t.rarity === 'SR' ? 1 : t.rarity === 'N' ? -1 : 0,
    buyText: '我只看品相和稀有度，普通货就别拿来了。', sellText: '高罕卡要找到真正识货的人。',
  },
  {
    key: 'season', emoji: '🎯', names: ['洛克', '赛季猫', '安娜', '新环境研究员', '白夜', '季风'], budget: [110, 230], trades: [2, 2], mult: 1.46,
    tag: () => '赛季主题策展人', score: (t, s) => s === curSeason() && state.themes.includes(t.archetype) ? 2 : state.themes.includes(t.archetype) ? 1 : isRotated(s) ? -1 : 0,
    buyText: '本季主题展还缺几张关键藏品。', sellText: '主题展换展了，这张可以转给你。',
  },
  {
    key: 'specialist', emoji: '🧭', names: ['馆长林', '牌佬森', '小纪', '顾问岚', '收藏家零', '阿岑'], budget: [100, 220], trades: [2, 2], mult: 1.5,
    setup: d => { d.targetArch = pick(Object.keys(ARCHETYPES)); },
    tag: d => `${ARCHETYPES[d.targetArch].name}专门店`, score: (t, s, d) => t.archetype === d.targetArch ? 2 : s === curSeason() ? 0 : -1,
    buyText: '我只补自己专营体系的库存，正好缺这一张。', sellText: '专门店清点库存，这张可以谈。',
  },
  {
    key: 'artist', emoji: '🎨', names: ['画廊主苏', '伊织', '墨老板', '阿澄', '策展人夏', '南风'], budget: [100, 210], trades: [2, 2], mult: 1.44,
    setup: d => { d.targetStyle = pick(Object.keys(ARTSTYLES)); },
    tag: d => `${ARTSTYLES[d.targetStyle].name}画风爱好者`, score: (t, s, d) => t.artStyle === d.targetStyle ? 2 : t.rarity === 'SR' || t.rarity === 'UR' ? 1 : 0,
    buyText: '画面风格比强度重要，这张正合我的审美。', sellText: '换一批展品，这张卡面你喜欢吗？',
  },
];

const privateTradeUI = { activeDealerId: null, search: '', filter: 'all' };
const profileOf = dealer => NPC_PROFILES.find(p => p.key === dealer.profile) || NPC_PROFILES[0];
const dealerById = id => state.dealers.find(d => d.id === id);
const relationshipKey = (profile, name) => `${profile}:${name}`;
function ensureRelationship(profile, name) {
  const key = relationshipKey(profile, name);
  if (!state.npcRelationships[key]) {
    state.npcRelationships[key] = { trust: 0, deals: 0, haggles: 0, targetArch: pick(Object.keys(ARCHETYPES)), wantedArch: '', friendshipRecorded: false };
  }
  return state.npcRelationships[key];
}
function relationshipOf(dealer) { return ensureRelationship(dealer.profile, dealer.name); }
function relationshipTier(trust) {
  if (trust >= 50) return { name: '挚友', next: 50 };
  if (trust >= 30) return { name: '好友', next: 50 };
  if (trust >= 15) return { name: '熟客', next: 30 };
  if (trust >= 5) return { name: '相识', next: 15 };
  return { name: '初见', next: 5 };
}
function changeRelationship(dealer, amount, kind = '') {
  const rel = relationshipOf(dealer);
  const before = rel.trust || 0;
  rel.trust = clamp(before + amount, 0, 60);
  if (kind === 'deal') rel.deals = (rel.deals || 0) + 1;
  if (kind === 'haggle') rel.haggles = (rel.haggles || 0) + 1;
  if (before < 50 && rel.trust >= 50 && !rel.friendshipRecorded) {
    rel.friendshipRecorded = true;
    recordProgress('npcFriendships', 1);
    addLog(`💞 你与 ${dealer.name} 成为挚友，解锁指定寻卡`, 'good');
  }
}
function dealerReservedBudget(dealerId) {
  const offer = state.offers.find(o => o.dealerId === dealerId);
  const original = offer && offer.source === 'player' ? offer.originalOffer : offer;
  return original && original.mode === 'buy' ? original.price : 0;
}

function maxNpcQuality() {
  let max = 0;
  NPC_QUALITY.forEach((tier, i) => { if (state.lifetimeReputation >= tier.threshold) max = i; });
  return max;
}

function rollNpcQuality(index) {
  const max = maxNpcQuality();
  if (!max) return 0;
  const network = state.reputationUpgrades.collectors || 0;
  const guaranteeDays = Math.max(3, 8 - max - Math.floor(network / 2));
  if (index === 0 && state.collectorHeat >= guaranteeDays - 1) return max;
  const chance = Math.min(0.75, 0.08 + network * 0.08 + max * 0.035);
  if (Math.random() >= chance) return 0;
  return 1 + Math.floor(Math.pow(Math.random(), 1.6) * max);
}

function createDealer(profile, index, forcedName = '') {
  const quality = rollNpcQuality(index);
  const knownNames = profile.names.filter(name => (state.npcRelationships[relationshipKey(profile.key, name)]?.trust || 0) > 0);
  const name = forcedName || (knownNames.length && Math.random() < 0.48 ? pick(knownNames) : pick(profile.names));
  const rel = ensureRelationship(profile.key, name);
  const dealer = {
    id: `D${state.day}-${index}-${rand(1000, 9999)}`,
    profile: profile.key,
    name,
    emoji: profile.emoji,
    budget: rand(profile.budget[0], profile.budget[1]),
    maxBudget: 0,
    patience: rand(2, 3) + (rel.trust >= 30 ? 1 : 0),
    flexibility: randf(0.02, 0.16) + Math.min(0.1, rel.trust * 0.002),
    maxTrades: rand(profile.trades[0], profile.trades[1]),
    tradesDone: 0,
    quality,
    relKey: relationshipKey(profile.key, name),
  };
  if (quality > 0) dealer.budget = rand(NPC_QUALITY[quality].budget[0], NPC_QUALITY[quality].budget[1]);
  dealer.maxBudget = dealer.budget;
  if (profile.setup) profile.setup(dealer);
  dealer.tag = profile.tag(dealer);
  return dealer;
}

function dealerPreference(dealer, t, s) {
  return profileOf(dealer).score(t, s, dealer);
}

function dealerValuation(dealer, t, s) {
  const profile = profileOf(dealer);
  let factor = seasonFactor(s);
  if (profile.grace && s < curSeason() && !(state.reprint && state.reprint.season === s)) {
    factor = seasonFactor(Math.min(s + profile.grace, curSeason()));
  }
  return cardValueAtFactor(t, factor);
}

function stableQuoteVariance(dealer, id, s) {
  const seed = `${dealer.id}-${id}-${s}`.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return 0.96 + (seed % 9) / 100;
}

function quoteCardToDealer(dealer, t, s) {
  if ((dealer.tradesDone || 0) >= dealer.maxTrades) return { accepted: false, score: -1, reason: '今日主动售卡次数已用完' };
  const score = dealerPreference(dealer, t, s);
  if (score < 0) return { accepted: false, score, reason: '不符合收购范围' };
  const profile = profileOf(dealer);
  const mult = score === 2 ? profile.mult : score === 1 ? 0.9 : 0.45;
  const rel = relationshipOf(dealer);
  const targetBonus = rel.trust >= 30 && rel.targetArch === t.archetype ? 1.18 : 1;
  const friendship = 1 + Math.min(0.12, rel.trust * 0.0025);
  const price = Math.max(1, Math.round(dealerValuation(dealer, t, s) * mult * targetBonus * friendship * stableQuoteVariance(dealer, t.id, s)));
  const availableBudget = Math.max(0, dealer.budget - dealerReservedBudget(dealer.id));
  if (price > availableBudget) return { accepted: false, score, price, reason: `预算不足（扣除原求购预留后可用 ¥${availableBudget}）` };
  return {
    accepted: true, score, price,
    label: targetBonus > 1 ? '专属求购溢价' : score === 2 ? '偏好溢价' : score === 1 ? '正常收购' : '非偏好压价',
  };
}

function npcSellItem(dealer) {
  const rel = relationshipOf(dealer);
  if (rel.trust >= 50 && rel.wantedArch) {
    const wanted = cardPool.filter(t => t.archetype === rel.wantedArch);
    if (wanted.length) {
      const t = pick(wanted);
      return { t, s: curSeason(), ...rollNpcSpecial(dealer.quality || 0), requested: true };
    }
  }
  for (let tries = 0; tries < 50; tries++) {
    const t = pick(cardPool);
    const s = rand(1, curSeason());
    if (dealerPreference(dealer, t, s) >= 2) return { t, s, ...rollNpcSpecial(dealer.quality || 0) };
  }
  return { t: pick(cardPool), s: curSeason(), ...rollNpcSpecial(dealer.quality || 0) };
}

function rollNpcSpecial(quality) {
  const r = Math.random();
  if (quality >= 5) {
    if (r < 0.08) return { finish: 'numbered', serial: rand(1, 100) };
    if (r < 0.30) return { finish: 'signed', serial: 0 };
    if (r < 0.60) return { finish: 'holo', serial: 0 };
    if (r < 0.80) return { finish: 'foil', serial: 0 };
  } else if (quality === 4) {
    if (r < 0.02) return { finish: 'numbered', serial: rand(1, 100) };
    if (r < 0.12) return { finish: 'signed', serial: 0 };
    if (r < 0.34) return { finish: 'holo', serial: 0 };
    if (r < 0.59) return { finish: 'foil', serial: 0 };
  } else if (quality === 3) {
    if (r < 0.025) return { finish: 'signed', serial: 0 };
    if (r < 0.145) return { finish: 'holo', serial: 0 };
    if (r < 0.395) return { finish: 'foil', serial: 0 };
  } else if (quality === 2) {
    if (r < 0.04) return { finish: 'holo', serial: 0 };
    if (r < 0.22) return { finish: 'foil', serial: 0 };
  } else if (quality === 1 && r < 0.08) return { finish: 'foil', serial: 0 };
  return { finish: '', serial: 0 };
}

function makeNpcOffer(dealer) {
  const rel = relationshipOf(dealer);
  const matches = Object.keys(state.collection).filter(k => !isCardLocked(k)).map(k => ({ k, ...parseKey(k) }))
    .map(item => ({ ...item, quote: quoteCardToDealer(dealer, cardPool[item.id], item.s) }))
    .filter(item => item.quote.accepted && item.quote.score >= 1);
  const privateItem = npcSellItem(dealer);
  const targetMatches = rel.trust >= 30 ? matches.filter(x => cardPool[x.id].archetype === rel.targetArch) : [];
  if ((targetMatches.length || matches.length) && !privateItem.finish && Math.random() < 0.75) {
    const match = pick(targetMatches.length ? targetMatches : matches);
    return { dealerId: dealer.id, mode: 'buy', id: match.id, s: match.s, price: match.quote.price, rounds: 0, note: targetMatches.includes(match) ? `🎯 ${dealer.name} 的专属求购目标` : '' };
  }
  const special = privateItem.finish ? makeSpecialCard(privateItem.t.id, privateItem.s, privateItem.finish, dealer.name, privateItem.serial) : null;
  const value = special ? specialValue(special) : cardValue(privateItem.t, privateItem.s);
  const friendlyDiscount = 1 - Math.min(0.12, rel.trust * 0.0025);
  const price = Math.max(1, Math.round(value * randf(special ? 0.98 : 0.88, special ? 1.25 : 1.08) * friendlyDiscount));
  return {
    dealerId: dealer.id, mode: 'sell', id: privateItem.t.id, s: privateItem.s,
    finish: privateItem.finish, serial: privateItem.serial, price, rounds: 0,
    note: privateItem.requested ? `🧭 ${dealer.name} 按你的预约找来的卡` : special ? `💎 ${NPC_QUALITY[dealer.quality].name}展示的私藏` : '',
  };
}

function makeOffers() {
  const count = dailyGuestCount();
  const reservation = state.npcReservation;
  let profiles = NPC_PROFILES.slice().sort(() => Math.random() - 0.5).slice(0, count);
  if (reservation) {
    const reservedProfile = NPC_PROFILES.find(p => p.key === reservation.profile);
    if (reservedProfile) profiles = [reservedProfile, ...profiles.filter(p => p.key !== reservedProfile.key)].slice(0, count);
  }
  state.dealers = profiles.map((profile, index) => createDealer(profile, index, index === 0 && reservation ? reservation.name : ''));
  state.npcReservation = null;
  state.offers = [];
  state.offers = state.dealers.map(makeNpcOffer);
  if (state.dealers.some(d => d.quality > 0)) state.collectorHeat = 0;
  else state.collectorHeat++;
  privateTradeUI.activeDealerId = null;
}

function reserveDealer(dealerId) {
  const dealer = dealerById(dealerId);
  if (!dealer || relationshipOf(dealer).trust < 15) return;
  state.npcReservation = { profile: dealer.profile, name: dealer.name };
  flash(`已预约 ${dealer.name} 明日到店`);
  renderAll();
}

function setDealerWantedArch(dealerId, arch) {
  const dealer = dealerById(dealerId);
  if (!dealer || relationshipOf(dealer).trust < 50 || !ARCHETYPES[arch]) return;
  relationshipOf(dealer).wantedArch = arch;
  flash(`${dealer.name} 会在下次来访时尽量带来${ARCHETYPES[arch].name}卡`);
  renderAll();
}

function restoreOriginalOffer(i, offer) {
  if (offer.source === 'player' && offer.originalOffer) state.offers[i] = offer.originalOffer;
  else state.offers.splice(i, 1);
}

function finishDealerTrade(i, offer, dealer) {
  if (offer.source === 'player') {
    dealer.tradesDone = (dealer.tradesDone || 0) + 1;
    restoreOriginalOffer(i, offer);
  } else {
    state.offers.splice(i, 1);
  }
}

function scrollPrivateTo(id) {
  if (typeof document === 'undefined') return;
  requestAnimationFrame(() => {
    const target = document.getElementById(id);
    if (!target) return;
    const header = document.querySelector('header');
    const headerHeight = header ? header.getBoundingClientRect().height : 110;
    const top = window.scrollY + target.getBoundingClientRect().top - headerHeight - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  });
}

function acceptOffer(i) {
  const o = state.offers[i];
  if (!o) return;
  const t = cardPool[o.id];
  const dealer = dealerById(o.dealerId);
  if (!dealer) { state.offers.splice(i, 1); renderAll(); return; }
  if (o.source === 'player' && (dealer.tradesDone || 0) >= dealer.maxTrades) { restoreOriginalOffer(i, o); flash(`${dealer.name} 今天不再接受主动售卡了`); renderAll(); return; }
  if (o.mode === 'buy') {
    const k = keyOf(o.id, o.s);
    if (!state.collection[k]) { restoreOriginalOffer(i, o); flash('这张卡已经不在你手上了'); renderAll(); return; }
    if (isCardLocked(k)) { restoreOriginalOffer(i, o); flash('这张卡已锁定，已取消出售'); renderAll(); return; }
    if (dealer.budget < o.price) { restoreOriginalOffer(i, o); flash(`${dealer.name} 的预算已经不够了`); renderAll(); return; }
    state.collection[k]--;
    if (state.collection[k] <= 0) delete state.collection[k];
    dealer.budget -= o.price;
    state.money += o.price;
    recordProgress('cardsSold', 1);
    recordProgress('tradeDeals', 1);
    recordProgress('moneyEarned', o.price);
    addTrade(`🤝 ${dealer.name} 以 ¥${o.price} 收走了你的【${t.name}·S${o.s}】`);
  } else {
    if (state.money < o.price) { flash('钱不够啦！'); return; }
    state.money -= o.price;
    dealer.budget = Math.min(dealer.maxBudget, dealer.budget + Math.round(o.price * 0.25));
    if (o.finish) addSpecialCard(makeSpecialCard(o.id, o.s, o.finish, dealer.name, o.serial));
    else {
      const k = keyOf(o.id, o.s);
      state.collection[k] = (state.collection[k] || 0) + 1;
    }
    recordCardAcquisition(t);
    recordProgress('tradeDeals', 1);
    addTrade(`🤝 你从 ${dealer.name} 手中买下【${t.name}·S${o.s}${o.finish ? ` · ${SPECIAL_FINISHES[o.finish].name}` : ''}】，花费 ¥${o.price}`);
  }
  changeRelationship(dealer, o.source === 'player' ? 3 : 2, 'deal');
  finishDealerTrade(i, o, dealer);
  renderAll();
}

function haggleOffer(i, level) {
  const o = state.offers[i];
  const dealer = o && dealerById(o.dealerId);
  if (!o || !dealer) return;
  if (o.rounds >= 2 || dealer.patience <= 0) { flash(`${dealer.name} 不想再谈了`); return; }
  const cfg = { gentle: { delta: 0.05, chance: 0.72 }, firm: { delta: 0.10, chance: 0.46 }, hard: { delta: 0.18, chance: 0.22 } }[level];
  if (!cfg) return;
  const target = o.mode === 'buy'
    ? Math.max(o.price + 1, Math.round(o.price * (1 + cfg.delta)))
    : Math.max(1, Math.min(o.price - 1, Math.round(o.price * (1 - cfg.delta))));
  const withinBudget = o.mode !== 'buy' || target <= dealer.budget;
  const chance = withinBudget ? clamp(cfg.chance + dealer.flexibility + Math.min(0.08, relationshipOf(dealer).trust * 0.0015) - o.rounds * 0.12, 0.08, 0.92) : 0;
  o.rounds++;
  dealer.patience--;
  if (Math.random() < chance) {
    o.price = target;
    o.note = `✅ ${dealer.name} 接受了你的条件`;
    addTrade(`🗣️ 与 ${dealer.name} 讲价成功，报价调整为 ¥${o.price}`);
    recordProgress('hagglesWon', 1);
    changeRelationship(dealer, level === 'gentle' ? 2 : 1, 'haggle');
  } else if (dealer.patience <= 0 || (level === 'hard' && Math.random() < 0.48)) {
    addTrade(`💨 对 ${dealer.name} 压价过狠，对方结束了这笔报价`);
    if (o.source === 'player') {
      dealer.tradesDone = (dealer.tradesDone || 0) + 1;
      restoreOriginalOffer(i, o);
    } else {
      state.offers.splice(i, 1);
    }
    flash(`${dealer.name} 被惹恼，结束了报价`);
    changeRelationship(dealer, level === 'hard' ? -4 : -2);
  } else {
    const counter = o.mode === 'buy'
      ? Math.min(dealer.budget, Math.round(o.price + (target - o.price) * 0.35))
      : Math.max(1, Math.round(o.price - (o.price - target) * 0.35));
    o.price = counter;
    o.note = `↔️ ${dealer.name} 没完全答应，给出了折中价`;
  }
  renderAll();
}

function declineOffer(i) {
  const o = state.offers[i];
  if (!o) return;
  const dealer = dealerById(o.dealerId);
  addTrade(`🙅 你${o.source === 'player' ? '取消了向' : '拒绝了'} ${dealer ? dealer.name : '客人'} 的报价`);
  restoreOriginalOffer(i, o);
  renderAll();
}

function openDealerInventory(dealerId) {
  privateTradeUI.activeDealerId = dealerId;
  renderOffers();
  scrollPrivateTo('privateInventoryPanel');
}

function proposeCardToDealer(dealerId, k) {
  const dealer = dealerById(dealerId);
  if (!dealer || !state.collection[k]) return;
  if (isCardLocked(k)) { flash('这张卡已锁定，请先在收藏中解锁'); return; }
  const { id, s } = parseKey(k);
  const t = cardPool[id];
  const quote = quoteCardToDealer(dealer, t, s);
  if (!quote.accepted) { flash(`${dealer.name}：${quote.reason}`); return; }
  const offerIndex = state.offers.findIndex(o => o.dealerId === dealerId);
  const current = offerIndex >= 0 ? state.offers[offerIndex] : null;
  const originalOffer = current && current.source === 'player' ? current.originalOffer : current;
  const proposal = {
    dealerId, mode: 'buy', source: 'player', id, s, price: quote.price, rounds: 0,
    note: `💼 ${dealer.name} 愿意收这张卡，你可以直接成交或继续讲价${originalOffer ? '；结束后会恢复 TA 原来的报价' : ''}`,
    originalOffer: originalOffer ? { ...originalOffer } : null,
  };
  if (offerIndex >= 0) state.offers[offerIndex] = proposal;
  else state.offers.push(proposal);
  renderAll();
  scrollPrivateTo(`dealer-${dealerId}`);
}

// ==================== 论坛传闻 ====================
// 消息源暗中决定成真概率，玩家需要自行摸索哪个源更靠谱
const RUMOR_SOURCES = [
  { name: '舅舅党爆料', chance: 0.5, minLv: 0 },
  { name: '论坛匿名帖', chance: 0.32, minLv: 0 },
  { name: '贴吧小道消息', chance: 0.18, minLv: 0 },
  { name: '内部线人', chance: 0.7, minLv: 2 },
];
const insiderSource = () => RUMOR_SOURCES.find(s => s.name === '内部线人');

function makeRumor(forcedSource, pending = []) {
  const avail = RUMOR_SOURCES.filter(s => state.upgrades.intel >= s.minLv);
  const src = forcedSource || pick(avail);
  const kinds = ['patch', 'darkhorse', 'trend', 'fade'];
  // 复刻传闻：仅当有往赛季、当前无复刻活动、且没有待结算的复刻传闻时可能出现
  if (curSeason() > 1 && !state.reprint && !pending.some(r => r.kind === 'reprint')) {
    kinds.push('reprint');
  }
  const kind = pick(kinds);
  let target, delta;
  if (kind === 'patch') {
    // 指向具体单卡：削弱挑高调整风险卡，增强挑低分卡
    const scores = nerfScores();
    const order = scores.map((s, i) => i).sort((a, b) => scores[b] - scores[a]);
    if (Math.random() < 0.6) {
      target = pick(order.slice(0, 3));
      delta = -1;
    } else {
      target = pick(order.slice(-5));
      delta = 1;
    }
  } else if (kind === 'darkhorse') {
    target = pick(Object.keys(ARCHETYPES));
    delta = rand(3, 5);   // 使用率事件持续天数
  } else if (kind === 'trend') {
    target = pick(Object.keys(ARTSTYLES));
    delta = rand(2, 4);
  } else if (kind === 'fade') {
    target = pick(Object.keys(ARTSTYLES));
    delta = rand(2, 4);
  } else { // reprint：target=往赛季编号，delta=持续天数
    target = rand(1, curSeason() - 1);
    delta = rand(2, 4);
  }
  return { v: 2, kind, target, delta, src: src.name, chance: src.chance };
}

function makeRumors() {
  const r = Math.random();
  const base = r < 0.15 ? 0 : r < 0.75 ? 1 : 2;
  const n = base + state.upgrades.intel;
  const rumors = [];
  // Lv.2 起固定一条内部消息，其余槽位仍来自公开信源，避免“解锁了但整天看不到”。
  if (state.upgrades.intel >= 2 && n > 0) rumors.push(makeRumor(insiderSource(), rumors));
  const publicSources = RUMOR_SOURCES.filter(s => s.name !== '内部线人' && state.upgrades.intel >= s.minLv);
  while (rumors.length < n) rumors.push(makeRumor(pick(publicSources), rumors));
  return rumors;
}

function ensureInsiderRumor() {
  if (state.upgrades.intel < 2 || state.rumors.some(r => r.src === '内部线人')) return;
  state.rumors.unshift(makeRumor(insiderSource(), state.rumors));
}

function rumorText(r) {
  if (r.kind === 'patch') return `据说下个平衡性补丁将${r.delta > 0 ? '增强' : '削弱'}【${cardPool[r.target].name}】`;
  if (r.kind === 'darkhorse') return `有战队被曝在秘密苦练【${ARCHETYPES[r.target].name}】体系，大赛可能要爆冷`;
  if (r.kind === 'trend') return `某大主播最近狂推【${ARTSTYLES[r.target].name}】画风的卡，粉丝在跟风扫货`;
  if (r.kind === 'reprint') return `有小道消息称官方将限时复刻第 ${r.target} 赛季的经典卡牌`;
  return `论坛都在吐槽【${ARTSTYLES[r.target].name}】画风看腻了，可能要凉`;
}

function rumorTrueText(r) {
  if (r.kind === 'patch') return `平衡性补丁落地：【${cardPool[r.target].name}】遭到${r.delta > 0 ? '增强' : '削弱'}`;
  if (r.kind === 'darkhorse') return `黑马卡组【${ARCHETYPES[r.target].name}】爆冷夺冠，体系使用率 ${r.delta} 天内大涨`;
  if (r.kind === 'trend') return `【${ARTSTYLES[r.target].name}】画风爆火，相关卡牌使用率 ${r.delta} 天内上涨`;
  if (r.kind === 'reprint') return `官方限时复刻第 ${r.target} 赛季经典卡牌，${r.delta} 天内其价值大幅恢复`;
  return `【${ARTSTYLES[r.target].name}】画风过气，相关卡牌使用率 ${r.delta} 天内走低`;
}

function applyRumor(r) {
  if (r.kind === 'reprint') { startReprint(r.target, r.delta, true); return; }
  if (r.kind === 'patch') { balancePatch(cardPool[r.target], r.delta > 0 ? 'buff' : 'nerf'); return; }
  if (r.kind === 'darkhorse') addUsageEvent(t => t.archetype === r.target, 1.6, r.delta);
  else if (r.kind === 'trend') addUsageEvent(t => t.artStyle === r.target, 1.4, r.delta);
  else addUsageEvent(t => t.artStyle === r.target, 0.65, r.delta);
}

// ==================== 复刻 ====================
function startReprint(season, days, silent) {
  state.reprint = { season, daysLeft: days };
  if (!silent) addLog(`🏆 官方宣布限时复刻第 ${season} 赛季经典卡牌！${days} 天内其价值大幅恢复`, 'good');
}

function tickReprint() {
  if (!state.reprint) return;
  state.reprint.daysLeft--;
  if (state.reprint.daysLeft <= 0) {
    addLog(`🏁 第 ${state.reprint.season} 赛季复刻活动结束，相关卡牌价值回落`, 'bad');
    state.reprint = null;
  }
}

function maybeReprint() {
  if (curSeason() < 2 || state.reprint) return;
  if (Math.random() < REPRINT_CHANCE) startReprint(rand(1, curSeason() - 1), rand(2, 4));
}

// ==================== 每日事件 ====================
// 短期使用率事件：命中卡获得限时使用率倍率
function addUsageEvent(filter, mult, days) {
  cardPool.filter(filter).forEach(t => { t.usageMod = { mult, days }; });
}

function tickUsageMods() {
  cardPool.forEach(t => {
    if (!t.usageMod) return;
    t.usageMod.days--;
    if (t.usageMod.days <= 0) t.usageMod = null;
  });
}

// 赛季主题：每赛季随机两个体系，主题体系使用率提升
function rollThemes() {
  const keys = Object.keys(ARCHETYPES);
  const a = pick(keys);
  let b;
  do { b = pick(keys); } while (b === a);
  return [a, b];
}

// 平衡性补丁：调整单卡某项属性，随后重算强度指标
function balancePatch(forcedCard, forcedDir) {
  const scores = nerfScores();
  const order = scores.map((s, i) => i).sort((a, b) => scores[b] - scores[a]);
  const dir = forcedDir || (Math.random() < 0.6 ? 'nerf' : 'buff');
  const t = forcedCard || (dir === 'nerf' ? cardPool[pick(order.slice(0, 3))] : cardPool[pick(order.slice(-3))]);
  const attrs = ['atk', 'atk', 'hp', 'hp', 'hp', 'fx', 'fx', 'cost'];
  let attr = pick(attrs);
  if (attr === 'fx' && !t.effects.length) attr = 'atk';
  if (attr === 'cost' && (dir === 'buff' ? t.cost < 2 : t.cost >= 10)) attr = 'hp';
  let oldV, newV, label;
  if (attr === 'atk' || attr === 'hp') {
    oldV = t[attr];
    newV = Math.max(1, oldV + (dir === 'nerf' ? -1 : 1));
    t[attr] = newV;
    label = attr === 'atk' ? '攻击力' : '生命值';
  } else if (attr === 'fx') {
    const e = pick(t.effects);
    oldV = e.v;
    newV = Math.max(1, oldV + (dir === 'nerf' ? -1 : 1));
    e.v = newV;
    label = `「${e.k}」数值`;
  } else {
    oldV = t.cost;
    newV = clamp(oldV + (dir === 'nerf' ? 1 : -1), 1, 10);
    t.cost = newV;
    label = '费用';
  }
  addLog(`⚖️ 平衡性补丁：【${t.name}】${label} ${oldV}→${newV}`);
  simMeta();
}

// 内部线人优先判定；其 70% 成真率不会再被排在前面的普通消息截胡。
function pickResolvedRumor(rumors) {
  const ordered = [
    ...rumors.filter(r => r.src === '内部线人'),
    ...rumors.filter(r => r.src !== '内部线人'),
  ];
  return ordered.find(r => Math.random() < r.chance) || null;
}

// 结算昨天的传闻：每天最多落地一个事件。返回是否有事件落地。
function resolveRumors() {
  if (!state.rumors.length) return false;
  const hit = pickResolvedRumor(state.rumors);
  if (hit) {
    applyRumor(hit);
    addLog(`✅【${hit.src}】传闻成真！${rumorTrueText(hit)}`, 'good');
    if (state.rumors.length > 1) addLog('❌ 其余论坛传闻未能兑现，终究只是谣言', 'bad');
    return true;
  }
  addLog('❌ 昨天的论坛传闻没有兑现，终究只是谣言', 'bad');
  return false;
}

function rollRandomEvent() {
  const r = Math.random();
  if (r < PATCH_CHANCE) {    // 平衡性补丁
    balancePatch();
  } else if (r < 0.45) {     // 黑马卡组
    const a = pick(Object.keys(ARCHETYPES));
    const days = rand(3, 5);
    addUsageEvent(t => t.archetype === a, 1.6, days);
    const deck = pick(['快攻', '控制', '中速', 'OTK', '铺场', '黑科技']);
    addLog(`🐎 黑马卡组【${ARCHETYPES[a].name}${deck}】爆冷夺冠！【${ARCHETYPES[a].name}】体系使用率 ${days} 天内大涨`);
  } else if (r < 0.62) {     // 画风走红
    const s = pick(Object.keys(ARTSTYLES));
    const days = rand(2, 4);
    addUsageEvent(t => t.artStyle === s, 1.4, days);
    addLog(`🎨 【${ARTSTYLES[s].name}】画风在社交平台爆火，相关卡牌使用率 ${days} 天内上涨`);
  } else if (r < 0.76) {     // 画风过气
    const s = pick(Object.keys(ARTSTYLES));
    const days = rand(2, 4);
    addUsageEvent(t => t.artStyle === s, 0.65, days);
    addLog(`📉 玩家对【${ARTSTYLES[s].name}】画风审美疲劳，相关卡牌使用率 ${days} 天内走低`);
  } else {
    addLog('😐 市场风平浪静，只有常规小幅波动');
  }
}

function moverText(changes, dir) {
  const selected = changes
    .filter(x => dir > 0 ? x.pct > 0 : x.pct < 0)
    .sort((a, b) => dir > 0 ? b.pct - a.pct : a.pct - b.pct)
    .slice(0, 3);
  return selected.map(x => `【${x.t.name}】${x.pct > 0 ? '+' : ''}${x.pct}%`).join('、');
}

// 新赛季开启：全卡数值重投，并滚动主题体系。
function seasonEvent() {
  const changes = rerollSeasonStats();
  resetCommissionSeason(true);
  addLog(`🗓️ 第 ${curSeason()} 赛季开启！S${curSeason() - 1} 卡牌估值仅降 5%，S${Math.max(1, curSeason() - 3)} 及更早版本退环境`, 'good');
  addLog('🎲 全卡数值已重投：费用按稀有度划档，攻防与效果在受控区间内浮动');
  const risers = moverText(changes, 1);
  const fallers = moverText(changes, -1);
  if (risers) addLog(`📈 本季数值跃升：${risers}`, 'good');
  if (fallers) addLog(`📉 本季数值回落：${fallers}`, 'bad');
  state.themes = rollThemes();
  const names = state.themes.map(a => `${ARCHETYPES[a].emoji}${ARCHETYPES[a].name}`).join(' · ');
  addLog(`🎯 本赛季主题体系：${names}，主题体系使用率提升`, 'good');
}

function dailyEvent() {
  const rumorHit = resolveRumors();
  if (!rumorHit) rollRandomEvent();
  state.rumors = [];
  tickUsageMods();
  simMeta();
  // 放出关于明天的新传闻
  state.rumors = makeRumors();
}

function settlementModalSkipped() {
  try { return localStorage.getItem(SETTLEMENT_SKIP_KEY) === '1'; } catch (e) { return false; }
}

function setSkipSettlementModal(skip) {
  try {
    if (skip) localStorage.setItem(SETTLEMENT_SKIP_KEY, '1');
    else localStorage.removeItem(SETTLEMENT_SKIP_KEY);
  } catch (e) {}
  renderSettlementSetting();
}

function renderSettlementSetting() {
  const btn = $('settlementSettingBtn');
  if (!btn) return;
  const skipped = settlementModalSkipped();
  btn.textContent = skipped ? '↩ 恢复结算弹窗' : '✓ 结算弹窗已开启';
  btn.classList.toggle('is-muted', skipped);
  btn.title = skipped ? '重新开启每日与赛季结算界面' : '结算界面会在进入下一天后自动显示';
}

function enableSettlementModal() {
  setSkipSettlementModal(false);
  const checkbox = $('skipSettlementModal');
  if (checkbox) checkbox.checked = false;
  flash('每日与赛季结算弹窗已恢复');
}

function closeSettlementModal() {
  $('settlementModal').classList.add('hidden');
}

function handleSettlementModalClick(e) {
  if (e.target === e.currentTarget) closeSettlementModal();
}

function signedMoney(value) {
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}¥${Math.abs(rounded)}`;
}

function settlementMoverRows(beforeValues) {
  return cardPool.map((t, i) => {
    const before = beforeValues[i] || 1;
    const after = cardValue(t, curSeason());
    return { t, before, after, pct: Math.round((after / before - 1) * 100) };
  }).filter(x => x.pct !== 0);
}

function buildSettlementHTML(snapshot, seasonChanged) {
  const worth = netWorth();
  const collectionValue = worth - state.money;
  const movers = settlementMoverRows(snapshot.cardValues);
  const risers = movers.filter(x => x.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 3);
  const fallers = movers.filter(x => x.pct < 0).sort((a, b) => a.pct - b.pct).slice(0, 3);
  const newLogs = state.log.filter(entry => !snapshot.oldLogs.has(entry)).slice(-6).reverse();
  const moverHTML = (items, cls, empty) => items.length
    ? items.map(x => `<div class="settlement-mover"><span>${x.t.name}</span><b class="${cls}">${x.pct > 0 ? '+' : ''}${x.pct}%</b><small>¥${x.before} → ¥${x.after}</small></div>`).join('')
    : `<div class="settlement-empty">${empty}</div>`;
  const seasonExtras = seasonChanged ? (() => {
    const rotated = curSeason() - 3;
    const deltas = cardPool.filter(t => t.seasonDelta && t.seasonDelta.season === curSeason())
      .sort((a, b) => Math.abs(b.seasonDelta.powerPct) - Math.abs(a.seasonDelta.powerPct)).slice(0, 5);
    return `<section class="settlement-season">
      <div class="settlement-section-title">赛季交接</div>
      <div class="settlement-season-grid">
        <div><small>本季主题</small><strong>${state.themes.map(a => `${ARCHETYPES[a].emoji}${ARCHETYPES[a].name}`).join(' · ')}</strong></div>
        <div><small>环境轮换</small><strong>${rotated >= 1 ? `S${rotated} 正式退环境` : '尚无卡牌退环境'}</strong></div>
      </div>
      <div class="settlement-rerolls"><small>数值重投幅度较大的卡</small>${deltas.map(t => {
        const pct = t.seasonDelta.powerPct;
        return `<span>${t.name} <b class="${pct >= 0 ? 'up' : 'down'}">${pct > 0 ? '+' : ''}${pct}%</b></span>`;
      }).join('')}</div>
    </section>`;
  })() : '';
  return `<header class="settlement-head${seasonChanged ? ' season-up' : ''}">
      <span class="settlement-kicker">${seasonChanged ? 'NEW SEASON' : 'DAILY REPORT'}</span>
      <h2>${seasonChanged ? `第 ${curSeason()} 赛季开幕` : `第 ${snapshot.day} 天结算`}</h2>
      <p>${seasonChanged ? `第 ${snapshot.season} 赛季已经落幕，新的市场格局正在形成` : `已进入第 ${state.day} 天，看看昨天发生了什么`}</p>
    </header>
    <div class="settlement-summary">
      <div><small>现金变化</small><strong class="${state.money >= snapshot.money ? 'up' : 'down'}">${signedMoney(state.money - snapshot.money)}</strong><em>现有 ¥${state.money}</em></div>
      <div><small>藏品估值</small><strong class="${collectionValue >= snapshot.collectionValue ? 'up' : 'down'}">${signedMoney(collectionValue - snapshot.collectionValue)}</strong><em>现值 ¥${collectionValue}</em></div>
      <div><small>总身价变化</small><strong class="${worth >= snapshot.worth ? 'up' : 'down'}">${signedMoney(worth - snapshot.worth)}</strong><em>总计 ¥${worth}</em></div>
    </div>
    <div class="settlement-retail"><span>🛍️ 店内零售</span><b>${state.lastRetailReport.sales ? `售出 ${state.lastRetailReport.sales} 张 · 净收入 ¥${state.lastRetailReport.net}` : '今日没有顾客成交'}</b></div>
    <div class="settlement-retail"><span>🏷️ 寄售与拍卖</span><b>${state.lastMarketReport.consignSold || state.lastMarketReport.auctionsSold ? `寄售 ${state.lastMarketReport.consignSold} 笔 / 拍卖 ${state.lastMarketReport.auctionsSold} 场 · 净收入 ¥${state.lastMarketReport.consignNet + state.lastMarketReport.auctionNet}` : '今日没有渠道成交'}</b></div>
    <div class="settlement-retail"><span>🚚 批发到货</span><b>${state.lastWholesaleReport.orders ? `${state.lastWholesaleReport.orders} 批 · ${state.lastWholesaleReport.cards} 张 · 当前估值 ¥${state.lastWholesaleReport.value}` : '今日没有新批次到货'}</b></div>
    ${seasonExtras}
    <section class="settlement-market">
      <div class="settlement-section-title">行情摘要</div>
      <div class="settlement-mover-cols">
        <div><h3>涨幅领先</h3>${moverHTML(risers, 'up', '今日暂无上涨')}</div>
        <div><h3>跌幅领先</h3>${moverHTML(fallers, 'down', '今日暂无下跌')}</div>
      </div>
    </section>
    <section class="settlement-events">
      <div class="settlement-section-title">今日要闻 <span>${state.dealers.length} 位来客 · ${state.market.length} 张公开挂牌 · ${state.rumors.length} 条新传闻</span></div>
      ${newLogs.length ? newLogs.map(x => `<div class="settlement-event ${x.c || ''}">${x.t.replace(/^第\d+天\s*/, '')}</div>`).join('') : '<div class="settlement-empty">今天风平浪静，没有特别事件</div>'}
    </section>`;
}

function showSettlementModal(snapshot, seasonChanged) {
  if (settlementModalSkipped()) return;
  $('settlementContent').innerHTML = buildSettlementHTML(snapshot, seasonChanged);
  $('skipSettlementModal').checked = false;
  $('settlementModal').classList.remove('hidden');
}

function nextDay() {
  const prevSeason = curSeason();
  const snapshot = {
    day: state.day,
    season: prevSeason,
    money: state.money,
    worth: netWorth(),
    collectionValue: netWorth() - state.money,
    cardValues: cardPool.map(t => cardValue(t, prevSeason)),
    oldLogs: new Set(state.log),
  };
  processRetailSales();
  state.day++;
  state.packsBought = 0;
  state.packTypeBought = {};
  state.wholesaleSpent = 0;
  tickReprint();
  if (curSeason() > prevSeason) seasonEvent();
  dailyEvent();
  processMarketServices();
  maybeReprint();
  refreshMarket();
  makeOffers();
  deliverWholesaleOrders();
  refreshWholesaleOffers();
  if (curSeason() === prevSeason) refreshCommissions();
  // 记录身价走势
  state.history.push({ d: state.day, v: netWorth() });
  if (state.history.length > 60) state.history.shift();
  checkAchievements();
  renderAll();
  showSettlementModal(snapshot, curSeason() > prevSeason);
}

// ==================== 渲染 ====================
function trendOf(t) {
  if (typeof t.prevHeat !== 'number') return '';
  const d = hiddenHeat(t) - t.prevHeat;
  if (d >= 5) return '<span class="up">▲</span>';
  if (d <= -5) return '<span class="down">▼</span>';
  return '';
}

function seasonTagHTML(s) {
  if (state.reprint && state.reprint.season === s) {
    return `<span class="season-tag s-reprint">S${s}·复刻</span>`;
  }
  if (s === curSeason()) return `<span class="season-tag s-cur">S${s}·当季</span>`;
  if (isRotated(s)) return `<span class="season-tag s-rotated">S${s}·退环境</span>`;
  return `<span class="season-tag s-legal">S${s}·在环境</span>`;
}

function statRollHTML(t) {
  const d = t.seasonDelta;
  if (!d || d.season !== curSeason() || !d.powerPct) return '';
  const sign = d.powerPct > 0 ? '+' : '';
  const cls = d.powerPct > 0 ? 'up' : 'down';
  return `<div class="stat-roll ${cls}">🎲 本季强度 ${sign}${d.powerPct}%</div>`;
}

function openCardDetail(id, s, finish = '', serial = 0) {
  const t = cardPool[id];
  if (!t) return;
  const special = finish ? { id, s, finish, serial } : null;
  $('cardDetailContent').innerHTML = cardHTML(t, { season: s, special });
  $('cardDetailModal').classList.remove('hidden');
}

function closeCardDetail() {
  $('cardDetailModal').classList.add('hidden');
  $('cardDetailContent').innerHTML = '';
}

function handleCardDetailClick(e) {
  if (e.target === e.currentTarget) closeCardDetail();
}

function cardHTML(t, opts = {}) {
  const s = opts.season || curSeason();
  const special = opts.special || null;
  const v = special ? specialValue({ ...special, id: t.id, s }) : cardValue(t, s);
  const sellPrice = Math.max(1, Math.round(v * marketSellRate()));
  const artSrc = artFor(t);
  const art = artSrc
    ? `<img class="card-photo" src="${artSrc}" alt="" onerror="this.replaceWith(document.createTextNode('${ARCHETYPES[t.archetype].emoji}'))">`
    : ARCHETYPES[t.archetype].emoji;
  const fx = t.effects.length
    ? t.effects.map(e => `<div class="fx-line">${fxText(t, e)}</div>`).join('')
    : '<div class="fx-line fx-vanilla">白板</div>';
  const detailArgs = special ? `${t.id}, ${s}, '${special.finish}', ${special.serial || 0}` : `${t.id}, ${s}`;
  const zoomAttrs = opts.zoomable
    ? ` role="button" tabindex="0" aria-label="放大查看${t.name}" onclick="openCardDetail(${detailArgs})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openCardDetail(${detailArgs})}"`
    : '';
  const batchSelector = opts.batchSelectable
    ? `<label class="card-batch-check" title="选择${t.name}" onclick="event.stopPropagation()"><input type="checkbox" aria-label="选择${t.name}" onchange="toggleCollectionCard('${opts.key}', this.checked)" ${opts.selected ? 'checked' : ''}><span>✓</span></label>`
    : '';
  const lockButton = opts.lockable
    ? `<button class="card-lock-btn${opts.locked ? ' is-locked' : ''}" type="button" title="${opts.locked ? '解除收藏保护' : '锁定并防止出售'}" aria-label="${opts.locked ? '解锁' : '锁定'}${t.name}" onclick="event.stopPropagation();toggleCardLock('${opts.key}')">${opts.locked ? '🔒' : '🔓'}</button>`
    : '';
  const specialLockButton = special && special.uid && opts.specialActions
    ? `<button class="card-lock-btn${special.locked ? ' is-locked' : ''}" type="button" title="${special.locked ? '解除特效卡保护' : '锁定特效卡'}" onclick="event.stopPropagation();toggleSpecialLock('${special.uid}')">${special.locked ? '🔒' : '🔓'}</button>`
    : '';
  const specialBadge = special ? `<span class="special-card-badge finish-${special.finish}">${specialLabel(special)}</span>` : '';
  const coreLabel = t.coreRank === 'entry' ? 'CORE·入门' : t.coreRank === 'advanced' ? 'CORE·进阶' : 'CORE·王牌';
  return `
  <div class="card rar-${t.rarity} art-${t.artStyle} arch-${t.archetype} tier-${t.tier}${special ? ` special-card finish-${special.finish}` : ''}${opts.zoomable ? ' card-clickable' : ''}${opts.selected ? ' batch-selected' : ''}${opts.locked || (special && special.locked) ? ' card-locked' : ''}"${zoomAttrs}>
    ${batchSelector}
    ${specialLockButton || lockButton}
    <div class="card-head">
      <span class="cost-gem">${t.cost}</span>
      <span class="card-name">${t.name}</span>
      <span class="rar">${t.rarity}</span>
    </div>
    <div class="card-art">${art}
      ${specialBadge}
      ${t.tier === 'core' ? `<span class="core-seal" title="体系核心">${ARCHETYPES[t.archetype].emoji}</span>` : ''}
      <span class="stat-badge stat-atk"><i>⚔</i><b>${t.atk}</b></span>
      <span class="stat-badge stat-hp"><i>♥</i><b>${t.hp}</b></span>
    </div>
    <div class="card-type">
      <span class="card-type-name">${ARCHETYPES[t.archetype].name} · ${ARTSTYLES[t.artStyle].name}</span>
      ${t.tier === 'core' ? `<b class="core-chip">${coreLabel}</b>` : ''}
      ${seasonTagHTML(s)}
    </div>
    <div class="card-text">
      ${fx}
      ${statRollHTML(t)}
    </div>
    <div class="card-market-strip">
      <div class="ct-row">
        <span class="meta-stat">胜率 ${Math.round(t.wr)}%${trendOf(t)}</span>
        <span class="meta-stat">使用率 ${Math.round(t.usage)}%</span>
      </div>
      <div class="ct-row ct-foot">
        ${opts.sellBtn ? '<span class="market-label">持有</span>' : '<span class="market-label">参考价值</span>'}
        ${opts.sellBtn ? '' : `<span class="val">¥${v}</span>`}
        ${opts.count ? `<span class="cnt">×${opts.count}</span>` : ''}
      </div>
    </div>
    ${special && special.uid && opts.specialActions ? `<button class="btn sell-btn" onclick="event.stopPropagation();sellSpecialToMarket('${special.uid}')" ${special.locked ? 'disabled' : ''}>${special.locked ? '🔒 特效卡已保护' : `卖给市场 ¥${Math.round(v * marketSellRate())}`}</button>` : opts.sellBtn ? `<button class="btn sell-btn" onclick="event.stopPropagation();sellToMarket('${opts.key}')" ${opts.locked ? 'disabled' : ''}>${opts.locked ? '🔒 已锁定' : `卖给市场 ¥${sellPrice}`}</button>` : ''}
  </div>`;
}

function listingHTML(t, rightHTML, s, variant = null) {
  const season = s || curSeason();
  const artSrc = artFor(t);
  const finish = variant && variant.finish || '';
  const serial = variant && variant.serial || 0;
  const zoomAttrs = `class="listing-art-zoom" role="button" tabindex="0" aria-label="放大查看${t.name}" onclick="openCardDetail(${t.id}, ${season}, '${finish}', ${serial})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openCardDetail(${t.id}, ${season}, '${finish}', ${serial})}"`;
  const art = artSrc
    ? `<span ${zoomAttrs}><span class="li-thumb">${ARCHETYPES[t.archetype].emoji}<img src="${artSrc}" alt="" onerror="this.remove()"></span></span>`
    : `<span ${zoomAttrs}><span class="li-art">${ARCHETYPES[t.archetype].emoji}</span></span>`;
  return `
  <div class="listing rar-${t.rarity}${finish ? ` special-listing finish-${finish}` : ''}">
    ${art}
    <div class="li-info">
      <div class="li-name"><span class="rar-tag rar-bg-${t.rarity}">${t.rarity}</span>${seasonTagHTML(season)} ${t.name}${finish ? ` <span class="special-listing-tag">${specialLabel({ finish, serial })}</span>` : ''}</div>
      <div class="li-sub">${ARCHETYPES[t.archetype].name} · ${ARTSTYLES[t.artStyle].name} · 费用${t.cost} ⚔${t.atk} ❤${t.hp} · 胜率${Math.round(t.wr)}% 使用率${Math.round(t.usage)}%${trendOf(t)}${statRollHTML(t)}</div>
    </div>
    ${rightHTML}
  </div>`;
}

function rumorsHTML() {
  if (!state.rumors.length) return '<div class="empty">今天论坛静悄悄的，没什么风声</div>';
  return state.rumors.map(r => `
    <div class="rumor">
      <span class="rumor-src">${r.src}</span>
      <div class="rumor-text">${rumorText(r)}</div>
    </div>`).join('');
}

function logLineHTML(l) {
  return `<div class="log-line ${l.c || ''}">${l.t}</div>`;
}

function renderHeader() {
  $('day').textContent = state.day;
  $('season').textContent = curSeason();
  $('money').textContent = '¥' + state.money;
  $('networth').textContent = '¥' + netWorth();
  const ri = $('reprintInfo');
  if (state.reprint) {
    ri.style.display = '';
    ri.textContent = `🏆 S${state.reprint.season} 复刻中 · 剩 ${state.reprint.daysLeft} 天`;
  } else {
    ri.style.display = 'none';
  }
}

function renderStorefront() {
  cleanRetailListings();
  const def = storeDef();
  const next = STORE_LEVELS[state.storeLevel + 1];
  const blockers = next ? storeUpgradeBlockers(state.storeLevel + 1) : [];
  const listed = new Set(state.retailListings.map(l => l.key));
  const available = Object.keys(state.collection)
    .filter(k => retailCardIsFree(k) && !listed.has(k))
    .map(k => ({ k, ...parseKey(k) }))
    .sort((a, b) => cardValue(cardPool[b.id], b.s) - cardValue(cardPool[a.id], a.s));
  const shelfCards = state.retailListings.slice(0, 12).map((l, i) => {
    const { id, s } = parseKey(l.key);
    const t = cardPool[id];
    const art = artFor(t);
    return `<button class="store-shelf-card rar-${t.rarity}" type="button" onclick="openCardDetail(${id}, ${s})" title="${t.name} · 标价 ${l.pricePct}%">
      <img src="${art}" alt=""><span>¥${Math.round(cardValue(t, s) * l.pricePct / 100)}</span></button>`;
  }).join('');
  const visualSlotCount = Math.min(12, storeShelfSlots());
  const emptySlots = Array.from({ length: Math.max(0, visualSlotCount - Math.min(12, state.retailListings.length)) }, () => '<span class="store-empty-slot">＋</span>').join('');
  const branchShelfBadge = storeShelfSlots() > 12 ? `<span class="store-branch-shelves">分店货架 +${storeShelfSlots() - 12}</span>` : '';
  const rows = state.retailListings.map((l, i) => {
    const { id, s } = parseKey(l.key);
    const t = cardPool[id];
    const value = cardValue(t, s);
    return `<div class="retail-row">
      <div><b>${t.name}</b><small>S${s} · 行情 ¥${value} · ${retailChanceText(l)}</small></div>
      <select onchange="setRetailPrice(${i}, this.value)" aria-label="${t.name}店内售价">
        ${RETAIL_PRICE_OPTIONS.map(p => `<option value="${p}" ${p === l.pricePct ? 'selected' : ''}>${p}% · ¥${Math.round(value * p / 100)}</option>`).join('')}
      </select>
      <button class="btn btn-dim" type="button" onclick="removeRetailListing(${i})">撤下</button>
    </div>`;
  }).join('') || '<div class="retail-empty">货架还是空的，先从收藏中选一张卡试卖吧</div>';
  const nextText = next
    ? `<button class="btn btn-primary" type="button" onclick="upgradeStore()" ${blockers.length ? 'disabled' : ''}>扩建为${next.name} · ¥${next.cost}</button>
      <small>${blockers.length ? `还需：${blockers.join(' · ')}` : `条件已满足 · 新增 ${next.slots - def.slots} 个陈列位`}</small>`
    : state.storeBranches < BRANCH_MAX
      ? `<button class="btn btn-primary" type="button" onclick="openStoreBranch()" ${state.money < branchCost() ? 'disabled' : ''}>开设第 ${state.storeBranches + 1} 家分店 · ¥${branchCost()}</button>
        <small>${state.money < branchCost() ? `还需准备建设费 ¥${branchCost()}` : `货架位 +${BRANCH_SLOTS} · 每日最大成交量 +1`}</small>`
      : '<span class="store-maxed">全国连锁网络已全部建成</span>';
  const report = state.lastRetailReport && state.lastRetailReport.day
    ? `上次营业：售出 ${state.lastRetailReport.sales} 张 · 净收入 ¥${state.lastRetailReport.net}`
    : '尚无营业记录 · 进入下一天后顾客会尝试购买';
  $('storefront').innerHTML = `<div class="storefront-top">
      <div><span class="store-eyebrow">STORE LEVEL ${state.storeLevel}</span><h2>${def.icon} ${def.name}${state.storeBranches ? ` · ${state.storeBranches + 1} 家门店` : ''}</h2><p>${report}</p></div>
      <div class="store-upgrade-action">${nextText}</div>
    </div>
    <div id="storeSceneViewport" class="store-scene-viewport">
    <div class="store-scene store-level-${state.storeLevel}" style="--supply-lv:${state.upgrades.supply};--promo-lv:${state.upgrades.promo};--intel-lv:${state.upgrades.intel};--packs-lv:${state.upgrades.packs};--broker-lv:${state.upgrades.broker}">
      <button class="store-zone store-sign" type="button" onclick="location.hash='#/upgrade'">TCG TYCOON<small>${def.name}</small></button>
      <button class="store-zone store-supply" type="button" onclick="location.hash='#/shop'" title="卡包货源 Lv.${state.upgrades.supply}"><i></i><i></i><b>货源 Lv.${state.upgrades.supply}${state.wholesaleOrders.length ? ` · 在途 ${state.wholesaleOrders.length}` : ''}</b></button>
      <button class="store-zone store-promo" type="button" onclick="location.hash='#/private'" title="宣传推广 Lv.${state.upgrades.promo}">今日来客<br><b>${dailyGuestCount()} 位</b></button>
      <button class="store-zone store-intel" type="button" onclick="location.hash='#/news'" title="情报信源 Lv.${state.upgrades.intel}"><span>MARKET</span><b>${state.upgrades.intel ? '行情在线' : '等待接入'}</b></button>
      <button class="store-zone store-license" type="button" onclick="location.hash='#/shop'" title="卡包经营许可 Lv.${state.upgrades.packs}"><span>PACK WALL</span><b>${state.upgrades.packs + 1} 种商品</b></button>
      <button class="store-zone store-counter" type="button" onclick="location.hash='#/market'" title="市场渠道 Lv.${state.upgrades.broker}"><span>收银台</span><b>渠道 Lv.${state.upgrades.broker}</b></button>
      <div class="store-crowd crowd-${Math.min(5, state.upgrades.promo)}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="store-shelves" aria-label="店内陈列">${shelfCards}${emptySlots}${branchShelfBadge}</div>
    </div></div>
    <div class="store-pan-hint" aria-hidden="true">← 左右滑动查看完整店铺 →</div>
    <div class="retail-manager">
      <div class="retail-manager-head"><div><h3>店内陈列</h3><p>${state.retailListings.length}/${storeShelfSlots()} 个陈列位 · 委托占用卡不会被自动上架 · 成交扣除 ${Math.round((1 - retailNetRate()) * 100)}% 运营成本</p></div></div>
      <div class="retail-add">
        <select id="retailCardSelect" aria-label="选择陈列卡牌"><option value="">选择收藏中的卡牌…</option>${available.map(e => {
          const t = cardPool[e.id];
          return `<option value="${e.k}">${t.name} · S${e.s} · ×${state.collection[e.k]} · ¥${cardValue(t, e.s)}</option>`;
        }).join('')}</select>
        <select id="retailPriceSelect" aria-label="设置陈列售价">${RETAIL_PRICE_OPTIONS.map(p => `<option value="${p}" ${p === 110 ? 'selected' : ''}>售价 ${p}%</option>`).join('')}</select>
        <button class="btn btn-primary" type="button" onclick="addRetailListing()" ${!available.length || state.retailListings.length >= storeShelfSlots() ? 'disabled' : ''}>上架陈列</button>
        <button class="btn btn-dim" type="button" onclick="listHighestValueCards()" ${!available.length || state.retailListings.length >= storeShelfSlots() ? 'disabled' : ''}>⚡ 一键上架最贵</button>
      </div>
      <div class="retail-list">${rows}</div>
    </div>`;
  const viewport = $('storeSceneViewport');
  if (viewport && typeof matchMedia === 'function' && matchMedia('(max-width: 560px)').matches) {
    requestAnimationFrame(() => { viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2; });
  }
}

function renderHome() {
  const totalCards = Object.values(state.collection).reduce((a, b) => a + b, 0) + state.specialCards.length;
  const hot = hottestArchetype();
  $('home-money').textContent = '¥' + state.money;
  $('home-networth').textContent = '¥' + netWorth();
  $('home-coll').textContent = `${Object.keys(state.collection).length + state.specialCards.length} 种 / ${totalCards} 张`;
  $('home-hot').textContent = `${ARCHETYPES[hot].emoji} ${ARCHETYPES[hot].name}`;
  renderStorefront();
  $('home-rumors').innerHTML = rumorsHTML();
  $('home-log').innerHTML = state.log.slice(-6).reverse().map(logLineHTML).join('') || '<div class="empty">暂无动态</div>';
}

function renderChart() {
  const el = $('worthChart');
  if (!state.history.length) { el.innerHTML = '<div class="empty">暂无数据，进入下一天后开始记录</div>'; return; }
  const max = Math.max(...state.history.map(h => h.v), 1);
  el.innerHTML = state.history.map(h =>
    `<div class="bar" style="height:${Math.max(4, Math.round(h.v / max * 100))}%" title="第${h.d}天 ¥${h.v}"></div>`).join('');
}

function packVisualHTML(def, seasonText) {
  return `<div class="booster-pack catalog-pack pack-kind-${def.css}" aria-hidden="true">
    <div class="pack-crimp pack-crimp-top"></div>
    <div class="pack-face">
      <span class="pack-brand">TCG TYCOON</span>
      <span class="pack-emblem">✦</span>
      <b>${def.face}</b>
      <small>${seasonText}</small>
      <span class="pack-count">${def.size} CARDS</span>
    </div>
    <div class="pack-crimp pack-crimp-bottom"></div>
  </div>`;
}

function specialPackHTML(key, def, sharedLeft) {
  const unlocked = state.upgrades.packs >= def.unlockLv;
  const seasonReady = !def.classic || curSeason() > 1;
  const bought = state.packTypeBought[key] || 0;
  const typeLeft = def.dailyLimit ? Math.max(0, def.dailyLimit - bought) : Infinity;
  const soldOut = sharedLeft <= 0 || typeLeft <= 0;
  let buttonText = `购买 ¥${def.price}`;
  if (!unlocked) buttonText = `许可 Lv.${def.unlockLv} 解锁`;
  else if (!seasonReady) buttonText = '第 2 赛季开放';
  else if (soldOut) buttonText = '今日售罄';
  const disabled = !unlocked || !seasonReady || soldOut || state.money < def.price;
  const stockText = def.dailyLimit ? `今日专属库存 ${typeLeft}/${def.dailyLimit}` : '使用共享货源';
  const seasonText = def.classic ? 'CLASSIC' : def.themed ? 'THEME' : `SEASON ${curSeason()}`;
  return `<article class="pack-offer${unlocked ? '' : ' is-locked'}">
    <div class="catalog-pack-wrap">${packVisualHTML(def, seasonText)}${unlocked ? '' : '<span class="pack-lock">🔒</span>'}</div>
    <div class="pack-offer-info">
      <h3>${def.name}</h3>
      <p>${def.desc}</p>
      <span class="pack-offer-stock">${stockText}</span>
      <button class="btn btn-primary" onclick="buyPack('${key}')" ${disabled ? 'disabled' : ''}>${buttonText}</button>
    </div>
  </article>`;
}

function renderWholesale() {
  const cap = wholesaleDailyCapacity();
  const left = wholesaleCapacityLeft();
  $('wholesaleCapacityInfo').textContent = `今日采购容量 ¥${left}/¥${cap} · 同时处理 ${state.wholesaleOrders.length}/${wholesaleOrderLimit()} 单`;
  $('wholesaleOrders').innerHTML = state.wholesaleOrders.length
    ? `<div class="wholesale-order-title">在途订单</div>${state.wholesaleOrders.map(order => {
      const def = WHOLESALE_TYPES[order.type];
      return `<div class="wholesale-order-row"><span>${def.icon} ${def.name}</span><b>${order.items.length} 张</b><small>已付 ¥${order.paid} · 第 ${order.arriveDay} 天到货（还剩 ${Math.max(0, order.arriveDay - state.day)} 天）</small></div>`;
    }).join('')}`
    : '<div class="wholesale-order-empty">目前没有在途订单</div>';
  $('wholesaleBoard').innerHTML = Object.entries(WHOLESALE_TYPES).map(([type, def]) => {
    const offer = state.wholesaleOffers.find(o => o.type === type);
    if (!offer) return '';
    const unlocked = wholesaleUnlocked(def);
    const price = wholesalePrice(offer);
    const blocked = state.wholesaleOrders.length >= wholesaleOrderLimit() || price > left || state.money < price;
    const requirement = `货源 Lv.${def.supplyLv} · 许可 Lv.${def.packsLv}${def.season > 1 ? ` · S${def.season}` : ''}`;
    let button = `订购 ¥${price}`;
    if (offer.purchased) button = '今日已订购';
    else if (!unlocked) button = `${requirement} 解锁`;
    else if (price > left) button = '超出今日采购容量';
    else if (state.wholesaleOrders.length >= wholesaleOrderLimit()) button = '在途订单已满';
    const discount = wholesaleDiscount();
    return `<article class="wholesale-offer${unlocked ? '' : ' is-locked'}">
      <div class="wholesale-offer-icon">${def.icon}<span>${def.count} CARDS</span></div>
      <div class="wholesale-offer-body"><h3>${def.name}</h3><p>${def.desc}</p>
        <div class="wholesale-tags"><span>${def.days} 天到货</span><span>${requirement}</span>${discount ? `<span class="good">渠道折扣 ${Math.round(discount * 100)}%</span>` : ''}</div>
        <div class="wholesale-estimate">🕵️ ${wholesaleEstimateText(offer)}</div>
        <button class="btn btn-primary" type="button" onclick="buyWholesale('${type}')" ${offer.purchased || !unlocked || blocked ? 'disabled' : ''}>${button}</button>
      </div>
    </article>`;
  }).join('');
}

function renderShop() {
  const left = dailyPackLimit() - state.packsBought;
  const btn = $('buyPackBtn');
  $('packStock').innerHTML = left > 0
    ? `今日货源剩余 <b>${left}</b> / ${dailyPackLimit()} 包`
    : `今日货源已售罄，明天再来吧（可在「🚀 升级」页扩充货源）`;
  const themeNames = state.themes.map(a => `${ARCHETYPES[a].emoji}${ARCHETYPES[a].name}`).join(' · ');
  $('shopPackSeason').textContent = `SEASON ${curSeason()}`;
  $('skipPackAnimation').checked = shouldSkipPackAnimation();
  $('packSeason').textContent = `本店卡包开出的均为第 ${curSeason()} 赛季新卡 · 本季数值已重投 · 主题：${themeNames}`;
  btn.disabled = left <= 0 || state.money < PACK_TYPES.standard.price;
  btn.textContent = left > 0 ? `开一包（¥${PACK_TYPES.standard.price}）` : '今日已售罄';
  $('specialPacks').innerHTML = Object.entries(PACK_TYPES)
    .filter(([key]) => key !== 'standard')
    .map(([key, def]) => specialPackHTML(key, def, left))
    .join('');
  renderWholesale();
}

function collectionSeasonStatus(s) {
  if (state.reprint && state.reprint.season === s) return 'reprint';
  if (s === curSeason()) return 'current';
  return isRotated(s) ? 'rotated' : 'legal';
}

function filteredCollectionEntries() {
  const search = $('collSearch').value.trim().toLowerCase();
  const rarity = $('collRarity').value;
  const arch = $('collArch').value;
  const season = $('collSeason').value;
  const tier = $('collTier').value;
  const copies = $('collCopies').value;
  const sort = $('collSort').value;
  const entries = Object.keys(state.collection)
    .map(k => ({ k, ...parseKey(k) }))
    .filter(e => {
      const t = cardPool[e.id];
      const count = state.collection[e.k];
      return (!search || t.name.toLowerCase().includes(search))
        && (!rarity || t.rarity === rarity)
        && (!arch || t.archetype === arch)
        && (!season || collectionSeasonStatus(e.s) === season)
        && (!tier || t.tier === tier)
        && (!copies || (copies === 'duplicate' ? count > 1 : count === 1));
    });
  const valueOf = e => cardValue(cardPool[e.id], e.s);
  entries.sort((a, b) => {
    if (sort === 'value-asc') return valueOf(a) - valueOf(b);
    if (sort === 'count-desc') return state.collection[b.k] - state.collection[a.k] || valueOf(b) - valueOf(a);
    if (sort === 'season-desc') return b.s - a.s || valueOf(b) - valueOf(a);
    if (sort === 'name') return cardPool[a.id].name.localeCompare(cardPool[b.id].name, 'zh-CN');
    return valueOf(b) - valueOf(a);
  });
  return entries;
}

function toggleCollectionBatchMode() {
  collectionView.batchMode = !collectionView.batchMode;
  if (!collectionView.batchMode) collectionView.selected.clear();
  renderCollection();
}

function toggleCollectionCard(k, checked) {
  if (checked) collectionView.selected.add(k);
  else collectionView.selected.delete(k);
  renderCollection();
}

function selectFilteredCollection() {
  filteredCollectionEntries().filter(e => !isCardLocked(e.k)).forEach(e => collectionView.selected.add(e.k));
  renderCollection();
}

function clearCollectionSelection() {
  collectionView.selected.clear();
  renderCollection();
}

function batchSalePlan() {
  const mode = $('batchSellMode').value;
  const items = [];
  let cardCount = 0, revenue = 0;
  collectionView.selected.forEach(k => {
    if (isCardLocked(k)) return;
    const owned = state.collection[k] || 0;
    const qty = mode === 'all' ? owned : mode === 'one' ? Math.min(1, owned) : Math.max(0, owned - 1);
    if (!qty) return;
    const { id, s } = parseKey(k);
    const unitPrice = Math.max(1, Math.round(cardValue(cardPool[id], s) * marketSellRate()));
    items.push({ k, id, s, qty, unitPrice });
    cardCount += qty;
    revenue += qty * unitPrice;
  });
  return { items, cardCount, revenue };
}

function updateBatchSaleSummary() {
  const summary = $('batchSaleSummary');
  const button = $('batchSellBtn');
  if (!collectionView.selected.size) {
    summary.textContent = '尚未选择卡牌';
    button.disabled = true;
    return;
  }
  const plan = batchSalePlan();
  summary.innerHTML = `已选 <b>${collectionView.selected.size}</b> 种 · 可售 <b>${plan.cardCount}</b> 张 · 预计回款 <b>¥${plan.revenue}</b>`;
  button.disabled = plan.cardCount <= 0;
}

function sellSelectedCollection() {
  const plan = batchSalePlan();
  if (!plan.cardCount) { flash('当前出售方式下没有可卖的卡牌'); return; }
  if (!window.confirm(`确认批量出售 ${plan.items.length} 种、共 ${plan.cardCount} 张卡牌，收入 ¥${plan.revenue}？`)) return;
  plan.items.forEach(item => {
    state.collection[item.k] -= item.qty;
    if (state.collection[item.k] <= 0) delete state.collection[item.k];
  });
  state.money += plan.revenue;
  recordProgress('cardsSold', plan.cardCount);
  recordProgress('tradeDeals', 1);
  recordProgress('moneyEarned', plan.revenue);
  collectionView.selected.clear();
  addTrade(`📦 批量出售 ${plan.items.length} 种、共 ${plan.cardCount} 张卡牌，收入 ¥${plan.revenue}`);
  renderAll();
}

function renderCollection() {
  const el = $('collection');
  const allEntries = Object.keys(state.collection).map(k => ({ k, ...parseKey(k) }));
  Object.keys(state.cardLocks).forEach(k => { if (!state.collection[k]) delete state.cardLocks[k]; });
  collectionView.selected.forEach(k => { if (!state.collection[k]) collectionView.selected.delete(k); });
  const entries = filteredCollectionEntries();
  const search = $('collSearch').value.trim().toLowerCase();
  const rarity = $('collRarity').value, arch = $('collArch').value, seasonFilter = $('collSeason').value;
  const tier = $('collTier').value, copies = $('collCopies').value;
  const specials = state.specialCards.filter(card => {
    const t = cardPool[card.id];
    return (!search || t.name.toLowerCase().includes(search) || specialLabel(card).toLowerCase().includes(search))
      && (!rarity || t.rarity === rarity) && (!arch || t.archetype === arch)
      && (!seasonFilter || collectionSeasonStatus(card.s) === seasonFilter)
      && (!tier || t.tier === tier) && (!copies || copies === 'single');
  }).sort((a, b) => specialValue(b) - specialValue(a));
  const totalCards = allEntries.reduce((sum, e) => sum + state.collection[e.k], 0) + state.specialCards.length;
  const totalVal = allEntries.reduce((sum, e) => sum + cardValue(cardPool[e.id], e.s) * state.collection[e.k], 0)
    + state.specialCards.reduce((sum, card) => sum + specialValue(card), 0);
  const lockedCount = allEntries.filter(e => isCardLocked(e.k)).length + state.specialCards.filter(c => c.locked).length;
  const totalKinds = allEntries.length + state.specialCards.length;
  const shownKinds = entries.length + specials.length;
  $('collSummary').innerHTML = totalKinds
    ? `共 <b>${totalKinds}</b> 种 · <b>${totalCards}</b> 张 · 总市值 <b>¥${totalVal}</b>${state.specialCards.length ? ` · 特效 <b>${state.specialCards.length}</b> 张` : ''}${lockedCount ? ` · 已保护 <b>${lockedCount}</b> 种` : ''}${shownKinds !== totalKinds ? ` · 当前显示 <b>${shownKinds}</b> 种` : ''}`
    : '';
  $('collectionBatchActions').classList.toggle('hidden', !collectionView.batchMode);
  $('batchModeBtn').textContent = collectionView.batchMode ? '退出批量管理' : '☑ 批量管理';
  el.classList.toggle('batch-mode', collectionView.batchMode);
  const specialHTML = specials.map(card => cardHTML(cardPool[card.id], {
    season: card.s, special: card, specialActions: true, zoomable: true,
  })).join('');
  const normalHTML = entries.map(e => cardHTML(cardPool[e.id], {
      season: e.s, count: state.collection[e.k], sellBtn: true, key: e.k, zoomable: true,
      lockable: true, locked: isCardLocked(e.k),
      batchSelectable: collectionView.batchMode && !isCardLocked(e.k), selected: collectionView.selected.has(e.k),
    })).join('');
  el.innerHTML = specialHTML + normalHTML || `<div class="empty">${totalKinds ? '没有符合当前筛选条件的卡牌' : '还没有卡牌，去「🎁 开包」页买包开卡吧！'}</div>`;
  updateBatchSaleSummary();
}

function renderMarket() {
  $('marketFeeInfo').textContent = `每日刷新 · 买入加价 ${Math.round((marketBuyMarkup() - 1) * 100)}% · 卖出回收 ${Math.round(marketSellRate() * 100)}%`;
  $('market').innerHTML = state.market.map((l, i) => {
    const t = cardPool[l.id];
    const btn = `<button class="btn buy-btn" onclick="buyFromMarket(${i})" ${state.money < l.price ? 'disabled' : ''}>¥${l.price}</button>`;
    return listingHTML(t, btn, l.s, l.finish ? l : null);
  }).join('');
}

function renderMarketServices() {
  const consignEl = $('consignmentBoard');
  const auctionEl = $('auctionBoard');
  if (!consignEl || !auctionEl) return;
  const broker = state.upgrades.broker;
  $('consignmentInfo').textContent = broker >= 2 ? `${state.consignments.length}/${consignmentSlots()} 格 · 手续费 ${consignmentFee()}%` : '市场渠道 Lv.2 解锁';
  $('auctionInfo').textContent = broker >= 4 ? `${state.auctions.length}/${auctionSlots()} 席 · 手续费 ${auctionFee()}%` : '市场渠道 Lv.4 解锁';

  if (broker < 2) consignEl.innerHTML = '<div class="service-locked"><b>🔒 尚未接通寄售平台</b><span>把「市场渠道」升到 Lv.2 后开放。即时市场仍可正常使用。</span></div>';
  else {
    const active = state.consignments.length ? `<div class="service-active-list">${state.consignments.map((item, i) => {
      const t = cardPool[item.id];
      const ask = Math.round(cardValue(t, item.s) * item.askPct / 100);
      return listingHTML(t, `<span class="service-status">¥${ask} · 剩 ${item.daysLeft} 天</span><button class="btn btn-dim" onclick="cancelConsignment(${i})">撤回</button>`, item.s);
    }).join('')}</div>` : '<div class="service-empty">当前没有寄售中的卡牌</div>';
    const candidates = Object.keys(state.collection).filter(k => !isCardLocked(k) && !state.retailListings.some(x => x.key === k) && state.collection[k] > commissionReservedQty(k))
      .map(k => ({ k, ...parseKey(k) })).sort((a, b) => cardValue(cardPool[b.id], b.s) - cardValue(cardPool[a.id], a.s));
    const picker = state.consignments.length < consignmentSlots() ? `
      <div class="service-picker-head"><b>选择寄售卡</b><label>标价 <select onchange="marketServiceUI.consignPct=Number(this.value);renderMarketServices()">${CONSIGN_PRICE_OPTIONS.map(p => `<option value="${p}" ${marketServiceUI.consignPct === p ? 'selected' : ''}>行情 ${p}%</option>`).join('')}</select></label></div>
      <div class="service-candidates">${candidates.length ? candidates.map(x => listingHTML(cardPool[x.id], `<button class="btn buy-btn" onclick="listConsignment('${x.k}',${marketServiceUI.consignPct})">寄售</button>`, x.s)).join('') : '<div class="service-empty">没有可用的未锁定普通卡</div>'}</div>` : '<div class="service-cap">寄售位已满，等待成交或撤回后再上架。</div>';
    consignEl.innerHTML = active + picker;
  }

  if (broker < 4) auctionEl.innerHTML = '<div class="service-locked"><b>🔒 高端拍卖行尚未开放</b><span>市场渠道 Lv.4 解锁；Lv.5 增加第二个拍卖席并降低手续费。</span></div>';
  else {
    const active = state.auctions.length ? `<div class="service-active-list">${state.auctions.map((item, i) => {
      const card = item.card;
      const reserve = Math.round(specialValue(card) * item.reservePct / 100);
      const status = item.currentBid ? `当前 ¥${item.currentBid} · ${item.bidders} 人` : '等待首位出价';
      return listingHTML(cardPool[card.id], `<span class="service-status">${status}<small>保留价 ¥${reserve} · ${Math.max(0, item.endDay - state.day)} 天</small></span><button class="btn btn-dim" onclick="cancelAuction(${i})" ${item.bidders ? 'disabled title="已有出价，不能撤拍"' : ''}>撤拍</button>`, card.s, card);
    }).join('')}</div>` : '<div class="service-empty">当前没有进行中的拍卖</div>';
    const candidates = state.specialCards.filter(c => !c.locked).sort((a, b) => specialValue(b) - specialValue(a));
    const picker = state.auctions.length < auctionSlots() ? `
      <div class="service-picker-head"><b>选择送拍藏品</b><label>保留价 <select onchange="marketServiceUI.reservePct=Number(this.value);renderMarketServices()">${AUCTION_RESERVE_OPTIONS.map(p => `<option value="${p}" ${marketServiceUI.reservePct === p ? 'selected' : ''}>估值 ${p}%</option>`).join('')}</select></label></div>
      <div class="service-candidates">${candidates.length ? candidates.map(card => listingHTML(cardPool[card.id], `<button class="btn buy-btn" onclick="listAuction('${card.uid}',${marketServiceUI.reservePct})">送拍</button>`, card.s, card)).join('') : '<div class="service-empty">没有已解锁的特效卡；收藏保护中的卡不会显示</div>'}</div>` : '<div class="service-cap">拍卖席已满，等待落槌或撤拍后再送入。</div>';
    auctionEl.innerHTML = active + picker;
  }
}

// 体系风云榜：按平均使用率排名，展示胜率/使用率
function renderArchBoard() {
  const rows = Object.keys(ARCHETYPES).map(a => {
    const ts = cardPool.filter(t => t.archetype === a);
    return {
      a,
      usage: ts.reduce((s, t) => s + t.usage, 0) / ts.length,
      wr: ts.reduce((s, t) => s + t.wr, 0) / ts.length,
    };
  }).sort((x, y) => y.usage - x.usage);
  const medals = ['🥇', '🥈', '🥉'];
  $('archBoard').innerHTML = rows.map((r, i) => `
  <div class="arch-row${state.themes.includes(r.a) ? ' arch-themed' : ''}">
    <span class="arch-rank">${medals[i] || `${i + 1}.`}</span>
    <span class="arch-name">${ARCHETYPES[r.a].emoji} ${ARCHETYPES[r.a].name}</span>
    ${state.themes.includes(r.a) ? '<span class="theme-tag">⭐主题</span>' : ''}
    <div class="arch-bars">
      <div class="arch-bar-row"><span>使用率</span><div class="arch-bar"><i style="width:${r.usage}%"></i></div><b>${r.usage.toFixed(1)}%</b></div>
      <div class="arch-bar-row"><span>胜率</span><div class="arch-bar"><i class="wr" style="width:${r.wr}%"></i></div><b>${r.wr.toFixed(1)}%</b></div>
    </div>
  </div>`).join('');
}

function renderBoard() {
  const themeNames = state.themes.map(a => `${ARCHETYPES[a].emoji}${ARCHETYPES[a].name}`).join(' · ');
  $('boardSub').textContent = `以第 ${curSeason()} 赛季计 · 主题：${themeNames} · 按当前估值排序`;
  const intelOn = state.upgrades.intel >= 2;
  const sorted = cardPool.slice().sort((a, b) => cardValue(b, curSeason()) - cardValue(a, curSeason()));
  $('board').innerHTML = sorted.map(t => {
    const tags = [
      state.themes.includes(t.archetype) ? '<span class="theme-tag">⭐主题</span>' : '',
      intelOn && state.nerfWatch.includes(t.id) ? '<span class="risk-tag">⚠ 削弱风险</span>' : '',
    ].join('');
    return listingHTML(t, `${tags}<b class="val">¥${cardValue(t, curSeason())}</b>`, curSeason());
  }).join('');
}

function renderOffers() {
  const el = $('privateGuests');
  $('privateGuestCount').textContent = state.dealers.length
    ? `${state.dealers.length} 位 · 累计声望 ${state.lifetimeReputation} · 当前圈层上限：${NPC_QUALITY[maxNpcQuality()].name}` : '';
  if (!state.dealers.length) {
    el.innerHTML = '<div class="empty">今天暂时没有客人来访</div>';
    renderPrivateInventory();
    return;
  }
  el.innerHTML = state.dealers.map(dealer => {
    const offerIndex = state.offers.findIndex(o => o.dealerId === dealer.id);
    const o = offerIndex >= 0 ? state.offers[offerIndex] : null;
    const profile = profileOf(dealer);
    const rel = relationshipOf(dealer);
    const relTier = relationshipTier(rel.trust || 0);
    const reserved = state.npcReservation && state.npcReservation.profile === dealer.profile && state.npcReservation.name === dealer.name;
    const budgetPct = dealer.maxBudget ? Math.round(dealer.budget / dealer.maxBudget * 100) : 0;
    let offerHTML = `<div class="dealer-no-offer">${(dealer.tradesDone || 0) >= dealer.maxTrades ? '今天的主动售卡次数已经用完。' : '当前没有主动报价，但仍可以向 TA 出售符合偏好的卡。'}</div>`;
    if (o) {
      const t = cardPool[o.id];
      const actionBtn = o.mode === 'buy'
        ? `<button class="btn btn-good" onclick="acceptOffer(${offerIndex})">卖给 TA（+¥${o.price}）</button>`
        : `<button class="btn btn-good" onclick="acceptOffer(${offerIndex})" ${state.money < o.price ? 'disabled' : ''}>买下（-¥${o.price}）</button>`;
      const sign = o.mode === 'buy' ? '+' : '-';
      const canHaggle = o.rounds < 2 && dealer.patience > 0;
      offerHTML = `
        <p class="npc-text">“${o.source === 'player' ? '这张卡我愿意收，价格还可以再谈谈。' : o.mode === 'buy' ? profile.buyText : profile.sellText}”</p>
        <div class="dealer-offer-kind">${o.source === 'player' ? '你指定出售的卡' : o.mode === 'buy' ? '对方原本想收购的卡' : '对方向你出售卡牌'}</div>
        ${listingHTML(t, `<b class="offer-price">¥${o.price}</b>`, o.s, o.finish ? o : null)}
        ${o.note ? `<div class="haggle-note">${o.note}</div>` : ''}
        <div class="offer-actions">${actionBtn}<button class="btn btn-dim" onclick="declineOffer(${offerIndex})">${o.source === 'player' ? '取消售卡' : '拒绝报价'}</button></div>
        <div class="haggle-row">
          <span>🗣️ ${canHaggle ? `讲价机会 ${2 - o.rounds} 次` : '对方不再议价'}</span>
          <button onclick="haggleOffer(${offerIndex}, 'gentle')" ${canHaggle ? '' : 'disabled'}>${sign}5%</button>
          <button onclick="haggleOffer(${offerIndex}, 'firm')" ${canHaggle ? '' : 'disabled'}>${sign}10%</button>
          <button onclick="haggleOffer(${offerIndex}, 'hard')" ${canHaggle ? '' : 'disabled'}>${sign}18%</button>
        </div>`;
    }
    return `
      <article id="dealer-${dealer.id}" class="dealer-card${privateTradeUI.activeDealerId === dealer.id ? ' active' : ''}">
        <div class="npc-head">
          <span class="npc-emoji">${dealer.emoji}</span>
          <div class="dealer-identity"><b>${dealer.name}</b><div class="npc-tag">${dealer.tag}</div>${dealer.quality ? `<span class="npc-quality quality-${dealer.quality}">💎 ${NPC_QUALITY[dealer.quality].name}</span>` : ''}</div>
          <div class="dealer-limits"><span class="dealer-patience" title="剩余耐心">耐心 ${'●'.repeat(dealer.patience)}${'○'.repeat(Math.max(0, 3 - dealer.patience))}</span><span>主动售卡 ${dealer.tradesDone || 0}/${dealer.maxTrades}</span></div>
        </div>
        <div class="npc-relationship">
          <div><span>关系 · <b>${relTier.name}</b></span><strong>${rel.trust || 0}/60</strong></div>
          <i><em style="width:${Math.round((rel.trust || 0) / 60 * 100)}%"></em></i>
          <small>${rel.trust >= 30 ? `专属求购：${ARCHETYPES[rel.targetArch].emoji}${ARCHETYPES[rel.targetArch].name} · 报价 +18%` : `信任 ${relTier.next} 解锁${relTier.next === 5 ? '关系加成' : relTier.next === 15 ? '预约回访' : '专属求购'}`}</small>
          <div class="relationship-actions">
            ${rel.trust >= 15 ? `<button class="btn btn-dim" onclick="reserveDealer('${dealer.id}')" ${reserved ? 'disabled' : ''}>${reserved ? '✓ 已预约明日' : '📅 预约明日回访'}</button>` : ''}
            ${rel.trust >= 50 ? `<label>🧭 指定寻卡 <select onchange="setDealerWantedArch('${dealer.id}',this.value)"><option value="" ${!rel.wantedArch ? 'selected' : ''}>选择体系</option>${Object.entries(ARCHETYPES).map(([key, a]) => `<option value="${key}" ${rel.wantedArch === key ? 'selected' : ''}>${a.emoji}${a.name}</option>`).join('')}</select></label>` : ''}
          </div>
        </div>
        <div class="dealer-budget"><span>今日收购预算</span><b>¥${dealer.budget}</b><i><em style="width:${budgetPct}%"></em></i></div>
        ${offerHTML}
        <button class="btn dealer-sell-to" onclick="openDealerInventory('${dealer.id}')" ${dealer.budget <= 0 || (dealer.tradesDone || 0) >= dealer.maxTrades ? 'disabled' : ''}>💼 主动向 ${dealer.name} 售卡</button>
      </article>`;
  }).join('');
  renderPrivateInventory();
}

function renderPrivateInventory() {
  const el = $('privateInventory');
  const dealer = dealerById(privateTradeUI.activeDealerId);
  if (!dealer) {
    el.innerHTML = '<div class="empty private-empty">从上方选择一位商人，查看 TA 对你收藏中每张卡的报价。</div>';
    return;
  }
  const rows = Object.keys(state.collection).filter(k => !isCardLocked(k)).map(k => {
    const { id, s } = parseKey(k);
    const t = cardPool[id];
    return { k, id, s, t, quote: quoteCardToDealer(dealer, t, s) };
  }).filter(row => {
    if (privateTradeUI.filter === 'preferred') return row.quote.accepted && row.quote.score === 2;
    if (privateTradeUI.filter === 'accepted') return row.quote.accepted;
    if (privateTradeUI.filter === 'rejected') return !row.quote.accepted;
    return true;
  }).sort((a, b) => {
    if (a.quote.accepted !== b.quote.accepted) return a.quote.accepted ? -1 : 1;
    if (a.quote.score !== b.quote.score) return b.quote.score - a.quote.score;
    return (b.quote.price || 0) - (a.quote.price || 0);
  });
  const controls = `
    <div class="private-inventory-head">
      <div><span class="npc-emoji small">${dealer.emoji}</span><b>${dealer.name}</b> 正在看你的收藏 <span>· 可动用 ¥${Math.max(0, dealer.budget - dealerReservedBudget(dealer.id))} / 总剩余 ¥${dealer.budget}</span></div>
      <select onchange="privateTradeUI.filter=this.value;renderPrivateInventory()">
        <option value="all" ${privateTradeUI.filter === 'all' ? 'selected' : ''}>全部卡牌</option>
        <option value="preferred" ${privateTradeUI.filter === 'preferred' ? 'selected' : ''}>只看偏好卡</option>
        <option value="accepted" ${privateTradeUI.filter === 'accepted' ? 'selected' : ''}>只看愿意收购</option>
        <option value="rejected" ${privateTradeUI.filter === 'rejected' ? 'selected' : ''}>只看拒收</option>
      </select>
    </div>`;
  const list = rows.length ? rows.map(row => {
    const q = row.quote;
    const quoteHTML = q.accepted
      ? `<div class="private-quote quote-${q.score}"><span>${q.label}</span><b>¥${q.price}</b><button class="btn btn-good" onclick="proposeCardToDealer('${dealer.id}', '${row.k}')">选这张议价</button></div>`
      : `<div class="private-quote rejected"><span>拒收</span><small>${q.reason}</small><button class="btn btn-dim" disabled>无法出售</button></div>`;
    return `<div class="private-card-row">${listingHTML(row.t, `<span class="owned-count">持有 ×${state.collection[row.k]}</span>`, row.s)}${quoteHTML}</div>`;
  }).join('') : '<div class="empty">没有符合当前条件的卡牌</div>';
  el.innerHTML = controls + `<div class="private-card-list">${list}</div>`;
}

function renderUpgrades() {
  $('upgrades').innerHTML = Object.entries(UPGRADES).map(([key, u]) => {
    const lv = state.upgrades[key];
    const maxed = lv >= u.maxLv;
    const cost = upgradeCost(key);
    const effect = maxed
      ? `当前：${upgradeEffect(key, lv)}`
      : `当前：${upgradeEffect(key, lv)} → 下一级：${upgradeEffect(key, lv + 1)}`;
    const btn = maxed
      ? '<button class="btn btn-dim" disabled>已满级</button>'
      : `<button class="btn btn-primary" onclick="buyUpgrade('${key}')" ${state.money < cost ? 'disabled' : ''}>升级（¥${cost}）</button>`;
    return `
    <section class="panel upgrade-card">
      <div class="up-icon">${u.icon}</div>
      <b>${u.name}</b><span class="up-lv">Lv.${lv} / ${u.maxLv}</span>
      <div class="up-desc">${u.desc}</div>
      <div class="up-effect">${effect}</div>
      ${btn}
    </section>`;
  }).join('');
}

function renderRumors() {
  $('rumors').innerHTML = rumorsHTML();
}

// 市场动态：最新在前
function renderLog() {
  const el = $('log');
  el.innerHTML = state.log.slice().reverse().map(logLineHTML).join('');
}

// 我的交易：最新在前
function renderTrades() {
  const el = $('trades');
  if (!el) return;
  el.innerHTML = state.trades.length
    ? state.trades.slice().reverse().map(logLineHTML).join('')
    : '<div class="empty">还没有交易记录，去公开市场或私下交易逛逛吧</div>';
}

function scoreBarHTML(label, value, weight, extra = '') {
  const shown = clamp(value, 0, 100);
  return `<div class="commission-score-line">
    <div><span>${label} <small>×${weight}%</small></span><b>${value.toFixed(1)}</b></div>
    <div class="commission-score-track"><i style="width:${shown}%"></i></div>
    ${extra ? `<small>${extra}</small>` : ''}
  </div>`;
}

function commissionCardHTML(c) {
  const a = ARCHETYPES[c.archetype];
  const d = COMMISSION_DIFFICULTIES[c.difficulty];
  const type = COMMISSION_TYPES[c.type || 'standard'];
  const disabled = state.commissionAccepted >= commissionSeasonLimit() || state.activeCommissions.length >= commissionConcurrentLimit();
  return `<article class="commission-card difficulty-${c.difficulty}">
    <div class="commission-card-top"><span class="commission-arch">${a.emoji}</span><span class="commission-difficulty">${d.icon} ${d.name}</span></div>
    <span class="commission-type-chip">${type.icon} ${type.name}</span>
    <h3>${a.name}体系征集</h3>
    <p>提交 <b>${c.size}</b> 张牌 · 目标 <b>${c.target}</b> 分</p>
    <small class="commission-type-desc">${type.desc}</small>
    <div class="commission-reward">💰 返还总价值 95% <span>+</span> 固定 ¥${commissionFixedReward(c)}</div>
    <div class="commission-card-actions">
      <button class="btn btn-dim" onclick="toggleCommissionLock('${c.uid}')">${c.locked ? '🔓 取消锁定' : '🔒 锁定'}</button>
      <button class="btn btn-primary" onclick="acceptCommission('${c.uid}')" ${disabled ? 'disabled' : ''}>接取</button>
    </div>
  </article>`;
}

function commissionInventoryHTML(c) {
  const rows = Object.keys(state.collection).map(k => {
    const { id, s } = parseKey(k);
    return { k, s, t: cardPool[id], count: state.collection[k], selected: c.deck[k] || 0 };
  }).filter(x => x.t).sort((a, b) => {
    const priority = x => x.t.tier === 'generic' ? 1 : x.t.archetype === c.archetype ? (x.t.tier === 'core' ? 3 : 2) : 0;
    return priority(b) - priority(a) || a.t.cost - b.t.cost || cardValue(b.t, b.s) - cardValue(a.t, a.s);
  });
  if (!rows.length) return '<div class="empty">收藏中还没有可用于配牌的卡</div>';
  return `<div class="commission-inventory" data-commission-uid="${c.uid}">${rows.map(x => {
    const role = x.t.tier === 'core'
      ? (x.t.coreRank === 'entry' ? '入门核心' : x.t.coreRank === 'advanced' ? '进阶核心' : '王牌核心')
      : x.t.tier === 'generic' ? '泛用' : '组件';
    const match = x.t.tier === 'generic' ? 'generic' : x.t.archetype === c.archetype ? 'match' : 'off';
    const art = artFor(x.t);
    const allowed = commissionCardAllowed(c, x.t, x.s);
    return `<div class="commission-inventory-row ${match}${allowed ? '' : ' commission-illegal'}">
      <button class="commission-mini-art" onclick="openCardDetail(${x.t.id}, ${x.s})" title="放大查看">${art ? `<img src="${art}" alt="">` : ARCHETYPES[x.t.archetype].emoji}</button>
      <div class="commission-inventory-info"><b>${x.t.name}</b><small>${ARCHETYPES[x.t.archetype].name} · ${role} · ${x.t.cost}费 · S${x.s} · 持有 ${x.count}${allowed ? '' : ' · 🚫 已退环境'}</small></div>
      <div class="commission-stepper">
        <button onclick="changeCommissionCard('${c.uid}','${x.k}',-1)" ${x.selected <= 0 ? 'disabled' : ''}>−</button>
        <b>${x.selected}</b>
        <button onclick="changeCommissionCard('${c.uid}','${x.k}',1)" ${!allowed || x.selected >= x.count || commissionDeckCount(c) >= c.size ? 'disabled' : ''}>＋</button>
      </div>
    </div>`;
  }).join('')}</div>`;
}

function activeCommissionHTML(c) {
  const a = ARCHETYPES[c.archetype];
  const d = COMMISSION_DIFFICULTIES[c.difficulty];
  const type = COMMISSION_TYPES[c.type || 'standard'];
  const s = scoreCommission(c);
  const ready = s.n === c.size && s.total >= c.target && !s.illegal;
  const pay = Math.round(s.value * 0.95) + commissionFixedReward(c);
  const submitText = s.illegal ? '请移除退环境卡' : s.n < c.size ? `还差 ${c.size - s.n} 张` : ready ? '提交委托' : `还差 ${(c.target - s.total).toFixed(1)} 分`;
  const themeDetail = `核心 ${s.cores} · 组件 ${s.parts} · 泛用 ${s.generics}${s.offTarget ? ` · 跑题 ${s.offTarget}` : ''}`;
  const buildDetail = `覆盖 ${s.kinds}/${s.wantedKinds} 类效果 ${s.coverage.toFixed(0)} · 起手 ${s.minCostScore} · 曲线 ${s.curve.toFixed(0)}`;
  return `<article class="active-commission difficulty-${c.difficulty}">
    <div class="active-commission-head">
      <div><span class="commission-difficulty">${d.icon} ${d.name} · ${type.icon} ${type.name}</span><h3>${a.emoji} ${a.name}体系征集</h3><small>${type.desc} · 已选 ${s.n}/${c.size} 张</small></div>
      <div class="commission-total ${ready ? 'ready' : ''}"><small>综合评分</small><b>${s.total.toFixed(1)}</b><span>/ ${c.target}</span></div>
    </div>
    <div class="commission-workspace">
      <div class="commission-score-panel">
        ${scoreBarHTML('体系分', s.theme, Math.round(s.weights.theme * 100), themeDetail)}
        ${scoreBarHTML('构筑分', s.construction, Math.round(s.weights.construction * 100), buildDetail)}
        ${scoreBarHTML('强度分', s.strength, Math.round(s.weights.strength * 100), '所选卡牌当前强度百分位均值')}
        ${s.bonusLabel ? `<div class="commission-special-bonus"><span>${type.icon} ${s.bonusLabel}</span><b>+${s.bonus.toFixed(1)}</b></div>` : ''}
        ${s.illegal ? `<div class="commission-illegal-warning">🚫 含 ${s.illegal} 张退环境卡，竞技挑战无法提交</div>` : ''}
        <div class="commission-payout"><span>当前预计结算</span><b>¥${pay}</b><small>卡牌 ¥${s.value} × 95% + 固定 ¥${commissionFixedReward(c)}</small></div>
        <div class="commission-rep-preview"><span>超额声望</span><b>+${s.rep}</b><small>仅超出目标的分数计入，本委托最多 ${d.repCap}</small></div>
        <button class="btn btn-primary commission-submit" onclick="submitCommission('${c.uid}')" ${ready ? '' : 'disabled'}>${submitText}</button>
        <button class="btn commission-abandon" onclick="abandonCommission('${c.uid}')">放弃委托</button>
      </div>
      ${commissionInventoryHTML(c)}
    </div>
  </article>`;
}

function renderCommissions() {
  const board = $('commissionBoard');
  if (!board) return;
  const inventoryScroll = {};
  document.querySelectorAll('.commission-inventory[data-commission-uid]').forEach(el => {
    inventoryScroll[el.dataset.commissionUid] = el.scrollTop;
  });
  const locked = state.commissions.filter(c => c.locked).length;
  $('commissionStats').innerHTML = `
    <span>本季接取 <b>${state.commissionAccepted}/${commissionSeasonLimit()}</b></span>
    <span>进行中 <b>${state.activeCommissions.length}/${commissionConcurrentLimit()}</b></span>
    <span>锁定 <b>${locked}/${commissionLockLimit()}</b></span>
    <span>声望 <b>${state.reputation}</b> <small>累计 ${state.lifetimeReputation}</small></span>`;
  board.innerHTML = state.commissions.length ? state.commissions.map(commissionCardHTML).join('') : '<div class="empty">今日已没有可接取的委托</div>';
  $('activeCommissions').innerHTML = state.activeCommissions.length
    ? state.activeCommissions.map(activeCommissionHTML).join('')
    : '<div class="empty">尚未接取委托，可以先从上方挑一份合适的目标</div>';
  document.querySelectorAll('.commission-inventory[data-commission-uid]').forEach(el => {
    el.scrollTop = inventoryScroll[el.dataset.commissionUid] || 0;
  });
  $('reputationUpgrades').innerHTML = Object.entries(REPUTATION_UPGRADES).map(([key, u]) => {
    const lv = state.reputationUpgrades[key] || 0;
    const full = lv >= u.maxLv;
    const cost = full ? 0 : u.costs[lv];
    return `<article class="rep-upgrade"><span>${u.icon}</span><div><h3>${u.name} <small>Lv.${lv}/${u.maxLv}</small></h3><p>${u.desc}</p></div><button class="btn btn-dim" onclick="buyReputationUpgrade('${key}')" ${full || state.reputation < cost ? 'disabled' : ''}>${full ? '已满级' : `${cost} 声望`}</button></article>`;
  }).join('');
}

function achievementProgressHTML(value, target) {
  const pct = clamp(value / target * 100, 0, 100);
  return `<div class="achievement-progress"><i style="width:${pct}%"></i></div>`;
}

function renderAchievements() {
  const runEl = $('runAchievements');
  if (!runEl) return;
  const runDone = RUN_CHALLENGES.filter(a => career.challenges[a.id]).length;
  const careerDone = Object.keys(career.completed).length;
  $('achievementSummary').innerHTML = `
    <span><b>${runDone}/${RUN_CHALLENGES.length}</b><small>本局挑战</small></span>
    <span><b>${careerDone}/${CAREER_MILESTONE_GROUPS.length * 3}</b><small>生涯里程碑</small></span>
    <span class="achievement-points"><b>${career.points}</b><small>成就点</small></span>`;
  runEl.innerHTML = RUN_CHALLENGES.map(a => {
    const completed = career.challenges[a.id];
    const expired = !completed && state.day > a.deadline;
    const value = Math.min(state.runStats[a.metric] || 0, a.target);
    const status = completed ? `永久完成 · 第 ${completed.day} 天` : expired ? '本局超时 · 重开可重试' : `本局剩 ${a.deadline - state.day + 1} 天`;
    return `<article class="achievement-card ${completed ? 'completed' : expired ? 'expired' : ''}">
      <span class="achievement-icon">${completed ? '✅' : a.icon}</span>
      <div class="achievement-body"><div class="achievement-name"><h3>${a.name}</h3><span>${status}</span></div><p>${a.desc}</p>
        ${achievementProgressHTML(value, a.target)}<small>${value} / ${a.target}</small></div>
      <div class="achievement-reward"><small>永久奖励</small><b>+${a.points} 成就点</b></div>
    </article>`;
  }).join('');

  $('careerAchievements').innerHTML = CAREER_MILESTONE_GROUPS.map(group => {
    const value = career.stats[group.key] || 0;
    const done = group.tiers.filter(([target]) => career.completed[`${group.key}_${target}`]).length;
    const next = group.tiers.find(([target]) => value < target);
    const progressTarget = next ? next[0] : group.tiers[group.tiers.length - 1][0];
    return `<article class="achievement-card career-achievement ${done === 3 ? 'completed' : ''}">
      <span class="achievement-icon">${done === 3 ? '🌟' : group.icon}</span>
      <div class="achievement-body"><div class="achievement-name"><h3>${group.name}</h3><span>${done}/3 阶</span></div>
        <p>生涯累计 ${value.toLocaleString()} ${group.unit}</p>${achievementProgressHTML(Math.min(value, progressTarget), progressTarget)}
        <div class="milestone-tiers">${group.tiers.map(([target, points], i) => {
          const achieved = !!career.completed[`${group.key}_${target}`];
          return `<span class="${achieved ? 'achieved' : ''}">${['Ⅰ', 'Ⅱ', 'Ⅲ'][i]} ${target.toLocaleString()} <small>+${points}</small></span>`;
        }).join('')}</div></div>
    </article>`;
  }).join('');
}

function renderAll() {
  renderThemeBtn();
  renderHeader();
  renderHome();
  renderChart();
  renderShop();
  renderCollection();
  renderMarket();
  renderMarketServices();
  renderArchBoard();
  renderBoard();
  renderOffers();
  renderCommissions();
  renderAchievements();
  renderUpgrades();
  renderRumors();
  renderLog();
  renderTrades();
  renderSettlementSetting();
  saveGame();
}

// ==================== 启动 ====================
function init() {
  loadCareer();
  const loaded = loadGame();
  if (!loaded) {
    buildPool();
    state.themes = rollThemes();
    simMeta();
    refreshMarket();
    makeOffers();
    refreshCommissions(false);
    state.rumors = makeRumors();
    state.history = [{ d: state.day, v: netWorth() }];
    addLog('欢迎来到集换大亨！开卡包、看行情、低买高卖，成为传奇卡商吧！');
    addLog('💡 卡牌价格由胜率和使用率暗中决定：强度高、版本热门的卡更值钱');
    addLog(`💡 每季 ${SEASON_LENGTH} 天：前两季版本仍在环境，每老一季估值约降 5%；第三季后退环境，仅保留 12% 收藏价值`);
    addLog('💡 每个新赛季会重投全卡费用、攻防与效果数值；卡名、稀有度、体系和效果类型保持不变');
    addLog('💡 私下交易的商人每天更换：看准偏好可以卖出溢价，也能对其主动报价尝试讲价');
  } else {
    if (!state.history.length) state.history = [{ d: state.day, v: netWorth() }];
    addLog('📂 已读取存档，欢迎回来！');
  }
  if (!state.wholesaleOffers.length) refreshWholesaleOffers();
  checkAchievements();
  renderAll();
  renderRoute();
  setupMobileNavGuide();
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('settlementModal').classList.contains('hidden')) closeSettlementModal();
    else if (!$('cardDetailModal').classList.contains('hidden')) closeCardDetail();
  });
}

if (typeof document !== 'undefined') init();
