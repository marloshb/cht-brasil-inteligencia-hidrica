"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";

type ModelStatus = "Ativo" | "Homologação" | "Deprecado" | "Falhou";
type ScenarioStatus = "Rascunho" | "Executando" | "Concluído" | "Selecionado";

type ModelRecord = {
  id: string;
  name: string;
  family: string;
  engine: string;
  domain: string;
  resolution: string;
  horizon: string;
  skill: number;
  uncertainty: string;
  version: string;
  status: ModelStatus;
  updated: string;
};

type Scenario = {
  id: string;
  name: string;
  climate: string;
  rainfall: number;
  demand: number;
  efficiency: number;
  rule: string;
  horizon: string;
  balance: number;
  reliability: number;
  deficit: number;
  cost: number;
  score: number;
  status: ScenarioStatus;
};

type Reservoir = {
  id: string;
  name: string;
  basin: string;
  volume: number;
  useful: number;
  inflow: number;
  outflow: number;
  target: number;
  trend: "Subindo" | "Estável" | "Descendo";
  restriction: string;
  center: [number, number];
};

type Aquifer = {
  id: string;
  name: string;
  territory: string;
  wells: number;
  monitored: number;
  level: number;
  recharge: number;
  withdrawal: number;
  confidence: number;
  status: "Equilibrado" | "Atenção" | "Crítico";
};

type LibraryItem = {
  id: string;
  name: string;
  kind: string;
  owner: string;
  version: string;
  format: string;
  license: string;
  consumers: string;
  status: "Publicado" | "Homologação" | "Arquivado";
};

type BalanceScenariosHubProps = {
  contextItem: string;
  territory: string;
  clockLabel: string;
  onNavigate: (item: string) => void;
  onOpenModule: (moduleId: string) => void;
  onCreateRecord: () => void;
  onToast: (message: string) => void;
};

const initialModels: ModelRecord[] = [
  { id: "MOD-BAL-BHO6-018", name: "Balanço em rede BHO6", family: "Alocação e balanço", engine: "Pywr + grafo CHT", domain: "Paranaíba · UGRH DF", resolution: "trecho BHO6 · diário", horizon: "agora → 12 meses", skill: 92, uncertainty: "Monte Carlo · 500 membros", version: "v18.4", status: "Ativo", updated: "10 ago · 09:42" },
  { id: "MOD-RAIN-RUN-011", name: "Chuva–vazão regional", family: "Hidrológico", engine: "MGB-IPH calibrado", domain: "São Francisco · Grande", resolution: "5 km · diário", horizon: "15 dias", skill: 88, uncertainty: "ensemble 30 membros", version: "v11.2", status: "Ativo", updated: "10 ago · 06:00" },
  { id: "MOD-RES-OPT-007", name: "Operação integrada de reservatórios", family: "Otimização", engine: "Stochastic DP", domain: "SIN + usos múltiplos", resolution: "reservatório · semanal", horizon: "24 meses", skill: 86, uncertainty: "cenários hidrológicos", version: "v7.8-rc2", status: "Homologação", updated: "09 ago · 18:31" },
  { id: "MOD-GW-REC-004", name: "Recarga e explotação subterrânea", family: "Água subterrânea", engine: "MODFLOW surrogate", domain: "Aquífero Urucuia", resolution: "1 km · mensal", horizon: "10 anos", skill: 81, uncertainty: "faixa P10–P90", version: "v4.1", status: "Ativo", updated: "08 ago · 14:12" },
  { id: "MOD-LEGACY-003", name: "Curva regional legada", family: "Estatístico", engine: "R regionalização", domain: "piloto estadual", resolution: "sub-bacia · mensal", horizon: "12 meses", skill: 62, uncertainty: "não propagada", version: "v3.0", status: "Deprecado", updated: "17 jun · 11:00" },
];

const initialScenarios: Scenario[] = [
  { id: "CEN-2026-0048-A", name: "Referência operacional", climate: "Referência sazonal", rainfall: 100, demand: 100, efficiency: 0, rule: "regras vigentes M3", horizon: "ago 2026 → jul 2027", balance: 5.3, reliability: 94, deficit: 0.8, cost: 0, score: 86, status: "Concluído" },
  { id: "CEN-2026-0048-B", name: "Ampliação com eficiência", climate: "Seco moderado P35", rainfall: 88, demand: 112, efficiency: 18, rule: "limite sazonal + gatilhos", horizon: "ago 2026 → jul 2027", balance: 3.1, reliability: 88, deficit: 1.7, cost: 4.8, score: 91, status: "Concluído" },
  { id: "CEN-2026-0048-C", name: "Demanda plena solicitada", climate: "Seco severo P10", rainfall: 72, demand: 131, efficiency: 5, rule: "sem restrição adicional", horizon: "ago 2026 → jul 2027", balance: -1.9, reliability: 61, deficit: 5.4, cost: 12.6, score: 48, status: "Concluído" },
  { id: "CEN-2026-0048-D", name: "Restrição sazonal preventiva", climate: "Seco moderado P35", rainfall: 88, demand: 104, efficiency: 12, rule: "redução 20% mai–set", horizon: "ago 2026 → jul 2027", balance: 4.2, reliability: 92, deficit: 1.1, cost: 2.9, score: 88, status: "Rascunho" },
];

const initialReservoirs: Reservoir[] = [
  { id: "RES-DF-STA-MARIA", name: "Santa Maria", basin: "Paranaíba · Descoberto", volume: 63.8, useful: 38.2, inflow: 4.8, outflow: 5.2, target: 60, trend: "Descendo", restriction: "curva de segurança · nível atenção", center: [-47.95, -15.65] },
  { id: "RES-DF-DESCOBERTO", name: "Descoberto", basin: "Paranaíba · Descoberto", volume: 71.4, useful: 62.7, inflow: 6.1, outflow: 5.7, target: 68, trend: "Subindo", restriction: "abastecimento prioritário", center: [-48.27, -15.77] },
  { id: "RES-MG-TRES-MARIAS", name: "Três Marias", basin: "São Francisco", volume: 54.6, useful: 8.2, inflow: 412, outflow: 481, target: 58, trend: "Descendo", restriction: "defluência mínima e energia", center: [-45.26, -18.22] },
  { id: "RES-BA-SOBRADINHO", name: "Sobradinho", basin: "São Francisco", volume: 48.1, useful: 16.7, inflow: 521, outflow: 638, target: 52, trend: "Descendo", restriction: "navegação, energia e ecossistema", center: [-40.82, -9.43] },
];

const initialAquifers: Aquifer[] = [
  { id: "AQ-URUCUIA-01", name: "Sistema Aquífero Urucuia", territory: "Oeste BA / Alto São Francisco", wells: 1842, monitored: 312, level: -18.4, recharge: 2.8, withdrawal: 2.4, confidence: 82, status: "Atenção" },
  { id: "AQ-GUARANI-SP18", name: "Sistema Aquífero Guarani", territory: "UGRHI 18 · SP", wells: 2261, monitored: 604, level: -42.1, recharge: 5.9, withdrawal: 4.2, confidence: 89, status: "Equilibrado" },
  { id: "AQ-BAMBUÍ-DF", name: "Aquífero Bambuí", territory: "DF / entorno", wells: 931, monitored: 148, level: -31.7, recharge: 1.2, withdrawal: 1.5, confidence: 78, status: "Crítico" },
  { id: "AQ-BARREIRAS-NE", name: "Formação Barreiras", territory: "Faixa costeira Nordeste", wells: 3128, monitored: 722, level: -12.6, recharge: 6.4, withdrawal: 4.8, confidence: 86, status: "Equilibrado" },
];

const initialLibrary: LibraryItem[] = [
  { id: "LIB-MOD-BHO6-018", name: "Pacote Balanço em rede BHO6", kind: "Modelo executável", owner: "CHT · Model Registry", version: "v18.4", format: "OCI + Python", license: "Uso institucional", consumers: "M4 · M6 · M8 · M9", status: "Publicado" },
  { id: "LIB-DAT-FLOW-202608", name: "Séries qualificadas de vazão", kind: "Dataset versionado", owner: "M5 · Data Hub", version: "qv18", format: "Parquet + OGC API", license: "Contrato federativo", consumers: "4 modelos ativos", status: "Publicado" },
  { id: "LIB-CEN-0048", name: "Família de cenários DEM-2026-1842", kind: "Scenario package", owner: "ANA · unidade técnica", version: "v3", format: "JSON-LD + resultados", license: "Uso decisório", consumers: "M0 · M4 · M8", status: "Publicado" },
  { id: "LIB-CLI-ENSEMBLE-35", name: "Projeção climática regional P35", kind: "Forçante climática", owner: "INMET / CPTEC", version: "2026.08", format: "Zarr + STAC", license: "Público", consumers: "7 modelos", status: "Publicado" },
  { id: "LIB-MOD-RES-007", name: "Operação integrada · release candidate", kind: "Modelo executável", owner: "CHT · Model Registry", version: "v7.8-rc2", format: "OCI + Julia", license: "Homologação", consumers: "M6 · M9", status: "Homologação" },
];

const monthlySupply = [18.4, 17.8, 16.2, 14.9, 13.8, 12.6, 11.9, 12.4, 13.6, 15.1, 16.7, 17.9];
const monthlyDemand = [13.1, 13.2, 13.5, 13.8, 14.1, 14.4, 14.2, 13.9, 13.6, 13.4, 13.2, 13.1];
const forecastMedian = [48, 46, 45, 47, 44, 42, 43, 41, 39, 38, 40, 42, 41, 39];
const statusClass = (value: string) => value.toLowerCase().replaceAll(" ", "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function BalanceScenariosHub({ contextItem, territory, clockLabel, onNavigate, onOpenModule, onCreateRecord, onToast }: BalanceScenariosHubProps) {
  const [models, setModels] = useState(initialModels);
  const [selectedModelId, setSelectedModelId] = useState(initialModels[0].id);
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState(initialScenarios[1].id);
  const [reservoirs, setReservoirs] = useState(initialReservoirs);
  const [selectedReservoirId, setSelectedReservoirId] = useState(initialReservoirs[0].id);
  const [aquifers, setAquifers] = useState(initialAquifers);
  const [selectedAquiferId, setSelectedAquiferId] = useState(initialAquifers[0].id);
  const [library, setLibrary] = useState(initialLibrary);
  const [modelFilter, setModelFilter] = useState("Todos");
  const [scenarioFilter, setScenarioFilter] = useState("Todos");
  const [runProgress, setRunProgress] = useState(100);
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(null);
  const [forecastUpdated, setForecastUpdated] = useState(false);
  const [reservoirSimulated, setReservoirSimulated] = useState(false);
  const [groundwaterValidated, setGroundwaterValidated] = useState(false);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentStep, setAgentStep] = useState(5);
  const [subject, setSubject] = useState({ chtId: "UTH-DF-004918", demandId: "DEM-2026-1842", passportId: "PAS-DF-004918", purpose: "Uso industrial", requestedFlow: 68, authorizedFlow: 52, authority: "ANA · competência indicativa", stationId: "EST-DF-60435100", seriesId: "SER-DF-004918-Q", variable: "Vazão instantânea", unit: "L/s", quality: 94, completeness: 98.7, dataVersion: "qv18", observedAt: "09:54 BRT", center: [-47.82, -15.58] as [number, number] });

  const selectedModel = models.find((item) => item.id === selectedModelId) ?? models[0];
  const selectedScenario = scenarios.find((item) => item.id === selectedScenarioId) ?? scenarios[0];
  const selectedReservoir = reservoirs.find((item) => item.id === selectedReservoirId) ?? reservoirs[0];
  const selectedAquifer = aquifers.find((item) => item.id === selectedAquiferId) ?? aquifers[0];
  const filteredModels = modelFilter === "Todos" ? models : models.filter((item) => item.status === modelFilter);
  const filteredScenarios = scenarioFilter === "Todos" ? scenarios : scenarios.filter((item) => item.status === scenarioFilter);
  const balanceNow = 18.4 - 13.1;

  useEffect(() => {
    const receiveData = (event: Event) => {
      const detail = (event as CustomEvent<{ stationId?: string; seriesId?: string; chtId?: string; demandId?: string; variable?: string; unit?: string; quality?: number; completeness?: number; version?: string; center?: [number, number]; observedAt?: string }>).detail;
      if (!detail?.seriesId && !detail?.chtId) return;
      setSubject((value) => ({ ...value, stationId: detail.stationId ?? value.stationId, seriesId: detail.seriesId ?? value.seriesId, chtId: detail.chtId ?? value.chtId, demandId: detail.demandId ?? value.demandId, variable: detail.variable ?? value.variable, unit: detail.unit ?? value.unit, quality: detail.quality ?? value.quality, completeness: detail.completeness ?? value.completeness, dataVersion: detail.version ?? value.dataVersion, observedAt: detail.observedAt ?? value.observedAt, center: detail.center ?? value.center }));
    };
    const receiveRegulation = (event: Event) => {
      const detail = (event as CustomEvent<{ demandId?: string; chtId?: string; passportId?: string; purpose?: string; requestedFlow?: number; authorizedFlow?: number; authority?: string; center?: [number, number] }>).detail;
      if (!detail?.demandId) return;
      setSubject((value) => ({ ...value, ...detail, center: detail.center ?? value.center }));
    };
    window.addEventListener("cht:data-context", receiveData);
    window.addEventListener("cht:regulation-context", receiveRegulation);
    return () => { window.removeEventListener("cht:data-context", receiveData); window.removeEventListener("cht:regulation-context", receiveRegulation); };
  }, []);

  useEffect(() => {
    if (!agentRunning) return;
    const interval = window.setInterval(() => setAgentStep((step) => {
      if (step >= 5) { setAgentRunning(false); onToast("Análise concluída; alternativas e incertezas disponíveis para decisão humana."); return step; }
      return step + 1;
    }), 1100);
    return () => window.clearInterval(interval);
  }, [agentRunning, onToast]);

  useEffect(() => {
    if (!runningScenarioId || runProgress >= 100) return;
    const interval = window.setInterval(() => setRunProgress((value) => Math.min(100, value + 10)), 420);
    return () => window.clearInterval(interval);
  }, [runningScenarioId, runProgress]);

  useEffect(() => {
    if (!runningScenarioId || runProgress < 100) return;
    setScenarios((items) => items.map((item) => item.id === runningScenarioId ? { ...item, status: "Concluído", balance: 4.2, reliability: 92, deficit: 1.1, cost: 2.9, score: 88 } : item));
    const scenario = scenarios.find((item) => item.id === runningScenarioId);
    if (scenario) {
      window.dispatchEvent(new CustomEvent("cht:scenario-result-event", { detail: { scenarioId: scenario.id, demandId: subject.demandId, chtId: subject.chtId, recommendedFlow: 52, reliability: 92, balance: 4.2, deficit: 1.1, modelId: selectedModel.id, status: "Concluído" } }));
      broadcastScenario({ ...scenario, status: "Concluído", balance: 4.2, reliability: 92, deficit: 1.1, score: 88 });
      onToast(`${scenario.id} concluído; resultado versionado e devolvido ao M4 com memória de modelo.`);
    }
    setRunningScenarioId(null);
  }, [runProgress, runningScenarioId]);

  const emitTowerEvent = (title: string, severity: "Crítico" | "Alto" | "Médio" | "Baixo", recommendation: string) => window.dispatchEvent(new CustomEvent("cht:module-event", { detail: { eventId: `BSC-${Date.now().toString(16).slice(-6).toUpperCase()}`, type: "scenario.decision.required", title, severity, source: "M6 · Balanço & Cenários", module: "m6", moduleName: "Balanço & Cenários", territory, confidence: selectedScenario.reliability, chtId: subject.chtId, recommendation, occurredAt: clockLabel } }));

  const broadcastScenario = (scenario = selectedScenario) => window.dispatchEvent(new CustomEvent("cht:scenario-context", { detail: { scenarioId: scenario.id, demandId: subject.demandId, chtId: subject.chtId, modelId: selectedModel.id, climate: scenario.climate, demand: scenario.demand, efficiency: scenario.efficiency, balance: scenario.balance, reliability: scenario.reliability, deficit: scenario.deficit, score: scenario.score, center: subject.center, horizon: scenario.horizon } }));
  const openConsumer = (moduleId: string) => { broadcastScenario(); onOpenModule(moduleId); };
  const startAgent = () => { setAgentOpen(true); setAgentStep(0); setAgentRunning(true); };

  const focusTerritory = (label: string, center = subject.center, confidence = 90) => {
    window.dispatchEvent(new CustomEvent("cht:focus-map", { detail: { center, zoom: 8, label, source: `${selectedModel.id} · ${selectedModel.version}`, confidence } }));
    onToast(`${label} selecionado; mapa, balanço, modelos e cenários foram sincronizados.`);
  };

  const runScenario = (scenario = selectedScenario) => {
    setSelectedScenarioId(scenario.id); setScenarios((items) => items.map((item) => item.id === scenario.id ? { ...item, status: "Executando" } : item)); setRunningScenarioId(scenario.id); setRunProgress(0);
    onToast(`${scenario.id} iniciado com snapshot dos dados, regras, modelo e parâmetros.`);
  };

  const createScenario = (event: FormEvent) => {
    event.preventDefault();
    const item: Scenario = { id: `CEN-2026-${String(49 + scenarios.length).padStart(4, "0")}`, name: "Novo cenário parametrizado", climate: "Seco moderado P35", rainfall: 88, demand: 112, efficiency: 15, rule: "limite sazonal + gatilhos", horizon: "ago 2026 → jul 2027", balance: 0, reliability: 0, deficit: 0, cost: 0, score: 0, status: "Rascunho" };
    setScenarios((items) => [item, ...items]); setSelectedScenarioId(item.id); setScenarioModalOpen(false); onNavigate("Cenários"); runScenario(item);
  };

  const registerModel = (event: FormEvent) => {
    event.preventDefault();
    const item: ModelRecord = { id: `MOD-CHT-${String(models.length + 1).padStart(3, "0")}`, name: "Novo modelo hidrológico", family: "Hidrológico", engine: "container OCI", domain: subject.chtId, resolution: "trecho · diário", horizon: "12 meses", skill: 0, uncertainty: "a validar", version: "v0.1-rc1", status: "Homologação", updated: `10 ago · ${clockLabel.slice(0, 5)}` };
    setModels((items) => [item, ...items]); setSelectedModelId(item.id); setModelModalOpen(false); onToast(`${item.id} registrado em homologação; testes, dados e revisão aguardam gates.`);
  };

  const activateModel = () => {
    setModels((items) => items.map((item) => item.id === selectedModel.id ? { ...item, status: "Ativo", skill: Math.max(86, item.skill) } : item));
    onToast(`${selectedModel.id} ativado para o escopo validado; versão anterior e rollback foram preservados.`);
  };

  const simulateReservoir = () => {
    setReservoirSimulated(true);
    setReservoirs((items) => items.map((item) => item.id === selectedReservoir.id ? { ...item, outflow: Math.max(0, item.outflow * .92), target: Math.max(item.target, item.volume + 2) } : item));
    onToast("Operação simulada sem comando externo; curva, restrições, efeitos e incerteza foram recalculados.");
  };

  const validateGroundwater = () => {
    setGroundwaterValidated(true);
    window.dispatchEvent(new CustomEvent("cht:data-quality-request", { detail: { seriesId: subject.seriesId, chtId: subject.chtId, reason: "Validar nível, unidade e representatividade para cenário subterrâneo", requestedBy: "M6 · Águas subterrâneas" } }));
    onToast("Validação solicitada ao M5; o cenário subterrâneo permanece indicativo até resposta dos dados.");
  };

  const decideComparison = () => {
    setScenarios((items) => items.map((item) => ({ ...item, status: item.id === selectedScenario.id ? "Selecionado" : item.status === "Selecionado" ? "Concluído" : item.status })));
    setDecisionModalOpen(false); broadcastScenario();
    window.dispatchEvent(new CustomEvent("cht:scenario-result-event", { detail: { scenarioId: selectedScenario.id, demandId: subject.demandId, chtId: subject.chtId, recommendedFlow: 52, reliability: selectedScenario.reliability, balance: selectedScenario.balance, deficit: selectedScenario.deficit, modelId: selectedModel.id, status: "Selecionado" } }));
    emitTowerEvent("Cenário selecionado para encaminhamento", "Médio", `${selectedScenario.id} foi escolhido com justificativa humana; acompanhar gatilhos e indicadores.`);
    onToast(`${selectedScenario.id} selecionado; decisão, justificativa, trade-offs e monitoramento foram registrados.`);
  };

  const addLibraryItem = (event: FormEvent) => {
    event.preventDefault();
    const item: LibraryItem = { id: `LIB-CHT-${String(library.length + 1).padStart(3, "0")}`, name: "Novo pacote de modelo e cenário", kind: "Model package", owner: "Unidade técnica", version: "v0.1", format: "OCI + JSON-LD", license: "Homologação", consumers: "M6", status: "Homologação" };
    setLibrary((items) => [item, ...items]); setLibraryModalOpen(false); onToast(`${item.id} adicionado à biblioteca em homologação com checksum, SBOM e metadados.`);
  };

  const Kpis = () => <div className="balance-kpis"><article><span>OFERTA DE REFERÊNCIA</span><strong>18,4 <em>hm³/mês</em></strong><small>M5 qv18 · incerteza ±1,1</small><i style={{ width: "82%" }} /></article><article><span>DEMANDA COMPROMETIDA</span><strong>13,1 <em>hm³/mês</em></strong><small>M4 · 71% da oferta</small><i className="warn" style={{ width: "71%" }} /></article><article><span>SALDO ATUAL</span><strong>+{balanceNow.toFixed(1).replace(".", ",")} <em>hm³</em></strong><small>reserva operacional 5,3</small><i style={{ width: "64%" }} /></article><article><span>CONFIABILIDADE</span><strong>94%</strong><small>{selectedModel.id} · {selectedModel.version}</small><i style={{ width: "94%" }} /></article></div>;

  const CurrentBalance = () => <div className="balance-current"><header className="balance-section-toolbar"><div><h2>Balanço hídrico integrado atual</h2><p>Oferta observada, demandas, regras, infraestrutura e incerteza na rede BHO6</p></div><div><button onClick={() => openConsumer("m5")}>Dados M5 ↗</button><button onClick={() => openConsumer("m4")}>Demandas M4 ↗</button><button className="primary" onClick={() => runScenario(scenarios[0])}>▶ Recalcular balanço</button></div></header>{runningScenarioId && <div className="balance-run-progress"><div><span>EXECUÇÃO {runningScenarioId}</span><strong>{runProgress}%</strong></div><i><b style={{ width: `${runProgress}%` }} /></i><small>snapshot → validação → rede → incerteza → resultados → publicação</small></div>}<div className="balance-current-layout"><article className="panel balance-network"><header className="panel-header"><div><h2>Rede de oferta e demanda</h2><p>{subject.chtId} · cenário de referência</p></div><span>agora · {clockLabel}</span></header><div className="balance-sankey"><section className="sources"><span>OFERTAS</span>{[["Vazão observada", "11,8", "M5 qv18"], ["Regularização", "4,2", "2 reservatórios"], ["Subterrânea", "2,4", "confiança 82%"]].map((item) => <button key={item[0]}><div><strong>{item[0]}</strong><small>{item[2]}</small></div><b>{item[1]} hm³</b></button>)}</section><div className="balance-flow-core"><span>18,4</span><strong>hm³/mês</strong><i /><small>±1,1 · P10–P90</small></div><section className="demands"><span>DEMANDAS</span>{[["Abastecimento", "5,1", "prioritária"], ["Irrigação", "4,3", "sazonal"], ["Indústria", "2,6", `${subject.demandId}`], ["Ambiental", "1,1", "restrição M3"]].map((item) => <button key={item[0]}><div><strong>{item[0]}</strong><small>{item[2]}</small></div><b>{item[1]} hm³</b></button>)}</section></div><div className="balance-node-strip">{[["TRECHO 769943", "+5,3", "regular"], ["JUSANTE 769941", "+2,1", "atenção"], ["RESERVATÓRIO", "63,8%", "descendo"], ["AQUÍFERO", "+0,4", "incerto"]].map((item) => <button key={item[0]} onClick={() => focusTerritory(`${item[0]} · ${item[1]}`)}><span>{item[0]}</span><strong className={statusClass(item[2])}>{item[1]}</strong><small>{item[2]}</small></button>)}</div><footer><button onClick={() => onToast("Memória exportada com dados, regras, modelo, parâmetros, incerteza e versão.")}>⇩ Exportar memória</button><button onClick={() => onNavigate("Comparações")}>Comparar alternativas</button></footer></article><aside className="panel balance-diagnosis"><header><div><small>DIAGNÓSTICO · 94% CONFIANÇA</small><h2>Saldo positivo com atenção sazonal</h2><p>modelo {selectedModel.version} · dados {subject.dataVersion}</p></div><span>ATENÇÃO</span></header><div className="balance-diagnosis-kpis"><div><span>SALDO</span><strong>+5,3 hm³</strong></div><div><span>P10</span><strong>+2,4 hm³</strong></div><div><span>P90</span><strong>+6,2 hm³</strong></div></div><section className="balance-facts"><span>FATOS RECUPERADOS</span>{[["M5", `${subject.seriesId} · ${subject.quality}% qualidade`, "ok"], ["M4", `${subject.demandId} · ${subject.requestedFlow} L/s`, "warn"], ["M3", "14 regras e 3 condicionantes", "ok"], ["BHO6", "7 trechos + 2 reservatórios", "ok"]].map((item) => <button key={item[0]} onClick={() => openConsumer(item[0].toLowerCase())}><b>{item[0]}</b><span>{item[1]}</span><em className={item[2]}>{item[2] === "ok" ? "✓" : "!"}</em><i>↗</i></button>)}</section><section className="balance-alert"><span>RESSALVA</span><p>No percentil seco P10, a margem cai para 2,4 hm³ e o trecho jusante entra em atenção entre maio e setembro.</p></section><div className="balance-agent-card"><span>✦</span><div><strong>Modelagem e Cenários</strong><p>Gerou 4 alternativas e propagou incerteza de dados, clima e parâmetros.</p></div><button onClick={startAgent}>Ver trace</button></div><footer><button onClick={() => emitTowerEvent("Balanço sazonal requer acompanhamento", "Médio", "Acompanhar trecho jusante e gatilhos de restrição entre maio e setembro.")}>Enviar ao M0</button><button className="primary" onClick={() => onNavigate("Cenários")}>Explorar cenários →</button></footer></aside></div></div>;

  const Models = () => <div className="balance-models"><header className="balance-section-toolbar"><div><h2>Model Registry governado</h2><p>Versão, escopo, dados, skill, incerteza, testes, aprovação e rollback</p></div><div className="balance-filters">{["Todos", "Ativo", "Homologação", "Deprecado", "Falhou"].map((item) => <button key={item} className={modelFilter === item ? "active" : ""} onClick={() => setModelFilter(item)}>{item}</button>)}<button className="primary" onClick={() => setModelModalOpen(true)}>＋ Registrar modelo</button></div></header><div className="balance-model-layout"><article className="panel balance-model-list"><div className="balance-model-head"><span>MODELO / FAMÍLIA</span><span>ENGINE</span><span>DOMÍNIO</span><span>RESOLUÇÃO</span><span>SKILL</span><span>VERSÃO</span><span>STATUS</span><span /></div>{filteredModels.map((item) => <button key={item.id} className={item.id === selectedModel.id ? "selected" : ""} onClick={() => setSelectedModelId(item.id)}><span className={`balance-model-icon ${statusClass(item.status)}`}>ƒ</span><div><small>{item.id} · {item.family}</small><strong>{item.name}</strong><p>atualizado {item.updated}</p></div><span>{item.engine}</span><span>{item.domain}</span><span>{item.resolution}<small>{item.horizon}</small></span><div className="balance-skill"><i><b style={{ width: `${item.skill}%` }} /></i><strong>{item.skill || "—"}%</strong></div><code>{item.version}</code><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article><aside className="panel balance-model-detail"><header><div><small>{selectedModel.id} · {selectedModel.version}</small><h2>{selectedModel.name}</h2><p>{selectedModel.family} · {selectedModel.engine}</p></div><em className={statusClass(selectedModel.status)}>{selectedModel.status}</em></header><div className="balance-model-metrics"><div><span>SKILL</span><strong>{selectedModel.skill || "—"}%</strong></div><div><span>INCERTEZA</span><strong>{selectedModel.uncertainty}</strong></div><div><span>HORIZONTE</span><strong>{selectedModel.horizon}</strong></div></div><section><span>CONTRATO DE ENTRADA</span>{[["Rede", "BHO6 v2026.04"], ["Observação", `${subject.seriesId} · ${subject.dataVersion}`], ["Demandas", `M4 · ${subject.demandId}`], ["Regras", "M3 · release 2026.08.3"], ["Clima", "ensemble CPTEC/INMET"]].map((item) => <button key={item[0]}><b>{item[0]}</b><span>{item[1]}</span><i>✓</i></button>)}</section><div className="balance-model-gates"><span>GATES DE PROMOÇÃO</span>{[["Reprodutibilidade", "Aprovado"], ["Backtest", selectedModel.skill >= 80 ? "Aprovado" : "Pendente"], ["Stress test", "Aprovado"], ["Revisão técnica", selectedModel.status === "Homologação" ? "Pendente" : "Aprovado"], ["Rollback", "Disponível"]].map((item) => <p key={item[0]}><span>{item[0]}</span><b className={item[1] === "Pendente" ? "warn" : "ok"}>{item[1]}</b></p>)}</div><footer><button onClick={() => onToast(`${selectedModel.id}: manifest, imagem, SBOM, testes e métricas carregados.`)}>Ver artefatos</button><button onClick={() => onToast("Backtest executado em 36 janelas; métricas e resíduos atualizados.")}>▶ Executar testes</button><button className="primary" disabled={selectedModel.status === "Ativo"} onClick={activateModel}>Ativar no escopo →</button></footer></aside></div></div>;

  const Scenarios = () => <div className="balance-scenarios"><header className="balance-section-toolbar"><div><h2>Workbench de cenários</h2><p>Clima, demanda, eficiência, regras, infraestrutura, horizonte e incerteza</p></div><div className="balance-filters">{["Todos", "Rascunho", "Executando", "Concluído", "Selecionado"].map((item) => <button key={item} className={scenarioFilter === item ? "active" : ""} onClick={() => setScenarioFilter(item)}>{item}</button>)}<button className="primary" onClick={() => setScenarioModalOpen(true)}>＋ Novo cenário</button></div></header>{runningScenarioId && <div className="balance-run-progress"><div><span>EXECUTANDO {runningScenarioId} · {selectedModel.id}</span><strong>{runProgress}%</strong></div><i><b style={{ width: `${runProgress}%` }} /></i><small>500 membros · 7 trechos · 12 meses · snapshot imutável</small></div>}<div className="balance-scenario-grid">{filteredScenarios.map((item) => <article key={item.id} className={`panel ${item.id === selectedScenario.id ? "selected" : ""}`} onClick={() => { setSelectedScenarioId(item.id); broadcastScenario(item); }}><header><div><small>{item.id} · {item.status}</small><h2>{item.name}</h2><p>{item.climate} · {item.horizon}</p></div><span className={`balance-scenario-score ${item.score >= 85 ? "good" : item.score >= 70 ? "warn" : "critical"}`}>{item.score || "—"}</span></header><div className="balance-scenario-parameters"><span>CHUVA<strong>{item.rainfall}%</strong></span><span>DEMANDA<strong>{item.demand}%</strong></span><span>EFICIÊNCIA<strong>+{item.efficiency}%</strong></span></div><div className="balance-scenario-chart">{monthlySupply.map((value, index) => <i key={index} className={value * item.rainfall / 100 < monthlyDemand[index] * item.demand / 100 * (1 - item.efficiency / 100) ? "deficit" : ""} style={{ height: `${Math.max(12, value * item.rainfall / 100 * 4)}%` }} />)}</div><div className="balance-scenario-results"><span>SALDO<strong className={item.balance < 0 ? "critical" : ""}>{item.balance > 0 ? "+" : ""}{item.balance} hm³</strong></span><span>CONFIABILIDADE<strong>{item.reliability || "—"}%</strong></span><span>DÉFICIT<strong>{item.deficit} hm³</strong></span><span>CUSTO<strong>R$ {item.cost} mi</strong></span></div><section><span>REGRA</span><p>{item.rule}</p></section><footer><button onClick={(event) => { event.stopPropagation(); onToast(`${item.id}: parâmetros, dados, modelo, logs e resultados carregados.`); }}>Ver memória</button><button disabled={item.status === "Executando"} onClick={(event) => { event.stopPropagation(); runScenario(item); }}>▶ {item.status === "Concluído" ? "Reexecutar" : "Executar"}</button><button className="primary" disabled={item.status !== "Concluído"} onClick={(event) => { event.stopPropagation(); setSelectedScenarioId(item.id); setDecisionModalOpen(true); }}>Comparar →</button></footer></article>)}</div></div>;

  const Reservoirs = () => <div className="balance-reservoirs"><header className="balance-section-toolbar"><div><h2>Reservatórios e regras operativas</h2><p>Volume, afluência, defluência, curva-alvo, restrições e efeitos a jusante</p></div><div><button onClick={() => openConsumer("m3")}>Regras M3 ↗</button><button className="primary" onClick={simulateReservoir}>▶ Simular operação</button></div></header><div className="balance-reservoir-layout"><article className="panel balance-reservoir-list"><div className="balance-reservoir-head"><span>RESERVATÓRIO / BACIA</span><span>VOLUME</span><span>AFLUÊNCIA</span><span>DEFLUÊNCIA</span><span>ALVO</span><span>TENDÊNCIA</span><span /></div>{reservoirs.map((item) => <button key={item.id} className={item.id === selectedReservoir.id ? "selected" : ""} onClick={() => { setSelectedReservoirId(item.id); focusTerritory(`${item.name} · ${item.volume}%`, item.center, 92); }}><span className="balance-reservoir-icon">▰</span><div><small>{item.id} · {item.basin}</small><strong>{item.name}</strong><p>{item.restriction}</p></div><div className="balance-volume"><i><b style={{ width: `${item.volume}%` }} /></i><strong>{item.volume}%</strong></div><span>{item.inflow} m³/s</span><span>{item.outflow.toFixed(1)} m³/s</span><b>{item.target}%</b><em className={statusClass(item.trend)}>{item.trend}</em><i>→</i></button>)}</article><aside className="panel balance-reservoir-detail"><header><div><small>{selectedReservoir.id} · {selectedReservoir.basin}</small><h2>{selectedReservoir.name}</h2><p>{selectedReservoir.restriction}</p></div><span>{reservoirSimulated ? "SIMULADO" : "ATUAL"}</span></header><div className="balance-reservoir-gauge"><div style={{ "--level": `${selectedReservoir.volume}%` } as React.CSSProperties}><span>{selectedReservoir.volume}%</span><small>volume útil {selectedReservoir.useful}%</small></div><section><span>AFLUÊNCIA<strong>{selectedReservoir.inflow} m³/s</strong></span><span>DEFLUÊNCIA<strong>{selectedReservoir.outflow.toFixed(1)} m³/s</strong></span><span>CURVA-ALVO<strong>{selectedReservoir.target}%</strong></span><span>TENDÊNCIA<strong>{selectedReservoir.trend}</strong></span></section></div><div className="balance-operation-curve"><span>CURVA OPERATIVA · PRÓXIMAS 12 SEMANAS</span><div>{[63,62,61,59,57,55,54,53,54,56,58,60].map((value,index) => <i key={index} style={{ height: `${value}%` }}><b /></i>)}</div><footer><span>mínimo 45%</span><span>alvo {selectedReservoir.target}%</span><span>máximo 85%</span></footer></div><section className="balance-operation-effects"><span>EFEITOS DA ALTERNATIVA</span><p><b>+2,1 pt</b> de volume ao final do horizonte</p><p><b>−0,4 m³/s</b> na defluência média por 21 dias</p><p><b>+0,6%</b> de risco no trecho jusante · exige gatilho M9</p></section><footer><button onClick={() => openConsumer("m9")}>Plano de contingência M9</button><button onClick={() => emitTowerEvent("Operação de reservatório requer decisão", "Alto", `${selectedReservoir.name}: alternativa afeta defluência e risco a jusante.`)}>Enviar ao M0</button><button className="primary" onClick={() => setDecisionModalOpen(true)}>Revisar alternativa →</button></footer></aside></div></div>;

  const Groundwater = () => <div className="balance-groundwater"><header className="balance-section-toolbar"><div><h2>Águas subterrâneas</h2><p>Poços, nível, recarga, retirada, interação superficial e incerteza</p></div><div><button onClick={() => openConsumer("m5")}>Dados de poços M5 ↗</button><button className="primary" onClick={validateGroundwater}>Validar cenário</button></div></header><div className="balance-aquifer-summary"><article><span>POÇOS CADASTRADOS</span><strong>8.162</strong><small>1.786 monitorados no recorte</small></article><article><span>RECARGA ESTIMADA</span><strong>16,3 hm³</strong><small>mês · faixa ±3,8</small></article><article><span>RETIRADA ESTIMADA</span><strong>12,9 hm³</strong><small>79% da recarga</small></article><article><span>CONFIANÇA MÉDIA</span><strong>{groundwaterValidated ? "84%" : "79%"}</strong><small>{groundwaterValidated ? "validação M5 incorporada" : "cobertura espacial limitada"}</small></article></div><div className="balance-aquifer-layout"><article className="panel balance-aquifer-list"><div className="balance-aquifer-head"><span>AQUÍFERO / TERRITÓRIO</span><span>POÇOS</span><span>MONITORADOS</span><span>NÍVEL</span><span>RECARGA</span><span>RETIRADA</span><span>CONFIANÇA</span><span>STATUS</span></div>{aquifers.map((item) => <button key={item.id} className={item.id === selectedAquifer.id ? "selected" : ""} onClick={() => setSelectedAquiferId(item.id)}><span className="balance-aquifer-icon">▽</span><div><small>{item.id}</small><strong>{item.name}</strong><p>{item.territory}</p></div><b>{item.wells.toLocaleString("pt-BR")}</b><span>{item.monitored}</span><span>{item.level} m</span><span>{item.recharge} hm³</span><span>{item.withdrawal} hm³</span><div className="balance-confidence"><i><b style={{ width: `${item.confidence}%` }} /></i><strong>{item.confidence}%</strong></div><em className={statusClass(item.status)}>{item.status}</em></button>)}</article><aside className="panel balance-aquifer-detail"><header><div><small>{selectedAquifer.id}</small><h2>{selectedAquifer.name}</h2><p>{selectedAquifer.territory}</p></div><em className={statusClass(selectedAquifer.status)}>{selectedAquifer.status}</em></header><div className="balance-aquifer-budget"><div><span>RECARGA</span><strong>{selectedAquifer.recharge} hm³</strong><i /></div><b>−</b><div><span>RETIRADA</span><strong>{selectedAquifer.withdrawal} hm³</strong><i className="withdraw" /></div><b>=</b><div><span>SALDO</span><strong className={selectedAquifer.recharge - selectedAquifer.withdrawal < 0 ? "critical" : ""}>{(selectedAquifer.recharge - selectedAquifer.withdrawal).toFixed(1)} hm³</strong></div></div><section><span>INTERAÇÕES E RESSALVAS</span><p>Baseflow estimado responde por 18% da vazão seca no trecho correlato.</p><p>{selectedAquifer.monitored}/{selectedAquifer.wells.toLocaleString("pt-BR")} poços possuem observação útil; extrapolação domina a incerteza.</p><p>Retirada declarada e medida ainda não cobre usos difusos.</p></section><div className="balance-aquifer-action"><span>✦</span><div><strong>Alternativa assistida</strong><p>Limitar crescimento da retirada a 3% e ampliar monitoramento em 24 poços prioritários.</p></div><b>{selectedAquifer.confidence}%</b></div><footer><button onClick={() => onNavigate("Cenários")}>Simular retirada</button><button onClick={() => openConsumer("m8")}>Planejar rede M8</button></footer></aside></div></div>;

  const Forecasts = () => <div className="balance-forecasts"><header className="balance-section-toolbar"><div><h2>Previsões e envelopes de incerteza</h2><p>Ensemble hidrometeorológico, demanda, reservação e gatilhos operacionais</p></div><div><button onClick={() => openConsumer("m5")}>Forçantes M5 ↗</button><button className="primary" onClick={() => { setForecastUpdated(true); onToast("Ensemble atualizado com 30 membros e novas observações do M5."); }}>↻ Atualizar ensemble</button></div></header><div className="balance-forecast-layout"><article className="panel balance-fan-panel"><header><div><small>PREVISÃO DE VAZÃO · {subject.stationId}</small><h2>Próximos 14 dias</h2><p>30 membros · atualização {forecastUpdated ? "agora" : "06:00 BRT"}</p></div><span>{forecastUpdated ? "ATUALIZADO" : "OPERACIONAL"}</span></header><div className="balance-fan-legend"><span><i className="p90" />P10–P90</span><span><i className="p50" />Mediana</span><span><i className="threshold" />Gatilho 40 L/s</span></div><div className="balance-fan-chart"><div className="balance-trigger-line"><span>40 L/s</span></div>{forecastMedian.map((value,index) => <div key={index}><i className="band" style={{ height: `${38 + index * 1.4}%`, bottom: `${Math.max(5,value - 28)}%` }} /><b style={{ height: `${value + (forecastUpdated ? 2 : 0)}%` }} /><span>{index + 1}</span></div>)}</div><div className="balance-fan-axis"><span>D+1</span><span>D+4</span><span>D+7</span><span>D+10</span><span>D+14</span></div><section className="balance-forecast-insight"><span>✦ SÍNTESE DO ENSEMBLE</span><p>Probabilidade de vazão abaixo de 40 L/s: <b>37%</b> entre D+9 e D+12. Mediana se recupera após D+12, mas a dispersão cresce.</p><small>Não constitui previsão oficial; consultar boletins da autoridade e fontes citadas.</small></section><footer><button onClick={() => onToast("Boletim técnico preparado com fontes, skill, ensemble, faixa e ressalvas.")}>⇩ Exportar boletim</button><button onClick={() => emitTowerEvent("Gatilho de vazão previsto", "Médio", "37% de probabilidade abaixo de 40 L/s entre D+9 e D+12; acompanhar atualização do ensemble.")}>Criar alerta M0</button></footer></article><aside className="panel balance-forecast-sources"><header className="panel-header"><div><h2>Forçantes e skill</h2><p>fontes do ensemble</p></div><span>30 membros</span></header>{[["CPTEC BRAMS", "precipitação e temperatura", "0,87", "06:00"], ["INMET COSMO", "precipitação", "0,84", "05:42"], ["ECMWF aberto", "ensemble global", "0,91", "03:00"], ["M5 observações", `${subject.seriesId} · ${subject.dataVersion}`, "0,94", subject.observedAt], ["Demanda M4", `${subject.demandId} · ${subject.requestedFlow} L/s`, "fonte", "09:18"]].map((item) => <button key={item[0]}><span>⌁</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div><b>{item[2]}</b><time>{item[3]}</time><i>↗</i></button>)}<section><span>DECOMPOSIÇÃO DA INCERTEZA</span>{[["Clima", 42], ["Parâmetros", 24], ["Dados", 18], ["Demanda", 11], ["Regras", 5]].map((item) => <p key={item[0] as string}><span>{item[0]}</span><i><b style={{ width: `${item[1]}%` }} /></i><strong>{item[1]}%</strong></p>)}</section></aside></div></div>;

  const Comparisons = () => <div className="balance-comparisons"><header className="balance-section-toolbar"><div><h2>Comparação multicritério</h2><p>Segurança hídrica, confiabilidade, déficit, custo, ambiente e governança</p></div><div><button onClick={startAgent}>✦ Recalcular pesos</button><button className="primary" onClick={() => setDecisionModalOpen(true)}>Revisar recomendação</button></div></header><div className="balance-comparison-top"><article className="panel balance-weights"><header className="panel-header"><div><h2>Pesos da decisão</h2><p>perfil: segurança e usos múltiplos</p></div><span>100%</span></header>{[["Confiabilidade", 28], ["Déficit", 24], ["Custo", 14], ["Impacto ambiental", 16], ["Equidade", 10], ["Implementabilidade", 8]].map((item) => <label key={item[0] as string}><span>{item[0]}</span><input type="range" min="0" max="40" defaultValue={item[1]} /><b>{item[1]}%</b></label>)}<footer><button onClick={() => onToast("Pesos restaurados conforme perfil institucional aprovado.")}>Restaurar perfil</button><button onClick={() => onToast("Análise de sensibilidade: B permanece recomendado em 82% das combinações.")}>Sensibilidade</button></footer></article><article className="panel balance-recommendation"><span>✦ RECOMENDAÇÃO ASSISTIDA · 91/100</span><h2>Cenário B · Ampliação com eficiência</h2><p>Melhor compromisso entre confiabilidade, saldo, custo e flexibilidade. Mantém limite vigente até implementação das medidas e revisão humana.</p><div><span>CONFIABILIDADE<strong>88%</strong></span><span>SALDO<strong>+3,1 hm³</strong></span><span>DÉFICIT<strong>1,7 hm³</strong></span><span>CUSTO<strong>R$ 4,8 mi</strong></span></div><section><span>LIMITES</span><p>A recomendação muda se o peso de custo superar 31% ou se o cenário climático cair abaixo de P20.</p></section><button onClick={() => { setSelectedScenarioId("CEN-2026-0048-B"); setDecisionModalOpen(true); }}>Revisar e registrar decisão →</button></article></div><article className="panel balance-matrix"><div className="balance-matrix-head"><span>ALTERNATIVA</span><span>SCORE</span><span>CONFIABILIDADE</span><span>SALDO</span><span>DÉFICIT</span><span>CUSTO</span><span>AMBIENTE</span><span>IMPLEMENTAÇÃO</span><span>STATUS</span></div>{scenarios.filter((item) => item.status !== "Rascunho" && item.status !== "Executando").map((item) => <button key={item.id} className={item.id === selectedScenario.id ? "selected" : ""} onClick={() => setSelectedScenarioId(item.id)}><span className={`balance-rank ${item.score >= 85 ? "good" : item.score < 60 ? "critical" : "warn"}`}>{item.score}</span><div><small>{item.id}</small><strong>{item.name}</strong><p>{item.climate}</p></div><b>{item.score}/100</b><span>{item.reliability}%</span><span className={item.balance < 0 ? "critical" : "good"}>{item.balance > 0 ? "+" : ""}{item.balance} hm³</span><span>{item.deficit} hm³</span><span>R$ {item.cost} mi</span><span>{item.id.endsWith("B") ? "moderado" : item.id.endsWith("C") ? "alto" : "baixo"}</span><span>{item.id.endsWith("A") ? "imediata" : "6–12 meses"}</span><em className={statusClass(item.status)}>{item.status}</em></button>)}</article></div>;

  const Library = () => <div className="balance-library"><header className="balance-section-toolbar"><div><h2>Biblioteca de modelos, dados e cenários</h2><p>Pacotes reprodutíveis, versões, licenças, checksums, linhagem e consumidores</p></div><div><button onClick={() => openConsumer("m11")}>Governança M11 ↗</button><button className="primary" onClick={() => setLibraryModalOpen(true)}>＋ Adicionar pacote</button></div></header><div className="balance-library-summary"><article><span>MODELOS PUBLICADOS</span><strong>28</strong><small>11 ativos · 4 em homologação</small></article><article><span>DATASETS VERSIONADOS</span><strong>146</strong><small>96,8% no SLA</small></article><article><span>CENÁRIOS DECISÓRIOS</span><strong>384</strong><small>91 com monitoramento ativo</small></article><article><span>REPRODUTIBILIDADE</span><strong>98,2%</strong><small>pacote + snapshot + ambiente</small></article></div><article className="panel balance-library-table"><div className="balance-library-head"><span>PACOTE / RESPONSÁVEL</span><span>TIPO</span><span>VERSÃO</span><span>FORMATO</span><span>LICENÇA</span><span>CONSUMIDORES</span><span>STATUS</span><span /></div>{library.map((item) => <button key={item.id} onClick={() => onToast(`${item.id}: manifest, checksum, SBOM, documentação, linhagem e exemplos carregados.`)}><span className="balance-package-icon">▣</span><div><small>{item.id}</small><strong>{item.name}</strong><p>{item.owner}</p></div><span>{item.kind}</span><code>{item.version}</code><span>{item.format}</span><span>{item.license}</span><span>{item.consumers}</span><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article><div className="balance-library-bottom"><article className="panel balance-provenance"><header className="panel-header"><div><h2>Proveniência do cenário</h2><p>{selectedScenario.id}</p></div><span>reprodutível</span></header>{[["Dados", `${subject.seriesId} · ${subject.dataVersion}`, "M5"], ["Demanda", `${subject.demandId} · ${subject.requestedFlow} L/s`, "M4"], ["Regras", "release 2026.08.3", "M3"], ["Modelo", `${selectedModel.id} · ${selectedModel.version}`, "M6"], ["Parâmetros", `${selectedScenario.climate} · demanda ${selectedScenario.demand}%`, "snapshot"], ["Resultado", `${selectedScenario.balance} hm³ · ${selectedScenario.reliability}%`, "versionado"]].map((item) => <div key={item[0]}><b>{item[2]}</b><span><strong>{item[0]}</strong><small>{item[1]}</small></span><i>✓</i></div>)}</article><article className="panel balance-reuse"><span>REUTILIZAÇÃO CONTROLADA</span><h2>Executar o mesmo pacote em outro território</h2><p>O assistente verifica compatibilidade espacial, temporal, dados mínimos, parâmetros transferíveis e skill esperado antes de permitir a execução.</p><div><span>Escopo atual<strong>{subject.chtId}</strong></span><span>Modelo<strong>{selectedModel.version}</strong></span><span>Dados<strong>{subject.dataVersion}</strong></span></div><button onClick={() => setScenarioModalOpen(true)}>Criar cenário derivado →</button></article></div></div>;

  const views: Record<string, () => ReactNode> = { "Balanço atual": CurrentBalance, "Modelos": Models, "Cenários": Scenarios, "Reservatórios": Reservoirs, "Águas subterrâneas": Groundwater, "Previsões": Forecasts, "Comparações": Comparisons, "Biblioteca": Library };
  const ActiveView = views[contextItem] ?? CurrentBalance;
  const agentSteps = ["Resolver território, demanda, regras e horizonte", "Recuperar séries qualificadas e snapshots M5", "Selecionar modelo e validar domínio de aplicabilidade", "Executar ensemble e propagar incertezas", "Comparar alternativas, trade-offs e gatilhos", "Gerar recomendação, limites e plano de monitoramento"];

  return <section className="balance-hub" aria-label={`Balanço e Cenários — ${contextItem}`}><div className="balance-context-bar"><div><span>BC</span><small>CENÁRIO ATIVO</small><strong>{selectedScenario.id} · {selectedScenario.status}</strong></div><div><span>⌖</span><small>TERRITÓRIO E DEMANDA</small><strong>{subject.chtId} · {subject.demandId}</strong></div><div><span>ƒ</span><small>MODELO</small><strong>{selectedModel.id} · {selectedModel.version}</strong></div><div><span>◴</span><small>REFERÊNCIA</small><strong>{clockLabel} BRT · dados {subject.dataVersion}</strong></div><button onClick={startAgent}>✦ Modelagem e Cenários</button></div><Kpis /><ActiveView />

    {modelModalOpen && <div className="balance-modal-backdrop" onMouseDown={() => setModelModalOpen(false)}><form className="balance-model-modal" onSubmit={registerModel} onMouseDown={(event) => event.stopPropagation()}><header><div><small>NOVO MODELO · MODEL REGISTRY</small><h2>Registrar pacote executável</h2><p>O modelo nasce em homologação e não atende decisões até passar pelos gates.</p></div><button type="button" onClick={() => setModelModalOpen(false)}>×</button></header><div className="balance-modal-grid"><label className="full"><span>NOME E FAMÍLIA</span><input defaultValue="Modelo chuva–vazão regional" /></label><label><span>ENGINE</span><select defaultValue="Container OCI"><option>Container OCI</option><option>Python package</option><option>R package</option><option>Serviço externo</option></select></label><label><span>VERSÃO</span><input defaultValue="v0.1-rc1" /></label><label className="full"><span>DOMÍNIO DE APLICABILIDADE</span><input defaultValue={`${subject.chtId} · resolução diária · horizonte 12 meses`} /></label><label><span>MÉTODO DE INCERTEZA</span><select defaultValue="Monte Carlo"><option>Monte Carlo</option><option>Ensemble</option><option>Bootstrap</option><option>Faixa paramétrica</option></select></label><label><span>ARTEFATO</span><input defaultValue="registry.cht/model:0.1-rc1" /></label><label className="full"><span>DADOS E PARÂMETROS MÍNIMOS</span><textarea defaultValue="Rede BHO6; vazão diária; precipitação; demandas por setor; regras operativas; condição inicial." /></label></div><section><span>GATES OBRIGATÓRIOS</span><p>segurança · SBOM · reprodutibilidade · backtest · stress · incerteza · revisão técnica · rollback</p></section><footer><button type="button" onClick={() => setModelModalOpen(false)}>Cancelar</button><button type="submit" className="primary">Registrar em homologação →</button></footer></form></div>}

    {scenarioModalOpen && <div className="balance-modal-backdrop" onMouseDown={() => setScenarioModalOpen(false)}><form className="balance-scenario-modal" onSubmit={createScenario} onMouseDown={(event) => event.stopPropagation()}><header><div><small>NOVO CENÁRIO · {subject.chtId}</small><h2>Parametrizar alternativa</h2><p>Dados, modelo, regras e parâmetros serão congelados em um snapshot.</p></div><button type="button" onClick={() => setScenarioModalOpen(false)}>×</button></header><div className="balance-scenario-steps">{[["1", "Contexto"], ["2", "Clima"], ["3", "Demanda"], ["4", "Regras"], ["5", "Execução"], ["6", "Comparação"]].map((item,index) => <div key={item[0]} className={index === 0 ? "active" : ""}><span>{item[0]}</span><strong>{item[1]}</strong>{index < 5 && <i>→</i>}</div>)}</div><div className="balance-modal-grid"><label className="full"><span>NOME</span><input defaultValue="Ampliação com eficiência e restrição sazonal" /></label><label><span>CLIMA / FORÇANTE</span><select defaultValue="Seco moderado P35"><option>Referência sazonal</option><option>Seco moderado P35</option><option>Seco severo P10</option><option>Úmido P75</option></select></label><label><span>CHUVA RELATIVA</span><div><input type="number" defaultValue="88" /><em>%</em></div></label><label><span>DEMANDA RELATIVA</span><div><input type="number" defaultValue="112" /><em>%</em></div></label><label><span>GANHO DE EFICIÊNCIA</span><div><input type="number" defaultValue="15" /><em>%</em></div></label><label><span>HORIZONTE</span><select defaultValue="12 meses"><option>30 dias</option><option>6 meses</option><option>12 meses</option><option>24 meses</option></select></label><label><span>REGRA OPERATIVA</span><select defaultValue="Limite sazonal + gatilhos"><option>Regras vigentes</option><option>Limite sazonal + gatilhos</option><option>Prioridade abastecimento</option></select></label><label className="full"><span>INFRAESTRUTURA E PREMISSAS</span><textarea defaultValue="Reservatórios operam pela curva-alvo; limite vigente de 52 L/s até decisão; eficiência implantada em 6 meses." /></label></div><section><span>SNAPSHOT DE ENTRADA</span><p>{subject.seriesId} {subject.dataVersion} · {subject.demandId} · regras 2026.08.3 · {selectedModel.id} {selectedModel.version}</p></section><footer><button type="button" onClick={() => setScenarioModalOpen(false)}>Salvar rascunho</button><button type="submit" className="primary">Executar cenário →</button></footer></form></div>}

    {decisionModalOpen && <div className="balance-modal-backdrop" onMouseDown={() => setDecisionModalOpen(false)}><section className="balance-decision-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>DECISÃO HUMANA · {selectedScenario.id}</small><h2>Selecionar cenário para encaminhamento</h2><p>Recomendação assistida · sem comando operacional ou efeito regulatório</p></div><button onClick={() => setDecisionModalOpen(false)}>×</button></header><div className="balance-decision-metrics"><div><span>SCORE</span><strong>{selectedScenario.score}/100</strong></div><div><span>CONFIABILIDADE</span><strong>{selectedScenario.reliability}%</strong></div><div><span>SALDO</span><strong>{selectedScenario.balance > 0 ? "+" : ""}{selectedScenario.balance} hm³</strong></div><div><span>INCERTEZA</span><strong>P10–P90</strong></div></div><section><span>ALTERNATIVA</span><p>{selectedScenario.name}: {selectedScenario.climate}, demanda {selectedScenario.demand}%, eficiência +{selectedScenario.efficiency}% e {selectedScenario.rule}.</p></section><section className="tradeoffs"><span>TRADE-OFFS</span><p>Melhora segurança e flexibilidade, porém requer R$ {selectedScenario.cost} mi, acompanhamento sazonal e manutenção do limite vigente até nova decisão.</p></section><section className="limit"><span>LIMITES</span><p>O sistema não opera reservatórios, altera atos, publica previsão oficial ou executa investimento. A seleção registra somente o cenário decisório.</p></section><label><span>JUSTIFICATIVA DA AUTORIDADE</span><textarea defaultValue="Seleciono a alternativa por apresentar melhor equilíbrio entre confiabilidade, déficit, custo e flexibilidade, condicionada ao monitoramento dos gatilhos sazonais." /></label><footer><button onClick={() => setDecisionModalOpen(false)}>Cancelar</button><button onClick={() => { setDecisionModalOpen(false); onToast("Cenário devolvido para ajuste com observações registradas."); }}>Devolver para ajuste</button><button className="primary" onClick={decideComparison}>✓ Selecionar e monitorar</button></footer></section></div>}

    {libraryModalOpen && <div className="balance-modal-backdrop" onMouseDown={() => setLibraryModalOpen(false)}><form className="balance-library-modal" onSubmit={addLibraryItem} onMouseDown={(event) => event.stopPropagation()}><header><div><small>NOVO PACOTE · BIBLIOTECA</small><h2>Adicionar artefato reprodutível</h2><p>Checksum, licença, versão, ambiente e dependências serão registrados.</p></div><button type="button" onClick={() => setLibraryModalOpen(false)}>×</button></header><div className="balance-modal-grid"><label className="full"><span>NOME DO PACOTE</span><input defaultValue="Pacote de modelo e cenário territorial" /></label><label><span>TIPO</span><select defaultValue="Model package"><option>Model package</option><option>Dataset</option><option>Scenario package</option><option>Forçante climática</option></select></label><label><span>VERSÃO</span><input defaultValue="v0.1" /></label><label><span>FORMATO</span><select defaultValue="OCI + JSON-LD"><option>OCI + JSON-LD</option><option>Parquet + metadata</option><option>Zarr + STAC</option></select></label><label><span>LICENÇA</span><select defaultValue="Homologação"><option>Público</option><option>Uso institucional</option><option>Homologação</option></select></label><label className="full"><span>ARTEFATO / URI</span><input defaultValue="registry.cht/library/package:0.1" /></label><label className="full"><span>DOCUMENTAÇÃO E CONSUMIDORES</span><textarea defaultValue="M6 execução e comparação; M8 planejamento; M9 eventos críticos." /></label></div><section><span>VALIDAÇÕES</span><p>integridade · malware · SBOM · licença · schema · documentação · teste reprodutível · responsável</p></section><footer><button type="button" onClick={() => setLibraryModalOpen(false)}>Cancelar</button><button type="submit" className="primary">Adicionar em homologação →</button></footer></form></div>}

    {agentOpen && <div className="balance-agent-backdrop" onMouseDown={() => setAgentOpen(false)}><aside className="balance-agent-drawer" onMouseDown={(event) => event.stopPropagation()}><header><div className="balance-agent-avatar">✦</div><div><small>{agentRunning ? "EXECUÇÃO AO VIVO" : "ANÁLISE CONCLUÍDA"}</small><h2>Modelagem e Cenários</h2><p>Trace M6-A06-{selectedScenario.id.slice(-4)} · política BSC-HIL-006</p></div><button onClick={() => setAgentOpen(false)}>×</button></header><div className="balance-agent-scopes"><span>ESCOPOS</span><b>Consultar</b><b>Executar modelo</b><b>Simular</b><b>Comparar</b><b className="blocked">Operar sistema ✕</b></div><section className="balance-agent-plan"><h3>Plano de execução</h3>{agentSteps.map((item,index) => <div key={item} className={index < agentStep ? "done" : index === agentStep ? "running" : "waiting"}><span>{index < agentStep ? "✓" : index === agentStep ? "●" : "○"}</span><div><strong>{item}</strong><small>{index < agentStep ? `${610 + index * 384} ms · artefato registrado` : index === agentStep ? "executando ferramentas autorizadas…" : "aguardando dependência"}</small></div></div>)}</section><section className="balance-agent-tools"><h3>Ferramentas e grounding</h3>{[["M5 Data Hub", `${subject.seriesId} · ${subject.dataVersion}`, `${subject.quality}%`], ["M4 Regulação", `${subject.demandId} · ${subject.requestedFlow} L/s`, "fonte"], ["M3 Regras", "14 regras · 3 condicionantes", "97%"], ["Model Registry", `${selectedModel.id} · ${selectedModel.version}`, `${selectedModel.skill}%`]].map((item) => <button key={item[0]}><span>▤</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div><b>{item[2]}</b></button>)}</section><section className="balance-agent-output"><div><h3>Saída estruturada</h3><span>91% confiança</span></div><p><b>Fato:</b> saldo atual de +5,3 hm³/mês, com redução para +2,4 hm³ no P10 seco.</p><p><b>Alternativa:</b> cenário B combina eficiência de 18% e gatilhos sazonais.</p><p><b>Trade-off:</b> custo de R$ 4,8 mi e implantação estimada em 6–12 meses.</p><p><b>Limite:</b> o agente não opera infraestrutura, altera ato, publica previsão oficial ou decide investimento.</p></section><footer><button onClick={() => { setAgentRunning(false); onToast("Agente pausado; execução e artefatos foram preservados."); }}>■ Pausar</button><button onClick={() => openConsumer("m12")}>Central de Agentes</button><button className="primary" onClick={() => { setAgentOpen(false); setDecisionModalOpen(true); }}>Revisar recomendação →</button></footer></aside></div>}
  </section>;
}
