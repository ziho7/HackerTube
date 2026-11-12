window.HT_APP = (function () {
  const T = HT_T, U = HT_UI, esc = U.esc;
  const main = () => document.getElementById("main");
  let ctx = null;
  let disconnect = null;

  const NAV = [
    ["home", "#/", "首页"], ["browse", "#/browse", "全部视频"],
    ["liked", "#/liked", "我喜欢"], ["disliked", "#/disliked", "不喜欢"], ["history", "#/history", "历史"],
    ["later", "#/later", "稍后再看"], ["categories", "#/categories", "分类"],
    ["playlists", "#/playlists", "播单"], ["settings", "#/settings", "设置"],
    ["about", "#/about", "关于与源码"],
  ];
  const ICON = { home: "home", browse: "longs", liked: "like", disliked: "dislike", history: "history", later: "clock", categories: "grid", playlists: "playlist", settings: "settings", about: "help" };
  const decode = (value) => { try { return decodeURIComponent(value); } catch { return value; } };

  function parseHash() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [pathAndQuery] = [raw];
    const qi = pathAndQuery.indexOf("?");
    const path = qi === -1 ? pathAndQuery : pathAndQuery.slice(0, qi);
    const search = qi === -1 ? "" : pathAndQuery.slice(qi + 1);
    return { parts: path.split("/").map(decode).filter(Boolean), params: U.parseParams(search) };
  }

  const route = (parts) => {
    const seg = parts[0] || "";
    switch (seg) {
      case "": return [HT_PAGES.home, HT_PAGES.homeMount, "home"];
      case "browse": return [HT_PAGES.browse, HT_PAGES.browseMount, "browse"];
      case "search": return [HT_PAGES.search, HT_PAGES.searchMount, "home"];
      case "watch": return [HT_PAGES.watch, HT_PAGES.watchMount, ""];
      case "categories": return [HT_PAGES.categories, null, "categories"];
      case "a": return [HT_PAGES.area, HT_PAGES.areaMount, "categories"];
      case "c": return [HT_PAGES.category, HT_PAGES.categoryMount, "categories"];
      case "channel": return [HT_PAGES.channel, HT_PAGES.channelMount, ""];
      case "playlists": return [HT_PAGES.playlists, null, "playlists"];
      case "p": return [HT_PAGES.playlist, null, "playlists"];
      case "liked": return [() => HT_PAGES.collection("liked"), null, "liked"];
      case "disliked": return [() => HT_PAGES.collection("disliked"), null, "disliked"];
      case "history": return [() => HT_PAGES.collection("history"), null, "history"];
      case "later": return [() => HT_PAGES.collection("later"), null, "later"];
      case "settings": return [HT_PAGES.settings, HT_PAGES.settingsMount, "settings"];
      case "about": return [HT_PAGES.about, null, "about"];
      default: return [() => HT_PAGES.notFound(), null, ""];
    }
  };

  function renderSidebar(active) {
    document.getElementById("side").innerHTML = NAV.map(([key, href, label]) =>
      `${["liked", "categories", "settings"].includes(key) ? '<div class="sep"></div>' : ""}<a href="${href}" title="${esc(label)}" data-nav="${key}" ${key === active ? 'aria-current="page"' : ""} class="${key === active ? "on" : ""}">${HT_ICON(ICON[key])}<span>${esc(label)}</span></a>`
    ).join("");
  }

  function render() {
    const next = parseHash();
    if (ctx) ctx.active = false;
    ctx = { ...next, params: next.params, el: main(), active: true };
    kbdIndex = -1;
    document.body.classList.remove("drawer");
    document.getElementById("q").value = ctx.parts[0] === "search" ? ctx.parts[1] || "" : "";
    const [fn, mount, navKey] = route(ctx.parts);
    if (disconnect) { disconnect(); disconnect = null; }
    main().innerHTML = fn(ctx);
    if (mount) disconnect = mount(ctx) || null;
    renderSidebar(navKey);
    applySettings();
    document.title = pageTitle();
    window.scrollTo(0, 0);
  }

  function pageTitle() {
    const parts = ctx.parts;
    const seg = parts[0] || "";
    if (seg === "watch") { const v = HT_DATA.video(parts[1]); return v ? `${v.t} - ${T.title}` : T.title; }
    if (seg === "c") { const c = HT_DATA.cat(parts[1]); return c ? `${c.name} - ${T.title}` : T.title; }
    if (seg === "a") { const a = HT_DATA.areas.find((x) => x.id === parts[1]); return a ? `${a.name} - ${T.title}` : T.title; }
    if (seg === "p") { const pl = HT_DATA.playlists.find((x) => x.id === parts[1]); return pl ? `${pl.name} - ${T.title}` : T.title; }
    if (seg === "channel") return `${parts[1] || ""} - ${T.title}`;
    if (seg === "search") return `${parts[1] || ""} - ${T.title}`;
    if (seg === "browse") return `${HT_PAGES.browseTitle(ctx.params)} - ${T.title}`;
    const label = { "": T.home.title, browse: "全部视频", categories: T.nav.categories, playlists: T.nav.playlists, settings: T.nav.settings, liked: T.nav.liked, disliked: T.disliked.title, history: T.nav.history, later: T.nav.later, about: "关于" }[seg];
    return label ? `${label} - ${T.title}` : T.title;
  }

  /* ---------- settings & theme ---------- */

  function applySettings() {
    const s = HT_STORE.settings();
    if (s.theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", s.theme);
    document.body.classList.toggle("collapsed", !!s.collapsed && window.innerWidth > 800);
    document.getElementById("theme").innerHTML = HT_ICON(isDark(s) ? "sun" : "moon");
    const open = window.innerWidth > 800 || document.body.classList.contains("drawer");
    document.getElementById("side").inert = !open;
    document.getElementById("menu").setAttribute("aria-expanded", String(window.innerWidth <= 800 ? open : !s.collapsed));
    document.querySelectorAll("[data-theme-set]").forEach((b) => {
      const active = b.dataset.themeSet === s.theme;
      b.classList.toggle("on", active); b.setAttribute("aria-pressed", String(active));
    });
  }

  const isDark = (s) => s.theme === "dark" || (s.theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);

  function cycleTheme() {
    HT_STORE.set("theme", isDark(HT_STORE.settings()) ? "light" : "dark");
    applySettings();
  }

  /* ---------- delegated interactions ---------- */

  function syncButtons(vid) {
    document.querySelectorAll("[data-later]").forEach((button) => {
      if (vid && button.dataset.later !== vid) return;
      const on = HT_STORE.inLater(button.dataset.later); button.classList.toggle("on", on); button.setAttribute("aria-pressed", String(on));
    });
    vid = vid || ctx.parts[1];
    if (ctx.parts[0] !== "watch" || ctx.parts[1] !== vid) return;
    for (const [id, on] of [["like", HT_STORE.isLiked(vid)], ["dislike", HT_STORE.isDisliked(vid)], ["save-later", HT_STORE.inLater(vid)]]) {
      const button = document.getElementById(id);
      if (button) { button.classList.toggle("on", on); button.setAttribute("aria-pressed", String(on)); }
    }
  }

  function refreshCollection() {
    if (!["liked", "disliked", "later", "history"].includes(ctx.parts[0])) return;
    const y = window.scrollY, index = kbdIndex;
    render(); window.scrollTo(0, y);
    if (index >= 0 && cards().length) {
      kbdIndex = Math.min(index, cards().length - 1); cards()[kbdIndex].classList.add("kbd");
    }
  }

  function syncPersonalData() {
    if (!HT_STORE.sync()) return;
    applySettings(); syncButtons(); refreshCollection();
    for (const [id, key] of [["frames-toggle", "frames"], ["news-toggle", "hideNews"], ["collapse-toggle", "collapsed"]]) {
      const input = document.getElementById(id); if (input) input.checked = HT_STORE.settings()[key];
    }
  }

  function onClick(e) {
    if (e.target.closest(".skip-link")) { e.preventDefault(); main().focus(); return; }
    const remove = e.target.closest("[data-remove]");
    if (remove) {
      HT_STORE.remove(remove.dataset.remove, remove.dataset.vid);
      const y = window.scrollY; render(); window.scrollTo(0, y); U.toast("已移除这条记录"); return;
    }
    const later = e.target.closest("[data-later]");
    if (later) {
      e.preventDefault(); e.stopPropagation();
      const vid = later.dataset.later;
      const on = HT_STORE.toggleLater(vid);
      syncButtons(vid);
      if (ctx.parts[0] === "later" && !on) { const y = window.scrollY; render(); window.scrollTo(0, y); }
      U.toast(on ? T.toast.laterAdd : T.toast.laterRemove);
      return;
    }
    const fa = e.target.closest("#filters a");
    if (fa && !document.getElementById("filters").hasAttribute("hidden")) {
      // hrefs were rendered while the panel was closed; keep it open through the link.
      const [base, search] = fa.getAttribute("href").split("?");
      const q = new URLSearchParams(search || "");
      q.set("open", "1");
      fa.setAttribute("href", `${base}?${q}`);
    }
    const fb = e.target.closest("#filters-btn");
    if (fb) {
      const panel = document.getElementById("filters");
      if (!panel) return;
      const open = panel.hasAttribute("hidden");
      if (open) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", "");
      fb.setAttribute("aria-expanded", String(open));
      fb.classList.toggle("on", open);
      // Keep the panel open across the filter links that follow.
      const [path, search] = location.hash.slice(1).split("?");
      const q = new URLSearchParams(search || "");
      if (open) q.set("open", "1"); else q.delete("open");
      const qs = q.toString();
      history.replaceState(null, "", `#${path}${qs ? `?${qs}` : ""}`);
      return;
    }
    if (e.target.closest("#menu")) {
      if (window.innerWidth <= 800) document.body.classList.toggle("drawer");
      else HT_STORE.set("collapsed", !HT_STORE.settings().collapsed);
      applySettings();
      return;
    }
    if (e.target.closest("#theme")) { cycleTheme(); return; }
    if (e.target.closest("#scrim")) { document.body.classList.remove("drawer"); applySettings(); return; }

    const like = e.target.closest("#like");
    if (like) {
      const vid = ctx.parts[1];
      const on = HT_STORE.toggleLike(vid);
      syncButtons(vid);
      U.toast(on ? T.toast.liked : T.toast.unliked);
      return;
    }
    const dislike = e.target.closest("#dislike");
    if (dislike) {
      const vid = ctx.parts[1];
      const on = HT_STORE.toggleDislike(vid);
      syncButtons(vid);
      U.toast(on ? T.toast.disliked : T.toast.undisliked);
      return;
    }
    const save = e.target.closest("#save-later");
    if (save) {
      const vid = ctx.parts[1];
      const on = HT_STORE.toggleLater(vid);
      syncButtons(vid);
      U.toast(on ? T.toast.laterAdd : T.toast.laterRemove);
      return;
    }
    const link = e.target.closest('a[href^="#/"]');
    if (link && link.hash === location.hash && document.body.classList.contains("drawer")) {
      document.body.classList.remove("drawer"); applySettings();
    }
  }

  /* ---------- keyboard ---------- */

  const cards = () => [...document.querySelectorAll(".vcard, .srow, .next")];
  let kbdIndex = -1;

  function moveKbd(delta) {
    const list = cards();
    if (!list.length) return;
    kbdIndex = Math.max(0, Math.min(list.length - 1, kbdIndex + delta));
    list.forEach((el) => el.classList.remove("kbd"));
    const el = list[kbdIndex];
    el.classList.add("kbd");
    el.scrollIntoView({ block: "nearest" });
  }

  function onKey(e) {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    const help = document.getElementById("help");
    if (e.key === "Escape") {
      help.close();
      document.body.classList.remove("drawer");
      applySettings();
      if (typing) e.target.blur();
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey || e.isComposing || help.open) return;
    const later = e.target.closest("[data-later]");
    if (later && ["Enter", " "].includes(e.key)) { e.preventDefault(); later.click(); return; }
    if (e.key === "Enter" && e.target.closest("a, button")) return;
    const vid = ctx && ctx.parts[0] === "watch" ? ctx.parts[1] : null;
    const target = kbdIndex >= 0 ? cards()[kbdIndex] : null;
    const targetVid = target?.dataset.video;
    const focusVid = vid || targetVid;

    switch (e.key) {
      case "/": e.preventDefault(); document.getElementById("q").focus(); break;
      case "?": e.preventDefault(); help.showModal(); break;
      case "j": e.preventDefault(); moveKbd(1); break;
      case "k": e.preventDefault(); moveKbd(-1); break;
      case "Enter": if (target) { e.preventDefault(); location.hash = target.getAttribute("href").slice(1); } break;
      case "h": location.hash = "#/"; break;
      case "p": if (vid) { e.preventDefault(); const b = document.getElementById("poster"); if (b) b.click(); } break;
      case "l": if (focusVid) { const on = HT_STORE.toggleLike(focusVid); U.toast(on ? T.toast.liked : T.toast.unliked); syncButtons(focusVid); refreshCollection(); } break;
      case "w": if (focusVid) { const on = HT_STORE.toggleLater(focusVid); U.toast(on ? T.toast.laterAdd : T.toast.laterRemove); syncButtons(focusVid); refreshCollection(); } break;
      default:
    }
  }

  /* ---------- boot ---------- */

  function boot() {
    document.getElementById("menu").innerHTML = HT_ICON("menu");
    document.querySelector(".search button").innerHTML = HT_ICON("search");
    document.getElementById("about-link").innerHTML = HT_ICON("help");
    document.getElementById("help-rows").innerHTML = T.shortcuts
      .map(([k, d]) => `<tr><td><kbd>${esc(k)}</kbd></td><td>${esc(d)}</td></tr>`).join("");

    document.getElementById("search-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const q = document.getElementById("q").value.trim();
      location.hash = q ? `#/search/${encodeURIComponent(q)}` : "#/browse";
    });
    document.getElementById("help").addEventListener("click", (e) => {
      if (e.target.id === "help" || e.target.closest("#help-close")) document.getElementById("help").close();
    });

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", () => { kbdIndex = -1; render(); });
    window.addEventListener("resize", applySettings);
    window.addEventListener("storage", (event) => { if (event.key === "ht-zh" || event.key === null) syncPersonalData(); });
    window.addEventListener("focus", syncPersonalData);
    window.addEventListener("ht-storage-error", () => setTimeout(() => U.toast("浏览器无法保存记录，请导出备份；本次修改仅在当前页面有效。"), 0));
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applySettings);

    applySettings();
    render();
  }

  return { render, applySettings, boot, get ctx() { return ctx; } };
})();

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", HT_APP.boot);
else HT_APP.boot();
