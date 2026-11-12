/* Data adapter — the seam between the UI and whatever pipeline produces the data.
 *
 * The build script emits JS bundles that call HT_DATA.load(). To point this site at
 * your own Chinese dataset, emit the same shapes (see README-worthy notes in
 * tools/build-data.mjs) and nothing in the UI has to change:
 *
 *   videos[]  { v,t,t0,c,y,l,s,p,g,a,h:{m,r,mo,k,st,f,l},o,d,w,u,b,x }
 *             v=vid t=localized title t0=original title c=channel y=content_type l=level s=shelf_life p=topic
 *             g=tags a=[[catId,areaId]] o=score x=summary snippet
 *             d=seconds w=views u=publish-date b=embeddable  (null until YouTube metadata exists)
 *   detail    { vid: { su, wy, q:{x,i,y}, m=[mentions], r=[[vid, shared]] } }
 *   taxonomy  { areas: [{ id, name, enName, count, cats: [{ id, name, enName, count }] }] }
 */
(function () {
  const buckets = { detail: {} };
  const loadedShards = new Set();
  const pending = new Map();

  window.HT_DATA = {
    load(key, obj) {
      if (key === "detail") { Object.assign(buckets.detail, obj); return; }
      buckets[key] = obj;
      if (key === "videos") {
        buckets.byVid = new Map(obj.map((v) => [v.v, v]));
        buckets.byId = new Map((buckets.taxonomy || { areas: [] }).areas.flatMap((a) =>
          a.cats.map((c) => [c.id, { ...c, area: a.id, areaName: a.name }])));
      }
      if (key === "taxonomy" && buckets.videos) {
        buckets.byId = new Map(obj.areas.flatMap((a) =>
          a.cats.map((c) => [c.id, { ...c, area: a.id, areaName: a.name }])));
      }
    },
    get meta() { return buckets.meta || {}; },
    get videos() { return buckets.videos || []; },
    get areas() { return (buckets.taxonomy || { areas: [] }).areas; },
    get playlists() { return buckets.playlists || []; },
    video: (vid) => (buckets.byVid || new Map()).get(vid),
    cat: (id) => (buckets.byId || new Map()).get(id),

    // One <script> per shard, injected on demand so file:// works without a server.
    detail(vid) {
      const cached = buckets.detail && buckets.detail[vid];
      if (cached !== undefined) return Promise.resolve(cached);
      const s = shardOf(vid);
      if (loadedShards.has(s)) return Promise.resolve({});
      return loadShard(s).then(() => (buckets.detail || {})[vid] || {});
    },
  };

  function shardOf(vid) {
    let h = 0;
    for (let i = 0; i < vid.length; i++) h = (h * 31 + vid.charCodeAt(i)) >>> 0;
    return h % (HT_DATA.meta.shardCount || 64);
  }

  function loadShard(s) {
    if (pending.has(s)) return pending.get(s);
    const p = new Promise((res, rej) => {
      const el = document.createElement("script");
      el.src = `data/detail-${s}.js`;
      let finished = false;
      const finish = (error) => {
        if (finished) return;
        finished = true; clearTimeout(timer); pending.delete(s); el.remove();
        el.onload = el.onerror = null;
        if (error) rej(error); else { loadedShards.add(s); res(); }
      };
      const timer = setTimeout(() => finish(new Error(`detail-${s}.js 加载超时`)), 15000);
      el.onload = () => finish();
      el.onerror = () => finish(new Error(`detail-${s}.js 加载失败`));
      document.body.appendChild(el);
    });
    pending.set(s, p);
    return p;
  }

  /* ---------- formatting ---------- */

  const fmtDuration = (sec) => {
    if (!sec && sec !== 0) return null;
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
  };

  const fmtViews = (n) => {
    if (n == null) return null;
    if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, "") + "亿";
    if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, "") + "万";
    return String(n);
  };

  const REL = [[31536000, "年"], [2592000, "个月"], [604800, "周"], [86400, "天"], [3600, "小时"], [60, "分钟"]];
  const fmtAgo = (iso) => {
    if (!iso) return null;
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "刚刚";
    for (const [sec, unit] of REL) {
      const n = Math.floor(diff / sec);
      if (n >= 1) return `${n} ${unit}前`;
    }
    return "刚刚";
  };

  const fmtSpan = (sec) => {
    const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
    return h ? `${h} 小时 ${m} 分钟` : `${m} 分钟`;
  };

  // Cards need a second line either way: YouTube numbers when we have them,
  // HN conversation stats when the metadata pipeline hasn't landed yet.
  const subLine = (v) => {
    const views = fmtViews(v.w), ago = fmtAgo(v.u);
    if (views || ago) return [views && `${views}次观看`, ago].filter(Boolean).join(" · ");
    return `${v.h.r} 位推荐人 · ${v.h.f}–${v.h.l} 年被提及`;
  };

  const hasYouTubeMeta = () => HT_DATA.meta.hasYouTubeMeta;

  /* ---------- querying ---------- */

  const DUR = {
    short: (v) => v.d !== null && v.d < 240,
    medium: (v) => v.d !== null && v.d >= 240 && v.d < 1200,
    long: (v) => v.d !== null && v.d >= 1200 && v.d < 3600,
    xlong: (v) => v.d !== null && v.d >= 3600,
  };

  const inYear = (v, y) => v.u && new Date(v.u).getFullYear() >= y;

  function filter(params) {
    let list = HT_DATA.videos;
    if (HT_STORE.settings().hideNews) list = list.filter((v) => v.s !== "news");
    if (params.cat) list = list.filter((v) => v.a.some((c) => c[0] === params.cat));
    if (params.area) list = list.filter((v) => v.a.some((c) => c[1] === params.area));
    if (params.type) list = list.filter((v) => v.y === params.type);
    if (params.dur && DUR[params.dur]) list = list.filter(DUR[params.dur]);
    if (params.date === "year") {
      const since = new Date(); since.setFullYear(since.getFullYear() - 1);
      list = list.filter((v) => v.u && new Date(v.u) >= since && new Date(v.u) <= new Date());
    } else if (/^(2000|2010|2020)s$/.test(params.date || "")) {
      const year = Number(params.date.slice(0, 4));
      list = list.filter((v) => inYear(v, year) && !inYear(v, year + 10));
    }
    if (params.gems) list = list.filter((v) => v.h.r <= 8 && v.o >= 4);
    if (params.evergreen) list = list.filter((v) => v.s === "evergreen");
    if (params.channel) list = list.filter((v) => v.c === params.channel);
    return list;
  }

  const SORTS = {
    best: (a, b) => b.o - a.o,
    recent: (a, b) => (b.h.l - a.h.l) || (b.h.mo - a.h.mo) || b.o - a.o,
    date: (a, b) => String(b.u || b.h.l).localeCompare(String(a.u || a.h.l)),
    old: (a, b) => String(a.u || a.h.f).localeCompare(String(b.u || b.h.f)),
    views: (a, b) => (b.w || 0) - (a.w || 0) || b.o - a.o,
    liked: (a, b) => (b.h.r ? b.h.k / b.h.r : 0) - (a.h.r ? a.h.k / a.h.r : 0) || b.o - a.o,
  };

  function sort(list, key) { return list.slice().sort(SORTS[key] || SORTS.best); }

  const norm = (s) => String(s || "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

  function haystack(v) {
    const cats = v.a.map((c) => HT_DATA.cat(c[0])).filter(Boolean);
    return [
      [norm(v.t), 6],
      [norm(v.t0), 6],
      [norm(v.c), 4],
      [norm(v.p), 4],
      [v.g.map(norm).join(" "), 3],
      [cats.map((c) => norm(c.name) + " " + norm(c.enName) + " " + norm(c.areaName)).join(" "), 3],
      [norm(v.x), 1],
      [v.y + " " + v.l, 1],
    ];
  }

  const cache = new WeakMap();
  function search(query, params = {}) {
    const terms = norm(query).split(" ").filter(Boolean);
    if (!terms.length) return sort(filter(params), params.sort);
    const pool = filter(params);
    const scored = [];
    for (const v of pool) {
      let hay = cache.get(v);
      if (!hay) { hay = haystack(v); cache.set(v, hay); }
      let hit = 0;
      for (const term of terms) {
        let best = 0;
        for (const [text, weight] of hay) {
          if (!text || text.indexOf(term) === -1) continue;
          const lead = text.startsWith(term) ? 1.5 : 1;
          best = Math.max(best, weight * lead);
        }
        if (!best) { hit = -1; break; }
        hit += best;
      }
      if (hit > 0) scored.push([hit + Math.min(v.o, 30) / 10, v]);
    }
    scored.sort((a, b) => b[0] - a[0]);
    const result = scored.map((s) => s[1]);
    return params.sort ? sort(result, params.sort) : result;
  }

  /* ---------- home feed ---------- */

  // Deterministic per day so the feed doesn't reshuffle on every navigation.
  const seeded = (seed) => () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const shuffle = (arr, rnd) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  function homeFeed(n) {
    const rnd = seeded(Math.floor(Date.now() / 864e5) * 7919);
    const all = sort(HT_DATA.videos.filter((v) => !HT_STORE.isDisliked(v.v) && (!HT_STORE.settings().hideNews || v.s !== "news")), "best");
    const liked = HT_STORE.liked().map((vid) => HT_DATA.video(vid)).filter(Boolean);
    const picked = [];
    const seen = new Set();
    const take = (list, reason, want) => {
      let got = 0;
      for (const v of shuffle(list, rnd)) {
        if (got >= want) break;
        if (seen.has(v.v)) continue;
        seen.add(v.v); picked.push([v, reason]); got++;
      }
    };

    take(all.slice(0, 120), "HN 经典", Math.ceil(n * 0.25));
    take(all.filter((v) => v.h.l >= new Date().getFullYear() - 1 && v.o >= 6), "HN 最近提到", Math.ceil(n * 0.2));
    take(all.filter((v) => v.h.r <= 6 && v.o >= 6), "小众推荐", Math.ceil(n * 0.2));

    const areas = HT_DATA.areas;
    const seenAreas = HT_STORE.seen();
    const fresh = areas.filter((a) => !seenAreas["area:" + a.id]);
    const pool = fresh.length ? fresh : areas;
    const area = pool[Math.floor(rnd() * pool.length)];
    if (area) take(all.filter((v) => v.a.some((c) => c[1] === area.id)), `探索：${area.name}`, Math.ceil(n * 0.2));

    if (liked.length) {
      const cats = new Set(liked.flatMap((v) => v.a.map((c) => c[0])));
      take(all.filter((v) => v.a.some((c) => cats.has(c[0]))), "和你喜欢的视频同属一个主题", Math.ceil(n * 0.15));
    }
    take(all, "随机发现", n);
    return picked.slice(0, n);
  }

  window.HT_QUERY = { filter, sort, search, homeFeed, subLine, fmtDuration, fmtViews, fmtAgo, fmtSpan, hasYouTubeMeta, DUR };
})();
