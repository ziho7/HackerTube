// Personal data stays in this browser. Dataset files are read-only at runtime.
(function () {
  const KEY = "ht-zh";
  const blank = () => ({ liked: {}, disliked: {}, later: {}, history: [], seen: {},
    settings: { theme: "auto", frames: true, collapsed: false, hideNews: true } });
  const object = (v) => v && typeof v === "object" && !Array.isArray(v);
  const validId = (id) => /^[\w-]{11}$/.test(id);
  const stamps = (value, isKey = validId) => Object.fromEntries(
    Object.entries(object(value) ? value : {}).filter(([k, v]) => isKey(k) && Number.isFinite(v) && v > 0));
  function normalize(value) {
    const input = object(value) ? value : {}, out = blank();
    for (const k of ["liked", "disliked", "later"]) out[k] = stamps(input[k]);
    for (const id of Object.keys(out.disliked)) {
      if ((out.liked[id] || 0) > out.disliked[id]) delete out.disliked[id];
      else delete out.liked[id];
    }
    out.seen = stamps(input.seen, (k) => /^(area|cat):[\w-]+$/.test(k));
    const history = new Map();
    for (const h of Array.isArray(input.history) ? input.history : []) {
      if (h && validId(h.vid) && Number.isFinite(h.at) && h.at > (history.get(h.vid) || 0)) history.set(h.vid, h.at);
    }
    out.history = [...history].map(([vid, at]) => ({ vid, at })).sort((a, b) => b.at - a.at).slice(0, 500);
    const s = object(input.settings) ? input.settings : {};
    if (["auto", "light", "dark"].includes(s.theme)) out.settings.theme = s.theme;
    for (const key of ["frames", "collapsed", "hideNews"]) if (typeof s[key] === "boolean") out.settings[key] = s[key];
    return out;
  }
  let state, lastSaved = null;
  try { lastSaved = localStorage.getItem(KEY); state = normalize(JSON.parse(lastSaved)); } catch { state = blank(); }
  let storageAvailable = true;
  // Read fresh data before a mutation so an older tab does not overwrite a newer one.
  const sync = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === lastSaved) return false;
      const next = normalize(JSON.parse(raw));
      state = next; lastSaved = raw; return true;
    } catch { return false; }
  };
  const save = () => {
    try { const raw = JSON.stringify(state); localStorage.setItem(KEY, raw); lastSaved = raw; storageAvailable = true; }
    catch { storageAvailable = false; window.dispatchEvent(new Event("ht-storage-error")); }
  };
  const toggle = (kind, vid, opposite) => {
    if (!validId(vid)) return false;
    sync();
    if (state[kind][vid]) delete state[kind][vid];
    else { state[kind][vid] = Date.now(); if (opposite) delete state[opposite][vid]; }
    save(); return !!state[kind][vid];
  };
  window.HT_STORE = {
    get state() { return state; },
    get storageAvailable() { return storageAvailable; },
    settings: () => state.settings,
    set: (k, v) => { sync(); state.settings = normalize({ settings: { ...state.settings, [k]: v } }).settings; save(); },
    sync,
    liked: () => Object.keys(state.liked),
    isLiked: (v) => !!state.liked[v], isDisliked: (v) => !!state.disliked[v], inLater: (v) => !!state.later[v],
    toggleLike: (v) => toggle("liked", v, "disliked"),
    toggleDislike: (v) => toggle("disliked", v, "liked"),
    toggleLater: (v) => toggle("later", v),
    history: () => state.history,
    pushHistory: (vid) => {
      if (!validId(vid)) return;
      sync();
      state.history = [{ vid, at: Date.now() }, ...state.history.filter((h) => h.vid !== vid)].slice(0, 500); save();
    },
    remove: (kind, vid) => {
      sync();
      if (kind === "history") state.history = state.history.filter((h) => h.vid !== vid);
      else if (["liked", "disliked", "later"].includes(kind)) delete state[kind][vid];
      save();
    },
    clearPersonal: () => { sync(); state = { ...blank(), settings: state.settings }; save(); },
    markSeen: (key) => { sync(); state.seen[key] = (state.seen[key] || 0) + 1; save(); },
    seen: () => state.seen,
    export: () => { sync(); return JSON.stringify({ app: "HackerTube", version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2); },
    import: (text) => {
      const input = JSON.parse(text);
      if (input?.app !== "HackerTube" || input.version !== 1 || !object(input.data)) throw new Error("请选择 HackerTube 导出的 JSON 备份文件。");
      const incoming = normalize(input.data);
      sync();
      const merged = { ...state, history: [...state.history, ...incoming.history] };
      for (const k of ["liked", "disliked", "later", "seen"]) {
        merged[k] = { ...state[k] };
        for (const [id, at] of Object.entries(incoming[k])) merged[k][id] = Math.max(merged[k][id] || 0, at);
      }
      state = normalize(merged); save();
    },
  };
})();
