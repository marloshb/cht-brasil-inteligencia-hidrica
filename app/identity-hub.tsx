"use client";

import { useMemo, useState } from "react";

type Identifier = { source: string; id: string; authority: string; validFrom: string; status: string };

type IdentityRecord = {
  chtId: string;
  name: string;
  type: string;
  status: "Validado" | "Declarado" | "Em curadoria" | "Contestado";
  confidence: number;
  basin: string;
  waterAddress: string;
  authority: string;
  domain: string;
  sourceCount: number;
  version: string;
  updated: string;
  center: [number, number];
  identifiers: Identifier[];
};

type DuplicateCase = {
  id: string;
  leftId: string;
  rightId: string;
  score: number;
  status: "Pendente" | "Fundido" | "Vinculado" | "Mantido separado";
  reasons: string[];
  conflicts: string[];
  createdAt: string;
};

type Crosswalk = {
  id: string;
  chtId: string;
  source: string;
  sourceId: string;
  authority: string;
  validFrom: string;
  validTo: string;
  status: "Ativo" | "Histórico" | "Em validação";
  confidence: number;
};

type QualityIssue = {
  id: string;
  title: string;
  source: string;
  field: string;
  severity: "Alta" | "Média" | "Baixa";
  records: number;
  status: "Aberta" | "Em correção" | "Resolvida";
  rule: string;
};

type IdentityHubProps = {
  contextItem: string;
  territory: string;
  clockLabel: string;
  onNavigate: (item: string) => void;
  onOpenModule: (moduleId: string) => void;
  onOpenAgent: () => void;
  onCreateRecord: () => void;
  onToast: (message: string) => void;
};

const initialRecords: IdentityRecord[] = [
  {
    chtId: "UTH-DF-004918",
    name: "Captação industrial · Ribeirão Mestre d'Armas",
    type: "Interferência superficial",
    status: "Validado",
    confidence: 94,
    basin: "Região Hidrográfica do Paraná",
    waterAddress: "Paraná / Paranaíba / UGRH DF / ottobacia 769943 / Ribeirão Mestre d'Armas",
    authority: "ANA · domínio federal",
    domain: "Federal",
    sourceCount: 5,
    version: "v7",
    updated: "09 ago 2026 · 19:42",
    center: [-47.82, -15.58],
    identifiers: [
      { source: "CNARH", id: "CNARH-35.004.918", authority: "ANA/SRE", validFrom: "2024-03-18", status: "Ativo" },
      { source: "Águas Brasil", id: "INT-2024-11842", authority: "ANA/SRE", validFrom: "2024-03-18", status: "Ativo" },
      { source: "ADASA", id: "DF-OUT-77102", authority: "ADASA", validFrom: "2023-08-09", status: "Referência" },
    ],
  },
  {
    chtId: "UTH-BA-018407",
    name: "Área irrigada · Fazenda Horizonte",
    type: "Unidade produtiva / uso",
    status: "Em curadoria",
    confidence: 88,
    basin: "Região Hidrográfica do São Francisco",
    waterAddress: "São Francisco / Grande / UGRH 07 / ottobacia 744125 / Rio das Fêmeas",
    authority: "INEMA · domínio estadual",
    domain: "Estadual",
    sourceCount: 4,
    version: "v4",
    updated: "09 ago 2026 · 19:31",
    center: [-45.46, -12.32],
    identifiers: [
      { source: "INEMA", id: "BA-OUT-188.407", authority: "INEMA", validFrom: "2022-07-11", status: "Ativo" },
      { source: "SICAR", id: "BA-2911105-A9F2", authority: "SFB/INEMA", validFrom: "2019-04-22", status: "Referência" },
      { source: "SIGEF", id: "901.882.004.170-2", authority: "INCRA", validFrom: "2020-11-03", status: "Referência" },
    ],
  },
  {
    chtId: "EST-45260000",
    name: "Estação fluviométrica São Francisco Norte",
    type: "Estação de monitoramento",
    status: "Validado",
    confidence: 97,
    basin: "Região Hidrográfica do São Francisco",
    waterAddress: "São Francisco / Médio São Francisco / trecho SF-1187",
    authority: "ANA · Rede Hidrometeorológica Nacional",
    domain: "Federal",
    sourceCount: 3,
    version: "v12",
    updated: "09 ago 2026 · 19:54",
    center: [-43.72, -11.34],
    identifiers: [
      { source: "Hidroweb", id: "45260000", authority: "ANA/SGH", validFrom: "1977-01-01", status: "Ativo" },
      { source: "Telemetria", id: "TLM-45260000", authority: "ANA/SGH", validFrom: "2012-06-14", status: "Ativo" },
    ],
  },
  {
    chtId: "UTH-SP-009142",
    name: "Captação urbana · Sistema Noroeste",
    type: "Sistema de abastecimento",
    status: "Validado",
    confidence: 91,
    basin: "Região Hidrográfica do Paraná",
    waterAddress: "Paraná / Tietê / UGRHI 18 / ottobacia 846713",
    authority: "SP Águas · domínio estadual",
    domain: "Estadual",
    sourceCount: 6,
    version: "v9",
    updated: "09 ago 2026 · 18:42",
    center: [-50.1, -20.4],
    identifiers: [
      { source: "SP Águas", id: "DAEE-OUT-009142", authority: "SP Águas", validFrom: "2021-10-01", status: "Ativo" },
      { source: "CNARH", id: "CNARH-SP-9142", authority: "ANA/SRE", validFrom: "2022-02-15", status: "Ativo" },
    ],
  },
  {
    chtId: "UTH-MT-001782",
    name: "Barramento de regularização · Alto Paraguai",
    type: "Infraestrutura hídrica",
    status: "Declarado",
    confidence: 86,
    basin: "Região Hidrográfica do Paraguai",
    waterAddress: "Paraguai / Alto Paraguai / UGRH P2 / ottobacia 896221",
    authority: "SEMA-MT · domínio estadual",
    domain: "Estadual",
    sourceCount: 3,
    version: "v3",
    updated: "08 ago 2026 · 16:09",
    center: [-54.6, -16.2],
    identifiers: [
      { source: "SEMA-MT", id: "MT-BAR-01782", authority: "SEMA-MT", validFrom: "2025-01-21", status: "Ativo" },
      { source: "SNISB", id: "SNISB-81877", authority: "ANA/SNB", validFrom: "2025-03-08", status: "Ativo" },
    ],
  },
];

const initialDuplicates: DuplicateCase[] = [
  { id: "DUP-2026-0441", leftId: "UTH-BA-018407", rightId: "SRC-INEMA-188407", score: 96, status: "Pendente", reasons: ["geometrias com IoU 0,98", "mesma finalidade e razão social", "outorga coincidente"], conflicts: ["vazão declarada 42 L/s × 47 L/s"], createdAt: "19:31:08" },
  { id: "DUP-2026-0438", leftId: "UTH-DF-004918", rightId: "SRC-ADASA-77102", score: 89, status: "Pendente", reasons: ["coordenadas a 18 m", "mesmo empreendimento", "corpo hídrico compatível"], conflicts: ["domínio divergente", "nome do trecho desatualizado"], createdAt: "18:58:42" },
  { id: "DUP-2026-0429", leftId: "UTH-SP-009142", rightId: "SRC-CNARH-SP-9142", score: 78, status: "Pendente", reasons: ["identificador semelhante", "finalidade abastecimento"], conflicts: ["geometrias a 2,8 km", "responsáveis distintos"], createdAt: "17:44:16" },
  { id: "DUP-2026-0417", leftId: "UTH-MT-001782", rightId: "SRC-SNISB-81877", score: 93, status: "Vinculado", reasons: ["mesma barragem", "coordenada compatível", "responsável coincidente"], conflicts: [], createdAt: "15:02:09" },
];

const initialCrosswalks: Crosswalk[] = [
  { id: "XW-001", chtId: "UTH-DF-004918", source: "CNARH", sourceId: "CNARH-35.004.918", authority: "ANA/SRE", validFrom: "2024-03-18", validTo: "—", status: "Ativo", confidence: 100 },
  { id: "XW-002", chtId: "UTH-DF-004918", source: "ADASA", sourceId: "DF-OUT-77102", authority: "ADASA", validFrom: "2023-08-09", validTo: "—", status: "Ativo", confidence: 89 },
  { id: "XW-003", chtId: "UTH-BA-018407", source: "INEMA", sourceId: "BA-OUT-188.407", authority: "INEMA", validFrom: "2022-07-11", validTo: "—", status: "Ativo", confidence: 100 },
  { id: "XW-004", chtId: "UTH-BA-018407", source: "SICAR", sourceId: "BA-2911105-A9F2", authority: "SFB/INEMA", validFrom: "2019-04-22", validTo: "—", status: "Ativo", confidence: 92 },
  { id: "XW-005", chtId: "EST-45260000", source: "Hidroweb", sourceId: "45260000", authority: "ANA/SGH", validFrom: "1977-01-01", validTo: "—", status: "Ativo", confidence: 100 },
  { id: "XW-006", chtId: "UTH-SP-009142", source: "CNARH", sourceId: "CNARH-SP-9142", authority: "ANA/SRE", validFrom: "2022-02-15", validTo: "—", status: "Em validação", confidence: 78 },
];

const initialQualityIssues: QualityIssue[] = [
  { id: "QLT-0184", title: "Domínio incompatível com geometria", source: "ADASA", field: "waterDomain", severity: "Alta", records: 18, status: "Aberta", rule: "ID-RULE-014" },
  { id: "QLT-0179", title: "Coordenadas fora do trecho associado", source: "CNARH", field: "geometry", severity: "Alta", records: 7, status: "Em correção", rule: "GEO-TOPO-008" },
  { id: "QLT-0171", title: "Identificador sem vigência", source: "INEMA", field: "validTime", severity: "Média", records: 46, status: "Aberta", rule: "TEMP-004" },
  { id: "QLT-0164", title: "Código de ottobacia legado", source: "Estado piloto", field: "hydroAddress", severity: "Média", records: 112, status: "Aberta", rule: "BHO6-XW-002" },
  { id: "QLT-0158", title: "Nome sem padronização", source: "SICAR", field: "displayName", severity: "Baixa", records: 384, status: "Resolvida", rule: "TXT-NORM-001" },
];

const versions = [
  { version: "v7", date: "09 ago 2026 · 19:42", author: "Marina Alves", event: "Crosswalk ADASA validado", reason: "Curadoria DUP-2026-0438", hash: "9f2d18a" },
  { version: "v6", date: "07 ago 2026 · 15:21", author: "A01 + curador", event: "Endereço hídrico recalculado", reason: "Publicação BHO6 2026.07", hash: "84ab09c" },
  { version: "v5", date: "18 jul 2026 · 11:08", author: "Pipeline federado", event: "Identificador CNARH atualizado", reason: "Evento regulatory.act.changed", hash: "3bc102e" },
  { version: "v4", date: "02 jun 2026 · 09:44", author: "João Pereira", event: "Geometria retificada", reason: "Evidência de campo", hash: "771e4c2" },
  { version: "v3", date: "14 mar 2026 · 17:16", author: "Importação", event: "UTH criada", reason: "Lote CNARH 2026.03", hash: "113ac8d" },
];

const relationships = [
  { id: "REL-001", type: "localizado_em", target: "OTT-769943", label: "Ottobacia 769943", module: "m6", direction: "territorial", confidence: 100 },
  { id: "REL-002", type: "capta_de", target: "TRE-PRB-1182", label: "Trecho Ribeirão Mestre d'Armas", module: "m4", direction: "uso", confidence: 98 },
  { id: "REL-003", type: "regulado_por", target: "ORG-ANA-SRE", label: "ANA · SRE", module: "m3", direction: "regulatório", confidence: 100 },
  { id: "REL-004", type: "monitorado_por", target: "EST-60435000", label: "Estação 60435000", module: "m5", direction: "observação", confidence: 91 },
  { id: "REL-005", type: "jusante_de", target: "TRE-PRB-1179", label: "Trecho PRB-1179", module: "m6", direction: "hidrológico", confidence: 97 },
  { id: "REL-006", type: "possui_ato", target: "ATO-ANA-1142-24", label: "Outorga ANA 1142/2024", module: "m4", direction: "regulatório", confidence: 100 },
];

const sourceCatalog = [
  ["Águas Brasil / CNARH", "API + evento", "SRE", "Ativo", "18 s", "98"],
  ["SNIRH / BHO6", "Feature Service", "SHE", "Ativo", "v2026.07", "97"],
  ["INEMA · Bahia", "OGC + lote", "OGERH", "Parcial", "16 min", "86"],
  ["SICAR / CAR", "serviço", "SFB", "Ativo", "24 h", "92"],
  ["SIGEF", "consulta", "INCRA", "Ativo", "24 h", "94"],
  ["Hidroweb / RHN", "API", "SGH", "Ativo", "42 s", "96"],
];

const statusClass = (value: string) => value.toLowerCase().replaceAll(" ", "-").replace("é", "e");

export function IdentityHub({ contextItem, territory, clockLabel, onNavigate, onOpenModule, onOpenAgent, onCreateRecord, onToast }: IdentityHubProps) {
  const [records, setRecords] = useState(initialRecords);
  const [selectedId, setSelectedId] = useState(initialRecords[0].chtId);
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState("Todos os identificadores");
  const [searched, setSearched] = useState(false);
  const [duplicates, setDuplicates] = useState(initialDuplicates);
  const [selectedDuplicateId, setSelectedDuplicateId] = useState(initialDuplicates[0].id);
  const [crosswalks, setCrosswalks] = useState(initialCrosswalks);
  const [qualityIssues, setQualityIssues] = useState(initialQualityIssues);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [crosswalkOpen, setCrosswalkOpen] = useState(false);
  const [newSource, setNewSource] = useState("CNARH");
  const [newSourceId, setNewSourceId] = useState("");
  const [compareVersion, setCompareVersion] = useState("v6");
  const [importStep, setImportStep] = useState(0);
  const [importSource, setImportSource] = useState("Feature Service estadual");
  const [importExecuted, setImportExecuted] = useState(false);
  const [relationFilter, setRelationFilter] = useState("Todas");

  const selectedRecord = records.find((record) => record.chtId === selectedId) ?? records[0];
  const selectedDuplicate = duplicates.find((item) => item.id === selectedDuplicateId) ?? duplicates[0];
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((record) => {
      const identifiers = record.identifiers.map((item) => `${item.source} ${item.id}`).join(" ");
      return `${record.chtId} ${record.name} ${record.type} ${record.waterAddress} ${identifiers}`.toLowerCase().includes(normalized);
    });
  }, [query, records]);

  const filteredRelations = relationFilter === "Todas" ? relationships : relationships.filter((item) => item.direction === relationFilter);

  const focusRecord = (record: IdentityRecord) => {
    setSelectedId(record.chtId);
    window.dispatchEvent(new CustomEvent("cht:focus-map", { detail: { center: record.center, zoom: 8, label: `${record.chtId} · ${record.name}`, source: `Núcleo de Identidade · ${record.sourceCount} fontes`, confidence: record.confidence } }));
    onToast(`${record.chtId} selecionado; mapa, crosswalks, relações e histórico receberam o mesmo contexto.`);
  };

  const emitTowerAlert = (title: string, severity: string, detail: string, chtId: string) => {
    const eventId = `ID-EVT-${Date.now().toString(16).slice(-6).toUpperCase()}`;
    window.dispatchEvent(new CustomEvent("cht:module-event", { detail: { eventId, type: "identity.match.suspect", title, severity, source: "M1 · Núcleo de Identidade", module: "m1", moduleName: "Identidade Hídrica", territory: selectedRecord.basin, confidence: selectedDuplicate.score, chtId, recommendation: detail, occurredAt: clockLabel } }));
  };

  const resolveDuplicate = (status: DuplicateCase["status"]) => {
    setDuplicates((items) => items.map((item) => item.id === selectedDuplicate.id ? { ...item, status } : item));
    if (status === "Fundido") {
      setRecords((items) => items.map((item) => item.chtId === selectedDuplicate.leftId ? { ...item, sourceCount: item.sourceCount + 1, confidence: Math.max(item.confidence, selectedDuplicate.score), version: `v${Number(item.version.slice(1)) + 1}`, updated: `09 ago 2026 · ${clockLabel}` } : item));
      setCrosswalks((items) => [...items, { id: `XW-${String(items.length + 1).padStart(3, "0")}`, chtId: selectedDuplicate.leftId, source: "Fonte federada", sourceId: selectedDuplicate.rightId, authority: "Autoridade na fonte", validFrom: "2026-08-09", validTo: "—", status: "Ativo", confidence: selectedDuplicate.score }]);
      onToast(`${selectedDuplicate.id} fundido com revisão humana; nova versão e crosswalk reversível publicados.`);
    } else if (status === "Mantido separado") {
      emitTowerAlert("Correspondência mantida como exceção", selectedDuplicate.score < 85 ? "Alto" : "Médio", "Par de identidade exige acompanhamento e possível evidência adicional.", selectedDuplicate.leftId);
      onToast(`${selectedDuplicate.id} mantido separado; exceção e justificativa enviadas à Torre de Controle.`);
    } else {
      onToast(`${selectedDuplicate.id} vinculado sem fusão; identidades e autoridades permanecem independentes.`);
    }
    setMergeOpen(false);
  };

  const addCrosswalk = () => {
    if (!newSourceId.trim()) {
      onToast("Informe o identificador da fonte antes de criar o crosswalk.");
      return;
    }
    const item: Crosswalk = { id: `XW-${String(crosswalks.length + 1).padStart(3, "0")}`, chtId: selectedRecord.chtId, source: newSource, sourceId: newSourceId.trim(), authority: "Pendente de confirmação", validFrom: "2026-08-09", validTo: "—", status: "Em validação", confidence: 76 };
    setCrosswalks((items) => [item, ...items]);
    setNewSourceId("");
    setCrosswalkOpen(false);
    onToast(`${item.id} criado em validação; autoridade e vigência serão confirmadas antes da publicação.`);
  };

  const handleQualityIssue = (issue: QualityIssue) => {
    setQualityIssues((items) => items.map((item) => item.id === issue.id ? { ...item, status: "Em correção" } : item));
    emitTowerAlert(issue.title, issue.severity === "Alta" ? "Alto" : "Médio", `${issue.records} registros foram enviados para a fila de correção ${issue.rule}.`, selectedRecord.chtId);
    onToast(`${issue.id} encaminhada à curadoria; alerta correlacionado disponível na Torre de Controle.`);
  };

  const executeImport = () => {
    if (importStep < 3) {
      setImportStep((step) => step + 1);
      onToast(["Fonte conectada e metadados recuperados.", "Mapeamento salvo como contrato versionado.", "Validação concluída: 97,4% aptos e 18 exceções."][importStep]);
      return;
    }
    if (importExecuted) {
      onToast("Este lote já foi processado; use uma nova seed para outra demonstração.");
      return;
    }
    const imported: IdentityRecord = {
      chtId: "UTH-BA-018426",
      name: "Interferência importada · lote piloto BA",
      type: "Captação superficial",
      status: "Em curadoria",
      confidence: 84,
      basin: "Região Hidrográfica do São Francisco",
      waterAddress: "São Francisco / Grande / UGRH 07 / endereço calculado",
      authority: "INEMA · domínio estadual",
      domain: "Estadual",
      sourceCount: 2,
      version: "v1",
      updated: `09 ago 2026 · ${clockLabel}`,
      center: [-45.31, -12.18],
      identifiers: [{ source: "INEMA", id: "BA-IMP-2026-18426", authority: "INEMA", validFrom: "2026-08-09", status: "Em validação" }],
    };
    setRecords((items) => [imported, ...items]);
    setSelectedId(imported.chtId);
    setImportExecuted(true);
    emitTowerAlert("Importação federada com exceções", "Médio", "Lote processado: 982 identidades publicadas, 18 exceções e 6 candidatos a duplicidade.", imported.chtId);
    window.dispatchEvent(new CustomEvent("cht:focus-map", { detail: { center: imported.center, zoom: 8, label: `${imported.chtId} · ${imported.name}`, source: "Importação federada INEMA", confidence: imported.confidence } }));
    onToast("Lote publicado: 982 CHT-IDs, 18 exceções e eventos distribuídos a M0, M4 e M11.");
  };

  const HeaderStats = () => (
    <div className="identity-kpis">
      <article><span>CHT-IDs ATIVOS</span><strong>12,84 mi</strong><small>+18.426 no ciclo</small><i style={{ width: "96%" }} /></article>
      <article><span>COBERTURA PILOTO</span><strong>96,2%</strong><small>meta 95% superada</small><i style={{ width: "96.2%" }} /></article>
      <article><span>FILA DE DUPLICIDADES</span><strong>{duplicates.filter((item) => item.status === "Pendente").length}</strong><small>2 acima de 85%</small><i className="warn" style={{ width: "72%" }} /></article>
      <article><span>QUALIDADE DE IDENTIDADE</span><strong>94,1</strong><small>↑ 1,6 pt</small><i style={{ width: "94.1%" }} /></article>
    </div>
  );

  const Search = () => (
    <div className="identity-search-layout">
      <article className="panel identity-search-panel">
        <header className="panel-header"><div><h2>Busca mestre multichave</h2><p>CHT-ID, código de origem, ato, imóvel, coordenada ou nome</p></div><span className="identity-index-status"><i /> índice sincronizado</span></header>
        <div className="identity-search-box"><div><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && setSearched(true)} placeholder="Ex.: UTH-DF-004918, CNARH-35.004.918, -47.82,-15.58…" /><select value={searchMode} onChange={(event) => setSearchMode(event.target.value)}><option>Todos os identificadores</option><option>Somente CHT-ID</option><option>Fontes federadas</option><option>Coordenada / geometria</option></select><button onClick={() => { setSearched(true); onToast(`${searchResults.length} identidades encontradas no índice mestre.`); }}>Buscar</button></div><div className="identity-search-hints"><span>Busca semântica</span><span>Geocodificação</span><span>CPF/CNPJ mascarado</span><span>Autoridade na fonte</span></div></div>
        <div className="identity-result-head"><span>{searched ? `${searchResults.length} RESULTADOS` : "REGISTROS RECENTES"}</span><button onClick={() => { setQuery(""); setSearched(false); }}>Limpar filtros</button></div>
        <div className="identity-results">{searchResults.map((record) => <button key={record.chtId} className={record.chtId === selectedRecord.chtId ? "selected" : ""} onClick={() => focusRecord(record)}><span className={`identity-type-icon ${record.status.toLowerCase().replace(" ", "-")}`}>{record.type.includes("Estação") ? "ES" : record.type.includes("Infra") ? "IH" : "UT"}</span><div><small>{record.chtId} · {record.type}</small><strong>{record.name}</strong><p>⌖ {record.waterAddress}</p></div><span className={`identity-status ${statusClass(record.status)}`}><i />{record.status}</span><b>{record.confidence}%</b><i>→</i></button>)}</div>
      </article>
      <aside className="panel identity-master-card">
        <header><div><span className="identity-record-mark">ID</span><div><small>GOLDEN RECORD · {selectedRecord.version}</small><h2>{selectedRecord.name}</h2><p>{selectedRecord.chtId}</p></div></div><button onClick={() => onNavigate("Versões")}>Histórico ↗</button></header>
        <div className="identity-trust"><div><span>CONFIANÇA</span><strong>{selectedRecord.confidence}%</strong></div><div className="identity-trust-bar"><i style={{ width: `${selectedRecord.confidence}%` }} /></div><span className={`identity-status ${statusClass(selectedRecord.status)}`}><i />{selectedRecord.status}</span></div>
        <section><h3>Endereço hídrico</h3><p>{selectedRecord.waterAddress}</p><div className="identity-tags"><span>{selectedRecord.domain}</span><span>{selectedRecord.authority}</span></div></section>
        <section><h3>Identificadores relacionados</h3>{selectedRecord.identifiers.map((identifier) => <button key={`${identifier.source}-${identifier.id}`} onClick={() => onNavigate("Crosswalks")}><span>{identifier.source.slice(0, 2)}</span><div><strong>{identifier.id}</strong><small>{identifier.source} · {identifier.authority}</small></div><b>{identifier.status}</b></button>)}</section>
        <section className="identity-provenance"><h3>Proveniência</h3><div><span>Fontes</span><strong>{selectedRecord.sourceCount}</strong></div><div><span>Última atualização</span><strong>{selectedRecord.updated}</strong></div><div><span>Versão</span><strong>{selectedRecord.version} · histórico preservado</strong></div></section>
        <footer><button onClick={() => onNavigate("Relações")}>Explorar relações</button><button onClick={onOpenAgent}>✦ Explicar identidade</button><button className="primary" onClick={onCreateRecord}>Editar / versionar</button></footer>
      </aside>
    </div>
  );

  const Registry = () => (
    <div className="identity-registry">
      <header className="identity-section-toolbar"><div><h2>Registro de Unidades Territoriais Hídricas</h2><p>Identidade, endereço, autoridade, confiança e ciclo de vida</p></div><div><button onClick={() => onToast("Filtros avançados abertos: tipo, status, domínio, fonte e confiança.")}>☷ Filtros</button><button onClick={() => onNavigate("Importação")}>⇧ Importar</button><button className="primary" onClick={onCreateRecord}>＋ Nova UTH</button></div></header>
      <div className="panel identity-registry-table"><div className="identity-table-head"><span>CHT-ID / OBJETO</span><span>ENDEREÇO HÍDRICO</span><span>AUTORIDADE</span><span>FONTES</span><span>CONFIANÇA</span><span>STATUS</span><span /></div>{records.map((record) => <button key={record.chtId} className={record.chtId === selectedRecord.chtId ? "selected" : ""} onClick={() => focusRecord(record)}><div><strong>{record.chtId}</strong><small>{record.name} · {record.type}</small></div><span>{record.waterAddress}</span><span>{record.authority}</span><b>{record.sourceCount}</b><time>{record.confidence}%</time><em className={statusClass(record.status)}><i />{record.status}</em><i>→</i></button>)}</div>
      <div className="identity-lifecycle panel"><header className="panel-header"><div><h2>Ciclo de vida e salvaguardas</h2><p>O identificador nunca é reutilizado e o histórico nunca é apagado</p></div></header><div>{[["01", "Rascunho", "geometria e fonte recebidas"], ["02", "Em curadoria", "endereço e candidatos calculados"], ["03", "Ativo", "CHT-ID publicado e eventos emitidos"], ["04", "Retificado", "nova versão preserva a anterior"], ["05", "Desativado", "motivo, sucessor e vigência registrados"]].map((item, index) => <div key={item[1]}><span>{item[0]}</span><strong>{item[1]}</strong><small>{item[2]}</small>{index < 4 && <i>→</i>}</div>)}</div></div>
    </div>
  );

  const Duplicates = () => (
    <div className="identity-duplicates-layout">
      <article className="panel identity-duplicate-queue"><header className="panel-header"><div><h2>Fila de resolução de entidades</h2><p>Score, evidências, conflitos e decisão reversível</p></div><button onClick={onOpenAgent}>✦ Executar A01</button></header><div className="identity-duplicate-list">{duplicates.map((item) => <button key={item.id} className={item.id === selectedDuplicate.id ? "selected" : ""} onClick={() => { setSelectedDuplicateId(item.id); const record = records.find((entry) => entry.chtId === item.leftId); if (record) focusRecord(record); }}><span className={`duplicate-score s${Math.floor(item.score / 10)}`}>{item.score}</span><div><small>{item.id} · {item.createdAt}</small><strong>{item.leftId}</strong><p>↔ {item.rightId}</p></div><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</div></article>
      <article className="panel identity-duplicate-review"><header><div><small>{selectedDuplicate.id} · CANDIDATO</small><h2>Comparação lado a lado</h2></div><span className="duplicate-match"><b>{selectedDuplicate.score}%</b> correspondência</span></header><div className="identity-compare-cards"><section><span>CHT · GOLDEN RECORD</span><strong>{selectedDuplicate.leftId}</strong><p>{records.find((item) => item.chtId === selectedDuplicate.leftId)?.name ?? "Registro mestre"}</p><small>autoridade e versão preservadas</small></section><div>↔</div><section><span>FONTE FEDERADA</span><strong>{selectedDuplicate.rightId}</strong><p>Registro recebido por contrato de integração</p><small>autoridade permanece na origem</small></section></div><section className="identity-match-reasons"><h3>Evidências favoráveis</h3>{selectedDuplicate.reasons.map((reason) => <p key={reason}><span>✓</span>{reason}</p>)}</section><section className="identity-match-conflicts"><h3>Divergências a decidir</h3>{selectedDuplicate.conflicts.length ? selectedDuplicate.conflicts.map((conflict) => <p key={conflict}><span>!</span>{conflict}</p>) : <p><span>✓</span>nenhuma divergência crítica</p>}</section><div className="identity-agent-rationale"><span>✦</span><div><strong>Agente de Identidade A01</strong><p>{selectedDuplicate.score >= 90 ? "Alta probabilidade de correspondência. Recomenda vincular ou fundir após revisar a divergência de atributo." : "Correspondência insuficiente para fusão automática. Solicite evidência ou mantenha separado."}</p></div><b>{selectedDuplicate.score}%</b></div><footer><button onClick={() => resolveDuplicate("Mantido separado")}>Manter separados</button><button onClick={() => resolveDuplicate("Vinculado")}>Vincular sem fundir</button><button className="primary" disabled={selectedDuplicate.status !== "Pendente"} onClick={() => setMergeOpen(true)}>Revisar fusão →</button></footer></article>
    </div>
  );

  const Crosswalks = () => (
    <div className="identity-crosswalks">
      <header className="identity-section-toolbar"><div><h2>Crosswalks e autoridade na fonte</h2><p>Correspondência bidirecional, temporal e versionada entre identificadores</p></div><div><button onClick={() => onToast("Crosswalks exportados em JSON com vigência e proveniência.")}>⇩ Exportar</button><button className="primary" onClick={() => setCrosswalkOpen(true)}>＋ Novo crosswalk</button></div></header>
      <div className="identity-crosswalk-summary"><article><span>ATIVOS</span><strong>{crosswalks.filter((item) => item.status === "Ativo").length}</strong><small>6 fontes federadas</small></article><article><span>EM VALIDAÇÃO</span><strong>{crosswalks.filter((item) => item.status === "Em validação").length}</strong><small>exigem curador</small></article><article><span>COBERTURA</span><strong>95,7%</strong><small>objetos piloto</small></article><article><span>ERRO MEDIDO</span><strong>1,3%</strong><small>amostra auditada</small></article></div>
      <article className="panel identity-crosswalk-table"><div className="identity-xw-head"><span>CHT-ID</span><span>FONTE / IDENTIFICADOR</span><span>AUTORIDADE</span><span>VIGÊNCIA</span><span>CONFIANÇA</span><span>STATUS</span><span /></div>{crosswalks.map((item) => <button key={item.id} onClick={() => { const record = records.find((entry) => entry.chtId === item.chtId); if (record) focusRecord(record); }}><strong>{item.chtId}</strong><div><span>{item.source}</span><b>{item.sourceId}</b></div><span>{item.authority}</span><time>{item.validFrom} → {item.validTo}</time><b>{item.confidence}%</b><em className={statusClass(item.status)}>{item.status}</em><i>→</i></button>)}</article>
      <div className="identity-xw-contract"><span>CONTRATO DE CROSSWALK</span><p>`chtId`, `sourceSystem`, `sourceId`, `authority`, `validTime`, `confidence`, `version` e `provenance` são obrigatórios. Atualizações nunca apagam a correspondência anterior.</p><button onClick={() => onOpenModule("m11")}>Abrir governança de dados →</button></div>
    </div>
  );

  const Relations = () => (
    <div className="identity-relations-layout">
      <article className="panel identity-graph"><header className="panel-header"><div><h2>Grafo territorial e hídrico</h2><p>Relações espaciais, hidrológicas, regulatórias e operacionais</p></div><div className="identity-relation-filters">{["Todas", "territorial", "hidrológico", "regulatório", "observação"].map((item) => <button key={item} className={relationFilter === item ? "active" : ""} onClick={() => setRelationFilter(item)}>{item}</button>)}</div></header><div className="identity-graph-canvas"><div className="identity-graph-core"><span>CHT-ID</span><strong>{selectedRecord.chtId}</strong><small>{selectedRecord.type}</small></div>{filteredRelations.map((relation, index) => <button key={relation.id} className={`graph-node n${index + 1}`} onClick={() => onOpenModule(relation.module)}><span>{relation.type}</span><strong>{relation.label}</strong><small>{relation.target} · {relation.confidence}%</small></button>)}<div className="graph-line gl1" /><div className="graph-line gl2" /><div className="graph-line gl3" /><div className="graph-line gl4" /><div className="graph-line gl5" /><div className="graph-line gl6" /></div><footer><span>6 relações ativas · 4 domínios</span><button onClick={() => onToast("Relação em modo de desenho; origem, destino, vigência e evidência serão obrigatórios.")}>＋ Criar relação</button></footer></article>
      <aside className="panel identity-relation-list"><header className="panel-header"><div><h2>Relações do objeto</h2><p>Selecione para abrir o consumidor</p></div></header>{relationships.map((relation) => <button key={relation.id} onClick={() => onOpenModule(relation.module)}><span className={`relation-kind ${relation.direction}`}>{relation.direction.slice(0, 2).toUpperCase()}</span><div><small>{relation.type}</small><strong>{relation.label}</strong><p>{relation.target} · confiança {relation.confidence}%</p></div><b>{relation.module.toUpperCase()} ↗</b></button>)}<div className="identity-relation-rule"><span>REGRA DE COERÊNCIA</span><p>Toda relação possui vigência, fonte, confiança e versão. Relações inferidas permanecem distintas das relações validadas.</p></div></aside>
    </div>
  );

  const Versions = () => {
    const current = versions[0];
    const compared = versions.find((item) => item.version === compareVersion) ?? versions[1];
    return (
      <div className="identity-versions-layout">
        <article className="panel identity-version-timeline"><header className="panel-header"><div><h2>Histórico imutável</h2><p>{selectedRecord.chtId} · temporalidade e proveniência</p></div><span className="identity-current-version">ATUAL {selectedRecord.version}</span></header><div>{versions.map((item, index) => <button key={item.version} className={compareVersion === item.version ? "selected" : ""} onClick={() => setCompareVersion(item.version)}><span>{index === 0 ? "●" : "○"}</span><div><small>{item.version} · {item.date}</small><strong>{item.event}</strong><p>{item.reason}</p><em>{item.author} · hash {item.hash}</em></div>{index === 0 && <b>ATUAL</b>}</button>)}</div></article>
        <article className="panel identity-version-compare"><header><div><small>COMPARAÇÃO DE VERSÕES</small><h2>{current.version} atual × {compared.version}</h2></div><button onClick={() => onToast("Comparação exportada com atributos, fontes e justificativas.")}>⇩ Exportar diff</button></header><div className="identity-diff-summary"><div><span>ATRIBUTOS ALTERADOS</span><strong>{compared.version === "v6" ? 3 : 7}</strong></div><div><span>RELAÇÕES</span><strong>+1</strong></div><div><span>FONTES</span><strong>+1</strong></div><div><span>GEOMETRIA</span><strong>compatível</strong></div></div><div className="identity-diff-table"><div><span>ATRIBUTO</span><span>{compared.version}</span><span>{current.version}</span><span>MOTIVO</span></div><div><strong>hydroAddress</strong><span>ottobacia 769941</span><b>ottobacia 769943</b><em>BHO6 2026.07</em></div><div><strong>waterDomain</strong><span>estadual</span><b>federal</b><em>curadoria competência</em></div><div><strong>sourceCount</strong><span>4</span><b>5</b><em>crosswalk ADASA</em></div></div><section className="identity-rollback"><span>REVERSÃO GOVERNADA</span><p>Uma reversão cria nova versão baseada no estado selecionado; nunca apaga versões nem reutiliza identificadores.</p><button onClick={() => onToast(`Solicitação de reversão baseada em ${compared.version} criada para aprovação do curador.`)}>Solicitar nova versão baseada em {compared.version}</button></section></article>
      </div>
    );
  };

  const Quality = () => (
    <div className="identity-quality">
      <div className="identity-quality-kpis"><article><span>COMPLETUDE</span><strong>97,4%</strong><small>meta 96%</small><i style={{ width: "97.4%" }} /></article><article><span>CONSISTÊNCIA</span><strong>94,1%</strong><small>↑ 1,6 pt</small><i style={{ width: "94.1%" }} /></article><article><span>UNICIDADE</span><strong>98,7%</strong><small>3 candidatos críticos</small><i style={{ width: "98.7%" }} /></article><article><span>TEMPORALIDADE</span><strong>92,8%</strong><small>46 vigências ausentes</small><i className="warn" style={{ width: "92.8%" }} /></article></div>
      <article className="panel identity-quality-source"><header className="panel-header"><div><h2>Qualidade por fonte</h2><p>Score, cobertura, frescor e contrato</p></div><button onClick={() => onOpenModule("m11")}>Abrir contratos ↗</button></header>{sourceCatalog.map((source) => <button key={source[0]} onClick={() => onToast(`${source[0]}: regras, lineage e amostra de erro carregados.`)}><div><i className={source[3] === "Ativo" ? "ok" : "warn"} /><span><strong>{source[0]}</strong><small>{source[1]} · custodiante {source[2]}</small></span></div><span>{source[4]}</span><div className="identity-source-score"><i style={{ width: `${source[5]}%` }} /></div><b>{source[5]}</b><em>{source[3]}</em></button>)}</article>
      <article className="panel identity-quality-issues"><header className="panel-header"><div><h2>Fila de inconsistências</h2><p>Regras explicáveis e correção sem alterar o bruto</p></div><span>{qualityIssues.filter((item) => item.status !== "Resolvida").length} abertas</span></header><div className="identity-issue-head"><span>INCONSISTÊNCIA</span><span>FONTE / CAMPO</span><span>REGISTROS</span><span>STATUS</span><span /></div>{qualityIssues.map((issue) => <div key={issue.id}><span className={`issue-severity ${issue.severity.toLowerCase().replace("é", "e")}`}>!</span><div><small>{issue.id} · {issue.rule}</small><strong>{issue.title}</strong></div><span>{issue.source}<small>{issue.field}</small></span><b>{issue.records}</b><em className={statusClass(issue.status)}>{issue.status}</em><button disabled={issue.status === "Resolvida"} onClick={() => handleQualityIssue(issue)}>{issue.status === "Aberta" ? "Encaminhar →" : "Abrir caso ↗"}</button></div>)}</article>
    </div>
  );

  const Import = () => (
    <div className="identity-import">
      <header className="identity-section-toolbar"><div><h2>Importação federada governada</h2><p>Fonte → mapeamento → validação → identidade → eventos</p></div><span className="identity-import-seed">LOTE DEMO-BA-2026-08</span></header>
      <div className="identity-import-steps">{["Fonte", "Mapeamento", "Validação", "Execução"].map((step, index) => <button key={step} className={index === importStep ? "active" : index < importStep ? "done" : ""} onClick={() => index <= importStep && setImportStep(index)}><span>{index < importStep ? "✓" : index + 1}</span><div><strong>{step}</strong><small>{["conector e autoridade", "campos e contratos", "qualidade e candidatos", "publicação e eventos"][index]}</small></div>{index < 3 && <i>→</i>}</button>)}</div>
      {importStep === 0 && <div className="identity-import-source"><article className="panel"><header className="panel-header"><div><h2>Selecione a origem</h2><p>Conectores preservam a autoridade e o identificador original</p></div></header><div>{["Feature Service estadual", "OGC API Features", "Arquivo GeoPackage / CSV", "API REST / evento"].map((source) => <button key={source} className={importSource === source ? "selected" : ""} onClick={() => setImportSource(source)}><span>{source.includes("Feature") ? "FS" : source.includes("OGC") ? "OG" : source.includes("Arquivo") ? "AR" : "AP"}</span><div><strong>{source}</strong><small>{source === "Feature Service estadual" ? "https://servicos.inema.ba.gov.br/.../FeatureServer" : "contrato configurável e versionado"}</small></div><i>{importSource === source ? "✓" : "→"}</i></button>)}</div></article><aside className="panel"><header className="panel-header"><div><h2>Metadados da fonte</h2><p>Descoberta automática</p></div></header><dl><div><dt>Custodiante</dt><dd>INEMA · Bahia</dd></div><div><dt>SRID</dt><dd>4674 · SIRGAS 2000</dd></div><div><dt>Feições</dt><dd>1.024 registros</dd></div><div><dt>Última edição</dt><dd>09 ago 2026 · 18:44</dd></div><div><dt>Classificação</dt><dd>restrito operacional</dd></div></dl></aside></div>}
      {importStep === 1 && <article className="panel identity-mapping"><header className="panel-header"><div><h2>Mapeamento do contrato</h2><p>Origem → modelo canônico CHT</p></div><span>8/8 obrigatórios</span></header><div className="identity-mapping-head"><span>CAMPO DE ORIGEM</span><span>CAMPO CHT</span><span>TRANSFORMAÇÃO</span><span>VALIDAÇÃO</span></div>{[["OBJECTID", "sourceId", "string(INEMA)", "único"], ["GEOMETRY", "geometry", "project(4674→4326)", "topologia"], ["NR_OUTORGA", "identifiers[]", "trim + namespace", "não vazio"], ["VAZAO_L_S", "use.volume", "decimal L/s", "> 0"], ["FINALIDADE", "use.purpose", "domain map v3", "vocabulário"], ["DT_VALIDADE", "validTime", "ISO-8601", "intervalo"], ["BACIA", "hydroAddress", "overlay BHO6", "espacial"], ["ORGAO", "authority", "constant INEMA", "contrato"]].map((row) => <div key={row[0]}><strong>{row[0]}</strong><span>→ {row[1]}</span><code>{row[2]}</code><b>✓ {row[3]}</b></div>)}</article>}
      {importStep === 2 && <div className="identity-validation"><article className="panel"><header className="panel-header"><div><h2>Resultado da validação</h2><p>Contrato, qualidade, identidade e geografia</p></div><span className="validation-pass">APTO COM EXCEÇÕES</span></header><div className="identity-validation-score"><strong>97,4%</strong><div><i style={{ width: "97.4%" }} /></div><span>998 de 1.024 registros aptos</span></div><div className="identity-validation-gates">{[["Esquema e tipos", "100%", "pass"], ["Geometrias válidas", "99,2%", "pass"], ["Endereço hídrico", "98,1%", "pass"], ["Candidatos duplicados", "6 pares", "warn"], ["Vigência ausente", "18 registros", "warn"], ["Domínio divergente", "8 registros", "warn"]].map((row) => <div key={row[0]}><i className={row[2]}>{row[2] === "pass" ? "✓" : "!"}</i><strong>{row[0]}</strong><span>{row[1]}</span></div>)}</div></article><aside className="panel"><header className="panel-header"><div><h2>Plano de publicação</h2><p>Transação simulada e reversível</p></div></header>{[["Criar CHT-IDs", "982"], ["Atualizar identidades", "16"], ["Fila de duplicidades", "6"], ["Fila de qualidade", "18"], ["Eventos downstream", "1.022"]].map((row) => <div key={row[0]}><span>{row[0]}</span><strong>{row[1]}</strong></div>)}<p>Nenhuma exceção bloqueante será publicada como identidade validada.</p></aside></div>}
      {importStep === 3 && <article className="panel identity-execution"><header className="panel-header"><div><h2>Execução e distribuição</h2><p>Idempotência, logs, eventos e rollback</p></div><span className={importExecuted ? "complete" : "ready"}>{importExecuted ? "✓ CONCLUÍDO" : "PRONTO"}</span></header><div className="identity-execution-flow">{[["01", "Zona bruta", "snapshot imutável", "M11"], ["02", "Padronização", "projeção e unidades", "A04"], ["03", "Resolução", "CHT-ID e crosswalk", "A01"], ["04", "Publicação", "v1 + proveniência", "M1"], ["05", "Distribuição", "event bus", "M0/M4/M11"]].map((item, index) => <div key={item[1]} className={importExecuted || index === 0 ? "done" : ""}><span>{importExecuted ? "✓" : item[0]}</span><strong>{item[1]}</strong><small>{item[2]}</small><b>{item[3]}</b>{index < 4 && <i>→</i>}</div>)}</div>{importExecuted && <div className="identity-import-result"><span>CHT-ID PUBLICADO</span><strong>UTH-BA-018426</strong><p>982 identidades · 18 exceções · 6 duplicidades · 1.022 eventos</p><button onClick={() => { onNavigate("UTHs"); const record = records.find((item) => item.chtId === "UTH-BA-018426"); if (record) focusRecord(record); }}>Abrir resultado →</button></div>}</article>}
      <footer className="identity-import-footer"><div><span>CONTRATO</span><strong>FED-BA-014 · schema 3.2</strong></div><div><span>IDEMPOTENCY KEY</span><strong>imp-ba-20260809-1844</strong></div><button onClick={() => { setImportStep(0); setImportExecuted(false); onToast("Importação reiniciada com a mesma seed determinística."); }}>↶ Reiniciar</button><button className="primary" onClick={executeImport}>{importStep < 3 ? "Validar e continuar →" : importExecuted ? "Execução concluída" : "▶ Executar importação"}</button></footer>
    </div>
  );

  return (
    <section className="identity-hub" aria-label={`Identidade Hídrica — ${contextItem}`}>
      <div className="identity-context-bar"><div><span>ID</span><small>NÚCLEO MESTRE</small><strong>CHT-ID persistente · não reutilizável</strong></div><div><span>⌖</span><small>CONTEXTO</small><strong>{territory}</strong></div><div><span>◴</span><small>REFERÊNCIA TEMPORAL</small><strong>{clockLabel} BRT · versão atual</strong></div><div><span>◇</span><small>POLÍTICA</small><strong>HIL para fusão crítica</strong></div><button onClick={onOpenAgent}>✦ Agente de Identidade</button></div>
      <HeaderStats />
      {contextItem === "Busca mestre" && <Search />}
      {contextItem === "UTHs" && <Registry />}
      {contextItem === "Resolver duplicidades" && <Duplicates />}
      {contextItem === "Crosswalks" && <Crosswalks />}
      {contextItem === "Relações" && <Relations />}
      {contextItem === "Versões" && <Versions />}
      {contextItem === "Qualidade" && <Quality />}
      {contextItem === "Importação" && <Import />}

      {mergeOpen && <div className="identity-modal-backdrop" onMouseDown={() => setMergeOpen(false)}><section className="identity-merge-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>CURADORIA HUMANA · {selectedDuplicate.id}</small><h2>Confirmar fusão de identidade</h2><p>O CHT-ID mestre será preservado e a operação poderá ser revertida por versão.</p></div><button onClick={() => setMergeOpen(false)}>×</button></header><div className="identity-merge-target"><div><span>MANTER</span><strong>{selectedDuplicate.leftId}</strong><small>golden record · histórico e relações</small></div><span>＋</span><div><span>INCORPORAR</span><strong>{selectedDuplicate.rightId}</strong><small>identificador e atributos da fonte</small></div></div><section><h3>Plano da fusão</h3><p><span>✓</span>Preservar CHT-ID, versões e todos os identificadores anteriores.</p><p><span>✓</span>Criar nova versão e crosswalk com autoridade na fonte.</p><p><span>✓</span>Recalcular endereço, relações e consumidores downstream.</p><p><span>!</span>Manter a divergência de vazão em fila de curadoria de atributo.</p></section><label><span>JUSTIFICATIVA DO CURADOR</span><textarea defaultValue="Registros representam o mesmo objeto territorial conforme geometria, finalidade e ato relacionado. A divergência de vazão permanecerá versionada para revisão." /></label><footer><button onClick={() => setMergeOpen(false)}>Cancelar</button><button onClick={() => resolveDuplicate("Vinculado")}>Vincular sem fundir</button><button className="primary" onClick={() => resolveDuplicate("Fundido")}>✓ Confirmar fusão e versionar</button></footer></section></div>}

      {crosswalkOpen && <div className="identity-modal-backdrop" onMouseDown={() => setCrosswalkOpen(false)}><section className="identity-xw-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>NOVO CROSSWALK</small><h2>Relacionar identificador de origem</h2><p>{selectedRecord.chtId} · autoridade e vigência obrigatórias</p></div><button onClick={() => setCrosswalkOpen(false)}>×</button></header><label><span>FONTE</span><select value={newSource} onChange={(event) => setNewSource(event.target.value)}><option>CNARH</option><option>Águas Brasil</option><option>INEMA</option><option>SICAR</option><option>SIGEF</option><option>Hidroweb</option></select></label><label><span>IDENTIFICADOR NA FONTE</span><input autoFocus value={newSourceId} onChange={(event) => setNewSourceId(event.target.value)} placeholder="Ex.: BA-OUT-188.426" /></label><div><label><span>VIGÊNCIA INICIAL</span><input type="date" defaultValue="2026-08-09" /></label><label><span>AUTORIDADE</span><input defaultValue="Autoridade na fonte" /></label></div><section><span>VALIDAÇÃO</span><p>O agente verificará unicidade, formato, vigência, geometria e candidatos existentes antes da ativação.</p></section><footer><button onClick={() => setCrosswalkOpen(false)}>Cancelar</button><button className="primary" onClick={addCrosswalk}>Criar em validação →</button></footer></section></div>}
    </section>
  );
}
