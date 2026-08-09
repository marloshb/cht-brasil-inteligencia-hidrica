import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the CHT Brasil mission-critical shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>CHT Brasil/);
  assert.match(html, /Cadastro Hídrico Territorial/);
  assert.match(html, /Torre de Controle/);
  assert.match(html, /Quadro geoespacial comum/);
  assert.match(html, /Jornadas ponta a ponta/);
  assert.match(html, /Fila de decisão humana/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/);
});

test("preserves the M0-M12 product catalog and governed agents", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (let index = 0; index <= 12; index += 1) {
    assert.match(page, new RegExp(`code: "M${index}"`));
  }
  assert.match(page, /Ampliação de captação/);
  assert.match(page, /Vistoria inteligente/);
  assert.match(page, /Crise hídrica/);
  assert.match(page, /GeoRAG Normativo/);
  assert.match(page, /Assistente de Vistoria/);
  assert.match(page, /Despachos e Exigências/);
  assert.match(page, /Aprovação humana/);
  assert.match(page, /Pausar e assumir/);
});

test("implements the connected M0 control tower workflows", async () => {
  const tower = await readFile(new URL("../app/control-tower.tsx", import.meta.url), "utf8");
  for (const view of [
    "Visão nacional",
    "Mapa operacional",
    "Alertas",
    "Casos",
    "Agenda de decisões",
    "Briefing",
    "Desempenho",
  ]) {
    assert.match(tower, new RegExp(view));
  }
  assert.match(tower, /createCaseFromAlert/);
  assert.match(tower, /advanceCase/);
  assert.match(tower, /resolveDecision/);
  assert.match(tower, /CHTContext/);
  assert.match(tower, /Águas Brasil \/ CNARH/);
  assert.match(tower, /Hidroweb \/ Telemetria/);
  assert.match(tower, /ArcGIS Living Atlas/);
  assert.match(tower, /Event Bus CHT/);
  assert.match(tower, /Abrir Governança/);
  assert.match(tower, /Ver trace do agente/);
});

test("uses ArcGIS 5.1, ANA services, Living Atlas and local fallback layers", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /https:\/\/js\.arcgis\.com\/5\.1\//);
  assert.match(page, /9f86716d941c4410b0b406d911754b2c/);
  assert.match(page, /portal1\.snirh\.gov\.br/);
  assert.match(page, /Dados sintéticos/);
  assert.doesNotMatch(page, /apiKey\s*[:=]\s*["'][A-Za-z0-9_-]{20,}/);
});

test("removes all disposable starter preview files", async () => {
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", templateRoot)));
  await assert.rejects(access(new URL("../app/_sites-preview/preview.css", templateRoot)));
});
