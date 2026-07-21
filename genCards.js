// 卡牌插画批量生成脚本：按「画风-体系-核心词」组合驱动 ComfyUI API
// 用法: node genCards.js            —— 跑全部缺失的图（断点续跑）
//       node genCards.js --only moe,dragon   —— 只跑某画风/体系（可组合过滤）
'use strict';
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const API = 'http://192.168.3.250:8188';
const WORKFLOW = path.join(__dirname, 'cardIllusion_workflow.json');
const OUT_DIR = path.join(__dirname, 'assets', 'cards');
const CLIENT_ID = 'tcg-tycoon-gen';
const POLL_MS = 1500;
const TIMEOUT_MS = 180000;   // 单张超时（正常约18秒）

// 画风 → 画师串 + 风格标签（@画师 为 anima/NoobAI 约定格式）
const STYLES = {
  moe:   { artists: '@mignon, @hews',          tags: 'moe, kawaii, bright colors' },
  dark:  { artists: '@banpai_akira, @mivit',  tags: 'dark fantasy, gothic, ominous' },
  real:  { artists: '@guweiz, @ruan jia',      tags: 'realistic, painterly, cinematic lighting' },
  pixel: { artists: '@1041uuu, @waneella',     tags: 'pixel art, retro game, 16-bit' },
};

// 体系核心词 → text_b（基础主体+构图）/ text_c（单独特征）/ slug（文件名）
// m = 萌系覆写：萌系一律娘化为妹卡（1girl + 娘化主体），其余画风保持原主体
const CORE_FEATURES = {
  dragon: {
    '龙':   { b: 'dragon, full body',            c: 'scales, wings, horns, fire breath, mountain peak',
              m: { b: '1girl, solo, dragon girl, dragon horns, dragon tail, dragon wings', c: 'fire breath, mountain peak, scales dress' } },
    '龙骑': { b: 'wyvern, full body',            c: 'flying, sky, clouds, sharp talons, diving',
              m: { b: '1girl, solo, dragon rider girl, dragon wings, dragon tail', c: 'flying, sky, clouds, wind' } },
    '龙皇': { b: 'giant dragon, full body',      c: 'crown, golden horns, majestic, treasure hoard, throne room',
              m: { b: '1girl, solo, dragon girl, crown, golden horns, dragon tail', c: 'throne room, treasure hoard, majestic, haughty' } },
    '幼龙': { b: 'baby dragon, chibi',           c: 'cute, small wings, eggshell, nest, sparkling eyes',
              m: { b: '1girl, solo, chibi dragon girl, small dragon wings, dragon tail', c: 'eggshell, nest, sparkling eyes, innocent' } },
    '龙巫': { b: 'anthropomorphic dragon',       c: 'shaman staff, tribal, ritual, glowing runes, feathers',
              m: { b: '1girl, solo, dragon girl shaman, tribal outfit, dragon horns', c: 'ritual, glowing runes, feathers, staff' } },
  },
  mecha: {
    '机甲': { b: 'mecha, robot',                 c: 'glowing core, metallic armor, hangar, blue lights',
              m: { b: '1girl, solo, mecha musume, mechanical armor, headgear', c: 'hangar, glowing core, blue lights' } },
    '战机': { b: 'fighter jet, vehicle',         c: 'flying, afterburner, sky, clouds, missiles',
              m: { b: '1girl, solo, mecha musume, jet wings, thrusters', c: 'flying, sky, clouds, afterburner' } },
    '钢兵': { b: 'robot soldier, mecha',         c: 'rifle, battlefield, steel helmet, smoke',
              m: { b: '1girl, solo, mecha musume, military uniform, steel helmet, rifle', c: 'battlefield, smoke' } },
    '炮手': { b: 'artillery mecha, robot',       c: 'heavy cannon, muzzle flash, fortress, shell casings',
              m: { b: '1girl, solo, mecha musume, huge cannon, armored', c: 'muzzle flash, fortress, shell casings' } },
    '核心': { b: 'ai robot, machine',            c: 'glowing circuits, hologram, energy sphere, data streams',
              m: { b: '1girl, solo, android girl, glowing circuits, doll joints', c: 'hologram, energy sphere, data streams' } },
  },
  mage: {
    '魔导师': { b: 'mage, wizard',               c: 'staff, robe, magic circle, spellbook, arcane glow',
              m: { b: '1girl, solo, mage girl, robe, staff', c: 'magic circle, spellbook, arcane glow' } },
    '女巫':   { b: 'witch',                      c: 'witch hat, broom, potion, moonlight',
              m: { b: '1girl, solo, witch, witch hat, broom', c: 'potion, moonlight' } },
    '咒术师': { b: 'hooded sorcerer',            c: 'dark magic, cursed runes, purple flames, ritual',
              m: { b: '1girl, solo, hooded sorceress, dark robe', c: 'cursed runes, purple flames, ritual' } },
    '贤者':   { b: 'old wizard, sage',           c: 'long beard, ancient tome, library, candlelight, wisdom',
              m: { b: '1girl, solo, sage girl, glasses, long hair, ancient tome', c: 'library, candlelight, wisdom' } },
    '法灵':   { b: 'magic spirit, ghost',        c: 'crystal ball, floating, ethereal, magical aura, translucent',
              m: { b: '1girl, solo, ghost girl, translucent, floating', c: 'crystal ball, magical aura, ethereal' } },
  },
  undead: {
    '骷髅王': { b: 'skeleton king, undead',      c: 'crown, throne of bones, dark aura, green flames',
              m: { b: '1girl, solo, lich girl, crown, bone armor', c: 'throne of bones, dark aura, green flames' } },
    '尸巫':   { b: 'zombie, undead',             c: 'rotting flesh, graveyard, tombstones, fog',
              m: { b: '1girl, solo, zombie girl, stitches, pale skin', c: 'graveyard, tombstones, fog' } },
    '幽魂':   { b: 'ghost, spirit',              c: 'translucent, floating, haunted mansion, eerie glow',
              m: { b: '1girl, solo, ghost girl, translucent, floating', c: 'haunted mansion, eerie glow, hitodama' } },
    '吸血鬼': { b: 'vampire',                    c: 'fangs, cape, wine glass, castle, bats, moonlight',
              m: { b: '1girl, solo, vampire girl, fangs, cape', c: 'wine glass, castle, bats, moonlight' } },
    '亡灵骑士': { b: 'undead knight, skeleton',  c: 'black armor, sword, cursed banner, glowing eyes',
              m: { b: '1girl, solo, undead knight girl, black armor, sword', c: 'cursed banner, glowing eyes' } },
  },
  fairy: {
    '妖精': { b: 'fairy',                        c: 'butterfly wings, flower, magic dust, forest glade',
              m: { b: '1girl, solo, fairy, butterfly wings', c: 'flower, magic dust, forest glade' } },
    '精灵': { b: 'elf',                          c: 'pointed ears, bow, forest, elegant, long hair',
              m: { b: '1girl, solo, elf, pointed ears, bow', c: 'forest, elegant, long hair' } },
    '花仙': { b: 'flower fairy',                 c: 'petals, blooming flowers, garden, spring, pollen',
              m: { b: '1girl, solo, flower fairy, flower dress', c: 'petals, blooming flowers, garden, spring' } },
    '森灵': { b: 'forest spirit, dryad',         c: 'tree face, moss, ancient forest, nature magic, vines',
              m: { b: '1girl, solo, dryad, leaf hair, plant girl', c: 'ancient forest, nature magic, vines, moss' } },
    '月兔': { b: 'rabbit girl, bunny ears',      c: 'full moon, night sky, mochi, glowing moonlight, silver hair',
              m: { b: '1girl, solo, rabbit girl, bunny ears, silver hair', c: 'full moon, night sky, mochi, glowing moonlight' } },
  },
  warrior: {
    '剑士': { b: 'swordsman, warrior',           c: 'crossed swords, dojo, training, headband',
              m: { b: '1girl, solo, swordswoman, katana, headband', c: 'dojo, training, crossed swords' } },
    '剑圣': { b: 'sword master, samurai',        c: 'katana, cherry blossoms, duel, aura, iaido',
              m: { b: '1girl, solo, female samurai, katana, iaido', c: 'cherry blossoms, duel, aura' } },
    '骑士': { b: 'knight',                       c: 'plate armor, shield, castle, banner',
              m: { b: '1girl, solo, female knight, plate armor, shield', c: 'castle, banner' } },
    '狂战士': { b: 'berserker, warrior',         c: 'battle axe, rage, muscular, battlefield, war paint',
              m: { b: '1girl, solo, berserker girl, battle axe, war paint', c: 'battlefield, rage, wild hair' } },
    '剑姬': { b: 'swordswoman, female warrior',  c: 'rapier, elegant, rose, duel, noble dress',
              m: { b: '1girl, solo, swordswoman, rapier, noble dress', c: 'elegant, rose, duel' } },
  },
  beast: {
    '兽王': { b: 'lion, beast',                  c: 'mane, crown, savanna, king of beasts, roar',
              m: { b: '1girl, solo, lion girl, lion ears, lion tail, crown', c: 'savanna, roar, wild mane hair' } },
    '巨狼': { b: 'giant wolf, wolf',             c: 'full moon, forest, howling, glowing eyes',
              m: { b: '1girl, solo, wolf girl, wolf ears, wolf tail', c: 'full moon, forest, howling' } },
    '战熊': { b: 'armored bear, bear',           c: 'armor plates, mountains, claws, fierce, snow',
              m: { b: '1girl, solo, bear girl, bear ears, armored', c: 'mountains, snow, claws' } },
    '猛虎': { b: 'tiger',                        c: 'stripes, jungle, pounce, fangs, bamboo',
              m: { b: '1girl, solo, tiger girl, tiger ears, tiger tail', c: 'jungle, bamboo, stripes, fangs' } },
    '猎鹰': { b: 'falcon, bird',                 c: 'diving, sky, sharp eyes, talons, wind',
              m: { b: '1girl, solo, harpy, feathered wings, bird girl', c: 'sky, diving, wind, sharp eyes' } },
  },
  blood: {
    '亲王': { b: 'vampire noble',                c: 'crown, elegant suit, blood wine, gothic castle, red carpet',
              m: { b: '1girl, solo, vampire princess, crown, elegant gothic dress', c: 'blood wine, gothic castle, red carpet' } },
    '血仆': { b: 'vampire servant',              c: 'blood drops, gothic maid outfit, red eyes, candlelight',
              m: { b: '1girl, solo, vampire maid, gothic maid outfit, red eyes', c: 'blood drops, candlelight' } },
    '血法师': { b: 'blood mage, sorcerer',       c: 'blood magic, red runes, ritual circle, crimson aura',
              m: { b: '1girl, solo, blood mage girl, red robe', c: 'blood magic, red runes, ritual circle' } },
    '夜行者': { b: 'giant bat, vampire bat',     c: 'night, full moon, flying, belfry',
              m: { b: '1girl, solo, bat girl, bat wings, bat ears', c: 'night, full moon, belfry' } },
    '血骑士': { b: 'blood knight, vampire knight', c: 'crimson armor, lance, red cape, night',
              m: { b: '1girl, solo, female blood knight, crimson armor, lance', c: 'red cape, night' } },
  },
  demon: {
    '魔王': { b: 'demon lord',                   c: 'horns, dark throne, evil aura, hellfire, black wings',
              m: { b: '1girl, solo, demon lord girl, horns, black wings', c: 'dark throne, evil aura, hellfire' } },
    '炎魔': { b: 'fire demon, ifrit',            c: 'flames, lava, burning, magma, embers',
              m: { b: '1girl, solo, fire demon girl, flaming hair, horns', c: 'lava, magma, embers, burning' } },
    '魅魔': { b: 'succubus, demon girl',         c: 'bat wings, horns, tail, alluring, heart pupils',
              m: { b: '1girl, solo, succubus, bat wings, horns, tail', c: 'alluring, heart pupils, smirk' } },
    '小恶魔': { b: 'imp, little demon',          c: 'small, mischievous, pitchfork, flying, grin',
              m: { b: '1girl, solo, chibi imp girl, small horns, pitchfork', c: 'mischievous, grin, flying' } },
    '地狱犬': { b: 'hellhound, demon dog',       c: 'fire, chains, dark, glowing eyes, sharp fangs',
              m: { b: '1girl, solo, hellhound girl, dog ears, fangs, chains', c: 'fire, dark, glowing eyes' } },
  },
  angel: {
    '炽天使': { b: 'seraph, angel',              c: 'six wings, holy light, sacred flames, divine',
              m: { b: '1girl, solo, seraph girl, six wings, halo', c: 'holy light, sacred flames, divine' } },
    '智天使': { b: 'cherub, angel',              c: 'halo, floating, divine light, many eyes, wisdom',
              m: { b: '1girl, solo, cherub girl, halo, angel wings', c: 'divine light, floating, wisdom' } },
    '座天使': { b: 'throne angel, angel',        c: 'celestial rings, wheels, divine geometry, heavenly',
              m: { b: '1girl, solo, angel girl, celestial rings, halo', c: 'divine geometry, heavenly, floating' } },
    '天使长': { b: 'archangel, angel',           c: 'winged sword, armor, divine judgment, light rays',
              m: { b: '1girl, solo, archangel girl, winged sword, armor', c: 'divine judgment, light rays' } },
    '圣灵':   { b: 'white dove, holy spirit',    c: 'white feathers, light rays, peace, heaven, olive branch',
              m: { b: '1girl, solo, angel girl, dove wings, white dress', c: 'white feathers, light rays, peace, heaven' } },
  },
};

// 核心词 → 文件名 slug（与游戏端共用此映射）
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

// ==================== 任务清单 ====================
function buildTasks(filter) {
  // 过滤词自动拆成画风/体系两类，各自为空则不限制该维度
  const styleF = filter ? new Set([...filter].filter(f => STYLES[f])) : null;
  const archF = filter ? new Set([...filter].filter(f => !STYLES[f])) : null;
  const tasks = [];
  for (const [style, s] of Object.entries(STYLES)) {
    if (styleF && styleF.size && !styleF.has(style)) continue;
    for (const [arch, cores] of Object.entries(CORE_FEATURES)) {
      if (archF && archF.size && ![...archF].some(f => arch.startsWith(f))) continue;
      for (const [core, f] of Object.entries(cores)) {
        const subj = style === 'moe' && f.m ? f.m : f;
        const bSolo = subj.b.includes('solo') ? subj.b : `${subj.b}, solo`;
        const slug = CORE_SLUGS[core];
        tasks.push({
          style, arch, core, slug,
          file: path.join(OUT_DIR, `${style}_${arch}_${slug}.png`),
          text_a: `masterpiece, best quality, (safe:2), \n${s.artists}, ${s.tags}, `,
          text_b: `${bSolo}, `,
          text_c: `(detailed background:1.2), ${subj.c}`,
        });
      }
    }
  }
  return tasks;
}

// ==================== ComfyUI API ====================
async function api(method, url, body) {
  const res = await fetch(API + url, body ? {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  } : { method });
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}`);
  return res;
}

async function runTask(wfTemplate, task) {
  const wf = JSON.parse(JSON.stringify(wfTemplate));
  wf['100'].inputs.text_a = task.text_a;
  wf['100'].inputs.text_b = task.text_b;
  wf['100'].inputs.text_c = `${task.text_c}, clean standalone illustration, single scene, borderless composition`;
  wf['19'].inputs.seed = Math.floor(Math.random() * 1e15);
  wf['110'].inputs.filename_prefix = `TCGTycoon/${task.style}_${task.arch}_${task.slug}`;
  // 追加负面词：海报元素（文字/标题/边框/海报构图/杂志扫图）与多主体
  wf['12'].inputs.text += ', (text:2), (typography:2), (letters:2), (logo:2), (watermark:2), (signature:2), (artist name:2), (title:2), (caption:2), (poster:1.7), (border:1.7), (framed:1.7), (card frame:1.7), (card layout:1.7), (UI:1.7), (infographic:1.7), (diagram:1.7), (character sheet:1.7), (reference sheet:1.7), (split panel:1.7), letterbox, movie poster, key visual, (speech bubble:1.7), (comic:1.7), (magazine:1.7), (cover:1.7), (page:1.7), scan artifacts, multiple characters, group, crowd, extra eyes';
  const res = await api('POST', '/prompt', { prompt: wf, client_id: CLIENT_ID });
  const { prompt_id, node_errors: errs } = await res.json();
  if (errs && Object.keys(errs).length) throw new Error('node_errors: ' + JSON.stringify(errs));
  const deadline = Date.now() + TIMEOUT_MS;
  for (;;) {
    await new Promise(r => setTimeout(r, POLL_MS));
    const h = await (await api('GET', `/history/${prompt_id}`)).json();
    const rec = h[prompt_id];
    if (rec && rec.outputs && Object.keys(rec.outputs).length) {
      const imgs = (rec.outputs['110'] && rec.outputs['110'].images) || [];
      if (!imgs.length) throw new Error('no image in outputs');
      const { filename, subfolder, type } = imgs[0];
      const img = await api('GET', `/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=${encodeURIComponent(type)}`);
      fs.writeFileSync(task.file, Buffer.from(await img.arrayBuffer()));
      return;
    }
    if (rec && rec.status && rec.status.status_str === 'error') throw new Error('execution error');
    if (Date.now() > deadline) throw new Error('timeout');
  }
}

// ==================== 主流程 ====================
(async () => {
  const args = process.argv.slice(2);
  const fi = args.indexOf('--only');
  const filter = fi >= 0 ? new Set(args[fi + 1].split(',')) : null;
  const wfTemplate = JSON.parse(fs.readFileSync(WORKFLOW, 'utf8'));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const tasks = buildTasks(filter).filter(t => !fs.existsSync(t.file));
  console.log(`共 ${tasks.length} 张待生成（已存在的自动跳过）`);
  if (!tasks.length) return;

  const t0 = Date.now();
  const failed = [];
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const name = `${t.style}_${t.arch}_${t.slug}`;
    try {
      await runTask(wfTemplate, t);
      const el = ((Date.now() - t0) / 1000).toFixed(0);
      const eta = Math.round((Date.now() - t0) / (i + 1) * (tasks.length - i - 1) / 1000);
      console.log(`[${i + 1}/${tasks.length}] ${name}.png 完成（已用 ${el}s，预计剩余 ${eta}s）`);
    } catch (e) {
      console.log(`[${i + 1}/${tasks.length}] ${name} 失败: ${e.message}`);
      failed.push(t);
    }
  }
  // 失败重试一轮
  for (const t of failed) {
    const name = `${t.style}_${t.arch}_${t.slug}`;
    try {
      await runTask(wfTemplate, t);
      console.log(`[重试] ${name}.png 完成`);
    } catch (e) {
      console.log(`[重试] ${name} 仍失败: ${e.message}`);
    }
  }
  const done = buildTasks(filter).filter(t => fs.existsSync(t.file)).length;
  console.log(`\n全部结束：${done} 张就位，耗时 ${((Date.now() - t0) / 60000).toFixed(1)} 分钟`);
})().catch(e => { console.error('脚本中止: ' + e.message); process.exit(1); });
