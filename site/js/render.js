window.HT_UI = (function () {
  const T = HT_T;

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const settings = () => HT_STORE.settings();

  // hqdefault is the uploader's designed thumbnail; hq2 is an automatic frame
  // from the middle of the video, which is what the "show frames" setting wants.
  const thumbUrl = (vid, frames = settings().frames) =>
    `https://i.ytimg.com/vi/${vid}/${frames ? "hq2" : "hqdefault"}.jpg`;

  const thumbFallback = window.thumbFallback = function (img) {
    if (img.dataset.fb) { img.style.visibility = "hidden"; return; }
    img.dataset.fb = "1";
    const frames = !/hqdefault/.test(img.src);
    img.src = frames ? img.src.replace("hq2", "hqdefault") : img.src.replace("hqdefault", "hq2");
  };
  window.HT_UI_THUMBFALLBACK = thumbFallback;

  const laterBtn = (vid) =>
    `<span class="later-btn${HT_STORE.inLater(vid) ? " on" : ""}" role="button" tabindex="0"
      data-later="${esc(vid)}" title="${T.watch.later}" aria-pressed="${HT_STORE.inLater(vid)}" aria-label="${T.watch.later}">${HT_ICON("clock")}</span>`;

  const thumb = (v, extra) => {
    const dur = HT_QUERY.fmtDuration(v.d);
    return `<div class="thumb"${extra && extra.wrap ? ` style="width:${extra.wrap}"` : ""}>
      <img loading="lazy" src="${thumbUrl(v.v)}" data-vid="${esc(v.v)}" onerror="thumbFallback(this)" alt="">
      ${laterBtn(v.v)}
      ${dur ? `<span class="dur">${dur}</span>` : ""}
      ${extra && extra.badge ? `<span class="why-badge">${esc(extra.badge)}</span>` : ""}
    </div>`;
  };

  const subLine = (v) => HT_QUERY.subLine(v);

  const vcard = (v, reason) => `<a class="vcard" data-video="${esc(v.v)}" href="#/watch/${esc(v.v)}"${reason ? ` title="${esc(reason)}"` : ""}>
    ${thumb(v, { badge: reason })}
    <div class="info"><div style="min-width:0">
      <h3 class="vt">${esc(v.t)}</h3>
      <div class="sub">${esc(v.c)}</div>
      <div class="sub">${esc(subLine(v))}</div>
    </div></div>
  </a>`;

  const grid = (list, reasons) =>
    `<div class="grid">${list.map((v, i) => vcard(v, reasons && reasons[i])).join("")}</div>`;

  const catTags = (v) => v.a.map(([id]) => HT_DATA.cat(id)).filter(Boolean);

  const srow = (v, opts) => {
    opts = opts || {};
    const dur = HT_QUERY.fmtDuration(v.d);
    return `<a class="srow" data-video="${esc(v.v)}" href="#/watch/${esc(v.v)}">
      <div class="thumb">
        <img loading="lazy" src="${thumbUrl(v.v)}" data-vid="${esc(v.v)}" onerror="thumbFallback(this)" alt="">
        ${laterBtn(v.v)}
        ${dur ? `<span class="dur">${dur}</span>` : ""}
      </div>
      <div style="min-width:0">
        <h3 class="vt">${esc(v.t)}</h3>
        <div class="chan">${esc(v.c)}</div>
        <div class="sub">${esc(subLine(v))}</div>
        ${opts.snippet && v.x ? `<div class="snip">${esc(v.x)}</div>` : ""}
        ${opts.note ? `<p class="plnote">${esc(opts.note)}</p>` : ""}
        ${opts.via ? `<span class="via">${esc(opts.via)}</span>` : ""}
      </div>
    </a>`;
  };

  const nextCard = (v, label) => `<a class="next" data-video="${esc(v.v)}" href="#/watch/${esc(v.v)}">
    ${thumb(v)}
    <div style="min-width:0">
      <h3 class="vt">${esc(v.t)}</h3>
      <div class="sub">${esc(v.c)}</div>
      <div class="sub">${label ? esc(label) : esc(subLine(v))}</div>
    </div>
  </a>`;

  const pageHead = (h2, opts) => {
    opts = opts || {};
    return `<div class="pagehead">
      ${opts.crumb ? `<a class="crumb" href="${opts.crumb.href}">${esc(opts.crumb.text)}</a>` : ""}
      <h2>${esc(h2)}</h2>
      ${opts.sub ? `<p class="sub">${esc(opts.sub)}</p>` : ""}
    </div>`;
  };

  const hrefWith = (base, params) => {
    const q = Object.entries(params).filter(([, v]) => v !== "" && v != null && v !== false)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    return q ? `${base}?${q}` : base;
  };

  const parseParams = (search) => {
    const out = {};
    new URLSearchParams(search).forEach((v, k) => { out[k] = v; });
    return out;
  };

  const FILTER_GROUPS = (base, p) => [
    ["date", T.filters.date, ["year", "2020s", "2010s", "2000s"], (k) => T.filters.dateOpts[k]],
    ["type", T.filters.type, HT_TYPE_KEYS, (k) => T.type[k]],
    ["dur", T.filters.duration, ["short", "medium", "long", "xlong"],
      (k) => ({ short: "4 分钟以内", medium: "4–20 分钟", long: "20–60 分钟", xlong: "1 小时以上" }[k])],
    ["features", T.filters.features, ["gems", "evergreen"], (k) => T.filters.featureOpts[k]],
    ["sort", T.filters.sort, ["", "recent", "date", "old", "views", "liked"], (k) => T.filters.sortOpts[k]],
  ];

  const filtersPanel = (base, p) => {
    const groups = FILTER_GROUPS(base, p);
    return `<div class="filters" id="filters" ${p.open ? "" : "hidden"}>
      ${groups.map(([key, label, values, text]) => {
        const param = key === "features" ? null : key;
        return `<div><h4>${esc(label)}</h4>
          ${values.map((val) => {
            const unavailable = !HT_QUERY.hasYouTubeMeta() && (["date", "dur"].includes(key) || key === "sort" && ["date", "old", "views"].includes(val));
            if (unavailable) return `<span class="filter-unavailable" aria-disabled="true" title="当前数据暂未包含这项信息">${esc(text(val))}</span>`;
            if (param) {
              const on = (p[key] || "") === val;
              const next = { ...p };
              if (on) delete next[key]; else next[key] = val;
              return `<a href="${hrefWith(base, next)}" class="${on ? "on" : ""}">${esc(text(val))}</a>`;
            }
            const on = !!p[val];
            const next = { ...p };
            if (on) delete next[val]; else next[val] = "1";
            return `<a href="${hrefWith(base, next)}" class="${on ? "on" : ""}">${esc(text(val))}</a>`;
          }).join("")}
        </div>`;
      }).join("")}
      ${HT_QUERY.hasYouTubeMeta() ? "" : `<p class="note">${esc(T.metaGap.footnote)}</p>`}
    </div>`;
  };

  // Duration, upload date and view count only exist once YouTube metadata is
  // merged in, so these three controls match nothing in the HN-only dataset.
  const needsYouTubeMeta = (q) =>
    !HT_QUERY.hasYouTubeMeta() && (q.dur || q.date || ["date", "old", "views"].includes(q.sort));

  const metaGapNotice = (q) =>
    needsYouTubeMeta(q) ? `<div class="banner">${esc(T.metaGap.notice)}</div>` : "";

  const playAll = (list) => {
    if (!list.length) return "";
    const ids = list.slice(0, 50).map((v) => v.v);
    return `<a class="pill playall" href="${hrefWith(`#/watch/${ids[0]}`, { queue: ids.join(",") })}"
      title="按当前顺序打开观看队列">${HT_ICON("playall")}${list.length > 50 ? "按顺序看前 50 条" : esc(T.playAll)}</a>`;
  };

  const filterbar = (base, p, list, opts) => {
    opts = opts || {};
    return `<div class="filterbar">
      ${opts.noFilters ? "" : `<button class="pill${p.open ? " on" : ""}" id="filters-btn" aria-controls="filters" aria-expanded="${!!p.open}">${HT_ICON("filters")} ${esc(T.filters.button)}</button>`}
      ${!opts.noFilters && Object.keys(p).some((k) => k !== "open") ? `<a class="chip" href="${base}">清除筛选</a>` : ""}
      <span class="grow"></span>
      ${list && list.length ? playAll(list) : ""}
    </div>`;
  };

  const chips = (items, activeId, base) =>
    `<div class="catwrap">${items.map((c) =>
      `<a class="chip${c.id === activeId ? " on" : ""}" href="${base}${encodeURIComponent(c.id)}">${esc(c.name)}</a>`
    ).join("")}</div>`;

  const empty = (title, sub) =>
    `<div class="empty"><b>${esc(title)}</b>${esc(sub)}</div>`;

  let toastTimer;
  const toast = (msg) => {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("on"), 1800);
  };

  // Infinite scroll instead of numbered pages, matching the original.
  const PAGE = 40;
  function lazyGrid(host, list, renderItem, emptyHtml) {
    if (!host) return () => {};
    if (!list.length) { host.outerHTML = emptyHtml || ""; return () => {}; }
    let i = 0;
    let obs;
    const sentinel = document.createElement("button");
    sentinel.type = "button";
    sentinel.className = "sentinel pill";
    sentinel.textContent = "加载更多";
    host.appendChild(sentinel);
    const more = () => {
      const slice = list.slice(i, i + PAGE);
      i += slice.length;
      const frag = document.createElement("div");
      frag.innerHTML = slice.map(renderItem).join("");
      while (frag.firstChild) host.insertBefore(frag.firstChild, sentinel);
      if (i >= list.length) { obs?.disconnect(); sentinel.remove(); }
    };
    sentinel.addEventListener("click", more);
    more();
    if (i < list.length && "IntersectionObserver" in window) {
      obs = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) more();
      }, { rootMargin: "900px" });
      obs.observe(sentinel);
    }
    return () => { obs?.disconnect(); sentinel.removeEventListener("click", more); };
  }

  return {
    esc, thumbUrl, thumb, vcard, grid, srow, nextCard, pageHead, catTags,
    filterbar, filtersPanel, metaGapNotice, needsYouTubeMeta, chips, empty, toast, playAll, hrefWith, parseParams, lazyGrid, subLine, PAGE,
  };
})();
