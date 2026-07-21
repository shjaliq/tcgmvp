'use strict';

// ==================== 卡牌静态配置（数据与文本，无游戏逻辑） ====================

const ARCHETYPES = {
  dragon:  { name: '龙族',   emoji: '🐉' },
  mecha:   { name: '机甲',   emoji: '🤖' },
  mage:    { name: '魔法使', emoji: '🔮' },
  undead:  { name: '不死',   emoji: '💀' },
  fairy:   { name: '妖精',   emoji: '🧚' },
  warrior: { name: '剑士',   emoji: '⚔️' },
  beast:   { name: '兽族',   emoji: '🐺' },
  blood:   { name: '血族',   emoji: '🧛' },
  demon:   { name: '恶魔',   emoji: '😈' },
  angel:   { name: '天使',   emoji: '😇' },
};

const ARTSTYLES = {
  moe:   { name: '萌系', emoji: '🌸' },
  dark:  { name: '暗黑', emoji: '🌑' },
  real:  { name: '写实', emoji: '🖼️' },
  pixel: { name: '像素', emoji: '👾' },
};

const PREFIX = ['苍蓝', '烈焰', '暗影', '圣光', '疾风', '雷霆', '冰霜', '绯红',
  '黄金', '混沌', '幽冥', '星辰', '深渊', '曙光', '风暴', '翠绿'];
const CORES = {
  dragon:  ['龙', '龙骑', '龙皇', '幼龙', '龙巫'],
  mecha:   ['机甲', '战机', '钢兵', '炮手', '核心'],
  mage:    ['魔导师', '女巫', '咒术师', '贤者', '法灵'],
  undead:  ['骷髅王', '尸巫', '幽魂', '吸血鬼', '亡灵骑士'],
  fairy:   ['妖精', '精灵', '花仙', '森灵', '月兔'],
  warrior: ['剑士', '剑圣', '骑士', '狂战士', '剑姬'],
  beast:   ['兽王', '巨狼', '战熊', '猛虎', '猎鹰'],
  blood:   ['亲王', '血仆', '血法师', '夜行者', '血骑士'],
  demon:   ['魔王', '炎魔', '魅魔', '小恶魔', '地狱犬'],
  angel:   ['炽天使', '智天使', '座天使', '天使长', '圣灵'],
};

// 核心词 → 插画文件名 slug（插画由 genCards.js 生成，路径 assets/cards/{画风}_{体系}_{slug}.png）
const CORE_SLUGS = {
  '龙': 'dragon', '龙骑': 'wyvern', '龙皇': 'dragonlord', '幼龙': 'whelp', '龙巫': 'dragonsage',
  '机甲': 'mecha', '战机': 'jet', '钢兵': 'soldier', '炮手': 'gunner', '核心': 'core',
  '魔导师': 'mage', '女巫': 'witch', '咒术师': 'warlock', '贤者': 'sage', '法灵': 'spirit',
  '骷髅王': 'skullking', '尸巫': 'zombie', '幽魂': 'ghost', '吸血鬼': 'vampire', '亡灵骑士': 'deathknight',
  '妖精': 'fairy', '精灵': 'elf', '花仙': 'flower', '森灵': 'dryad', '月兔': 'moonrabbit',
  '剑士': 'swordsman', '剑圣': 'swordmaster', '骑士': 'knight', '狂战士': 'berserker', '剑姬': 'swordmaiden',
  '兽王': 'lion', '巨狼': 'wolf', '战熊': 'bear', '猛虎': 'tiger', '猎鹰': 'falcon',
  '亲王': 'prince', '血仆': 'servant', '血法师': 'bloodmage', '夜行者': 'bat', '血骑士': 'bloodknight',
  '魔王': 'demonlord', '炎魔': 'ifrit', '魅魔': 'succubus', '小恶魔': 'imp', '地狱犬': 'hellhound',
  '炽天使': 'seraph', '智天使': 'cherub', '座天使': 'throne', '天使长': 'archangel', '圣灵': 'dove',
};
// 长词优先匹配（例如“幼龙”先于“龙”）。
const CORE_NAME_KEYS = Object.keys(CORE_SLUGS).sort((a, b) => b.length - a.length);
// 卡面插画：按 (画风, 体系, 卡名核心词) 定位，找不到返回 null（调用方回退 emoji）
function artFor(t) {
  for (const core of CORE_NAME_KEYS) {
    if (t.name.endsWith(core)) {
      const slug = CORE_SLUGS[core];
      return slug ? `assets/cards/${t.artStyle}_${t.archetype}_${slug}.png` : null;
    }
  }
  return null;
}

// 战斗数值：每赛季在以下边界内重投。效率决定基础身材预算，三角分布让极端值较少出现。
const COST_RANGE = { N: [1, 4], R: [2, 5], SR: [4, 7], UR: [6, 10] };
const EFFICIENCY_RANGE = { N: [0.84, 0.96], R: [0.94, 1.06], SR: [1.04, 1.16], UR: [1.18, 1.32] };
// 核心分为 R 入门核心、SR 进阶核心和 UR 王牌核心；低罕核心费用更低、绝招数值更保守。
const CORE_COST_RANGES = { R: [3, 5], SR: [5, 7], UR: [7, 9] };
const ATTACK_SHARE_RANGE = [0.35, 0.65];
const EFFECT_COUNT_ROLL = {
  N:  { min: 0, oneChance: 0.55, twoChance: 0 },
  R:  { min: 1, twoChance: 0.2 },
  SR: { min: 1, twoChance: 0.6 },
  UR: { min: 1, twoChance: 0.85 },
};
const EFFECT_VALUE_RANGE = {
  '抽牌': [1, 2], '直伤': [1, 4], '治疗': [1, 5],
  '增益': [1, 3], '护盾': [1, 5], '减益': [1, 3],
};
const RARITY_EFFECT_CAP = { N: 1, R: 2, SR: 3, UR: 4 };
const EFFECTS = { '抽牌': 2.5, '直伤': 1.2, '治疗': 0.8, '增益': 1.5, '护盾': 1.0, '减益': 1.3 };

// 隐性分层：体系核心(core) / 体系组件(part) / 泛用强卡(generic) —— 不向玩家展示，靠效果文本暗示
const PARTS_PER_ARCH = 11;
const GENERICS_PER_ARCH = 2;
const CORE_WORD = {
  dragon: '龙皇', mecha: '核心', mage: '贤者', undead: '骷髅王', fairy: '森灵',
  warrior: '剑圣', beast: '兽王', blood: '亲王', demon: '魔王', angel: '炽天使',
};
// 每个体系核心的绝招（独有效果，str 为强度系数）
const CORE_ULTS = {
  dragon:  { text: '场上每有一只其他龙族，造成{v}点伤害', vMin: 1, vMax: 2, str: 2.0 },
  mecha:   { text: '召唤{v}个1/1机甲衍生物', vMin: 1, vMax: 3, str: 2.0 },
  mage:    { text: '本回合每打出过一张魔法使牌，抽1张牌，至多{v}张', vMin: 2, vMax: 4, str: 2.5 },
  undead:  { text: '触发弃牌堆中所有不死族的效果，最多{v}张', vMin: 2, vMax: 4, str: 3.0 },
  fairy:   { text: '本回合每打出过一张妖精牌，恢复{v}点生命', vMin: 1, vMax: 2, str: 1.2 },
  warrior: { text: '本回合每打出过一张剑士牌，自身获得+{v}攻击', vMin: 1, vMax: 2, str: 1.5 },
  beast:   { text: '场上每有一只其他兽族，自身获得+{v}攻击', vMin: 2, vMax: 3, str: 1.5 },
  blood:   { text: '造成{v}点伤害，并恢复等量生命', vMin: 2, vMax: 4, str: 1.8 },
  demon:   { text: '对双方全体造成{v}点伤害', vMin: 2, vMax: 3, str: 2.2 },
  angel:   { text: '恢复{v}点生命，己方全体获得{v}点护盾', vMin: 2, vMax: 3, str: 2.0 },
};
// 泛用强卡：无同体系前置条件的直白效果
const FX_GENERIC = {
  '抽牌': '抽{v}张牌',
  '直伤': '造成{v}点伤害',
  '治疗': '恢复{v}点生命',
  '增益': '己方全体+{v}攻击',
  '护盾': '获得{v}点护盾',
  '减益': '敌方全体-{v}攻击',
};
// 分层权重：核心对体系强度贡献大、自身强度指数受体系影响大；泛用相反
const TIER_ARCH_CONTRIB = { core: 2.5, part: 1, generic: 0.3 };
const TIER_SELF_W = { core: 0.6, part: 1, generic: 1.3 };
const TIER_ARCH_W = { core: 1.8, part: 1, generic: 0.25 };

// 效果描述矩阵：效果 × 体系 → 卡牌文本（{v}=效果数值）
// 统一为「同体系条件 + 效果」结构，条件在四类间轮换：场上/手牌/本回合打出/弃牌堆
const FX_TEXT = {
  '抽牌': {
    dragon:  '场上有其他龙族牌时，抽{v}张牌',
    mecha:   '本回合打出过机甲牌时，抽{v}张牌',
    mage:    '手牌中有魔法使牌时，抽{v}张牌',
    undead:  '弃牌堆中有不死族牌时，抽{v}张牌',
    fairy:   '场上有其他妖精牌时，抽{v}张牌',
    warrior: '弃牌堆中有剑士牌时，抽{v}张牌',
    beast:   '场上有其他兽族牌时，抽{v}张牌',
    blood:   '手牌中有血族牌时，抽{v}张牌',
    demon:   '弃牌堆中有恶魔牌时，抽{v}张牌',
    angel:   '本回合打出过天使牌时，抽{v}张牌',
  },
  '直伤': {
    dragon:  '本回合打出过龙族牌时，造成{v}点伤害',
    mecha:   '场上有其他机甲牌时，造成{v}点伤害',
    mage:    '弃牌堆中有魔法使牌时，造成{v}点伤害',
    undead:  '场上有其他不死族牌时，造成{v}点伤害',
    fairy:   '手牌中有妖精牌时，造成{v}点伤害',
    warrior: '本回合打出过剑士牌时，造成{v}点伤害',
    beast:   '本回合打出过兽族牌时，造成{v}点伤害',
    blood:   '弃牌堆中有血族牌时，造成{v}点伤害',
    demon:   '场上有其他恶魔牌时，造成{v}点伤害',
    angel:   '手牌中有天使牌时，造成{v}点伤害',
  },
  '治疗': {
    dragon:  '弃牌堆中有龙族牌时，恢复{v}点生命',
    mecha:   '场上有其他机甲牌时，恢复{v}点生命',
    mage:    '手牌中有魔法使牌时，恢复{v}点生命',
    undead:  '弃牌堆中有不死族牌时，恢复{v}点生命',
    fairy:   '场上有其他妖精牌时，恢复{v}点生命',
    warrior: '本回合打出过剑士牌时，恢复{v}点生命',
    beast:   '弃牌堆中有兽族牌时，恢复{v}点生命',
    blood:   '场上有其他血族牌时，恢复{v}点生命',
    demon:   '手牌中有恶魔牌时，恢复{v}点生命',
    angel:   '场上有其他天使牌时，恢复{v}点生命',
  },
  '增益': {
    dragon:  '场上有其他龙族牌时，己方全体+{v}攻击',
    mecha:   '场上有其他机甲牌时，己方全体+{v}攻击',
    mage:    '本回合打出过魔法使牌时，己方全体+{v}攻击',
    undead:  '弃牌堆中有不死族牌时，己方全体+{v}攻击',
    fairy:   '手牌中有妖精牌时，己方全体+{v}攻击',
    warrior: '本回合打出过剑士牌时，己方全体+{v}攻击',
    beast:   '场上有其他兽族牌时，己方全体+{v}攻击',
    blood:   '本回合打出过血族牌时，己方全体+{v}攻击',
    demon:   '弃牌堆中有恶魔牌时，己方全体+{v}攻击',
    angel:   '手牌中有天使牌时，己方全体+{v}攻击',
  },
  '护盾': {
    dragon:  '手牌中有龙族牌时，获得{v}点护盾',
    mecha:   '弃牌堆中有机甲牌时，获得{v}点护盾',
    mage:    '本回合打出过魔法使牌时，获得{v}点护盾',
    undead:  '弃牌堆中有不死族牌时，获得{v}点护盾',
    fairy:   '场上有其他妖精牌时，获得{v}点护盾',
    warrior: '场上有其他剑士牌时，获得{v}点护盾',
    beast:   '场上有其他兽族牌时，获得{v}点护盾',
    blood:   '手牌中有血族牌时，获得{v}点护盾',
    demon:   '本回合打出过恶魔牌时，获得{v}点护盾',
    angel:   '弃牌堆中有天使牌时，获得{v}点护盾',
  },
  '减益': {
    dragon:  '场上有其他龙族牌时，敌方全体-{v}攻击',
    mecha:   '本回合打出过机甲牌时，敌方全体-{v}攻击',
    mage:    '手牌中有魔法使牌时，敌方全体-{v}攻击',
    undead:  '弃牌堆中有不死族牌时，敌方全体-{v}攻击',
    fairy:   '本回合打出过妖精牌时，敌方全体-{v}攻击',
    warrior: '弃牌堆中有剑士牌时，敌方全体-{v}攻击',
    beast:   '本回合打出过兽族牌时，敌方全体-{v}攻击',
    blood:   '弃牌堆中有血族牌时，敌方全体-{v}攻击',
    demon:   '场上有其他恶魔牌时，敌方全体-{v}攻击',
    angel:   '手牌中有天使牌时，敌方全体-{v}攻击',
  },
};

// 展开一张卡某条效果的描述文本：核心用绝招文本、泛用无条件、组件用同体系条件
function fxText(t, e) {
  if (t.tier === 'core') return CORE_ULTS[t.archetype].text.replace('{v}', e.v);
  if (t.tier === 'generic') return (FX_GENERIC[e.k] || `${e.k} {v}`).replace('{v}', e.v);
  const tpl = FX_TEXT[e.k] && FX_TEXT[e.k][t.archetype];
  return tpl ? tpl.replace('{v}', e.v) : `${e.k} ${e.v}`;
}
