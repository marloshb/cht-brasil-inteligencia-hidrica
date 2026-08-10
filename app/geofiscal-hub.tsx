"use client";

/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/label-has-associated-control */

import { FormEvent, type ReactNode, useEffect, useState } from "react";

type DetectionStatus = "Novo" | "Validando" | "Correlacionado" | "Descartado";
type CaseStatus = "Triagem" | "Investigação" | "Ordem" | "Campo" | "Decisão" | "Monitoramento" | "Concluído";
type EvidenceStatus = "Coletada" | "Sincronizada" | "Verificada" | "Contestada";

type Detection = {
  id: string;
  title: string;
  type: string;
  source: string;
  observedAt: string;
  chtId: string;
  score: number;
  confidence: number;
  severity: "Crítica" | "Alta" | "Média" | "Baixa";
  status: DetectionStatus;
  method: string;
  center: [number, number];
};

type FiscalCase = {
  id: string;
  title: string;
  detectionId: string;
  chtId: string;
  risk: number;
  priority: "P1" | "P2" | "P3" | "P4";
  status: CaseStatus;
  stage: number;
  owner: string;
  sla: string;
  authority: string;
  due: string;
};

type InspectionOrder = {
  id: string;
  caseId: string;
  title: string;
  team: string;
  scheduled: string;
  route: string;
  checklist: number;
  offlinePackage: string;
  status: "Rascunho" | "Aprovação humana" | "Emitida" | "Em campo" | "Cumprida" | "Cancelada";
};

type FieldEvidence = {
  id: string;
  caseId: string;
  title: string;
  kind: string;
  capturedAt: string;
  position: string;
  collector: string;
  hash: string;
  custody: number;
  status: EvidenceStatus;
};

type ConformityItem = {
  id: string;
  requirement: string;
  source: string;
  expected: string;
  observed: string;
  result: "Conforme" | "Divergente" | "Inconclusivo" | "Não aplicável";
  confidence: number;
};

type ResultRecord = {
  id: string;
  caseId: string;
  outcome: string;
  measure: string;
  decidedAt: string;
  authority: string;
  followUp: string;
  status: "Monitorando" | "Efetivo" | "Reincidente" | "Encerrado";
};

type GeoFiscalHubProps = {
  contextItem: string;
  territory: string;
  clockLabel: string;
  onNavigate: (item: string) => void;
  onOpenModule: (moduleId: string) => void;
  onCreateRecord: () => void;
  onToast: (message: string) => void;
};

const initialDetections: Detection[] = [
  { id: "DET-2026-9184", title: "Captação aparente acima da referência", type: "Vazão × ato", source: "M5 qv18 + M4 ATO-1142", observedAt: "10 ago · 09:51", chtId: "UTH-DF-004918", score: 94, confidence: 94, severity: "Alta", status: "Correlacionado", method: "Série qualificada + regra DQ-HYDRO-014", center: [-47.82, -15.58] },
  { id: "DET-2026-9177", title: "Expansão recente de área irrigada", type: "Mudança de uso", source: "Sentinel-2 + CNARH", observedAt: "09 ago · 16:18", chtId: "UTH-BA-018407", score: 91, confidence: 87, severity: "Alta", status: "Validando", method: "MNDWI/NDVI + segmentação temporal", center: [-45.46, -12.32] },
  { id: "DET-2026-9168", title: "Telemetria interrompida em uso ativo", type: "Ausência de dado", source: "M5 Event Bus", observedAt: "10 ago · 08:02", chtId: "UTH-PE-002197", score: 83, confidence: 99, severity: "Média", status: "Novo", method: "SLA de estação + contexto operacional", center: [-38.57, -8.6] },
  { id: "DET-2026-9151", title: "Barramento possivelmente alterado", type: "Mudança física", source: "CBERS-4A + M1", observedAt: "08 ago · 14:02", chtId: "UTH-MT-001782", score: 89, confidence: 84, severity: "Alta", status: "Correlacionado", method: "Change detection + objeto CHT", center: [-54.6, -16.2] },
  { id: "DET-2026-9134", title: "Anomalia sem persistência temporal", type: "Outlier de medição", source: "M5 qv21", observedAt: "07 ago · 11:30", chtId: "UTH-SP-009142", score: 42, confidence: 76, severity: "Baixa", status: "Descartado", method: "Outlier robusto + estação vizinha", center: [-50.1, -20.4] },
];

const initialCases: FiscalCase[] = [
  { id: "GF-2026-0917", title: "Verificar captação · Mestre d'Armas", detectionId: "DET-2026-9184", chtId: "UTH-DF-004918", risk: 92, priority: "P1", status: "Ordem", stage: 2, owner: "Equipe Fiscal DF-02", sla: "00h 28m", authority: "ANA · unidade fiscalizadora", due: "10 ago · 14:00" },
  { id: "GF-2026-0908", title: "Área irrigada ampliada · Oeste BA", detectionId: "DET-2026-9177", chtId: "UTH-BA-018407", risk: 88, priority: "P1", status: "Investigação", stage: 1, owner: "Núcleo remoto BA", sla: "03h 12m", authority: "INEMA · competência indicada", due: "10 ago · 18:00" },
  { id: "GF-2026-0894", title: "Inspecionar barramento · Alto Paraguai", detectionId: "DET-2026-9151", chtId: "UTH-MT-001782", risk: 84, priority: "P2", status: "Campo", stage: 3, owner: "Equipe MT-01", sla: "1d 04h", authority: "SEMA-MT", due: "11 ago · 16:00" },
  { id: "GF-2026-0872", title: "Restabelecer evidência telemétrica", detectionId: "DET-2026-9168", chtId: "UTH-PE-002197", risk: 67, priority: "P3", status: "Triagem", stage: 0, owner: "Central de triagem", sla: "06h 40m", authority: "ANA / ente parceiro", due: "11 ago · 12:00" },
  { id: "GF-2026-0811", title: "Confirmar retificação de finalidade", detectionId: "DET-2026-9091", chtId: "UTH-SP-009142", risk: 48, priority: "P4", status: "Monitoramento", stage: 5, owner: "Monitoramento SP", sla: "9 dias", authority: "SP Águas", due: "19 ago" },
];

const initialOrders: InspectionOrder[] = [
  { id: "OF-2026-4418", caseId: "GF-2026-0917", title: "Vistoria de captação e medição", team: "Equipe Fiscal DF-02", scheduled: "10 ago · 13:20", route: "Base ANA → UTH · 42 km", checklist: 12, offlinePackage: "218 MB · pronto", status: "Aprovação humana" },
  { id: "OF-2026-4391", caseId: "GF-2026-0894", title: "Inspeção de barramento e operação", team: "Equipe MT-01", scheduled: "10 ago · 08:00", route: "Cuiabá → barramento · 184 km", checklist: 18, offlinePackage: "486 MB · sincronizado", status: "Em campo" },
  { id: "OF-2026-4378", caseId: "GF-2026-0881", title: "Conferência de macromedidor", team: "Equipe SP-04", scheduled: "09 ago · 09:30", route: "Regional → estação · 28 km", checklist: 9, offlinePackage: "142 MB · arquivado", status: "Cumprida" },
  { id: "OF-2026-4350", caseId: "GF-2026-0864", title: "Verificação de lançamento", team: "Equipe MG-03", scheduled: "12 ago · 10:00", route: "Montes Claros → ponto · 96 km", checklist: 15, offlinePackage: "274 MB · preparando", status: "Rascunho" },
];

const initialEvidence: FieldEvidence[] = [
  { id: "EVD-GF-11842", caseId: "GF-2026-0917", title: "Foto georreferenciada do macromedidor", kind: "Imagem + EXIF", capturedAt: "10 ago · 13:48:22", position: "−15.5812, −47.8194 · ±3 m", collector: "Fiscal ANA · credencial 0271", hash: "sha256:9f2d…18a", custody: 4, status: "Verificada" },
  { id: "EVD-GF-11843", caseId: "GF-2026-0917", title: "Leitura instantânea em campo", kind: "Observação estruturada", capturedAt: "10 ago · 13:51:08", position: "−15.5811, −47.8195 · ±4 m", collector: "Fiscal ANA · credencial 0271", hash: "sha256:771e…4c2", custody: 3, status: "Sincronizada" },
  { id: "EVD-GF-11844", caseId: "GF-2026-0917", title: "Vídeo do sistema de captação", kind: "Vídeo · 38 s", capturedAt: "10 ago · 13:54:31", position: "−15.5814, −47.8192 · ±5 m", collector: "Fiscal ANA · credencial 0271", hash: "sha256:40ab…781", custody: 3, status: "Sincronizada" },
  { id: "EVD-GF-11791", caseId: "GF-2026-0894", title: "Vista montante do barramento", kind: "Imagem panorâmica", capturedAt: "10 ago · 10:18:04", position: "−16.2018, −54.6011 · ±6 m", collector: "Equipe MT-01", hash: "sha256:4db8…9ae", custody: 2, status: "Coletada" },
  { id: "EVD-GF-11622", caseId: "GF-2026-0881", title: "Termo de acompanhamento assinado", kind: "Documento PDF/A", capturedAt: "09 ago · 11:22:40", position: "estação SP-009142", collector: "Equipe SP-04", hash: "sha256:ab11…301", custody: 6, status: "Verificada" },
];

const initialConformity: ConformityItem[] = [
  { id: "CONF-01", requirement: "Vazão instantânea ≤ 52 L/s", source: "M4 · ATO-ANA-1142-24", expected: "máximo 52 L/s", observed: "54,2 L/s no evento · 51,8 L/s em campo", result: "Divergente", confidence: 92 },
  { id: "CONF-02", requirement: "Macromedidor instalado e operacional", source: "M4 · CND-1142-02", expected: "medição contínua", observed: "instalado · lacuna de 30 min recuperada", result: "Conforme", confidence: 96 },
  { id: "CONF-03", requirement: "Regime de até 16 h/dia", source: "M4 · ato vigente", expected: "16 h/dia · 24 dias/mês", observed: "logs locais incompletos", result: "Inconclusivo", confidence: 68 },
  { id: "CONF-04", requirement: "Localização da interferência", source: "M1 · UTH-DF-004918", expected: "geometria autorizada ±20 m", observed: "distância 4,8 m", result: "Conforme", confidence: 99 },
  { id: "CONF-05", requirement: "Finalidade industrial declarada", source: "M2 · Passaporte", expected: "uso industrial", observed: "processo produtivo compatível", result: "Conforme", confidence: 91 },
  { id: "CONF-06", requirement: "Cenário sazonal restritivo", source: "M6 · CEN-2026-0048-B", expected: "aplicável após decisão", observed: "ainda sem efeito regulatório", result: "Não aplicável", confidence: 100 },
];

const initialResults: ResultRecord[] = [
  { id: "RES-GF-2026-091", caseId: "GF-2026-0811", outcome: "Retificação confirmada", measure: "Atualização cadastral e monitoramento", decidedAt: "08 ago · 15:42", authority: "SP Águas", followUp: "verificar série por 30 dias", status: "Monitorando" },
  { id: "RES-GF-2026-088", caseId: "GF-2026-0784", outcome: "Equipamento regularizado", measure: "Prazo cumprido com evidência", decidedAt: "05 ago · 11:08", authority: "INEMA", followUp: "amostragem trimestral", status: "Efetivo" },
  { id: "RES-GF-2026-074", caseId: "GF-2026-0712", outcome: "Indício não confirmado", measure: "Caso encerrado com motivação", decidedAt: "31 jul · 17:21", authority: "ANA", followUp: "nenhum", status: "Encerrado" },
  { id: "RES-GF-2026-061", caseId: "GF-2026-0641", outcome: "Reincidência de captação", measure: "Novo caso e revisão regulatória", decidedAt: "28 jul · 09:17", authority: "Órgão estadual", followUp: "vistoria em 15 dias", status: "Reincidente" },
];

const riskFactors = [
  { label: "Materialidade hídrica", weight: 24, score: 96 },
  { label: "Confiança do indício", weight: 18, score: 94 },
  { label: "Criticidade territorial", weight: 18, score: 87 },
  { label: "Histórico e reincidência", weight: 14, score: 72 },
  { label: "Risco ambiental/social", weight: 14, score: 81 },
  { label: "Urgência e reversibilidade", weight: 12, score: 92 },
];

const statusClass = (value: string) => value.toLowerCase().replaceAll(" ", "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function GeoFiscalHub({ contextItem, territory, clockLabel, onNavigate, onOpenModule, onToast }: GeoFiscalHubProps) {
  const [detections, setDetections] = useState(initialDetections);
  const [selectedDetectionId, setSelectedDetectionId] = useState(initialDetections[0].id);
  const [cases, setCases] = useState(initialCases);
  const [selectedCaseId, setSelectedCaseId] = useState(initialCases[0].id);
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrders[0].id);
  const [evidence, setEvidence] = useState(initialEvidence);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(initialEvidence[0].id);
  const [conformity] = useState(initialConformity);
  const [results, setResults] = useState(initialResults);
  const [detectionFilter, setDetectionFilter] = useState("Todos");
  const [caseFilter, setCaseFilter] = useState("Todos");
  const [evidenceFilter, setEvidenceFilter] = useState("Todas");
  const [riskRecalculated, setRiskRecalculated] = useState(false);
  const [fieldOnline, setFieldOnline] = useState(false);
  const [fieldStarted, setFieldStarted] = useState(false);
  const [checklist, setChecklist] = useState([true, true, true, false, false, false, false, false]);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentStep, setAgentStep] = useState(5);
  const [subject, setSubject] = useState({ chtId: "UTH-DF-004918", demandId: "DEM-2026-1842", passportId: "PAS-DF-004918", authority: "ANA · unidade fiscalizadora", requestedFlow: 68, authorizedFlow: 52, stationId: "EST-DF-60435100", seriesId: "SER-DF-004918-Q", dataQuality: 94, dataVersion: "qv18", scenarioId: "CEN-2026-0048-B", scenarioReliability: 88, scenarioBalance: 3.1, center: [-47.82, -15.58] as [number, number] });

  const selectedDetection = detections.find((item) => item.id === selectedDetectionId) ?? detections[0];
  const selectedCase = cases.find((item) => item.id === selectedCaseId) ?? cases[0];
  const selectedOrder = orders.find((item) => item.id === selectedOrderId) ?? orders[0];
  const selectedEvidence = evidence.find((item) => item.id === selectedEvidenceId) ?? evidence[0];
  const filteredDetections = detectionFilter === "Todos" ? detections : detections.filter((item) => item.status === detectionFilter || item.severity === detectionFilter);
  const filteredCases = caseFilter === "Todos" ? cases : cases.filter((item) => item.status === caseFilter || item.priority === caseFilter);
  const filteredEvidence = evidenceFilter === "Todas" ? evidence : evidence.filter((item) => item.status === evidenceFilter || item.kind.includes(evidenceFilter));
  const caseConformity = conformity.filter((item) => item.result !== "Não aplicável");
  const conformityScore = Math.round(caseConformity.reduce((sum, item) => sum + (item.result === "Conforme" ? 100 : item.result === "Divergente" ? 25 : 55), 0) / caseConformity.length);

  useEffect(() => {
    const receiveData = (event: Event) => {
      const detail = (event as CustomEvent<{ stationId?: string; seriesId?: string; chtId?: string; demandId?: string; quality?: number; version?: string; center?: [number, number] }>).detail;
      if (!detail?.chtId && !detail?.seriesId) return;
      setSubject((value) => ({ ...value, stationId: detail.stationId ?? value.stationId, seriesId: detail.seriesId ?? value.seriesId, chtId: detail.chtId ?? value.chtId, demandId: detail.demandId ?? value.demandId, dataQuality: detail.quality ?? value.dataQuality, dataVersion: detail.version ?? value.dataVersion, center: detail.center ?? value.center }));
    };
    const receiveScenario = (event: Event) => {
      const detail = (event as CustomEvent<{ scenarioId?: string; demandId?: string; chtId?: string; reliability?: number; balance?: number; center?: [number, number] }>).detail;
      if (!detail?.scenarioId) return;
      setSubject((value) => ({ ...value, scenarioId: detail.scenarioId ?? value.scenarioId, demandId: detail.demandId ?? value.demandId, chtId: detail.chtId ?? value.chtId, scenarioReliability: detail.reliability ?? value.scenarioReliability, scenarioBalance: detail.balance ?? value.scenarioBalance, center: detail.center ?? value.center }));
    };
    const receiveRegulation = (event: Event) => {
      const detail = (event as CustomEvent<{ demandId?: string; chtId?: string; passportId?: string; requestedFlow?: number; authorizedFlow?: number; authority?: string; center?: [number, number] }>).detail;
      if (!detail?.demandId) return;
      setSubject((value) => ({ ...value, ...detail, center: detail.center ?? value.center }));
    };
    window.addEventListener("cht:data-context", receiveData);
    window.addEventListener("cht:scenario-context", receiveScenario);
    window.addEventListener("cht:regulation-context", receiveRegulation);
    return () => { window.removeEventListener("cht:data-context", receiveData); window.removeEventListener("cht:scenario-context", receiveScenario); window.removeEventListener("cht:regulation-context", receiveRegulation); };
  }, []);

  useEffect(() => {
    if (!agentRunning) return;
    const interval = window.setInterval(() => setAgentStep((step) => {
      if (step >= 5) { setAgentRunning(false); onToast("Dossiê assistido concluído; risco, roteiro e minuta aguardam revisão humana."); return step; }
      return step + 1;
    }), 1050);
    return () => window.clearInterval(interval);
  }, [agentRunning, onToast]);

  const emitTowerEvent = (title: string, severity: "Crítico" | "Alto" | "Médio" | "Baixo", recommendation: string) => window.dispatchEvent(new CustomEvent("cht:module-event", { detail: { eventId: `GFE-${Date.now().toString(16).slice(-6).toUpperCase()}`, type: "inspection.review.required", title, severity, source: "M7 · GeoFiscal", module: "m7", moduleName: "GeoFiscalização", territory, confidence: selectedDetection.confidence, chtId: selectedDetection.chtId, recommendation, occurredAt: clockLabel } }));

  const broadcastInspection = (fiscalCase = selectedCase) => window.dispatchEvent(new CustomEvent("cht:inspection-context", { detail: { caseId: fiscalCase.id, detectionId: fiscalCase.detectionId, chtId: fiscalCase.chtId, risk: fiscalCase.risk, priority: fiscalCase.priority, status: fiscalCase.status, authority: fiscalCase.authority, scenarioId: subject.scenarioId, seriesId: subject.seriesId, center: selectedDetection.center } }));
  const openConsumer = (moduleId: string) => { broadcastInspection(); onOpenModule(moduleId); };
  const startAgent = () => { setAgentOpen(true); setAgentStep(0); setAgentRunning(true); };

  const focusDetection = (detection: Detection) => {
    setSelectedDetectionId(detection.id);
    const fiscalCase = cases.find((item) => item.detectionId === detection.id);
    if (fiscalCase) setSelectedCaseId(fiscalCase.id);
    window.dispatchEvent(new CustomEvent("cht:focus-map", { detail: { center: detection.center, zoom: 11, label: `${detection.id} · ${detection.title}`, source: `${detection.source} · ${detection.status}`, confidence: detection.confidence } }));
    if (fiscalCase) broadcastInspection(fiscalCase);
    onToast(`${detection.id} selecionada; mapa, risco, caso, ato, dados e cenário receberam o contexto.`);
  };

  const createCaseFromDetection = () => {
    const existing = cases.find((item) => item.detectionId === selectedDetection.id);
    if (existing) { setSelectedCaseId(existing.id); onNavigate("Casos"); onToast(`${existing.id} já correlacionado ao indício.`); return; }
    const item: FiscalCase = { id: `GF-2026-${String(920 + cases.length).padStart(4, "0")}`, title: selectedDetection.title, detectionId: selectedDetection.id, chtId: selectedDetection.chtId, risk: selectedDetection.score, priority: selectedDetection.score >= 85 ? "P1" : selectedDetection.score >= 70 ? "P2" : "P3", status: "Triagem", stage: 0, owner: "Central de triagem", sla: "04h 00m", authority: subject.authority, due: "11 ago · 12:00" };
    setCases((items) => [item, ...items]); setSelectedCaseId(item.id); setDetections((items) => items.map((entry) => entry.id === selectedDetection.id ? { ...entry, status: "Correlacionado" } : entry)); broadcastInspection(item); onNavigate("Casos"); onToast(`${item.id} criado com correlationId, SLA, evidências e contexto preservados.`);
  };

  const recalculateRisk = () => {
    setRiskRecalculated(true);
    setCases((items) => items.map((item) => item.id === selectedCase.id ? { ...item, risk: Math.min(99, item.risk + 2), priority: item.risk >= 83 ? "P1" : item.priority } : item));
    onToast("Risco recalculado com materialidade, confiança, criticidade, histórico, impacto e urgência.");
  };

  const advanceCase = () => {
    const stages: CaseStatus[] = ["Triagem", "Investigação", "Ordem", "Campo", "Decisão", "Monitoramento", "Concluído"];
    const next = Math.min(6, selectedCase.stage + 1);
    setCases((items) => items.map((item) => item.id === selectedCase.id ? { ...item, stage: next, status: stages[next] } : item));
    if (next === 2) setOrderModalOpen(true);
    if (next === 4) setDecisionModalOpen(true);
    broadcastInspection({ ...selectedCase, stage: next, status: stages[next] });
    onToast(`${selectedCase.id} avançou para ${stages[next]}; trilha e responsável foram atualizados.`);
  };

  const approveOrder = () => {
    const existing = orders.find((item) => item.caseId === selectedCase.id);
    if (existing) setOrders((items) => items.map((item) => item.id === existing.id ? { ...item, status: "Emitida" } : item));
    else {
      const order: InspectionOrder = { id: `OF-2026-${4420 + orders.length}`, caseId: selectedCase.id, title: `Vistoria · ${selectedCase.title}`, team: "Equipe a designar", scheduled: "11 ago · 08:00", route: "Base regional → UTH", checklist: 12, offlinePackage: "preparando", status: "Emitida" };
      setOrders((items) => [order, ...items]); setSelectedOrderId(order.id);
    }
    setCases((items) => items.map((item) => item.id === selectedCase.id ? { ...item, stage: 3, status: "Campo" } : item));
    setOrderModalOpen(false); emitTowerEvent("Ordem de vistoria aprovada", "Alto", `${selectedCase.id} possui ordem humana emitida e equipe em preparação.`); onToast("Ordem aprovada pela autoridade; roteiro, checklist, pacote offline e recibo foram registrados.");
  };

  const startFieldSession = () => {
    setFieldStarted(true); setOrders((items) => items.map((item) => item.id === selectedOrder.id ? { ...item, status: "Em campo" } : item)); onToast("Sessão de campo iniciada; relógio, dispositivo, fiscal e pacote offline foram vinculados.");
  };

  const toggleChecklist = (index: number) => setChecklist((items) => items.map((item, itemIndex) => itemIndex === index ? !item : item));

  const captureEvidence = (event?: FormEvent) => {
    event?.preventDefault();
    const item: FieldEvidence = { id: `EVD-GF-${11845 + evidence.length}`, caseId: selectedCase.id, title: "Nova evidência georreferenciada", kind: "Imagem + formulário", capturedAt: `10 ago · ${clockLabel}`, position: `${selectedDetection.center[1].toFixed(4)}, ${selectedDetection.center[0].toFixed(4)} · ±4 m`, collector: "Fiscal autenticado · dispositivo GF-0271", hash: `sha256:${Date.now().toString(16).slice(-8)}…cht`, custody: 1, status: fieldOnline ? "Sincronizada" : "Coletada" };
    setEvidence((items) => [item, ...items]); setSelectedEvidenceId(item.id); setEvidenceModalOpen(false);
    window.dispatchEvent(new CustomEvent("cht:field-evidence-event", { detail: { evidenceId: item.id, caseId: item.caseId, chtId: selectedCase.chtId, kind: item.kind, status: item.status, hash: item.hash, capturedAt: item.capturedAt, center: selectedDetection.center } }));
    onToast(`${item.id} capturada com posição, relógio, coletor e hash; ${fieldOnline ? "sincronização confirmada" : "armazenada offline"}.`);
  };

  const verifyEvidence = () => {
    setEvidence((items) => items.map((item) => item.id === selectedEvidence.id ? { ...item, status: "Verificada", custody: item.custody + 1 } : item));
    onToast(`${selectedEvidence.id} verificada; hash, assinatura, metadados e cadeia de custódia são consistentes.`);
  };

  const decideConformity = () => {
    setCases((items) => items.map((item) => item.id === selectedCase.id ? { ...item, stage: 5, status: "Monitoramento" } : item));
    const result: ResultRecord = { id: `RES-GF-2026-${100 + results.length}`, caseId: selectedCase.id, outcome: "Divergência material requer acompanhamento", measure: "Diligência técnica e monitoramento de 30 dias", decidedAt: `10 ago · ${clockLabel}`, authority: selectedCase.authority, followUp: "M5 série + M4 revisão · 30 dias", status: "Monitorando" };
    setResults((items) => [result, ...items]); setDecisionModalOpen(false);
    window.dispatchEvent(new CustomEvent("cht:inspection-result-event", { detail: { resultId: result.id, caseId: selectedCase.id, demandId: subject.demandId, chtId: selectedCase.chtId, outcome: result.outcome, measure: result.measure, conformityScore, status: "Monitoramento", authority: selectedCase.authority, evidenceCount: evidence.filter((item) => item.caseId === selectedCase.id).length } }));
    emitTowerEvent("Resultado fiscalizatório registrado", "Alto", `${selectedCase.id} requer diligência e monitoramento; nenhuma sanção foi automatizada.`); onToast(`${result.id} registrado com decisão humana, justificativa, evidências e acompanhamento M4/M5.`);
  };

  const closeResult = (result: ResultRecord) => {
    setResults((items) => items.map((item) => item.id === result.id ? { ...item, status: "Encerrado", followUp: "concluído com evidência" } : item));
    setCases((items) => items.map((item) => item.id === result.caseId ? { ...item, stage: 6, status: "Concluído" } : item)); onToast(`${result.id} encerrado com verificação de efetividade e trilha preservada.`);
  };

  const Kpis = () => <div className="fiscal-kpis"><article><span>INDÍCIOS ATIVOS</span><strong>{detections.filter((item) => item.status !== "Descartado").length}</strong><small>2 alta prioridade · 1 novo</small><i style={{ width: "76%" }} /></article><article><span>CASOS EM CURSO</span><strong>{cases.filter((item) => item.status !== "Concluído").length}</strong><small>2 P1 · SLA crítico 28 min</small><i className="warn" style={{ width: "82%" }} /></article><article><span>EQUIPES EM CAMPO</span><strong>7</strong><small>4 online · 3 modo offline</small><i style={{ width: "68%" }} /></article><article><span>EFETIVIDADE 90 DIAS</span><strong>84,6%</strong><small>↑ 3,2 pt · reincidência 7,1%</small><i style={{ width: "84.6%" }} /></article></div>;

  const Detections = () => <div className="fiscal-detections"><header className="fiscal-section-toolbar"><div><h2>Detecções e indícios territoriais</h2><p>Satélite, telemetria, regras, denúncias e cruzamentos — confiança e método explícitos</p></div><div className="fiscal-filters">{["Todos", "Novo", "Validando", "Correlacionado", "Alta", "Crítica"].map((item) => <button key={item} className={detectionFilter === item ? "active" : ""} onClick={() => setDetectionFilter(item)}>{item}</button>)}<button className="primary" onClick={startAgent}>✦ Correlacionar indícios</button></div></header><div className="fiscal-detection-layout"><article className="panel fiscal-detection-list"><div className="fiscal-detection-head"><span>INDÍCIO / OBJETO</span><span>TIPO</span><span>FONTE / MÉTODO</span><span>RISCO</span><span>CONFIANÇA</span><span>STATUS</span><span /></div>{filteredDetections.map((item) => <button key={item.id} className={item.id === selectedDetection.id ? "selected" : ""} onClick={() => focusDetection(item)}><span className={`fiscal-detection-icon ${statusClass(item.severity)}`}>⌖</span><div><small>{item.id} · {item.observedAt}</small><strong>{item.title}</strong><p>{item.chtId}</p></div><span>{item.type}</span><div><b>{item.source}</b><small>{item.method}</small></div><span className={`fiscal-risk-score ${statusClass(item.severity)}`}>{item.score}</span><b>{item.confidence}%</b><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article><aside className="panel fiscal-detection-detail"><header><div><small>{selectedDetection.id} · {selectedDetection.type}</small><h2>{selectedDetection.title}</h2><p>{selectedDetection.chtId} · {selectedDetection.observedAt}</p></div><span className={`fiscal-state ${statusClass(selectedDetection.severity)}`}>{selectedDetection.severity}</span></header><div className="fiscal-detection-preview"><div className="fiscal-satellite-grid" /><div className="fiscal-target-ring"><i /><b /></div><span>{selectedDetection.method}</span><strong>{selectedDetection.score}% risco</strong></div><div className="fiscal-detection-metrics"><div><span>RISCO</span><strong>{selectedDetection.score}/100</strong></div><div><span>CONFIANÇA</span><strong>{selectedDetection.confidence}%</strong></div><div><span>PERSISTÊNCIA</span><strong>3 janelas</strong></div></div><section className="fiscal-correlation"><span>CORRELAÇÃO PONTA A PONTA</span>{[["M1", selectedDetection.chtId, "identidade 94%"], ["M4", `${subject.demandId} · limite ${subject.authorizedFlow} L/s`, "ato vigente"], ["M5", `${subject.seriesId} · ${subject.dataVersion}`, `${subject.dataQuality}% qualidade`], ["M6", `${subject.scenarioId} · saldo +${subject.scenarioBalance}`, `${subject.scenarioReliability}% confiança`]].map((item) => <button key={item[0]} onClick={() => openConsumer(item[0].toLowerCase())}><b>{item[0]}</b><span>{item[1]}</span><em>{item[2]}</em><i>↗</i></button>)}</section><section className="fiscal-detection-limit"><span>LIMITE DO INDÍCIO</span><p>O padrão detectado orienta priorização; não comprova infração nem substitui vistoria e decisão da autoridade.</p></section><footer><button onClick={() => { setDetections((items) => items.map((item) => item.id === selectedDetection.id ? { ...item, status: "Descartado" } : item)); onToast("Indício descartado com justificativa; dados e decisão foram preservados."); }}>Descartar com motivo</button><button onClick={recalculateRisk}>Recalcular risco</button><button className="primary" onClick={createCaseFromDetection}>Criar ou abrir caso →</button></footer></aside></div></div>;

  const Risk = () => <div className="fiscal-risk"><header className="fiscal-section-toolbar"><div><h2>Priorização multicritério de risco</h2><p>Materialidade, confiança, criticidade, histórico, impacto, urgência e capacidade operacional</p></div><div><button onClick={() => openConsumer("m6")}>Cenário M6 ↗</button><button className="primary" onClick={recalculateRisk}>✦ Recalcular fila</button></div></header><div className="fiscal-risk-layout"><article className="panel fiscal-risk-factors"><header className="panel-header"><div><h2>Composição do score</h2><p>{selectedCase.id} · política RSK-2026.08.3</p></div><span>{riskRecalculated ? selectedCase.risk + 2 : selectedCase.risk}/100</span></header>{riskFactors.map((item) => <label key={item.label}><div><span>{item.label}</span><small>peso {item.weight}%</small></div><input type="range" min="0" max="100" defaultValue={item.score} /><b>{item.score}</b></label>)}<section><span>EXPLICAÇÃO</span><p>Vazão potencialmente acima do ato em território de atenção sazonal, com série de alta qualidade e necessidade de confirmação em campo.</p></section><footer><button onClick={() => onToast("Pesos restaurados conforme política institucional versionada.")}>Restaurar política</button><button onClick={() => emitTowerEvent("Risco fiscalizatório P1", "Alto", `${selectedCase.id} possui score ${selectedCase.risk} e SLA ${selectedCase.sla}.`)}>Escalar P1</button></footer></article><article className="panel fiscal-priority-queue"><div className="fiscal-priority-head"><span>CASO / TERRITÓRIO</span><span>SCORE</span><span>PRIORIDADE</span><span>SLA</span><span>CAPACIDADE</span><span>STATUS</span><span /></div>{[...cases].sort((a,b) => b.risk - a.risk).map((item) => <button key={item.id} className={item.id === selectedCase.id ? "selected" : ""} onClick={() => setSelectedCaseId(item.id)}><span className={`fiscal-priority-score ${item.risk >= 85 ? "critical" : item.risk >= 70 ? "warn" : "ok"}`}>{item.risk}</span><div><small>{item.id} · {item.chtId}</small><strong>{item.title}</strong><p>{item.authority}</p></div><b>{item.risk}/100</b><em className={item.priority.toLowerCase()}>{item.priority}</em><time>{item.sla}</time><span>{item.owner}</span><span className={`fiscal-state ${statusClass(item.status)}`}>{item.status}</span><i>→</i></button>)}</article></div><div className="fiscal-capacity-strip"><div><span>EQUIPES DISPONÍVEIS</span><strong>3</strong><small>DF · BA · remoto</small></div><div><span>ROTAS OTIMIZÁVEIS</span><strong>7</strong><small>economia estimada 412 km</small></div><div><span>CASOS P1 SEM EQUIPE</span><strong>1</strong><small>GF-2026-0908</small></div><button onClick={() => onNavigate("Ordens")}>Planejar ordens →</button></div></div>;

  const Cases = () => <div className="fiscal-cases"><header className="fiscal-section-toolbar"><div><h2>Gestão de casos fiscalizatórios</h2><p>Triagem, investigação, ordem, campo, decisão, monitoramento e conclusão</p></div><div className="fiscal-filters">{["Todos", "Triagem", "Investigação", "Ordem", "Campo", "Decisão", "Monitoramento", "P1"].map((item) => <button key={item} className={caseFilter === item ? "active" : ""} onClick={() => setCaseFilter(item)}>{item}</button>)}<button className="primary" onClick={() => setCaseModalOpen(true)}>＋ Novo caso</button></div></header><div className="fiscal-case-layout"><article className="panel fiscal-case-list"><div className="fiscal-case-head"><span>CASO / OBJETO</span><span>RISCO</span><span>PRIORIDADE</span><span>RESPONSÁVEL</span><span>SLA</span><span>STATUS</span><span /></div>{filteredCases.map((item) => <button key={item.id} className={item.id === selectedCase.id ? "selected" : ""} onClick={() => { setSelectedCaseId(item.id); broadcastInspection(item); }}><span className={`fiscal-case-icon ${item.priority.toLowerCase()}`}>{item.priority}</span><div><small>{item.id} · {item.detectionId}</small><strong>{item.title}</strong><p>{item.chtId} · {item.authority}</p></div><b>{item.risk}/100</b><em className={item.priority.toLowerCase()}>{item.priority}</em><span>{item.owner}</span><time>{item.sla}<small>vence {item.due}</small></time><span className={`fiscal-state ${statusClass(item.status)}`}>{item.status}</span><i>→</i></button>)}</article><aside className="panel fiscal-case-detail"><header><div><small>{selectedCase.id} · {selectedCase.detectionId}</small><h2>{selectedCase.title}</h2><p>{selectedCase.chtId} · {selectedCase.authority}</p></div><span className={`fiscal-state ${statusClass(selectedCase.status)}`}>{selectedCase.status}</span></header><div className="fiscal-case-workflow">{["Triagem", "Investigação", "Ordem", "Campo", "Decisão", "Monitoramento", "Concluído"].map((item,index) => <div key={item} className={index < selectedCase.stage ? "done" : index === selectedCase.stage ? "active" : ""}><span>{index < selectedCase.stage ? "✓" : index + 1}</span><small>{item}</small></div>)}</div><div className="fiscal-case-summary"><div><span>RISCO</span><strong>{selectedCase.risk}/100</strong></div><div><span>PRIORIDADE</span><strong>{selectedCase.priority}</strong></div><div><span>SLA</span><strong>{selectedCase.sla}</strong></div><div><span>EVIDÊNCIAS</span><strong>{evidence.filter((item) => item.caseId === selectedCase.id).length}</strong></div></div><section><span>DOSSIÊ CORRELACIONADO</span>{[["Indício", selectedCase.detectionId, "94%"], ["Identidade", selectedCase.chtId, "M1"], ["Ato e condições", `limite ${subject.authorizedFlow} L/s`, "M4"], ["Série", subject.seriesId, "M5"], ["Cenário", subject.scenarioId, "M6"]].map((item) => <button key={item[0]}><b>{item[0]}</b><span>{item[1]}</span><em>{item[2]}</em><i>↗</i></button>)}</section><div className="fiscal-case-agent"><span>✦</span><div><strong>GeoFiscalização</strong><p>Propõe roteiro, perguntas, evidências esperadas e minuta; revisão humana obrigatória.</p></div><button onClick={startAgent}>Abrir</button></div><footer><button onClick={() => emitTowerEvent("Caso fiscalizatório escalado", selectedCase.priority === "P1" ? "Alto" : "Médio", `${selectedCase.id} requer coordenação por risco e SLA.`)}>Escalar M0</button><button className="primary" disabled={selectedCase.stage === 6} onClick={advanceCase}>Validar e avançar →</button></footer></aside></div></div>;

  const Orders = () => <div className="fiscal-orders"><header className="fiscal-section-toolbar"><div><h2>Ordens e planejamento de vistoria</h2><p>Autoridade, objetivo, equipe, rota, checklist, pacote offline, segurança e aprovação</p></div><div><button onClick={() => onToast("Rotas recalculadas por prioridade, janela, equipe, distância e acesso.")}>⌁ Otimizar rotas</button><button className="primary" onClick={() => setOrderModalOpen(true)}>＋ Preparar ordem</button></div></header><div className="fiscal-order-layout"><article className="panel fiscal-order-list"><div className="fiscal-order-head"><span>ORDEM / CASO</span><span>EQUIPE</span><span>AGENDA</span><span>ROTA</span><span>CHECKLIST</span><span>PACOTE OFFLINE</span><span>STATUS</span><span /></div>{orders.map((item) => <button key={item.id} className={item.id === selectedOrder.id ? "selected" : ""} onClick={() => { setSelectedOrderId(item.id); const fiscalCase = cases.find((entry) => entry.id === item.caseId); if (fiscalCase) setSelectedCaseId(fiscalCase.id); }}><span className={`fiscal-order-icon ${statusClass(item.status)}`}>▤</span><div><small>{item.id} · {item.caseId}</small><strong>{item.title}</strong></div><span>{item.team}</span><time>{item.scheduled}</time><span>{item.route}</span><b>{item.checklist} itens</b><span>{item.offlinePackage}</span><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article><aside className="panel fiscal-order-detail"><header><div><small>{selectedOrder.id} · {selectedOrder.caseId}</small><h2>{selectedOrder.title}</h2><p>{selectedOrder.team} · {selectedOrder.scheduled}</p></div><em className={statusClass(selectedOrder.status)}>{selectedOrder.status}</em></header><div className="fiscal-route-preview"><div className="fiscal-route-line"><i /><b /><span /></div><small>42 km · 56 min · 1 acesso condicionado</small><strong>Base ANA → {selectedCase.chtId}</strong></div><section className="fiscal-order-pack"><span>PACOTE DE CAMPO</span>{[["Mapa e navegação", "ArcGIS offline · 84 MB", "pronto"], ["Dossiê do caso", "atos, séries, cenários · 42 MB", "pronto"], ["Imagens", "Sentinel + CBERS · 86 MB", "pronto"], ["Checklist", `${selectedOrder.checklist} itens + regras`, "pronto"], ["Segurança", "contatos, acesso e riscos", "validado"]].map((item) => <p key={item[0]}><b>{item[0]}</b><span>{item[1]}</span><em>{item[2]}</em></p>)}</section><section className="fiscal-order-authority"><span>ALÇADA E LIMITES</span><p>A ordem autoriza coleta e verificação no escopo descrito; não autoriza sanção, alteração de ato ou acesso fora da competência.</p></section><footer><button onClick={() => onToast(`${selectedOrder.id}: minuta, fundamento, rota e pacote exportados.`)}>⇩ Exportar roteiro</button><button className="primary" disabled={selectedOrder.status === "Emitida" || selectedOrder.status === "Em campo" || selectedOrder.status === "Cumprida"} onClick={() => setOrderModalOpen(true)}>Revisar e emitir →</button></footer></aside></div></div>;

  const Field = () => <div className="fiscal-field"><header className="fiscal-section-toolbar"><div><h2>Operação de campo georreferenciada</h2><p>Modo offline, navegação, checklist, evidência, sincronização e segurança da equipe</p></div><div><button onClick={() => setFieldOnline((value) => !value)}>{fieldOnline ? "● Online" : "○ Modo offline"}</button><button className="primary" onClick={startFieldSession}>{fieldStarted ? "Sessão em andamento" : "▶ Iniciar sessão"}</button></div></header><div className="fiscal-field-layout"><article className="panel fiscal-field-map"><header className="panel-header"><div><h2>Mapa e rota offline</h2><p>{selectedOrder.route} · pacote {selectedOrder.offlinePackage}</p></div><span className={fieldOnline ? "online" : "offline"}>{fieldOnline ? "ONLINE" : "OFFLINE"}</span></header><div className="fiscal-offline-map"><div className="fiscal-map-grid" /><div className="fiscal-field-route"><i /><b /><span /></div><div className="fiscal-field-point"><span>GF</span><small>{selectedCase.chtId}</small></div><aside><span>POSIÇÃO</span><strong>−15.5812, −47.8194</strong><small>precisão ±3 m · GNSS fix</small></aside></div><footer><button onClick={() => onToast("Navegação centrada na posição da equipe e na UTH alvo.")}>⌖ Centralizar</button><button onClick={() => setEvidenceModalOpen(true)}>◎ Capturar evidência</button><button onClick={() => onToast("Rota alternativa offline carregada com restrições de acesso.")}>⌁ Alternar rota</button></footer></article><aside className="panel fiscal-field-checklist"><header><div><small>{selectedOrder.id} · {selectedCase.id}</small><h2>Checklist de vistoria</h2><p>{checklist.filter(Boolean).length}/{checklist.length} concluídos · salvo no dispositivo</p></div><span>{Math.round(checklist.filter(Boolean).length / checklist.length * 100)}%</span></header><div className="fiscal-field-progress"><i><b style={{ width: `${checklist.filter(Boolean).length / checklist.length * 100}%` }} /></i></div>{["Confirmar identidade e localização", "Registrar presença e responsável", "Fotografar ponto de captação", "Conferir macromedidor e lacres", "Coletar leitura instantânea", "Verificar regime e logs locais", "Registrar declarações e documentos", "Revisar e assinar termo de campo"].map((item,index) => <button key={item} className={checklist[index] ? "done" : ""} onClick={() => toggleChecklist(index)}><span>{checklist[index] ? "✓" : index + 1}</span><div><strong>{item}</strong><small>{checklist[index] ? "evidência vinculada · agora" : "pendente"}</small></div><i>{checklist[index] ? "concluído" : "abrir →"}</i></button>)}<div className="fiscal-field-sync"><span className={fieldOnline ? "online" : "offline"}>{fieldOnline ? "●" : "○"}</span><div><strong>{fieldOnline ? "Sincronização ativa" : "Fila offline protegida"}</strong><p>{evidence.filter((item) => item.status === "Coletada").length} evidências aguardam envio · criptografia local ativa</p></div><button onClick={() => { setEvidence((items) => items.map((item) => item.status === "Coletada" ? { ...item, status: "Sincronizada", custody: item.custody + 1 } : item)); setFieldOnline(true); onToast("Fila sincronizada com confirmação de hash e recibo do servidor."); }}>Sincronizar</button></div><footer><button onClick={() => setEvidenceModalOpen(true)}>＋ Evidência</button><button className="primary" disabled={checklist.filter(Boolean).length < 5} onClick={() => { setOrders((items) => items.map((item) => item.id === selectedOrder.id ? { ...item, status: "Cumprida" } : item)); setCases((items) => items.map((item) => item.id === selectedCase.id ? { ...item, stage: 4, status: "Decisão" } : item)); onNavigate("Evidências"); onToast("Vistoria encerrada; pacote assinado e submetido para análise humana."); }}>Encerrar vistoria →</button></footer></aside></div></div>;

  const Evidences = () => <div className="fiscal-evidence"><header className="fiscal-section-toolbar"><div><h2>Evidências e cadeia de custódia</h2><p>Captura, posição, identidade, integridade, transferências, verificação e contestação</p></div><div className="fiscal-filters">{["Todas", "Coletada", "Sincronizada", "Verificada", "Contestada", "Imagem", "Documento"].map((item) => <button key={item} className={evidenceFilter === item ? "active" : ""} onClick={() => setEvidenceFilter(item)}>{item}</button>)}<button className="primary" onClick={() => setEvidenceModalOpen(true)}>＋ Nova evidência</button></div></header><div className="fiscal-evidence-layout"><article className="panel fiscal-evidence-list"><div className="fiscal-evidence-head"><span>EVIDÊNCIA / CASO</span><span>TIPO</span><span>CAPTURA</span><span>POSIÇÃO</span><span>COLETOR</span><span>CUSTÓDIA</span><span>STATUS</span><span /></div>{filteredEvidence.map((item) => <button key={item.id} className={item.id === selectedEvidence.id ? "selected" : ""} onClick={() => setSelectedEvidenceId(item.id)}><span className={`fiscal-evidence-icon ${statusClass(item.status)}`}>◆</span><div><small>{item.id} · {item.caseId}</small><strong>{item.title}</strong><p>{item.hash}</p></div><span>{item.kind}</span><time>{item.capturedAt}</time><span>{item.position}</span><span>{item.collector}</span><b>{item.custody} eventos</b><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article><aside className="panel fiscal-evidence-detail"><header><div><small>{selectedEvidence.id} · {selectedEvidence.caseId}</small><h2>{selectedEvidence.title}</h2><p>{selectedEvidence.kind} · {selectedEvidence.capturedAt}</p></div><em className={statusClass(selectedEvidence.status)}>{selectedEvidence.status}</em></header><div className="fiscal-evidence-preview"><span>CHT BRASIL · EVIDÊNCIA</span><div className="fiscal-photo-mark"><i /><b /></div><small>{selectedEvidence.position}</small><strong>{selectedEvidence.hash}</strong></div><div className="fiscal-integrity"><div><span>HASH</span><strong>Íntegro</strong></div><div><span>ASSINATURA</span><strong>Válida</strong></div><div><span>METADADOS</span><strong>Consistentes</strong></div></div><section className="fiscal-custody"><span>CADEIA DE CUSTÓDIA</span>{[["13:48:22", "Captura", selectedEvidence.collector], ["13:48:23", "Hash e assinatura", "dispositivo GF-0271"], ["13:52:10", "Sincronização", "M7 Evidence Store"], ["13:52:11", "Verificação automática", "política CUST-007"], ["14:02:08", "Acesso para análise", "autoridade do caso"]].slice(0, Math.max(2, selectedEvidence.custody + 1)).map((item,index) => <div key={item[0]}><time>{item[0]}</time><span className={index < selectedEvidence.custody ? "done" : "active"}>{index < selectedEvidence.custody ? "✓" : "●"}</span><p><strong>{item[1]}</strong><small>{item[2]}</small></p></div>)}</section><footer><button onClick={() => onToast(`${selectedEvidence.id}: cópia verificável e manifest exportados.`)}>⇩ Exportar manifest</button><button onClick={() => { setEvidence((items) => items.map((item) => item.id === selectedEvidence.id ? { ...item, status: "Contestada" } : item)); onToast("Contestação aberta sem alterar a evidência original."); }}>Contestar</button><button className="primary" disabled={selectedEvidence.status === "Verificada"} onClick={verifyEvidence}>✓ Verificar integridade</button></footer></aside></div></div>;

  const Compliance = () => <div className="fiscal-compliance"><header className="fiscal-section-toolbar"><div><h2>Análise de conformidade assistida</h2><p>Requisito, fonte, esperado, observado, evidência, confiança e decisão humana</p></div><div><button onClick={() => openConsumer("m4")}>Ato e condições M4 ↗</button><button className="primary" onClick={() => setDecisionModalOpen(true)}>Revisar conclusão</button></div></header><div className="fiscal-compliance-top"><article className="panel fiscal-compliance-score"><span>CONFORMIDADE CONTEXTUAL</span><div style={{ "--score": `${conformityScore * 3.6}deg` } as React.CSSProperties}><strong>{conformityScore}%</strong><small>3 conformes · 1 divergente</small></div><h2>Divergência material com complemento necessário</h2><p>A leitura de pico superou a referência, mas a medição de campo está abaixo do limite. Logs de regime permanecem incompletos.</p><small>Não caracteriza infração automaticamente.</small></article><article className="panel fiscal-compliance-synthesis"><header><div><small>SÍNTESE ASSISTIDA · 89% CONFIANÇA</small><h2>Confirmar período e regime antes da conclusão</h2><p>{selectedCase.id} · {selectedCase.authority}</p></div><span>REVISÃO HUMANA</span></header><section><span>FATOS</span><p>Macromedidor operacional, localização compatível, leitura em campo de 51,8 L/s e evento qualificado de 54,2 L/s.</p></section><section className="inference"><span>INFERÊNCIA</span><p>O pico pode refletir evento transitório; a lacuna de logs impede concluir duração e recorrência.</p></section><section className="limit"><span>LIMITES</span><p>GeoFiscal não sanciona, autua, altera ato ou presume responsabilidade. A autoridade decide com contraditório e fundamento.</p></section><footer><button onClick={startAgent}>Ver trace do agente</button><button className="primary" onClick={() => setDecisionModalOpen(true)}>Revisar decisão →</button></footer></article></div><article className="panel fiscal-compliance-table"><div className="fiscal-compliance-head"><span>REQUISITO / FONTE</span><span>ESPERADO</span><span>OBSERVADO</span><span>CONFIANÇA</span><span>RESULTADO</span><span /></div>{conformity.map((item) => <button key={item.id} onClick={() => onToast(`${item.id}: regra, fonte, evidências e raciocínio carregados.`)}><span className={`fiscal-compliance-icon ${statusClass(item.result)}`}>{item.result === "Conforme" ? "✓" : item.result === "Divergente" ? "!" : "?"}</span><div><small>{item.id} · {item.source}</small><strong>{item.requirement}</strong></div><span>{item.expected}</span><span>{item.observed}</span><b>{item.confidence}%</b><em className={statusClass(item.result)}>{item.result}</em><i>→</i></button>)}</article></div>;

  const Results = () => <div className="fiscal-results"><header className="fiscal-section-toolbar"><div><h2>Resultados e efetividade</h2><p>Decisões, medidas, acompanhamento, reincidência, tempo e benefício territorial</p></div><div><button onClick={() => onToast("Relatório de efetividade exportado com metodologia e recorte temporal.")}>⇩ Relatório</button><button className="primary" onClick={() => openConsumer("m8")}>Planejamento M8 ↗</button></div></header><div className="fiscal-result-kpis"><article><span>CASOS CONCLUÍDOS</span><strong>418</strong><small>últimos 90 dias · +12%</small></article><article><span>TEMPO MEDIANO</span><strong>6,2 dias</strong><small>−1,4 dia no ciclo</small></article><article><span>MEDIDAS EFETIVAS</span><strong>84,6%</strong><small>verificadas após 30 dias</small></article><article><span>REINCIDÊNCIA</span><strong>7,1%</strong><small>−2,3 pt em 12 meses</small></article></div><div className="fiscal-results-layout"><article className="panel fiscal-results-table"><div className="fiscal-results-head"><span>RESULTADO / CASO</span><span>DESFECHO</span><span>MEDIDA</span><span>AUTORIDADE</span><span>ACOMPANHAMENTO</span><span>STATUS</span><span /></div>{results.map((item) => <div key={item.id}><span className={`fiscal-result-icon ${statusClass(item.status)}`}>{item.status === "Efetivo" || item.status === "Encerrado" ? "✓" : "↻"}</span><div><small>{item.id} · {item.caseId}</small><strong>{item.outcome}</strong><p>{item.decidedAt}</p></div><span>{item.outcome}</span><span>{item.measure}</span><span>{item.authority}</span><span>{item.followUp}</span><em className={statusClass(item.status)}>{item.status}</em><button disabled={item.status === "Encerrado"} onClick={() => closeResult(item)}>Encerrar →</button></div>)}</article><aside className="panel fiscal-effectiveness"><header className="panel-header"><div><h2>Funil de efetividade</h2><p>indício → resultado verificado</p></div><span>90 dias</span></header>{[["Indícios recebidos", 1284, 100], ["Casos priorizados", 742, 58], ["Ordens emitidas", 531, 41], ["Vistorias cumpridas", 486, 38], ["Decisões registradas", 418, 33], ["Medidas efetivas", 354, 28]].map((item,index) => <div key={item[0] as string}><span>{index + 1}</span><p><strong>{item[0]}</strong><small>{item[1].toLocaleString("pt-BR")}</small></p><i><b style={{ width: `${item[2]}%` }} /></i><em>{item[2]}%</em></div>)}<section><span>✦ INSIGHT</span><p>A maior perda ocorre entre caso priorizado e ordem emitida. Planejamento de rotas e cooperação federativa podem reduzir o gargalo em 18%.</p></section></aside></div></div>;

  const views: Record<string, () => ReactNode> = { "Detecções": Detections, "Risco": Risk, "Casos": Cases, "Ordens": Orders, "Campo": Field, "Evidências": Evidences, "Conformidade": Compliance, "Resultados": Results };
  const ActiveView = views[contextItem] ?? Detections;
  const agentSteps = ["Resolver identidade, competência e objeto territorial", "Recuperar ato, condições, séries e cenários", "Correlacionar indícios e eliminar duplicidades", "Calcular risco explicável e prioridade", "Montar roteiro, checklist e evidências esperadas", "Gerar dossiê e minuta sem efeito decisório"];

  return <section className="fiscal-hub" aria-label={`GeoFiscal — ${contextItem}`}><div className="fiscal-context-bar"><div><span>GF</span><small>CASO ATIVO</small><strong>{selectedCase.id} · {selectedCase.status}</strong></div><div><span>⌖</span><small>OBJETO E INDÍCIO</small><strong>{selectedCase.chtId} · {selectedDetection.id}</strong></div><div><span>◇</span><small>RISCO / PRIORIDADE</small><strong>{selectedCase.risk}/100 · {selectedCase.priority} · SLA {selectedCase.sla}</strong></div><div><span>◴</span><small>REFERÊNCIA</small><strong>{clockLabel} BRT · política GF 2026.08.3</strong></div><button onClick={startAgent}>✦ Assistente de Vistoria</button></div>{Kpis()}{ActiveView()}

    {orderModalOpen && <div className="fiscal-modal-backdrop" onMouseDown={() => setOrderModalOpen(false)}><section className="fiscal-order-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>APROVAÇÃO HUMANA · {selectedCase.id}</small><h2>Revisar ordem de vistoria</h2><p>Autoridade {selectedCase.authority} · risco {selectedCase.risk}/100</p></div><button onClick={() => setOrderModalOpen(false)}>×</button></header><div className="fiscal-order-metrics"><div><span>PRIORIDADE</span><strong>{selectedCase.priority}</strong></div><div><span>SLA</span><strong>{selectedCase.sla}</strong></div><div><span>CHECKLIST</span><strong>12 itens</strong></div><div><span>PACOTE</span><strong>218 MB</strong></div></div><section><span>OBJETIVO E ESCOPO</span><p>Verificar ponto de captação, equipamento de medição, leitura instantânea, regime de uso e documentos relacionados ao ato vigente.</p></section><div className="fiscal-modal-grid"><label><span>EQUIPE</span><select defaultValue="Equipe Fiscal DF-02"><option>Equipe Fiscal DF-02</option><option>Equipe conjunta ANA/ente</option><option>Núcleo remoto</option></select></label><label><span>JANELA</span><input type="datetime-local" defaultValue="2026-08-10T13:20" /></label><label className="full"><span>FUNDAMENTO E LIMITES</span><textarea defaultValue="Indício de vazão acima da referência, série qualificada e necessidade de confirmação. Coleta restrita ao objeto, período e itens descritos; sem decisão sancionatória automática." /></label><label className="full"><span>SEGURANÇA E ACESSO</span><textarea defaultValue="Confirmar contato local; área industrial; EPI obrigatório; rota e ponto de encontro no pacote offline." /></label></div><section className="fiscal-order-warning"><span>GUARDRAIL</span><p>Emitir a ordem registra autorização humana para a vistoria. O agente não assina, sanciona ou amplia o escopo.</p></section><footer><button onClick={() => setOrderModalOpen(false)}>Cancelar</button><button onClick={() => { setOrderModalOpen(false); onToast("Minuta devolvida para ajustes com observações da autoridade."); }}>Devolver para ajuste</button><button className="primary" onClick={approveOrder}>✓ Aprovar e emitir ordem</button></footer></section></div>}

    {evidenceModalOpen && <div className="fiscal-modal-backdrop" onMouseDown={() => setEvidenceModalOpen(false)}><form className="fiscal-evidence-modal" onSubmit={captureEvidence} onMouseDown={(event) => event.stopPropagation()}><header><div><small>CAPTURA DE EVIDÊNCIA · {selectedCase.id}</small><h2>Registrar evidência georreferenciada</h2><p>Metadados, hash, coletor e posição serão preservados no dispositivo.</p></div><button type="button" onClick={() => setEvidenceModalOpen(false)}>×</button></header><div className="fiscal-capture-preview"><div className="fiscal-camera-frame"><i /><b /><span>REC</span></div><aside><span>GNSS</span><strong>fix · ±4 m</strong><span>RELÓGIO</span><strong>{clockLabel} BRT</strong><span>DISPOSITIVO</span><strong>GF-0271 · íntegro</strong></aside></div><div className="fiscal-modal-grid"><label><span>TIPO</span><select defaultValue="Imagem + formulário"><option>Imagem + formulário</option><option>Vídeo</option><option>Áudio</option><option>Documento</option><option>Leitura estruturada</option></select></label><label><span>ITEM DO CHECKLIST</span><select defaultValue="Macromedidor"><option>Macromedidor</option><option>Ponto de captação</option><option>Leitura instantânea</option><option>Documentação</option></select></label><label className="full"><span>DESCRIÇÃO</span><textarea defaultValue="Equipamento instalado, lacre visível e visor legível; registrar leitura e número de série." /></label></div><section><span>CADEIA INICIAL</span><p>captura → hash local → assinatura do fiscal → cofre offline → sincronização → recibo do servidor</p></section><footer><button type="button" onClick={() => setEvidenceModalOpen(false)}>Cancelar</button><button type="submit" className="primary">◎ Capturar, assinar e vincular</button></footer></form></div>}

    {decisionModalOpen && <div className="fiscal-modal-backdrop" onMouseDown={() => setDecisionModalOpen(false)}><section className="fiscal-decision-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>DECISÃO HUMANA · {selectedCase.id}</small><h2>Revisar conclusão fiscalizatória</h2><p>{conformityScore}% conformidade contextual · {evidence.filter((item) => item.caseId === selectedCase.id).length} evidências</p></div><button onClick={() => setDecisionModalOpen(false)}>×</button></header><div className="fiscal-decision-metrics"><div><span>RISCO</span><strong>{selectedCase.risk}/100</strong></div><div><span>CONFORMIDADE</span><strong>{conformityScore}%</strong></div><div><span>EVIDÊNCIAS</span><strong>{evidence.filter((item) => item.caseId === selectedCase.id).length}</strong></div><div><span>CONFIANÇA</span><strong>89%</strong></div></div><section><span>FATOS</span><p>Localização e equipamento são compatíveis. Houve pico de 54,2 L/s; leitura em campo de 51,8 L/s. Logs de regime estão incompletos.</p></section><section className="inference"><span>PROPOSTA ASSISTIDA</span><p>Abrir diligência para logs e manter monitoramento qualificado por 30 dias antes de conclusão material.</p></section><section className="limit"><span>LIMITE</span><p>O sistema não sanciona, autua, presume responsabilidade ou altera o ato. A autoridade deve motivar qualquer medida e assegurar o procedimento aplicável.</p></section><div className="fiscal-decision-options"><label><input type="radio" name="decision" defaultChecked /><span><strong>Diligência e monitoramento</strong><small>Complementar logs e acompanhar M5 por 30 dias.</small></span></label><label><input type="radio" name="decision" /><span><strong>Concluir conformidade</strong><small>Registrar motivação e encerrar com acompanhamento.</small></span></label><label><input type="radio" name="decision" /><span><strong>Encaminhar para medida cabível</strong><small>Submeter a processo próprio, fora da decisão do agente.</small></span></label></div><label className="fiscal-decision-justification"><span>JUSTIFICATIVA DA AUTORIDADE</span><textarea defaultValue="Determino diligência para apresentação dos logs do regime e monitoramento por 30 dias. A leitura isolada não é suficiente para conclusão material." /></label><footer><button onClick={() => setDecisionModalOpen(false)}>Cancelar</button><button onClick={() => { setDecisionModalOpen(false); onToast("Conclusão devolvida para complemento com observações registradas."); }}>Devolver</button><button className="primary" onClick={decideConformity}>✓ Decidir e acompanhar</button></footer></section></div>}

    {caseModalOpen && <div className="fiscal-modal-backdrop" onMouseDown={() => setCaseModalOpen(false)}><form className="fiscal-case-modal" onSubmit={(event) => { event.preventDefault(); setCaseModalOpen(false); createCaseFromDetection(); }} onMouseDown={(event) => event.stopPropagation()}><header><div><small>NOVO CASO FISCALIZATÓRIO</small><h2>Registrar indício ou denúncia</h2><p>Triagem inicial sem presunção de irregularidade.</p></div><button type="button" onClick={() => setCaseModalOpen(false)}>×</button></header><div className="fiscal-modal-grid"><label className="full"><span>OBJETO / CHT-ID</span><input defaultValue={subject.chtId} /></label><label><span>TIPO</span><select defaultValue="Indício remoto"><option>Indício remoto</option><option>Denúncia</option><option>Demanda institucional</option><option>Reincidência</option></select></label><label><span>FONTE</span><select defaultValue="M5 / M6"><option>M5 / M6</option><option>Usuário identificado</option><option>Órgão parceiro</option></select></label><label className="full"><span>DESCRIÇÃO</span><textarea defaultValue="Relatar fato observado, período, localização, fonte e motivo para análise." /></label></div><section><span>VALIDAÇÃO</span><p>identidade · competência · duplicidade · materialidade · fonte · temporalidade · dados mínimos</p></section><footer><button type="button" onClick={() => setCaseModalOpen(false)}>Cancelar</button><button type="submit" className="primary">Criar em triagem →</button></footer></form></div>}

    {agentOpen && <div className="fiscal-agent-backdrop" onMouseDown={() => setAgentOpen(false)}><aside className="fiscal-agent-drawer" onMouseDown={(event) => event.stopPropagation()}><header><div className="fiscal-agent-avatar">✦</div><div><small>{agentRunning ? "EXECUÇÃO AO VIVO" : "DOSSIÊ CONCLUÍDO"}</small><h2>Assistente de Vistoria</h2><p>Trace M7-A07-{selectedCase.id.slice(-4)} · política GF-HIL-007</p></div><button onClick={() => setAgentOpen(false)}>×</button></header><div className="fiscal-agent-scopes"><span>ESCOPOS</span><b>Consultar</b><b>Correlacionar</b><b>Priorizar</b><b>Redigir</b><b className="blocked">Sancionar ✕</b></div><section className="fiscal-agent-plan"><h3>Plano de execução</h3>{agentSteps.map((item,index) => <div key={item} className={index < agentStep ? "done" : index === agentStep ? "running" : "waiting"}><span>{index < agentStep ? "✓" : index === agentStep ? "●" : "○"}</span><div><strong>{item}</strong><small>{index < agentStep ? `${520 + index * 271} ms · evidência registrada` : index === agentStep ? "executando ferramentas autorizadas…" : "aguardando dependência"}</small></div></div>)}</section><section className="fiscal-agent-tools"><h3>Ferramentas e grounding</h3>{[["M1/M2", "identidade, vínculos e passaporte", "94%"], ["M4", `ato, limite ${subject.authorizedFlow} L/s e condições`, "97%"], ["M5", `${subject.seriesId} · ${subject.dataVersion}`, `${subject.dataQuality}%`], ["M6", `${subject.scenarioId} · saldo ${subject.scenarioBalance}`, `${subject.scenarioReliability}%`], ["ArcGIS", "imagens, rota e pacote offline", "87%"]].map((item) => <button key={item[0]}><span>▤</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div><b>{item[2]}</b></button>)}</section><section className="fiscal-agent-output"><div><h3>Saída estruturada</h3><span>89% confiança</span></div><p><b>Fato:</b> evento qualificado de 54,2 L/s frente ao limite de 52 L/s; leitura atual de 51,8 L/s.</p><p><b>Risco:</b> P1 por materialidade, território sazonal e SLA.</p><p><b>Roteiro:</b> confirmar medidor, logs de regime, posição, finalidade e responsável.</p><p><b>Limite:</b> o agente não emite ordem, sanciona, autua, presume responsabilidade ou decide o caso.</p></section><footer><button onClick={() => { setAgentRunning(false); onToast("Agente pausado; trace e estado foram preservados."); }}>■ Pausar</button><button onClick={() => openConsumer("m12")}>Central de Agentes</button><button className="primary" onClick={() => { setAgentOpen(false); setOrderModalOpen(true); }}>Revisar proposta →</button></footer></aside></div>}
  </section>;
}
