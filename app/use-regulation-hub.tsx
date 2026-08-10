"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type DemandStatus = "Triagem" | "Pré-análise" | "Exigência" | "Decisão" | "Protocolada" | "Concluída";
type OperationalStatus = "Regular" | "Atenção" | "Pendente" | "Em atraso" | "Concluída";

type UseDemand = {
  id: string;
  title: string;
  chtId: string;
  passportId: string;
  purpose: string;
  requestedFlow: number;
  regime: string;
  status: DemandStatus;
  stage: number;
  risk: "Alto" | "Médio" | "Baixo";
  sla: string;
  authority: string;
  createdAt: string;
  center: [number, number];
};

type RegulatoryAct = {
  id: string;
  sourceId: string;
  title: string;
  authority: string;
  validFrom: string;
  validUntil: string;
  authorizedFlow: number;
  regime: string;
  status: "Vigente" | "A vencer" | "Suspenso" | "Encerrado";
  source: string;
  version: string;
};

type Condition = {
  id: string;
  title: string;
  actId: string;
  category: string;
  frequency: string;
  nextDue: string;
  evidence: string;
  status: OperationalStatus;
  module: string;
};

type ChargeMemory = {
  id: string;
  period: string;
  authorized: number;
  measured: number;
  declared: number;
  unitPrice: number;
  estimated: number;
  status: "Simulada" | "Conciliada" | "Divergente";
};

type Revision = {
  id: string;
  title: string;
  trigger: string;
  actId: string;
  impact: string;
  status: "Detectada" | "Em análise" | "Aguardando autoridade" | "Concluída";
  due: string;
};

type UseConflict = {
  id: string;
  title: string;
  demand: string;
  constraint: string;
  territory: string;
  severity: "Alta" | "Média" | "Baixa";
  score: number;
  status: "Aberto" | "Em análise" | "Decidido";
  recommendation: string;
};

type UseRegulationHubProps = {
  contextItem: string;
  territory: string;
  clockLabel: string;
  onNavigate: (item: string) => void;
  onOpenModule: (moduleId: string) => void;
  onCreateRecord: () => void;
  onToast: (message: string) => void;
};

const initialDemands: UseDemand[] = [
  { id: "DEM-2026-1842", title: "Ampliação de captação · Ribeirão Mestre d'Armas", chtId: "UTH-DF-004918", passportId: "PAS-DF-004918", purpose: "Uso industrial", requestedFlow: 68, regime: "18 h/dia · 26 dias/mês", status: "Pré-análise", stage: 1, risk: "Médio", sla: "01h 42m", authority: "ANA · competência indicativa", createdAt: "10 ago · 09:18", center: [-47.82, -15.58] },
  { id: "DEM-2026-1837", title: "Regularização de área irrigada · Oeste BA", chtId: "UTH-BA-018407", passportId: "PAS-BA-018407", purpose: "Irrigação", requestedFlow: 47, regime: "12 h/dia · sazonal", status: "Exigência", stage: 2, risk: "Alto", sla: "00h 28m", authority: "INEMA · competência indicativa", createdAt: "10 ago · 08:42", center: [-45.46, -12.32] },
  { id: "DEM-2026-1819", title: "Renovação de captação urbana · Sistema Noroeste", chtId: "UTH-SP-009142", passportId: "PAS-SP-009142", purpose: "Abastecimento público", requestedFlow: 112, regime: "contínuo", status: "Decisão", stage: 3, risk: "Baixo", sla: "04h 11m", authority: "SP Águas · competência indicativa", createdAt: "09 ago · 16:03", center: [-50.1, -20.4] },
  { id: "DEM-2026-1798", title: "Interferência em barramento · Alto Paraguai", chtId: "UTH-MT-001782", passportId: "PAS-MT-001782", purpose: "Regularização de vazão", requestedFlow: 0, regime: "operação por curva", status: "Triagem", stage: 0, risk: "Alto", sla: "02h 08m", authority: "SEMA-MT · a validar", createdAt: "09 ago · 11:27", center: [-54.6, -16.2] },
  { id: "DEM-2026-1744", title: "Captação para dessedentação animal", chtId: "UTH-MG-007211", passportId: "PAS-MG-007211", purpose: "Dessedentação", requestedFlow: 2.4, regime: "8 h/dia", status: "Protocolada", stage: 4, risk: "Baixo", sla: "externo", authority: "IGAM · competência indicativa", createdAt: "08 ago · 09:16", center: [-44.3, -18.4] },
];

const initialActs: RegulatoryAct[] = [
  { id: "ATO-ANA-1142-24", sourceId: "RES-1142/2024", title: "Autorização de captação superficial", authority: "ANA · SRE", validFrom: "18 mar 2024", validUntil: "18 mar 2034", authorizedFlow: 52, regime: "16 h/dia · 24 dias/mês", status: "Vigente", source: "Águas Brasil · cenário sintético", version: "v7" },
  { id: "ATO-INEMA-188407", sourceId: "OUT-188.407", title: "Autorização estadual para irrigação", authority: "INEMA", validFrom: "11 jul 2022", validUntil: "11 jul 2027", authorizedFlow: 42, regime: "10 h/dia · sazonal", status: "A vencer", source: "Sistema estadual · cenário", version: "v4" },
  { id: "ATO-SP-009142", sourceId: "DAEE-009142", title: "Autorização para abastecimento urbano", authority: "SP Águas", validFrom: "01 out 2021", validUntil: "01 out 2031", authorizedFlow: 105, regime: "contínuo", status: "Vigente", source: "Sistema estadual · cenário", version: "v9" },
  { id: "ATO-MT-01782", sourceId: "BAR-01782", title: "Cadastro provisório de barramento", authority: "SEMA-MT", validFrom: "21 jan 2025", validUntil: "21 jan 2026", authorizedFlow: 0, regime: "curva operacional", status: "Suspenso", source: "Sistema estadual · cenário", version: "v3" },
];

const initialConditions: Condition[] = [
  { id: "CND-1142-01", title: "Enviar autodeclaração anual de uso", actId: "ATO-ANA-1142-24", category: "Declaração", frequency: "anual", nextDue: "22 ago 2026 · 12 dias", evidence: "Formulário AU-2026", status: "Atenção", module: "m2" },
  { id: "CND-1142-02", title: "Transmitir leitura mensal do macromedidor", actId: "ATO-ANA-1142-24", category: "Automonitoramento", frequency: "mensal", nextDue: "13 ago 2026 · 3 dias", evidence: "Série M5 + foto", status: "Pendente", module: "m5" },
  { id: "CND-1142-03", title: "Manter vazão instantânea abaixo do limite", actId: "ATO-ANA-1142-24", category: "Limite operacional", frequency: "contínua", nextDue: "monitoramento contínuo", evidence: "Telemetria", status: "Regular", module: "m5" },
  { id: "CND-1142-04", title: "Reconciliar duas leituras ausentes", actId: "ATO-ANA-1142-24", category: "Qualidade", frequency: "evento", nextDue: "11 ago 2026 · 1 dia", evidence: "Justificativa + backfill", status: "Em atraso", module: "m5" },
  { id: "CND-1142-05", title: "Ciência da condicionante ambiental", actId: "ATO-ANA-1142-24", category: "Licenciamento", frequency: "única", nextDue: "concluída em 18 jul", evidence: "REC-81142", status: "Concluída", module: "m3" },
];

const initialCharges: ChargeMemory[] = [
  { id: "COB-2026-07", period: "jul 2026", authorized: 52, measured: 48.6, declared: 48.1, unitPrice: 0.021, estimated: 1018.44, status: "Conciliada" },
  { id: "COB-2026-06", period: "jun 2026", authorized: 52, measured: 54.2, declared: 49.8, unitPrice: 0.021, estimated: 1138.2, status: "Divergente" },
  { id: "COB-2026-05", period: "mai 2026", authorized: 52, measured: 46.3, declared: 46.1, unitPrice: 0.021, estimated: 972.3, status: "Conciliada" },
  { id: "COB-2026-08", period: "ago 2026 · parcial", authorized: 52, measured: 17.4, declared: 0, unitPrice: 0.021, estimated: 365.4, status: "Simulada" },
];

const initialRevisions: Revision[] = [
  { id: "REV-2026-218", title: "Demanda solicitada supera vazão autorizada", trigger: "demanda 68 L/s × ato 52 L/s", actId: "ATO-ANA-1142-24", impact: "balanço, condicionantes e cobrança", status: "Detectada", due: "12 dias" },
  { id: "REV-2026-204", title: "Mudança de vocabulário de finalidade", trigger: "release M3 2026.09-rc1", actId: "ATO-SP-009142", impact: "classificação e relatórios", status: "Em análise", due: "21 dias" },
  { id: "REV-2026-191", title: "Vigência próxima do fim", trigger: "validade até 11 jul 2027", actId: "ATO-INEMA-188407", impact: "renovação e evidências", status: "Aguardando autoridade", due: "335 dias" },
  { id: "REV-2026-177", title: "Retificação de endereço hídrico", trigger: "M1 versão v7", actId: "ATO-ANA-1142-24", impact: "nenhum efeito material", status: "Concluída", due: "concluída" },
];

const initialConflicts: UseConflict[] = [
  { id: "RUC-2026-091", title: "Demanda acima da autorização vigente", demand: "68 L/s · DEM-2026-1842", constraint: "52 L/s · ATO-ANA-1142-24", territory: "UTH-DF-004918", severity: "Alta", score: 94, status: "Aberto", recommendation: "Simular alternativas de regime e encaminhar revisão à autoridade competente." },
  { id: "RUC-2026-087", title: "Medição acima do autorizado em junho", demand: "54,2 L/s medidos", constraint: "52 L/s autorizados", territory: "UTH-DF-004918", severity: "Média", score: 88, status: "Em análise", recommendation: "Validar sensor, janela temporal e eventual tolerância antes de caracterizar ocorrência." },
  { id: "RUC-2026-074", title: "Dois atos potencialmente sobrepostos", demand: "ATO-INEMA-188407", constraint: "Cadastro CNARH correlato", territory: "UTH-BA-018407", severity: "Alta", score: 91, status: "Aberto", recommendation: "Resolver identidade do ato e competência antes de qualquer consolidação." },
  { id: "RUC-2026-061", title: "Finalidade declarada divergente", demand: "uso industrial", constraint: "processo produtivo", territory: "UTH-SP-009142", severity: "Baixa", score: 72, status: "Decidido", recommendation: "Vocabulários relacionados com ressalva e versão preservada." },
];

const monitoringSeries = [42, 46, 48, 51, 49, 53, 47, 0, 50, 54, 52, 49, 47, 0, 48, 46, 51, 50, 52, 48, 45, 47, 49, 50];
const statusClass = (value: string) => value.toLowerCase().replaceAll(" ", "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function UseRegulationHub({ contextItem, territory, clockLabel, onNavigate, onOpenModule, onCreateRecord, onToast }: UseRegulationHubProps) {
  const [demands, setDemands] = useState(initialDemands);
  const [selectedDemandId, setSelectedDemandId] = useState(initialDemands[0].id);
  const [acts, setActs] = useState(initialActs);
  const [selectedActId, setSelectedActId] = useState(initialActs[0].id);
  const [conditions, setConditions] = useState(initialConditions);
  const [charges, setCharges] = useState(initialCharges);
  const [revisions, setRevisions] = useState(initialRevisions);
  const [conflicts, setConflicts] = useState(initialConflicts);
  const [selectedConflictId, setSelectedConflictId] = useState(initialConflicts[0].id);
  const [preanalysisStep, setPreanalysisStep] = useState(5);
  const [preanalysisRunning, setPreanalysisRunning] = useState(false);
  const [demandFilter, setDemandFilter] = useState("Todos");
  const [conditionFilter, setConditionFilter] = useState("Todas");
  const [monitoringReconciled, setMonitoringReconciled] = useState(false);
  const [chargeSimulated, setChargeSimulated] = useState(true);
  const [demandModalOpen, setDemandModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentStep, setAgentStep] = useState(4);
  const [subject, setSubject] = useState({ chtId: "UTH-DF-004918", passportId: "PAS-DF-004918", ruleId: "REG-COMP-008", authority: "ANA · competência indicativa", purpose: "Captação superficial · uso industrial", waterAddress: "Paraná / Paranaíba / UGRH DF / ottobacia 769943", confidence: 97, center: [-47.82, -15.58] as [number, number] });

  const selectedDemand = demands.find((item) => item.id === selectedDemandId) ?? demands[0];
  const selectedAct = acts.find((item) => item.id === selectedActId) ?? acts[0];
  const selectedConflict = conflicts.find((item) => item.id === selectedConflictId) ?? conflicts[0];
  const filteredDemands = demandFilter === "Todos" ? demands : demands.filter((item) => item.status === demandFilter);
  const filteredConditions = conditionFilter === "Todas" ? conditions : conditions.filter((item) => item.status === conditionFilter);
  const measuredAverage = Math.round((monitoringSeries.filter(Boolean).reduce((sum, value) => sum + value, 0) / monitoringSeries.filter(Boolean).length) * 10) / 10;

  useEffect(() => {
    const receiveRegulatory = (event: Event) => {
      const detail = (event as CustomEvent<{ chtId?: string; passportId?: string; ruleId?: string; authority?: string; purpose?: string; confidence?: number }>).detail;
      if (!detail?.chtId) return;
      setSubject((value) => ({ ...value, chtId: detail.chtId ?? value.chtId, passportId: detail.passportId ?? value.passportId, ruleId: detail.ruleId ?? value.ruleId, authority: detail.authority ?? value.authority, purpose: detail.purpose ?? value.purpose, confidence: detail.confidence ?? value.confidence }));
    };
    const receivePassport = (event: Event) => {
      const detail = (event as CustomEvent<{ chtId?: string; passportId?: string; waterAddress?: string; center?: [number, number]; confidence?: number }>).detail;
      if (!detail?.chtId) return;
      setSubject((value) => ({ ...value, chtId: detail.chtId ?? value.chtId, passportId: detail.passportId ?? value.passportId, waterAddress: detail.waterAddress ?? value.waterAddress, center: detail.center ?? value.center, confidence: detail.confidence ?? value.confidence }));
    };
    window.addEventListener("cht:regulatory-context", receiveRegulatory);
    window.addEventListener("cht:passport-context", receivePassport);
    return () => { window.removeEventListener("cht:regulatory-context", receiveRegulatory); window.removeEventListener("cht:passport-context", receivePassport); };
  }, []);

  useEffect(() => {
    const receiveMonitoringEvidence = (event: Event) => {
      const detail = (event as CustomEvent<{ evidenceId?: string; conditionId?: string; status?: string; qualifiedSeriesId?: string; measuredAverage?: number; qualityScore?: number }>).detail;
      if (!detail?.conditionId || !detail.qualifiedSeriesId) return;
      setConditions((items) => items.map((item) => item.id === detail.conditionId ? {
        ...item,
        status: detail.status === "Concluída" ? "Concluída" : item.status,
        evidence: `${detail.qualifiedSeriesId} · ${detail.evidenceId ?? "evidência M5"} · qualidade ${detail.qualityScore ?? 0}%`,
      } : item));
      if (detail.conditionId === "CND-1142-04") setMonitoringReconciled(true);
      onToast(`${detail.qualifiedSeriesId} recebida do M5; condicionante, evidência e memória de monitoramento foram sincronizadas.`);
    };
    window.addEventListener("cht:monitoring-evidence-event", receiveMonitoringEvidence);
    return () => window.removeEventListener("cht:monitoring-evidence-event", receiveMonitoringEvidence);
  }, [onToast]);

  useEffect(() => {
    const receiveScenarioResult = (event: Event) => {
      const detail = (event as CustomEvent<{ scenarioId?: string; demandId?: string; recommendedFlow?: number; reliability?: number; balance?: number; deficit?: number; modelId?: string; status?: string }>).detail;
      if (!detail?.scenarioId || !detail.demandId) return;
      const revisionId = `REV-${detail.scenarioId}`;
      setRevisions((items) => {
        const current = items.find((item) => item.id === revisionId);
        if (current) return items.map((item) => item.id === revisionId ? { ...item, status: detail.status === "Selecionado" ? "Aguardando autoridade" : "Em análise" } : item);
        return [{
          id: revisionId,
          title: `Cenário hídrico ${detail.scenarioId} para ${detail.demandId}`,
          trigger: `${detail.modelId ?? "modelo M6"} · confiabilidade ${detail.reliability ?? 0}% · saldo ${detail.balance ?? 0} hm³`,
          actId: selectedAct.id,
          impact: `vazão recomendada ${detail.recommendedFlow ?? "—"} L/s · déficit ${detail.deficit ?? 0} hm³`,
          status: detail.status === "Selecionado" ? "Aguardando autoridade" : "Em análise",
          due: "12 dias",
        }, ...items];
      });
      onToast(`${detail.scenarioId} recebido do M6; revisão regulatória e impactos na demanda foram sincronizados.`);
    };
    window.addEventListener("cht:scenario-result-event", receiveScenarioResult);
    return () => window.removeEventListener("cht:scenario-result-event", receiveScenarioResult);
  }, [onToast, selectedAct.id]);

  useEffect(() => {
    const receiveInspectionResult = (event: Event) => {
      const detail = (event as CustomEvent<{ resultId?: string; caseId?: string; demandId?: string; chtId?: string; outcome?: string; measure?: string; conformityScore?: number; status?: string; authority?: string; evidenceCount?: number }>).detail;
      if (!detail?.resultId || !detail.caseId) return;
      const revisionId = `REV-${detail.caseId}`;
      const revisionStatus: Revision["status"] = detail.status === "Monitoramento" ? "Aguardando autoridade" : "Em análise";
      setRevisions((items) => {
        const revision: Revision = {
          id: revisionId,
          title: `Resultado fiscalizatório ${detail.resultId}`,
          trigger: `${detail.outcome ?? "resultado M7"} · ${detail.evidenceCount ?? 0} evidências`,
          actId: selectedAct.id,
          impact: `${detail.measure ?? "avaliar medida"} · conformidade ${detail.conformityScore ?? 0}%`,
          status: revisionStatus,
          due: "30 dias",
        };
        return items.some((item) => item.id === revisionId) ? items.map((item) => item.id === revisionId ? revision : item) : [revision, ...items];
      });
      const conditionId = `CND-${detail.caseId}`;
      setConditions((items) => {
        const condition: Condition = {
          id: conditionId,
          title: `Acompanhar resultado fiscalizatório ${detail.caseId}`,
          actId: selectedAct.id,
          category: "Fiscalização",
          frequency: "30 dias",
          nextDue: "09 set 2026 · 30 dias",
          evidence: `${detail.resultId} · M7 · ${detail.evidenceCount ?? 0} evidências`,
          status: "Atenção",
          module: "m7",
        };
        return items.some((item) => item.id === conditionId) ? items.map((item) => item.id === conditionId ? condition : item) : [condition, ...items];
      });
      window.dispatchEvent(new CustomEvent("cht:regulation-obligation-event", { detail: { obligationId: `OBR-${detail.caseId}`, chtId: detail.chtId, title: "Acompanhar diligência fiscalizatória", status: "Pendente", due: "09 set 2026", source: detail.resultId, authority: detail.authority } }));
      onToast(`${detail.resultId} recebido do M7; revisão, condicionante e obrigação do passaporte foram sincronizadas.`);
    };
    window.addEventListener("cht:inspection-result-event", receiveInspectionResult);
    return () => window.removeEventListener("cht:inspection-result-event", receiveInspectionResult);
  }, [onToast, selectedAct.id]);

  useEffect(() => {
    if (!agentRunning) return;
    const interval = window.setInterval(() => setAgentStep((step) => {
      if (step >= 4) { setAgentRunning(false); onToast("Pré-análise concluída; proposta não vinculante disponível para revisão humana."); return step; }
      return step + 1;
    }), 1200);
    return () => window.clearInterval(interval);
  }, [agentRunning, onToast]);

  useEffect(() => {
    if (!preanalysisRunning) return;
    const interval = window.setInterval(() => setPreanalysisStep((step) => {
      if (step >= 5) { setPreanalysisRunning(false); onToast("Checklist concluído; nenhuma decisão externa foi executada."); return step; }
      return step + 1;
    }), 800);
    return () => window.clearInterval(interval);
  }, [preanalysisRunning, onToast]);

  const emitTowerEvent = (title: string, severity: "Crítico" | "Alto" | "Médio" | "Baixo", recommendation: string) => window.dispatchEvent(new CustomEvent("cht:module-event", { detail: { eventId: `RUS-EVT-${Date.now().toString(16).slice(-6).toUpperCase()}`, type: "use.regulation.review.required", title, severity, source: "M4 · Regulação de Usos", module: "m4", moduleName: "Regulação de Usos", territory: subject.waterAddress, confidence: subject.confidence, chtId: subject.chtId, recommendation, occurredAt: clockLabel } }));

  const broadcastContext = (demand = selectedDemand) => window.dispatchEvent(new CustomEvent("cht:regulation-context", { detail: { demandId: demand.id, chtId: demand.chtId, passportId: demand.passportId, purpose: demand.purpose, requestedFlow: demand.requestedFlow, authorizedFlow: selectedAct.authorizedFlow, regime: demand.regime, authority: demand.authority, center: demand.center } }));

  const openConsumer = (moduleId: string) => { broadcastContext(); onOpenModule(moduleId); };

  const focusDemand = (demand: UseDemand) => {
    setSelectedDemandId(demand.id);
    window.dispatchEvent(new CustomEvent("cht:focus-map", { detail: { center: demand.center, zoom: 9, label: `${demand.id} · ${demand.title}`, source: `${demand.authority} · ${demand.status}`, confidence: demand.risk === "Alto" ? 86 : 94 } }));
    broadcastContext(demand);
    onToast(`${demand.id} selecionada; mapa, atos, condições, medições e agentes receberam o mesmo contexto.`);
  };

  const startAgent = () => { setAgentOpen(true); setAgentStep(0); setAgentRunning(true); };
  const runPreanalysis = () => { setPreanalysisStep(0); setPreanalysisRunning(true); startAgent(); };

  const createDemand = (event?: FormEvent) => {
    event?.preventDefault();
    const item: UseDemand = { id: `DEM-2026-${1850 + demands.length}`, title: "Nova demanda de uso · contexto territorial", chtId: subject.chtId, passportId: subject.passportId, purpose: subject.purpose, requestedFlow: 36, regime: "12 h/dia · 22 dias/mês", status: "Triagem", stage: 0, risk: "Médio", sla: "03h 00m", authority: subject.authority, createdAt: `10 ago · ${clockLabel.slice(0, 5)}`, center: subject.center };
    setDemands((items) => [item, ...items]); setSelectedDemandId(item.id); setDemandModalOpen(false); focusDemand(item); onToast(`${item.id} criada em triagem; nenhum protocolo externo foi enviado.`);
  };

  const advanceDemand = () => {
    const statuses: DemandStatus[] = ["Triagem", "Pré-análise", "Exigência", "Decisão", "Protocolada", "Concluída"];
    const next = Math.min(selectedDemand.stage + 1, 5);
    setDemands((items) => items.map((item) => item.id === selectedDemand.id ? { ...item, stage: next, status: statuses[next] } : item));
    if (next === 3) { emitTowerEvent("Demanda pronta para decisão humana", selectedDemand.risk === "Alto" ? "Alto" : "Médio", `${selectedDemand.id} concluiu a pré-análise e requer autoridade competente.`); setDecisionModalOpen(true); }
    else if (next === 4) { broadcastContext(); onToast(`${selectedDemand.id} marcada como protocolada; identificador externo e recibo demonstrativos foram registrados.`); }
    else onToast(`${selectedDemand.id} avançou para ${statuses[next]}.`);
  };

  const approveProposal = () => {
    setDemands((items) => items.map((item) => item.id === selectedDemand.id ? { ...item, stage: 4, status: "Protocolada" } : item));
    setDecisionModalOpen(false); broadcastContext();
    window.dispatchEvent(new CustomEvent("cht:regulation-obligation-event", { detail: { obligationId: `OBR-${selectedDemand.id}`, title: "Acompanhar protocolo e responder exigências", passportId: selectedDemand.passportId, authority: selectedDemand.authority, status: "Pendente", dueDate: "20 ago 2026" } }));
    onToast("Encaminhamento aprovado pela autoridade humana; protocolo demonstrativo, justificativa e trilha foram registrados.");
  };

  const submitConditionEvidence = () => {
    const target = conditions.find((item) => item.status === "Pendente" || item.status === "Em atraso") ?? conditions[0];
    setConditions((items) => items.map((item) => item.id === target.id ? { ...item, status: "Concluída", evidence: `${item.evidence} · EVD-${Date.now().toString(16).slice(-4)}` } : item));
    setEvidenceModalOpen(false);
    window.dispatchEvent(new CustomEvent("cht:regulation-obligation-event", { detail: { obligationId: target.id, title: target.title, passportId: subject.passportId, authority: selectedDemand.authority, status: "Concluída", dueDate: target.nextDue } }));
    onToast(`${target.id} concluída com evidência versionada; M2 e M5 foram notificados.`);
  };

  const reconcileMonitoring = () => { setMonitoringReconciled(true); setConditions((items) => items.map((item) => item.id === "CND-1142-04" ? { ...item, status: "Concluída", evidence: "Backfill + justificativa EVD-11904" } : item)); onToast("Duas lacunas reconciliadas sem alterar o dado bruto; flags e versão qualificada foram publicadas."); };
  const simulateCharge = () => { setChargeSimulated(true); setCharges((items) => items.map((item) => item.id === "COB-2026-08" ? { ...item, estimated: 407.82, status: "Simulada" } : item)); onToast("Memória simulada recalculada; nenhum boleto ou crédito foi constituído."); };
  const startRevision = (revision: Revision) => { setRevisions((items) => items.map((item) => item.id === revision.id ? { ...item, status: "Em análise" } : item)); emitTowerEvent("Revisão regulatória iniciada", revision.id === "REV-2026-218" ? "Alto" : "Médio", `${revision.id} requer análise de impacto e decisão da autoridade.`); onToast(`${revision.id} aberta com snapshot do ato, gatilho e consumidores afetados.`); };
  const decideConflict = () => { setConflicts((items) => items.map((item) => item.id === selectedConflict.id ? { ...item, status: "Decidido" } : item)); setConflictModalOpen(false); emitTowerEvent("Conflito de uso decidido", "Médio", `${selectedConflict.id} recebeu alternativa e justificativa humanas; monitoramento foi agendado.`); onToast(`${selectedConflict.id} decidido; alternativa, condicionantes e indicadores foram versionados.`); };

  const Kpis = () => <div className="use-kpis"><article><span>DEMANDAS ATIVAS</span><strong>{demands.filter((item) => item.status !== "Concluída").length}</strong><small>2 de risco alto · 1 em decisão</small><i style={{ width: "82%" }} /></article><article><span>ATOS VIGENTES</span><strong>3.462</strong><small>94,8% sincronizados</small><i style={{ width: "94.8%" }} /></article><article><span>CONDICIONANTES</span><strong>{conditions.filter((item) => item.status !== "Concluída").length}</strong><small>1 em atraso · 2 próximas</small><i className="warn" style={{ width: "63%" }} /></article><article><span>CONFORMIDADE MEDIDA</span><strong>92,4%</strong><small>↑ 1,8 pt no ciclo</small><i style={{ width: "92.4%" }} /></article></div>;

  const PreAnalysis = () => <div className="use-preanalysis"><header className="use-section-toolbar"><div><h2>Pré-análise regulatória não vinculante</h2><p>Identidade → competência → demanda → disponibilidade → evidências → proposta</p></div><div><button onClick={() => openConsumer("m2")}>Passaporte M2 ↗</button><button onClick={() => openConsumer("m3")}>Regras M3 ↗</button><button className="primary" onClick={runPreanalysis}>{preanalysisRunning ? "Executando…" : "▶ Executar novamente"}</button></div></header><div className="use-preanalysis-steps">{[["01", "Identidade", subject.chtId], ["02", "Competência", subject.authority], ["03", "Demanda", `${selectedDemand.requestedFlow} L/s`], ["04", "Disponibilidade", "M6 · cenário referência"], ["05", "Evidências", "7/8 blocos"], ["06", "Proposta", "revisão humana"]].map((item, index) => <div key={item[0]} className={index < preanalysisStep ? "done" : index === preanalysisStep ? "active" : "pending"}><span>{index < preanalysisStep ? "✓" : item[0]}</span><strong>{item[1]}</strong><small>{item[2]}</small>{index < 5 && <i>→</i>}</div>)}</div><div className="use-preanalysis-layout"><article className="panel use-context-dossier"><header className="panel-header"><div><h2>Dossiê de entrada</h2><p>{selectedDemand.id} · dados federados</p></div><span>{subject.confidence}% contexto</span></header><section><span>OBJETO E FINALIDADE</span><strong>{selectedDemand.title}</strong><p>{selectedDemand.chtId} · {selectedDemand.passportId}</p><small>{selectedDemand.purpose} · {selectedDemand.regime}</small></section><div className="use-demand-comparison"><div><span>ATUAL AUTORIZADO</span><strong>{selectedAct.authorizedFlow} <em>L/s</em></strong><small>{selectedAct.regime}</small></div><i>→</i><div><span>SOLICITADO</span><strong className="warn">{selectedDemand.requestedFlow} <em>L/s</em></strong><small>{selectedDemand.regime}</small></div></div><section className="use-context-sources"><span>FONTES RECUPERADAS</span>{[["M1", "identidade e endereço", "94%"], ["M2", "representação e evidências", "92%"], ["M3", "competência e regras", "97%"], ["M5", "medições e qualidade", "88%"], ["M6", "oferta e cenários", "84%"]].map((item) => <button key={item[0]} onClick={() => openConsumer(item[0].toLowerCase())}><b>{item[0]}</b><span>{item[1]}</span><em>{item[2]}</em><i>↗</i></button>)}</section><footer><button onClick={() => setDemandModalOpen(true)}>Editar demanda</button><button onClick={startAgent}>✦ Ver trace</button></footer></article><article className="panel use-analysis-result"><header><div><small>RESULTADO ESTRUTURADO · 89% CONFIANÇA</small><h2>Viável com revisão de vazão e condicionantes</h2><p>Proposta assistida · sem efeito vinculante</p></div><span className="attention">ATENÇÃO</span></header><div className="use-checklist">{[["Identidade e representação", "compatíveis", "pass"], ["Competência territorial", "ANA indicada", "pass"], ["Ato vigente", `limite ${selectedAct.authorizedFlow} L/s`, "pass"], ["Demanda × autorização", `+${selectedDemand.requestedFlow - selectedAct.authorizedFlow} L/s`, "warn"], ["Balanço de referência", "margem sob cenário B", "warn"], ["Documentação", "1 complemento", "warn"]].map((item) => <div key={item[0]}><span className={item[2]}>{item[2] === "pass" ? "✓" : "!"}</span><strong>{item[0]}</strong><small>{item[1]}</small></div>)}</div><section className="use-alternatives"><h3>Alternativas calculadas</h3>{[["A", "Manter 52 L/s", "menor risco", "Recomendada"], ["B", "68 L/s por 12 h/dia", "risco moderado", "Simular"], ["C", "68 L/s com restrição sazonal", "risco moderado", "Avaliar"]].map((item, index) => <button key={item[0]} className={index === 0 ? "recommended" : ""}><span>{item[0]}</span><div><strong>{item[1]}</strong><small>{item[2]}</small></div><b>{item[3]}</b></button>)}</section><section className="use-proposal"><span>PROPOSTA DO COPILOTO</span><p>Solicitar complemento do regime de uso, simular cenário sazonal no M6 e manter o limite vigente até decisão da autoridade.</p><small>Limite: o agente não concede, nega, altera ou publica ato.</small></section><footer><button onClick={() => emitTowerEvent("Pré-análise requer decisão", "Médio", `${selectedDemand.id} possui alternativa recomendada e três ressalvas para autoridade competente.`)}>Enviar ao M0</button><button onClick={() => onNavigate("Demandas")}>Salvar no workflow</button><button className="primary" onClick={() => setDecisionModalOpen(true)}>Revisar proposta →</button></footer></article></div></div>;

  const Demands = () => <div className="use-demands"><header className="use-section-toolbar"><div><h2>Gestão de demandas regulatórias</h2><p>Triagem, pré-análise, exigência, decisão, protocolo e acompanhamento</p></div><div className="use-filters">{["Todos", "Triagem", "Pré-análise", "Exigência", "Decisão", "Protocolada"].map((item) => <button key={item} className={demandFilter === item ? "active" : ""} onClick={() => setDemandFilter(item)}>{item}</button>)}<button className="primary" onClick={() => setDemandModalOpen(true)}>＋ Nova demanda</button></div></header><div className="use-demand-layout"><article className="panel use-demand-list"><div className="use-demand-head"><span>DEMANDA / OBJETO</span><span>FINALIDADE</span><span>VAZÃO</span><span>RISCO</span><span>SLA</span><span>STATUS</span><span /></div>{filteredDemands.map((item) => <button key={item.id} className={item.id === selectedDemand.id ? "selected" : ""} onClick={() => focusDemand(item)}><span className={`use-risk-icon ${statusClass(item.risk)}`}>{item.risk.slice(0, 1)}</span><div><small>{item.id} · {item.chtId}</small><strong>{item.title}</strong><p>{item.authority}</p></div><span>{item.purpose}</span><b>{item.requestedFlow ? `${item.requestedFlow} L/s` : "curva"}</b><em className={statusClass(item.risk)}>{item.risk}</em><time>{item.sla}</time><span className={`use-state ${statusClass(item.status)}`}>{item.status}</span><i>→</i></button>)}</article><aside className="panel use-demand-detail"><header><div><small>{selectedDemand.id} · {selectedDemand.createdAt}</small><h2>{selectedDemand.title}</h2><p>{selectedDemand.chtId} · {selectedDemand.passportId}</p></div><span className={`use-state ${statusClass(selectedDemand.status)}`}>{selectedDemand.status}</span></header><div className="use-workflow-mini">{["Triagem", "Pré-análise", "Exigência", "Decisão", "Protocolo", "Concluído"].map((item, index) => <div key={item} className={index < selectedDemand.stage ? "done" : index === selectedDemand.stage ? "active" : ""}><span>{index < selectedDemand.stage ? "✓" : index + 1}</span><small>{item}</small></div>)}</div><section><span>RESUMO DA DEMANDA</span><dl><div><dt>Finalidade</dt><dd>{selectedDemand.purpose}</dd></div><div><dt>Vazão solicitada</dt><dd>{selectedDemand.requestedFlow} L/s</dd></div><div><dt>Regime</dt><dd>{selectedDemand.regime}</dd></div><div><dt>Competência</dt><dd>{selectedDemand.authority}</dd></div></dl></section><section className="use-demand-pendencies"><span>PENDÊNCIAS DA ETAPA</span><p><b>!</b>Complementar distribuição mensal da demanda.</p><p><b>!</b>Confirmar cenário de disponibilidade com M6.</p><p><b>✓</b>Identidade, representação e domínio validados.</p></section><div className="use-demand-agent"><span>✦</span><div><strong>Despachos e Exigências</strong><p>Minuta sugerida com fatos, lacunas, fundamento e prazo; revisão humana obrigatória.</p></div><button onClick={startAgent}>Abrir</button></div><footer><button onClick={() => openConsumer("m6")}>Simular M6</button><button onClick={() => emitTowerEvent("Demanda regulatória escalada", selectedDemand.risk === "Alto" ? "Alto" : "Médio", `${selectedDemand.id} requer coordenação por risco ou prazo.`)}>Escalar</button><button className="primary" disabled={selectedDemand.stage === 5} onClick={advanceDemand}>Validar e avançar →</button></footer></aside></div></div>;

  const Acts = () => <div className="use-acts"><header className="use-section-toolbar"><div><h2>Atos e autorizações federadas</h2><p>Autoridade na fonte, vigência, limites, regime, versões e relações</p></div><div><button onClick={() => onToast("Atos sincronizados com Águas Brasil e fontes estaduais; conflitos preservados.")}>↻ Sincronizar</button><button className="primary" onClick={onCreateRecord}>＋ Registrar referência</button></div></header><div className="use-act-summary"><article><span>VIGENTES</span><strong>{acts.filter((item) => item.status === "Vigente").length}</strong><small>fonte oficial vinculada</small></article><article><span>A VENCER</span><strong>{acts.filter((item) => item.status === "A vencer").length}</strong><small>janela de 12 meses</small></article><article><span>SUSPENSOS</span><strong>{acts.filter((item) => item.status === "Suspenso").length}</strong><small>sem operação presumida</small></article><article><span>SINCRONIZAÇÃO</span><strong>94,8%</strong><small>última atualização 18 s</small></article></div><div className="use-acts-layout"><article className="panel use-act-table"><div className="use-act-head"><span>ATO / FONTE</span><span>AUTORIDADE</span><span>VIGÊNCIA</span><span>VAZÃO / REGIME</span><span>VERSÃO</span><span>STATUS</span><span /></div>{acts.map((item) => <button key={item.id} className={item.id === selectedAct.id ? "selected" : ""} onClick={() => setSelectedActId(item.id)}><span className="use-act-icon">§</span><div><small>{item.id} · {item.sourceId}</small><strong>{item.title}</strong><p>{item.source}</p></div><span>{item.authority}</span><time>{item.validFrom}<small>→ {item.validUntil}</small></time><div><b>{item.authorizedFlow || "—"} L/s</b><small>{item.regime}</small></div><code>{item.version}</code><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article><aside className="panel use-act-detail"><header><div><small>{selectedAct.id} · {selectedAct.version}</small><h2>{selectedAct.title}</h2><p>{selectedAct.authority}</p></div><em className={statusClass(selectedAct.status)}>{selectedAct.status}</em></header><div className="use-act-limit"><div><span>VAZÃO AUTORIZADA</span><strong>{selectedAct.authorizedFlow} <em>L/s</em></strong></div><div><span>REGIME</span><strong>{selectedAct.regime}</strong></div></div><section><span>VIGÊNCIA E FONTE</span><p>{selectedAct.validFrom} → {selectedAct.validUntil}</p><small>{selectedAct.source} · identificador {selectedAct.sourceId}</small></section><section className="use-act-links"><span>RELAÇÕES</span>{[["M1", subject.chtId], ["M2", subject.passportId], ["M3", subject.ruleId], ["M5", "SER-DF-004918"]].map((item) => <button key={item[0]} onClick={() => openConsumer(item[0].toLowerCase())}><b>{item[0]}</b><span>{item[1]}</span><i>↗</i></button>)}</section><footer><button onClick={() => onNavigate("Condicionantes")}>Ver condicionantes</button><button onClick={() => onNavigate("Revisões")}>Revisar ato</button></footer></aside></div></div>;

  const Conditions = () => <div className="use-conditions"><header className="use-section-toolbar"><div><h2>Condicionantes e obrigações</h2><p>Agenda sincronizada com M2, evidências M5 e ato de origem</p></div><div className="use-filters">{["Todas", "Regular", "Atenção", "Pendente", "Em atraso", "Concluída"].map((item) => <button key={item} className={conditionFilter === item ? "active" : ""} onClick={() => setConditionFilter(item)}>{item}</button>)}<button className="primary" onClick={() => setEvidenceModalOpen(true)}>＋ Enviar evidência</button></div></header><div className="use-condition-summary"><article><span>REGULARES</span><strong>{conditions.filter((item) => item.status === "Regular" || item.status === "Concluída").length}</strong><small>evidências válidas</small></article><article><span>A VENCER</span><strong>{conditions.filter((item) => item.status === "Atenção" || item.status === "Pendente").length}</strong><small>próximos 30 dias</small></article><article><span>EM ATRASO</span><strong>{conditions.filter((item) => item.status === "Em atraso").length}</strong><small>prioridade alta</small></article><article><span>COBERTURA</span><strong>92%</strong><small>fontes e evidências</small></article></div><article className="panel use-condition-table"><div className="use-condition-head"><span>CONDICIONANTE</span><span>ATO / CATEGORIA</span><span>FREQUÊNCIA</span><span>PRÓXIMO PRAZO</span><span>EVIDÊNCIA</span><span>STATUS</span><span /></div>{filteredConditions.map((item) => <div key={item.id}><span className={`use-condition-icon ${statusClass(item.status)}`}>{item.status === "Regular" || item.status === "Concluída" ? "✓" : "!"}</span><div><small>{item.id}</small><strong>{item.title}</strong></div><div><span>{item.actId}</span><b>{item.category}</b></div><span>{item.frequency}</span><time>{item.nextDue}</time><span>{item.evidence}</span><em className={statusClass(item.status)}>{item.status}</em><div><button onClick={() => openConsumer(item.module)}>Abrir {item.module.toUpperCase()} ↗</button><button disabled={item.status === "Concluída"} onClick={() => setEvidenceModalOpen(true)}>Evidência ＋</button></div></div>)}</article></div>;

  const Monitoring = () => <div className="use-monitoring"><header className="use-section-toolbar"><div><h2>Automonitoramento e reconciliação</h2><p>Autorizado × declarado × medido, com qualidade e proveniência</p></div><div><button onClick={() => openConsumer("m5")}>Abrir série no M5 ↗</button><button className="primary" onClick={reconcileMonitoring} disabled={monitoringReconciled}>{monitoringReconciled ? "✓ Reconciliado" : "Reconciliar lacunas"}</button></div></header><div className="use-monitoring-kpis"><article><span>AUTORIZADO</span><strong>{selectedAct.authorizedFlow} <em>L/s</em></strong><small>ATO-ANA-1142-24</small></article><article><span>MÉDIA MEDIDA</span><strong>{measuredAverage} <em>L/s</em></strong><small>24 janelas · 2 lacunas</small></article><article><span>DECLARADO</span><strong>48,1 <em>L/s</em></strong><small>diferença de 1,8%</small></article><article><span>QUALIDADE</span><strong>{monitoringReconciled ? "98,2" : "88,4"}</strong><small>{monitoringReconciled ? "backfill qualificado" : "2 flags abertas"}</small></article></div><div className="use-monitoring-layout"><article className="panel use-series-panel"><header className="panel-header"><div><h2>Vazão instantânea · últimas 24 janelas</h2><p>L/s · dados sintéticos para demonstração</p></div><div className="use-series-legend"><span><i /> medido</span><span><i /> limite 52</span></div></header><div className="use-series-chart"><div className="use-limit-line"><span>52 L/s</span></div>{monitoringSeries.map((value, index) => <i key={index} className={value === 0 ? "gap" : value > 52 ? "over" : ""} style={{ height: `${value === 0 ? 6 : (value / 60) * 100}%` }}><span>{index % 4 === 0 ? `${String(index).padStart(2, "0")}h` : ""}</span></i>)}</div><footer><span><i className="ok" /> 20 válidas</span><span><i className="warn" /> 2 acima do limite</span><span><i className="gap" /> {monitoringReconciled ? "0 lacunas abertas" : "2 lacunas"}</span><button onClick={() => onToast("Janela comparativa alterada para 30 dias com agregação diária.")}>30 dias ▾</button></footer></article><aside className="panel use-reconciliation"><header className="panel-header"><div><h2>Fila de reconciliação</h2><p>divergências e ações controladas</p></div><span>{monitoringReconciled ? 1 : 3} abertas</span></header>{[["REC-091", "Leituras ausentes", "07 ago · 08h e 14h", monitoringReconciled ? "Resolvida" : "Aberta"], ["REC-088", "Pico acima do limite", "06 ago · 09h · 54 L/s", "Em análise"], ["REC-084", "Declarado × medido", "diferença 1,8%", "Dentro da tolerância"]].map((item) => <button key={item[0]} onClick={() => onToast(`${item[0]}: bruto, flags, justificativa e versão qualificada carregados.`)}><span className={statusClass(item[3])}>{item[3] === "Resolvida" || item[3] === "Dentro da tolerância" ? "✓" : "!"}</span><div><small>{item[0]} · {item[2]}</small><strong>{item[1]}</strong><p>bruto preservado · decisão rastreada</p></div><em>{item[3]}</em><i>→</i></button>)}<section><span>POLÍTICA</span><p>Correções nunca sobrescrevem o bruto. Cada backfill registra origem, método, confiança e versão.</p></section></aside></div></div>;

  const Charging = () => <div className="use-charging"><header className="use-section-toolbar"><div><h2>Reconciliação e memória de cobrança</h2><p>Volumes, mecanismos, coeficientes e divergências — sem emissão financeira</p></div><div><button onClick={() => openConsumer("m3")}>Regra de cobrança M3 ↗</button><button className="primary" onClick={simulateCharge}>▶ Simular período</button></div></header><div className="use-charge-layout"><article className="panel use-charge-memory"><header><div><small>MEMÓRIA SIMULADA · AGO 2026</small><h2>Composição transparente</h2><p>{selectedAct.id} · {selectedDemand.chtId}</p></div><span>SEM EFEITO FINANCEIRO</span></header><div className="use-charge-formula"><div><span>VOLUME DE REFERÊNCIA</span><strong>{chargeSimulated ? "19.420" : "17.400"} <em>m³</em></strong><small>medido qualificado</small></div><b>×</b><div><span>PREÇO UNITÁRIO</span><strong>R$ 0,021</strong><small>mecanismo demonstrativo</small></div><b>×</b><div><span>COEFICIENTE</span><strong>1,00</strong><small>finalidade industrial</small></div></div><div className="use-charge-total"><span>VALOR ESTIMADO</span><strong>R$ {chargeSimulated ? "407,82" : "365,40"}</strong><small>simulação não oficial · validar mecanismo e dados</small></div><section className="use-charge-sources"><span>FONTES DA MEMÓRIA</span>{[["Ato", "vazão e regime autorizados", "M4"], ["Medição", "série qualificada", "M5"], ["Mecanismo", "regra candidata", "M3"], ["Identidade", "finalidade e território", "M1/M2"]].map((item) => <button key={item[0]} onClick={() => onToast(`${item[0]}: fonte, versão e trecho usados no cálculo exibidos.`)}><strong>{item[0]}</strong><span>{item[1]}</span><b>{item[2]} ↗</b></button>)}</section><footer><button onClick={() => onToast("Memória exportada com fórmula, dados, versões e aviso de simulação.")}>⇩ Exportar memória</button><button onClick={() => emitTowerEvent("Divergência de cobrança requer análise", "Médio", "Comparar medido, declarado e mecanismo antes de qualquer constituição financeira.")}>Encaminhar divergência</button></footer></article><article className="panel use-charge-history"><header className="panel-header"><div><h2>Histórico de reconciliação</h2><p>últimos períodos</p></div><span>{charges.filter((item) => item.status === "Divergente").length} divergente</span></header><div className="use-charge-head"><span>PERÍODO</span><span>AUTORIZADO</span><span>MEDIDO</span><span>DECLARADO</span><span>ESTIMADO</span><span>STATUS</span></div>{charges.map((item) => <button key={item.id} onClick={() => onToast(`${item.id}: memória, dados e justificativas carregados.`)}><div><small>{item.id}</small><strong>{item.period}</strong></div><span>{item.authorized} L/s</span><span>{item.measured} L/s</span><span>{item.declared || "—"} L/s</span><b>R$ {item.estimated.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b><em className={statusClass(item.status)}>{item.status}</em></button>)}</article></div></div>;

  const Reviews = () => <div className="use-revisions"><header className="use-section-toolbar"><div><h2>Revisões e gatilhos de mudança</h2><p>Demanda, vigência, regra, identidade, medição e evento crítico</p></div><div><button onClick={startAgent}>✦ Detectar gatilhos</button><button className="primary" onClick={onCreateRecord}>＋ Nova revisão</button></div></header><div className="use-revision-summary"><article><span>DETECTADAS</span><strong>{revisions.filter((item) => item.status === "Detectada").length}</strong><small>aguardam triagem</small></article><article><span>EM ANÁLISE</span><strong>{revisions.filter((item) => item.status === "Em análise").length}</strong><small>impacto em avaliação</small></article><article><span>DECISÃO HUMANA</span><strong>{revisions.filter((item) => item.status === "Aguardando autoridade").length}</strong><small>sem efeito automático</small></article><article><span>CONCLUÍDAS</span><strong>{revisions.filter((item) => item.status === "Concluída").length}</strong><small>versão e consumidores atualizados</small></article></div><article className="panel use-revision-table"><div className="use-revision-head"><span>REVISÃO / GATILHO</span><span>ATO</span><span>IMPACTO</span><span>PRAZO</span><span>STATUS</span><span /></div>{revisions.map((item) => <div key={item.id}><span className={`use-revision-icon ${statusClass(item.status)}`}>{item.status === "Concluída" ? "✓" : "↻"}</span><div><small>{item.id}</small><strong>{item.title}</strong><p>{item.trigger}</p></div><span>{item.actId}</span><span>{item.impact}</span><time>{item.due}</time><em className={statusClass(item.status)}>{item.status}</em><div><button onClick={() => onToast(`${item.id}: snapshot, diferenças, fontes e consumidores carregados.`)}>Abrir diff</button><button disabled={item.status === "Concluída"} onClick={() => startRevision(item)}>Iniciar →</button></div></div>)}</article><div className="use-revision-policy"><span>CONTROLE DE MUDANÇA</span><p>Revisões criam nova versão do dossiê e do ato de referência; nunca reescrevem o documento oficial nem aplicam efeito sem autoridade.</p><button onClick={() => onOpenModule("m11")}>Abrir governança →</button></div></div>;

  const Conflicts = () => <div className="use-conflicts"><header className="use-section-toolbar"><div><h2>Conflitos de uso e conformidade</h2><p>Demanda, ato, disponibilidade, medição, território e competência</p></div><div><button onClick={startAgent}>✦ Recalcular risco</button><button className="primary" onClick={() => emitTowerEvent("Conflitos de uso bloqueantes", "Alto", "Dois conflitos de severidade alta requerem coordenação e decisão humana.")}>Escalar bloqueantes</button></div></header><div className="use-conflict-layout"><article className="panel use-conflict-list"><header className="panel-header"><div><h2>Fila de conflitos</h2><p>{conflicts.filter((item) => item.status !== "Decidido").length} pendentes</p></div></header>{conflicts.map((item) => <button key={item.id} className={item.id === selectedConflict.id ? "selected" : ""} onClick={() => setSelectedConflictId(item.id)}><span className={`use-conflict-score ${statusClass(item.severity)}`}>{item.score}</span><div><small>{item.id} · {item.territory}</small><strong>{item.title}</strong><p>{item.demand} ↔ {item.constraint}</p></div><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article><article className="panel use-conflict-detail"><header><div><small>{selectedConflict.id} · RISCO {selectedConflict.severity.toUpperCase()}</small><h2>{selectedConflict.title}</h2><p>{selectedConflict.territory}</p></div><span>{selectedConflict.score}% materialidade</span></header><div className="use-conflict-compare"><section><span>DEMANDA / OBSERVAÇÃO</span><strong>{selectedConflict.demand}</strong><p>Fonte, período e unidade preservados.</p></section><div>↔</div><section><span>LIMITE / RESTRIÇÃO</span><strong>{selectedConflict.constraint}</strong><p>Ato, regra e autoridade na fonte.</p></section></div><div className="use-conflict-factors">{[["Identidade", "confirmada", "pass"], ["Competência", "indicativa", "pass"], ["Disponibilidade", "moderada", "warn"], ["Medição", "revisar", "warn"], ["Efeito", "decisão humana", "critical"]].map((item) => <div key={item[0]}><span>{item[0]}</span><strong className={item[2]}>{item[1]}</strong></div>)}</div><section className="use-conflict-recommendation"><span>RECOMENDAÇÃO ASSISTIDA</span><p>{selectedConflict.recommendation}</p><small>Alternativas não substituem análise técnica ou decisão da autoridade.</small></section><div className="use-conflict-agent"><span>✦</span><div><strong>Agente de Pré-análise</strong><p>Recuperou 9 evidências, executou 14 regras e comparou 3 alternativas. Nenhuma ação externa foi executada.</p></div><b>89%</b></div><footer><button onClick={() => openConsumer("m6")}>Simular cenários</button><button onClick={() => emitTowerEvent("Conflito de uso em decisão", selectedConflict.severity === "Alta" ? "Alto" : "Médio", selectedConflict.recommendation)}>Criar caso M0</button><button className="primary" disabled={selectedConflict.status === "Decidido"} onClick={() => setConflictModalOpen(true)}>Revisar decisão →</button></footer></article></div></div>;

  const views: Record<string, () => React.ReactNode> = { "Pré-análise": PreAnalysis, "Demandas": Demands, "Atos": Acts, "Condicionantes": Conditions, "Automonitoramento": Monitoring, "Cobrança": Charging, "Revisões": Reviews, "Conflitos": Conflicts };
  const ActiveView = views[contextItem] ?? PreAnalysis;
  const agentSteps = ["Resolver identidade, passaporte e competência", "Recuperar ato, regras e condicionantes", "Comparar demanda, autorização e medição", "Consultar disponibilidade e conflitos", "Gerar checklist, alternativas e limites"];

  return <section className="use-regulation-hub" aria-label={`Regulação de Usos — ${contextItem}`}><div className="use-context-bar"><div><span>RU</span><small>PROCESSO ATIVO</small><strong>{selectedDemand.id} · {selectedDemand.chtId}</strong></div><div><span>⌖</span><small>TERRITÓRIO</small><strong>{territory}</strong></div><div><span>§</span><small>COMPETÊNCIA</small><strong>{subject.authority}</strong></div><div><span>◴</span><small>REFERÊNCIA</small><strong>{clockLabel} BRT · regras 2026.08.3</strong></div><button onClick={startAgent}>✦ Pré-análise Regulatória</button></div><Kpis /><ActiveView />

    {demandModalOpen && <div className="use-modal-backdrop" onMouseDown={() => setDemandModalOpen(false)}><form className="use-demand-modal" onSubmit={createDemand} onMouseDown={(event) => event.stopPropagation()}><header><div><small>NOVA DEMANDA · {subject.chtId}</small><h2>Informar uso pretendido</h2><p>Rascunho local; nenhum protocolo externo será criado.</p></div><button type="button" onClick={() => setDemandModalOpen(false)}>×</button></header><div className="use-modal-grid"><label className="full"><span>INTERFERÊNCIA / UTH</span><input defaultValue={`${subject.chtId} · ${subject.waterAddress}`} /></label><label><span>FINALIDADE</span><select defaultValue="Uso industrial"><option>Uso industrial</option><option>Irrigação</option><option>Abastecimento público</option><option>Dessedentação</option></select></label><label><span>VAZÃO SOLICITADA</span><div><input type="number" defaultValue="36" /><em>L/s</em></div></label><label><span>HORAS POR DIA</span><input type="number" defaultValue="12" /></label><label><span>DIAS POR MÊS</span><input type="number" defaultValue="22" /></label><label className="full"><span>SAZONALIDADE E OBSERVAÇÕES</span><textarea defaultValue="Demanda concentrada entre maio e setembro; avaliar restrição sazonal." /></label></div><section><span>VALIDAÇÃO ASSISTIDA</span><p>identidade · competência · unidade · regime · ato existente · duplicidade · disponibilidade</p></section><footer><button type="button" onClick={() => setDemandModalOpen(false)}>Cancelar</button><button type="submit" className="primary">Criar em triagem →</button></footer></form></div>}

    {decisionModalOpen && <div className="use-modal-backdrop" onMouseDown={() => setDecisionModalOpen(false)}><section className="use-decision-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>DECISÃO HUMANA · {selectedDemand.id}</small><h2>Revisar proposta de encaminhamento</h2><p>Pré-análise não vinculante · autoridade {selectedDemand.authority}</p></div><button onClick={() => setDecisionModalOpen(false)}>×</button></header><div className="use-decision-metrics"><div><span>CONFIANÇA</span><strong>89%</strong></div><div><span>FONTES</span><strong>9</strong></div><div><span>REGRAS</span><strong>14</strong></div><div><span>RESSALVAS</span><strong>3</strong></div></div><section><span>FATOS</span><p>Ato vigente limita 52 L/s; demanda solicita {selectedDemand.requestedFlow} L/s; competência indicativa e identidade são consistentes.</p></section><section className="inference"><span>INFERÊNCIA</span><p>A alternativa de manutenção do limite atual possui menor risco; ampliação exige cenário hídrico e ajuste de regime.</p></section><section className="limit"><span>LIMITE</span><p>O sistema não emite ato. Esta aprovação apenas autoriza o encaminhamento demonstrativo e registra a justificativa.</p></section><label><span>JUSTIFICATIVA DA AUTORIDADE</span><textarea defaultValue="Aprovo o encaminhamento para protocolo, mantendo o limite atual até análise técnica do cenário sazonal e complementação do regime de uso." /></label><footer><button onClick={() => setDecisionModalOpen(false)}>Cancelar</button><button onClick={() => { setDecisionModalOpen(false); onToast("Proposta devolvida para complemento com observações registradas."); }}>Devolver para ajustes</button><button className="primary" onClick={approveProposal}>✓ Aprovar encaminhamento</button></footer></section></div>}

    {evidenceModalOpen && <div className="use-modal-backdrop" onMouseDown={() => setEvidenceModalOpen(false)}><section className="use-evidence-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>EVIDÊNCIA DE CONDICIONANTE</small><h2>Registrar cumprimento</h2><p>Bruto, metadados, integridade e vínculo ao ato serão preservados.</p></div><button onClick={() => setEvidenceModalOpen(false)}>×</button></header><div className="use-modal-grid"><label className="full"><span>CONDICIONANTE</span><select defaultValue="CND-1142-02"><option>CND-1142-02 · Leitura mensal</option><option>CND-1142-04 · Reconciliar lacunas</option><option>CND-1142-01 · Autodeclaração</option></select></label><label><span>TIPO DE EVIDÊNCIA</span><select defaultValue="Série + documento"><option>Série + documento</option><option>Documento assinado</option><option>Foto georreferenciada</option></select></label><label><span>DATA DE REFERÊNCIA</span><input type="date" defaultValue="2026-08-10" /></label><label className="full use-drop"><span>ARQUIVO OU SERVIÇO</span><strong>Solte a evidência ou selecione uma série do M5</strong><small>hash, assinatura, unidade, período e geometria serão validados</small></label><label className="full"><span>JUSTIFICATIVA</span><textarea defaultValue="Dados conferidos pelo responsável técnico; duas lacunas serão tratadas por backfill versionado." /></label></div><footer><button onClick={() => setEvidenceModalOpen(false)}>Cancelar</button><button className="primary" onClick={submitConditionEvidence}>Registrar e validar →</button></footer></section></div>}

    {conflictModalOpen && <div className="use-modal-backdrop" onMouseDown={() => setConflictModalOpen(false)}><section className="use-conflict-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>DECISÃO HUMANA · {selectedConflict.id}</small><h2>Selecionar tratamento do conflito</h2><p>Alternativa, fundamento, monitoramento e prazo serão registrados.</p></div><button onClick={() => setConflictModalOpen(false)}>×</button></header><div className="use-conflict-options"><label><input type="radio" name="option" defaultChecked /><span><strong>Manter limite vigente e complementar análise</strong><small>Sem alteração de ato; simular regime sazonal no M6.</small></span></label><label><input type="radio" name="option" /><span><strong>Admitir encaminhamento com condicionantes</strong><small>Exige motivação técnica e plano de monitoramento.</small></span></label><label><input type="radio" name="option" /><span><strong>Suspender análise e abrir diligência</strong><small>Coletar nova evidência ou resolver identidade/competência.</small></span></label></div><label className="use-conflict-justification"><span>JUSTIFICATIVA</span><textarea defaultValue="Manter o limite vigente e solicitar simulação de disponibilidade sazonal. Nova decisão após a complementação técnica." /></label><section><span>EFEITOS CONTROLADOS</span><p>criar revisão · atualizar agenda M2 · simular M6 · monitorar M5 · registrar caso M0</p></section><footer><button onClick={() => setConflictModalOpen(false)}>Cancelar</button><button className="primary" onClick={decideConflict}>✓ Decidir e monitorar</button></footer></section></div>}

    {agentOpen && <div className="use-agent-backdrop" onMouseDown={() => setAgentOpen(false)}><aside className="use-agent-drawer" onMouseDown={(event) => event.stopPropagation()}><header><div className="use-agent-avatar">✦</div><div><small>{agentRunning ? "EXECUÇÃO AO VIVO" : "PRÉ-ANÁLISE CONCLUÍDA"}</small><h2>Pré-análise Regulatória</h2><p>Trace M4-A04-{selectedDemand.id.slice(-4)} · política RUS-HIL-004</p></div><button onClick={() => setAgentOpen(false)}>×</button></header><div className="use-agent-scopes"><span>ESCOPOS</span><b>Consultar</b><b>Comparar</b><b>Simular</b><b>Redigir</b><b className="blocked">Outorgar ✕</b></div><section className="use-agent-plan"><h3>Plano de execução</h3>{agentSteps.map((item, index) => <div key={item} className={index < agentStep ? "done" : index === agentStep ? "running" : "waiting"}><span>{index < agentStep ? "✓" : index === agentStep ? "●" : "○"}</span><div><strong>{item}</strong><small>{index < agentStep ? `${480 + index * 192} ms · evidência registrada` : index === agentStep ? "executando ferramentas autorizadas…" : "aguardando dependência"}</small></div></div>)}</section><section className="use-agent-tools"><h3>Ferramentas e grounding</h3>{[["M1/M2", "identidade, representação e evidências", "94%"], ["M3", "competência e 14 regras aplicadas", "97%"], ["M5", "24 janelas e 2 flags", "88%"], ["M6", "3 cenários de disponibilidade", "84%"]].map((item) => <button key={item[0]}><span>▤</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div><b>{item[2]}</b></button>)}</section><section className="use-agent-output"><div><h3>Saída estruturada</h3><span>89% confiança</span></div><p><b>Fato:</b> demanda de {selectedDemand.requestedFlow} L/s supera em {selectedDemand.requestedFlow - selectedAct.authorizedFlow} L/s o ato vigente.</p><p><b>Alternativa:</b> manter 52 L/s ou avaliar 68 L/s com restrição sazonal.</p><p><b>Pendência:</b> regime mensal e cenário de disponibilidade devem ser complementados.</p><p><b>Limite:</b> proposta sem efeito vinculante; decisão e protocolo pertencem à autoridade.</p></section><footer><button onClick={() => { setAgentRunning(false); onToast("Agente pausado; nenhuma ação externa foi produzida."); }}>■ Pausar</button><button onClick={() => openConsumer("m12")}>Central de Agentes</button><button className="primary" onClick={() => { setAgentOpen(false); setDecisionModalOpen(true); }}>Revisar proposta →</button></footer></aside></div>}
  </section>;
}
