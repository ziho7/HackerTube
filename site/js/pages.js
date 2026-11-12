window.HT_PAGES = (function () {
  const T = HT_T, U = HT_UI, esc = U.esc;
  const p = (ctx) => ctx.params;

  /* ---------- home ---------- */

  function home(ctx) {
    const feed = HT_QUERY.homeFeed(60);
    return `<div class="explore">
      <div class="home-toolbar">
      <nav class="quick" aria-label="快速发现">
        <a class="chip on" href="#/">为你发现</a>
        <a class="chip" href="#/browse?sort=recent">最近被推荐</a>
        <a class="chip" href="#/browse?gems=1">冷门宝藏</a>
        <a class="chip" href="#/browse?evergreen=1">常青内容</a>
        <a class="chip" href="#/playlists">主题播单</a>
        <a class="chip" href="#/browse">全部视频</a>
      </nav>
      ${U.playAll(feed.map((f) => f[0]))}
      </div>
      <div class="grid" id="feed"></div>
    </div>`;
  }

  function homeMount(ctx) {
    const feed = HT_QUERY.homeFeed(60);
    const host = ctx.el.querySelector("#feed");
    return U.lazyGrid(host, feed, ([v, reason]) => U.vcard(v, reason));
  }

  /* ---------- browse ---------- */

  const browseTitle = (q) =>
    q.dur === "xlong" ? T.nav.longs
    : q.gems ? T.filters.featureOpts.gems
    : q.sort === "recent" ? T.quick.recent
    : "全部视频";

  function browse(ctx) {
    const q = p(ctx);
    const filtered = HT_QUERY.sort(HT_QUERY.filter(q), q.sort);
    const title = browseTitle(q);
    return `<div class="explore">
      ${U.pageHead(title, { sub: `${filtered.length} 个视频` })}
      ${U.filterbar("#/browse", q, filtered)}
      ${U.filtersPanel("#/browse", q)}
      ${U.metaGapNotice(q)}
      <div class="grid" id="list"></div>
    </div>`;
  }

  const filterEmpty = (q) => U.empty(...(U.needsYouTubeMeta(q) ? T.metaGap.empty : T.emptyFilter));

  const browseMount = (ctx) => {
    const q = p(ctx);
    const list = HT_QUERY.sort(HT_QUERY.filter(q), q.sort);
    return U.lazyGrid(ctx.el.querySelector("#list"), list, (v) => U.vcard(v), filterEmpty(q));
  };

  /* ---------- search ---------- */

  function search(ctx) {
    const term = ctx.parts[1] || "";
    const q = p(ctx);
    const list = HT_QUERY.search(term, q);
    return `<div class="plpage">
      ${U.filterbar(`#/search/${encodeURIComponent(term)}`, { ...q, open: !!q.open }, list)}
      ${U.filtersPanel(`#/search/${encodeURIComponent(term)}`, q)}
      ${U.metaGapNotice(q)}
      ${list.length
        ? `<p class="note">${T.resultCount(list.length)} · “${esc(term)}”</p><div class="results" id="list"></div>`
        : U.empty(...(U.needsYouTubeMeta(q) ? T.metaGap.empty : T.emptySearch))}
    </div>`;
  }

  function searchMount(ctx) {
    const term = ctx.parts[1] || "";
    const list = HT_QUERY.search(term, p(ctx));
    return U.lazyGrid(ctx.el.querySelector("#list"), list, (v) => U.srow(v, { snippet: true }));
  }

  /* ---------- categories ---------- */

  function categories() {
    const areas = HT_DATA.areas;
    return `<div class="explore">
      ${U.pageHead(T.categories.title, { sub: T.categories.lede })}
      <div class="quick">
        ${[[T.quick.recent, "#/browse?sort=recent"], ...(HT_QUERY.hasYouTubeMeta() ? [[T.quick.longs, "#/browse?dur=xlong"]] : []),
           [T.quick.gems, "#/browse?gems=1"], [T.quick.all, "#/browse"]]
          .map(([label, href]) => `<a class="pill" href="${href}">${esc(label)}</a>`).join("")}
      </div>
      <div class="areas">
        ${areas.map((a) => `<section class="areacard">
          <a class="areaname" href="#/a/${esc(a.id)}">${esc(a.name)}<span class="count">${a.count}</span></a>
          <div class="cats">${a.cats.filter((c) => c.count).slice(0, 12).map((c) =>
            `<a href="#/c/${esc(c.id)}">${esc(c.name)}<span class="count">${c.count}</span></a>`).join("")}</div>
        </section>`).join("")}
      </div>
    </div>`;
  }

  const area = (ctx) => {
    const a = HT_DATA.areas.find((x) => x.id === ctx.parts[1]);
    if (!a) return notFound();
    HT_STORE.markSeen("area:" + a.id);
    const q = p(ctx);
    const list = HT_QUERY.sort(HT_QUERY.filter({ ...q, area: a.id }), q.sort);
    return `<div class="explore">
      ${U.pageHead(a.name, { sub: `${list.length} 个视频 · ${a.enName}` })}
      <div class="catwrap">
        ${a.cats.filter((c) => c.count).map((c) =>
          `<a class="chip" href="#/c/${esc(c.id)}">${esc(c.name)} ${c.count}</a>`).join("")}
      </div>
      ${U.filterbar(`#/a/${a.id}`, q, list)}
      ${U.filtersPanel(`#/a/${a.id}`, q)}
      ${U.metaGapNotice(q)}
      <div class="grid" id="list"></div>
    </div>`;
  };
  const areaMount = (ctx) => {
    const q = p(ctx);
    const list = HT_QUERY.sort(HT_QUERY.filter({ ...q, area: ctx.parts[1] }), q.sort);
    return U.lazyGrid(ctx.el.querySelector("#list"), list, (v) => U.vcard(v), filterEmpty(q));
  };

  const category = (ctx) => {
    const c = HT_DATA.cat(ctx.parts[1]);
    if (!c) return notFound();
    HT_STORE.markSeen("cat:" + c.id);
    const q = p(ctx);
    const list = HT_QUERY.sort(HT_QUERY.filter({ ...q, cat: c.id }), q.sort);
    return `<div class="explore">
      ${U.pageHead(c.name, { crumb: { href: `#/a/${c.area}`, text: c.areaName }, sub: `${list.length} 个视频 · ${c.enName}` })}
      ${U.filterbar(`#/c/${c.id}`, q, list)}
      ${U.filtersPanel(`#/c/${c.id}`, q)}
      ${U.metaGapNotice(q)}
      <div class="grid" id="list"></div>
    </div>`;
  };
  const categoryMount = (ctx) => {
    const q = p(ctx);
    const list = HT_QUERY.sort(HT_QUERY.filter({ ...q, cat: ctx.parts[1] }), q.sort);
    return U.lazyGrid(ctx.el.querySelector("#list"), list, (v) => U.vcard(v), filterEmpty(q));
  };

  /* ---------- watch ---------- */

  const commentBody = (text) => esc(text)
    .replace(/\[VIDEO\]/g, `<span class="mk v">${T.watch.thisVideo}</span>`)
    .replace(/\[LINK\]/g, `<span class="mk">${esc("链接")}</span>`);

  function watch(ctx) {
    const vid = ctx.parts[1];
    const v = HT_DATA.video(vid);
    if (!v) return U.empty("找不到这个视频", `数据里没有 ${vid}。`);
    HT_STORE.pushHistory(vid);
    const cats = U.catTags(v);
    const meta = [
      HT_QUERY.fmtViews(v.w) ? `${HT_QUERY.fmtViews(v.w)}次观看` : null,
      HT_QUERY.fmtAgo(v.u),
      T.typeOf(v.y),
      T.shelfOf(v.s),
    ].filter(Boolean).join(" · ");
    const hnLine = [
      T.watch.recommenders(v.h.r),
      T.watch.months(v.h.mo, v.h.f === v.h.l ? String(v.h.f) : `${v.h.f}–${v.h.l}`),
    ].join(" · ");

    return `<div class="watch">
      <div class="primary">
        <div class="player" id="player">
          <button class="poster" id="poster" aria-label="播放：${esc(v.t)}">
            <img src="${U.thumbUrl(vid)}" data-vid="${esc(vid)}" onerror="thumbFallback(this)" alt="">
            <span class="play">${HT_ICON("play")}</span>
          </button>
        </div>
        ${queuePanel(ctx, vid)}
        <h1>${esc(v.t)}</h1>
        ${v.t0 && v.t0 !== v.t ? `<p class="original-title" lang="en">${esc(v.t0)}</p>` : ""}
        <div class="owner">
          <div class="who"><div><b><a href="#/channel/${encodeURIComponent(v.c)}">${esc(v.c)}</a></b><span class="sub">${esc(hnLine)}</span></div></div>
          <div class="actions">
            <div class="seg">
              <button id="like" aria-pressed="${HT_STORE.isLiked(vid)}" class="${HT_STORE.isLiked(vid) ? "on" : ""}">${HT_ICON("like")}<span>${T.watch.like}</span></button>
              <button id="dislike" aria-pressed="${HT_STORE.isDisliked(vid)}" class="${HT_STORE.isDisliked(vid) ? "on" : ""}" aria-label="${T.watch.dislike}">${HT_ICON("dislike")}</button>
            </div>
            <button class="pill${HT_STORE.inLater(vid) ? " on" : ""}" aria-pressed="${HT_STORE.inLater(vid)}" id="save-later">${HT_ICON("clock")}${T.watch.later}</button>
            <a class="pill" href="https://www.youtube.com/watch?v=${esc(vid)}" target="_blank" rel="noopener">${HT_ICON("external")}${T.watch.youTube}</a>
          </div>
        </div>
        <div class="desc" id="desc">
          <div class="top-line">${esc(meta || hnLine)}</div>
          <p id="summary">${esc(v.x)}</p>
          <p class="why" id="why"></p>
          <div class="tags">
            ${cats.map((c) => `<a class="tag cat" href="#/c/${esc(c.id)}">${esc(c.name)}</a>`).join("")}
            ${(v.g || []).slice(0, 8).map((t) => `<a class="tag" href="#/search/${encodeURIComponent(t)}">#${esc(t)}</a>`).join("")}
          </div>
        </div>
        <div class="comments" id="comments" aria-live="polite"><p class="note">正在加载 HN 讨论…</p></div>
      </div>
      <div class="secondary" id="related"><p class="sub">${esc(T.watch.related)}…</p></div>
    </div>`;
  }

  function queuePanel(ctx, vid) {
    const ids = [...new Set((ctx.params.queue || "").split(","))].filter((id) => HT_DATA.video(id)).slice(0, 50);
    const i = ids.indexOf(vid);
    if (i < 0) return "";
    const link = (index, label) => `<a class="chip" href="${U.hrefWith(`#/watch/${ids[index]}`, { queue: ids.join(",") })}">${label}</a>`;
    return `<nav class="watch-queue" aria-label="观看队列"><span>观看队列 · ${i + 1} / ${ids.length}</span><div>${i > 0 ? link(i - 1, "上一条") : ""}${i < ids.length - 1 ? link(i + 1, "下一条") : `<span class="sub">已到最后一条</span>`}</div></nav>`;
  }

  function watchMount(ctx) {
    const vid = ctx.parts[1];
    const v = HT_DATA.video(vid);
    if (!v) return;
    ctx.el.querySelector("#poster").addEventListener("click", () => {
      const player = ctx.el.querySelector("#player");
      if (v.b === false) { player.innerHTML = `<p class="player-message">${T.watch.notEmbeddable} <a href="https://www.youtube.com/watch?v=${encodeURIComponent(vid)}" target="_blank" rel="noopener">前往 YouTube ↗</a></p>`; return; }
      player.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid)}?autoplay=1&rel=0"
        title="${esc(v.t)}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    });

    const loadDetails = () => HT_DATA.detail(vid).then((d) => {
      if (!ctx.active) return;
      if (d.su) ctx.el.querySelector("#summary").textContent = d.su;
      if (d.wy) ctx.el.querySelector("#why").textContent = d.wy;

      const mentions = d.m || [];
      const comments = ctx.el.querySelector("#comments");
      comments.innerHTML = mentions.length
        ? `<h2>${esc(T.watch.comments(mentions.length))}</h2>` + mentions.map((m) => `
            <div class="cmt">
              <div class="avatar">${esc((m.author || "?").slice(0, 1).toUpperCase())}</div>
              <div class="body">
                <div class="meta"><b>@${esc(m.author)}</b>${esc((m.month || "").slice(0, 4))} · in “${esc(m.story)}”</div>
                <p>${commentBody(m.text)}</p>
                <div class="foot">
                  <span class="stance ${esc(m.stance)}">${esc(T.stance[m.stance] || m.stance)}</span>
                  ${m.why ? `<span>${esc(m.why)}</span>` : ""}
                  <a href="https://news.ycombinator.com/item?id=${encodeURIComponent(m.id)}" target="_blank" rel="noopener">${esc(T.watch.viewOnHn)}</a>
                </div>
              </div>
            </div>`).join("")
        : `<p class="note">暂时没有可展示的 HN 讨论。</p>`;

      const related = (d.r || []).map(([id, shared]) => [HT_DATA.video(id), shared]).filter(([x]) => x);
      const host = ctx.el.querySelector("#related");
      if (related.length) {
        host.innerHTML = `<h3 class="sechead" style="margin-top:0;font-size:16px">${esc(T.watch.related)}</h3>` +
          related.map(([rv, shared]) => U.nextCard(rv, `${shared} 位共同推荐人`)).join("");
      } else {
        const cats = new Set(v.a.map((c) => c[0]));
        const fallback = HT_DATA.videos.filter((x) => x.v !== vid && x.a.some((c) => cats.has(c[0]))).slice(0, 12);
        host.innerHTML = fallback.length
          ? `<h3 class="sechead" style="margin-top:0;font-size:16px">同主题</h3>` + fallback.map((rv) => U.nextCard(rv)).join("")
          : "";
      }
    }).catch(() => {
      if (!ctx.active) return;
      ctx.el.querySelector("#comments").innerHTML = `<div class="banner">讨论加载失败，请检查网络后重试。 <button class="chip" id="retry-detail">重新加载</button></div>`;
      ctx.el.querySelector("#related").innerHTML = "";
      ctx.el.querySelector("#retry-detail").addEventListener("click", (e) => { e.target.disabled = true; e.target.textContent = "加载中…"; loadDetails(); });
    });
    loadDetails();
  }

  /* ---------- playlists ---------- */

  function playlists() {
    const list = HT_DATA.playlists;
    return `<div class="explore">
      ${U.pageHead(T.playlistsPage.title, { sub: T.playlistsPage.lede })}
      <h3 class="sechead">${esc(T.playlistsPage.startHere)}</h3>
      <p class="sub">${esc(T.playlistsPage.startHereSub)}</p>
      <div class="pgrid">
        ${list.map((pl) => {
          const vids = pl.videos.map((x) => HT_DATA.video(x.vid)).filter(Boolean);
          return `<a class="plcard" href="#/p/${esc(pl.id)}">
            <div class="mosaic">${vids.slice(0, 4).map((v) =>
              `<img loading="lazy" src="${U.thumbUrl(v.v)}" onerror="thumbFallback(this)" alt="">`).join("")}
              <span class="plcount">${esc(T.playlistsPage.count(vids.length, pl.hasDurations ? HT_QUERY.fmtSpan(pl.seconds) : ""))}</span>
            </div>
            <h3 class="vt">${esc(pl.name)}</h3>
            <p class="sub">${esc(pl.desc)}</p>
          </a>`;
        }).join("")}
      </div>
    </div>`;
  }

  function playlist(ctx) {
    const pl = HT_DATA.playlists.find((x) => x.id === ctx.parts[1]);
    if (!pl) return notFound();
    const items = pl.videos.map((x) => [HT_DATA.video(x.vid), x.note]).filter(([v]) => v);
    const vids = items.map(([v]) => v);
    return `<div class="plpage">
      <div class="plhead">
        <div class="mosaic">${vids.slice(0, 4).map((v) =>
          `<img src="${U.thumbUrl(v.v)}" onerror="thumbFallback(this)" alt="">`).join("")}</div>
        <div class="plinfo">
          <a class="crumb" href="#/playlists">${esc(T.nav.playlists)}</a>
          <h2>${esc(pl.name)}</h2>
          <div class="sub">${esc(T.playlistsPage.count(vids.length, pl.hasDurations ? HT_QUERY.fmtSpan(pl.seconds) : ""))} · 按观看顺序</div>
          <p class="intro">${esc(pl.desc)}</p>
          ${U.filterbar("", {}, vids, { noFilters: true })}
        </div>
      </div>
      <ol class="plrows">
        ${items.map(([v, note], i) => `<li><span class="num">${i + 1}</span>${U.srow(v, { note })}</li>`).join("")}
      </ol>
    </div>`;
  }

  /* ---------- personal collections ---------- */

  const byTime = (map) => Object.entries(map).sort((a, b) => b[1] - a[1]).map(([vid]) => HT_DATA.video(vid)).filter(Boolean);

  function collection(kind) {
    const copy = { liked: T.liked, disliked: T.disliked, history: T.history, later: T.later }[kind];
    let list;
    if (["liked", "disliked", "later"].includes(kind)) list = byTime(HT_STORE.state[kind]);
    else list = HT_STORE.history().map((h) => HT_DATA.video(h.vid)).filter(Boolean);
    const head = U.pageHead(copy.title, { sub: list.length ? `${list.length} 个视频` : "" });
    if (!list.length) return `<div class="explore">${head}${U.empty(copy.empty[0], copy.empty[1])}</div>`;
    return `<div class="explore">
      ${head}
      ${U.filterbar("", {}, list, { noFilters: true })}
      <div class="grid">${list.map((v) => `<div class="collection-card">${U.vcard(v)}<button class="remove-item" data-remove="${kind}" data-vid="${esc(v.v)}" aria-label="移除：${esc(v.t)}">${HT_ICON("trash")}移除</button></div>`).join("")}</div>
    </div>`;
  }

  /* ---------- settings ---------- */

  function settings() {
    const s = HT_STORE.settings();
    const sw = (id, on) => `<span class="switch"><input type="checkbox" id="${id}"${on ? " checked" : ""}><span class="knob"></span></span>`;
    return `<div class="settings">
      ${U.pageHead(T.settings.title)}
      <label class="setting"><div><b>${esc(T.settings.frames[0])}</b><p>${esc(T.settings.frames[1])}</p></div>${sw("frames-toggle", s.frames)}</label>
      <label class="setting"><div><b>${esc(T.settings.hideNews[0])}</b><p>${esc(T.settings.hideNews[1])}</p></div>${sw("news-toggle", s.hideNews)}</label>
      <label class="setting"><div><b>${esc(T.settings.collapsed[0])}</b><p>${esc(T.settings.collapsed[1])}</p></div>${sw("collapse-toggle", s.collapsed)}</label>
      <div class="setting" style="cursor:default">
        <div><b>备份你的收藏</b><p>导出点赞、稍后再看和历史。导入时合并记录，保留当前显示设置。</p></div>
        <div class="row"><button class="pill" id="export-data">导出</button><button class="pill" id="import-data">导入</button><input type="file" id="backup-file" accept=".json,application/json" hidden></div>
      </div>
      <div class="setting" style="cursor:default">
        <div><b>${esc(T.settings.theme[0])}</b><p>${esc(T.settings.theme[1])}</p></div>
        <div class="row">
          ${["auto", "light", "dark"].map((k) =>
            `<button class="chip${s.theme === k ? " on" : ""}" data-theme-set="${k}">${esc(T.settings.themeOpts[k])}</button>`).join("")}
        </div>
      </div>
      <div class="setting" style="cursor:default">
        <div><b>${esc(T.settings.reset[0])}</b><p>${esc(T.settings.reset[1])}</p></div>
        <button class="pill" id="reset">${HT_ICON("trash")}${esc(T.settings.resetBtn)}</button>
      </div>
      <p class="note">${esc(T.metaNote)}</p>
    </div>`;
  }

  function settingsMount(ctx) {
    const set = (k, v) => { HT_STORE.set(k, v); HT_APP.applySettings(); };
    ctx.el.querySelector("#frames-toggle").addEventListener("change", (e) => set("frames", e.target.checked));
    ctx.el.querySelector("#news-toggle").addEventListener("change", (e) => set("hideNews", e.target.checked));
    ctx.el.querySelector("#collapse-toggle").addEventListener("change", (e) => set("collapsed", e.target.checked));
    ctx.el.querySelectorAll("[data-theme-set]").forEach((b) =>
      b.addEventListener("click", () => set("theme", b.dataset.themeSet)));
    ctx.el.querySelector("#export-data").addEventListener("click", () => {
      const url = URL.createObjectURL(new Blob([HT_STORE.export()], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url;
      a.download = `hackertube-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const file = ctx.el.querySelector("#backup-file");
    ctx.el.querySelector("#import-data").addEventListener("click", () => file.click());
    file.addEventListener("change", async () => {
      const selected = file.files[0];
      if (!selected) return;
      try {
        if (selected.size > 5 * 1024 * 1024) throw new Error("备份文件不能大于 5 MB。");
        HT_STORE.import(await selected.text()); U.toast("记录已合并");
      } catch (error) { U.toast(error instanceof SyntaxError ? "文件不是有效的 JSON 备份。" : error.message); }
      file.value = "";
    });
    ctx.el.querySelector("#reset").addEventListener("click", () => {
      if (!window.confirm("清空点赞、不喜欢、历史和稍后再看？此操作无法撤销，建议先导出备份。")) return;
      HT_STORE.clearPersonal();
      U.toast(T.toast.cleared);
      HT_APP.render();
    });
  }

  /* ---------- about ---------- */

  function about() {
    const m = HT_DATA.meta;
    const n = (x) => Number(x).toLocaleString("zh-CN");
    return `<div class="about">
      <h1>${esc(T.about.title)}</h1>
      <p class="lede">${esc(T.about.lede)}</p>
      <p><a href="https://github.com/ziho7/HackerTube" target="_blank" rel="noopener">GitHub 开源代码 ↗</a> · 项目代码采用 MIT 许可，数据保留 ODC-By 1.0 许可。</p>
      <div class="stats">
        <div class="stat"><b>${n(m.videoCount)}</b><span>${esc(T.about.stats.videos)}</span></div>
        <div class="stat"><b>${n(m.mentionCount)}</b><span>${esc(T.about.stats.comments)}</span></div>
        <div class="stat"><b>${m.categories}</b><span>${esc(T.about.stats.topics)}</span></div>
        <div class="stat"><b>${m.yearSpan ? m.yearSpan[0] + "–" + m.yearSpan[1] : "—"}</b><span>${esc(T.about.stats.years)}</span></div>
      </div>
      <h2>${esc(T.about.why)}</h2>
      <p>YouTube 的推荐目标是观看时长。它非常擅长找到你会点开的下一个视频，但不太擅长找到明年还会让你想起的那场演讲。</p>
      <p>而过去将近二十年里，Hacker News 的评论者一直在互相指路：那个改变了某人写软件方式的大会演讲，那套终于让某个科目开窍的课程，那部没人知道的纪录片。这些推荐散落在几百万条评论里。这里把它们收集起来，变成可以浏览、可以搜索、可以按自己口味沉淀的东西。</p>
      <h2>${esc(T.about.how)}</h2>
      <ol class="steps">
        <li>读完整份 Hacker News。2007 到 2026 年的每一条评论都被扫过一遍，找出里面的 YouTube 链接。</li>
        <li>只留下 HN 反复回来的视频。至少 3 个人、至少 3 个不同的月份提到过，才算数；一次性链接和顺手一转的都被筛掉。</li>
        <li>用模型逐条读评论。链接不等于推荐。模型会连同该评论所在的帖子标题一起判断：是在推荐、引用、玩梗，还是在批评，并摘出一句原话和几个主题。</li>
        <li>为每个视频写一张卡片。根据 YouTube 信息和 HN 说过的话，生成摘要、为什么 HN 喜欢它、属于什么类型、有没有过时。</li>
        <li>按长期推荐排序。一个视频的分量来自有多少个不同的月份人们推荐过它，而不是某一次爆发。</li>
      </ol>
      <h2>${esc(T.about.can)}</h2>
      <ul>
        <li>首页混合了多种来源：HN 经典、冷门宝藏、最近被提到的、你还没探索过的领域，以及和你喜欢的视频相近的内容。把鼠标移到卡片上可以看到它为什么在这里。</li>
        <li>支持中英文标题、频道、主题、标签和中文摘要的关键词搜索。</li>
        <li>在分类页按主题浏览，或者从播单开始。</li>
        <li>每个视频页都会展示 HN 真实说过的话，并链回原帖。</li>
        <li>点赞、稍后再看、历史都按你预期的方式工作，点赞会调整首页。按 <kbd>?</kbd> 看全部快捷键。</li>
      </ul>
      <h2>${esc(T.about.fork)}</h2>
      <p>界面是纯静态的，没有构建步骤。数据全部来自 <code>site/data/</code> 下的 JS 包，由 <code>tools/build-data.mjs</code> 从 JSONL 生成。</p>
      <p>生成数据时会按视频 ID 合并 <code>videos.zh.jsonl</code> 中的中文标题与摘要；未翻译的条目使用原文。更新数据后执行 <code>npm run build:data</code>，刷新页面即可。</p>
      <p class="banner"><b>当前数据</b>：${esc(m.source || "")} · 生成于 ${esc(m.generatedAt || "")}。${esc(T.metaNote)}</p>
      <p class="fine">视频标题、频道名、摘要与 HN 评论版权归其作者。数据来自 <a href="https://hackertube.org" target="_blank" rel="noopener">HackerTube</a>（ODC-By v1.0）与 <a href="https://huggingface.co/datasets/open-index/hacker-news" target="_blank" rel="noopener">open-index/hacker-news</a>，HN 数据由 Y Combinator 提供。本站与 YouTube、Google、Hacker News、Y Combinator 无隶属关系。</p>
    </div>`;
  }

  const notFound = () => U.empty("页面不存在", "地址可能过期了，或者拼错了。");

  const channel = (ctx) => {
    const q = p(ctx);
    const name = ctx.parts[1] || "";
    const list = HT_QUERY.sort(HT_QUERY.filter({ ...q, channel: name }), q.sort);
    const href = `#/channel/${encodeURIComponent(name)}`;
    return `<div class="explore">
      ${U.pageHead(name, { sub: `${list.length} 个视频` })}
      ${U.filterbar(href, q, list)}
      ${U.filtersPanel(href, q)}
      ${U.metaGapNotice(q)}
      <div class="grid" id="list"></div>
    </div>`;
  };
  const channelMount = (ctx) => {
    const q = p(ctx);
    const list = HT_QUERY.sort(HT_QUERY.filter({ ...q, channel: ctx.parts[1] || "" }), q.sort);
    return U.lazyGrid(ctx.el.querySelector("#list"), list, (v) => U.vcard(v), filterEmpty(q));
  };

  return {
    home, homeMount, browse, browseMount, browseTitle, categories, area, areaMount, category, categoryMount,
    search, searchMount, watch, watchMount, playlists, playlist,
    collection, settings, settingsMount, about, channel, channelMount, notFound,
  };
})();
