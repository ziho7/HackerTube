// UI chrome strings. Video titles, channels and summaries stay in whatever
// language the dataset ships; only the interface is localized here.
window.HT_T = {
  brand: ["黑客", "tube"],
  title: "黑客tube",
  tagline: "Hacker News 上大家互相推荐的那些视频",

  nav: {
    home: "首页", longs: "长视频", liked: "我喜欢", history: "历史",
    later: "稍后再看", categories: "分类", playlists: "播单", settings: "设置",
  },
  navGroup: { library: "你的库", browse: "发现" },

  search: { placeholder: "搜索", aria: "搜索" },

  filters: {
    button: "筛选",
    date: "上传时间", type: "类型", duration: "时长", features: "特性", sort: "排序",
    dateOpts: { year: "近一年", "2020s": "2020 年代", "2010s": "2010 年代", "2000s": "2000 年代" },
    featureOpts: { gems: "冷门宝藏", evergreen: "只看常青内容" },
    sortOpts: {
      "": "最佳优先", recent: "最近被推荐", date: "上传时间",
      old: "最早上传", views: "播放量", liked: "好评率",
    },
  },

  metaGap: {
    notice: "当前数据暂未提供时长、上传日期与播放量。可以清除筛选，或按类型、推荐时间和常青内容继续探索。",
    footnote: "上传时间、时长、播放量需要 YouTube 元数据，当前数据尚未提供。",
    empty: ["这个筛选暂时筛不到视频", "它需要时长或上传日期，而当前数据里还没有这两个字段。"],
  },

  quick: { recent: "最近被推荐", longs: "长视频", gems: "冷门宝藏", all: "全部视频" },

  type: {
    talk: "演讲", lecture: "课程", course: "系列课", documentary: "纪录片",
    explainer: "讲解", interview: "访谈", podcast: "播客", tutorial: "教程",
    demo: "演示", news: "新闻", commentary: "评论", comedy: "喜剧", music: "音乐", other: "其他",
  },
  level: { general: "通识", intro: "入门", intermediate: "进阶", advanced: "深入" },
  shelf: { evergreen: "常青", dated: "有年代感", news: "时效性" },

  stance: { strong_rec: "强烈推荐", rec: "推荐", reference: "引用", joke: "玩梗", critical: "批评" },

  card: { views: "次观看", playOnYouTube: "在 YouTube 播放" },

  watch: {
    recommenders: (n) => `${n} 位 HN 推荐人`,
    months: (n, span) => `在 ${n} 个月里被推荐${span ? `，${span}` : ""}`,
    mentioned: (n, span) => `HN 提及 ${n} 次 · ${span}`,
    like: "点赞", dislike: "不喜欢", later: "稍后再看", youTube: "YouTube",
    comments: (n) => `来自 Hacker News 的 ${n} 条讨论`,
    viewOnHn: "查看原帖",
    thisVideo: "▶ 本视频",
    otherLink: "链接",
    related: "HN 上还会推荐",
    back: "返回",
    notEmbeddable: "这个视频不允许内嵌播放，只能去 YouTube 看。",
    deleted: "视频已被删除或设为私密。",
  },

  home: { title: "首页", whyHere: "为什么推荐给你" },
  categories: {
    title: "分类",
    lede: "16 个领域、150 个主题，按 HN 的讨论量排序。",
  },
  playlistsPage: {
    title: "播单",
    lede: "按 HN 的推荐整理成有序清单，顺序是刻意排的。",
    startHere: "从这里开始",
    startHereSub: "第一次来，先看这几个覆盖面最广的。",
    byArea: "按领域",
    count: (n, dur) => `${n} 个视频${dur ? ` · ${dur}` : ""}`,
  },
  liked: { title: "我喜欢", empty: ["还没有喜欢的视频", "在任意视频上点赞，首页就会开始跟着你的口味走。"] },
  disliked: { title: "不喜欢", empty: ["还没有标记不喜欢的视频", "标记后会从首页推荐中隐藏，你可以随时在这里移除标记。"] },
  history: { title: "历史", empty: ["还没有观看记录", "看过的视频会出现在这里。"] },
  later: { title: "稍后再看", empty: ["收藏夹是空的", "把视频上的时钟图标点一下，就会存到这里。"] },
  settings: {
    title: "设置",
    frames: ["用视频画面代替封面图", "默认显示视频中段的画面。关闭后，显示创作者设置的原始封面。"],
    theme: ["深色模式", "跟随系统，或强制浅色/深色。"],
    themeOpts: { auto: "跟随系统", light: "浅色", dark: "深色" },
    hideNews: ["隐藏时效性内容", "只跟某条新闻有关、过一阵就没价值的视频默认不出现。"],
    collapsed: ["收起侧边栏", "只留图标，把宽度让给视频网格。"],
    reset: ["清空个人数据", "点赞、不喜欢、历史、稍后再看和浏览记录都会删掉。显示设置保留。"],
    resetBtn: "清空",
  },
  about: {
    title: "关于黑客tube",
    lede: "Hacker News 上大家互相推荐的那些视频。",
    stats: { videos: "个视频", comments: "条 HN 评论", topics: "个主题 · 16 领域", years: "年的 HN" },
    why: "为什么做这个",
    how: "数据是怎么来的",
    can: "你能做什么",
    fork: "接自己的数据",
  },

  playAll: "按顺序观看",
  emptySearch: ["没有找到相关内容", "试试更短的关键词，或者去分类页按主题浏览。"],
  emptyFilter: ["没有同时满足这些条件的视频", "去掉一两个筛选试试，或者从分类页按主题浏览。"],
  resultCount: (n) => `${n} 个结果`,
  theme: "切换主题",
  menu: "菜单",
  toast: {
    liked: "已加入喜欢，首页会跟着调整",
    unliked: "已从喜欢移除",
    disliked: "已标记不喜欢",
    undisliked: "已取消「不喜欢」",
    laterAdd: "已加入稍后再看",
    laterRemove: "已从稍后再看移除",
    cleared: "已清空",
  },
  shortcuts: [
    ["/", "搜索"],
    ["j / k", "下一个 / 上一个视频"],
    ["Enter", "打开选中的视频"],
    ["l", "点赞当前或选中的视频"],
    ["w", "稍后再看"],
    ["p", "播放（视频页）"],
    ["h", "回到首页"],
    ["?", "显示这些快捷键"],
    ["Esc", "关闭 / 退出搜索框"],
  ],
  metaNote: "标题与摘要优先显示已有中文翻译，详情保留英文原标题和 HN 原始讨论。个人记录只保存在当前浏览器中。",
};

window.HT_TYPE_KEYS = Object.keys(HT_T.type);
window.HT_T.typeOf = (k) => HT_T.type[k] || HT_T.type.other;
window.HT_T.shelfOf = (k) => HT_T.shelf[k] || "";
