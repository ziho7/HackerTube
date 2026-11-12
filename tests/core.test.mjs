import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
function runtime(saved = null, sharedStorage) {
  const storage = sharedStorage || new Map(saved === null ? [] : [["ht-zh", saved]]);
  const scripts = [];
  const context = vm.createContext({ console, Date, URLSearchParams, setTimeout, clearTimeout, Event,
    localStorage: { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
    document: { createElement: () => ({ remove() {} }), body: { appendChild: (el) => scripts.push(el) } },
    dispatchEvent() {},
  });
  context.window = context;
  for (const file of ["store", "data", "i18n", "icons", "render", "pages"]) vm.runInContext(readFileSync(join(root, `site/js/${file}.js`), "utf8"), context);
  return { c: context, scripts, storage };
}
const video = (i, fields = {}) => ({ v: `video${String(i).padStart(6, "0")}`, t: "向量与线性代数", t0: "Vectors linear algebra", c: "3Blue1Brown", p: "linear algebra", g: ["math"], a: [["pure-mathematics", "math-theory"]], y: "course", l: "intro", s: "evergreen", x: "学习向量", h: { r: 4, mo: 6, k: 2, f: 2010, l: 2026 }, o: 8, d: null, u: null, w: null, ...fields });
function dataset(c, rows) {
  c.HT_DATA.load("taxonomy", { areas: [{ id: "math-theory", name: "数学", cats: [{ id: "pure-mathematics", name: "纯数学", enName: "Mathematics" }] }] });
  c.HT_DATA.load("videos", rows);
}

test("malformed local storage recovers without losing valid records", () => {
  for (const value of ["not json", "null", "[]", '{"liked":null,"history":{},"settings":{"theme":"bogus"}}']) {
    const { c } = runtime(value);
    assert.equal(c.HT_STORE.settings().theme, "auto");
    assert.equal(c.HT_STORE.history().length, 0);
    assert.equal(c.HT_STORE.liked().length, 0);
  }
  const { c } = runtime(JSON.stringify({ liked: { video000001: 10, invalid: 20 }, history: [{ vid: "video000001", at: 10 }, { vid: "video000001", at: 30 }] }));
  assert.equal(c.HT_STORE.liked().length, 1);
  assert.equal(c.HT_STORE.history()[0].at, 30);
});

test("likes and dislikes are mutually exclusive and reset clears both", () => {
  const { c } = runtime(), s = c.HT_STORE;
  s.toggleLike("video000001"); s.toggleDislike("video000001");
  assert.equal(s.isLiked("video000001"), false);
  assert.equal(s.isDisliked("video000001"), true);
  s.set("theme", "dark"); s.clearPersonal();
  assert.equal(s.isDisliked("video000001"), false);
  assert.equal(s.settings().theme, "dark");
});

test("backup roundtrip merges without replacing records or settings", () => {
  const { c } = runtime(), s = c.HT_STORE;
  s.toggleLater("video000001"); s.pushHistory("video000001");
  const exported = JSON.parse(s.export());
  s.toggleLike("video000002"); s.set("theme", "dark");
  exported.data.liked.video000003 = 100;
  exported.data.disliked.video000003 = 200;
  s.import(JSON.stringify(exported));
  assert.equal(s.inLater("video000001"), true);
  assert.equal(s.isLiked("video000002"), true);
  assert.equal(s.isLiked("video000003"), false);
  assert.equal(s.isDisliked("video000003"), true);
  assert.equal(s.history().length, 1);
  assert.equal(s.settings().theme, "dark");
  const before = s.export();
  assert.throws(() => s.import('{"app":"other"}'));
  assert.equal(JSON.parse(s.export()).data.history.length, JSON.parse(before).data.history.length);
});

test("history is deduplicated, removable, and capped at 500", () => {
  const { c } = runtime(), s = c.HT_STORE;
  for (let i = 0; i < 510; i++) s.pushHistory(video(i).v);
  assert.equal(s.history().length, 500);
  s.pushHistory(video(10).v);
  assert.equal(s.history().length, 500);
  assert.equal(s.history()[0].vid, video(10).v);
  s.remove("history", video(10).v);
  assert.equal(s.history().length, 499);
});

test("failed persistence reports failure while keeping session state", () => {
  const { c } = runtime();
  c.localStorage.setItem = () => { throw Error("quota"); };
  let events = 0; c.dispatchEvent = () => events++;
  c.HT_STORE.toggleLater("video000001");
  assert.equal(c.HT_STORE.inLater("video000001"), true);
  assert.equal(c.HT_STORE.storageAvailable, false);
  assert.equal(events, 1);
});

test("search supports Chinese, original English, Unicode normalization, and explicit sort", () => {
  const { c } = runtime();
  dataset(c, [video(1, { o: 15, h: { r: 4, mo: 5, k: 2, f: 2007, l: 2015 } }), video(2)]);
  for (const term of ["向量", "ＶＥＣＴＯＲＳ", "linear  algebra", "3blue1brown", "数学"]) assert.equal(c.HT_QUERY.search(term, {}).length, 2, term);
  assert.equal(c.HT_QUERY.search("vectors", {})[0].v, "video000001");
  assert.equal(c.HT_QUERY.search("vectors", { sort: "recent" })[0].v, "video000002");
  assert.equal(c.HT_QUERY.search("zzzzzz", {}).length, 0);
});

test("decade and rolling year filters have correct bounds; unknown duration is excluded", () => {
  const { c } = runtime();
  dataset(c, [video(1, { u: "2009-12-31", d: 200 }), video(2, { u: "2010-01-01" }), video(3, { u: "2019-12-31", d: 4000 }), video(4, { u: "2020-01-01" }), video(5, { u: new Date().toISOString() })]);
  assert.equal(c.HT_QUERY.filter({ date: "2010s" }).map((v) => v.v).join(","), "video000002,video000003");
  assert.equal(c.HT_QUERY.filter({ date: "year" }).map((v) => v.v).join(","), "video000005");
  assert.equal(c.HT_QUERY.filter({ dur: "short" })[0].v, "video000001");
  assert.equal(c.HT_QUERY.filter({ dur: "xlong" })[0].v, "video000003");
});

test("home excludes disliked and hidden news and produces no duplicate cards", () => {
  const { c } = runtime(); dataset(c, [video(1), video(2), video(3, { s: "news" })]);
  c.HT_STORE.toggleDislike("video000001");
  const feed = c.HT_QUERY.homeFeed(60);
  assert.equal(feed.length, 1); assert.equal(feed[0][0].v, "video000002");
});

test("missing render targets are safe for empty search and unknown categories", () => {
  const { c } = runtime(); dataset(c, []);
  const ctx = { parts: ["search", "absent"], params: {}, el: { querySelector: () => null } };
  assert.match(c.HT_PAGES.search(ctx), /没有找到/);
  assert.doesNotThrow(() => c.HT_PAGES.searchMount(ctx)());
  ctx.parts = ["c", "unknown"]; assert.doesNotThrow(() => c.HT_PAGES.categoryMount(ctx)());
});

test("detail fetches deduplicate, recover after failure, and cache success", async () => {
  const { c, scripts } = runtime();
  const first = c.HT_DATA.detail("video000001"), second = c.HT_DATA.detail("video000001");
  assert.equal(scripts.length, 1);
  const a = assert.rejects(first, /加载失败/), b = assert.rejects(second, /加载失败/);
  scripts[0].onerror(); await Promise.all([a, b]);
  const retry = c.HT_DATA.detail("video000001"); assert.equal(scripts.length, 2);
  c.HT_DATA.load("detail", { video000001: { su: "详情" } }); scripts[1].onload();
  assert.equal((await retry).su, "详情");
  assert.equal((await c.HT_DATA.detail("video000001")).su, "详情"); assert.equal(scripts.length, 2);
});

test("unavailable metadata controls are disabled and queue preserves order", () => {
  const { c } = runtime(); dataset(c, [video(1), video(2)]);
  const html = c.HT_UI.filtersPanel("#/browse", {});
  assert.match(html, /aria-disabled="true"/); assert.doesNotMatch(html, /href="[^\"]*dur=/);
  assert.match(c.HT_UI.playAll(c.HT_DATA.videos), /watch\/video000001\?queue=video000001%2Cvideo000002/);
  const page = c.HT_PAGES.watch({ parts: ["watch", "video000001"], params: { queue: "video000001,missing,video000002" } });
  assert.match(page, /观看队列 · 1 \/ 2/); assert.match(page, /下一条/);
});

test("build merges Chinese by ID, falls back to English, and omits unavailable videos", () => {
  const temp = mkdtempSync(join(tmpdir(), "hackertube-build-"));
  try {
    const src = join(temp, "src"), out = join(temp, "out"); mkdirSync(src);
    const original = JSON.parse(readFileSync(join(root, "data/hackertube-data/videos.jsonl"), "utf8").split("\n")[0]);
    const rows = [1, 2, 3].map((i) => ({ ...original, vid: video(i).v }));
    const jsonl = (name, values) => writeFileSync(join(src, name), values.map((x) => JSON.stringify(x)).join("\n"));
    jsonl("videos.jsonl", rows);
    jsonl("videos.zh.jsonl", [{ vid: video(1).v, title_zh: "中文标题", summary_zh: "中文摘要" }]);
    jsonl("youtube_meta.jsonl", [{ vid: video(3).v, item: null }]);
    writeFileSync(join(src, "taxonomy.json"), readFileSync(join(root, "data/hackertube-data/taxonomy.json")));
    const result = spawnSync(process.execPath, [join(root, "tools/build-data.mjs"), "--src", src, "--out", out], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const { c } = runtime();
    for (const name of ["meta", "taxonomy", "videos"]) vm.runInContext(readFileSync(join(out, `${name}.js`), "utf8"), c);
    assert.equal(c.HT_DATA.videos.length, 2); assert.equal(c.HT_DATA.video(video(1).v).t, "中文标题");
    assert.equal(c.HT_DATA.video(video(1).v).x, "中文摘要"); assert.equal(c.HT_DATA.video(video(2).v).t, original.title);
    assert.equal(c.HT_DATA.video(video(1).v).t0, original.title); assert.equal(c.HT_DATA.meta.translatedCount, 1);
    assert.equal(c.HT_DATA.video(video(2).v).b, null);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});


test("older tabs preserve newer saved records and receive removals", () => {
  const shared = new Map();
  const a = runtime(null, shared).c.HT_STORE, b = runtime(null, shared).c.HT_STORE;
  a.toggleLater("video000001"); b.toggleLater("video000002");
  assert.equal(b.inLater("video000001"), true);
  assert.equal(a.sync(), true); assert.equal(a.inLater("video000002"), true);
  b.remove("later", "video000001"); a.set("theme", "dark");
  assert.equal(a.inLater("video000001"), false);
  assert.equal(a.inLater("video000002"), true);
  b.sync(); assert.equal(b.settings().theme, "dark");
  shared.delete("ht-zh"); assert.equal(a.sync(), true);
  assert.equal(a.inLater("video000002"), false);
});

test("disliked library allows reversing an exclusion", () => {
  const { c } = runtime(); dataset(c, [video(1)]);
  c.HT_STORE.toggleDislike("video000001");
  assert.match(c.HT_PAGES.collection("disliked"), /data-remove="disliked"/);
  c.HT_STORE.remove("disliked", "video000001");
  assert.equal(c.HT_QUERY.homeFeed(1).length, 1);
  assert.match(c.HT_PAGES.collection("disliked"), /还没有标记/);
});

test("a stalled detail request times out and a late callback cannot finish its retry", async () => {
  const { c, scripts } = runtime();
  let timeout; c.setTimeout = (callback) => { timeout = callback; return 1; }; c.clearTimeout = () => {};
  const failed = c.HT_DATA.detail("video000001"), oldLoad = scripts[0].onload;
  const rejected = assert.rejects(failed, /超时/); timeout(); await rejected;
  const retry = c.HT_DATA.detail("video000001"); oldLoad();
  assert.equal(scripts.length, 2);
  c.HT_DATA.load("detail", { video000001: { su: "重试成功" } }); scripts[1].onload();
  assert.equal((await retry).su, "重试成功");
});
