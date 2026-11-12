import test from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import { once } from "node:events";
import { createStaticServer } from "../tools/serve.mjs";

const server = createStaticServer();
server.listen(0, "127.0.0.1");
await once(server, "listening");
const port = server.address().port;
function get(path, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method }, (res) => {
      let body = ""; res.setEncoding("utf8"); res.on("data", (c) => body += c);
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject); req.end();
  });
}
test.after(() => new Promise((resolve) => server.close(resolve)));

test("static server serves HTML and scripts with correct MIME and HEAD support", async () => {
  const index = await get("/"); assert.equal(index.status, 200); assert.match(index.body, /黑客tube/);
  const script = await get("/js/app.js"); assert.match(script.headers["content-type"], /javascript/);
  const head = await get("/", "HEAD"); assert.equal(head.status, 200); assert.equal(head.body, "");
  assert.equal(head.headers["content-length"], index.headers["content-length"]);
});

test("missing assets return 404 instead of HTML disguised as JS", async () => {
  const missing = await get("/data/detail-missing.js"); assert.equal(missing.status, 404);
  assert.doesNotMatch(missing.body, /<html/);
});

test("malformed URLs and traversal never crash or escape the static root", async () => {
  assert.equal((await get("/%E0%A4%A")).status, 400);
  assert.equal((await get("/%00")).status, 400);
  assert.equal((await get("/..%2fsite-private%2fsecret.txt")).status, 403);
  assert.equal((await get("/")).status, 200);
  assert.equal((await get("/", "POST")).status, 405);
});
