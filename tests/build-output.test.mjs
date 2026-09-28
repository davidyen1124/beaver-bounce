import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const dist = new URL("../dist/", import.meta.url);

test("builds the Beaver Bounce page", async () => {
  const html = await readFile(new URL("index.html", dist), "utf8");
  assert.match(html, /<title>Beaver Bounce<\/title>/i);
  assert.match(html, /<div id="root"><\/div>/);
  await access(new URL("beaver.png", dist));
});

test("uses relative asset paths so it works under /beaver-bounce/", async () => {
  const html = await readFile(new URL("index.html", dist), "utf8");
  assert.match(html, /<link rel="icon" type="image\/png" href="\.\/beaver\.png"/);
  assert.match(html, /<script type="module" crossorigin src="\.\/assets\/[^"]+\.js"/);
  assert.doesNotMatch(html, /(?:src|href)="\/(?!\/)/);
});
