import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const previewRoot = new URL("../app/_sites-preview/", import.meta.url);

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

test("server-renders the sample size calculator shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>StudySize Studio<\/title>/i);
  assert.match(html, /Your one-stop solution for medical research/i);
  assert.match(html, /How to cite us/);
  assert.match(html, /Find my calculator/);
  assert.match(html, /Randomiser/);
  assert.match(html, /Scenario Comparison/);
  assert.match(html, /Study Design/);
  assert.match(html, /StudySize Studio version 1\.19 © Ryalino, 2026\./);
  assert.match(html, /What is the main purpose of the study/);
  assert.match(html, /Calculator catalog/);
  assert.doesNotMatch(html, /Prevalence \/ Single Proportion|Two Independent Means|Saved scenarios/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape|Export citation and references|Research tools|Your one-stop solution for research preparation|Reporting Checklist Helper/);
});

test("removes disposable starter references", async () => {
  const [page, layout, packageJson, app, files] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/sample-size-app.tsx", import.meta.url), "utf8"),
    readdir(previewRoot),
  ]);

  assert.deepEqual(files, []);
  assert.match(page, /<SampleSizeApp \/>/);
  assert.match(layout, /title:\s*"StudySize Studio"/);
  assert.match(app, /The Method section should at least describe the following:/);
  assert.match(app, /bmjopen\.bmj\.com\/content\/bmjopen\/15\/10\/e104236\/DC2\/embed\/inline-supplementary-material-2\.pdf\?download=true/);
  assert.match(app, /Find your study design/);
  assert.match(app, /Reporting checklists improve transparency/);
  assert.match(app, /https:\/\/sample-size-studio\.ryalino\.workers\.dev/);
  assert.doesNotMatch(app, /studysize-studio\.ryalino651800\.chatgpt\.site/);
  assert.match(app, /Harvard\/APA/);
  assert.match(app, /Copy citation/);
  assert.match(app, /Clear scenarios/);
  assert.match(app, /twoProportionSampleSize/);
  assert.match(app, /normaliseBlockSize/);
  assert.match(app, /Not estimable/);
  assert.match(app, /className="result-card adjusted"/);
  assert.match(app, /useState<RandomisationMethod>\("simple"\)/);
  assert.match(app, /makeTablePdf\("StudySize Studio Randomisation"/);
  assert.match(app, /makeTablePdf\("StudySize Studio Randomisation Log"/);
  assert.match(app, /type Language = "en" \| "id" \| "nl"/);
  assert.match(app, /Schakel naar Nederlands/);
  assert.match(app, /className="choice-icon"/);
  assert.match(app, /wrapPdfLines/);
  assert.match(app, /showScenarioModal/);
  assert.doesNotMatch(app, /hero-logo/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});

test("ships generated favicon asset", async () => {
  const favicon = await stat(new URL("../public/favicon.png", import.meta.url));
  assert.ok(favicon.size > 1000);
});
