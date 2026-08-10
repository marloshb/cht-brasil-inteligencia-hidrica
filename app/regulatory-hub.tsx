"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type RuleStatus = "Publicada" | "Candidata" | "Em revisão" | "Substituída";
type TestResult = "Passou" | "Falhou" | "Não executado";

type RegulatoryRule = {
  id: string;
  title: string;
  domain: string;
  authority: string;
  status: RuleStatus;
  version: string;
  effectiveFrom: string;
  effectiveTo: string;
  territory: string;
  source: string;
  sourceType: string;
  confidence: number;
  tests: number;
  coverage: number;
  expression: string;
  explanation: string;
  consumers: string[];
};

type Instrument = {
  id: string;
  title: string;
  kind: string;
  authority: string;
  publication: string;
  effectiveFrom: string;
  status: "Vigente" | "Futura" | "Em análise" | "Revogada";
  rules: number;
  source: string;
};

type RuleTest = {
  id: string;
  title: string;
  ruleId: string;
  territory: string;
  input: string;
  expected: string;
  result: TestResult;
  duration: string;
};

type RuleConflict = {
  id: string;
  title: string;
  left: string;
  right: string;
  territory: string;
  severity: "Alta" | "Média" | "Baixa";
  score: number;
  status: "Aberto" | "Em análise" | "Decidido";
  reason: string;
};

type RegulatoryHubProps = {
  contextItem: string;
  territory: string;
  clockLabel: string;
  onNavigate: (item: string) => void;
  onOpenModule: (moduleId: string) => void;
  onCreateRecord: () => void;
  onToast: (message: string) => void;
};

const initialRules: RegulatoryRule[] = [
  { id: "REG-OUT-014", title: "Necessidade de autorização para captação superficial", domain: "Outorga", authority: "Autoridade competente pelo domínio", status: "Publicada", version: "v8", effectiveFrom: "01 jan 2026", effectiveTo: "—", territory: "Brasil · resolução por domínio", source: "Lei nº 9.433/1997 · conferir texto oficial", sourceType: "Lei federal", confidence: 98, tests: 42, coverage: 96, expression: "SE interferencia.tipo = 'captacao_superficial' E uso.exige_ato = true ENTÃO encaminhar(autoridade_competente)", explanation: "A regra identifica o tipo de interferência, resolve o domínio do corpo hídrico na data de referência e indica o canal competente. Ela não concede nem nega autorização.", consumers: ["M2 Passaporte", "M4 Regulação", "M7 Fiscalização"] },
  { id: "REG-COMP-008", title: "Competência regulatória conforme domínio do corpo hídrico", domain: "Competência", authority: "ANA / órgãos gestores estaduais", status: "Publicada", version: "v12", effectiveFrom: "18 mar 2026", effectiveTo: "—", territory: "Nacional", source: "Constituição e legislação de recursos hídricos", sourceType: "Matriz federativa", confidence: 97, tests: 68, coverage: 99, expression: "resolver_competencia(geometria, trecho, dominio, finalidade, data_referencia)", explanation: "Combina o domínio versionado do trecho, a localização da interferência, o tipo de ato e a vigência das competências cadastradas.", consumers: ["M1 Identidade", "M2 Passaporte", "M4 Regulação", "M9 Eventos"] },
  { id: "REG-MON-021", title: "Entrega de automonitoramento conforme condicionante", domain: "Monitoramento", authority: "Autoridade emissora do ato", status: "Publicada", version: "v5", effectiveFrom: "01 jul 2025", effectiveTo: "—", territory: "Por ato e UTH", source: "Condicionante do ato 1142/2024 · cenário demonstrativo", sourceType: "Ato individual", confidence: 94, tests: 31, coverage: 91, expression: "SE ato.condicionante.monitoramento = true ENTÃO agenda(periodicidade, evidencia, tolerancia)", explanation: "A obrigação deriva do ato aplicável ao território e calcula a agenda usando periodicidade, vigência e tolerância registradas na fonte.", consumers: ["M2 Passaporte", "M4 Regulação", "M5 Data Hub"] },
  { id: "REG-INS-005", title: "Tratamento de uso declarado abaixo do limiar local", domain: "Uso insignificante", authority: "Órgão gestor competente", status: "Em revisão", version: "v4-rc2", effectiveFrom: "proposta · 01 out 2026", effectiveTo: "—", territory: "Unidades federativas aderentes", source: "Norma estadual demonstrativa N-2026-07", sourceType: "Regra territorial", confidence: 86, tests: 18, coverage: 78, expression: "SE vazao <= limiar(territorio, finalidade, data) ENTÃO classificar('avaliar_dispensa')", explanation: "Consulta o limiar vigente no território e recomenda avaliação de dispensa; exceções e acumulação de usos permanecem sob análise humana.", consumers: ["M2 Passaporte", "M4 Regulação", "M7 Fiscalização"] },
  { id: "REG-COB-010", title: "Incidência de cobrança por uso autorizado e medido", domain: "Cobrança", authority: "Entidade delegatária / órgão gestor", status: "Candidata", version: "v2-rc1", effectiveFrom: "sem vigência", effectiveTo: "—", territory: "Bacia piloto", source: "Deliberação demonstrativa CBH-D-2026-03", sourceType: "Deliberação", confidence: 81, tests: 12, coverage: 64, expression: "base_calculo = funcao(volume_autorizado, volume_medido, mecanismo_vigente)", explanation: "A proposta reconcilia volumes e mecanismo vigente, mas não calcula boleto nem constitui crédito antes da validação institucional.", consumers: ["M4 Regulação", "M6 Balanço", "M8 Planejamento"] },
];

const initialInstruments: Instrument[] = [
  { id: "INS-LEG-9433", title: "Política Nacional de Recursos Hídricos", kind: "Lei", authority: "União", publication: "09 jan 1997", effectiveFrom: "09 jan 1997", status: "Vigente", rules: 18, source: "Portal oficial / LexML" },
  { id: "INS-MAT-2026", title: "Matriz federativa de competências hídricas", kind: "Modelo canônico CHT", authority: "Curadoria federativa", publication: "18 mar 2026", effectiveFrom: "18 mar 2026", status: "Vigente", rules: 27, source: "M11 · contratos federativos" },
  { id: "INS-ATO-1142", title: "Ato autorizativo 1142/2024", kind: "Ato individual", authority: "ANA · cenário", publication: "18 mar 2024", effectiveFrom: "18 mar 2024", status: "Vigente", rules: 6, source: "Águas Brasil · dado sintético" },
  { id: "INS-EST-N07", title: "Norma estadual N-2026-07", kind: "Norma territorial", authority: "Órgão estadual · cenário", publication: "08 ago 2026", effectiveFrom: "01 out 2026", status: "Futura", rules: 9, source: "Diário oficial · cenário" },
  { id: "INS-CBH-D03", title: "Deliberação de mecanismo de cobrança D-2026-03", kind: "Deliberação", authority: "CBH piloto · cenário", publication: "04 ago 2026", effectiveFrom: "pendente", status: "Em análise", rules: 5, source: "Portal do comitê · cenário" },
];

const initialTests: RuleTest[] = [
  { id: "TST-OUT-101", title: "Captação em rio de domínio federal", ruleId: "REG-COMP-008", territory: "UTH-DF-004918", input: "trecho federal · captação superficial · 2026-08-10", expected: "competência ANA", result: "Passou", duration: "18 ms" },
  { id: "TST-OUT-102", title: "Captação integralmente em rio estadual", ruleId: "REG-COMP-008", territory: "UTH-BA-018407", input: "trecho estadual · irrigação · 2026-08-10", expected: "competência estadual", result: "Passou", duration: "21 ms" },
  { id: "TST-MON-041", title: "Condicionante com série incompleta", ruleId: "REG-MON-021", territory: "UTH-DF-004918", input: "2 leituras ausentes · tolerância 1", expected: "obrigação pendente", result: "Passou", duration: "14 ms" },
  { id: "TST-INS-018", title: "Usos acumulados abaixo do limiar individual", ruleId: "REG-INS-005", territory: "Bacia piloto", input: "3 usos · 0,4 L/s cada · limiar 1 L/s", expected: "exigir análise de acumulação", result: "Falhou", duration: "27 ms" },
  { id: "TST-TEMP-009", title: "Consulta anterior à nova vigência", ruleId: "REG-INS-005", territory: "Bacia piloto", input: "data 2026-08-10 · vigência 2026-10-01", expected: "usar versão anterior", result: "Passou", duration: "12 ms" },
  { id: "TST-COB-007", title: "Volume medido superior ao autorizado", ruleId: "REG-COB-010", territory: "UTH-SP-009142", input: "medido 112% · mecanismo candidato", expected: "não produzir efeito financeiro", result: "Não executado", duration: "—" },
];

const initialConflicts: RuleConflict[] = [
  { id: "CNF-2026-071", title: "Limiar de uso insignificante divergente", left: "REG-INS-005 · v4-rc2", right: "Regra estadual legada · v3", territory: "Bacia piloto · faixa limítrofe", severity: "Alta", score: 92, status: "Aberto", reason: "Sobreposição territorial e vigências distintas para usos acumulados." },
  { id: "CNF-2026-068", title: "Periodicidade de automonitoramento incompatível", left: "REG-MON-021 · mensal", right: "ATO-1142/2024 · trimestral", territory: "UTH-DF-004918", severity: "Média", score: 84, status: "Em análise", reason: "Regra geral e condicionante individual possuem periodicidades diferentes." },
  { id: "CNF-2026-059", title: "Competência no trecho de fronteira estadual", left: "Matriz federal · trecho compartilhado", right: "Cadastro estadual · domínio local", territory: "Divisa BA/MG · trecho 74112", severity: "Alta", score: 89, status: "Aberto", reason: "Geometria e cadastro de domínio não convergem na data de referência." },
  { id: "CNF-2026-042", title: "Vocabulário de finalidade não equivalente", left: "abastecimento industrial", right: "uso em processo produtivo", territory: "Nacional", severity: "Baixa", score: 71, status: "Decidido", reason: "Conceitos mapeados como equivalentes com ressalva de contexto." },
];

const releases = [
  { version: "2026.08.3", date: "10 ago 2026 · 08:00", status: "Produção", author: "Comitê regulatório", rules: 1842, tests: "1.824/1.842", hash: "9f2d18a", note: "Matriz de competência e condicionantes atualizadas" },
  { version: "2026.08.2", date: "08 ago 2026 · 16:30", status: "Anterior", author: "Curadoria M3", rules: 1839, tests: "1.821/1.839", hash: "84ab09c", note: "Vocabulário de finalidades revisado" },
  { version: "2026.08.1", date: "04 ago 2026 · 10:14", status: "Anterior", author: "Pipeline normativo", rules: 1834, tests: "1.816/1.834", hash: "3bc102e", note: "Agenda regulatória do ciclo incorporada" },
  { version: "2026.09-rc1", date: "candidata · 09 ago", status: "Candidata", author: "Workspace regulatório", rules: 1856, tests: "1.826/1.856", hash: "771e4c2", note: "14 regras candidatas e 3 conflitos bloqueantes" },
];

const agendaItems = [
  { id: "AGD-118", date: "12 ago", title: "Revisão da matriz de domínio em trechos limítrofes", type: "Audiência técnica", impact: "M1 · M3 · M4", status: "Confirmada", owner: "Curadoria federativa" },
  { id: "AGD-121", date: "18 ago", title: "Entrada em vigor de vocabulário de finalidades v4", type: "Mudança de contrato", impact: "M2 · M4 · M7", status: "Programada", owner: "M11 · Data Office" },
  { id: "AGD-126", date: "01 set", title: "Publicação da release regulatória 2026.09", type: "Release", impact: "Toda a suíte", status: "Em preparação", owner: "Comitê regulatório" },
  { id: "AGD-132", date: "01 out", title: "Vigência da norma territorial N-2026-07", type: "Nova vigência", impact: "Bacia piloto", status: "Sob análise", owner: "Órgão estadual · cenário" },
];

const statusClass = (value: string) => value.toLowerCase().replaceAll(" ", "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function RegulatoryHub({ contextItem, territory, clockLabel, onNavigate, onOpenModule, onCreateRecord, onToast }: RegulatoryHubProps) {
  const [rules, setRules] = useState(initialRules);
  const [selectedRuleId, setSelectedRuleId] = useState(initialRules[0].id);
  const [ruleQuery, setRuleQuery] = useState("");
  const [ruleFilter, setRuleFilter] = useState("Todas");
  const [instruments, setInstruments] = useState(initialInstruments);
  const [tests, setTests] = useState(initialTests);
  const [conflicts, setConflicts] = useState(initialConflicts);
  const [selectedConflictId, setSelectedConflictId] = useState(initialConflicts[0].id);
  const [selectedRelease, setSelectedRelease] = useState(releases[3].version);
  const [competencyResolved, setCompetencyResolved] = useState(true);
  const [competencyDomain, setCompetencyDomain] = useState("Federal");
  const [competencyPurpose, setCompetencyPurpose] = useState("Captação superficial · uso industrial");
  const [testRunning, setTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(100);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [instrumentModalOpen, setInstrumentModalOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentStep, setAgentStep] = useState(4);
  const [consultQuestion, setConsultQuestion] = useState("Qual autoridade deve analisar a captação e quais obrigações estão vigentes?");
  const [consultSubmitted, setConsultSubmitted] = useState(true);
  const [subject, setSubject] = useState({ chtId: "UTH-DF-004918", passportId: "PAS-DF-004918", name: "Captação industrial · Ribeirão Mestre d'Armas", waterAddress: "Paraná / Paranaíba / UGRH DF / ottobacia 769943", center: [-47.82, -15.58] as [number, number], confidence: 94 });

  const selectedRule = rules.find((item) => item.id === selectedRuleId) ?? rules[0];
  const selectedConflict = conflicts.find((item) => item.id === selectedConflictId) ?? conflicts[0];
  const filteredRules = useMemo(() => {
    const normalized = ruleQuery.trim().toLowerCase();
    return rules.filter((item) => (ruleFilter === "Todas" || item.status === ruleFilter) && (!normalized || `${item.id} ${item.title} ${item.domain} ${item.authority} ${item.source}`.toLowerCase().includes(normalized)));
  }, [rules, ruleQuery, ruleFilter]);

  useEffect(() => {
    const receivePassport = (event: Event) => {
      const detail = (event as CustomEvent<{ chtId?: string; passportId?: string; name?: string; waterAddress?: string; center?: [number, number]; confidence?: number }>).detail;
      if (!detail?.chtId) return;
      setSubject({ chtId: detail.chtId, passportId: detail.passportId ?? `PAS-${detail.chtId}`, name: detail.name ?? "Objeto recebido do M2", waterAddress: detail.waterAddress ?? "Endereço hídrico recebido do Context Bus", center: detail.center ?? [-52, -14], confidence: detail.confidence ?? 80 });
    };
    window.addEventListener("cht:passport-context", receivePassport);
    return () => window.removeEventListener("cht:passport-context", receivePassport);
  }, []);

  useEffect(() => {
    if (!agentRunning) return;
    const interval = window.setInterval(() => {
      setAgentStep((step) => {
        if (step >= 4) {
          setAgentRunning(false);
          setConsultSubmitted(true);
          onToast("Consulta GeoRAG concluída com fontes, vigência, território e limites destacados.");
          return step;
        }
        return step + 1;
      });
    }, 1250);
    return () => window.clearInterval(interval);
  }, [agentRunning, onToast]);

  useEffect(() => {
    if (!testRunning) return;
    const interval = window.setInterval(() => {
      setTestProgress((progress) => {
        const next = Math.min(100, progress + 20);
        if (next === 100) {
          setTestRunning(false);
          setTests((items) => items.map((item) => item.result === "Não executado" ? { ...item, result: "Passou", duration: "19 ms" } : item));
          onToast("Suíte concluída: 5 passaram, 1 falhou e o conflito bloqueante foi preservado.");
        }
        return next;
      });
    }, 650);
    return () => window.clearInterval(interval);
  }, [testRunning, onToast]);

  const emitTowerEvent = (title: string, severity: "Crítico" | "Alto" | "Médio" | "Baixo", recommendation: string) => {
    window.dispatchEvent(new CustomEvent("cht:module-event", { detail: { eventId: `REG-EVT-${Date.now().toString(16).slice(-6).toUpperCase()}`, type: "regulatory.review.required", title, severity, source: "M3 · Motor Regulatório", module: "m3", moduleName: "Motor Regulatório", territory: subject.waterAddress, confidence: selectedRule.confidence, chtId: subject.chtId, recommendation, occurredAt: clockLabel } }));
  };

  const focusRule = (rule: RegulatoryRule) => {
    setSelectedRuleId(rule.id);
    window.dispatchEvent(new CustomEvent("cht:focus-map", { detail: { center: subject.center, zoom: 8, label: `${rule.id} · ${rule.domain}`, source: `${rule.authority} · ${rule.version}`, confidence: rule.confidence } }));
    window.dispatchEvent(new CustomEvent("cht:regulatory-context", { detail: { ruleId: rule.id, version: rule.version, authority: rule.authority, effectiveFrom: rule.effectiveFrom, territory: rule.territory, chtId: subject.chtId, passportId: subject.passportId } }));
    onToast(`${rule.id} selecionada; território, competência, testes e consumidores receberam a versão ${rule.version}.`);
  };

  const startAgent = () => {
    setAgentOpen(true);
    setAgentStep(0);
    setAgentRunning(true);
    setConsultSubmitted(false);
  };

  const resolveCompetency = () => {
    setCompetencyResolved(true);
    window.dispatchEvent(new CustomEvent("cht:focus-map", { detail: { center: subject.center, zoom: 9, label: `${subject.chtId} · competência ${competencyDomain.toLowerCase()}`, source: "M3 · matriz federativa v12", confidence: 97 } }));
    window.dispatchEvent(new CustomEvent("cht:regulatory-context", { detail: { chtId: subject.chtId, passportId: subject.passportId, authority: competencyDomain === "Federal" ? "ANA · autoridade indicativa" : "Órgão gestor estadual · autoridade indicativa", purpose: competencyPurpose, confidence: 97 } }));
    onToast("Competência indicativa resolvida com domínio, geometria, finalidade, vigência e trilha de evidências.");
  };

  const runTests = () => {
    setTestProgress(0);
    setTestRunning(true);
    setTests((items) => items.map((item) => item.result === "Não executado" ? { ...item, duration: "executando…" } : item));
  };

  const createRuleCandidate = () => {
    const item: RegulatoryRule = { ...initialRules[0], id: `REG-CAND-${String(rules.length + 1).padStart(3, "0")}`, title: "Regra candidata extraída de instrumento demonstrativo", status: "Candidata", version: "v1-rc1", effectiveFrom: "sem vigência", source: "Instrumento cadastrado · aguardando validação", confidence: 73, tests: 0, coverage: 0 };
    setRules((items) => [item, ...items]);
    setSelectedRuleId(item.id);
    setRuleModalOpen(false);
    onToast(`${item.id} criada como candidata; publicação bloqueada até revisão humana e testes.`);
  };

  const addInstrument = () => {
    const item: Instrument = { id: `INS-CAND-${String(instruments.length + 1).padStart(3, "0")}`, title: "Instrumento regulatório em triagem", kind: "Ato normativo", authority: "Autoridade informada", publication: "10 ago 2026", effectiveFrom: "a confirmar", status: "Em análise", rules: 0, source: "URL oficial a validar" };
    setInstruments((items) => [item, ...items]);
    setInstrumentModalOpen(false);
    onToast(`${item.id} registrado; captura, assinatura, vigência e autoridade estão em validação.`);
  };

  const decideConflict = () => {
    setConflicts((items) => items.map((item) => item.id === selectedConflict.id ? { ...item, status: "Decidido" } : item));
    setConflictModalOpen(false);
    emitTowerEvent("Conflito regulatório decidido", "Médio", `${selectedConflict.id} recebeu decisão humana; nova versão e testes de regressão são obrigatórios.`);
    onToast(`${selectedConflict.id} decidido por autoridade humana; justificativa, versão e impactos foram registrados.`);
  };

  const askQuestion = (event?: FormEvent) => {
    event?.preventDefault();
    if (!consultQuestion.trim()) {
      onToast("Informe uma pergunta regulatória antes de consultar.");
      return;
    }
    startAgent();
  };

  const Kpis = () => <div className="reg-kpis"><article><span>REGRAS PUBLICADAS</span><strong>1.842</strong><small>14 candidatas · 3 bloqueadas</small><i style={{ width: "92%" }} /></article><article><span>COBERTURA DE TESTES</span><strong>98,7%</strong><small>1.824 de 1.842 regras</small><i style={{ width: "98.7%" }} /></article><article><span>CONFLITOS ABERTOS</span><strong>{conflicts.filter((item) => item.status !== "Decidido").length}</strong><small>2 de severidade alta</small><i className="warn" style={{ width: "64%" }} /></article><article><span>FONTES SINCRONIZADAS</span><strong>47</strong><small>6 integrações · 2 parciais</small><i style={{ width: "94%" }} /></article></div>;

  const Rules = () => <div className="reg-rules"><header className="reg-section-toolbar"><div><h2>Catálogo de regras executáveis</h2><p>Fonte, vigência, território, expressão, testes e consumidores</p></div><div><button onClick={() => onToast("Catálogo exportado com versões, fontes e cobertura de testes.")}>⇩ Exportar</button><button className="primary" onClick={() => setRuleModalOpen(true)}>＋ Nova candidata</button></div></header><div className="reg-rules-layout"><article className="panel reg-rule-list"><header className="panel-header"><div><h2>Regras regulatórias</h2><p>{filteredRules.length} resultados no contexto</p></div><span className="reg-live"><i /> índice ativo</span></header><div className="reg-rule-search"><span>⌕</span><input value={ruleQuery} onChange={(event) => setRuleQuery(event.target.value)} placeholder="Buscar regra, domínio, autoridade ou fonte…" /><select value={ruleFilter} onChange={(event) => setRuleFilter(event.target.value)}><option>Todas</option><option>Publicada</option><option>Candidata</option><option>Em revisão</option></select></div><div className="reg-rule-results">{filteredRules.map((rule) => <button key={rule.id} className={rule.id === selectedRule.id ? "selected" : ""} onClick={() => focusRule(rule)}><span className="reg-rule-icon">R</span><div><small>{rule.id} · {rule.version}</small><strong>{rule.title}</strong><p>{rule.domain} · {rule.authority}</p></div><em className={statusClass(rule.status)}>{rule.status}</em><b>{rule.confidence}%</b><i>→</i></button>)}</div></article><article className="panel reg-rule-detail"><header><div><small>{selectedRule.id} · {selectedRule.version}</small><h2>{selectedRule.title}</h2><p>{selectedRule.domain} · {selectedRule.territory}</p></div><em className={statusClass(selectedRule.status)}>{selectedRule.status}</em></header><div className="reg-rule-metrics"><div><span>CONFIANÇA</span><strong>{selectedRule.confidence}%</strong></div><div><span>TESTES</span><strong>{selectedRule.tests}</strong></div><div><span>COBERTURA</span><strong>{selectedRule.coverage}%</strong></div><div><span>VIGÊNCIA</span><strong>{selectedRule.effectiveFrom}</strong></div></div><section className="reg-rule-expression"><span>EXPRESSÃO CANÔNICA</span><code>{selectedRule.expression}</code><button onClick={() => onToast("Árvore de decisão aberta com variáveis, operadores e dependências.")}>Ver árvore →</button></section><section><span>EXPLICAÇÃO</span><p>{selectedRule.explanation}</p></section><section className="reg-rule-source"><span>FONTE E AUTORIDADE</span><div><strong>{selectedRule.source}</strong><small>{selectedRule.sourceType} · {selectedRule.authority}</small></div><b>captura versionada ↗</b></section><section className="reg-rule-consumers"><span>CONSUMIDORES</span><div>{selectedRule.consumers.map((item) => <button key={item} onClick={() => onOpenModule(item.slice(0, 2).toLowerCase())}>{item} ↗</button>)}</div></section><footer><button onClick={() => onNavigate("Versões")}>Comparar versões</button><button onClick={() => onNavigate("Testes")}>Executar testes</button><button className="primary" onClick={startAgent}>✦ Explicar com GeoRAG</button></footer></article></div></div>;

  const Competencies = () => <div className="reg-competencies"><header className="reg-section-toolbar"><div><h2>Resolvedor de competência</h2><p>Geometria + domínio + finalidade + instrumento + data de referência</p></div><div><button onClick={() => onOpenModule("m1")}>Abrir identidade M1 ↗</button><button className="primary" onClick={resolveCompetency}>▶ Resolver competência</button></div></header><div className="reg-competency-layout"><article className="panel reg-competency-form"><header className="panel-header"><div><h2>Contexto de decisão</h2><p>Entradas provenientes do Context Bus</p></div><span>{subject.confidence}% identidade</span></header><label><span>CHT-ID / PASSAPORTE</span><input value={`${subject.chtId} · ${subject.passportId}`} readOnly /></label><label><span>ENDEREÇO HÍDRICO</span><textarea value={subject.waterAddress} readOnly /></label><div><label><span>DOMÍNIO DO TRECHO</span><select value={competencyDomain} onChange={(event) => { setCompetencyDomain(event.target.value); setCompetencyResolved(false); }}><option>Federal</option><option>Estadual</option><option>Indeterminado</option></select></label><label><span>DATA DE REFERÊNCIA</span><input type="date" defaultValue="2026-08-10" onChange={() => setCompetencyResolved(false)} /></label></div><label><span>FINALIDADE / INTERFERÊNCIA</span><select value={competencyPurpose} onChange={(event) => { setCompetencyPurpose(event.target.value); setCompetencyResolved(false); }}><option>Captação superficial · uso industrial</option><option>Captação subterrânea · irrigação</option><option>Barramento · regularização</option><option>Lançamento de efluentes</option></select></label><section><span>CAMADAS CONSULTADAS</span><p>BHO6 · domínio versionado · UTH · limite estadual · atos · matriz federativa</p></section><button className="reg-resolve-button" onClick={resolveCompetency}>Calcular com evidências →</button></article><article className="panel reg-competency-result"><header><div><small>RESULTADO INDICATIVO · MATRIZ v12</small><h2>{competencyResolved ? (competencyDomain === "Federal" ? "ANA · competência indicada" : competencyDomain === "Estadual" ? "Órgão gestor estadual indicado" : "Curadoria de domínio necessária") : "Contexto alterado · recalcule"}</h2><p>{subject.name}</p></div><span className={competencyResolved ? "resolved" : "stale"}>{competencyResolved ? "97% confiança" : "desatualizado"}</span></header><div className="reg-competency-path">{[["01", "Localizar interferência", subject.chtId, true], ["02", "Resolver trecho", "BHO6 · TRE-769943", true], ["03", "Determinar domínio", competencyDomain, competencyResolved], ["04", "Cruzar vigência", "matriz 2026.08.3", competencyResolved], ["05", "Indicar autoridade", competencyDomain === "Federal" ? "ANA · SRE" : "Órgão estadual", competencyResolved]].map((item, index) => <div key={item[0]} className={item[3] ? "done" : "pending"}><span>{item[3] ? "✓" : item[0]}</span><div><strong>{item[1]}</strong><small>{item[2]}</small></div>{index < 4 && <i>→</i>}</div>)}</div><section className="reg-competency-evidence"><h3>Evidências determinantes</h3>{[["Domínio do trecho na data", `${competencyDomain} · confiança 98%`, "M1/BHO6"], ["Geometria da interferência", "18 m do eixo de referência", "M1"], ["Tipo e finalidade", competencyPurpose, "M2"], ["Matriz de atribuições", "vigente desde 18 mar 2026", "M3"]].map((item) => <button key={item[0]}><span>▤</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div><b>{item[2]} ↗</b></button>)}</section><div className="reg-competency-limit"><span>LIMITE</span><p>Resultado de apoio. Casos de domínio indeterminado, conflito ou efeito externo exigem validação da autoridade competente.</p></div><footer><button onClick={() => emitTowerEvent("Competência regulatória requer validação", competencyDomain === "Indeterminado" ? "Alto" : "Médio", `${subject.chtId} possui resultado indicativo e deve ser validado antes do protocolo.`)}>Encaminhar ao M0</button><button className="primary" onClick={() => onOpenModule("m4")}>Abrir pré-análise M4 →</button></footer></article></div></div>;

  const Instruments = () => <div className="reg-instruments"><header className="reg-section-toolbar"><div><h2>Instrumentos e fontes normativas</h2><p>Autoridade, publicação, vigência, lineage e regras derivadas</p></div><div><button onClick={() => onOpenModule("m11")}>Contratos de fonte ↗</button><button className="primary" onClick={() => setInstrumentModalOpen(true)}>＋ Cadastrar instrumento</button></div></header><div className="reg-instrument-summary"><article><span>VIGENTES</span><strong>{instruments.filter((item) => item.status === "Vigente").length}</strong><small>fontes validadas</small></article><article><span>FUTUROS</span><strong>{instruments.filter((item) => item.status === "Futura").length}</strong><small>vigência programada</small></article><article><span>EM ANÁLISE</span><strong>{instruments.filter((item) => item.status === "Em análise").length}</strong><small>sem efeito em produção</small></article><article><span>REGRAS DERIVADAS</span><strong>{instruments.reduce((sum, item) => sum + item.rules, 0)}</strong><small>com ligação à fonte</small></article></div><article className="panel reg-instrument-table"><div className="reg-ins-head"><span>INSTRUMENTO</span><span>TIPO / AUTORIDADE</span><span>PUBLICAÇÃO</span><span>VIGÊNCIA</span><span>REGRAS</span><span>STATUS</span><span /></div>{instruments.map((item) => <button key={item.id} onClick={() => onToast(`${item.id}: texto, metadados, captura, relações e regras derivadas carregados.`)}><span className="reg-ins-icon">§</span><div><small>{item.id}</small><strong>{item.title}</strong><p>{item.source}</p></div><div><span>{item.kind}</span><b>{item.authority}</b></div><time>{item.publication}</time><time>{item.effectiveFrom}</time><b>{item.rules}</b><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article><div className="reg-instrument-flow"><span>FONTE OFICIAL</span><i>captura →</i><span>ZONA IMUTÁVEL</span><i>extrai →</i><span>REGRA CANDIDATA</span><i>valida →</i><span>TESTES</span><i>aprova →</i><span>RELEASE</span></div></div>;

  const Agenda = () => <div className="reg-agenda"><header className="reg-section-toolbar"><div><h2>Agenda regulatória integrada</h2><p>Mudanças previstas, vigências, impacto e preparação dos consumidores</p></div><div><button onClick={() => onToast("Assinatura ativa para temas: outorga, monitoramento, cobrança e competência.")}>◎ Minhas assinaturas</button><button className="primary" onClick={() => onCreateRecord()}>＋ Novo item</button></div></header><div className="reg-agenda-layout"><article className="panel reg-agenda-timeline"><header className="panel-header"><div><h2>Próximos marcos</h2><p>janela de 90 dias</p></div><span>4 itens monitorados</span></header>{agendaItems.map((item, index) => <button key={item.id} onClick={() => onToast(`${item.id}: dossiê de impacto e responsáveis carregados.`)}><time>{item.date}</time><span className={index === 3 ? "warn" : ""}>{index + 1}</span><div><small>{item.id} · {item.type}</small><strong>{item.title}</strong><p>Impacto: {item.impact} · responsável {item.owner}</p></div><em>{item.status}</em><i>→</i></button>)}</article><article className="panel reg-impact-panel"><header className="panel-header"><div><h2>Análise de impacto</h2><p>Release candidata 2026.09-rc1</p></div><button onClick={startAgent}>✦ Recalcular</button></header><div className="reg-impact-kpis"><div><span>REGRAS AFETADAS</span><strong>37</strong></div><div><span>UTHs POTENCIAIS</span><strong>18.426</strong></div><div><span>WORKFLOWS</span><strong>4</strong></div><div><span>RISCO</span><strong>moderado</strong></div></div><section><h3>Consumidores e preparação</h3>{[["M1 · Identidade", "vocabulário e domínio", 100], ["M2 · Passaporte", "regularidade e agenda", 92], ["M4 · Regulação", "pré-análise e cobrança", 76], ["M7 · Fiscalização", "tipificação e risco", 84]].map((item) => <button key={item[0]} onClick={() => onOpenModule(String(item[0]).slice(0, 2).toLowerCase())}><span><strong>{item[0]}</strong><small>{item[1]}</small></span><i><b style={{ width: `${item[2]}%` }} /></i><em>{item[2]}%</em><b>↗</b></button>)}</section><div className="reg-impact-recommendation"><span>RECOMENDAÇÃO</span><p>Executar regressão completa, resolver três conflitos bloqueantes e comunicar os consumidores sete dias antes da vigência.</p><button onClick={() => emitTowerEvent("Release regulatória requer coordenação", "Alto", "Resolver conflitos, completar regressão e aprovar plano de transição antes da vigência.")}>Criar caso no M0 →</button></div></article></div></div>;

  const Tests = () => <div className="reg-tests"><header className="reg-section-toolbar"><div><h2>Laboratório de testes regulatórios</h2><p>Casos unitários, territoriais, temporais, regressão e não produção de efeitos</p></div><div><button onClick={() => onToast("Caso de teste em modo de edição com seed determinística.")}>＋ Novo caso</button><button className="primary" disabled={testRunning} onClick={runTests}>{testRunning ? `Executando ${testProgress}%` : "▶ Executar suíte"}</button></div></header><div className="reg-test-kpis"><article><span>PASSARAM</span><strong>{tests.filter((item) => item.result === "Passou").length}</strong><small>resultado esperado confirmado</small></article><article><span>FALHARAM</span><strong>{tests.filter((item) => item.result === "Falhou").length}</strong><small>bloqueiam publicação</small></article><article><span>NÃO EXECUTADOS</span><strong>{tests.filter((item) => item.result === "Não executado").length}</strong><small>aguardam dependência</small></article><article><span>COBERTURA</span><strong>98,7%</strong><small>meta 98%</small></article></div><div className="reg-test-progress"><div><span>SUÍTE REG-2026.08 · {testRunning ? "EM EXECUÇÃO" : "CONCLUÍDA"}</span><strong>{testProgress}%</strong></div><i><b style={{ width: `${testProgress}%` }} /></i></div><article className="panel reg-test-table"><div className="reg-test-head"><span>CASO / REGRA</span><span>TERRITÓRIO</span><span>ENTRADA</span><span>ESPERADO</span><span>DURAÇÃO</span><span>RESULTADO</span><span /></div>{tests.map((item) => <button key={item.id} onClick={() => onToast(`${item.id}: fixture, execução, assertivas e logs carregados.`)}><span className={`reg-test-icon ${statusClass(item.result)}`}>{item.result === "Passou" ? "✓" : item.result === "Falhou" ? "!" : "○"}</span><div><small>{item.id} · {item.ruleId}</small><strong>{item.title}</strong></div><span>{item.territory}</span><code>{item.input}</code><span>{item.expected}</span><time>{item.duration}</time><em className={statusClass(item.result)}>{item.result}</em><i>→</i></button>)}</article></div>;

  const Conflicts = () => <div className="reg-conflicts"><header className="reg-section-toolbar"><div><h2>Fila de conflitos regulatórios</h2><p>Sobreposição territorial, vigência, hierarquia, competência e semântica</p></div><div><button onClick={startAgent}>✦ Detectar conflitos</button><button className="primary" onClick={() => emitTowerEvent("Conflitos regulatórios bloqueantes", "Alto", "Dois conflitos de severidade alta requerem decisão humana antes da próxima release.")}>Escalar bloqueantes</button></div></header><div className="reg-conflict-layout"><article className="panel reg-conflict-list"><header className="panel-header"><div><h2>Conflitos detectados</h2><p>{conflicts.filter((item) => item.status !== "Decidido").length} pendentes</p></div></header>{conflicts.map((item) => <button key={item.id} className={item.id === selectedConflict.id ? "selected" : ""} onClick={() => setSelectedConflictId(item.id)}><span className={`reg-conflict-score ${statusClass(item.severity)}`}>{item.score}</span><div><small>{item.id} · {item.territory}</small><strong>{item.title}</strong><p>{item.left} ↔ {item.right}</p></div><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article><article className="panel reg-conflict-detail"><header><div><small>{selectedConflict.id} · SEVERIDADE {selectedConflict.severity.toUpperCase()}</small><h2>{selectedConflict.title}</h2><p>{selectedConflict.territory}</p></div><span>{selectedConflict.score}% correspondência</span></header><div className="reg-conflict-compare"><section><span>REGRA A</span><strong>{selectedConflict.left}</strong><p>Fonte, autoridade, vigência e território preservados.</p></section><div>↔</div><section><span>REGRA B</span><strong>{selectedConflict.right}</strong><p>Representação comparada sem sobrescrever o instrumento.</p></section></div><section className="reg-conflict-reason"><span>MOTIVO DETECTADO</span><p>{selectedConflict.reason}</p></section><div className="reg-conflict-dimensions">{[["Hierarquia", "compatível", "ok"], ["Território", "sobreposição", "warn"], ["Vigência", "divergente", "warn"], ["Finalidade", "parcial", "warn"], ["Autoridade", "revisar", "critical"]].map((item) => <div key={item[0]}><span>{item[0]}</span><strong className={item[2]}>{item[1]}</strong></div>)}</div><div className="reg-conflict-agent"><span>✦</span><div><strong>Agente de Conflitos</strong><p>Recomenda preservar a regra específica do ato no caso individual e abrir revisão da regra geral. Decisão humana obrigatória.</p></div><b>88%</b></div><footer><button onClick={() => onNavigate("Testes")}>Abrir regressão</button><button onClick={() => emitTowerEvent("Conflito regulatório em análise", selectedConflict.severity === "Alta" ? "Alto" : "Médio", `${selectedConflict.id} deve ser decidido antes de promover a release.`)}>Criar caso M0</button><button className="primary" disabled={selectedConflict.status === "Decidido"} onClick={() => setConflictModalOpen(true)}>Revisar decisão →</button></footer></article></div></div>;

  const Versions = () => { const release = releases.find((item) => item.version === selectedRelease) ?? releases[3]; return <div className="reg-versions"><header className="reg-section-toolbar"><div><h2>Releases e versões regulatórias</h2><p>Pacotes imutáveis de regras, fontes, testes, conflitos e aprovações</p></div><div><button onClick={() => onToast("Manifesto da release exportado com hashes e dependências.")}>⇩ Manifesto</button><button className="primary" onClick={() => emitTowerEvent("Promoção de release aguarda aprovação", "Alto", `${release.version} possui testes ou conflitos pendentes e requer comitê regulatório.`)}>Solicitar promoção</button></div></header><div className="reg-version-layout"><article className="panel reg-release-list"><header className="panel-header"><div><h2>Histórico de releases</h2><p>produção, anteriores e candidatas</p></div></header>{releases.map((item) => <button key={item.version} className={item.version === selectedRelease ? "selected" : ""} onClick={() => setSelectedRelease(item.version)}><span>{item.status === "Produção" ? "●" : item.status === "Candidata" ? "◆" : "○"}</span><div><small>{item.version} · {item.date}</small><strong>{item.note}</strong><p>{item.rules} regras · testes {item.tests}</p><em>{item.author} · hash {item.hash}</em></div><b>{item.status}</b></button>)}</article><article className="panel reg-release-diff"><header><div><small>COMPARAÇÃO DE RELEASE</small><h2>2026.08.3 produção × {release.version}</h2></div><span>{release.status}</span></header><div className="reg-release-gates">{[["Fontes capturadas", "47/47", "pass"], ["Testes de regressão", release.tests, release.status === "Candidata" ? "warn" : "pass"], ["Conflitos bloqueantes", release.status === "Candidata" ? "3" : "0", release.status === "Candidata" ? "critical" : "pass"], ["Aprovação humana", release.status === "Candidata" ? "pendente" : "registrada", release.status === "Candidata" ? "warn" : "pass"]].map((item) => <div key={item[0]}><span>{item[0]}</span><strong className={item[2]}>{item[1]}</strong></div>)}</div><div className="reg-diff-table"><div><span>OBJETO</span><span>PRODUÇÃO</span><span>CANDIDATA</span><span>IMPACTO</span></div><div><strong>regras</strong><span>1.842</span><b>1.856</b><em>+14 candidatas</em></div><div><strong>vocabulário</strong><span>finalidade v3</span><b>finalidade v4</b><em>M2/M4/M7</em></div><div><strong>competência</strong><span>matriz v12</span><b>matriz v13-rc1</b><em>12 trechos</em></div><div><strong>testes</strong><span>98,7%</span><b>98,4%</b><em>30 pendências</em></div></div><section className="reg-release-policy"><span>POLÍTICA DE PROMOÇÃO</span><p>Nenhuma release candidata entra em produção com conflito bloqueante, regressão crítica ou ausência de aprovação do comitê competente.</p><button onClick={() => onNavigate("Conflitos")}>Resolver bloqueios →</button></section></article></div></div>; };

  const Consultations = () => <div className="reg-consult"><header className="reg-section-toolbar"><div><h2>Consulta regulatória GeoRAG</h2><p>Resposta territorial e temporal com trechos recuperados, confiança e limites</p></div><div><button onClick={() => onOpenModule("m12")}>Abrir Central de Agentes ↗</button></div></header><div className="reg-consult-layout"><article className="panel reg-consult-chat"><header><div className="reg-agent-mark">✦</div><div><small>GEORAG NORMATIVO · CONTEXTO ATIVO</small><h2>{subject.chtId} · {subject.passportId}</h2><p>{subject.waterAddress}</p></div><span><i /> 47 fontes indexadas</span></header><div className="reg-consult-presets">{["Quem é competente neste território?", "Quais obrigações estão vigentes?", "Há conflito entre ato e regra geral?", "O que muda na release candidata?"].map((item) => <button key={item} onClick={() => { setConsultQuestion(item); setConsultSubmitted(false); }}>{item}</button>)}</div><div className="reg-chat-thread"><div className="user"><span>MA</span><p>{consultQuestion}</p></div>{consultSubmitted && <div className="assistant"><span>✦</span><div><small>RESPOSTA FUNDAMENTADA · 91% CONFIANÇA</small><p><b>Competência indicativa:</b> a matriz territorial aponta a ANA para o trecho federal associado à interferência na data de referência.</p><p><b>Obrigações encontradas:</b> o ato demonstrativo mantém automonitoramento e autodeclaração; há duas leituras ausentes e um prazo em 12 dias.</p><p><b>Encaminhamento:</b> confirmar o domínio versionado, reconciliar a série no M5 e abrir a pré-análise no M4 antes de qualquer protocolo.</p><section><span>LIMITE</span><p>A resposta organiza fontes e regras cadastradas. Não constitui parecer jurídico, certidão, outorga ou decisão da autoridade.</p></section></div></div>}</div><form className="reg-consult-input" onSubmit={askQuestion}><textarea value={consultQuestion} onChange={(event) => setConsultQuestion(event.target.value)} placeholder="Pergunte sobre competência, vigência, instrumentos ou obrigações…" /><div><span>⌖ {subject.chtId} · ◴ 10 ago 2026</span><button type="submit">Consultar com fontes ↑</button></div></form></article><aside className="panel reg-citations"><header className="panel-header"><div><h2>Fontes citadas</h2><p>trechos e autoridade na origem</p></div><span>4 citações</span></header>{[["[1]", "Lei nº 9.433/1997", "fundamentos e instrumentos · conferir fonte oficial", "98%"], ["[2]", "Matriz federativa v12", "domínio, autoridade e vigência territorial", "97%"], ["[3]", "Ato 1142/2024 · cenário", "condicionantes 3.1 e 3.4", "100%"], ["[4]", "Passaporte PAS-DF-004918", "agenda e evidências às 09:48", "94%"]].map((item) => <button key={item[0]} onClick={() => onToast(`${item[1]}: trecho, captura e metadados exibidos em modo somente leitura.`)}><span>{item[0]}</span><div><strong>{item[1]}</strong><p>{item[2]}</p></div><b>{item[3]}</b><i>↗</i></button>)}<section><span>COMO A RESPOSTA FOI FORMADA</span><p>pergunta → contexto espacial/temporal → busca híbrida → reranking → regras aplicáveis → resposta citada → limites</p></section><footer><button onClick={startAgent}>Ver trace completo</button><button onClick={() => onToast("Resposta exportada com pergunta, contexto, fontes, versões e aviso de uso.")}>⇩ Exportar memória</button></footer></aside></div></div>;

  const views: Record<string, () => React.ReactNode> = { "Regras": Rules, "Competências": Competencies, "Instrumentos": Instruments, "Agenda regulatória": Agenda, "Testes": Tests, "Conflitos": Conflicts, "Versões": Versions, "Consultas": Consultations };
  const ActiveView = views[contextItem] ?? Rules;
  const agentSteps = ["Resolver contexto espacial e data de referência", "Recuperar instrumentos e trechos candidatos", "Filtrar autoridade, vigência e aplicabilidade", "Executar regras e detectar conflitos", "Compor resposta citada com limites"];

  return <section className="regulatory-hub" aria-label={`Motor Regulatório — ${contextItem}`}><div className="reg-context-bar"><div><span>MR</span><small>CONTEXTO REGULATÓRIO</small><strong>{subject.chtId} · {subject.passportId}</strong></div><div><span>⌖</span><small>TERRITÓRIO</small><strong>{territory}</strong></div><div><span>◴</span><small>DATA DE REFERÊNCIA</small><strong>10 ago 2026 · release 2026.08.3</strong></div><div><span>§</span><small>POLÍTICA</small><strong>efeitos externos exigem autoridade humana</strong></div><button onClick={startAgent}>✦ GeoRAG Normativo</button></div><Kpis /><ActiveView />

    {ruleModalOpen && <div className="reg-modal-backdrop" onMouseDown={() => setRuleModalOpen(false)}><section className="reg-rule-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>NOVA REGRA CANDIDATA</small><h2>Representar regra a partir de instrumento</h2><p>A publicação permanecerá bloqueada até revisão e testes.</p></div><button onClick={() => setRuleModalOpen(false)}>×</button></header><div className="reg-modal-grid"><label className="full"><span>INSTRUMENTO / FONTE OFICIAL</span><select defaultValue="INS-EST-N07"><option>INS-EST-N07 · Norma territorial N-2026-07</option><option>INS-CBH-D03 · Deliberação D-2026-03</option></select></label><label><span>AUTORIDADE</span><input defaultValue="Órgão gestor · cenário" /></label><label><span>VIGÊNCIA PROPOSTA</span><input type="date" defaultValue="2026-10-01" /></label><label className="full"><span>ENUNCIADO DA REGRA</span><textarea defaultValue="Classificar o uso declarado segundo o limiar territorial vigente, preservando exceções e acumulação para análise humana." /></label><label><span>TERRITÓRIO</span><input defaultValue="Bacia piloto" /></label><label><span>TIPO DE EFEITO</span><select defaultValue="Recomendação"><option>Recomendação</option><option>Validação</option><option>Obrigação</option></select></label></div><section><span>EXTRAÇÃO ASSISTIDA</span><p>O agente sugere condições, exceções e testes com citações; um curador valida a representação antes de qualquer release.</p></section><footer><button onClick={() => setRuleModalOpen(false)}>Cancelar</button><button className="primary" onClick={createRuleCandidate}>Criar candidata →</button></footer></section></div>}

    {instrumentModalOpen && <div className="reg-modal-backdrop" onMouseDown={() => setInstrumentModalOpen(false)}><section className="reg-instrument-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>CADASTRO DE INSTRUMENTO</small><h2>Capturar fonte regulatória</h2><p>Texto, assinatura, publicação e vigência serão versionados.</p></div><button onClick={() => setInstrumentModalOpen(false)}>×</button></header><div className="reg-modal-grid"><label className="full"><span>URL OFICIAL OU IDENTIFICADOR</span><input defaultValue="https://fonte-oficial.exemplo/norma-2026-07" /></label><label><span>TIPO</span><select defaultValue="Ato normativo"><option>Ato normativo</option><option>Lei</option><option>Resolução</option><option>Deliberação</option></select></label><label><span>AUTORIDADE</span><input defaultValue="Autoridade informada" /></label><label><span>PUBLICAÇÃO</span><input type="date" defaultValue="2026-08-10" /></label><label><span>VIGÊNCIA</span><input type="date" defaultValue="2026-10-01" /></label><label className="full"><span>ESCOPO TERRITORIAL</span><input defaultValue="Bacia piloto · limites a validar" /></label></div><section><span>VALIDAÇÕES</span><p>origem · assinatura · integridade · OCR · autoridade · vigência · duplicidade · relações</p></section><footer><button onClick={() => setInstrumentModalOpen(false)}>Cancelar</button><button className="primary" onClick={addInstrument}>Registrar para triagem →</button></footer></section></div>}

    {conflictModalOpen && <div className="reg-modal-backdrop" onMouseDown={() => setConflictModalOpen(false)}><section className="reg-conflict-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>DECISÃO HUMANA · {selectedConflict.id}</small><h2>Resolver conflito regulatório</h2><p>A decisão criará nova versão e exigirá regressão dos consumidores.</p></div><button onClick={() => setConflictModalOpen(false)}>×</button></header><div className="reg-conflict-choice"><label><input type="radio" name="resolution" defaultChecked /><span><strong>Preservar regra específica no caso individual</strong><small>A regra geral continua válida fora do escopo do ato.</small></span></label><label><input type="radio" name="resolution" /><span><strong>Priorizar regra territorial mais recente</strong><small>Exige justificativa de hierarquia e vigência.</small></span></label><label><input type="radio" name="resolution" /><span><strong>Suspender aplicação e solicitar parecer</strong><small>Nenhum consumidor recebe resposta conclusiva.</small></span></label></div><label className="reg-conflict-justification"><span>JUSTIFICATIVA DA AUTORIDADE</span><textarea defaultValue="No contexto individual, preservar a condicionante específica do ato e abrir revisão da regra geral. A decisão não altera outros territórios até a publicação de nova release." /></label><section><span>IMPACTO</span><p>M2 regularidade · M4 condicionantes · M5 agenda · 12 testes de regressão</p></section><footer><button onClick={() => setConflictModalOpen(false)}>Cancelar</button><button className="primary" onClick={decideConflict}>✓ Decidir, versionar e testar</button></footer></section></div>}

    {agentOpen && <div className="reg-agent-backdrop" onMouseDown={() => setAgentOpen(false)}><aside className="reg-agent-drawer" onMouseDown={(event) => event.stopPropagation()}><header><div className="reg-agent-avatar">✦</div><div><small>{agentRunning ? "EXECUÇÃO AO VIVO" : "CONSULTA CONCLUÍDA"}</small><h2>GeoRAG Normativo</h2><p>Trace M3-A03-{subject.chtId.slice(-6)} · release 2026.08.3</p></div><button onClick={() => setAgentOpen(false)}>×</button></header><div className="reg-agent-scopes"><span>ESCOPOS</span><b>Consultar</b><b>Citar</b><b>Testar</b><b>Explicar</b><b className="blocked">Decidir ✕</b></div><section className="reg-agent-plan"><h3>Plano de execução</h3>{agentSteps.map((item, index) => <div key={item} className={index < agentStep ? "done" : index === agentStep ? "running" : "waiting"}><span>{index < agentStep ? "✓" : index === agentStep ? "●" : "○"}</span><div><strong>{item}</strong><small>{index < agentStep ? `${510 + index * 184} ms · trace registrado` : index === agentStep ? "executando ferramentas autorizadas…" : "aguardando dependência"}</small></div></div>)}</section><section className="reg-agent-tools"><h3>Ferramentas e fontes</h3>{[["Context Bus", `${subject.chtId} · vigência · geometria`, "100%"], ["Índice normativo", "47 fontes · busca híbrida", "96%"], ["Motor de regras", "release 2026.08.3 · sandbox", "99%"], ["Suíte de testes", "territorial + temporal", "98,7%"]].map((item) => <button key={item[0]}><span>▤</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div><b>{item[2]}</b></button>)}</section><section className="reg-agent-output"><div><h3>Saída estruturada</h3><span>91% confiança</span></div><p><b>Fato:</b> trecho cadastrado como federal na data e finalidade de referência.</p><p><b>Regra aplicada:</b> REG-COMP-008 v12, com 68 testes e cobertura 99%.</p><p><b>Conflito:</b> nenhuma divergência bloqueante para este objeto; condicionante individual prevalece no seu escopo.</p><p><b>Limite:</b> resultado indicativo, sujeito à validação da autoridade competente.</p></section><footer><button onClick={() => { setAgentRunning(false); onToast("GeoRAG pausado; nenhum efeito externo foi produzido."); }}>■ Pausar</button><button onClick={() => onOpenModule("m12")}>Central de Agentes</button><button className="primary" onClick={() => { setAgentOpen(false); onOpenModule("m4"); }}>Aplicar contexto no M4 →</button></footer></aside></div>}
  </section>;
}
