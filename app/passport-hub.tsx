"use client";

import { useEffect, useMemo, useState } from "react";

type PassportStatus = "Regular" | "Atenção" | "Pendente" | "Restrito";
type ObligationStatus = "Pendente" | "A vencer" | "Em atraso" | "Concluída";

type PassportRecord = {
  passportId: string;
  chtId: string;
  name: string;
  type: string;
  role: string;
  status: PassportStatus;
  completeness: number;
  confidence: number;
  waterAddress: string;
  authority: string;
  nextObligation: string;
  sources: number;
  updated: string;
  center: [number, number];
};

type Obligation = {
  id: string;
  title: string;
  category: string;
  authority: string;
  dueDate: string;
  countdown: string;
  status: ObligationStatus;
  evidence: string;
  module: string;
};

type Evidence = {
  id: string;
  title: string;
  kind: string;
  source: string;
  reference: string;
  capturedAt: string;
  validUntil: string;
  integrity: string;
  status: "Verificada" | "Em validação" | "Expirada";
};

type PassportRequest = {
  id: string;
  title: string;
  passportId: string;
  type: string;
  status: "Rascunho" | "Em análise" | "Aguardando usuário" | "Aprovação humana" | "Concluída";
  owner: string;
  createdAt: string;
  step: number;
};

type ShareGrant = {
  id: string;
  recipient: string;
  purpose: string;
  scopes: string[];
  expiresAt: string;
  status: "Ativo" | "Revogado" | "Expirado";
  accesses: number;
  lastAccess: string;
};

type PassportHubProps = {
  contextItem: string;
  territory: string;
  clockLabel: string;
  onNavigate: (item: string) => void;
  onOpenModule: (moduleId: string) => void;
  onCreateRecord: () => void;
  onToast: (message: string) => void;
};

const initialPassports: PassportRecord[] = [
  { passportId: "PAS-DF-004918", chtId: "UTH-DF-004918", name: "Captação industrial · Ribeirão Mestre d'Armas", type: "Interferência superficial", role: "Representante verificado", status: "Atenção", completeness: 94, confidence: 94, waterAddress: "Paraná / Paranaíba / UGRH DF / ottobacia 769943 / Ribeirão Mestre d'Armas", authority: "ANA · domínio federal", nextObligation: "Autodeclaração de uso · 12 dias", sources: 7, updated: "10 ago 2026 · 09:48", center: [-47.82, -15.58] },
  { passportId: "PAS-BA-018407", chtId: "UTH-BA-018407", name: "Área irrigada · Fazenda Horizonte", type: "Unidade produtiva / uso", role: "Procurador cadastrado", status: "Pendente", completeness: 81, confidence: 88, waterAddress: "São Francisco / Grande / UGRH 07 / ottobacia 744125 / Rio das Fêmeas", authority: "INEMA · domínio estadual", nextObligation: "Vazão mensal · em atraso", sources: 6, updated: "10 ago 2026 · 09:31", center: [-45.46, -12.32] },
  { passportId: "PAS-SP-009142", chtId: "UTH-SP-009142", name: "Captação urbana · Sistema Noroeste", type: "Sistema de abastecimento", role: "Gestor operacional", status: "Regular", completeness: 98, confidence: 91, waterAddress: "Paraná / Tietê / UGRHI 18 / ottobacia 846713", authority: "SP Águas · domínio estadual", nextObligation: "Leitura de macromedidor · 24 dias", sources: 9, updated: "10 ago 2026 · 08:42", center: [-50.1, -20.4] },
  { passportId: "PAS-MT-001782", chtId: "UTH-MT-001782", name: "Barramento de regularização · Alto Paraguai", type: "Infraestrutura hídrica", role: "Responsável técnico", status: "Restrito", completeness: 76, confidence: 86, waterAddress: "Paraguai / Alto Paraguai / UGRH P2 / ottobacia 896221", authority: "SEMA-MT · domínio estadual", nextObligation: "Inspeção de segurança · 5 dias", sources: 5, updated: "09 ago 2026 · 16:09", center: [-54.6, -16.2] },
];

const regularityBlocks = [
  { id: "REG-01", label: "Identidade territorial", status: "Regular", score: 94, source: "M1 · Núcleo de Identidade", updated: "09:47", detail: "CHT-ID ativo, endereço hídrico calculado e 5 identificadores relacionados.", action: "m1" },
  { id: "REG-02", label: "Representação e vínculo", status: "Regular", score: 100, source: "Gov.br + procuração", updated: "08:12", detail: "Representação verificada até 18 mar 2027; escopo de consulta e protocolo.", action: "m11" },
  { id: "REG-03", label: "Uso e ato autorizativo", status: "Atenção", score: 82, source: "Águas Brasil · ATO-1142/2024", updated: "09:42", detail: "Ato vigente; autodeclaração anual vence em 12 dias.", action: "m4" },
  { id: "REG-04", label: "Licenciamento ambiental", status: "Regular", score: 91, source: "Órgão ambiental · licença 4418", updated: "D-1", detail: "Licença compatível com finalidade e localização informadas.", action: "m3" },
  { id: "REG-05", label: "Monitoramento e medição", status: "Pendente", score: 68, source: "Telemetria / declaração", updated: "D-3", detail: "Duas leituras ausentes; reconciliação solicitada ao operador.", action: "m5" },
  { id: "REG-06", label: "Fiscalização e ocorrências", status: "Regular", score: 96, source: "GeoFiscalização", updated: "D-1", detail: "Nenhuma ocorrência impeditiva; uma recomendação preventiva aberta.", action: "m7" },
];

const initialObligations: Obligation[] = [
  { id: "OBR-2026-1842", title: "Enviar autodeclaração anual de uso", category: "Regulação", authority: "ANA · SRE", dueDate: "22 ago 2026", countdown: "12 dias", status: "A vencer", evidence: "Formulário AU-2026", module: "m4" },
  { id: "OBR-2026-1817", title: "Reconciliar leituras de vazão ausentes", category: "Monitoramento", authority: "ANA · SGH", dueDate: "13 ago 2026", countdown: "3 dias", status: "Pendente", evidence: "Série telemétrica", module: "m5" },
  { id: "OBR-2026-1764", title: "Atualizar responsável técnico", category: "Cadastro", authority: "Gov.br / CHT", dueDate: "31 ago 2026", countdown: "21 dias", status: "Pendente", evidence: "ART + procuração", module: "m2" },
  { id: "OBR-2026-1631", title: "Confirmar leitura mensal do macromedidor", category: "Automonitoramento", authority: "ANA · SRE", dueDate: "31 jul 2026", countdown: "10 dias em atraso", status: "Em atraso", evidence: "Foto georreferenciada", module: "m7" },
  { id: "OBR-2026-1512", title: "Ciência da condicionante hídrica", category: "Licenciamento", authority: "Órgão ambiental", dueDate: "18 jul 2026", countdown: "concluída", status: "Concluída", evidence: "Recibo REC-81142", module: "m3" },
];

const initialEvidence: Evidence[] = [
  { id: "EVD-11842", title: "Resolução de outorga nº 1142/2024", kind: "Ato autorizativo", source: "Águas Brasil", reference: "ATO-ANA-1142-24", capturedAt: "10 ago 2026 · 09:42", validUntil: "18 mar 2034", integrity: "sha256: 9f2d…18a", status: "Verificada" },
  { id: "EVD-11798", title: "Procuração eletrônica de representação", kind: "Representação", source: "Gov.br", reference: "PRC-GOV-88217", capturedAt: "10 ago 2026 · 08:12", validUntil: "18 mar 2027", integrity: "ICP-Brasil · válida", status: "Verificada" },
  { id: "EVD-11671", title: "Série mensal do macromedidor", kind: "Automonitoramento", source: "Telemetria CHT", reference: "SER-DF-004918", capturedAt: "07 ago 2026 · 23:59", validUntil: "—", integrity: "2 lacunas detectadas", status: "Em validação" },
  { id: "EVD-11306", title: "Licença ambiental de operação", kind: "Licenciamento", source: "Órgão ambiental", reference: "LAO-4418-2025", capturedAt: "09 ago 2026 · 06:00", validUntil: "04 nov 2028", integrity: "sha256: 771e…4c2", status: "Verificada" },
  { id: "EVD-10844", title: "Laudo de medição anterior", kind: "Documento técnico", source: "Usuário autorizado", reference: "DOC-2025-811", capturedAt: "04 ago 2025 · 14:22", validUntil: "04 ago 2026", integrity: "assinatura preservada", status: "Expirada" },
];

const initialRequests: PassportRequest[] = [
  { id: "SOL-2026-0918", title: "Vincular representante ao passaporte", passportId: "PAS-BA-018407", type: "Vínculo e representação", status: "Aprovação humana", owner: "Curadoria CHT", createdAt: "10 ago · 08:51", step: 4 },
  { id: "SOL-2026-0904", title: "Retificar finalidade declarada", passportId: "PAS-DF-004918", type: "Retificação cadastral", status: "Aguardando usuário", owner: "ANA · SRE", createdAt: "09 ago · 17:08", step: 3 },
  { id: "SOL-2026-0881", title: "Complementar evidência de medição", passportId: "PAS-DF-004918", type: "Complementação", status: "Em análise", owner: "Copiloto M2", createdAt: "09 ago · 11:42", step: 2 },
  { id: "SOL-2026-0856", title: "Habilitar compartilhamento técnico", passportId: "PAS-SP-009142", type: "Consentimento", status: "Concluída", owner: "Titular", createdAt: "08 ago · 15:30", step: 5 },
];

const initialShares: ShareGrant[] = [
  { id: "SHR-7A91", recipient: "Consultoria Hidroplan", purpose: "Preparação de renovação de outorga", scopes: ["Identidade", "Atos", "Obrigações"], expiresAt: "24 ago 2026 · 18:00", status: "Ativo", accesses: 4, lastAccess: "hoje · 08:31" },
  { id: "SHR-61B4", recipient: "Órgão ambiental distrital", purpose: "Análise de compatibilidade ambiental", scopes: ["Identidade", "Atos", "Evidências"], expiresAt: "18 ago 2026 · 23:59", status: "Ativo", accesses: 2, lastAccess: "09 ago · 16:12" },
  { id: "SHR-4F02", recipient: "Auditoria interna", purpose: "Conferência anual", scopes: ["Passaporte completo"], expiresAt: "31 jul 2026 · 23:59", status: "Expirado", accesses: 9, lastAccess: "30 jul · 11:08" },
];

const statusClass = (value: string) => value.toLowerCase().replaceAll(" ", "-").replace("ç", "c").replace("í", "i").replace("ã", "a");

export function PassportHub({ contextItem, territory, clockLabel, onNavigate, onOpenModule, onCreateRecord, onToast }: PassportHubProps) {
  const [passports, setPassports] = useState(initialPassports);
  const [selectedId, setSelectedId] = useState(initialPassports[0].passportId);
  const [query, setQuery] = useState("");
  const [obligations, setObligations] = useState(initialObligations);
  const [evidence, setEvidence] = useState(initialEvidence);
  const [requests, setRequests] = useState(initialRequests);
  const [shares, setShares] = useState(initialShares);
  const [regularityFilter, setRegularityFilter] = useState("Todos");
  const [obligationFilter, setObligationFilter] = useState("Todas");
  const [selectedRequestId, setSelectedRequestId] = useState(initialRequests[0].id);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentStep, setAgentStep] = useState(0);
  const [shareRecipient, setShareRecipient] = useState("Consultoria responsável");
  const [sharePurpose, setSharePurpose] = useState("Preparar requerimento regulatório");
  const [shareScopes, setShareScopes] = useState(["Identidade", "Atos", "Obrigações"]);

  const selectedPassport = passports.find((item) => item.passportId === selectedId) ?? passports[0];
  const selectedRequest = requests.find((item) => item.id === selectedRequestId) ?? requests[0];
  const filteredPassports = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return passports;
    return passports.filter((item) => `${item.passportId} ${item.chtId} ${item.name} ${item.waterAddress} ${item.authority}`.toLowerCase().includes(normalized));
  }, [passports, query]);
  const filteredRegularity = regularityFilter === "Todos" ? regularityBlocks : regularityBlocks.filter((item) => item.status === regularityFilter);
  const filteredObligations = obligationFilter === "Todas" ? obligations : obligations.filter((item) => item.status === obligationFilter);
  const activeShares = shares.filter((item) => item.status === "Ativo").length;

  useEffect(() => {
    const receiveIdentity = (event: Event) => {
      const detail = (event as CustomEvent<{ chtId?: string; name?: string; waterAddress?: string; authority?: string; confidence?: number; sourceCount?: number; center?: [number, number] }>).detail;
      if (!detail?.chtId) return;
      const existing = passports.find((item) => item.chtId === detail.chtId);
      if (existing) {
        setSelectedId(existing.passportId);
        return;
      }
      const imported: PassportRecord = {
        passportId: `PAS-${detail.chtId.replace("UTH-", "")}`,
        chtId: detail.chtId,
        name: detail.name ?? "Território recebido do M1",
        type: "Objeto territorial hídrico",
        role: "Vínculo a validar",
        status: "Pendente",
        completeness: 64,
        confidence: detail.confidence ?? 80,
        waterAddress: detail.waterAddress ?? "Endereço hídrico em sincronização",
        authority: detail.authority ?? "Autoridade na fonte",
        nextObligation: "Validar representação",
        sources: detail.sourceCount ?? 1,
        updated: `10 ago 2026 · ${clockLabel}`,
        center: detail.center ?? [-52, -14],
      };
      setPassports((items) => [imported, ...items]);
      setSelectedId(imported.passportId);
    };
    window.addEventListener("cht:identity-context", receiveIdentity);
    return () => window.removeEventListener("cht:identity-context", receiveIdentity);
  }, [clockLabel, passports]);

  useEffect(() => {
    if (!agentRunning) return;
    const interval = window.setInterval(() => {
      setAgentStep((step) => {
        if (step >= 4) {
          setAgentRunning(false);
          onToast("Análise do passaporte concluída; recomendações disponíveis para revisão humana.");
          return step;
        }
        return step + 1;
      });
    }, 1250);
    return () => window.clearInterval(interval);
  }, [agentRunning, onToast]);

  const emitTowerEvent = (title: string, severity: "Crítico" | "Alto" | "Médio" | "Baixo", recommendation: string) => {
    window.dispatchEvent(new CustomEvent("cht:module-event", { detail: {
      eventId: `PAS-EVT-${Date.now().toString(16).slice(-6).toUpperCase()}`,
      type: "passport.attention.required",
      title,
      severity,
      source: "M2 · Passaporte Hídrico",
      module: "m2",
      moduleName: "Passaporte Hídrico",
      territory: selectedPassport.waterAddress,
      confidence: selectedPassport.confidence,
      chtId: selectedPassport.chtId,
      recommendation,
      occurredAt: clockLabel,
    } }));
  };

  const focusPassport = (passport: PassportRecord) => {
    setSelectedId(passport.passportId);
    window.dispatchEvent(new CustomEvent("cht:focus-map", { detail: { center: passport.center, zoom: 8, label: `${passport.passportId} · ${passport.name}`, source: `Passaporte Hídrico · ${passport.sources} fontes`, confidence: passport.confidence } }));
    window.dispatchEvent(new CustomEvent("cht:passport-context", { detail: passport }));
    onToast(`${passport.passportId} selecionado; mapa, regularidade, obrigações e evidências foram sincronizados.`);
  };

  const openConsumer = (moduleId: string) => {
    window.dispatchEvent(new CustomEvent("cht:passport-context", { detail: selectedPassport }));
    onOpenModule(moduleId);
  };

  const completeObligation = (obligation: Obligation) => {
    setObligations((items) => items.map((item) => item.id === obligation.id ? { ...item, status: "Concluída", countdown: "concluída agora" } : item));
    onToast(`${obligation.id} concluída com recibo, evidência e horário registrados.`);
  };

  const routeObligation = (obligation: Obligation) => {
    if (obligation.status === "Em atraso") emitTowerEvent("Obrigação hídrica em atraso", "Alto", `${obligation.id} requer evidência e plano de regularização.`);
    openConsumer(obligation.module);
    onToast(`${obligation.id} encaminhada ao módulo especialista com o contexto ${selectedPassport.chtId}.`);
  };

  const addEvidence = () => {
    const item: Evidence = { id: `EVD-${11843 + evidence.length}`, title: "Relatório técnico de medição", kind: "Documento técnico", source: "Usuário autorizado", reference: `DOC-2026-${String(900 + evidence.length)}`, capturedAt: `10 ago 2026 · ${clockLabel}`, validUntil: "10 ago 2027", integrity: "hash calculado no ingresso", status: "Em validação" };
    setEvidence((items) => [item, ...items]);
    setEvidenceOpen(false);
    setAgentOpen(true);
    setAgentStep(0);
    setAgentRunning(true);
    onToast(`${item.id} registrado; integridade, metadados e compatibilidade estão em validação.`);
  };

  const advanceRequest = () => {
    const nextStep = Math.min(selectedRequest.step + 1, 5);
    const statuses: PassportRequest["status"][] = ["Rascunho", "Em análise", "Em análise", "Aguardando usuário", "Aprovação humana", "Concluída"];
    setRequests((items) => items.map((item) => item.id === selectedRequest.id ? { ...item, step: nextStep, status: statuses[nextStep] } : item));
    if (nextStep === 4) {
      emitTowerEvent("Vínculo de passaporte aguarda aprovação", "Médio", `${selectedRequest.id} passou pelas validações automáticas e requer curador competente.`);
      onToast(`${selectedRequest.id} encaminhada à aprovação humana na Torre de Controle.`);
    } else if (nextStep === 5) {
      onToast(`${selectedRequest.id} concluída; vínculo, versão e trilha de auditoria foram publicados.`);
      setRequestOpen(false);
    } else {
      onToast(`${selectedRequest.id} avançou para ${statuses[nextStep].toLowerCase()}.`);
    }
  };

  const createRequest = () => {
    const item: PassportRequest = { id: `SOL-2026-${String(920 + requests.length)}`, title: "Nova solicitação de vínculo territorial", passportId: selectedPassport.passportId, type: "Vínculo e representação", status: "Rascunho", owner: "Solicitante", createdAt: `10 ago · ${clockLabel.slice(0, 5)}`, step: 0 };
    setRequests((items) => [item, ...items]);
    setSelectedRequestId(item.id);
    setRequestOpen(true);
    onToast(`${item.id} criada como rascunho e vinculada ao ${selectedPassport.passportId}.`);
  };

  const toggleScope = (scope: string) => setShareScopes((items) => items.includes(scope) ? items.filter((item) => item !== scope) : [...items, scope]);

  const createShare = () => {
    if (!shareRecipient.trim() || !sharePurpose.trim() || shareScopes.length === 0) {
      onToast("Informe destinatário, finalidade e ao menos um escopo para compartilhar.");
      return;
    }
    const item: ShareGrant = { id: `SHR-${Date.now().toString(16).slice(-4).toUpperCase()}`, recipient: shareRecipient.trim(), purpose: sharePurpose.trim(), scopes: shareScopes, expiresAt: "17 ago 2026 · 23:59", status: "Ativo", accesses: 0, lastAccess: "ainda não acessado" };
    setShares((items) => [item, ...items]);
    setShareOpen(false);
    onToast(`${item.id} criado por 7 dias; o acesso é consentido, rastreado e revogável.`);
  };

  const revokeShare = (share: ShareGrant) => {
    setShares((items) => items.map((item) => item.id === share.id ? { ...item, status: "Revogado" } : item));
    onToast(`${share.id} revogado imediatamente; novos acessos foram bloqueados e a trilha preservada.`);
  };

  const startAgent = () => {
    setAgentOpen(true);
    setAgentStep(0);
    setAgentRunning(true);
  };

  const PassportKpis = () => <div className="passport-kpis">
    <article><span>PASSAPORTES VINCULADOS</span><strong>4,21 mi</strong><small>+12.406 no ciclo</small><i style={{ width: "92%" }} /></article>
    <article><span>COMPLETUDE MÉDIA</span><strong>91,8%</strong><small>↑ 2,4 pt em 30 dias</small><i style={{ width: "91.8%" }} /></article>
    <article><span>OBRIGAÇÕES PRÓXIMAS</span><strong>{obligations.filter((item) => item.status !== "Concluída").length}</strong><small>1 em atraso · 2 prioritárias</small><i className="warn" style={{ width: "67%" }} /></article>
    <article><span>COMPARTILHAMENTOS</span><strong>{activeShares}</strong><small>consentidos e rastreados</small><i style={{ width: "76%" }} /></article>
  </div>;

  const PassportSummary = ({ compact = false }: { compact?: boolean }) => <article className={`panel passport-card ${compact ? "compact" : ""}`}>
    <header><div><span className="passport-mark">PH</span><div><small>{selectedPassport.passportId} · {selectedPassport.role}</small><h2>{selectedPassport.name}</h2><p>{selectedPassport.chtId}</p></div></div><span className={`passport-state ${statusClass(selectedPassport.status)}`}><i />{selectedPassport.status}</span></header>
    <div className="passport-score"><div><span>COMPLETUDE</span><strong>{selectedPassport.completeness}%</strong></div><div><i style={{ width: `${selectedPassport.completeness}%` }} /></div><div><span>CONFIANÇA</span><strong>{selectedPassport.confidence}%</strong></div></div>
    <section><span>ENDEREÇO HÍDRICO</span><p>{selectedPassport.waterAddress}</p><small>{selectedPassport.authority} · {selectedPassport.sources} fontes</small></section>
    {!compact && <><section className="passport-blocks"><button onClick={() => onNavigate("Regularidade")}><span>RG</span><div><strong>Regularidade contextual</strong><small>4 regulares · 1 atenção · 1 pendente</small></div><b>→</b></button><button onClick={() => onNavigate("Obrigações")}><span>OB</span><div><strong>Próxima obrigação</strong><small>{selectedPassport.nextObligation}</small></div><b>→</b></button><button onClick={() => onNavigate("Evidências")}><span>EV</span><div><strong>Cofre de evidências</strong><small>{evidence.length} itens · lineage preservado</small></div><b>→</b></button></section><footer><button onClick={() => openConsumer("m1")}>Abrir identidade M1</button><button onClick={() => onNavigate("Compartilhamentos")}>Compartilhar</button><button className="primary" onClick={startAgent}>✦ Analisar passaporte</button></footer></>}
  </article>;

  const Territories = () => <div className="passport-territories">
    <header className="passport-section-toolbar"><div><h2>Meus territórios vinculados</h2><p>Representação, regularidade, agenda e contexto territorial</p></div><div><button onClick={() => onNavigate("Buscar passaporte")}>⌕ Buscar</button><button onClick={createRequest}>＋ Solicitar vínculo</button></div></header>
    <div className="passport-territory-grid">{passports.map((item) => <button key={item.passportId} className={item.passportId === selectedId ? "selected" : ""} onClick={() => focusPassport(item)}><header><span className="passport-mark">PH</span><em className={statusClass(item.status)}><i />{item.status}</em></header><small>{item.passportId} · {item.role}</small><strong>{item.name}</strong><p>⌖ {item.waterAddress}</p><div><span>COMPLETUDE <b>{item.completeness}%</b></span><i><b style={{ width: `${item.completeness}%` }} /></i></div><footer><span>{item.nextObligation}</span><b>→</b></footer></button>)}</div>
    <div className="passport-territory-lower"><PassportSummary /><article className="panel passport-activity"><header className="panel-header"><div><h2>Atividade recente</h2><p>Eventos correlacionados ao passaporte</p></div><span className="passport-live"><i /> LIVE</span></header>{[["09:48", "Atributo sincronizado", "Águas Brasil atualizou a situação do ato 1142/2024", "M4"], ["09:42", "Evidência verificada", "Hash e assinatura do ato foram confirmados", "M2"], ["08:31", "Compartilhamento acessado", "Consultoria Hidroplan consultou 3 blocos", "M11"], ["07:59", "Obrigação priorizada", "Duas leituras ausentes elevaram a criticidade", "M5"], ["D-1", "Identidade versionada", "Crosswalk ADASA validado por curador", "M1"]].map((item, index) => <button key={item[0]} onClick={() => item[3] !== "M2" && onOpenModule(item[3].toLowerCase())}><time>{item[0]}</time><span className={index === 3 ? "warn" : ""} /><div><strong>{item[1]}</strong><p>{item[2]}</p></div><b>{item[3]} ↗</b></button>)}</article></div>
  </div>;

  const SearchPassport = () => <div className="passport-search-layout">
    <article className="panel passport-search-panel"><header className="panel-header"><div><h2>Buscar passaporte</h2><p>CHT-ID, passaporte, empreendimento, ato ou endereço hídrico</p></div><span className="passport-index"><i /> índice federado</span></header><div className="passport-search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: PAS-DF-004918, UTH-DF-004918, outorga 1142…" /><select defaultValue="Todos"><option>Todos</option><option>Com vínculo</option><option>Consulta pública</option></select><button onClick={() => onToast(`${filteredPassports.length} passaportes encontrados com respeito ao perfil de acesso.`)}>Buscar</button></div><div className="passport-search-safety"><span>PRIVACIDADE POR PADRÃO</span><p>A busca mostra somente dados compatíveis com papel, finalidade e base legal. Dados pessoais permanecem mascarados.</p></div><div className="passport-search-results">{filteredPassports.map((item) => <button key={item.passportId} className={item.passportId === selectedId ? "selected" : ""} onClick={() => focusPassport(item)}><span className="passport-mark">PH</span><div><small>{item.passportId} · {item.chtId}</small><strong>{item.name}</strong><p>{item.waterAddress}</p></div><em className={statusClass(item.status)}>{item.status}</em><b>{item.completeness}%</b><i>→</i></button>)}</div></article><PassportSummary />
  </div>;

  const Regularity = () => <div className="passport-regularity">
    <header className="passport-section-toolbar"><div><h2>Matriz de regularidade contextual</h2><p>Situação informacional por tema; não substitui certidões nem atos oficiais</p></div><div className="passport-filters">{["Todos", "Regular", "Atenção", "Pendente"].map((item) => <button key={item} className={regularityFilter === item ? "active" : ""} onClick={() => setRegularityFilter(item)}>{item}</button>)}<button className="agent" onClick={startAgent}>✦ Reanalisar</button></div></header>
    <div className="passport-regularity-summary"><article><span>SITUAÇÃO CONTEXTUAL</span><strong>Atenção</strong><small>uma obrigação próxima e duas leituras ausentes</small></article><article><span>FONTES CONSULTADAS</span><strong>7/7</strong><small>última sincronização 09:48</small></article><article><span>COERÊNCIA TERRITORIAL</span><strong>94%</strong><small>CHT-ID e atos compatíveis</small></article><article><span>FRESCOR</span><strong>18 s</strong><small>Águas Brasil · operacional</small></article></div>
    <div className="passport-regularity-layout"><article className="panel passport-regularity-matrix"><div className="passport-reg-head"><span>BLOCO / FONTE</span><span>SITUAÇÃO</span><span>CONFIANÇA</span><span>ATUALIZAÇÃO</span><span /></div>{filteredRegularity.map((item) => <button key={item.id} onClick={() => openConsumer(item.action)}><span className={`passport-reg-icon ${statusClass(item.status)}`}>{item.status === "Regular" ? "✓" : "!"}</span><div><small>{item.id} · {item.source}</small><strong>{item.label}</strong><p>{item.detail}</p></div><em className={statusClass(item.status)}>{item.status}</em><b>{item.score}%</b><time>{item.updated}</time><i>↗</i></button>)}</article><aside className="panel passport-regularity-explain"><header className="panel-header"><div><h2>Explicação da situação</h2><p>Fatos, inferências e limites separados</p></div></header><section><span>FATOS RECUPERADOS</span><p><b>5</b> identificadores convergem para o mesmo CHT-ID.</p><p>O ato 1142/2024 está vigente na fonte oficial.</p><p>Duas janelas de telemetria não possuem leitura válida.</p></section><section className="inference"><span>INFERÊNCIA DO COPILOTO</span><p>A lacuna não invalida o ato, mas aumenta o risco de descumprimento da obrigação de automonitoramento.</p></section><section className="limit"><span>LIMITE</span><p>O passaporte organiza evidências; somente a autoridade competente declara regularidade jurídica.</p></section><footer><button onClick={() => onNavigate("Obrigações")}>Tratar pendências →</button><button className="primary" onClick={startAgent}>Ver trace do agente</button></footer></aside></div>
  </div>;

  const Obligations = () => <div className="passport-obligations">
    <header className="passport-section-toolbar"><div><h2>Agenda de obrigações</h2><p>Prazos, responsáveis, evidências e encaminhamento ao módulo competente</p></div><div className="passport-filters">{["Todas", "A vencer", "Pendente", "Em atraso", "Concluída"].map((item) => <button key={item} className={obligationFilter === item ? "active" : ""} onClick={() => setObligationFilter(item)}>{item}</button>)}</div></header>
    <div className="passport-obligation-summary"><article><span>EM 7 DIAS</span><strong>2</strong><small>monitoramento e inspeção</small></article><article><span>EM 30 DIAS</span><strong>4</strong><small>1 exige documento externo</small></article><article><span>EM ATRASO</span><strong>1</strong><small>prioridade alta</small></article><article><span>CONCLUÍDAS NO CICLO</span><strong>18</strong><small>94% dentro do prazo</small></article></div>
    <article className="panel passport-obligation-list"><div className="passport-obl-head"><span>OBRIGAÇÃO</span><span>AUTORIDADE</span><span>VENCIMENTO</span><span>EVIDÊNCIA</span><span>STATUS</span><span /></div>{filteredObligations.map((item) => <div key={item.id}><span className={`passport-due-icon ${statusClass(item.status)}`}>{item.status === "Concluída" ? "✓" : item.status === "Em atraso" ? "!" : "◷"}</span><div><small>{item.id} · {item.category}</small><strong>{item.title}</strong></div><span>{item.authority}</span><time><strong>{item.dueDate}</strong><small>{item.countdown}</small></time><span>{item.evidence}</span><em className={statusClass(item.status)}>{item.status}</em><div><button onClick={() => routeObligation(item)}>Abrir {item.module.toUpperCase()} ↗</button><button disabled={item.status === "Concluída"} onClick={() => completeObligation(item)}>Concluir ✓</button></div></div>)}</article>
  </div>;

  const EvidenceVault = () => <div className="passport-evidence">
    <header className="passport-section-toolbar"><div><h2>Cofre de evidências</h2><p>Documentos, fatos externos, integridade, vigência e proveniência</p></div><div><button onClick={() => onToast("Manifesto de evidências exportado com hash, fonte, versão e vigência.")}>⇩ Exportar manifesto</button><button className="primary" onClick={() => setEvidenceOpen(true)}>＋ Registrar evidência</button></div></header>
    <div className="passport-evidence-kpis"><article><span>VERIFICADAS</span><strong>{evidence.filter((item) => item.status === "Verificada").length}</strong><small>fontes e hashes confirmados</small></article><article><span>EM VALIDAÇÃO</span><strong>{evidence.filter((item) => item.status === "Em validação").length}</strong><small>agente + regra de contrato</small></article><article><span>EXPIRADAS</span><strong>{evidence.filter((item) => item.status === "Expirada").length}</strong><small>não removidas do histórico</small></article><article><span>COBERTURA</span><strong>93%</strong><small>blocos do passaporte</small></article></div>
    <article className="panel passport-evidence-table"><div className="passport-ev-head"><span>EVIDÊNCIA</span><span>FONTE / REFERÊNCIA</span><span>CAPTURA</span><span>VIGÊNCIA</span><span>INTEGRIDADE</span><span>STATUS</span><span /></div>{evidence.map((item) => <button key={item.id} onClick={() => onToast(`${item.id}: lineage, conteúdo e validações carregados em modo somente leitura.`)}><span className="passport-file">▤</span><div><small>{item.id} · {item.kind}</small><strong>{item.title}</strong></div><div><span>{item.source}</span><b>{item.reference}</b></div><time>{item.capturedAt}</time><time>{item.validUntil}</time><code>{item.integrity}</code><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article>
    <div className="passport-evidence-policy"><span>POLÍTICA DE EVIDÊNCIA</span><p>O bruto é preservado, enriquecimentos criam novas versões e nenhuma evidência expirada é apagada. Dados sensíveis seguem mascaramento e finalidade.</p><button onClick={() => openConsumer("m11")}>Abrir governança →</button></div>
  </div>;

  const Requests = () => <div className="passport-requests">
    <header className="passport-section-toolbar"><div><h2>Solicitações e vínculos</h2><p>Workflow rastreável entre solicitante, identidade, representação e autoridade</p></div><div><button className="primary" onClick={createRequest}>＋ Nova solicitação</button></div></header>
    <div className="passport-requests-layout"><article className="panel passport-request-list"><header className="panel-header"><div><h2>Fila de solicitações</h2><p>{requests.filter((item) => item.status !== "Concluída").length} em andamento</p></div></header>{requests.map((item) => <button key={item.id} className={item.id === selectedRequest.id ? "selected" : ""} onClick={() => setSelectedRequestId(item.id)}><span className={`passport-request-step s${item.step}`}>{item.step === 5 ? "✓" : item.step + 1}</span><div><small>{item.id} · {item.createdAt}</small><strong>{item.title}</strong><p>{item.passportId} · {item.type}</p></div><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article><article className="panel passport-request-flow"><header><div><small>{selectedRequest.id} · {selectedRequest.passportId}</small><h2>{selectedRequest.title}</h2><p>Responsável atual: {selectedRequest.owner}</p></div><span className={statusClass(selectedRequest.status)}>{selectedRequest.status}</span></header><div className="passport-request-steps">{[["Solicitação", "finalidade e objeto"], ["Identidade", "CHT-ID e candidatos"], ["Representação", "Gov.br e procuração"], ["Evidências", "documentos e escopos"], ["Curadoria", "aprovação humana"], ["Publicação", "vínculo e eventos"]].map((item, index) => <div key={item[0]} className={index < selectedRequest.step ? "done" : index === selectedRequest.step ? "active" : ""}><span>{index < selectedRequest.step ? "✓" : index + 1}</span><strong>{item[0]}</strong><small>{item[1]}</small>{index < 5 && <i>→</i>}</div>)}</div><section className="passport-request-checks"><h3>Validações da etapa</h3>{[["Identidade territorial encontrada", "M1 · confiança 94%", true], ["Representação compatível com a finalidade", "Gov.br · válida até 2027", true], ["Escopo de dados minimizado", "LGPD · PAS-PRIV-004", true], ["Efeito externo ou vínculo crítico", "aprovação humana obrigatória", selectedRequest.step >= 4]].map((item) => <p key={item[0]} className={item[2] ? "pass" : "wait"}><span>{item[2] ? "✓" : "○"}</span><strong>{item[0]}</strong><small>{item[1]}</small></p>)}</section><div className="passport-request-agent"><span>✦</span><div><strong>Copiloto do Passaporte</strong><p>Consulta e recomenda. Não declara representação, regularidade ou vínculo sem a autoridade humana competente.</p></div><button onClick={startAgent}>Abrir trace</button></div><footer><button onClick={() => setRequestOpen(true)}>Abrir formulário</button><button onClick={() => emitTowerEvent("Solicitação de passaporte escalada", "Médio", `${selectedRequest.id} requer avaliação da autoridade competente.`)}>Escalar ao M0</button><button className="primary" disabled={selectedRequest.step === 5} onClick={advanceRequest}>{selectedRequest.step === 4 ? "✓ Aprovar e publicar" : "Validar e avançar →"}</button></footer></article></div>
  </div>;

  const Sharing = () => <div className="passport-sharing">
    <header className="passport-section-toolbar"><div><h2>Compartilhamentos consentidos</h2><p>Finalidade, escopo mínimo, expiração, rastreio e revogação imediata</p></div><div><button className="primary" onClick={() => setShareOpen(true)}>＋ Novo compartilhamento</button></div></header>
    <div className="passport-sharing-summary"><article><span>ATIVOS</span><strong>{activeShares}</strong><small>prazo máximo 14 dias</small></article><article><span>ACESSOS NO CICLO</span><strong>{shares.reduce((sum, item) => sum + item.accesses, 0)}</strong><small>todos registrados</small></article><article><span>ESCOPO MÉDIO</span><strong>3 blocos</strong><small>minimização aplicada</small></article><article><span>INCIDENTES</span><strong>0</strong><small>nenhum acesso indevido</small></article></div>
    <article className="panel passport-share-table"><div className="passport-share-head"><span>DESTINATÁRIO / FINALIDADE</span><span>ESCOPOS</span><span>EXPIRAÇÃO</span><span>ACESSOS</span><span>STATUS</span><span /></div>{shares.map((item) => <div key={item.id}><span className="passport-share-icon">↗</span><div><small>{item.id}</small><strong>{item.recipient}</strong><p>{item.purpose}</p></div><div className="passport-share-scopes">{item.scopes.map((scope) => <span key={scope}>{scope}</span>)}</div><time>{item.expiresAt}</time><span><b>{item.accesses}</b><small>{item.lastAccess}</small></span><em className={statusClass(item.status)}>{item.status}</em><div><button onClick={() => onToast(`Link ${item.id} copiado; autenticação e finalidade serão exigidas no acesso.`)}>Copiar link</button><button disabled={item.status !== "Ativo"} onClick={() => revokeShare(item)}>Revogar</button></div></div>)}</article>
    <div className="passport-sharing-flow"><span>TITULAR / REPRESENTANTE</span><i>consente →</i><span>POLÍTICA DE ACESSO</span><i>filtra →</i><span>VISÃO TEMPORÁRIA</span><i>registra →</i><span>TRILHA M11</span></div>
  </div>;

  const views: Record<string, () => React.ReactNode> = {
    "Meus territórios": Territories,
    "Buscar passaporte": SearchPassport,
    "Regularidade": Regularity,
    "Obrigações": Obligations,
    "Evidências": EvidenceVault,
    "Solicitações": Requests,
    "Compartilhamentos": Sharing,
  };
  const ActiveView = views[contextItem] ?? Territories;
  const agentSteps = ["Resolver CHT-ID e papel do usuário", "Consultar atos, obrigações e evidências", "Testar coerência territorial e temporal", "Classificar pendências e materialidade", "Gerar recomendação com limites"];

  return <section className="passport-hub" aria-label={`Passaporte Hídrico — ${contextItem}`}>
    <div className="passport-context-bar"><div><span>PH</span><small>PASSAPORTE ATIVO</small><strong>{selectedPassport.passportId} · {selectedPassport.chtId}</strong></div><div><span>⌖</span><small>CONTEXTO</small><strong>{territory}</strong></div><div><span>◴</span><small>REFERÊNCIA</small><strong>{clockLabel} BRT · fontes versionadas</strong></div><div><span>♢</span><small>ACESSO</small><strong>{selectedPassport.role} · finalidade ativa</strong></div><button onClick={startAgent}>✦ Copiloto do Passaporte</button></div>
    <PassportKpis />
    <ActiveView />

    {evidenceOpen && <div className="passport-modal-backdrop" onMouseDown={() => setEvidenceOpen(false)}><section className="passport-evidence-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>NOVA EVIDÊNCIA · {selectedPassport.passportId}</small><h2>Registrar evidência no passaporte</h2><p>O arquivo bruto, a origem e a finalidade serão preservados.</p></div><button onClick={() => setEvidenceOpen(false)}>×</button></header><div className="passport-modal-grid"><label><span>TIPO DE EVIDÊNCIA</span><select defaultValue="Documento técnico"><option>Documento técnico</option><option>Ato autorizativo</option><option>Representação</option><option>Automonitoramento</option></select></label><label><span>FONTE / CUSTODIANTE</span><input defaultValue="Usuário autorizado" /></label><label className="full"><span>REFERÊNCIA OU URL OFICIAL</span><input defaultValue="DOC-2026-903" /></label><label><span>EMISSÃO</span><input type="date" defaultValue="2026-08-10" /></label><label><span>VALIDADE</span><input type="date" defaultValue="2027-08-10" /></label><label className="full passport-drop"><span>ARQUIVO OU SERVIÇO</span><strong>Solte o documento ou informe uma URL verificável</strong><small>PDF, GeoPackage, CSV ou link oficial · até 25 MB</small></label></div><section><span>VALIDAÇÕES AUTOMÁTICAS</span><p>antivírus · hash · assinatura · metadados · vigência · compatibilidade territorial · duplicidade</p></section><footer><button onClick={() => setEvidenceOpen(false)}>Cancelar</button><button className="primary" onClick={addEvidence}>Registrar e validar →</button></footer></section></div>}

    {shareOpen && <div className="passport-modal-backdrop" onMouseDown={() => setShareOpen(false)}><section className="passport-share-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>CONSENTIMENTO TEMPORÁRIO</small><h2>Novo compartilhamento</h2><p>{selectedPassport.passportId} · acesso mínimo e revogável</p></div><button onClick={() => setShareOpen(false)}>×</button></header><label><span>DESTINATÁRIO</span><input value={shareRecipient} onChange={(event) => setShareRecipient(event.target.value)} /></label><label><span>FINALIDADE OBRIGATÓRIA</span><textarea value={sharePurpose} onChange={(event) => setSharePurpose(event.target.value)} /></label><div className="passport-scope-picker"><span>ESCOPO DE DADOS</span>{["Identidade", "Atos", "Obrigações", "Evidências", "Monitoramento", "Passaporte completo"].map((scope) => <button key={scope} className={shareScopes.includes(scope) ? "selected" : ""} onClick={() => toggleScope(scope)}>{shareScopes.includes(scope) ? "✓" : "+"} {scope}</button>)}</div><div className="passport-share-terms"><label><span>EXPIRAÇÃO</span><select defaultValue="7 dias"><option>24 horas</option><option>7 dias</option><option>14 dias</option></select></label><label><span>AUTENTICAÇÃO</span><select defaultValue="Gov.br verificado"><option>Gov.br verificado</option><option>E-mail + código</option></select></label></div><section><span>GARANTIAS</span><p>O destinatário verá somente os blocos selecionados. Cada acesso será registrado e a revogação terá efeito imediato.</p></section><footer><button onClick={() => setShareOpen(false)}>Cancelar</button><button className="primary" onClick={createShare}>Criar acesso por 7 dias →</button></footer></section></div>}

    {requestOpen && <div className="passport-modal-backdrop" onMouseDown={() => setRequestOpen(false)}><section className="passport-request-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>{selectedRequest.id} · ETAPA {selectedRequest.step + 1}/6</small><h2>{selectedRequest.title}</h2><p>Rascunho preservado no workflow do passaporte.</p></div><button onClick={() => setRequestOpen(false)}>×</button></header><div className="passport-modal-grid"><label><span>CHT-ID / PASSAPORTE</span><input defaultValue={selectedRequest.passportId} /></label><label><span>TIPO DE SOLICITAÇÃO</span><select defaultValue={selectedRequest.type}><option>{selectedRequest.type}</option><option>Retificação cadastral</option><option>Complementação</option></select></label><label className="full"><span>FINALIDADE</span><textarea defaultValue="Comprovar representação e administrar obrigações associadas ao território." /></label><label><span>PAPEL PRETENDIDO</span><select defaultValue="Representante legal"><option>Representante legal</option><option>Responsável técnico</option><option>Consultor autorizado</option></select></label><label><span>VALIDADE DO VÍNCULO</span><input type="date" defaultValue="2027-08-10" /></label></div><div className="passport-request-proof"><span>COMPROVAÇÃO</span><strong>Procuração eletrônica GOV-88217</strong><small>assinatura verificada · escopo compatível</small><b>✓</b></div><footer><button onClick={() => setRequestOpen(false)}>Salvar rascunho</button><button className="primary" onClick={advanceRequest}>{selectedRequest.step === 4 ? "Submeter à autoridade →" : "Validar e avançar →"}</button></footer></section></div>}

    {agentOpen && <div className="passport-agent-backdrop" onMouseDown={() => setAgentOpen(false)}><aside className="passport-agent-drawer" onMouseDown={(event) => event.stopPropagation()}><header><div className="passport-agent-avatar">✦</div><div><small>{agentRunning ? "EXECUÇÃO AO VIVO" : "ANÁLISE CONCLUÍDA"}</small><h2>Copiloto do Passaporte</h2><p>Trace PAS-A02-{selectedPassport.chtId.slice(-6)} · política PAS-HIL-003</p></div><button onClick={() => setAgentOpen(false)}>×</button></header><div className="passport-agent-scopes"><span>ESCOPOS</span><b>Consultar</b><b>Agregar</b><b>Explicar</b><b>Recomendar</b><b className="blocked">Certificar ✕</b></div><section className="passport-agent-plan"><h3>Plano de execução</h3>{agentSteps.map((item, index) => <div key={item} className={index < agentStep ? "done" : index === agentStep ? "running" : "waiting"}><span>{index < agentStep ? "✓" : index === agentStep ? "●" : "○"}</span><div><strong>{item}</strong><small>{index < agentStep ? `${420 + index * 177} ms · evidência registrada` : index === agentStep ? "executando ferramentas autorizadas…" : "aguardando dependência"}</small></div></div>)}</section><section className="passport-agent-sources"><h3>Fontes e grounding</h3>{[["M1 · Identidade", "CHT-ID, endereço, crosswalks", "94%"], ["Águas Brasil", "ato 1142/2024 e obrigações", "100%"], ["Gov.br", "representação e escopo", "100%"], ["M5 · Data Hub", "leituras e lacunas", "82%"]].map((item) => <button key={item[0]}><span>▤</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div><b>{item[2]}</b></button>)}</section><section className="passport-agent-output"><div><h3>Saída estruturada</h3><span>91% confiança</span></div><p><b>Fato:</b> ato vigente, identidade consistente e representação válida.</p><p><b>Pendência:</b> duas leituras ausentes e autodeclaração a vencer em 12 dias.</p><p><b>Recomendação:</b> reconciliar a série no M5 e preparar a obrigação no M4.</p><p><b>Limite:</b> a situação é informacional; não equivale a certidão de regularidade.</p></section><footer><button onClick={() => { setAgentRunning(false); onToast("Execução do copiloto pausada; nenhum efeito externo foi produzido."); }}>■ Pausar</button><button onClick={() => openConsumer("m12")}>Abrir Central de Agentes</button><button className="primary" onClick={() => { setAgentRunning(false); setAgentStep(4); onNavigate("Obrigações"); setAgentOpen(false); }}>Aplicar plano de tratamento →</button></footer></aside></div>}
  </section>;
}
