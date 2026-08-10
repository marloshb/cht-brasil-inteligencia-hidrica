"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";

type StationStatus = "Operacional" | "Atenção" | "Intermitente" | "Offline";
type DataState = "Bruta" | "Qualificada" | "Publicada" | "Em processamento";
type IssueStatus = "Aberta" | "Em análise" | "Resolvida" | "Ignorada";

type Station = {
  id: string;
  name: string;
  kind: string;
  operator: string;
  status: StationStatus;
  lastSeen: string;
  latency: string;
  completeness: number;
  quality: number;
  variables: string[];
  territory: string;
  center: [number, number];
};

type DataSeries = {
  id: string;
  stationId: string;
  variable: string;
  unit: string;
  frequency: string;
  records: string;
  range: string;
  completeness: number;
  quality: number;
  state: DataState;
  version: string;
};

type Connector = {
  id: string;
  name: string;
  protocol: string;
  rate: string;
  latency: string;
  backlog: number;
  state: "Streaming" | "Degradado" | "Pausado";
  lastEvent: string;
};

type ImageAsset = {
  id: string;
  collection: string;
  acquired: string;
  resolution: string;
  cloud: number;
  coverage: string;
  product: string;
  state: "Disponível" | "Processando" | "Analisada";
};

type QualityIssue = {
  id: string;
  seriesId: string;
  rule: string;
  severity: "Crítica" | "Alta" | "Média" | "Baixa";
  window: string;
  value: string;
  confidence: number;
  status: IssueStatus;
  recommendation: string;
};

type DataEvent = {
  id: string;
  title: string;
  type: string;
  stationId: string;
  severity: "Crítica" | "Alta" | "Média" | "Baixa";
  detectedAt: string;
  confidence: number;
  status: "Novo" | "Reconhecido" | "Encaminhado" | "Encerrado";
  consumers: string[];
};

type CatalogAsset = {
  id: string;
  name: string;
  owner: string;
  kind: string;
  standard: string;
  cadence: string;
  access: string;
  sla: string;
  quality: number;
  status: "Ativo" | "Degradado" | "Homologação";
};

type DataHubProps = {
  contextItem: string;
  territory: string;
  clockLabel: string;
  onNavigate: (item: string) => void;
  onOpenModule: (moduleId: string) => void;
  onCreateRecord: () => void;
  onToast: (message: string) => void;
};

const initialStations: Station[] = [
  { id: "EST-DF-60435100", name: "Mestre d'Armas · ponte DF-130", kind: "Fluviométrica + telemetria", operator: "ANA · Hidroweb", status: "Operacional", lastSeen: "há 18 s", latency: "18 s", completeness: 98.7, quality: 94, variables: ["Vazão", "Nível", "Chuva"], territory: "Paranaíba / UGRH DF / ottobacia 769943", center: [-47.78, -15.6] },
  { id: "EST-BA-46590000", name: "Rio das Fêmeas · Fazenda Horizonte", kind: "Telemétrica de uso", operator: "INEMA · operador", status: "Atenção", lastSeen: "há 4 min", latency: "4 min", completeness: 91.2, quality: 86, variables: ["Vazão captada", "Volume"], territory: "São Francisco / Grande / ottobacia 744125", center: [-45.46, -12.32] },
  { id: "EST-SP-64321080", name: "Sistema Noroeste · macromedidor 04", kind: "Automonitoramento", operator: "SP Águas · concessionária", status: "Operacional", lastSeen: "há 42 s", latency: "42 s", completeness: 99.1, quality: 96, variables: ["Vazão", "Pressão", "Volume"], territory: "Paraná / Tietê / UGRHI 18", center: [-50.1, -20.4] },
  { id: "EST-MT-66021400", name: "Alto Paraguai · barramento 01782", kind: "Nível + operação", operator: "SEMA-MT", status: "Intermitente", lastSeen: "há 38 min", latency: "38 min", completeness: 78.4, quality: 81, variables: ["Nível", "Defluência"], territory: "Paraguai / Alto Paraguai / UGRH P2", center: [-54.6, -16.2] },
  { id: "EST-PE-39512000", name: "Rio Pajeú · Floresta", kind: "Pluviométrica", operator: "CEMADEN", status: "Offline", lastSeen: "há 3 h", latency: "> SLA", completeness: 62.8, quality: 74, variables: ["Chuva"], territory: "São Francisco / Pajeú", center: [-38.57, -8.6] },
];

const initialSeries: DataSeries[] = [
  { id: "SER-DF-004918-Q", stationId: "EST-DF-60435100", variable: "Vazão instantânea", unit: "L/s", frequency: "15 min", records: "3,84 mi", range: "01 jan 2021 → agora", completeness: 98.7, quality: 94, state: "Qualificada", version: "qv18" },
  { id: "SER-DF-004918-B", stationId: "EST-DF-60435100", variable: "Vazão instantânea · bruto", unit: "L/s", frequency: "15 min", records: "3,86 mi", range: "01 jan 2021 → agora", completeness: 99.2, quality: 78, state: "Bruta", version: "raw-immutable" },
  { id: "SER-DF-CHUVA-01", stationId: "EST-DF-60435100", variable: "Precipitação acumulada", unit: "mm", frequency: "10 min", records: "2,14 mi", range: "18 mar 2022 → agora", completeness: 96.4, quality: 91, state: "Publicada", version: "qv11" },
  { id: "SER-BA-018407-Q", stationId: "EST-BA-46590000", variable: "Vazão captada", unit: "L/s", frequency: "1 h", records: "118 mil", range: "11 jul 2022 → agora", completeness: 91.2, quality: 86, state: "Qualificada", version: "qv7" },
  { id: "SER-SP-009142-Q", stationId: "EST-SP-64321080", variable: "Volume captado", unit: "m³", frequency: "1 h", records: "146 mil", range: "01 out 2021 → agora", completeness: 99.1, quality: 96, state: "Publicada", version: "qv21" },
];

const initialConnectors: Connector[] = [
  { id: "CON-HIDROWEB-01", name: "Hidroweb Telemetria", protocol: "API + CDC", rate: "186 evt/s", latency: "18 s", backlog: 0, state: "Streaming", lastEvent: "agora · 09:54:18" },
  { id: "CON-CEMADEN-02", name: "CEMADEN pluviometria", protocol: "MQTT bridge", rate: "92 evt/s", latency: "31 s", backlog: 14, state: "Streaming", lastEvent: "há 6 s" },
  { id: "CON-INEMA-04", name: "INEMA piloto BA", protocol: "OGC API / lote", rate: "24 evt/s", latency: "4 min", backlog: 182, state: "Degradado", lastEvent: "há 4 min" },
  { id: "CON-RNQA-01", name: "RNQA qualidade da água", protocol: "SFTP + contrato", rate: "D+1", latency: "11 h", backlog: 0, state: "Streaming", lastEvent: "hoje · 06:00" },
  { id: "CON-LEGACY-07", name: "Coletor estadual legado", protocol: "CSV diário", rate: "pausado", latency: "—", backlog: 2418, state: "Pausado", lastEvent: "09 ago · 18:00" },
];

const initialImages: ImageAsset[] = [
  { id: "S2B-23LPG-20260809", collection: "Sentinel-2 L2A", acquired: "09 ago · 13:27 UTC", resolution: "10 m", cloud: 4, coverage: "98% da UTH", product: "Água superficial + turbidez proxy", state: "Analisada" },
  { id: "L9-220071-20260807", collection: "Landsat 9 Collection 2", acquired: "07 ago · 13:11 UTC", resolution: "30 m", cloud: 12, coverage: "100% da UGRH", product: "Índice MNDWI + mudança", state: "Disponível" },
  { id: "CBERS04A-20260808", collection: "CBERS-4A WPM", acquired: "08 ago · 14:02 UTC", resolution: "8 m", cloud: 7, coverage: "74% do corredor", product: "Margem e uso do solo", state: "Processando" },
  { id: "GOES19-20260810", collection: "GOES-19 ABI", acquired: "10 ago · 12:50 UTC", resolution: "2 km", cloud: 38, coverage: "Brasil", product: "Chuva convectiva · nowcast", state: "Disponível" },
];

const coverageRows = [
  { territory: "Paranaíba · UGRH DF", stations: 184, online: 176, coverage: 96, latency: "31 s", gap: "nível subterrâneo", priority: "Baixa" },
  { territory: "São Francisco · Grande", stations: 96, online: 82, coverage: 78, latency: "4 min", gap: "vazão de uso", priority: "Alta" },
  { territory: "Tietê · UGRHI 18", stations: 212, online: 207, coverage: 98, latency: "42 s", gap: "qualidade D+1", priority: "Baixa" },
  { territory: "Alto Paraguai · P2", stations: 71, online: 54, coverage: 69, latency: "38 min", gap: "nível e operação", priority: "Crítica" },
  { territory: "Pajeú · semiárido", stations: 38, online: 25, coverage: 61, latency: "3 h", gap: "chuva e reservação", priority: "Alta" },
];

const initialIssues: QualityIssue[] = [
  { id: "DQ-2026-4418", seriesId: "SER-DF-004918-Q", rule: "Lacuna temporal > 2 intervalos", severity: "Alta", window: "07 ago · 08:00–08:30", value: "2 observações ausentes", confidence: 98, status: "Aberta", recommendation: "Recuperar no buffer do sensor; se indisponível, manter lacuna explícita." },
  { id: "DQ-2026-4412", seriesId: "SER-DF-004918-Q", rule: "Variação instantânea incompatível", severity: "Média", window: "06 ago · 09:15", value: "54,2 L/s · +18%", confidence: 88, status: "Em análise", recommendation: "Conferir calibração, chuva antecedente e ato antes de classificar o pico." },
  { id: "DQ-2026-4389", seriesId: "SER-BA-018407-Q", rule: "Unidade declarada divergente", severity: "Crítica", window: "05–06 ago", value: "m³/h recebido como L/s", confidence: 99, status: "Aberta", recommendation: "Bloquear promoção, corrigir mapping e reprocessar a partir do bruto." },
  { id: "DQ-2026-4371", seriesId: "SER-SP-009142-Q", rule: "Duplicidade de timestamp", severity: "Baixa", window: "04 ago · 14:00", value: "2 registros idênticos", confidence: 97, status: "Resolvida", recommendation: "Manter ambos no bruto e desduplicar na visão qualificada." },
];

const initialEvents: DataEvent[] = [
  { id: "DHE-2026-9841", title: "Vazão acima da referência operacional", type: "hydro.flow.threshold.exceeded", stationId: "EST-DF-60435100", severity: "Alta", detectedAt: "10 ago · 09:51:42", confidence: 94, status: "Novo", consumers: ["M0", "M4", "M6", "M7"] },
  { id: "DHE-2026-9838", title: "Estação perdeu telemetria", type: "station.telemetry.offline", stationId: "EST-PE-39512000", severity: "Alta", detectedAt: "10 ago · 08:02:11", confidence: 99, status: "Encaminhado", consumers: ["M0", "M9", "M11"] },
  { id: "DHE-2026-9822", title: "Área superficial de água reduziu 8%", type: "imagery.water.extent.changed", stationId: "S2B-23LPG-20260809", severity: "Média", detectedAt: "09 ago · 16:18:02", confidence: 87, status: "Reconhecido", consumers: ["M6", "M7", "M8", "M9"] },
  { id: "DHE-2026-9791", title: "Flag de unidade bloqueou série", type: "data.contract.violation", stationId: "EST-BA-46590000", severity: "Crítica", detectedAt: "09 ago · 12:41:28", confidence: 99, status: "Novo", consumers: ["M0", "M4", "M11"] },
];

const initialCatalog: CatalogAsset[] = [
  { id: "DATA-HDW-TELE-01", name: "Hidroweb · observações telemétricas", owner: "ANA · SGH", kind: "Séries temporais", standard: "WaterML 2.0 + OGC API", cadence: "stream + backfill", access: "Público", sla: "99,5% · 2 min", quality: 96, status: "Ativo" },
  { id: "DATA-RNQA-QUAL-02", name: "RNQA · qualidade da água", owner: "ANA + entes", kind: "Amostras laboratoriais", standard: "CSV contratual + vocabulário", cadence: "D+1 / mensal", access: "Federado", sla: "98% · D+2", quality: 91, status: "Ativo" },
  { id: "DATA-STAC-IMG-01", name: "Coleções orbitais CHT", owner: "INPE / ESA / USGS", kind: "STAC catalog", standard: "STAC 1.0 + COG", cadence: "sob demanda", access: "Público", sla: "95% · 6 h", quality: 93, status: "Ativo" },
  { id: "DATA-INEMA-BA-04", name: "Telemetria estadual · piloto BA", owner: "INEMA", kind: "Observações de uso", standard: "OGC API Features", cadence: "5 min", access: "Contrato federativo", sla: "95% · 10 min", quality: 86, status: "Degradado" },
  { id: "DATA-LEGACY-07", name: "Coletor legado estadual", owner: "Órgão parceiro", kind: "Arquivo tabular", standard: "CSV mapeado", cadence: "diário", access: "Restrito", sla: "homologação", quality: 72, status: "Homologação" },
];

const hydroValues = [42, 44, 43, 46, 48, 47, 49, 51, 50, 53, 54, 52, 49, 0, 48, 47, 46, 49, 51, 50, 52, 48, 47, 49, 50, 51, 48, 46, 45, 47, 49, 48];
const statusClass = (value: string) => value.toLowerCase().replaceAll(" ", "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function DataHub({ contextItem, territory, clockLabel, onNavigate, onOpenModule, onCreateRecord, onToast }: DataHubProps) {
  const [stations, setStations] = useState(initialStations);
  const [selectedStationId, setSelectedStationId] = useState(initialStations[0].id);
  const [series, setSeries] = useState(initialSeries);
  const [selectedSeriesId, setSelectedSeriesId] = useState(initialSeries[0].id);
  const [connectors, setConnectors] = useState(initialConnectors);
  const [images, setImages] = useState(initialImages);
  const [selectedImageId, setSelectedImageId] = useState(initialImages[0].id);
  const [issues, setIssues] = useState(initialIssues);
  const [selectedIssueId, setSelectedIssueId] = useState(initialIssues[0].id);
  const [events, setEvents] = useState(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState(initialEvents[0].id);
  const [catalog, setCatalog] = useState(initialCatalog);
  const [stationFilter, setStationFilter] = useState("Todas");
  const [seriesFilter, setSeriesFilter] = useState("Todas");
  const [issueFilter, setIssueFilter] = useState("Todas");
  const [livePulse, setLivePulse] = useState(0);
  const [coverageOptimized, setCoverageOptimized] = useState(false);
  const [stationModalOpen, setStationModalOpen] = useState(false);
  const [ingestModalOpen, setIngestModalOpen] = useState(false);
  const [qualityModalOpen, setQualityModalOpen] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentStep, setAgentStep] = useState(5);
  const [subject, setSubject] = useState({ demandId: "DEM-2026-1842", chtId: "UTH-DF-004918", passportId: "PAS-DF-004918", requestedFlow: 68, authorizedFlow: 52, purpose: "Uso industrial", authority: "ANA · competência indicativa", center: [-47.82, -15.58] as [number, number] });

  const selectedStation = stations.find((item) => item.id === selectedStationId) ?? stations[0];
  const selectedSeries = series.find((item) => item.id === selectedSeriesId) ?? series[0];
  const selectedImage = images.find((item) => item.id === selectedImageId) ?? images[0];
  const selectedIssue = issues.find((item) => item.id === selectedIssueId) ?? issues[0];
  const selectedEvent = events.find((item) => item.id === selectedEventId) ?? events[0];
  const filteredStations = stationFilter === "Todas" ? stations : stations.filter((item) => item.status === stationFilter);
  const filteredSeries = seriesFilter === "Todas" ? series : series.filter((item) => item.state === seriesFilter);
  const filteredIssues = issueFilter === "Todas" ? issues : issues.filter((item) => item.status === issueFilter);
  const onlineStations = stations.filter((item) => item.status === "Operacional").length;

  useEffect(() => {
    const receiveRegulation = (event: Event) => {
      const detail = (event as CustomEvent<{ demandId?: string; chtId?: string; passportId?: string; requestedFlow?: number; authorizedFlow?: number; purpose?: string; authority?: string; center?: [number, number] }>).detail;
      if (!detail?.chtId) return;
      setSubject((value) => ({ ...value, ...detail, center: detail.center ?? value.center }));
    };
    const receiveIdentity = (event: Event) => {
      const detail = (event as CustomEvent<{ chtId?: string; center?: [number, number] }>).detail;
      if (detail?.chtId) setSubject((value) => ({ ...value, chtId: detail.chtId ?? value.chtId, center: detail.center ?? value.center }));
    };
    window.addEventListener("cht:regulation-context", receiveRegulation);
    window.addEventListener("cht:identity-context", receiveIdentity);
    return () => { window.removeEventListener("cht:regulation-context", receiveRegulation); window.removeEventListener("cht:identity-context", receiveIdentity); };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setLivePulse((value) => (value + 1) % 12), 1800);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!agentRunning) return;
    const interval = window.setInterval(() => setAgentStep((step) => {
      if (step >= 5) { setAgentRunning(false); onToast("QA/QC concluído; proposta de qualificação disponível para revisão humana."); return step; }
      return step + 1;
    }), 1050);
    return () => window.clearInterval(interval);
  }, [agentRunning, onToast]);

  const emitTowerEvent = (title: string, severity: "Crítico" | "Alto" | "Médio" | "Baixo", recommendation: string) => window.dispatchEvent(new CustomEvent("cht:module-event", { detail: { eventId: `DHE-${Date.now().toString(16).slice(-6).toUpperCase()}`, type: "data.quality.review.required", title, severity, source: "M5 · Data Hub", module: "m5", moduleName: "Data Hub", territory: selectedStation.territory, confidence: selectedStation.quality, chtId: subject.chtId, recommendation, occurredAt: clockLabel } }));

  const broadcastContext = (station = selectedStation, dataSeries = selectedSeries) => window.dispatchEvent(new CustomEvent("cht:data-context", { detail: { stationId: station.id, seriesId: dataSeries.id, chtId: subject.chtId, demandId: subject.demandId, variable: dataSeries.variable, unit: dataSeries.unit, quality: dataSeries.quality, completeness: dataSeries.completeness, version: dataSeries.version, center: station.center, observedAt: clockLabel } }));
  const openConsumer = (moduleId: string) => { broadcastContext(); onOpenModule(moduleId); };

  const focusStation = (station: Station) => {
    setSelectedStationId(station.id);
    const stationSeries = series.find((item) => item.stationId === station.id);
    if (stationSeries) setSelectedSeriesId(stationSeries.id);
    window.dispatchEvent(new CustomEvent("cht:focus-map", { detail: { center: station.center, zoom: 10, label: `${station.id} · ${station.name}`, source: `${station.operator} · ${station.status}`, confidence: station.quality } }));
    broadcastContext(station, stationSeries ?? selectedSeries);
    onToast(`${station.id} selecionada; mapa, séries, qualidade e consumidores receberam o contexto.`);
  };

  const startAgent = () => { setAgentOpen(true); setAgentStep(0); setAgentRunning(true); };

  const registerStation = (event: FormEvent) => {
    event.preventDefault();
    const station: Station = { id: `EST-CHT-${60435200 + stations.length}`, name: "Nova estação · contexto CHT", kind: "Telemétrica de uso", operator: "Operador em homologação", status: "Atenção", lastSeen: "aguardando handshake", latency: "—", completeness: 0, quality: 72, variables: ["Vazão"], territory: subject.chtId, center: subject.center };
    setStations((items) => [station, ...items]); setStationModalOpen(false); focusStation(station);
    onToast(`${station.id} registrada em homologação; contrato e identidade aguardam validação.`);
  };

  const ingestDataset = (event: FormEvent) => {
    event.preventDefault();
    const item: DataSeries = { id: `SER-ING-${20260810 + series.length}`, stationId: selectedStation.id, variable: "Vazão importada", unit: "L/s", frequency: "1 h", records: "8.760", range: "01 jan 2025 → 31 dez 2025", completeness: 96.2, quality: 81, state: "Bruta", version: "raw-immutable" };
    setSeries((items) => [item, ...items]); setSelectedSeriesId(item.id); setIngestModalOpen(false); onNavigate("Séries");
    onToast(`${item.id} recebida na zona bruta; validação contratual e QA/QC foram enfileirados.`);
  };

  const toggleConnector = (connector: Connector) => {
    const next = connector.state === "Pausado" ? "Streaming" : "Pausado";
    setConnectors((items) => items.map((item) => item.id === connector.id ? { ...item, state: next, rate: next === "Streaming" ? "32 evt/s" : "pausado", backlog: next === "Streaming" ? Math.max(0, item.backlog - 240) : item.backlog } : item));
    onToast(`${connector.name}: ingestão ${next === "Streaming" ? "retomada com idempotência e replay" : "pausada sem perder o offset"}.`);
  };

  const qualifySeries = () => {
    const qualifiedId = selectedSeries.id.replace(/-B$/, "-Q");
    setSeries((items) => items.map((item) => item.id === selectedSeries.id ? { ...item, id: qualifiedId, state: "Qualificada", quality: Math.max(item.quality, 94), completeness: Math.max(item.completeness, 98.7), version: `qv${19 + livePulse}` } : item));
    setSelectedSeriesId(qualifiedId);
    window.dispatchEvent(new CustomEvent("cht:monitoring-evidence-event", { detail: { evidenceId: `EVD-M5-${Date.now().toString(16).slice(-4)}`, conditionId: "CND-1142-04", status: "Concluída", qualifiedSeriesId: qualifiedId, measuredAverage: 48.6, qualityScore: 94, passportId: subject.passportId } }));
    broadcastContext(selectedStation, { ...selectedSeries, id: qualifiedId, state: "Qualificada", quality: 94, version: `qv${19 + livePulse}` });
    setQualityModalOpen(false);
    onToast("Série qualificada publicada como nova versão; bruto, flags, método e decisão foram preservados e o M4 foi notificado.");
  };

  const resolveIssue = () => {
    setIssues((items) => items.map((item) => item.id === selectedIssue.id ? { ...item, status: "Resolvida" } : item));
    setQualityModalOpen(false);
    if (selectedIssue.severity === "Crítica" || selectedIssue.severity === "Alta") emitTowerEvent("Inconsistência qualificada e resolvida", selectedIssue.severity === "Crítica" ? "Alto" : "Médio", `${selectedIssue.id} recebeu tratamento versionado; consumidores devem atualizar a referência.`);
    onToast(`${selectedIssue.id} resolvida com justificativa, versão e impacto em consumidores registrados.`);
  };

  const processImage = () => {
    setImages((items) => items.map((item) => item.id === selectedImage.id ? { ...item, state: "Analisada", product: `${item.product} · v2` } : item));
    window.dispatchEvent(new CustomEvent("cht:data-context", { detail: { assetId: selectedImage.id, chtId: subject.chtId, product: selectedImage.product, quality: 87, center: subject.center, observedAt: selectedImage.acquired } }));
    onToast(`${selectedImage.id} analisada; máscara, incerteza, parâmetros e COG derivado foram catalogados.`);
  };

  const acknowledgeEvent = () => {
    setEvents((items) => items.map((item) => item.id === selectedEvent.id ? { ...item, status: "Reconhecido" } : item));
    emitTowerEvent(selectedEvent.title, selectedEvent.severity === "Crítica" ? "Crítico" : selectedEvent.severity === "Alta" ? "Alto" : "Médio", `${selectedEvent.id} foi reconhecido; validar impacto nos consumidores ${selectedEvent.consumers.join(", ")}.`);
    onToast(`${selectedEvent.id} reconhecido e correlacionado no M0 com o mesmo território e evidências.`);
  };

  const registerCatalogAsset = (event: FormEvent) => {
    event.preventDefault();
    const item: CatalogAsset = { id: `DATA-CHT-${String(catalog.length + 1).padStart(2, "0")}`, name: "Novo produto de dados federado", owner: "Ente em homologação", kind: "Série temporal", standard: "OGC API + contrato CHT", cadence: "15 min", access: "Contrato federativo", sla: "proposto · 10 min", quality: 80, status: "Homologação" };
    setCatalog((items) => [item, ...items]); setCatalogModalOpen(false); onToast(`${item.id} criado em homologação; contrato, segurança e qualidade aguardam aprovação no M11.`);
  };

  const Kpis = () => <div className="data-kpis"><article><span>ESTAÇÕES CONECTADAS</span><strong>12.842</strong><small>{onlineStations}/{stations.length} no recorte · 97,4% nacional</small><i style={{ width: "97.4%" }} /></article><article><span>EVENTOS / SEGUNDO</span><strong>{302 + livePulse}</strong><small>pico 488 · atraso p95 42 s</small><i style={{ width: "82%" }} /></article><article><span>QUALIDADE MÉDIA</span><strong>93,1%</strong><small>↑ 0,7 pt · 3 bloqueios ativos</small><i style={{ width: "93.1%" }} /></article><article><span>ARMAZENAMENTO LÓGICO</span><strong>1,84 PB</strong><small>bruto 61% · qualificado 27% · analítico 12%</small><i style={{ width: "76%" }} /></article></div>;

  const Stations = () => <div className="data-stations"><header className="data-section-toolbar"><div><h2>Rede integrada de observação</h2><p>Identidade, operador, variáveis, saúde, latência e cobertura territorial</p></div><div className="data-filters">{["Todas", "Operacional", "Atenção", "Intermitente", "Offline"].map((item) => <button key={item} className={stationFilter === item ? "active" : ""} onClick={() => setStationFilter(item)}>{item}</button>)}<button className="primary" onClick={() => setStationModalOpen(true)}>＋ Nova estação</button></div></header><div className="data-station-layout"><article className="panel data-station-list"><div className="data-station-head"><span>ESTAÇÃO / OPERADOR</span><span>TIPO</span><span>VARIÁVEIS</span><span>LATÊNCIA</span><span>COMPLETUDE</span><span>STATUS</span><span /></div>{filteredStations.map((item) => <button key={item.id} className={item.id === selectedStation.id ? "selected" : ""} onClick={() => focusStation(item)}><span className={`data-station-icon ${statusClass(item.status)}`}>⌁</span><div><small>{item.id}</small><strong>{item.name}</strong><p>{item.operator}</p></div><span>{item.kind}</span><span>{item.variables.join(" · ")}</span><time>{item.latency}<small>{item.lastSeen}</small></time><div className="data-meter"><span><i style={{ width: `${item.completeness}%` }} /></span><b>{item.completeness}%</b></div><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article><aside className="panel data-station-detail"><header><div><small>{selectedStation.id} · {selectedStation.operator}</small><h2>{selectedStation.name}</h2><p>{selectedStation.territory}</p></div><span className={`data-state ${statusClass(selectedStation.status)}`}>{selectedStation.status}</span></header><div className="data-station-health"><div><span>QUALIDADE</span><strong>{selectedStation.quality}%</strong></div><div><span>COMPLETUDE</span><strong>{selectedStation.completeness}%</strong></div><div><span>LATÊNCIA</span><strong>{selectedStation.latency}</strong></div></div><section><span>VARIÁVEIS E ÚLTIMAS OBSERVAÇÕES</span>{selectedStation.variables.map((item, index) => <button key={item} onClick={() => onNavigate("Séries")}><b>{item}</b><span>{index === 0 ? `${48 + livePulse / 10} L/s` : index === 1 ? "1,84 m" : "0,4 mm"}</span><small>qualidade {selectedStation.quality - index}%</small><i>↗</i></button>)}</section><section className="data-station-lineage"><span>IDENTIDADE E RELAÇÕES</span><p><b>M1</b>{subject.chtId}</p><p><b>M4</b>{subject.demandId} · limite {subject.authorizedFlow} L/s</p><p><b>M11</b>contrato DATA-HDW-TELE-01</p></section><div className="data-station-agent"><span>✦</span><div><strong>Saúde e Anomalia Hidrométrica</strong><p>Verifica sensor, telemetria, contexto hidrológico e consistência cruzada.</p></div><button onClick={startAgent}>Executar</button></div><footer><button onClick={() => openConsumer("m4")}>Obrigação M4</button><button onClick={() => onNavigate("Qualidade")}>Ver flags</button><button className="primary" onClick={() => onNavigate("Séries")}>Abrir séries →</button></footer></aside></div></div>;

  const Series = () => <div className="data-series"><header className="data-section-toolbar"><div><h2>Séries temporais e linhagem</h2><p>Zonas bruta, qualificada e publicada com versão e proveniência</p></div><div className="data-filters">{["Todas", "Bruta", "Qualificada", "Publicada", "Em processamento"].map((item) => <button key={item} className={seriesFilter === item ? "active" : ""} onClick={() => setSeriesFilter(item)}>{item}</button>)}<button className="primary" onClick={() => setIngestModalOpen(true)}>⇧ Ingerir dados</button></div></header><div className="data-lineage-flow"><div><span>01</span><strong>ZONA BRUTA</strong><small>imutável · objeto + checksum</small><b>1,12 PB</b></div><i>→</i><div><span>02</span><strong>VALIDAÇÃO</strong><small>contrato · schema · unidade</small><b>99,2%</b></div><i>→</i><div><span>03</span><strong>QA/QC</strong><small>flags · método · revisão</small><b>14 regras</b></div><i>→</i><div><span>04</span><strong>QUALIFICADA</strong><small>nova versão · nunca overwrite</small><b>qv18</b></div><i>→</i><div><span>05</span><strong>PUBLICADA</strong><small>API · evento · catálogo</small><b>12 consumidores</b></div></div><div className="data-series-layout"><article className="panel data-series-chart-panel"><header><div><small>{selectedSeries.id} · {selectedSeries.version}</small><h2>{selectedSeries.variable}</h2><p>{selectedStation.name} · {selectedSeries.frequency}</p></div><span>{selectedSeries.quality}% qualidade</span></header><div className="data-chart-legend"><span><i />Qualificada</span><span><i className="raw" />Bruta</span><span><i className="limit" />Limite M4 · {subject.authorizedFlow} L/s</span></div><div className="data-hydro-chart"><div className="data-chart-grid" /><div className="data-reg-limit" style={{ bottom: `${Math.min(82, subject.authorizedFlow + 8)}%` }}><span>{subject.authorizedFlow} L/s</span></div>{hydroValues.map((value, index) => <div key={index} className={value === 0 ? "gap" : value > subject.authorizedFlow ? "above" : ""} style={{ height: `${value === 0 ? 3 : value + 18}%` }} data-value={value || "lacuna"}><i style={{ height: `${Math.max(5, value + (index % 3) - 4)}%` }} /></div>)}</div><div className="data-chart-axis"><span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>24h</span></div><section className="data-series-insight"><span>✦ INSIGHT QUALIFICADO</span><p>Duas lacunas e um pico acima de 52 L/s. O pico coincide com chuva antecedente; validar calibração antes de classificar não conformidade.</p><button onClick={startAgent}>Ver análise →</button></section><footer><button onClick={() => onToast("CSV preparado com dados, flags, unidades, método, versão e licença.")}>⇩ Exportar</button><button onClick={() => setQualityModalOpen(true)}>Revisar qualificação</button><button className="primary" onClick={() => openConsumer("m6")}>Usar no M6 →</button></footer></article><article className="panel data-series-catalog"><div className="data-series-head"><span>SÉRIE</span><span>VARIÁVEL</span><span>REGISTROS</span><span>QUALIDADE</span><span>ESTADO</span></div>{filteredSeries.map((item) => <button key={item.id} className={item.id === selectedSeries.id ? "selected" : ""} onClick={() => { setSelectedSeriesId(item.id); const station = stations.find((entry) => entry.id === item.stationId); if (station) setSelectedStationId(station.id); }}><div><small>{item.id} · {item.version}</small><strong>{item.stationId}</strong></div><span>{item.variable}<small>{item.unit} · {item.frequency}</small></span><b>{item.records}<small>{item.range}</small></b><div className="data-score"><span><i style={{ width: `${item.quality}%` }} /></span><b>{item.quality}%</b></div><em className={statusClass(item.state)}>{item.state}</em></button>)}</article></div></div>;

  const Telemetry = () => <div className="data-telemetry"><header className="data-section-toolbar"><div><h2>Operação de telemetria</h2><p>Conectores, offsets, filas, contratos, replay e observabilidade ao vivo</p></div><div><button onClick={() => openConsumer("m11")}>Contratos M11 ↗</button><button className="primary" onClick={() => setIngestModalOpen(true)}>＋ Nova ingestão</button></div></header><div className="data-stream-flow">{[["01", "Fontes", "MQTT · API · lote"], ["02", "Event Broker", "idempotência + offset"], ["03", "Contrato", "schema · unidade · tempo"], ["04", "Raw Object Store", "imutável + checksum"], ["05", "QA/QC", "flags + reconciliação"], ["06", "Data Products", "API + eventos + STAC"]].map((item, index) => <div key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong><small>{item[2]}</small>{index < 5 && <i>→</i>}</div>)}</div><div className="data-telemetry-layout"><article className="panel data-connector-list"><header className="panel-header"><div><h2>Conectores e pipelines</h2><p>{connectors.filter((item) => item.state === "Streaming").length} streaming · {connectors.reduce((sum, item) => sum + item.backlog, 0).toLocaleString("pt-BR")} no backlog</p></div><span className="data-live"><i /> LIVE</span></header><div className="data-connector-head"><span>FONTE / CONTRATO</span><span>PROTOCOLO</span><span>VAZÃO</span><span>LATÊNCIA</span><span>BACKLOG</span><span>ESTADO</span><span /></div>{connectors.map((item) => <div key={item.id}><span className={`data-connector-icon ${statusClass(item.state)}`}>⇄</span><div><small>{item.id}</small><strong>{item.name}</strong><p>último: {item.lastEvent}</p></div><span>{item.protocol}</span><b>{item.rate}</b><time>{item.latency}</time><span>{item.backlog.toLocaleString("pt-BR")}</span><em className={statusClass(item.state)}>{item.state}</em><button onClick={() => toggleConnector(item)}>{item.state === "Pausado" ? "▶" : "Ⅱ"}</button></div>)}</article><aside className="panel data-live-feed"><header className="panel-header"><div><h2>Event stream</h2><p>amostra operacional · dados sintéticos</p></div><span>{302 + livePulse} evt/s</span></header>{Array.from({ length: 8 }, (_, index) => ({ id: `obs-${(98421 + livePulse * 8 + index).toString(16)}`, station: stations[index % stations.length].id, variable: index % 3 === 0 ? "flow" : index % 3 === 1 ? "level" : "rain", value: index % 3 === 0 ? `${(48.1 + livePulse / 10 + index / 10).toFixed(1)} L/s` : index % 3 === 1 ? `${(1.82 + index / 100).toFixed(2)} m` : `${index / 10} mm`, quality: index === 5 ? "flagged" : "accepted", age: `${2 + index * 2} s` })).map((item) => <button key={item.id} onClick={() => onToast(`${item.id}: payload, schema, offset, checksum e trace carregados.`)}><span className={item.quality}>{item.quality === "accepted" ? "✓" : "!"}</span><div><small>{item.id} · {item.age}</small><strong>{item.station}</strong><p>{item.variable} = {item.value}</p></div><em>{item.quality}</em><i>↗</i></button>)}<footer><span>partition hydro-observation-04</span><b>offset 8.841.20{livePulse}</b></footer></aside></div></div>;

  const Imagery = () => <div className="data-imagery"><header className="data-section-toolbar"><div><h2>Imagens e observação da Terra</h2><p>Busca STAC, cobertura, processamento, derivados e vínculo territorial</p></div><div><button onClick={() => onToast("Busca STAC atualizada para a geometria CHT e janela de 30 dias.")}>⌕ Buscar STAC</button><button className="primary" onClick={() => setIngestModalOpen(true)}>＋ Adicionar coleção</button></div></header><div className="data-image-layout"><article className="panel data-image-catalog"><header className="panel-header"><div><h2>Cenas disponíveis</h2><p>interseção com {subject.chtId}</p></div><span>{images.length} itens</span></header>{images.map((item) => <button key={item.id} className={item.id === selectedImage.id ? "selected" : ""} onClick={() => setSelectedImageId(item.id)}><span className="data-image-thumb"><i style={{ left: `${item.cloud}%`, top: `${12 + item.cloud}%` }} /><b /></span><div><small>{item.id}</small><strong>{item.collection}</strong><p>{item.acquired} · {item.resolution}</p></div><span>{item.coverage}<small>nuvem {item.cloud}%</small></span><em className={statusClass(item.state)}>{item.state}</em><i>→</i></button>)}</article><article className="panel data-image-detail"><header><div><small>{selectedImage.id}</small><h2>{selectedImage.collection}</h2><p>{selectedImage.acquired} · {selectedImage.resolution} · nuvem {selectedImage.cloud}%</p></div><span className={`data-state ${statusClass(selectedImage.state)}`}>{selectedImage.state}</span></header><div className="data-image-preview"><div className="data-river-shape" /><div className="data-image-grid" /><span>COG · EPSG:31983</span><b>{subject.chtId}</b></div><div className="data-image-workflow">{[["1", "Cena", "COG original"], ["2", "Máscara", "nuvem + sombra"], ["3", "Índice", "MNDWI"], ["4", "Vetor", "água superficial"], ["5", "Evento", "mudança + confiança"]].map((item, index) => <div key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong><small>{item[2]}</small>{index < 4 && <i>→</i>}</div>)}</div><section><span>PRODUTO DERIVADO</span><strong>{selectedImage.product}</strong><p>Área estimada: 38,4 ha · mudança −8,1% · confiança 87% · incerteza ±2,6 ha.</p><small>Fonte, algoritmo, parâmetros, footprint e versão preservados no catálogo.</small></section><footer><button onClick={() => onNavigate("Cobertura")}>Ver cobertura</button><button onClick={() => openConsumer("m7")}>Inspecionar no M7</button><button className="primary" onClick={processImage}>▶ Processar análise</button></footer></article></div></div>;

  const Coverage = () => <div className="data-coverage"><header className="data-section-toolbar"><div><h2>Cobertura e capacidade da rede</h2><p>Disponibilidade espacial, temporal e por variável para orientar expansão</p></div><div><button onClick={() => openConsumer("m8")}>Planejamento M8 ↗</button><button className="primary" onClick={() => { setCoverageOptimized(true); onToast("Otimização concluída; 12 locais candidatos foram priorizados com custos e ganhos de cobertura."); }}>✦ Otimizar rede</button></div></header><div className="data-coverage-summary"><article><span>COBERTURA TERRITORIAL</span><strong>{coverageOptimized ? "91,8%" : "87,4%"}</strong><small>{coverageOptimized ? "+4,4 pt com 12 estações" : "áreas com observação adequada"}</small></article><article><span>COBERTURA TEMPORAL</span><strong>93,6%</strong><small>janelas completas no mês</small></article><article><span>REDUNDÂNCIA CRÍTICA</span><strong>68%</strong><small>trechos com sensor alternativo</small></article><article><span>LACUNAS PRIORITÁRIAS</span><strong>{coverageOptimized ? 7 : 19}</strong><small>5 de prioridade alta ou crítica</small></article></div><article className="panel data-coverage-table"><div className="data-coverage-head"><span>TERRITÓRIO</span><span>ESTAÇÕES</span><span>ONLINE</span><span>COBERTURA</span><span>LATÊNCIA</span><span>PRINCIPAL LACUNA</span><span>PRIORIDADE</span><span /></div>{coverageRows.map((item) => <button key={item.territory} onClick={() => onToast(`${item.territory}: mapa de isócronas, variáveis, redundância e locais candidatos carregados.`)}><div><strong>{item.territory}</strong><small>recorte integrado CHT</small></div><b>{item.stations}</b><span>{item.online}</span><div className="data-coverage-bar"><span><i style={{ width: `${coverageOptimized ? Math.min(99, item.coverage + 8) : item.coverage}%` }} /></span><b>{coverageOptimized ? Math.min(99, item.coverage + 8) : item.coverage}%</b></div><time>{item.latency}</time><span>{item.gap}</span><em className={statusClass(item.priority)}>{item.priority}</em><i>→</i></button>)}</article><div className="data-coverage-matrix"><article className="panel"><header className="panel-header"><div><h2>Cobertura por variável</h2><p>percentual do território com observação útil</p></div></header>{[["Vazão", 91], ["Nível", 88], ["Chuva", 96], ["Qualidade", 72], ["Água subterrânea", 58], ["Uso medido", 64]].map((item) => <div key={item[0] as string}><span>{item[0]}</span><i><b style={{ width: `${item[1]}%` }} /></i><strong>{item[1]}%</strong></div>)}</article><article className="panel data-coverage-recommendation"><span>✦ RECOMENDAÇÃO DE EXPANSÃO</span><h2>12 locais maximizam ganho de informação</h2><p>Priorizar Alto Paraguai, Pajeú e Oeste BA combinando lacuna, criticidade, acesso, energia, conectividade e redundância.</p><div><span>Ganho estimado<strong>+4,4 pt</strong></span><span>Custo indicativo<strong>R$ 3,8 mi</strong></span><span>Horizonte<strong>9 meses</strong></span></div><small>Recomendação não autoriza aquisição ou instalação; requer planejamento e aprovação.</small><button onClick={() => openConsumer("m8")}>Criar proposta no M8 →</button></article></div></div>;

  const Quality = () => <div className="data-quality"><header className="data-section-toolbar"><div><h2>Qualidade, flags e reconciliação</h2><p>Regras automatizadas, revisão humana, versionamento e impacto em consumidores</p></div><div className="data-filters">{["Todas", "Aberta", "Em análise", "Resolvida", "Ignorada"].map((item) => <button key={item} className={issueFilter === item ? "active" : ""} onClick={() => setIssueFilter(item)}>{item}</button>)}<button className="primary" onClick={startAgent}>✦ Executar QA/QC</button></div></header><div className="data-quality-kpis"><article><span>CONTRATOS VÁLIDOS</span><strong>99,2%</strong><small>schema, unidade, tempo e identidade</small></article><article><span>FLAGS NAS 24 H</span><strong>1.842</strong><small>0,06% das observações</small></article><article><span>BLOQUEIOS</span><strong>3</strong><small>não promovidos à zona qualificada</small></article><article><span>REPROCESSAMENTOS</span><strong>7</strong><small>versões preservadas no ciclo</small></article></div><div className="data-quality-layout"><article className="panel data-issue-list"><div className="data-issue-head"><span>INCONSISTÊNCIA / SÉRIE</span><span>JANELA</span><span>VALOR</span><span>CONFIANÇA</span><span>SEVERIDADE</span><span>STATUS</span><span /></div>{filteredIssues.map((item) => <button key={item.id} className={item.id === selectedIssue.id ? "selected" : ""} onClick={() => setSelectedIssueId(item.id)}><span className={`data-issue-icon ${statusClass(item.severity)}`}>{item.severity === "Crítica" ? "!" : "◇"}</span><div><small>{item.id} · {item.seriesId}</small><strong>{item.rule}</strong><p>{item.recommendation}</p></div><time>{item.window}</time><span>{item.value}</span><b>{item.confidence}%</b><em className={statusClass(item.severity)}>{item.severity}</em><span className={`data-state ${statusClass(item.status)}`}>{item.status}</span><i>→</i></button>)}</article><aside className="panel data-issue-detail"><header><div><small>{selectedIssue.id} · {selectedIssue.seriesId}</small><h2>{selectedIssue.rule}</h2><p>{selectedIssue.window}</p></div><em className={statusClass(selectedIssue.severity)}>{selectedIssue.severity}</em></header><div className="data-raw-qualified"><section><span>BRUTO · PRESERVADO</span><strong>{selectedIssue.value}</strong><p>checksum 4f9a…8c1 · offset 8.841.188</p></section><i>→</i><section><span>VISÃO QUALIFICADA</span><strong>{selectedIssue.status === "Resolvida" ? "flag aplicada" : "aguardando revisão"}</strong><p>sem alteração do objeto original</p></section></div><section className="data-rule-trace"><span>REGRA E EVIDÊNCIAS</span><p><b>Regra:</b> DQ-HYDRO-014 · versão 2026.08.3</p><p><b>Contexto:</b> chuva antecedente, curva local, sensor vizinho e limite M4.</p><p><b>Recomendação:</b> {selectedIssue.recommendation}</p></section><div className="data-impact-consumers"><span>CONSUMIDORES AFETADOS</span>{["M4 · condicionante", "M6 · balanço", "M7 · risco", "M9 · evento crítico"].map((item) => <button key={item}><b>{item}</b><i>atualizar referência ↗</i></button>)}</div><footer><button onClick={() => { setIssues((items) => items.map((item) => item.id === selectedIssue.id ? { ...item, status: "Ignorada" } : item)); onToast("Flag mantida como ignorada com justificativa; o dado bruto não foi alterado."); }}>Ignorar com motivo</button><button onClick={() => setQualityModalOpen(true)}>Comparar e revisar</button><button className="primary" onClick={resolveIssue}>✓ Resolver e versionar</button></footer></aside></div></div>;

  const Events = () => <div className="data-events"><header className="data-section-toolbar"><div><h2>Eventos territoriais de dados</h2><p>Anomalias qualificadas, assinaturas, correlação e entrega aos módulos consumidores</p></div><div><button onClick={() => onToast("Replay posicionado em 10 ago 2026 · 08:00 com offsets preservados.")}>↶ Replay</button><button className="primary" onClick={() => emitTowerEvent("Lote de eventos críticos do Data Hub", "Alto", "Quatro eventos requerem correlação territorial e priorização operacional.")}>Escalar ao M0</button></div></header><div className="data-event-flow"><div><span>DETECÇÃO</span><strong>regra + modelo + contexto</strong></div><i>→</i><div><span>QUALIFICAÇÃO</span><strong>evidência + confiança</strong></div><i>→</i><div><span>CORRELAÇÃO</span><strong>CHT-ID + tempo + caso</strong></div><i>→</i><div><span>ENTREGA</span><strong>Event Bus + assinantes</strong></div><i>→</i><div><span>FEEDBACK</span><strong>resultado + versão</strong></div></div><div className="data-event-layout"><article className="panel data-event-list"><header className="panel-header"><div><h2>Fila de eventos</h2><p>{events.filter((item) => item.status === "Novo").length} novos · ordenados por severidade</p></div><span className="data-live"><i /> LIVE</span></header>{events.map((item) => <button key={item.id} className={item.id === selectedEvent.id ? "selected" : ""} onClick={() => setSelectedEventId(item.id)}><span className={`data-event-score ${statusClass(item.severity)}`}>{item.confidence}</span><div><small>{item.id} · {item.detectedAt}</small><strong>{item.title}</strong><p>{item.type} · {item.stationId}</p></div><span>{item.consumers.join(" · ")}</span><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article><article className="panel data-event-detail"><header><div><small>{selectedEvent.id} · {selectedEvent.type}</small><h2>{selectedEvent.title}</h2><p>{selectedEvent.stationId} · {selectedEvent.detectedAt}</p></div><span className={`data-state ${statusClass(selectedEvent.severity)}`}>{selectedEvent.severity}</span></header><div className="data-event-evidence"><div><span>VALOR OBSERVADO</span><strong>54,2 L/s</strong><small>qv18 · qualidade 94%</small></div><div><span>REFERÊNCIA</span><strong>{subject.authorizedFlow} L/s</strong><small>M4 · ATO-ANA-1142-24</small></div><div><span>CONFIANÇA</span><strong>{selectedEvent.confidence}%</strong><small>4 evidências correlacionadas</small></div></div><section><span>FATOS E LIMITES</span><p>O valor qualificado superou a referência por 4,2%. A chuva antecedente pode explicar o pico; o evento não caracteriza infração nem substitui análise técnica.</p></section><div className="data-subscribers"><span>ASSINANTES E ENTREGA</span>{[["M0", "caso e coordenação", "entregue 118 ms"], ["M4", "obrigação e ato", "entregue 142 ms"], ["M6", "balanço e cenário", "consumido"], ["M7", "risco e fiscalização", "aguarda regra"]].map((item) => <button key={item[0]} onClick={() => openConsumer(item[0].toLowerCase())}><b>{item[0]}</b><span>{item[1]}</span><em>{item[2]}</em><i>↗</i></button>)}</div><footer><button onClick={() => onToast(`${selectedEvent.id}: envelope, evidências, offsets e acknowledgements exportados.`)}>⇩ Exportar envelope</button><button onClick={() => openConsumer("m7")}>Abrir no M7</button><button className="primary" disabled={selectedEvent.status === "Reconhecido"} onClick={acknowledgeEvent}>✓ Reconhecer e correlacionar</button></footer></article></div></div>;

  const Catalog = () => <div className="data-catalog"><header className="data-section-toolbar"><div><h2>Catálogo e contratos de dados</h2><p>Produtos, donos, padrões, acesso, SLA, qualidade, linhagem e consumidores</p></div><div><button onClick={() => openConsumer("m11")}>Governança M11 ↗</button><button className="primary" onClick={() => setCatalogModalOpen(true)}>＋ Novo produto</button></div></header><div className="data-catalog-summary"><article><span>PRODUTOS ATIVOS</span><strong>146</strong><small>38 séries · 22 eventos · 11 imagens</small></article><article><span>FONTES FEDERADAS</span><strong>34</strong><small>ANA + 18 entes + 15 parceiros</small></article><article><span>CONTRATOS NO SLA</span><strong>96,8%</strong><small>2 degradados · 1 em homologação</small></article><article><span>CONSUMIDORES</span><strong>28</strong><small>M0–M12 + APIs autorizadas</small></article></div><article className="panel data-catalog-table"><div className="data-catalog-head"><span>PRODUTO / RESPONSÁVEL</span><span>TIPO</span><span>PADRÃO</span><span>CADÊNCIA</span><span>ACESSO</span><span>SLA</span><span>QUALIDADE</span><span>STATUS</span><span /></div>{catalog.map((item) => <button key={item.id} onClick={() => onToast(`${item.id}: contrato, schema, licença, linhagem, endpoints e consumidores carregados.`)}><span className="data-product-icon">▤</span><div><small>{item.id}</small><strong>{item.name}</strong><p>{item.owner}</p></div><span>{item.kind}</span><span>{item.standard}</span><span>{item.cadence}</span><span>{item.access}</span><b>{item.sla}</b><div className="data-catalog-score"><i><b style={{ width: `${item.quality}%` }} /></i><strong>{item.quality}%</strong></div><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article><div className="data-catalog-bottom"><article className="panel data-api-panel"><header className="panel-header"><div><h2>Interfaces disponíveis</h2><p>contratos internos e externos</p></div></header>{[["OGC API Features", "/collections/stations/items", "12 consumidores"], ["SensorThings API", "/Things + /Observations", "8 consumidores"], ["STAC API", "/collections + /search", "6 consumidores"], ["Event Bus", "hydro.* · station.* · data.*", "24 assinaturas"], ["Bulk / Parquet", "snapshot versionado", "4 consumidores"]].map((item) => <button key={item[0]} onClick={() => onToast(`${item[0]}: documentação, autenticação, limites e exemplos carregados.`)}><span>↯</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div><b>{item[2]}</b><i>↗</i></button>)}</article><article className="panel data-lineage-panel"><header className="panel-header"><div><h2>Linhagem ponta a ponta</h2><p>produto selecionado</p></div></header><div><span>FONTE</span><strong>ANA · Hidroweb</strong><small>autoridade do dado</small></div><i>→</i><div><span>INGESTÃO</span><strong>CON-HIDROWEB-01</strong><small>offset + checksum</small></div><i>→</i><div><span>QUALIFICAÇÃO</span><strong>DQ-HYDRO-014</strong><small>release 2026.08.3</small></div><i>→</i><div><span>PRODUTO</span><strong>SER-DF-004918-Q</strong><small>qv18</small></div><i>→</i><div><span>CONSUMO</span><strong>M4 · M6 · M7 · M9</strong><small>referências rastreadas</small></div></article></div></div>;

  const views: Record<string, () => ReactNode> = { "Estações": Stations, "Séries": Series, "Telemetria": Telemetry, "Imagens": Imagery, "Cobertura": Coverage, "Qualidade": Quality, "Eventos": Events, "Catálogo": Catalog };
  const ActiveView = views[contextItem] ?? Stations;
  const agentSteps = ["Resolver estação, CHT-ID e contratos", "Validar schema, unidade, timestamp e método", "Preservar payload bruto, offset e checksum", "Executar regras QA/QC e consistência cruzada", "Comparar contexto M4, vizinhos e observação orbital", "Gerar flags, versão e impacto em consumidores"];

  return <section className="data-hub" aria-label={`Data Hub — ${contextItem}`}><div className="data-context-bar"><div><span>DH</span><small>ESTAÇÃO ATIVA</small><strong>{selectedStation.id} · {selectedStation.status}</strong></div><div><span>⌖</span><small>CONTEXTO CHT</small><strong>{subject.chtId} · {subject.demandId}</strong></div><div><span>⇄</span><small>PIPELINE</small><strong>stream → raw → QA/QC → publish</strong></div><div><span>◴</span><small>REFERÊNCIA</small><strong>{clockLabel} BRT · DQ 2026.08.3</strong></div><button onClick={startAgent}>✦ Qualidade de Dados</button></div><Kpis /><ActiveView />

    {stationModalOpen && <div className="data-modal-backdrop" onMouseDown={() => setStationModalOpen(false)}><form className="data-station-modal" onSubmit={registerStation} onMouseDown={(event) => event.stopPropagation()}><header><div><small>NOVA ESTAÇÃO · HOMOLOGAÇÃO</small><h2>Registrar ponto de observação</h2><p>Identidade M1, contrato M11 e primeiro handshake serão validados.</p></div><button type="button" onClick={() => setStationModalOpen(false)}>×</button></header><div className="data-modal-grid"><label className="full"><span>NOME E LOCAL</span><input defaultValue={`Nova estação · ${subject.chtId}`} /></label><label><span>TIPO</span><select defaultValue="Telemétrica de uso"><option>Telemétrica de uso</option><option>Fluviométrica</option><option>Pluviométrica</option><option>Qualidade da água</option></select></label><label><span>OPERADOR</span><input defaultValue="Operador autorizado" /></label><label><span>LONGITUDE</span><input type="number" step="0.000001" defaultValue={subject.center[0]} /></label><label><span>LATITUDE</span><input type="number" step="0.000001" defaultValue={subject.center[1]} /></label><label><span>PROTOCOLO</span><select defaultValue="MQTT"><option>MQTT</option><option>SensorThings API</option><option>OGC API</option><option>Arquivo em lote</option></select></label><label><span>FREQUÊNCIA</span><select defaultValue="15 min"><option>1 min</option><option>5 min</option><option>15 min</option><option>1 h</option></select></label><label className="full"><span>VARIÁVEIS E UNIDADES</span><textarea defaultValue="Vazão instantânea [L/s]; volume acumulado [m³]" /></label></div><section><span>GATES DE HOMOLOGAÇÃO</span><p>identidade · geometria · operador · unidade · relógio · segurança · calibração · amostra · SLA</p></section><footer><button type="button" onClick={() => setStationModalOpen(false)}>Cancelar</button><button type="submit" className="primary">Registrar e testar handshake →</button></footer></form></div>}

    {ingestModalOpen && <div className="data-modal-backdrop" onMouseDown={() => setIngestModalOpen(false)}><form className="data-ingest-modal" onSubmit={ingestDataset} onMouseDown={(event) => event.stopPropagation()}><header><div><small>INGESTÃO GOVERNADA</small><h2>Adicionar fonte ou conjunto de dados</h2><p>O conteúdo entra primeiro na zona bruta e não sobrescreve séries existentes.</p></div><button type="button" onClick={() => setIngestModalOpen(false)}>×</button></header><div className="data-ingest-steps">{[["1", "Fonte"], ["2", "Contrato"], ["3", "Amostra"], ["4", "QA/QC"], ["5", "Publicação"]].map((item, index) => <div key={item[0]} className={index === 0 ? "active" : ""}><span>{item[0]}</span><strong>{item[1]}</strong>{index < 4 && <i>→</i>}</div>)}</div><div className="data-modal-grid"><label><span>TIPO DE FONTE</span><select defaultValue="Arquivo"><option>Arquivo</option><option>API</option><option>Stream MQTT</option><option>STAC Collection</option></select></label><label><span>ESTAÇÃO / COLEÇÃO</span><select defaultValue={selectedStation.id}>{stations.map((item) => <option key={item.id}>{item.id}</option>)}</select></label><label className="full data-drop"><span>ARQUIVO OU ENDPOINT</span><strong>Solte CSV, WaterML, Parquet ou informe uma URL</strong><small>schema, segurança, tamanho, checksum e duplicidade serão verificados</small></label><label><span>TIMEZONE</span><select defaultValue="UTC"><option>UTC</option><option>America/Sao_Paulo</option></select></label><label><span>LICENÇA / ACESSO</span><select defaultValue="Contrato federativo"><option>Público</option><option>Contrato federativo</option><option>Restrito</option></select></label><label className="full"><span>OBSERVAÇÕES</span><textarea defaultValue="Carga histórica para complementar a série; preservar lacunas e flags informadas pela fonte." /></label></div><section><span>PREVIEW DO CONTRATO</span><p>timestamp: datetime UTC · value: decimal · unit: UCUM · method: vocabulary · quality: flags[] · geometry: station reference</p></section><footer><button type="button" onClick={() => setIngestModalOpen(false)}>Cancelar</button><button type="submit" className="primary">Ingerir na zona bruta →</button></footer></form></div>}

    {qualityModalOpen && <div className="data-modal-backdrop" onMouseDown={() => setQualityModalOpen(false)}><section className="data-quality-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>REVISÃO HUMANA · {selectedIssue.id}</small><h2>Comparar e qualificar observações</h2><p>{selectedSeries.id} · bruto imutável · nova versão qualificada</p></div><button onClick={() => setQualityModalOpen(false)}>×</button></header><div className="data-quality-compare"><section><span>BRUTO</span><strong>07 ago · 08:00</strong><b>ausente</b><small>offset 8.841.188 · checksum preservado</small></section><i>→</i><section><span>PROPOSTA</span><strong>07 ago · 08:00</strong><b>48,4 L/s · backfill</b><small>buffer do sensor · confiança 98%</small></section></div><div className="data-quality-evidence"><span>EVIDÊNCIAS</span>{[["Buffer do sensor", "2 registros recuperados", "98%"], ["Estação vizinha", "curva consistente", "91%"], ["Chuva antecedente", "sem evento abrupto", "94%"], ["Limite M4", `${subject.authorizedFlow} L/s`, "fonte oficial"]].map((item) => <button key={item[0]}><strong>{item[0]}</strong><span>{item[1]}</span><b>{item[2]}</b></button>)}</div><label><span>JUSTIFICATIVA DO CURADOR</span><textarea defaultValue="Aceito o backfill recuperado do buffer do próprio sensor. Manter flags de ausência e recuperação; publicar nova versão qualificada sem alterar o objeto bruto." /></label><section className="data-quality-effects"><span>EFEITOS CONTROLADOS</span><p>nova versão qv19 · evento de atualização · evidência M4 · invalidação de cache M6 · trilha M11</p></section><footer><button onClick={() => setQualityModalOpen(false)}>Cancelar</button><button onClick={() => { setQualityModalOpen(false); onToast("Proposta devolvida ao agente com observações do curador."); }}>Devolver para ajuste</button><button className="primary" onClick={qualifySeries}>✓ Qualificar e publicar versão</button></footer></section></div>}

    {catalogModalOpen && <div className="data-modal-backdrop" onMouseDown={() => setCatalogModalOpen(false)}><form className="data-catalog-modal" onSubmit={registerCatalogAsset} onMouseDown={(event) => event.stopPropagation()}><header><div><small>NOVO PRODUTO DE DADOS</small><h2>Definir contrato publicável</h2><p>Responsável, padrão, qualidade, acesso, SLA e consumidores obrigatórios.</p></div><button type="button" onClick={() => setCatalogModalOpen(false)}>×</button></header><div className="data-modal-grid"><label className="full"><span>NOME DO PRODUTO</span><input defaultValue="Observações qualificadas de vazão" /></label><label><span>RESPONSÁVEL</span><input defaultValue="Ente federado · unidade técnica" /></label><label><span>TIPO</span><select defaultValue="Série temporal"><option>Série temporal</option><option>Eventos</option><option>Imagem / STAC</option><option>Feature collection</option></select></label><label><span>PADRÃO</span><select defaultValue="OGC API"><option>OGC API</option><option>SensorThings</option><option>WaterML 2.0</option><option>STAC 1.0</option></select></label><label><span>CADÊNCIA</span><input defaultValue="15 min + backfill" /></label><label><span>ACESSO</span><select defaultValue="Contrato federativo"><option>Público</option><option>Contrato federativo</option><option>Restrito</option></select></label><label><span>SLA</span><input defaultValue="99,5% · latência até 2 min" /></label><label className="full"><span>CONSUMIDORES E FINALIDADE</span><textarea defaultValue="M4 condicionantes; M6 balanço; M7 fiscalização; M9 eventos críticos." /></label></div><section><span>APROVAÇÕES NECESSÁRIAS</span><p>dono do dado · segurança · LGPD · contrato federativo · qualidade · publicação no catálogo</p></section><footer><button type="button" onClick={() => setCatalogModalOpen(false)}>Cancelar</button><button type="submit" className="primary">Criar em homologação →</button></footer></form></div>}

    {agentOpen && <div className="data-agent-backdrop" onMouseDown={() => setAgentOpen(false)}><aside className="data-agent-drawer" onMouseDown={(event) => event.stopPropagation()}><header><div className="data-agent-avatar">✦</div><div><small>{agentRunning ? "EXECUÇÃO AO VIVO" : "QA/QC CONCLUÍDO"}</small><h2>Qualidade de Dados</h2><p>Trace M5-A05-{selectedStation.id.slice(-4)} · política DAT-HIL-005</p></div><button onClick={() => setAgentOpen(false)}>×</button></header><div className="data-agent-scopes"><span>ESCOPOS</span><b>Ler bruto</b><b>Aplicar regras</b><b>Comparar</b><b>Propor flags</b><b className="blocked">Sobrescrever bruto ✕</b></div><section className="data-agent-plan"><h3>Plano de execução</h3>{agentSteps.map((item, index) => <div key={item} className={index < agentStep ? "done" : index === agentStep ? "running" : "waiting"}><span>{index < agentStep ? "✓" : index === agentStep ? "●" : "○"}</span><div><strong>{item}</strong><small>{index < agentStep ? `${410 + index * 173} ms · evidência registrada` : index === agentStep ? "executando ferramentas autorizadas…" : "aguardando dependência"}</small></div></div>)}</section><section className="data-agent-tools"><h3>Ferramentas e grounding</h3>{[["Raw Store", "payload, offset, checksum e schema", "100%"], ["M1/M4", "identidade, ato e condicionante", "96%"], ["Rede vizinha", "3 estações e curva histórica", "91%"], ["STAC", "chuva e água superficial", "87%"]].map((item) => <button key={item[0]}><span>▤</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div><b>{item[2]}</b></button>)}</section><section className="data-agent-output"><div><h3>Saída estruturada</h3><span>94% confiança</span></div><p><b>Fato:</b> duas lacunas foram identificadas e o buffer do sensor contém os registros correspondentes.</p><p><b>Proposta:</b> aplicar backfill com flags `missing` e `recovered`, gerando qv19.</p><p><b>Impacto:</b> M4, M6 e M7 devem atualizar a referência da série.</p><p><b>Limite:</b> o agente não apaga nem sobrescreve o bruto e não publica sem política de aprovação.</p></section><footer><button onClick={() => { setAgentRunning(false); onToast("Agente pausado; offsets e estado foram preservados."); }}>■ Pausar</button><button onClick={() => openConsumer("m12")}>Central de Agentes</button><button className="primary" onClick={() => { setAgentOpen(false); setQualityModalOpen(true); }}>Revisar qualificação →</button></footer></aside></div>}
  </section>;
}
