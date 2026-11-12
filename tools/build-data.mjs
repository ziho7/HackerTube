#!/usr/bin/env node
// Turns the HackerTube dataset into the JS bundles the static frontend loads.
// Output is a data contract, not a dump: rename/translate your own pipeline's
// fields to match `videos[]` / `details{}` below and the UI works unchanged.
//
//   node tools/build-data.mjs [--src data/hackertube-data] [--out site/data]
//
// Optional `youtube_meta.jsonl` in the source dir (format in DATA.md) supplies
// duration / views / publish date. Without it those are null and the UI falls
// back to HN-only metadata instead of inventing numbers.

import { mkdirSync, readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? dflt : resolve(argv[i + 1]);
};
const ROOT = resolve(import.meta.dirname, "..");
const SRC = arg("src", join(ROOT, "data/hackertube-data"));
const OUT = arg("out", join(ROOT, "site/data"));

const AREA_ZH = {
  software: "软件工程与编程语言",
  "systems-security": "系统、网络与安全",
  "ai-data": "人工智能、机器学习与数据",
  "math-theory": "数学与理论计算机",
  hardware: "硬件与电子",
  "computing-history-culture": "计算机历史与文化",
  "design-graphics-media": "设计、图形与视觉媒体",
  "business-economics": "商业、创业与经济",
  "politics-history-society": "政治、历史与社会",
  "physics-space": "物理、太空与化学",
  "life-sciences-health": "生命科学、心智与健康",
  "earth-energy-environment": "地球、能源与环境",
  "engineering-making": "工程、交通与制造",
  games: "游戏与游戏开发",
  "arts-entertainment": "艺术、喜剧、音乐与影视",
  "ideas-education": "思想、学习与语言",
};

const CAT_ZH = {
  "programming-language-design": "编程语言设计",
  "functional-programming": "函数式编程",
  "systems-programming-languages": "C / C++ / Rust / Go 等系统语言",
  "scripting-languages": "Python、Ruby 与脚本语言",
  "web-development": "Web 开发",
  "software-architecture-design": "软件架构与设计",
  "software-performance": "软件性能与优化",
  "compilers-interpreters": "编译器、解释器与程序分析",
  "testing-debugging-tools": "测试、调试与开发工具",
  "software-practice-careers": "工程实践、开源与职业",
  "software-other": "软件（其他）",
  "databases-storage": "数据库与存储",
  "distributed-systems": "分布式系统",
  "operating-systems": "操作系统与内核",
  "linux-open-source-os": "Linux 与开源生态",
  "networking-internet": "网络与互联网基础设施",
  "cloud-devops-sre": "云原生、DevOps 与可靠性",
  "security-hacking": "安全与黑客技术",
  cryptography: "密码学",
  "privacy-surveillance": "隐私、监控与网络犯罪",
  "systems-other": "系统与安全（其他）",
  "machine-learning": "机器学习与深度学习",
  "llms-generative-ai": "大模型与生成式 AI",
  "ai-safety-impact": "AI 安全、通用人工智能与影响",
  robotics: "机器人",
  "self-driving-cars": "自动驾驶与无人车",
  "computer-vision-speech": "计算机视觉、语音与自然语言处理",
  "data-science-statistics": "数据科学与统计",
  "data-visualization": "数据可视化与信息设计",
  "ai-data-other": "人工智能与数据（其他）",
  "algorithms-data-structures": "算法与数据结构",
  "computational-theory": "可计算性与复杂度理论",
  "quantum-computing": "量子计算",
  "pure-mathematics": "纯数学",
  "probability-game-theory": "概率与博弈论",
  "recreational-math": "趣味与可视化数学",
  "logic-formal-methods": "逻辑与形式化方法",
  "information-theory": "信息论与信号处理",
  "math-theory-other": "数学与理论（其他）",
  "computer-architecture": "计算机架构与 CPU",
  "semiconductors-manufacturing": "半导体与芯片制造",
  "electronics-circuits": "电子与电路设计",
  "embedded-diy-electronics": "嵌入式与 DIY 电子",
  "repair-teardown": "拆解、维修与维修权",
  "consumer-devices": "消费设备与硬件产品",
  "audio-video-engineering": "音视频工程",
  "hardware-other": "硬件（其他）",
  "history-of-computing": "计算机历史",
  "gui-hci-history": "图形界面与人机交互史",
  "hacker-culture-free-software": "黑客文化与自由软件",
  "demoscene-retrocomputing": "Demoscene 与复古计算",
  "internet-culture": "互联网文化与梗",
  "tech-figures-interviews": "技术先驱与访谈",
  "tech-company-stories": "科技公司故事与纪录片",
  "computing-history-other": "计算机文化（其他）",
  "ux-ui-design": "用户体验与界面设计",
  "product-industrial-design": "产品与工业设计",
  "graphic-design-typography": "平面设计与字体排印",
  "computer-graphics-rendering": "计算机图形学与渲染",
  "creative-coding-generative-art": "创意编程与生成艺术",
  "animation-vfx": "动画与视觉特效",
  "film-video-production": "影视制作",
  "vr-ar-spatial": "VR、AR 与空间计算",
  "design-graphics-other": "设计与图形（其他）",
  "startups-entrepreneurship": "创业与创业者",
  "product-growth-marketing": "产品、增长与市场",
  "management-leadership": "管理、领导力与组织",
  "tech-industry-business": "科技行业与商业模式",
  "investing-personal-finance": "投资与个人理财",
  macroeconomics: "宏观经济与金融危机",
  "microeconomics-behavioral": "微观经济与行为经济学",
  "labor-work-wealth": "劳动、工作与财富分配",
  "business-economics-other": "商业与经济（其他）",
  "us-politics": "美国政治与选举",
  "geopolitics-foreign-policy": "地缘政治与外交",
  "law-policing-justice": "法律、执法与司法",
  "free-speech-censorship": "言论自由与审查",
  "world-history": "世界历史",
  "military-warfare": "军事史与战争",
  "social-issues-culture": "社会议题与文化",
  "media-journalism": "媒体、新闻与宣传",
  "politics-history-other": "政治与历史（其他）",
  "fundamental-physics": "基础物理",
  "quantum-physics": "量子物理",
  "cosmology-astrophysics": "宇宙学与天体物理",
  "space-exploration": "太空探索与航天",
  chemistry: "化学",
  "materials-science": "材料科学",
  "everyday-physics-demos": "日常物理与科学实验",
  "physics-space-other": "物理与太空（其他）",
  "neuroscience-brain": "神经科学与大脑",
  "psychology-behavior": "心理学与人类行为",
  "mental-health-neurodiversity": "心理健康与神经多样性",
  "consciousness-mind": "意识与认知",
  "evolution-genetics": "演化与遗传",
  "biology-biotech": "生物与生物技术",
  "medicine-disease": "医学与传染病",
  "nutrition-diet": "营养与饮食科学",
  "fitness-sleep-longevity": "健身、睡眠与长寿",
  "animals-nature": "动物与自然",
  "life-sciences-other": "生命科学（其他）",
  "climate-science": "气候科学与气候变化",
  "climate-debate-policy": "气候政策、方案与争论",
  "nuclear-energy": "核电与聚变",
  "renewables-storage": "可再生能源、电池与储能",
  "power-grid-heating": "电网、供暖与建筑",
  "geology-earth-science": "地质与地球科学",
  "environment-agriculture": "环境、农业与食品体系",
  "earth-energy-other": "地球与能源（其他）",
  aviation: "航空与航天工程",
  "automotive-ev": "汽车、电动车与摩托",
  "transit-urbanism": "交通、城市与城市规划",
  "civil-engineering-construction": "土木与建筑工程",
  "mechanical-engineering": "机械与精密工程",
  "manufacturing-industry": "制造与工业流程",
  "making-woodworking-metalwork": "木工、金工与工坊技能",
  "3d-printing-cnc": "3D 打印、CNC 与创客项目",
  "home-diy-repair": "家居、DIY 与实用技能",
  "cooking-food": "烹饪与美食",
  "ships-ocean": "船舶、潜艇与海洋",
  "engineering-making-other": "工程与制造（其他）",
  "game-design": "游戏设计",
  "game-programming-engines": "游戏编程与引擎",
  "indie-game-development": "独立游戏开发",
  "game-history-retro": "游戏史与复古游戏",
  "gaming-culture": "游戏文化与分析",
  "speedrunning-glitches": "速通、故障与游戏破解",
  "chess-board-games": "棋类、桌游与谜题",
  "games-other": "游戏（其他）",
  "standup-sketch-comedy": "单口喜剧与短剧",
  "satire-parody": "讽刺与恶搞",
  "music-performance": "音乐演出与歌曲",
  "music-theory-production": "乐理、合成与制作",
  "film-tv-clips": "影视片段",
  "film-criticism-analysis": "影片分析与批评",
  "documentaries-storytelling": "纪录片与叙事",
  "literature-writing": "文学与写作",
  "visual-arts": "视觉艺术、摄影与建筑",
  "sports-athletics": "体育与竞技",
  "magic-performance-oddities": "魔术、谜题与奇人异事",
  "arts-entertainment-other": "艺术与娱乐（其他）",
  "education-learning": "教育与学习方法",
  "university-lectures": "大学公开课与课程",
  "philosophy-ethics": "哲学与伦理",
  "religion-belief": "宗教、信仰与怀疑论",
  "language-linguistics": "语言与语言学",
  "productivity-self-improvement": "效率与自我提升",
  "futurism-technology-society": "未来学与科技社会",
  "science-method-communication": "科学方法与科学传播",
  "ideas-education-other": "思想与学习（其他）",
};

const readJsonl = (file) =>
  existsSync(file)
    ? readFileSync(file, "utf8").split("\n").filter(Boolean).map(JSON.parse)
    : [];

const raw = readJsonl(join(SRC, "videos.jsonl"));
const translations = new Map(readJsonl(join(SRC, "videos.zh.jsonl")).map((v) => [v.vid, v]));
const chinese = (v, key) => translations.get(v.vid)?.[`${key}_zh`]?.trim() || v[key];
if (!raw.length) {
  console.error(`no videos.jsonl under ${SRC}`);
  process.exit(1);
}
const taxonomy = JSON.parse(readFileSync(join(SRC, "taxonomy.json"), "utf8"));
const mentionRows = readJsonl(join(SRC, "mentions.jsonl"));
const relatedRows = readJsonl(join(SRC, "related.jsonl"));
const ytRows = readJsonl(join(SRC, "youtube_meta.jsonl"));

// YouTube Data API item -> the three fields the UI cannot derive from HN.
const isoDuration = (d) => {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(d || "");
  if (!m) return null;
  return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0) || null;
};
const yt = new Map();
const unavailable = new Set(ytRows.filter((r) => r.item === null || r.item?.status?.privacyStatus === "private").map((r) => r.vid));
for (const r of ytRows) {
  const it = r.item;
  if (!it) continue;
  yt.set(r.vid, {
    seconds: isoDuration(it.contentDetails?.duration),
    views: Number(it.statistics?.viewCount) || null,
    published: it.snippet?.publishedAt?.slice(0, 10) || null,
    embeddable: it.status?.embeddable !== false && it.status?.privacyStatus !== "private",
  });
}

// The eager bundle is what every page visit costs; keep it to what cards,
// filters and search actually read. Full prose lives in the lazy shards.
const SNIPPET = 170;
const videos = raw.filter((v) => !unavailable.has(v.vid)).map((v) => {
  const meta = yt.get(v.vid);
  return {
    v: v.vid,
    t: chinese(v, "title"),
    t0: v.title,
    c: v.channel,
    y: v.content_type,
    l: v.level,
    s: v.shelf_life,
    p: v.primary_topic,
    g: v.tags || [],
    a: (v.categories || []).map((c) => [c.id, c.area]),
    h: { m: v.hn.mentions, r: v.hn.recommenders, mo: v.hn.rec_months, k: v.hn.strong_recs, st: v.hn.stances, f: v.hn.first_year, l: v.hn.last_year },
    o: v.score,
    d: meta?.seconds ?? null,
    w: meta?.views ?? null,
    u: meta?.published ?? null,
    b: meta?.embeddable ?? null,
    x: (chinese(v, "summary") || "").slice(0, SNIPPET),
  };
});

const copyByVid = new Map(raw.map((v) => [v.vid, {
  su: chinese(v, "summary"),
  wy: v.why_hn,
  q: v.quote ? { x: v.quote.text, i: v.quote.hn_comment_id, y: v.quote.year } : null,
}]));

const byVid = new Map(videos.map((v) => [v.v, v]));

const mentionsByVid = new Map();
for (const m of mentionRows) {
  if (!byVid.has(m.vid)) continue;
  const list = mentionsByVid.get(m.vid) || [];
  list.push({
    id: m.hn_comment_id,
    author: m.author,
    month: m.month,
    story: m.story_title,
    stance: m.stance,
    why: m.why,
    quote: m.quote,
    text: m.text,
  });
  mentionsByVid.set(m.vid, list);
}
for (const list of mentionsByVid.values()) {
  const rank = { strong_rec: 0, rec: 1, reference: 2, joke: 3, critical: 4 };
  list.sort((a, b) => (rank[a.stance] - rank[b.stance]) || b.month.localeCompare(a.month));
}

const relatedByVid = new Map();
for (const r of relatedRows) {
  const keep = (r.related || [])
    .filter((x) => byVid.has(x.vid) && x.vid !== r.vid)
    .slice(0, 20)
    .map((x) => [x.vid, x.shared_recommenders]);
  if (keep.length) relatedByVid.set(r.vid, keep);
}

const SHARDS = 64;
const shardOf = (vid) => {
  let h = 0;
  for (let i = 0; i < vid.length; i++) h = (h * 31 + vid.charCodeAt(i)) >>> 0;
  return h % SHARDS;
};

const catCounts = new Map();
const areaCounts = new Map();
// Mirrors the frontend default (hideNews on), so the numbers on the Categories
// page match what clicking through actually lists.
for (const v of videos.filter((x) => x.s !== "news")) {
  const seenCat = new Set();
  const seenArea = new Set();
  for (const [cat, area] of v.a) {
    if (!seenCat.has(cat)) { seenCat.add(cat); catCounts.set(cat, (catCounts.get(cat) || 0) + 1); }
    if (!seenArea.has(area)) { seenArea.add(area); areaCounts.set(area, (areaCounts.get(area) || 0) + 1); }
  }
}

const missingArea = [...new Set(videos.flatMap((v) => v.a.map((c) => c[1])))].filter((a) => !AREA_ZH[a]);
const missingCat = [...new Set(videos.flatMap((v) => v.a.map((c) => c[0])))].filter((c) => !CAT_ZH[c]);
if (missingArea.length || missingCat.length) {
  console.warn("untranslated:", { missingArea, missingCat });
}

const PLAYLISTS = [
  {
    id: "hn-canon", name: "HN 必看经典",
    desc: "多年来 HN 在无数帖子里反复指向的十个视频。数学、金钱、编程、芯片、生物，还有怎么过日子，一次看完。",
    pick: () => videos.slice(0, 10),
  },
  {
    id: "programmer-talks", name: "每个程序员都该看的演讲",
    desc: "不管你写什么语言，HN 都会把这些演讲推给你：简单、设计、手艺，以及怎么想软件这件事。",
    pick: () => sel((v) => v.a.some((c) => c[1] === "software") && ["talk", "lecture"].includes(v.y), 14),
  },
  {
    id: "from-transistor-up", name: "从晶体管开始理解计算机",
    desc: "一层一层往上讲：晶体管与逻辑门、芯片怎么造出来、CPU 与内存、操作系统，最后是编译器和语言。",
    pick: () => sel((v) => v.a.some((c) => ["hardware", "systems-security"].includes(c[1])), 12),
  },
  {
    id: "math-clicks", name: "让数学突然开窍的课",
    desc: "教科书讲不明白的东西，HN 会把这些视频贴出来。几何直觉、线性代数、微积分、概率，从最短的看起。",
    pick: () => sel((v) => v.a.some((c) => c[1] === "math-theory"), 12),
  },
  {
    id: "ai-properly", name: "把 AI 学明白",
    desc: "从神经网络第一课，到大模型、Transformer、AI 安全争论。按理解难度排，不是按热度排。",
    pick: () => sel((v) => v.a.some((c) => c[1] === "ai-data"), 12),
  },
  {
    id: "hidden-gems", name: "冷门宝藏",
    desc: "HN 反复推荐、但 YouTube 几乎没推给别人的视频。播放量不高，是它们唯一的缺点。",
    pick: () => videos.filter((v) => v.o >= 6 && v.h.r <= 6).slice(0, 12),
  },
  {
    id: "deep-dives", name: "一小时深度长视频",
    desc: "值得专门空出一小时的东西：完整课程、长篇讲座、深度纪录片。适合通勤、洗碗、散步时听。",
    pick: () => sel((v) => v.d === null || v.d >= 3000, 12),
  },
  {
    id: "how-world-works", name: "世界是怎么运转的",
    desc: "电网、气候、机械、交通、材料。看完会更清楚自己每天生活在什么样的物理系统里。",
    pick: () => sel((v) => v.a.some((c) => ["physics-space", "earth-energy-environment", "engineering-making"].includes(c[1])), 12),
  },
];
function sel(pred, n) {
  return videos.filter(pred).slice(0, n);
}

const playlists = PLAYLISTS.map((p) => {
  const list = p.pick().filter((v) => v.s !== "news");
  return {
    id: p.id,
    name: p.name,
    desc: p.desc,
    videos: list.map((v) => ({ vid: v.v, note: copyByVid.get(v.v).wy })),
    seconds: list.reduce((s, v) => s + (v.d || 0), 0),
    hasDurations: list.every((v) => v.d !== null),
  };
}).filter((p) => p.videos.length >= 5);

mkdirSync(OUT, { recursive: true });
if (existsSync(join(SRC, "LICENSE"))) copyFileSync(join(SRC, "LICENSE"), join(OUT, "LICENSE"));
writeFileSync(join(OUT, "NOTICE.txt"), "Data from HackerTube (https://hackertube.org) and open-index/hacker-news (https://huggingface.co/datasets/open-index/hacker-news), ODC-By 1.0.\nLicense: https://opendatacommons.org/licenses/by/1-0/\nChinese translations and JS indexes are derived data. Comments and video content remain the work of their authors.\n");
const write = (name, key, obj) =>
  writeFileSync(join(OUT, name), `HT_DATA.load(${JSON.stringify(key)}, ${JSON.stringify(obj)});\n`);

write("meta.js", "meta", {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: "HackerTube 官方数据集（2026-10-31 导出）",
  translatedCount: videos.filter((v) => translations.get(v.v)?.title_zh && translations.get(v.v)?.summary_zh).length,
  videoCount: videos.length,
  mentionCount: mentionRows.length,
  shardCount: SHARDS,
  hasYouTubeMeta: yt.size > 0,
  areas: taxonomy.areas.length,
  categories: taxonomy.areas.reduce((s, a) => s + a.categories.length, 0),
  yearSpan: [
    Math.min(...videos.map((v) => v.h.f)),
    Math.max(...videos.map((v) => v.h.l)),
  ],
});

write("taxonomy.js", "taxonomy", {
  areas: taxonomy.areas
    .map((a) => ({
      id: a.id,
      name: AREA_ZH[a.id] || a.name,
      enName: a.name,
      count: areaCounts.get(a.id) || 0,
      cats: a.categories
        .map((c) => ({ id: c.id, name: CAT_ZH[c.id] || c.name, enName: c.name, count: catCounts.get(c.id) || 0 }))
        .sort((x, y) => y.count - x.count),
    }))
    .sort((a, b) => b.count - a.count),
});

write("videos.js", "videos", videos);
write("playlists.js", "playlists", playlists);

for (let s = 0; s < SHARDS; s++) {
  const details = {};
  for (const v of videos) {
    if (shardOf(v.v) !== s) continue;
    const d = {};
    const m = mentionsByVid.get(v.v);
    const r = relatedByVid.get(v.v);
    const c = copyByVid.get(v.v);
    if (c.su && c.su !== v.x) d.su = c.su;
    if (c.wy) d.wy = c.wy;
    if (c.q) d.q = c.q;
    if (m?.length) d.m = m;
    if (r?.length) d.r = r;
    if (Object.keys(d).length) details[v.v] = d;
  }
  write(`detail-${s}.js`, "detail", details);
}

const size = (n) => (readFileSync(join(OUT, n)).length / 1024).toFixed(0);
console.log(`videos ${videos.length}  mentions ${mentionRows.length}  playlists ${playlists.length}`);
console.log(`videos.js ${size("videos.js")}KB  taxonomy.js ${size("taxonomy.js")}KB  detail shard ~${size("detail-0.js")}KB`);
console.log(`youtube meta: ${yt.size ? `${yt.size} videos` : "absent（时长/播放量/上传日期会自动隐藏）"}`);
