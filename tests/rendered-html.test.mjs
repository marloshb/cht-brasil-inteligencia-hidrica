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

test("implements the connected M1 hydric identity workflows", async () => {
  const [identity, page, tower] = await Promise.all([
    readFile(new URL("../app/identity-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/control-tower.tsx", import.meta.url), "utf8"),
  ]);
  for (const view of [
    "Busca mestre",
    "UTHs",
    "Resolver duplicidades",
    "Crosswalks",
    "Relações",
    "Versões",
    "Qualidade",
    "Importação",
  ]) {
    assert.match(identity, new RegExp(view));
  }
  assert.match(identity, /resolveDuplicate/);
  assert.match(identity, /addCrosswalk/);
  assert.match(identity, /executeImport/);
  assert.match(identity, /CHT-ID persistente · não reutilizável/);
  assert.match(identity, /Águas Brasil \/ CNARH/);
  assert.match(identity, /SNIRH \/ BHO6/);
  assert.match(identity, /Feature Service estadual/);
  assert.match(identity, /cht:focus-map/);
  assert.match(identity, /cht:module-event/);
  assert.match(page, /IdentityHub/);
  assert.match(tower, /receiveModuleEvent/);
});

test("implements the connected M2 hydric passport workflows", async () => {
  const [passport, page, identity, tower] = await Promise.all([
    readFile(new URL("../app/passport-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/identity-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/control-tower.tsx", import.meta.url), "utf8"),
  ]);
  for (const view of [
    "Meus territórios",
    "Buscar passaporte",
    "Regularidade",
    "Obrigações",
    "Evidências",
    "Solicitações",
    "Compartilhamentos",
  ]) {
    assert.match(passport, new RegExp(view));
  }
  assert.match(passport, /completeObligation/);
  assert.match(passport, /advanceRequest/);
  assert.match(passport, /addEvidence/);
  assert.match(passport, /createShare/);
  assert.match(passport, /revokeShare/);
  assert.match(passport, /Copiloto do Passaporte/);
  assert.match(passport, /não equivale a certidão de regularidade/);
  assert.match(passport, /cht:focus-map/);
  assert.match(passport, /cht:module-event/);
  assert.match(passport, /cht:identity-context/);
  assert.match(passport, /cht:passport-context/);
  assert.match(identity, /cht:identity-context/);
  assert.match(page, /PassportHub/);
  assert.match(tower, /receiveModuleEvent/);
});

test("implements the connected M3 regulatory engine workflows", async () => {
  const [regulatory, page, passport, tower] = await Promise.all([
    readFile(new URL("../app/regulatory-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/passport-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/control-tower.tsx", import.meta.url), "utf8"),
  ]);
  for (const view of [
    "Regras",
    "Competências",
    "Instrumentos",
    "Agenda regulatória",
    "Testes",
    "Conflitos",
    "Versões",
    "Consultas",
  ]) {
    assert.match(regulatory, new RegExp(view));
  }
  assert.match(regulatory, /resolveCompetency/);
  assert.match(regulatory, /runTests/);
  assert.match(regulatory, /createRuleCandidate/);
  assert.match(regulatory, /addInstrument/);
  assert.match(regulatory, /decideConflict/);
  assert.match(regulatory, /askQuestion/);
  assert.match(regulatory, /GeoRAG Normativo/);
  assert.match(regulatory, /Não constitui parecer jurídico/);
  assert.match(regulatory, /cht:passport-context/);
  assert.match(regulatory, /cht:regulatory-context/);
  assert.match(regulatory, /cht:module-event/);
  assert.match(regulatory, /cht:focus-map/);
  assert.match(passport, /openConsumer/);
  assert.match(page, /RegulatoryHub/);
  assert.match(tower, /receiveModuleEvent/);
});

test("implements the connected M4 use regulation workflows", async () => {
  const [useRegulation, page, regulatory, passport, tower] = await Promise.all([
    readFile(new URL("../app/use-regulation-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/regulatory-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/passport-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/control-tower.tsx", import.meta.url), "utf8"),
  ]);
  for (const view of [
    "Pré-análise",
    "Demandas",
    "Atos",
    "Condicionantes",
    "Automonitoramento",
    "Cobrança",
    "Revisões",
    "Conflitos",
  ]) {
    assert.match(useRegulation, new RegExp(view));
  }
  assert.match(useRegulation, /runPreanalysis/);
  assert.match(useRegulation, /createDemand/);
  assert.match(useRegulation, /advanceDemand/);
  assert.match(useRegulation, /approveProposal/);
  assert.match(useRegulation, /submitConditionEvidence/);
  assert.match(useRegulation, /reconcileMonitoring/);
  assert.match(useRegulation, /simulateCharge/);
  assert.match(useRegulation, /startRevision/);
  assert.match(useRegulation, /decideConflict/);
  assert.match(useRegulation, /Pré-análise Regulatória/);
  assert.match(useRegulation, /o agente não concede, nega, altera ou publica ato/i);
  assert.match(useRegulation, /cht:regulatory-context/);
  assert.match(useRegulation, /cht:regulation-context/);
  assert.match(useRegulation, /cht:regulation-obligation-event/);
  assert.match(useRegulation, /cht:module-event/);
  assert.match(useRegulation, /cht:focus-map/);
  assert.match(regulatory, /cht:regulatory-context/);
  assert.match(passport, /cht:regulation-obligation-event/);
  assert.match(page, /UseRegulationHub/);
  assert.match(tower, /receiveModuleEvent/);
});

test("implements the connected M5 data hub workflows", async () => {
  const [dataHub, page, useRegulation, tower] = await Promise.all([
    readFile(new URL("../app/data-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/use-regulation-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/control-tower.tsx", import.meta.url), "utf8"),
  ]);
  for (const view of [
    "Estações",
    "Séries",
    "Telemetria",
    "Imagens",
    "Cobertura",
    "Qualidade",
    "Eventos",
    "Catálogo",
  ]) {
    assert.match(dataHub, new RegExp(view));
  }
  assert.match(dataHub, /registerStation/);
  assert.match(dataHub, /ingestDataset/);
  assert.match(dataHub, /toggleConnector/);
  assert.match(dataHub, /qualifySeries/);
  assert.match(dataHub, /resolveIssue/);
  assert.match(dataHub, /processImage/);
  assert.match(dataHub, /acknowledgeEvent/);
  assert.match(dataHub, /registerCatalogAsset/);
  assert.match(dataHub, /Qualidade de Dados/);
  assert.match(dataHub, /não apaga nem sobrescreve o bruto/);
  assert.match(dataHub, /Hidroweb Telemetria/);
  assert.match(dataHub, /STAC 1\.0/);
  assert.match(dataHub, /SensorThings API/);
  assert.match(dataHub, /cht:regulation-context/);
  assert.match(dataHub, /cht:data-context/);
  assert.match(dataHub, /cht:monitoring-evidence-event/);
  assert.match(dataHub, /cht:module-event/);
  assert.match(dataHub, /cht:focus-map/);
  assert.match(useRegulation, /cht:monitoring-evidence-event/);
  assert.match(page, /DataHub/);
  assert.match(tower, /receiveModuleEvent/);
});

test("implements the connected M6 balance and scenarios workflows", async () => {
  const [balance, page, dataHub, useRegulation, tower] = await Promise.all([
    readFile(new URL("../app/balance-scenarios-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/use-regulation-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/control-tower.tsx", import.meta.url), "utf8"),
  ]);
  for (const view of [
    "Balanço atual",
    "Modelos",
    "Cenários",
    "Reservatórios",
    "Águas subterrâneas",
    "Previsões",
    "Comparações",
    "Biblioteca",
  ]) {
    assert.match(balance, new RegExp(view));
  }
  assert.match(balance, /runScenario/);
  assert.match(balance, /createScenario/);
  assert.match(balance, /registerModel/);
  assert.match(balance, /activateModel/);
  assert.match(balance, /simulateReservoir/);
  assert.match(balance, /validateGroundwater/);
  assert.match(balance, /decideComparison/);
  assert.match(balance, /addLibraryItem/);
  assert.match(balance, /Modelagem e Cenários/);
  assert.match(balance, /não opera infraestrutura, altera ato, publica previsão oficial ou decide investimento/);
  assert.match(balance, /Model Registry/);
  assert.match(balance, /Monte Carlo/);
  assert.match(balance, /cht:data-context/);
  assert.match(balance, /cht:regulation-context/);
  assert.match(balance, /cht:scenario-context/);
  assert.match(balance, /cht:scenario-result-event/);
  assert.match(balance, /cht:data-quality-request/);
  assert.match(balance, /cht:module-event/);
  assert.match(balance, /cht:focus-map/);
  assert.match(dataHub, /cht:data-quality-request/);
  assert.match(useRegulation, /cht:scenario-result-event/);
  assert.match(page, /BalanceScenariosHub/);
  assert.match(tower, /receiveModuleEvent/);
});

test("implements the connected M7 GeoFiscal workflows", async () => {
  const [geoFiscal, page, dataHub, useRegulation, tower] = await Promise.all([
    readFile(new URL("../app/geofiscal-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/use-regulation-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/control-tower.tsx", import.meta.url), "utf8"),
  ]);
  for (const view of [
    "Detecções",
    "Risco",
    "Casos",
    "Ordens",
    "Campo",
    "Evidências",
    "Conformidade",
    "Resultados",
  ]) {
    assert.match(geoFiscal, new RegExp(view));
  }
  assert.match(geoFiscal, /focusDetection/);
  assert.match(geoFiscal, /createCaseFromDetection/);
  assert.match(geoFiscal, /recalculateRisk/);
  assert.match(geoFiscal, /advanceCase/);
  assert.match(geoFiscal, /approveOrder/);
  assert.match(geoFiscal, /startFieldSession/);
  assert.match(geoFiscal, /captureEvidence/);
  assert.match(geoFiscal, /verifyEvidence/);
  assert.match(geoFiscal, /decideConformity/);
  assert.match(geoFiscal, /closeResult/);
  assert.match(geoFiscal, /Assistente de Vistoria/);
  assert.match(geoFiscal, /não emite ordem, sanciona, autua, presume responsabilidade ou decide o caso/);
  assert.match(geoFiscal, /ArcGIS offline/);
  assert.match(geoFiscal, /cadeia de custódia/i);
  assert.match(geoFiscal, /cht:data-context/);
  assert.match(geoFiscal, /cht:scenario-context/);
  assert.match(geoFiscal, /cht:regulation-context/);
  assert.match(geoFiscal, /cht:inspection-context/);
  assert.match(geoFiscal, /cht:field-evidence-event/);
  assert.match(geoFiscal, /cht:inspection-result-event/);
  assert.match(geoFiscal, /cht:module-event/);
  assert.match(geoFiscal, /cht:focus-map/);
  assert.match(dataHub, /cht:field-evidence-event/);
  assert.match(useRegulation, /cht:inspection-result-event/);
  assert.match(useRegulation, /cht:regulation-obligation-event/);
  assert.match(page, /GeoFiscalHub/);
  assert.match(tower, /receiveModuleEvent/);
});

test("implements the connected M8 water planning workflows", async () => {
  const [planning, page, balance, dataHub, useRegulation, tower] = await Promise.all([
    readFile(new URL("../app/planning-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/balance-scenarios-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/use-regulation-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/control-tower.tsx", import.meta.url), "utf8"),
  ]);
  for (const view of [
    "Planos",
    "Programas",
    "Ações",
    "Projetos",
    "Investimentos",
    "Metas",
    "Resultados",
    "Avaliação",
  ]) {
    assert.match(planning, new RegExp(view));
  }
  assert.match(planning, /importPlan/);
  assert.match(planning, /createProgram/);
  assert.match(planning, /advanceAction/);
  assert.match(planning, /approveGate/);
  assert.match(planning, /allocateInvestment/);
  assert.match(planning, /requestMonitoring/);
  assert.match(planning, /registerResult/);
  assert.match(planning, /decideEvaluation/);
  assert.match(planning, /Agente de Portfólio/);
  assert.match(planning, /não pactua metas, compromete orçamento, cancela projetos, publica planos ou decide investimentos/);
  assert.match(planning, /Transferegov/);
  assert.match(planning, /PNRH/);
  assert.match(planning, /cht:scenario-context/);
  assert.match(planning, /cht:data-context/);
  assert.match(planning, /cht:regulation-context/);
  assert.match(planning, /cht:inspection-result-event/);
  assert.match(planning, /cht:planning-context/);
  assert.match(planning, /cht:planning-demand-event/);
  assert.match(planning, /cht:planning-monitoring-request/);
  assert.match(planning, /cht:planning-regulatory-action-event/);
  assert.match(planning, /cht:module-event/);
  assert.match(planning, /cht:focus-map/);
  assert.match(balance, /cht:planning-demand-event/);
  assert.match(dataHub, /cht:planning-monitoring-request/);
  assert.match(useRegulation, /cht:planning-regulatory-action-event/);
  assert.match(page, /PlanningHub/);
  assert.match(tower, /receiveModuleEvent/);
});

test("implements the connected M9 critical events workflows", async () => {
  const [critical, page, balance, dataHub, planning, tower] = await Promise.all([
    readFile(new URL("../app/critical-events-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/balance-scenarios-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/planning-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/control-tower.tsx", import.meta.url), "utf8"),
  ]);
  for (const view of [
    "Situação atual",
    "Incidentes",
    "Secas",
    "Cheias",
    "Reservatórios",
    "Cenários",
    "Recursos",
    "Pós-evento",
  ]) {
    assert.match(critical, new RegExp(view));
  }
  assert.match(critical, /focusIncident/);
  assert.match(critical, /activateIncident/);
  assert.match(critical, /advanceIncident/);
  assert.match(critical, /requestData/);
  assert.match(critical, /requestScenario/);
  assert.match(critical, /approveBulletin/);
  assert.match(critical, /mobilizeResource/);
  assert.match(critical, /decideAlternative/);
  assert.match(critical, /addLesson/);
  assert.match(critical, /Agente de Crise/);
  assert.match(critical, /não decreta emergência, publica alerta, opera reservatórios, mobiliza terceiros ou decide medidas/);
  assert.match(critical, /Monitor de Secas/);
  assert.match(critical, /Defesa Civil/);
  assert.match(critical, /cht:data-context/);
  assert.match(critical, /cht:scenario-context/);
  assert.match(critical, /cht:planning-context/);
  assert.match(critical, /cht:field-evidence-event/);
  assert.match(critical, /cht:regulation-context/);
  assert.match(critical, /cht:critical-event-context/);
  assert.match(critical, /cht:incident-data-request/);
  assert.match(critical, /cht:incident-scenario-request/);
  assert.match(critical, /cht:resource-priority-event/);
  assert.match(critical, /cht:module-event/);
  assert.match(critical, /cht:focus-map/);
  assert.match(dataHub, /cht:incident-data-request/);
  assert.match(balance, /cht:incident-scenario-request/);
  assert.match(planning, /cht:resource-priority-event/);
  assert.match(page, /CriticalEventsHub/);
  assert.match(tower, /receiveModuleEvent/);
});

test("implements the connected M10 water quality workflows", async () => {
  const [quality, page, dataHub, balance, useRegulation, planning, critical, tower] = await Promise.all([
    readFile(new URL("../app/water-quality-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/balance-scenarios-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/use-regulation-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/planning-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/critical-events-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/control-tower.tsx", import.meta.url), "utf8"),
  ]);
  for (const view of ["Situação", "Trechos", "Enquadramento", "Qualidade", "Lançamentos", "Pressões", "Metas", "Recuperação"]) {
    assert.match(quality, new RegExp(view));
  }
  assert.match(quality, /focusSegment/);
  assert.match(quality, /qualifySample/);
  assert.match(quality, /reviewFraming/);
  assert.match(quality, /reconcileDischarge/);
  assert.match(quality, /requestQualityData/);
  assert.match(quality, /requestQualityScenario/);
  assert.match(quality, /approveRecovery/);
  assert.match(quality, /escalateIncident/);
  assert.match(quality, /Agente de Qualidade/);
  assert.match(quality, /não altera enquadramento, licencia lançamento, sanciona usuário, publica alerta ou decide investimento/);
  assert.match(quality, /RNQA/);
  assert.match(quality, /Laboratório/);
  assert.match(quality, /Living Atlas/);
  assert.match(quality, /CAR/);
  assert.match(quality, /cht:data-context/);
  assert.match(quality, /cht:regulation-context/);
  assert.match(quality, /cht:scenario-context/);
  assert.match(quality, /cht:planning-context/);
  assert.match(quality, /cht:field-evidence-event/);
  assert.match(quality, /cht:critical-event-context/);
  assert.match(quality, /cht:water-quality-context/);
  assert.match(quality, /cht:quality-data-request/);
  assert.match(quality, /cht:quality-scenario-request/);
  assert.match(quality, /cht:quality-regulatory-review-event/);
  assert.match(quality, /cht:quality-recovery-action-event/);
  assert.match(quality, /cht:quality-incident-event/);
  assert.match(quality, /cht:module-event/);
  assert.match(quality, /cht:focus-map/);
  assert.match(dataHub, /cht:quality-data-request/);
  assert.match(balance, /cht:quality-scenario-request/);
  assert.match(useRegulation, /cht:quality-regulatory-review-event/);
  assert.match(planning, /cht:quality-recovery-action-event/);
  assert.match(critical, /cht:quality-incident-event/);
  assert.match(page, /WaterQualityHub/);
  assert.match(tower, /receiveModuleEvent/);
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
