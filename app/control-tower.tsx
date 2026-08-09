"use client";

import { useMemo, useState } from "react";

type TowerEvent = {
  title: string;
  detail: string;
  source: string;
  agent: string;
  status: string;
};

type TowerAlert = {
  id: string;
  title: string;
  severity: "Crítico" | "Alto" | "Médio" | "Baixo";
  source: string;
  module: string;
  moduleName: string;
  territory: string;
  occurredAt: string;
  confidence: number;
  status: "Novo" | "Reconhecido" | "Em tratamento" | "Escalado" | "Resolvido";
  owner: string;
  sla: string;
  chtId: string;
  recommendation: string;
  evidence: string[];
};

type TowerCase = {
  id: string;
  title: string;
  type: string;
  module: string;
  territory: string;
  status: "Triagem" | "Investigação" | "Decisão" | "Monitoramento" | "Concluído";
  owner: string;
  sla: string;
  progress: number;
  sourceAlert?: string;
  correlationId: string;
};

type TowerDecision = {
  id: string;
  title: string;
  caseId: string;
  module: string;
  risk: "Crítico" | "Alto" | "Moderado";
  authority: string;
  due: string;
  confidence: number;
  sources: number;
  proposal: string;
  caveat: string;
  status: "Pendente" | "Aprovada" | "Devolvida" | "Rejeitada";
};

type Integration = {
  id: string;
  name: string;
  owner: string;
  mode: string;
  consumers: string[];
  freshness: string;
  quality: number;
  status: "Operacional" | "Atenção" | "Parcial";
  contract: string;
};

type ControlTowerProps = {
  contextItem: string;
  territory: string;
  clockLabel: string;
  currentEvent: TowerEvent;
  journeyStep: number;
  running: boolean;
  onNavigate: (item: string) => void;
  onOpenModule: (moduleId: string) => void;
  onStartJourney: (journeyId: string) => void;
  onOpenAgent: () => void;
  onCreateRecord: () => void;
  onToast: (message: string) => void;
};

const initialAlerts: TowerAlert[] = [
  {
    id: "ALT-2026-0972",
    title: "Vazão abaixo do P10 por três janelas",
    severity: "Crítico",
    source: "Hidroweb · estação 45260000",
    module: "m9",
    moduleName: "Eventos Críticos",
    territory: "São Francisco Norte",
    occurredAt: "14:29:08",
    confidence: 97,
    status: "Novo",
    owner: "Sala ANA",
    sla: "00h 08m",
    chtId: "EST-45260000",
    recommendation: "Qualificar persistência, calcular exposição e ativar protocolo interno de seca.",
    evidence: ["3 leituras consistentes", "sensor com saúde 98%", "2 estações vizinhas confirmam tendência"],
  },
  {
    id: "ALT-2026-0968",
    title: "Expansão irrigada sem vínculo conhecido",
    severity: "Alto",
    source: "Sentinel-2 · Living Atlas",
    module: "m7",
    moduleName: "GeoFiscalização",
    territory: "Oeste da Bahia · UGRH 07",
    occurredAt: "14:24:41",
    confidence: 88,
    status: "Reconhecido",
    owner: "COCAM",
    sla: "00h 28m",
    chtId: "UTH-BA-018407",
    recommendation: "Correlacionar atos e medições; submeter prioridade de vistoria ao supervisor.",
    evidence: ["mudança espectral em 18,4 ha", "série de 4 cenas", "nenhum ato vinculado à geometria"],
  },
  {
    id: "ALT-2026-0962",
    title: "Anomalia de nível com sensor divergente",
    severity: "Médio",
    source: "Telemetria ANA",
    module: "m5",
    moduleName: "Data Hub",
    territory: "Alto Paranaíba",
    occurredAt: "14:17:12",
    confidence: 82,
    status: "Em tratamento",
    owner: "COHID",
    sla: "02h 14m",
    chtId: "EST-60435000",
    recommendation: "Manter leitura preliminar e abrir verificação do equipamento sem alterar o dado bruto.",
    evidence: ["desvio 3,2σ", "vizinhança não confirma", "telemetria sem perda de pacote"],
  },
  {
    id: "ALT-2026-0957",
    title: "Condicionante vence em cinco dias",
    severity: "Médio",
    source: "Águas Brasil · CNARH",
    module: "m4",
    moduleName: "Regulação de Usos",
    territory: "Distrito Federal",
    occurredAt: "13:58:03",
    confidence: 100,
    status: "Novo",
    owner: "COOUT",
    sla: "05h 42m",
    chtId: "UTH-DF-004918",
    recommendation: "Notificar o usuário e preparar revisão das medições vinculadas à condicionante.",
    evidence: ["ato ANA 1142/2024", "prazo calculado pela vigência", "contato regulado validado"],
  },
  {
    id: "ALT-2026-0948",
    title: "Contrato estadual excedeu SLA de ingestão",
    severity: "Alto",
    source: "Observabilidade de integração",
    module: "m11",
    moduleName: "Governança Federativa",
    territory: "Piloto BA",
    occurredAt: "13:41:30",
    confidence: 100,
    status: "Escalado",
    owner: "STI / OGERH",
    sla: "00h 51m",
    chtId: "CON-DATA-BA-014",
    recommendation: "Acionar responsável técnico, preservar último snapshot válido e registrar modo parcial.",
    evidence: ["último lote há 16 min", "SLA contratado de 5 min", "fallback local disponível"],
  },
];

const initialCases: TowerCase[] = [
  { id: "EC-2026-0048", title: "Vazão crítica · São Francisco Norte", type: "Incidente", module: "m9", territory: "São Francisco Norte", status: "Decisão", owner: "Sala ANA", sla: "00h 08m", progress: 68, sourceAlert: "ALT-2026-0972", correlationId: "cht-j3-9f2d" },
  { id: "GF-2026-0917", title: "Expansão irrigada · Oeste da Bahia", type: "Fiscalização", module: "m7", territory: "Oeste da Bahia", status: "Investigação", owner: "COCAM", sla: "00h 28m", progress: 47, sourceAlert: "ALT-2026-0968", correlationId: "cht-j2-9f2d" },
  { id: "CHT-2026-1842", title: "Ampliação de captação · Alto Paranaíba", type: "Regulação", module: "m4", territory: "Alto Paranaíba", status: "Decisão", owner: "COOUT", sla: "01h 42m", progress: 74, correlationId: "cht-j1-9f2d" },
  { id: "QD-2026-0621", title: "Série inconsistente · estação 60435000", type: "Dados", module: "m5", territory: "Alto Paranaíba", status: "Monitoramento", owner: "COHID", sla: "05h 14m", progress: 82, sourceAlert: "ALT-2026-0962", correlationId: "cht-m5-4c81" },
];

const initialDecisions: TowerDecision[] = [
  { id: "DEC-2026-0318", title: "Escolher cenário operativo de seca", caseId: "EC-2026-0048", module: "m9", risk: "Crítico", authority: "Comandante do incidente", due: "8 min", confidence: 92, sources: 7, proposal: "Executar cenário B: redução gradual e reforço de monitoramento por 72 horas.", caveat: "Boletim e medida operativa exigem aprovação formal da autoridade.", status: "Pendente" },
  { id: "DEC-2026-0316", title: "Validar ordem de vistoria", caseId: "GF-2026-0917", module: "m7", risk: "Alto", authority: "Supervisor de fiscalização", due: "28 min", confidence: 88, sources: 5, proposal: "Priorizar vistoria em campo e coletar evidências georreferenciadas conforme checklist.", caveat: "A detecção é apenas indício; o agente não conclui infração nem aplica sanção.", status: "Pendente" },
  { id: "DEC-2026-0312", title: "Aprovar encaminhamento de pré-análise", caseId: "CHT-2026-1842", module: "m4", risk: "Moderado", authority: "Analista COOUT", due: "1h 42", confidence: 91, sources: 4, proposal: "Encaminhar o dossiê ao processo oficial com exigência de série complementar de 30 dias.", caveat: "Pré-análise sem efeito vinculante; decisão permanece no sistema transacional competente.", status: "Pendente" },
  { id: "DEC-2026-0304", title: "Manter estação em modo preliminar", caseId: "QD-2026-0621", module: "m5", risk: "Moderado", authority: "Curador da série", due: "5h 14", confidence: 82, sources: 3, proposal: "Manter flag preliminar até inspeção do sensor e preservar a observação bruta.", caveat: "Correções futuras devem gerar nova versão e reprocessamento dependente.", status: "Pendente" },
];

const integrations: Integration[] = [
  { id: "INT-AB-01", name: "Águas Brasil / CNARH", owner: "SRE", mode: "API + evento", consumers: ["M0", "M1", "M2", "M4", "M7"], freshness: "18 s", quality: 98, status: "Operacional", contract: "REG-USOS-4.2" },
  { id: "INT-HW-02", name: "Hidroweb / Telemetria", owner: "SGH", mode: "API + stream", consumers: ["M0", "M5", "M6", "M9", "M10"], freshness: "42 s", quality: 96, status: "Operacional", contract: "MON-RHN-3.8" },
  { id: "INT-SN-03", name: "SNIRH / BHO6", owner: "SHE", mode: "Feature / Map", consumers: ["M0", "M1", "M3", "M6"], freshness: "v2026.07", quality: 97, status: "Operacional", contract: "GEO-BHO-6.1" },
  { id: "INT-LA-04", name: "ArcGIS Living Atlas", owner: "Esri", mode: "Tile + Imagery", consumers: ["M0", "M5", "M7", "M10"], freshness: "1,2 s", quality: 94, status: "Operacional", contract: "GEO-PUBLIC-2.0" },
  { id: "INT-SAR-05", name: "SAR / Monitor de Secas", owner: "SOE", mode: "API + serviço", consumers: ["M0", "M6", "M9"], freshness: "6 min", quality: 93, status: "Atenção", contract: "OPE-CRISE-3.1" },
  { id: "INT-BA-06", name: "OGERH Bahia · piloto", owner: "INEMA", mode: "OGC + lote", consumers: ["M0", "M1", "M4", "M11"], freshness: "16 min", quality: 86, status: "Parcial", contract: "FED-BA-014" },
  { id: "INT-RQ-07", name: "RNQA / Laboratórios", owner: "SGH", mode: "API + arquivo", consumers: ["M0", "M5", "M10"], freshness: "3 h", quality: 91, status: "Operacional", contract: "QUAL-RNQA-2.7" },
  { id: "INT-EV-08", name: "Event Bus CHT", owner: "STI", mode: "SSE + eventos", consumers: ["M0", "M1–M12"], freshness: "210 ms", quality: 99, status: "Operacional", contract: "EVT-CORE-1.9" },
];

const moduleConnections = [
  ["m1", "M1", "Identidade", "12,84 mi", "99,98%"],
  ["m2", "M2", "Passaportes", "4,21 mi", "99,94%"],
  ["m3", "M3", "Regras", "1.842", "99,99%"],
  ["m4", "M4", "Regulação", "3.462", "99,92%"],
  ["m5", "M5", "Monitoramento", "18.742", "99,81%"],
  ["m6", "M6", "Modelos", "24 jobs", "99,73%"],
  ["m7", "M7", "Fiscalização", "317 casos", "99,90%"],
  ["m8", "M8", "Planejamento", "428 ações", "99,95%"],
  ["m9", "M9", "Eventos", "3 ativos", "99,99%"],
  ["m10", "M10", "Qualidade", "6.812 trechos", "99,87%"],
  ["m11", "M11", "Governança", "11 entes", "99,91%"],
  ["m12", "M12", "Agentes", "9 execuções", "99,88%"],
];

const severityClass = (severity: string) => severity.toLowerCase().replace("í", "i");

export function ControlTowerModule({
  contextItem,
  territory,
  clockLabel,
  currentEvent,
  journeyStep,
  running,
  onNavigate,
  onOpenModule,
  onStartJourney,
  onOpenAgent,
  onCreateRecord,
  onToast,
}: ControlTowerProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [cases, setCases] = useState(initialCases);
  const [decisions, setDecisions] = useState(initialDecisions);
  const [selectedAlertId, setSelectedAlertId] = useState(initialAlerts[0].id);
  const [alertFilter, setAlertFilter] = useState("Todos");
  const [caseView, setCaseView] = useState<"fluxo" | "lista">("fluxo");
  const [reviewingDecision, setReviewingDecision] = useState<TowerDecision | null>(null);
  const [decisionNote, setDecisionNote] = useState("Concordo com a proposta, considerando as fontes, a competência e os limites registrados.");
  const [briefingValidated, setBriefingValidated] = useState(false);
  const [briefingText, setBriefingText] = useState(
    "O quadro nacional opera em condição de atenção. O principal evento é a redução persistente de vazão no São Francisco Norte, com exposição potencial de 37 UTHs. A fila regulatória permanece dentro do SLA, enquanto o contrato federativo da Bahia opera em modo parcial com fallback ativo.",
  );

  const selectedAlert = alerts.find((alert) => alert.id === selectedAlertId) ?? alerts[0];
  const filteredAlerts = useMemo(() => {
    if (alertFilter === "Todos") return alerts;
    if (alertFilter === "Não tratados") return alerts.filter((alert) => alert.status === "Novo");
    if (alertFilter === "Críticos") return alerts.filter((alert) => alert.severity === "Crítico" || alert.severity === "Alto");
    return alerts.filter((alert) => alert.status === alertFilter);
  }, [alerts, alertFilter]);

  const openAlerts = alerts.filter((alert) => alert.status !== "Resolvido").length;
  const criticalAlerts = alerts.filter((alert) => alert.severity === "Crítico" || alert.severity === "Alto").length;
  const pendingDecisions = decisions.filter((decision) => decision.status === "Pendente").length;
  const averageQuality = Math.round(integrations.reduce((sum, item) => sum + item.quality, 0) / integrations.length);

  const updateAlert = (id: string, patch: Partial<TowerAlert>, message: string) => {
    setAlerts((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
    onToast(message);
  };

  const createCaseFromAlert = (alert: TowerAlert) => {
    const existing = cases.find((item) => item.sourceAlert === alert.id);
    if (existing) {
      onNavigate("Casos");
      onToast(`${existing.id} já está vinculado ao alerta e foi aberto no quadro de casos.`);
      return;
    }
    const newCase: TowerCase = {
      id: `TC-2026-${String(1850 + cases.length).padStart(4, "0")}`,
      title: alert.title,
      type: alert.moduleName,
      module: alert.module,
      territory: alert.territory,
      status: "Triagem",
      owner: alert.owner,
      sla: alert.sla,
      progress: 12,
      sourceAlert: alert.id,
      correlationId: `cht-${alert.id.toLowerCase()}-${Date.now().toString(16).slice(-4)}`,
    };
    setCases((items) => [newCase, ...items]);
    setAlerts((items) => items.map((item) => item.id === alert.id ? { ...item, status: "Em tratamento" } : item));
    onNavigate("Casos");
    onToast(`${newCase.id} criado com território, evidências, SLA e correlationId preservados.`);
  };

  const advanceCase = (caseItem: TowerCase) => {
    const stages: TowerCase["status"][] = ["Triagem", "Investigação", "Decisão", "Monitoramento", "Concluído"];
    const nextIndex = Math.min(stages.indexOf(caseItem.status) + 1, stages.length - 1);
    setCases((items) => items.map((item) => item.id === caseItem.id ? { ...item, status: stages[nextIndex], progress: Math.min(item.progress + 22, 100) } : item));
    onToast(`${caseItem.id} avançou para ${stages[nextIndex]}; histórico e responsáveis foram atualizados.`);
  };

  const resolveDecision = (status: TowerDecision["status"]) => {
    if (!reviewingDecision) return;
    setDecisions((items) => items.map((item) => item.id === reviewingDecision.id ? { ...item, status } : item));
    if (status === "Aprovada") {
      setCases((items) => items.map((item) => item.id === reviewingDecision.caseId ? { ...item, status: "Monitoramento", progress: Math.max(item.progress, 84) } : item));
    }
    onToast(`${status} registrada para ${reviewingDecision.id}, com justificativa e trilha imutável.`);
    setReviewingDecision(null);
  };

  const exportBriefing = () => {
    const content = [
      "CHT BRASIL · BRIEFING EXECUTIVO",
      `Contexto: ${territory}`,
      `Gerado em: ${clockLabel} BRT`,
      `Situação: ${openAlerts} alertas abertos · ${pendingDecisions} decisões pendentes`,
      "",
      briefingText,
      "",
      "Fontes: Hidroweb/Telemetria; Águas Brasil/CNARH; SNIRH/BHO6; Event Bus CHT.",
      "Documento demonstrativo, sem efeito oficial.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "CHT_Brasil_Briefing_Executivo.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    onToast("Briefing exportado com contexto, fontes, confiança e carimbo temporal.");
  };

  const Overview = () => (
    <div className="tower-overview-grid">
      <article className="panel tower-orchestration">
        <header className="panel-header"><div><h2>Arquitetura operacional conectada</h2><p>Fonte autoritativa → Context Bus → processo especialista → decisão</p></div><span className="tower-live-tag"><i /> {running ? "LIVE" : "PAUSADO"}</span></header>
        <div className="tower-flow">
          <div className="tower-flow-column sources"><small>FONTES AUTORITATIVAS</small>{["Águas Brasil", "Hidroweb", "SNIRH / BHO6", "Living Atlas", "Estados / DF"].map((item) => <button key={item} onClick={() => onToast(`${item}: contrato, autoridade, frescor e qualidade exibidos.`)}><i />{item}<span>→</span></button>)}</div>
          <div className="tower-core"><span>EVENT BUS</span><strong>CHT<br/>CONTEXT<br/>BUS</strong><small>chtId · território · tempo<br/>fonte · confiança · versão</small><div><b>{running ? "210 ms" : "replay"}</b> latência</div></div>
          <div className="tower-flow-column consumers"><small>CONSUMIDORES</small>{["Alertas & Casos", "Agentes & Modelos", "Workflows", "Decisões humanas", "Passaportes & Reports"].map((item) => <button key={item} onClick={() => onToast(`${item}: consumidores sincronizados pelo mesmo correlationId.`)}><span>→</span>{item}<i /></button>)}</div>
        </div>
        <footer><span><i className="ok" /> 8 contratos conectados</span><span><i className="warn" /> 1 em modo parcial</span><button onClick={() => onNavigate("Desempenho")}>Ver observabilidade →</button></footer>
      </article>

      <article className="panel tower-now">
        <header className="panel-header"><div><h2>Agora na operação</h2><p>Evento correlacionado em todos os painéis</p></div><span className="tower-clock">{clockLabel}</span></header>
        <div className="tower-event-spotlight"><span className={`tower-event-status ${currentEvent.status}`}>EVENTO {journeyStep + 1}</span><h3>{currentEvent.title}</h3><p>{currentEvent.detail}</p><div><span>FONTE</span><strong>{currentEvent.source}</strong></div><div><span>AGENTE</span><strong>{currentEvent.agent}</strong></div></div>
        <div className="tower-now-actions"><button onClick={onOpenAgent}>✦ Ver trace do agente</button><button onClick={() => onNavigate("Alertas")}>Abrir central →</button></div>
      </article>

      <article className="panel tower-module-network">
        <header className="panel-header"><div><h2>Produtos conectados</h2><p>M1–M12 · disponibilidade e carga operacional</p></div><span className="tower-count">12/12</span></header>
        <div className="tower-module-grid">{moduleConnections.map(([id, code, name, volume, availability]) => <button key={id} onClick={() => onOpenModule(id)}><span>{code}</span><div><strong>{name}</strong><small>{volume}</small></div><b>{availability}</b></button>)}</div>
      </article>

      <article className="panel tower-command-summary">
        <header className="panel-header"><div><h2>Comando e resposta</h2><p>Itens que exigem coordenação</p></div></header>
        <div className="tower-summary-stat"><span>ALERTAS ABERTOS</span><strong>{openAlerts}</strong><small>{criticalAlerts} de alta prioridade</small><button onClick={() => onNavigate("Alertas")}>Tratar →</button></div>
        <div className="tower-summary-stat"><span>CASOS ATIVOS</span><strong>{cases.filter((item) => item.status !== "Concluído").length}</strong><small>3 módulos especialistas</small><button onClick={() => onNavigate("Casos")}>Acompanhar →</button></div>
        <div className="tower-summary-stat"><span>DECISÕES PENDENTES</span><strong>{pendingDecisions}</strong><small>1 próxima do SLA</small><button onClick={() => onNavigate("Agenda de decisões")}>Revisar →</button></div>
      </article>
    </div>
  );

  const MapOperations = () => (
    <div className="tower-map-context">
      <article className="panel tower-map-filters">
        <header className="panel-header"><div><h2>Composição do mapa operacional</h2><p>Camadas, fontes e ações compartilham a mesma seleção</p></div><span className="tower-context-chip">{territory}</span></header>
        <div className="tower-layer-matrix">
          {[
            ["ANA · Hidrografia/BHO", "MapServer", "SHE", "Operacional", "M1 · M3 · M6"],
            ["Living Atlas · Hydro", "TileLayer", "Esri", "Operacional", "M0 · M5 · M7"],
            ["UTHs e objetos CHT", "FeatureLayer", "STI", "Operacional", "M1 · M2 · M4"],
            ["Criticidade e cenários", "GraphicsLayer", "GeoAnalytics", "Simulado", "M6 · M9 · M10"],
          ].map((row, index) => <button key={row[0]} onClick={() => onToast(`${row[0]} selecionada; tabela, gráfico e workflow receberam o mesmo filtro.`)}><i className={`tower-layer-line l${index}`} /><div><strong>{row[0]}</strong><small>{row[1]} · custodiante {row[2]}</small></div><span>{row[3]}</span><b>{row[4]}</b></button>)}
        </div>
      </article>
      <article className="panel tower-map-actions">
        <header className="panel-header"><div><h2>Ações territoriais</h2><p>Handoffs preservam o CHTContext</p></div></header>
        <div>{[
          ["Investigar ocorrência", "Cria caso com geometria, tempo e evidências", "Alertas"],
          ["Executar pré-análise", "Abre M4 com UTH e regras resolvidas", "m4"],
          ["Gerar cenário", "Abre M6 com extensão e horizonte", "m6"],
          ["Planejar vistoria", "Abre M7 com rota e checklist", "m7"],
        ].map((item) => <button key={item[0]} onClick={() => item[2].startsWith("m") ? onOpenModule(item[2]) : onNavigate(item[2])}><span>⌖</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div><b>→</b></button>)}</div>
      </article>
      <div className="tower-map-callout"><span>MAPA ARCGIS ATIVO ABAIXO</span><strong>A seleção geográfica controla alertas, casos, agentes, gráficos e decisões.</strong><p>O mapa usa serviços ANA/SNIRH, Living Atlas e camadas sintéticas de fallback.</p></div>
    </div>
  );

  const Alerts = () => (
    <div className="tower-alerts-layout">
      <article className="panel tower-alert-queue">
        <header className="panel-header"><div><h2>Central de alertas</h2><p>Priorização por impacto, confiança, persistência e SLA</p></div><div className="tower-filter-tabs">{["Todos", "Críticos", "Não tratados", "Escalado"].map((filter) => <button key={filter} className={alertFilter === filter ? "active" : ""} onClick={() => setAlertFilter(filter)}>{filter}{filter === "Todos" && <b>{alerts.length}</b>}</button>)}</div></header>
        <div className="tower-alert-table-header"><span>SEVERIDADE / ALERTA</span><span>ORIGEM</span><span>STATUS</span><span>SLA</span></div>
        <div className="tower-alert-list">{filteredAlerts.map((alert) => <button key={alert.id} className={selectedAlert.id === alert.id ? "selected" : ""} onClick={() => setSelectedAlertId(alert.id)}><span className={`tower-severity ${severityClass(alert.severity)}`}>{alert.severity === "Crítico" ? "!" : alert.severity === "Alto" ? "↑" : "◇"}</span><div className="tower-alert-title"><small>{alert.id} · {alert.chtId}</small><strong>{alert.title}</strong><span>{alert.territory} · confiança {alert.confidence}%</span></div><div className="tower-alert-source"><strong>{alert.moduleName}</strong><small>{alert.source}</small></div><span className={`tower-state ${alert.status.toLowerCase().replace(" ", "-")}`}><i />{alert.status}</span><time className={alert.severity === "Crítico" ? "critical" : ""}>{alert.sla}</time></button>)}</div>
      </article>
      <aside className="panel tower-alert-detail">
        <header><div><span className={`tower-severity ${severityClass(selectedAlert.severity)}`}>!</span><div><small>{selectedAlert.id}</small><h2>{selectedAlert.title}</h2></div></div><button onClick={() => onOpenModule(selectedAlert.module)}>Abrir {selectedAlert.module.toUpperCase()} ↗</button></header>
        <div className="tower-detail-meta"><div><span>STATUS</span><strong>{selectedAlert.status}</strong></div><div><span>CONFIANÇA</span><strong>{selectedAlert.confidence}%</strong></div><div><span>SLA</span><strong>{selectedAlert.sla}</strong></div><div><span>RESPONSÁVEL</span><strong>{selectedAlert.owner}</strong></div></div>
        <section><h3>Contexto territorial</h3><p><b>{selectedAlert.chtId}</b> · {selectedAlert.territory}</p><p>Fonte: {selectedAlert.source} · {selectedAlert.occurredAt} BRT</p></section>
        <section><h3>Evidências correlacionadas</h3>{selectedAlert.evidence.map((item) => <p key={item} className="tower-evidence"><span>✓</span>{item}</p>)}</section>
        <section className="tower-recommendation"><h3>Recomendação assistida</h3><p>{selectedAlert.recommendation}</p><small>O agente não executa decisão de mérito.</small></section>
        <div className="tower-alert-actions"><button onClick={() => updateAlert(selectedAlert.id, { status: "Reconhecido", owner: "Marina Alves" }, `${selectedAlert.id} reconhecido e atribuído a Marina Alves.`)}>✓ Reconhecer</button><button onClick={() => updateAlert(selectedAlert.id, { status: "Escalado" }, `${selectedAlert.id} escalado para coordenação com justificativa.`)}>↑ Escalar</button><button className="primary" onClick={() => createCaseFromAlert(selectedAlert)}>＋ Criar/vincular caso</button></div>
      </aside>
    </div>
  );

  const Cases = () => {
    const stages: TowerCase["status"][] = ["Triagem", "Investigação", "Decisão", "Monitoramento", "Concluído"];
    return (
      <div className="tower-cases">
        <header className="tower-section-toolbar"><div><h2>Gestão ponta a ponta de casos</h2><p>Alerta → triagem → investigação → decisão → monitoramento → resultado</p></div><div><button className={caseView === "fluxo" ? "active" : ""} onClick={() => setCaseView("fluxo")}>▥ Fluxo</button><button className={caseView === "lista" ? "active" : ""} onClick={() => setCaseView("lista")}>☷ Lista</button><button className="primary" onClick={onCreateRecord}>＋ Novo caso</button></div></header>
        {caseView === "fluxo" ? <div className="tower-kanban">{stages.map((stage) => <section key={stage}><header><span>{stage}</span><b>{cases.filter((item) => item.status === stage).length}</b></header><div>{cases.filter((item) => item.status === stage).map((caseItem) => <article key={caseItem.id}><small>{caseItem.id} · {caseItem.type}</small><h3>{caseItem.title}</h3><p>⌖ {caseItem.territory}</p><div className="tower-case-owner"><span>{caseItem.owner.slice(0, 2)}</span><strong>{caseItem.owner}</strong><time>{caseItem.sla}</time></div><div className="tower-case-progress"><i style={{ width: `${caseItem.progress}%` }} /></div><footer><button onClick={() => onOpenModule(caseItem.module)}>Abrir módulo ↗</button><button onClick={() => advanceCase(caseItem)}>{stage === "Concluído" ? "Ver resultado" : "Avançar →"}</button></footer></article>)}</div></section>)}</div> : <div className="panel tower-case-list">{cases.map((caseItem) => <button key={caseItem.id} onClick={() => onOpenModule(caseItem.module)}><span>{caseItem.id}</span><div><strong>{caseItem.title}</strong><small>{caseItem.correlationId} · {caseItem.territory}</small></div><b>{caseItem.status}</b><time>{caseItem.sla}</time><i>→</i></button>)}</div>}
        <div className="tower-cross-module-note"><span>CONEXÃO ATIVA</span><p>Cada avanço emite `case.state.changed`; M0 atualiza a fila e o módulo especialista recebe o mesmo caso, CHT-ID, território, responsável, SLA e histórico.</p><button onClick={onOpenAgent}>Ver orquestrador →</button></div>
      </div>
    );
  };

  const Decisions = () => (
    <div className="tower-decisions">
      <div className="tower-decision-summary"><article><span>PENDENTES</span><strong>{pendingDecisions}</strong><small>1 próxima do SLA</small></article><article><span>VALIDADAS HOJE</span><strong>{184 + journeyStep}</strong><small>87% dentro do prazo</small></article><article><span>DEVOLVIDAS</span><strong>{decisions.filter((item) => item.status === "Devolvida").length}</strong><small>com justificativa</small></article><article><span>TEMPO MEDIANO</span><strong>18 min</strong><small>↓ 4 min no ciclo</small></article></div>
      <article className="panel tower-decision-queue"><header className="panel-header"><div><h2>Agenda de decisões humanas</h2><p>Fatos, inferências e recomendações permanecem separados</p></div><button onClick={() => onToast("Agenda ordenada por risco, impacto, SLA e autoridade competente.")}>Ordenar: risco + SLA⌄</button></header><div className="tower-decision-list">{decisions.map((decision) => <button key={decision.id} className={decision.status !== "Pendente" ? "resolved" : ""} onClick={() => setReviewingDecision(decision)}><span className={`tower-decision-risk ${decision.risk.toLowerCase()}`}>{decision.risk === "Crítico" ? "!" : decision.risk === "Alto" ? "↑" : "◇"}</span><div><small>{decision.id} · {decision.caseId}</small><strong>{decision.title}</strong><span>{decision.authority} · {decision.sources} fontes · confiança {decision.confidence}%</span></div><b>{decision.status}</b><time>{decision.due}</time><i>→</i></button>)}</div></article>
      <article className="panel tower-authority-matrix"><header className="panel-header"><div><h2>Matriz de autoridade e guardrails</h2><p>Quem recomenda, quem aprova e o que nunca é automatizado</p></div></header><div>{[
        ["Outorga e condicionante", "A03 Pré-análise", "Autoridade outorgante", "Sem decisão vinculante"],
        ["Ordem de vistoria", "A07 GeoFiscalização", "Supervisor SFI", "Sem sanção automática"],
        ["Cenário operativo", "A10 Crise", "Comandante", "Sem boletim oficial"],
        ["Qualidade de série", "A05 Anomalia", "Curador SGH", "Bruto nunca corrigido"],
      ].map((row) => <div key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><b>{row[3]}</b></div>)}</div></article>
    </div>
  );

  const Briefing = () => (
    <div className="tower-briefing">
      <article className="panel tower-briefing-editor"><header className="panel-header"><div><h2>Briefing executivo por turno</h2><p>Síntese assistida, editável e validada por autoridade</p></div><span className={briefingValidated ? "validated" : "draft"}>{briefingValidated ? "✓ VALIDADO" : "RASCUNHO IA"}</span></header><div className="tower-briefing-meta"><span>BRF-2026-08-07-T2</span><span>Contexto: {territory}</span><span>Fontes: 8</span><span>Confiança: 92%</span></div><label><span>SÍNTESE EXECUTIVA</span><textarea value={briefingText} onChange={(event) => { setBriefingText(event.target.value); setBriefingValidated(false); }} /></label><div className="tower-briefing-sections"><section><span>RISCOS PRIORITÁRIOS</span><p><b>01.</b> Vazão crítica no São Francisco Norte, com tendência persistente.</p><p><b>02.</b> Contrato federativo BA em modo parcial; fallback preserva operação.</p></section><section><span>DECISÕES REQUERIDAS</span><p><b>Até 14:40</b> — cenário operativo EC-2026-0048.</p><p><b>Até 15:00</b> — ordem de vistoria GF-2026-0917.</p></section><section><span>RECOMENDAÇÕES</span><p>Manter monitoramento reforçado por 72 h e convocar coordenação do incidente.</p><p>Validar dossiê remoto antes do deslocamento de campo.</p></section></div><footer><button onClick={() => { setBriefingValidated(false); onToast("Nova síntese gerada a partir do estado atual; edição humana preservada no histórico."); }}>✦ Atualizar com estado live</button><button onClick={exportBriefing}>⇩ Exportar</button><button className="primary" onClick={() => { setBriefingValidated(true); onToast("Briefing validado por Marina Alves e registrado na timeline do turno."); }}>✓ Validar briefing</button></footer></article>
      <aside className="panel tower-briefing-sources"><header className="panel-header"><div><h2>Fontes e mudanças</h2><p>Grounding do briefing</p></div></header><div className="tower-change-since"><span>DESDE O ÚLTIMO TURNO</span><strong>7 mudanças relevantes</strong><p>3 alertas · 2 decisões · 1 integração · 1 cenário</p></div>{integrations.slice(0, 6).map((item) => <button key={item.id} onClick={() => onNavigate("Desempenho")}><i className={item.status === "Operacional" ? "ok" : "warn"} /><div><strong>{item.name}</strong><small>{item.contract} · atualização {item.freshness}</small></div><b>{item.quality}%</b></button>)}<div className="tower-briefing-disclaimer">Documento demonstrativo. Publicação externa e boletim oficial exigem alçada e assinatura.</div></aside>
    </div>
  );

  const Performance = () => (
    <div className="tower-performance">
      <div className="tower-performance-kpis"><article><span>DISPONIBILIDADE</span><strong>99,94%</strong><small>meta 99,90%</small><i style={{ width: "99.4%" }} /></article><article><span>QUALIDADE FEDERATIVA</span><strong>{averageQuality}/100</strong><small>↑ 2,1 pts</small><i style={{ width: `${averageQuality}%` }} /></article><article><span>EVENTOS PROCESSADOS</span><strong>2,41 mi</strong><small>últimas 24 h</small><i style={{ width: "82%" }} /></article><article><span>DECISÕES NO SLA</span><strong>87%</strong><small>meta 90%</small><i className="warn" style={{ width: "87%" }} /></article></div>
      <article className="panel tower-integration-health"><header className="panel-header"><div><h2>Saúde das integrações</h2><p>Contrato, autoridade, qualidade, frescor e consumidores</p></div><button onClick={() => onOpenModule("m11")}>Abrir Governança ↗</button></header><div className="tower-integration-head"><span>INTEGRAÇÃO</span><span>MODO</span><span>CONSUMIDORES</span><span>FRESCOR</span><span>QUALIDADE</span><span>STATUS</span></div>{integrations.map((item) => <button key={item.id} onClick={() => onToast(`${item.contract}: lineage e SLA carregados para ${item.name}.`)}><div><i className={item.status === "Operacional" ? "ok" : "warn"} /><span><strong>{item.name}</strong><small>{item.contract} · {item.owner}</small></span></div><span>{item.mode}</span><span>{item.consumers.join(" · ")}</span><time>{item.freshness}</time><b>{item.quality}%</b><em className={item.status.toLowerCase()}>{item.status}</em></button>)}</article>
      <article className="panel tower-throughput"><header className="panel-header"><div><h2>Fluxo de eventos</h2><p>Recebidos, qualificados, processados e aprovados · 24 h</p></div><span>p95 380 ms</span></header><div className="tower-throughput-chart">{[42, 58, 51, 66, 61, 74, 70, 83, 76, 91, 79, 86, 72, 67, 74, 82, 94, 88, 78, 84, 69, 73, 61, 68].map((value, index) => <i key={index} style={{ height: `${value}%` }}><span>{index}h</span></i>)}</div><div className="tower-chart-legend"><span><i /> processados</span><span><i /> faixa de SLA</span><b>2,41 mi eventos</b></div></article>
      <article className="panel tower-sla-panel"><header className="panel-header"><div><h2>SLA por fluxo crítico</h2><p>Tempo de resposta e violações</p></div></header>{[
        ["Evento crítico → incidente", 94, "4m 18s", "Meta 5 min"],
        ["Detecção → validação", 88, "26 min", "Meta 30 min"],
        ["Alerta → responsável", 96, "8 min", "Meta 15 min"],
        ["Decisão → registro", 87, "18 min", "Meta 20 min"],
        ["Integração → fallback", 99, "42 s", "Meta 2 min"],
      ].map((row) => <div key={row[0]}><span><strong>{row[0]}</strong><small>{row[2]} · {row[3]}</small></span><div><i style={{ width: `${row[1]}%` }} /></div><b>{row[1]}%</b></div>)}</article>
    </div>
  );

  return (
    <section className="control-tower-module" aria-label={`Torre de Controle — ${contextItem}`}>
      <div className="tower-context-bar">
        <div><span>⌖</span><small>TERRITÓRIO</small><strong>{territory}</strong></div><div><span>◴</span><small>TEMPO</small><strong>{running ? "Ao vivo" : "Replay"} · {clockLabel}</strong></div><div><span>◇</span><small>CONFIANÇA MÍNIMA</small><strong>≥ 80%</strong></div><div><span>▦</span><small>OBJETO ATIVO</small><strong>{selectedAlert?.chtId ?? "Visão nacional"}</strong></div><button onClick={() => onToast("Filtros globais fixados. Todos os produtos receberão o mesmo CHTContext.")}>Fixar contexto ⌖</button>
      </div>
      {contextItem === "Visão nacional" && <Overview />}
      {contextItem === "Mapa operacional" && <MapOperations />}
      {contextItem === "Alertas" && <Alerts />}
      {contextItem === "Casos" && <Cases />}
      {contextItem === "Agenda de decisões" && <Decisions />}
      {contextItem === "Briefing" && <Briefing />}
      {contextItem === "Desempenho" && <Performance />}

      {reviewingDecision && <div className="tower-decision-backdrop" onMouseDown={() => setReviewingDecision(null)}><section className="tower-review-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>APROVAÇÃO HUMANA · {reviewingDecision.risk.toUpperCase()}</small><h2>{reviewingDecision.title}</h2><p>{reviewingDecision.id} · {reviewingDecision.caseId} · {reviewingDecision.authority}</p></div><button onClick={() => setReviewingDecision(null)}>×</button></header><div className="tower-review-metrics"><div><span>CONFIANÇA</span><strong>{reviewingDecision.confidence}%</strong></div><div><span>FONTES</span><strong>{reviewingDecision.sources}</strong></div><div><span>PRAZO</span><strong>{reviewingDecision.due}</strong></div><div><span>STATUS</span><strong>{reviewingDecision.status}</strong></div></div><section className="facts"><span>FATOS RECUPERADOS</span><p>O caso está territorialmente resolvido, possui fontes versionadas e passou pelas regras de qualidade aplicáveis.</p></section><section className="inference"><span>INFERÊNCIA DO AGENTE</span><p>{reviewingDecision.proposal}</p></section><section className="limit"><span>LIMITE E SALVAGUARDA</span><p>{reviewingDecision.caveat}</p></section><label><span>JUSTIFICATIVA DA AUTORIDADE</span><textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} /></label><footer><button className="reject" onClick={() => resolveDecision("Rejeitada")}>Rejeitar</button><button onClick={() => resolveDecision("Devolvida")}>Editar e devolver</button><button className="primary" onClick={() => resolveDecision("Aprovada")}>✓ Aprovar e registrar</button></footer></section></div>}
    </section>
  );
}
