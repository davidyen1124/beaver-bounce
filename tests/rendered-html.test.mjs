import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders Beaver Bounce", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Beaver Bounce<\/title>/i);
  assert.match(html, /class="screensaver"/);
  assert.match(html, /A beaver in a swim ring bouncing around the screen/);
  assert.match(html, /src="\/beaver\.png"/);
});

test("packages the ChatGPT Sites metadata", async () => {
  const [source, packaged] = await Promise.all([
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../dist/.openai/hosting.json", import.meta.url), "utf8"),
  ]);

  const sourceConfig = JSON.parse(source);
  assert.deepEqual(JSON.parse(packaged), sourceConfig);
  assert.match(sourceConfig.project_id, /^appgprj_/);
  assert.equal(sourceConfig.d1, null);
  assert.equal(sourceConfig.r2, null);
  await assert.rejects(access(new URL("../dist/.openai/drizzle", import.meta.url)));
});
