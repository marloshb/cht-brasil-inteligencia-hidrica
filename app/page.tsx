"use client";

import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { ControlTowerModule } from "./control-tower";
import { IdentityHub } from "./identity-hub";
import { PassportHub } from "./passport-hub";
import { RegulatoryHub } from "./regulatory-hub";
import { UseRegulationHub } from "./use-regulation-hub";
import { DataHub } from "./data-hub";
import { BalanceScenariosHub } from "./balance-scenarios-hub";

declare global {
  interface Window {
    $arcgis?: {
      import: (modules: string[]) => Promise<any[]>;
    };
  }
}

type ModuleDef = {
  id: string;
  code: string;
  name: string;
  short: string;
  purpose: string;
  icon: string;
  menu: string[];
  features: string[];
  flow: string[];
  inputs: string[];
  outputs: string[];
  reports: string[];
  charts: string[];
  integrations: string[];
  agents: string[];
  accent: string;
};

type JourneyEvent = {
  title: string;
  detail: string;
  source: string;
  agent: string;
  status: string;
  center: [number, number];
};

type Journey = {
  id: string;
  name: string;
  short: string;
  module: string;
  events: JourneyEvent[];
};

const modules: ModuleDef[] = [
  {
    id: "m0",
    code: "M0",
    name: "Torre de Controle",
    short: "Operação nacional e decisão",
    purpose: "Consolidar riscos, alertas, casos, decisões e desempenho do CHT em um quadro operacional comum.",
    icon: "TC",
    menu: ["Visão nacional", "Mapa operacional", "Alertas", "Casos", "Agenda de decisões", "Briefing", "Desempenho"],
    features: ["KPIs por papel, território e criticidade", "Mapa, fila e timeline sincronizados", "Briefing automático com confiança", "Salas de trabalho compartilhadas"],
    flow: ["Detectar evento", "Qualificar contexto", "Abrir caso", "Orquestrar evidências", "Validar decisão", "Monitorar resultado"],
    inputs: ["Território ou bacia", "Janela temporal", "Tema e criticidade", "Nível de confiança"],
    outputs: ["Caso operacional", "Decisão registrada", "Tarefas e notificações", "Quadro nacional atualizado"],
    reports: ["Briefing executivo", "SLA de decisões", "Riscos e alertas", "Saúde da plataforma"],
    charts: ["Mapa de criticidade", "Timeline de eventos", "Funil de decisões", "Qualidade por fonte"],
    integrations: ["SNIRH", "Águas Brasil", "Hidroweb", "SAR", "SIEM e barramento de eventos"],
    agents: ["Orquestrador", "Executivo", "Despachos e Exigências"],
    accent: "#3ad9b6",
  },
  {
    id: "m1",
    code: "M1",
    name: "Identidade Hídrica",
    short: "CHT-ID, UTH e crosswalks",
    purpose: "Criar e governar identidade persistente, relações territoriais, versões e proveniência.",
    icon: "ID",
    menu: ["Busca mestre", "UTHs", "Resolver duplicidades", "Crosswalks", "Relações", "Versões", "Qualidade", "Importação"],
    features: ["CHT-ID opaco e persistente", "Endereço hídrico completo", "Crosswalk bidirecional", "Grafo territorial e temporalidade"],
    flow: ["Receber registro", "Padronizar esquema", "Calcular endereço", "Gerar candidatos", "Curadoria humana", "Publicar identidade"],
    inputs: ["Geometria ou coordenada", "Identificador de origem", "Tipo de objeto", "Autoridade da fonte"],
    outputs: ["CHT-ID", "UTH versionada", "Crosswalk", "Score e justificativa"],
    reports: ["Cobertura de identidade", "Fila de exceções", "Fusões e reversões", "Qualidade por fonte"],
    charts: ["Grafo de relações", "Mapa de correspondência", "Histograma de confiança", "Evolução de cobertura"],
    integrations: ["CNARH", "BHO6", "CAR/SICAR", "SIGEF", "Cadastros estaduais"],
    agents: ["Agente de Identidade", "Agente de Qualidade de Dados"],
    accent: "#71a7ff",
  },
  {
    id: "m2",
    code: "M2",
    name: "Passaporte Hídrico",
    short: "Cadastro federado e obrigações",
    purpose: "Oferecer visão única e explicável do território sem substituir os cadastros e atos oficiais.",
    icon: "PH",
    menu: ["Meus territórios", "Buscar passaporte", "Regularidade", "Obrigações", "Evidências", "Solicitações", "Compartilhamentos"],
    features: ["Blocos dinâmicos por autoridade", "Agenda de obrigações", "Fonte e data por atributo", "Compartilhamento consentido e revogável"],
    flow: ["Solicitar vínculo", "Cruzar identidade", "Validar representação", "Agregar dados", "Complementar lacunas", "Notificar mudanças"],
    inputs: ["CHT-ID ou empreendimento", "Finalidade do acesso", "Evidência de representação", "Período de validade"],
    outputs: ["Passaporte contextual", "Agenda de obrigações", "Link temporário", "Pendências orientadas"],
    reports: ["Passaporte PDF", "Histórico territorial", "Obrigações e vencimentos", "Compartilhamentos ativos"],
    charts: ["Radar de completude", "Linha do tempo de atos", "Balanço por fonte", "Matriz de regularidade"],
    integrations: ["Águas Brasil", "CNARH", "Estados/DF", "Gov.br", "Licenciamento ambiental"],
    agents: ["Agente de Identidade", "Copiloto do Passaporte"],
    accent: "#55d6ef",
  },
  {
    id: "m3",
    code: "M3",
    name: "Motor Regulatório",
    short: "Regras, competência e GeoRAG",
    purpose: "Representar normas, vigência e competência de modo citável, testável e territorial.",
    icon: "MR",
    menu: ["Regras", "Competências", "Instrumentos", "Agenda regulatória", "Testes", "Conflitos", "Versões", "Consultas"],
    features: ["GeoRAG normativo citável", "Regras espaço-temporais", "Matriz federativa explícita", "Testes unitários e regressão"],
    flow: ["Cadastrar ato", "Extrair regra candidata", "Validar representação", "Executar testes", "Aprovar versão", "Aplicar com explicação"],
    inputs: ["Ato e URL oficial", "Autoridade e vigência", "Território de incidência", "Casos de teste"],
    outputs: ["Regra versionada", "Competência resolvida", "Conflitos normativos", "Explicação citada"],
    reports: ["Mapa de competência", "Impacto regulatório", "Cobertura de testes", "Histórico de versões"],
    charts: ["Grafo normativo", "Matriz autoridade × território", "Testes por status", "Regras por vigência"],
    integrations: ["Portal ANA", "LexML", "Diário Oficial", "Águas Brasil", "Planos de bacia"],
    agents: ["GeoRAG Normativo", "Agente de Competência"],
    accent: "#9a8cff",
  },
  {
    id: "m4",
    code: "M4",
    name: "Regulação de Usos",
    short: "Outorga, cobrança e automonitoramento",
    purpose: "Preparar e contextualizar processos regulatórios, preservando a decisão da autoridade competente.",
    icon: "RU",
    menu: ["Pré-análise", "Demandas", "Atos", "Condicionantes", "Automonitoramento", "Cobrança", "Revisões", "Conflitos"],
    features: ["Pré-análise não vinculante", "Demanda × autorização × medição", "Gestão de condicionantes", "Reconciliação transparente de cobrança"],
    flow: ["Localizar UTH", "Resolver competência", "Pré-analisar demanda", "Confirmar e encaminhar", "Receber protocolo", "Acompanhar conformidade"],
    inputs: ["Interferência e finalidade", "Vazão e regime de uso", "Coordenada e corpo hídrico", "Documentos e medições"],
    outputs: ["Checklist de pré-análise", "Dossiê territorial", "Encaminhamento oficial", "Alertas de revisão"],
    reports: ["Parecer preliminar", "Condicionantes", "Reconciliação de volumes", "Memória de cobrança"],
    charts: ["Oferta × demanda", "Série de volumes", "Funil de análise", "Calendário de obrigações"],
    integrations: ["Plataforma Águas Brasil", "CNARH", "Sistemas estaduais", "Hidroweb", "Cobrança"],
    agents: ["Pré-análise Regulatória", "Despachos e Exigências"],
    accent: "#39c49b",
  },
  {
    id: "m5",
    code: "M5",
    name: "Data Hub",
    short: "Monitoramento e observação",
    purpose: "Receber, qualificar e disponibilizar observações com unidade, método, latência e proveniência.",
    icon: "DH",
    menu: ["Estações", "Séries", "Telemetria", "Imagens", "Cobertura", "Qualidade", "Eventos", "Catálogo"],
    features: ["Zonas bruta, qualificada e analítica", "Streaming com atraso e backfill", "Flags sem apagar o original", "Saúde e cobertura da rede"],
    flow: ["Receber observação", "Validar contrato", "Preservar bruto", "Aplicar QA/QC", "Analisar anomalia", "Publicar série"],
    inputs: ["Estação e sensor", "Valor, unidade e método", "Timestamp e qualidade", "Arquivo, API ou stream"],
    outputs: ["Série qualificada", "Flags de qualidade", "Evento territorial", "Reprocessamento versionado"],
    reports: ["Saúde da rede", "Latência por fonte", "Cobertura territorial", "Qualidade de séries"],
    charts: ["Hidrograma", "Heatmap temporal", "Disponibilidade por estação", "Pareto de flags"],
    integrations: ["Hidroweb", "Telemetria", "RNQA", "INMET/CEMADEN", "Satélites/STAC"],
    agents: ["Qualidade de Dados", "Anomalia Hidrométrica"],
    accent: "#4fb7ff",
  },
  {
    id: "m6",
    code: "M6",
    name: "Balanço & Cenários",
    short: "Modelagem e simulação",
    purpose: "Comparar oferta, demanda e alternativas com modelo, escala e incerteza explícitos.",
    icon: "BC",
    menu: ["Balanço atual", "Modelos", "Cenários", "Reservatórios", "Águas subterrâneas", "Previsões", "Comparações", "Biblioteca"],
    features: ["Model registry governado", "Cenários parametrizados", "Propagação de incerteza", "Balanço em rede hidrográfica"],
    flow: ["Escolher território", "Recomendar referência", "Definir alternativas", "Executar simulação", "Comparar trade-offs", "Registrar cenário decisório"],
    inputs: ["Território e horizonte", "Cenário climático", "Demanda e eficiência", "Regras e infraestrutura"],
    outputs: ["Balanço por trecho", "Cenários comparáveis", "Faixa de incerteza", "Recomendação assistida"],
    reports: ["Relatório de cenário", "Memória de modelo", "Trade-offs", "Mapa de criticidade futura"],
    charts: ["Fan chart", "Sankey hídrico", "Curva de permanência", "Matriz multicritério"],
    integrations: ["BHO6", "Hidroweb", "SAR", "Model registry", "Projeções climáticas"],
    agents: ["Modelagem e Cenários", "Agente de Alternativas"],
    accent: "#68c7de",
  },
  {
    id: "m7",
    code: "M7",
    name: "GeoFiscalização",
    short: "Conformidade, campo e evidências",
    purpose: "Transformar indícios remotos e regulatórios em priorização, vistoria e evidência auditável.",
    icon: "GF",
    menu: ["Detecções", "Risco", "Casos", "Ordens", "Campo", "Evidências", "Conformidade", "Resultados"],
    features: ["Detecção com confiança e método", "Priorização explicável", "Cadeia de custódia", "Vistoria georreferenciada offline"],
    flow: ["Receber indício", "Correlacionar contexto", "Validar prioridade", "Montar dossiê", "Executar vistoria", "Submeter à autoridade"],
    inputs: ["Detecção ou denúncia", "Geometria e período", "Critérios de risco", "Evidências de campo"],
    outputs: ["Score explicável", "Ordem de vistoria", "Dossiê com hash", "Minuta de despacho"],
    reports: ["Dossiê fiscalizatório", "Roteiro de campo", "Evidências coletadas", "Efetividade das ações"],
    charts: ["Mapa de prioridade", "Funil indício → decisão", "Risco multicritério", "Cobertura de vistorias"],
    integrations: ["Satélites/Living Atlas", "Águas Brasil", "CNARH", "App de campo", "Processo eletrônico"],
    agents: ["GeoFiscalização", "Assistente de Vistoria", "Despachos e Exigências"],
    accent: "#ffb865",
  },
  {
    id: "m8",
    code: "M8",
    name: "Planejamento Hídrico",
    short: "Programas, portfólio e resultados",
    purpose: "Conectar planos, ações, investimentos, evidências e benefícios territoriais.",
    icon: "PL",
    menu: ["Planos", "Programas", "Ações", "Projetos", "Investimentos", "Metas", "Resultados", "Avaliação"],
    features: ["Rastreabilidade plano → resultado", "Mapa de investimentos e lacunas", "Portfólio com gates", "Monitoramento por evidência"],
    flow: ["Importar plano", "Georreferenciar ações", "Atualizar marcos", "Detectar desvios", "Replanejar portfólio", "Avaliar resultado"],
    inputs: ["Plano e horizonte", "Ação, responsável e prazo", "Orçamento e fonte", "Meta, baseline e evidência"],
    outputs: ["Portfólio priorizado", "Mapa de investimentos", "Alertas de marco", "Avaliação de resultado"],
    reports: ["Execução física-financeira", "Metas e benefícios", "Lacunas territoriais", "Avaliação do ciclo"],
    charts: ["Gantt", "Roadmap", "Waterfall de orçamento", "Radar de maturidade"],
    integrations: ["PNRH/PERHs", "Planos de bacia", "Sistemas de orçamento", "Transferegov", "Painéis ANA"],
    agents: ["Extração de Plano", "Monitoramento de Marcos", "Agente de Portfólio"],
    accent: "#d9b56f",
  },
  {
    id: "m9",
    code: "M9",
    name: "Eventos Críticos",
    short: "Segurança hídrica e operação",
    purpose: "Operar incidentes de seca e cheia com situação comum, alternativas, tarefas e linha do tempo.",
    icon: "EC",
    menu: ["Situação atual", "Incidentes", "Secas", "Cheias", "Reservatórios", "Cenários", "Recursos", "Pós-evento"],
    features: ["Quadro operacional comum", "Observação + previsão + impacto", "Timeline imutável", "Briefing por turno e replay"],
    flow: ["Cruzar limiar", "Verificar persistência", "Abrir incidente", "Compor situação", "Decidir e atribuir", "Revisar pós-evento"],
    inputs: ["Tipo e nível do incidente", "Território e comandante", "Condição e tendência", "Alternativas e recursos"],
    outputs: ["Sala de situação", "Briefing de turno", "Plano de ação", "Revisão pós-evento"],
    reports: ["Boletim simulado", "Situação operacional", "Decisões e execução", "Lições aprendidas"],
    charts: ["Hidrograma previsto", "Mapa de exposição", "Timeline", "Matriz de alternativas"],
    integrations: ["SAR", "Monitor de Secas", "Hidroweb", "CEMADEN/INMET/CPTEC", "Defesa Civil/S2ID"],
    agents: ["Agente de Crise", "Agente de Impacto", "Agente de Boletim"],
    accent: "#ff786c",
  },
  {
    id: "m10",
    code: "M10",
    name: "Qualidade da Água",
    short: "Enquadramento e pressões",
    purpose: "Relacionar condição observada, classe, metas, cargas, pressões e medidas de recuperação.",
    icon: "QA",
    menu: ["Situação", "Trechos", "Enquadramento", "Qualidade", "Lançamentos", "Pressões", "Metas", "Recuperação"],
    features: ["Classe × meta × condição", "Quantidade e qualidade integradas", "Desconformidade contextual", "Simulação de fontes e medidas"],
    flow: ["Qualificar amostra", "Comparar regra", "Identificar pressão", "Validar achado", "Avaliar recuperação", "Medir resultado"],
    inputs: ["Trecho e enquadramento", "Parâmetro, valor e método", "Lançamento e carga", "Pressão e medida"],
    outputs: ["Situação por trecho", "Alerta contextual", "Cenário de carga", "Plano de recuperação"],
    reports: ["Qualidade e enquadramento", "Cargas e pressões", "Gap de metas", "Recuperação e tendência"],
    charts: ["Perfil longitudinal", "Heatmap parâmetro × tempo", "Carga por fonte", "Tendência da meta"],
    integrations: ["RNQA", "Laboratórios", "Órgãos ambientais", "SNIS", "CAR e uso do solo"],
    agents: ["Agente de Qualidade", "Agente de Pressões", "Agente de Recuperação"],
    accent: "#4ed2c4",
  },
  {
    id: "m11",
    code: "M11",
    name: "Governança Federativa",
    short: "Dados, acesso e transparência",
    purpose: "Gerir contratos, qualidade, custódia, interoperabilidade, acesso e adoção federativa.",
    icon: "GV",
    menu: ["Entes", "Contratos de dados", "Catálogo", "Qualidade", "Acessos", "Interoperabilidade", "Transparência", "Auditoria"],
    features: ["Autoridade preservada na fonte", "Contratos de dados versionados", "Qualidade e SLA observáveis", "Transparência por classificação"],
    flow: ["Pactuar contrato", "Conectar fonte", "Validar entrega", "Monitorar SLA", "Tratar incidente", "Publicar transparência"],
    inputs: ["Ente e custodiante", "Contrato e esquema", "SLA e classificação", "Política de acesso"],
    outputs: ["Contrato ativo", "Score de qualidade", "Plano de melhoria", "Trilha de acesso"],
    reports: ["SLA federativo", "Maturidade e adoção", "Privacidade e acesso", "Interoperabilidade"],
    charts: ["Mapa de maturidade", "Lineage graph", "Pareto de erros", "Acessos por finalidade"],
    integrations: ["INDE/IBGE", "dados.gov.br", "Gov.br", "Portais estaduais", "Catálogos OGC"],
    agents: ["Contrato de Dados", "Privacidade", "Transparência e Adoção"],
    accent: "#90a7c4",
  },
  {
    id: "m12",
    code: "M12",
    name: "Central de Agentes",
    short: "GeoAI e automação governada",
    purpose: "Orquestrar agentes, ferramentas, filas e aprovações com rastreabilidade e limites de autoridade.",
    icon: "AI",
    menu: ["Copiloto", "Catálogo", "Execuções", "Aprovações", "Exceções", "Conhecimento", "Avaliações", "Observabilidade"],
    features: ["Roteamento por intenção e risco", "Políticas deny-by-default", "Tracing completo", "Kill switch global e por agente"],
    flow: ["Receber evento", "Classificar risco", "Planejar ferramentas", "Executar com evidências", "Solicitar aprovação", "Registrar feedback"],
    inputs: ["Evento ou prompt", "Contexto CHT", "Perfil e finalidade", "Política e prazo"],
    outputs: ["Resposta estruturada", "Dossiê ou rascunho", "Fila de aprovação", "Trace auditável"],
    reports: ["Execuções e SLA", "Grounding e segurança", "Custos e latência", "Drift e incidentes"],
    charts: ["Trace timeline", "Funil de aprovação", "Matriz de risco", "Qualidade por agente"],
    integrations: ["ArcGIS Assistant", "LLM Gateway", "GeoRAG", "Event bus", "Model registry e SIEM"],
    agents: ["Orquestrador", "Identidade", "Normativo", "Fiscalização", "Vistoria", "Crise", "Executivo"],
    accent: "#b89cff",
  },
];

const journeys: Journey[] = [
  {
    id: "j1",
    name: "Ampliação de captação",
    short: "Identidade → pré-análise → protocolo",
    module: "m4",
    events: [
      { title: "Empreendimento localizado", detail: "CHT-ID e endereço hídrico resolvidos para a UTH selecionada.", source: "Núcleo de Identidade", agent: "A01 Identidade", status: "resolved", center: [-47.42, -15.78] },
      { title: "Competência confirmada", detail: "Domínio federal e autoridade competente associados ao trecho.", source: "Motor Regulatório v3.8", agent: "A02 GeoRAG Normativo", status: "verified", center: [-47.82, -15.58] },
      { title: "Demanda recebida", detail: "Ampliação de 42 L/s; regime informado e documentos indexados.", source: "Águas Brasil · simulação", agent: "A03 Pré-análise", status: "received", center: [-47.95, -15.46] },
      { title: "Balanço processado", detail: "Cenário de referência aponta 71% de comprometimento com incerteza ±6%.", source: "Modelo BH-2026.4", agent: "A06 Modelagem", status: "attention", center: [-48.13, -15.35] },
      { title: "Pendência identificada", detail: "Medição de automonitoramento precisa de série complementar de 30 dias.", source: "Contrato REG-014", agent: "A03 Pré-análise", status: "waiting", center: [-48.34, -15.18] },
      { title: "Encaminhamento aprovado", detail: "Analista validou o dossiê e autorizou envio ao processo oficial.", source: "Aprovação humana", agent: "A09 Despachos", status: "approved", center: [-48.48, -14.96] },
    ],
  },
  {
    id: "j2",
    name: "Vistoria inteligente",
    short: "Detecção → dossiê → campo → despacho",
    module: "m7",
    events: [
      { title: "Indício remoto recebido", detail: "Mudança espectral sugere nova área irrigada de 18,4 ha.", source: "Sentinel-2 · Living Atlas", agent: "A07 GeoFiscalização", status: "received", center: [-45.19, -12.08] },
      { title: "Contexto correlacionado", detail: "UTH, atos vigentes, medição declarada e histórico associados.", source: "CHT Context Bus", agent: "A07 GeoFiscalização", status: "resolved", center: [-45.32, -12.19] },
      { title: "Score priorizado", detail: "Risco 84/100: impacto potencial alto, confiança remota de 0,88.", source: "Modelo GF-2.3", agent: "A07 GeoFiscalização", status: "attention", center: [-45.46, -12.32] },
      { title: "Ordem aprovada", detail: "Supervisor confirma vistoria; nenhuma sanção foi automatizada.", source: "Aprovação humana", agent: "A08 Vistoria", status: "approved", center: [-45.58, -12.43] },
      { title: "Equipe em campo", detail: "Checklist offline sincronizado; 7 evidências georreferenciadas coletadas.", source: "Aplicativo de campo", agent: "A08 Vistoria", status: "running", center: [-45.68, -12.55] },
      { title: "Minuta preparada", detail: "Fatos, evidências, divergências e fundamento organizados para revisão.", source: "Dossiê com hash", agent: "A09 Despachos", status: "waiting", center: [-45.78, -12.64] },
    ],
  },
  {
    id: "j3",
    name: "Crise hídrica",
    short: "Alerta → cenário → decisão → resposta",
    module: "m9",
    events: [
      { title: "Limiar hidrológico cruzado", detail: "Vazão observada fica abaixo do P10 por três janelas consecutivas.", source: "Hidroweb · estação 45260000", agent: "A05 Anomalia", status: "attention", center: [-43.48, -11.22] },
      { title: "Alerta qualificado", detail: "Persistência confirmada; sensor saudável e três estações consistentes.", source: "Data Hub", agent: "A10 Crise", status: "verified", center: [-43.72, -11.34] },
      { title: "Incidente ativado", detail: "Sala São Francisco Norte aberta com comandante e objetivos iniciais.", source: "Torre de Controle", agent: "A00 Orquestrador", status: "running", center: [-44.02, -11.56] },
      { title: "Exposição calculada", detail: "37 UTHs, 4 captações urbanas e 2 ativos críticos potencialmente afetados.", source: "GeoAnalytics", agent: "A10 Crise", status: "resolved", center: [-44.25, -11.82] },
      { title: "Alternativas comparadas", detail: "Três medidas simuladas com impacto, custo, prazo e incerteza.", source: "Modelo OP-7.2", agent: "A06 Modelagem", status: "waiting", center: [-44.48, -12.07] },
      { title: "Ação autorizada", detail: "Autoridade seleciona cenário B e distribui quatro tarefas operacionais.", source: "Aprovação humana", agent: "A10 Crise", status: "approved", center: [-44.72, -12.28] },
    ],
  },
];

const cases = [
  { id: "CHT-2026-1842", title: "Ampliação de captação · Alto Paranaíba", type: "Regulação", risk: "Médio", sla: "01h 42m", owner: "COOUT", status: "Em análise" },
  { id: "GF-2026-0917", title: "Expansão irrigada · Oeste da Bahia", type: "Fiscalização", risk: "Alto", sla: "00h 28m", owner: "COCAM", status: "Aprovação" },
  { id: "EC-2026-0048", title: "Vazão crítica · São Francisco Norte", type: "Incidente", risk: "Crítico", sla: "00h 08m", owner: "Sala ANA", status: "Ativo" },
  { id: "QD-2026-0621", title: "Série inconsistente · Estação 45260000", type: "Dados", risk: "Baixo", sla: "05h 14m", owner: "COHID", status: "Correção" },
];

const statusColor: Record<string, string> = {
  resolved: "ok",
  verified: "ok",
  approved: "ok",
  received: "info",
  running: "info",
  attention: "warn",
  waiting: "warn",
};

function formatClock(date: Date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function Home() {
  const [moduleId, setModuleId] = useState("m0");
  const [contextItem, setContextItem] = useState("Visão nacional");
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [launcherQuery, setLauncherQuery] = useState("");
  const [activeJourneyId, setActiveJourneyId] = useState("j1");
  const [journeyStep, setJourneyStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [clock, setClock] = useState(new Date(2026, 7, 7, 14, 32, 8));
  const [detailTab, setDetailTab] = useState("operacao");
  const [agentOpen, setAgentOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [toast, setToast] = useState("Contexto nacional carregado com dados sintéticos.");
  const [mapReady, setMapReady] = useState(false);
  const [layerState, setLayerState] = useState({ hydro: true, ana: true, cht: true, risk: true });
  const [territory, setTerritory] = useState("Brasil · todas as bacias");
  const [mapFocus, setMapFocus] = useState({
    label: "UTH-DF-004918 · Captação industrial · Ribeirão Mestre d'Armas",
    source: "Núcleo de Identidade · 5 fontes",
    confidence: 94,
  });
  const mapRef = useRef<HTMLElement | null>(null);
  const layersRef = useRef<Record<string, any>>({});

  const activeModule = modules.find((item) => item.id === moduleId) ?? modules[0];
  const activeJourney = journeys.find((item) => item.id === activeJourneyId) ?? journeys[0];
  const currentEvent = activeJourney.events[Math.min(journeyStep, activeJourney.events.length - 1)];
  const completion = Math.round(((journeyStep + 1) / activeJourney.events.length) * 100);
  const filteredModules = useMemo(() => {
    const query = launcherQuery.trim().toLowerCase();
    if (!query) return modules;
    return modules.filter((item) => `${item.code} ${item.name} ${item.short}`.toLowerCase().includes(query));
  }, [launcherQuery]);

  useEffect(() => {
    const hash = window.location.hash.replace("#/", "");
    if (modules.some((item) => item.id === hash)) setModuleId(hash);
  }, []);

  useEffect(() => {
    window.history.replaceState(null, "", `#/${moduleId}`);
    setContextItem(activeModule.menu[0]);
    setDetailTab("operacao");
  }, [moduleId, activeModule.menu]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setClock((value) => new Date(value.getTime() + 180000));
      setJourneyStep((value) => {
        if (value >= activeJourney.events.length - 1) {
          setRunning(false);
          setToast("Jornada concluída. A decisão humana e a trilha foram registradas.");
          return value;
        }
        return value + 1;
      });
    }, Math.max(900, 3100 / speed));
    return () => window.clearInterval(interval);
  }, [running, speed, activeJourney.events.length]);

  useEffect(() => {
    if (moduleId === "m1" || moduleId === "m2" || moduleId === "m3" || moduleId === "m4" || moduleId === "m5" || moduleId === "m6") return;
    const event = activeJourney.events[Math.min(journeyStep, activeJourney.events.length - 1)];
    const mapElement = mapRef.current as any;
    if (mapReady && mapElement?.goTo) {
      mapElement.goTo({ center: event.center, zoom: journeyStep > 0 ? 6 : 5 }, { duration: 900 }).catch(() => undefined);
    }
  }, [journeyStep, activeJourney, mapReady, moduleId]);

  useEffect(() => {
    const focusMap = (event: Event) => {
      const detail = (event as CustomEvent<{ center?: [number, number]; zoom?: number; label?: string; source?: string; confidence?: number }>).detail;
      if (!detail) return;
      setMapFocus({
        label: detail.label ?? "Objeto CHT selecionado",
        source: detail.source ?? "Context Bus CHT",
        confidence: detail.confidence ?? 80,
      });
      const mapElement = mapRef.current as any;
      if (mapReady && mapElement?.goTo && detail.center) {
        mapElement.goTo({ center: detail.center, zoom: detail.zoom ?? 8 }, { duration: 900 }).catch(() => undefined);
      }
    };
    window.addEventListener("cht:focus-map", focusMap);
    return () => window.removeEventListener("cht:focus-map", focusMap);
  }, [mapReady]);

  useEffect(() => {
    const mapElement = mapRef.current as any;
    if (!mapElement) return;
    let cancelled = false;
    let initialized = false;

    const initialize = async () => {
      if (initialized || cancelled || !window.$arcgis) return;
      initialized = true;
      try {
        const [GraphicsLayer, Graphic, TileLayer, MapImageLayer] = await window.$arcgis.import([
          "@arcgis/core/layers/GraphicsLayer.js",
          "@arcgis/core/Graphic.js",
          "@arcgis/core/layers/TileLayer.js",
          "@arcgis/core/layers/MapImageLayer.js",
        ]);

        const hydroLayer = new TileLayer({
          portalItem: { id: "9f86716d941c4410b0b406d911754b2c" },
          title: "Esri Hydro Reference Overlay · Living Atlas",
          opacity: 0.74,
        });
        const anaLayer = new MapImageLayer({
          url: "https://portal1.snirh.gov.br/server/rest/services/dados_abertos/Hidrografia/MapServer",
          title: "ANA · Hidrografia/BHO",
          opacity: 0.68,
        });
        const riskLayer = new GraphicsLayer({ title: "Áreas de atenção · cenário simulado" });
        const chtLayer = new GraphicsLayer({ title: "Objetos CHT · dados sintéticos" });

        const river = new Graphic({
          geometry: {
            type: "polyline",
            paths: [[[-46.9, -20.0], [-45.4, -18.2], [-44.7, -16.1], [-43.5, -14.1], [-42.8, -12.3], [-40.5, -10.4], [-38.3, -9.5]]],
            spatialReference: { wkid: 4326 },
          },
          symbol: { type: "simple-line", color: [42, 207, 222, 0.9], width: 3 },
          attributes: { nome: "Corredor hídrico demonstrativo", tipo: "Referência CHT" },
          popupTemplate: { title: "{nome}", content: "Camada operacional sintética para demonstrar o Context Bus do CHT Brasil." },
        });

        const risk = new Graphic({
          geometry: {
            type: "polygon",
            rings: [[[-46.6, -13.3], [-44.0, -13.0], [-43.6, -10.7], [-46.0, -10.4], [-46.6, -13.3]]],
            spatialReference: { wkid: 4326 },
          },
          symbol: { type: "simple-fill", color: [255, 120, 92, 0.15], outline: { color: [255, 140, 93, 0.9], width: 1.5 } },
          attributes: { nome: "Área de criticidade simulada", indice: "84/100" },
          popupTemplate: { title: "{nome}", content: "Índice multicritério: <b>{indice}</b><br/>Cenário demonstrativo, sem valor oficial." },
        });

        const points = [
          [-47.82, -15.58, "UTH-DF-004918", "Atenção", "0,94"],
          [-45.46, -12.32, "UTH-BA-018407", "Vistoria", "0,88"],
          [-43.72, -11.34, "EST-45260000", "Vazão crítica", "0,97"],
          [-50.1, -20.4, "UTH-SP-009142", "Regular", "0,91"],
          [-54.6, -16.2, "UTH-MT-001782", "Monitoramento", "0,86"],
        ].map(([longitude, latitude, id, situacao, confianca]) => new Graphic({
          geometry: { type: "point", longitude, latitude, spatialReference: { wkid: 4326 } },
          symbol: { type: "simple-marker", color: situacao === "Regular" ? [43, 213, 174] : [255, 184, 101], size: 10, outline: { color: [7, 22, 37], width: 2 } },
          attributes: { id, situacao, confianca },
          popupTemplate: { title: "{id}", content: "Situação: <b>{situacao}</b><br/>Confiança: {confianca}<br/>Dados sintéticos para demonstração." },
        }));

        riskLayer.add(risk);
        chtLayer.addMany([river, ...points]);
        mapElement.map.addMany([hydroLayer, anaLayer, riskLayer, chtLayer]);
        layersRef.current = { hydro: hydroLayer, ana: anaLayer, risk: riskLayer, cht: chtLayer };
        setMapReady(true);
      } catch {
        setMapReady(true);
        setToast("Mapa base ativo. A camada externa está temporariamente indisponível; o fallback local foi mantido.");
      }
    };

    const onReady = () => initialize();
    customElements.whenDefined("arcgis-map").then(() => {
      if (mapElement.ready) initialize();
      else mapElement.addEventListener("arcgisViewReadyChange", onReady, { once: true });
    });
    return () => {
      cancelled = true;
      mapElement.removeEventListener?.("arcgisViewReadyChange", onReady);
    };
  }, []);

  const switchModule = (id: string) => {
    setModuleId(id);
    setLauncherOpen(false);
    const found = modules.find((item) => item.id === id);
    if (found) setToast(`${found.code} · ${found.name} aberto com o contexto territorial preservado.`);
  };

  const showIdentityMap = moduleId === "m1" && ["Busca mestre", "UTHs", "Relações"].includes(contextItem);
  const showPassportMap = moduleId === "m2" && ["Meus territórios", "Buscar passaporte"].includes(contextItem);
  const showRegulatoryMap = moduleId === "m3" && ["Regras", "Competências"].includes(contextItem);
  const showUseRegulationMap = moduleId === "m4" && ["Pré-análise", "Demandas", "Conflitos"].includes(contextItem);
  const showDataHubMap = moduleId === "m5" && ["Estações", "Imagens", "Cobertura"].includes(contextItem);
  const showBalanceMap = moduleId === "m6" && ["Balanço atual", "Reservatórios", "Águas subterrâneas", "Previsões"].includes(contextItem);
  const showSpecialistMap = showIdentityMap || showPassportMap || showRegulatoryMap || showUseRegulationMap || showDataHubMap || showBalanceMap;
  const hideWorkspace = (moduleId === "m0" && !["Visão nacional", "Mapa operacional"].includes(contextItem)) || (moduleId === "m1" && !showIdentityMap) || (moduleId === "m2" && !showPassportMap) || (moduleId === "m3" && !showRegulatoryMap) || (moduleId === "m4" && !showUseRegulationMap) || (moduleId === "m5" && !showDataHubMap) || (moduleId === "m6" && !showBalanceMap);

  const startJourney = (journey: Journey) => {
    setActiveJourneyId(journey.id);
    setJourneyStep(0);
    setRunning(true);
    setModuleId(journey.module);
    setToast(`${journey.id.toUpperCase()} iniciada com seed DEMO-ANA-2026.`);
  };

  const advanceJourney = () => {
    if (journeyStep >= activeJourney.events.length - 1) {
      setToast("Fim da jornada. Use Replay para reproduzir a trilha.");
      return;
    }
    setClock((value) => new Date(value.getTime() + 180000));
    setJourneyStep((value) => value + 1);
  };

  const replayJourney = () => {
    setJourneyStep(0);
    setClock(new Date(2026, 7, 7, 14, 32, 8));
    setRunning(false);
    setToast("Replay posicionado no primeiro evento; estado operacional restaurado.");
  };

  const toggleLayer = (key: keyof typeof layerState) => {
    setLayerState((value) => {
      const next = { ...value, [key]: !value[key] };
      if (layersRef.current[key]) layersRef.current[key].visible = next[key];
      return next;
    });
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormOpen(false);
    setToast(`Registro ${activeModule.code}-2026-${String(1843 + journeyStep).padStart(4, "0")} criado e encaminhado ao workflow.`);
  };

  const resolveDecision = (action: string) => {
    setDecisionOpen(false);
    setToast(`${action} registrada por Analista ANA, com justificativa e correlationId 9f2d-6e18.`);
  };

  const exportReport = () => {
    const payload = [
      "CHT BRASIL · RELATÓRIO DE DEMONSTRAÇÃO",
      `Módulo: ${activeModule.code} — ${activeModule.name}`,
      `Contexto: ${territory}`,
      `Gerado em: ${clock.toISOString()}`,
      "",
      "Outputs",
      ...activeModule.outputs.map((item) => `- ${item}`),
      "",
      "Integrações",
      ...activeModule.integrations.map((item) => `- ${item}`),
      "",
      "Observação: dados e decisões são sintéticos e exclusivamente demonstrativos.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([payload], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `CHT_${activeModule.code}_relatorio_demo.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast("Relatório demonstrativo exportado com fonte, contexto e timestamp.");
  };

  const cycleTerritory = () => {
    const values = ["Brasil · todas as bacias", "Bacia do São Francisco", "Oeste da Bahia · UGRH 07", "Distrito Federal · UTH selecionada"];
    const next = values[(values.indexOf(territory) + 1) % values.length];
    setTerritory(next);
    setToast(`Contexto global alterado para ${next}. Mapas, gráficos e filas sincronizados.`);
  };

  return (
    <div className="app-shell" style={{ "--module-accent": activeModule.accent } as React.CSSProperties}>
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span>CHT</span></div>
          <div><strong>CHT Brasil</strong><small>Cadastro Hídrico Territorial</small></div>
        </div>
        <button className="global-context" onClick={cycleTerritory} aria-label="Alterar contexto territorial">
          <span className="context-pin">⌖</span>
          <span><small>CONTEXTO TERRITORIAL</small><strong>{territory}</strong></span>
          <span className="chevron">⌄</span>
        </button>
        <div className="topbar-actions">
          <div className="sync-state"><i /> Sincronizado <span>há 18s</span></div>
          <button className="icon-button" onClick={() => { setLauncherOpen(true); setLauncherQuery(""); }} aria-label="Pesquisar">⌕</button>
          <button className="icon-button has-badge" onClick={() => setToast("3 notificações: uma decisão, uma integração e um SLA próximo do limite.")} aria-label="Notificações">◉<b>3</b></button>
          <button className="icon-button" onClick={() => setToast("Ajuda contextual aberta para esta tela e perfil.")} aria-label="Ajuda">?</button>
          <button className="profile-button" onClick={() => setToast("Perfil: Analista ANA · ambiente nacional · acesso simulado.")}><span>MA</span><div><strong>Marina Alves</strong><small>Analista ANA</small></div><i>⌄</i></button>
        </div>
      </header>

      <nav className="rail" aria-label="Navegação global">
        <button className="rail-button active" aria-label="Operação">⌁<span>Operação</span></button>
        <button className="rail-button" onClick={() => setLauncherOpen(true)} aria-label="Aplicações">▦<span>Aplicações</span></button>
        <button className="rail-button" onClick={() => switchModule("m12")} aria-label="Agentes">✦<span>Agentes</span></button>
        <button className="rail-button" onClick={() => { setModuleId("m0"); setContextItem("Casos"); }} aria-label="Casos">▤<span>Casos</span></button>
        <button className="rail-button" onClick={() => { setModuleId("m0"); setContextItem("Alertas"); }} aria-label="Alertas">△<span>Alertas</span></button>
        <div className="rail-spacer" />
        <button className="rail-button" onClick={() => switchModule("m11")} aria-label="Configurações">⚙<span>Ajustes</span></button>
      </nav>

      <aside className="context-nav">
        <button className="product-switcher" onClick={() => setLauncherOpen(true)}>
          <span className="module-monogram">{activeModule.icon}</span>
          <span><small>{activeModule.code} · PRODUTO</small><strong>{activeModule.name}</strong></span>
          <i>⌄</i>
        </button>
        <div className="context-label">NAVEGAÇÃO DO MÓDULO</div>
        <div className="context-items">
          {activeModule.menu.map((item, index) => (
            <button key={item} className={contextItem === item ? "active" : ""} onClick={() => { setContextItem(item); setToast(`${item}: visão contextual carregada.`); }}>
              <span>{String(index + 1).padStart(2, "0")}</span>{item}{index === 2 && <b>{3 + journeyStep}</b>}
            </button>
          ))}
        </div>
        <div className="context-card">
          <div><span className="pulse-dot" /> OPERAÇÃO NOMINAL</div>
          <strong>99,94%</strong><small>disponibilidade · 24h</small>
          <div className="micro-bars"><i /><i /><i /><i /><i /><i /><i /></div>
        </div>
        <div className="scenario-note"><span>SIMULAÇÃO</span><p>Dados sintéticos e atos sem efeito oficial.</p></div>
      </aside>

      <main className="main-content">
        <section className="mission-header">
          <div>
            <div className="breadcrumbs">CHT BRASIL <span>/</span> {activeModule.code} <span>/</span> {contextItem.toUpperCase()}</div>
            <h1>{contextItem}</h1>
            <p>{activeModule.purpose}</p>
          </div>
          <div className="mission-actions">
            <button className="secondary-button" onClick={exportReport}>⇩ Exportar relatório</button>
            <button className="secondary-button" onClick={() => setAgentOpen(true)}>✦ Consultar agentes</button>
            <button className="primary-button" onClick={() => setFormOpen(true)}>＋ {activeModule.code === "m0" ? "Novo caso" : "Novo registro"}</button>
          </div>
        </section>

        <section className="kpi-grid" aria-label="Indicadores operacionais">
          <article className="kpi-card">
            <div className="kpi-label"><span>OBJETOS COM CHT-ID</span><i className="trend up">↗ 1,8%</i></div>
            <strong>12,84 mi</strong><p><b>96,2%</b> da cobertura piloto</p>
            <div className="sparkline bars"><i style={{ height: "38%" }} /><i style={{ height: "50%" }} /><i style={{ height: "46%" }} /><i style={{ height: "68%" }} /><i style={{ height: "74%" }} /><i style={{ height: "88%" }} /><i style={{ height: "96%" }} /></div>
          </article>
          <article className="kpi-card warning">
            <div className="kpi-label"><span>ALERTAS PRIORITÁRIOS</span><i className="trend down">↓ 6</i></div>
            <strong>{31 + journeyStep}</strong><p><b>{8 + Math.min(journeyStep, 3)}</b> críticos · 4 perto do SLA</p>
            <div className="severity-line"><i /><i /><i /><i /><i /><i /></div>
          </article>
          <article className="kpi-card">
            <div className="kpi-label"><span>DECISÕES ASSISTIDAS</span><i className="trend up">↗ 12,4%</i></div>
            <strong>{184 + journeyStep}</strong><p><b>87%</b> validadas no prazo</p>
            <div className="donut"><span>{87 + Math.min(journeyStep, 4)}%</span></div>
          </article>
          <article className="kpi-card quality">
            <div className="kpi-label"><span>QUALIDADE FEDERATIVA</span><i className="trend neutral">11 entes</i></div>
            <strong>92,7</strong><p><b>+2,1 pts</b> no ciclo atual</p>
            <div className="quality-dots"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i className="dim" /></div>
          </article>
        </section>

        <div className={moduleId === "m0" ? "" : "generic-hidden"}>
          <ControlTowerModule
            contextItem={contextItem}
            territory={territory}
            clockLabel={formatClock(clock)}
            currentEvent={currentEvent}
            journeyStep={journeyStep}
            running={running}
            onNavigate={setContextItem}
            onOpenModule={switchModule}
            onStartJourney={(journeyId) => {
              const journey = journeys.find((item) => item.id === journeyId);
              if (journey) startJourney(journey);
            }}
            onOpenAgent={() => setAgentOpen(true)}
            onCreateRecord={() => setFormOpen(true)}
            onToast={setToast}
          />
        </div>

        <div className={moduleId === "m1" ? "" : "generic-hidden"}>
          <IdentityHub
            contextItem={contextItem}
            territory={territory}
            clockLabel={formatClock(clock)}
            onNavigate={setContextItem}
            onOpenModule={switchModule}
            onOpenAgent={() => setAgentOpen(true)}
            onCreateRecord={() => setFormOpen(true)}
            onToast={setToast}
          />
        </div>

        <div className={moduleId === "m2" ? "" : "generic-hidden"}>
          <PassportHub
            contextItem={contextItem}
            territory={territory}
            clockLabel={formatClock(clock)}
            onNavigate={setContextItem}
            onOpenModule={switchModule}
            onCreateRecord={() => setFormOpen(true)}
            onToast={setToast}
          />
        </div>

        <div className={moduleId === "m3" ? "" : "generic-hidden"}>
          <RegulatoryHub
            contextItem={contextItem}
            territory={territory}
            clockLabel={formatClock(clock)}
            onNavigate={setContextItem}
            onOpenModule={switchModule}
            onCreateRecord={() => setFormOpen(true)}
            onToast={setToast}
          />
        </div>

        <div className={moduleId === "m4" ? "" : "generic-hidden"}>
          <UseRegulationHub
            contextItem={contextItem}
            territory={territory}
            clockLabel={formatClock(clock)}
            onNavigate={setContextItem}
            onOpenModule={switchModule}
            onCreateRecord={() => setFormOpen(true)}
            onToast={setToast}
          />
        </div>

        <div className={moduleId === "m5" ? "" : "generic-hidden"}>
          <DataHub
            contextItem={contextItem}
            territory={territory}
            clockLabel={formatClock(clock)}
            onNavigate={setContextItem}
            onOpenModule={switchModule}
            onCreateRecord={() => setFormOpen(true)}
            onToast={setToast}
          />
        </div>

        <div className={moduleId === "m6" ? "" : "generic-hidden"}>
          <BalanceScenariosHub
            contextItem={contextItem}
            territory={territory}
            clockLabel={formatClock(clock)}
            onNavigate={setContextItem}
            onOpenModule={switchModule}
            onCreateRecord={() => setFormOpen(true)}
            onToast={setToast}
          />
        </div>

        <section className={`workspace-grid ${hideWorkspace ? "generic-hidden" : ""} ${showSpecialistMap ? "identity-map-only" : ""}`}>
          <article className="panel map-panel">
            <header className="panel-header map-header">
              <div><h2>Quadro geoespacial comum</h2><p>ArcGIS Maps SDK 5.1 · contexto sincronizado</p></div>
              <div className="map-mode"><button className="active">2D</button><button onClick={() => setToast("Visão 3D prevista para o cenário de operação de reservatórios.")}>3D</button></div>
            </header>
            <div className="map-body">
              {!mapReady && <div className="map-skeleton"><Skeleton count={1} height="100%" baseColor="#122b3c" highlightColor="#1a3b50" /></div>}
              {React.createElement(
                "arcgis-map",
                { ref: mapRef as any, id: "cht-map", basemap: "osm", center: "-52,-14", zoom: "4", "aria-label": "Mapa operacional do CHT Brasil", suppressHydrationWarning: true },
                React.createElement("arcgis-zoom", { slot: "top-left", key: "zoom", suppressHydrationWarning: true }),
                React.createElement("arcgis-search", { slot: "top-right", key: "search", suppressHydrationWarning: true }),
                React.createElement("arcgis-legend", { slot: "bottom-right", key: "legend", suppressHydrationWarning: true }),
              )}
              <div className="map-toolbar">
                <button onClick={() => setToast("Ferramenta de seleção territorial ativada.")}>⌖<span>Selecionar</span></button>
                <button onClick={() => setToast("Medição ArcGIS pronta para uso no mapa.")}>⌁<span>Medir</span></button>
                <button onClick={() => setToast("Comparação temporal: 07 ago 2026 × 07 jul 2026.")}>◫<span>Comparar</span></button>
              </div>
              <div className="layer-control">
                <div className="layer-title"><span>▧ Camadas ativas</span><small>4 disponíveis</small></div>
                <label><input type="checkbox" checked={layerState.hydro} onChange={() => toggleLayer("hydro")} /><i className="layer-swatch hydro" /><span><b>Hidrografia de referência</b><small>Living Atlas · Esri</small></span></label>
                <label><input type="checkbox" checked={layerState.ana} onChange={() => toggleLayer("ana")} /><i className="layer-swatch ana" /><span><b>Hidrografia / BHO</b><small>SNIRH · ANA</small></span></label>
                <label><input type="checkbox" checked={layerState.cht} onChange={() => toggleLayer("cht")} /><i className="layer-swatch cht" /><span><b>Objetos e UTHs</b><small>CHT · sintético</small></span></label>
                <label><input type="checkbox" checked={layerState.risk} onChange={() => toggleLayer("risk")} /><i className="layer-swatch risk" /><span><b>Criticidade hídrica</b><small>Cenário · 14:32 BRT</small></span></label>
              </div>
              <div className="map-status"><span className="live-pip" /> LIVE <b>{formatClock(clock)} BRT</b><i>EPSG:3857</i></div>
            </div>
            <footer className="selection-strip">
              <div className="selection-icon">⌖</div>
              <div><small>SELEÇÃO ATIVA</small><strong>{["m1", "m2", "m3", "m4", "m5", "m6"].includes(moduleId) ? mapFocus.label : currentEvent.title}</strong><span>{["m1", "m2", "m3", "m4", "m5", "m6"].includes(moduleId) ? `${mapFocus.source} · confiança ${(mapFocus.confidence / 100).toFixed(2).replace(".", ",")}` : `${currentEvent.source} · confiança ${journeyStep > 2 ? "0,92" : "0,88"}`}</span></div>
              <button onClick={() => moduleId === "m1" ? setContextItem("Versões") : moduleId === "m2" ? setContextItem("Regularidade") : moduleId === "m3" ? setContextItem("Competências") : moduleId === "m4" ? setContextItem("Demandas") : moduleId === "m5" ? setContextItem("Séries") : moduleId === "m6" ? setContextItem("Comparações") : setDecisionOpen(true)}>{moduleId === "m1" ? "Abrir identidade →" : moduleId === "m2" ? "Abrir passaporte →" : moduleId === "m3" ? "Abrir competência →" : moduleId === "m4" ? "Abrir demanda →" : moduleId === "m5" ? "Abrir série →" : moduleId === "m6" ? "Comparar cenários →" : "Abrir dossiê →"}</button>
            </footer>
          </article>

          <div className="operations-column">
            <article className="panel journey-panel">
              <header className="panel-header"><div><h2>Jornadas ponta a ponta</h2><p>Simulação correlacionada</p></div><span className="seed-tag">SEED 2026</span></header>
              <div className="journey-tabs">
                {journeys.map((journey) => <button key={journey.id} className={activeJourneyId === journey.id ? "active" : ""} onClick={() => startJourney(journey)}><b>{journey.id.toUpperCase()}</b><span>{journey.name}</span></button>)}
              </div>
              <div className="journey-summary"><div><small>JORNADA ATIVA</small><strong>{activeJourney.name}</strong><span>{activeJourney.short}</span></div><div className="progress-ring" style={{ "--progress": `${completion * 3.6}deg` } as React.CSSProperties}><span>{completion}%</span></div></div>
              <div className="event-feed">
                {activeJourney.events.map((event, index) => (
                  <button key={event.title} className={`${index < journeyStep ? "done" : ""} ${index === journeyStep ? "current" : ""}`} onClick={() => setJourneyStep(index)}>
                    <span className={`event-node ${index <= journeyStep ? statusColor[event.status] : "pending"}`}>{index < journeyStep ? "✓" : index + 1}</span>
                    <div><strong>{event.title}</strong><small>{event.agent}</small></div>
                    {index === journeyStep && <i>AGORA</i>}
                  </button>
                ))}
              </div>
              <button className="journey-action" onClick={() => setAgentOpen(true)}>Ver execução e evidências <span>→</span></button>
            </article>

            <article className="panel agent-brief">
              <div className="agent-avatar">✦</div>
              <div className="agent-copy"><span>AGENTE EM EXECUÇÃO</span><strong>{currentEvent.agent}</strong><p>{currentEvent.detail}</p><div className="confidence"><span><i style={{ width: `${82 + journeyStep * 2}%` }} /></span><b>{82 + journeyStep * 2}% confiança</b></div></div>
              <button onClick={() => setAgentOpen(true)}>•••</button>
            </article>
          </div>
        </section>

        <section className={`analytics-grid ${(moduleId === "m0" && contextItem !== "Visão nacional") || moduleId === "m1" || moduleId === "m2" || moduleId === "m3" || moduleId === "m4" || moduleId === "m5" || moduleId === "m6" ? "generic-hidden" : ""}`}>
          <article className="panel balance-card">
            <header className="panel-header"><div><h2>Balanço hídrico integrado</h2><p>Bacia selecionada · hm³/mês</p></div><button onClick={() => setDetailTab("entregas")}>Detalhar ↗</button></header>
            <div className="balance-main"><div><small>OFERTA DE REFERÊNCIA</small><strong>18,4 <em>hm³</em></strong><span>faixa de incerteza ± 1,1</span></div><div className="balance-divider" /><div><small>DEMANDA COMPROMETIDA</small><strong className="warn-text">13,1 <em>hm³</em></strong><span>71% da referência</span></div></div>
            <div className="stacked-bar"><i className="authorized" style={{ width: `${51 + journeyStep}%` }} /><i className="pending" style={{ width: "20%" }} /><i className="reserve" /></div>
            <div className="bar-legend"><span><i className="authorized" /> Autorizada 9,4</span><span><i className="pending" /> Em análise 3,7</span><span><i className="reserve" /> Reserva 5,3</span></div>
            <div className="forecast"><div className="forecast-axis"><span>AGO</span><span>SET</span><span>OUT</span><span>NOV</span><span>DEZ</span></div><div className="forecast-line"><i style={{ left: "2%", bottom: "62%" }} /><i style={{ left: "25%", bottom: "54%" }} /><i style={{ left: "49%", bottom: "38%" }} /><i style={{ left: "73%", bottom: "30%" }} /><i style={{ left: "96%", bottom: "44%" }} /><b /></div></div>
          </article>

          <article className="panel decision-card">
            <header className="panel-header"><div><h2>Fila de decisão humana</h2><p>Risco, confiança e prazo</p></div><span className="counter">{3 + (journeyStep > 3 ? 1 : 0)}</span></header>
            <button className="decision-item critical" onClick={() => setDecisionOpen(true)}><span className="decision-severity">!</span><div><strong>Validar ordem de vistoria</strong><small>GF-2026-0917 · confiança 88%</small></div><time>28 min</time></button>
            <button className="decision-item" onClick={() => setDecisionOpen(true)}><span className="decision-severity">◇</span><div><strong>Aprovar encaminhamento</strong><small>CHT-2026-1842 · 4 fontes</small></div><time>1h 42</time></button>
            <button className="decision-item" onClick={() => setDecisionOpen(true)}><span className="decision-severity">⌁</span><div><strong>Escolher cenário operativo</strong><small>EC-2026-0048 · 3 alternativas</small></div><time>8 min</time></button>
            <button className="text-action" onClick={() => { setModuleId("m0"); setContextItem("Agenda de decisões"); }}>Ver toda a fila →</button>
          </article>

          <article className="panel integrations-card">
            <header className="panel-header"><div><h2>Integrações críticas</h2><p>Saúde e latência</p></div><button onClick={() => switchModule("m11")}>Governança ↗</button></header>
            {[
              ["Águas Brasil", "Operacional", "18 s", "ok"],
              ["Hidroweb / Telemetria", "Operacional", "42 s", "ok"],
              ["Living Atlas", "Operacional", "1,2 s", "ok"],
              ["Estado · piloto BA", "Modo parcial", "16 min", "warn"],
            ].map((row) => <div className="integration-row" key={row[0]}><span className={`integration-dot ${row[3]}`} /><div><strong>{row[0]}</strong><small>{row[1]}</small></div><time>{row[2]}</time></div>)}
          </article>
        </section>

        <section className={`panel cases-panel ${moduleId === "m0" || moduleId === "m1" || moduleId === "m2" || moduleId === "m3" || moduleId === "m4" || moduleId === "m5" || moduleId === "m6" ? "generic-hidden" : ""}`}>
          <header className="panel-header"><div><h2>Casos e processos correlacionados</h2><p>Seleção territorial, tabela e agentes compartilham o mesmo contexto</p></div><div className="table-actions"><button onClick={() => setToast("Filtros de risco e SLA aplicados à tabela.")}>☷ Filtros</button><button onClick={exportReport}>⇩ CSV</button></div></header>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID / CASO</th><th>TIPO</th><th>RISCO</th><th>SLA</th><th>RESPONSÁVEL</th><th>STATUS</th><th /></tr></thead>
              <tbody>{cases.map((item, index) => <tr key={item.id} className={index === journeyStep % cases.length ? "selected" : ""}><td><strong>{item.id}</strong><span>{item.title}</span></td><td>{item.type}</td><td><span className={`risk-pill ${item.risk.toLowerCase().replace("í", "i")}`}>{item.risk}</span></td><td className={item.risk === "Crítico" ? "sla-critical" : ""}>{item.sla}</td><td>{item.owner}</td><td><span className="status-pill"><i />{item.status}</span></td><td><button onClick={() => setDecisionOpen(true)} aria-label={`Abrir ${item.id}`}>→</button></td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className={`module-blueprint panel ${moduleId === "m0" || moduleId === "m1" || moduleId === "m2" || moduleId === "m3" || moduleId === "m4" || moduleId === "m5" || moduleId === "m6" ? "generic-hidden" : ""}`}>
          <header className="blueprint-header"><div><span className="module-code">{activeModule.code}</span><div><h2>{activeModule.name}</h2><p>{activeModule.short}</p></div></div><div className="blueprint-tabs"><button className={detailTab === "operacao" ? "active" : ""} onClick={() => setDetailTab("operacao")}>Features</button><button className={detailTab === "fluxo" ? "active" : ""} onClick={() => setDetailTab("fluxo")}>Fluxo operacional</button><button className={detailTab === "formulario" ? "active" : ""} onClick={() => setDetailTab("formulario")}>Inputs</button><button className={detailTab === "entregas" ? "active" : ""} onClick={() => setDetailTab("entregas")}>Outputs & reports</button><button className={detailTab === "integracoes" ? "active" : ""} onClick={() => setDetailTab("integracoes")}>Integrações & IA</button></div></header>
          <div className="blueprint-body">
            {detailTab === "operacao" && <div className="feature-grid">{activeModule.features.map((item, index) => <article key={item}><span>0{index + 1}</span><strong>{item}</strong><p>Capacidade nativa do produto, ligada ao contexto CHT e à trilha de auditoria.</p></article>)}</div>}
            {detailTab === "fluxo" && <div className="flow-track">{activeModule.flow.map((item, index) => <div key={item}><span>{index + 1}</span><strong>{item}</strong><small>{index === activeModule.flow.length - 1 ? "Resultado e feedback" : "Evento + responsável + SLA"}</small></div>)}</div>}
            {detailTab === "formulario" && <div className="input-spec"><div>{activeModule.inputs.map((item, index) => <label key={item}><span>{item}</span>{index === 0 ? <select defaultValue=""><option value="" disabled>Selecione o contexto</option><option>{territory}</option></select> : <input placeholder={`Informe ${item.toLowerCase()}`} />}</label>)}</div><aside><span>VALIDAÇÃO INTELIGENTE</span><strong>4 de 4 contratos disponíveis</strong><p>O agente apoia preenchimento e detecta inconsistências; nenhuma decisão jurídica é automatizada.</p><button onClick={() => setFormOpen(true)}>Abrir formulário completo →</button></aside></div>}
            {detailTab === "entregas" && <div className="deliverables-grid"><div><h3>Outputs operacionais</h3>{activeModule.outputs.map((item) => <span key={item}>✓ {item}</span>)}</div><div><h3>Relatórios</h3>{activeModule.reports.map((item) => <span key={item}>▤ {item}</span>)}</div><div><h3>Gráficos e mapas</h3>{activeModule.charts.map((item) => <span key={item}>⌁ {item}</span>)}</div></div>}
            {detailTab === "integracoes" && <div className="integration-spec"><div><h3>Fontes e sistemas</h3>{activeModule.integrations.map((item, index) => <button key={item} onClick={() => setToast(`${item}: contrato, ciclo, autoridade e SLA exibidos no catálogo.`)}><i className={index === activeModule.integrations.length - 1 ? "warn" : "ok"} /><span><strong>{item}</strong><small>{index % 2 ? "API / evento" : "Feature Service / lote"}</small></span><b>↗</b></button>)}</div><div><h3>Agentes associados</h3>{activeModule.agents.map((item, index) => <button key={item} onClick={() => setAgentOpen(true)}><span className="mini-agent">A{String(index + 1).padStart(2, "0")}</span><span><strong>{item}</strong><small>governado · aprovação humana</small></span><b>→</b></button>)}</div></div>}
          </div>
        </section>
      </main>

      <footer className="simulator-dock">
        <div className="simulator-title"><span className={running ? "live-pip" : "paused-pip"} /><div><small>EVENT BUS · {running ? "LIVE" : "PAUSADO"}</small><strong>{formatClock(clock)} <em>BRT</em></strong></div></div>
        <div className="simulator-controls"><button onClick={replayJourney} title="Voltar ao início">↶</button><button className="play-button" onClick={() => setRunning((value) => !value)}>{running ? "Ⅱ" : "▶"}</button><button onClick={advanceJourney} title="Avançar um evento">▸</button><span>VELOCIDADE</span>{[1, 2, 5].map((value) => <button key={value} className={speed === value ? "active" : ""} onClick={() => setSpeed(value)}>{value}×</button>)}</div>
        <div className="simulator-event"><span>{activeJourney.id.toUpperCase()} · EVENTO {journeyStep + 1}/{activeJourney.events.length}</span><strong>{currentEvent.title}</strong><small>correlationId · cht-{activeJourney.id}-9f2d</small></div>
        <button className="replay-mode" onClick={replayJourney}>◴ Modo replay</button>
      </footer>

      {launcherOpen && <div className="modal-backdrop" onMouseDown={() => setLauncherOpen(false)}><section className="launcher-modal" role="dialog" aria-modal="true" aria-label="Aplicações CHT Brasil" onMouseDown={(event) => event.stopPropagation()}><header><div><small>SUÍTE FEDERADA</small><h2>Aplicações CHT Brasil</h2><p>Selecione um produto. O território, o período e as permissões permanecem ativos.</p></div><button onClick={() => setLauncherOpen(false)} aria-label="Fechar">×</button></header><div className="launcher-search"><span>⌕</span><input autoFocus value={launcherQuery} onChange={(event) => setLauncherQuery(event.target.value)} placeholder="Buscar módulo, processo ou capacidade…" /></div><div className="launcher-grid">{filteredModules.map((item) => <button key={item.id} className={item.id === moduleId ? "active" : ""} onClick={() => switchModule(item.id)} style={{ "--card-accent": item.accent } as React.CSSProperties}><span className="launcher-icon">{item.icon}</span><div><small>{item.code}</small><strong>{item.name}</strong><p>{item.short}</p></div><i>→</i></button>)}</div><footer><span><i className="live-pip" /> 13 produtos operacionais</span><button onClick={() => startJourney(journeys[0])}>Iniciar tour guiado →</button></footer></section></div>}

      {agentOpen && <div className="drawer-backdrop" onMouseDown={() => setAgentOpen(false)}><aside className="agent-drawer" onMouseDown={(event) => event.stopPropagation()}><header><div className="agent-avatar large">✦</div><div><small>EXECUÇÃO AO VIVO</small><h2>{currentEvent.agent}</h2><p>Trace A{journeyStep + 1}-9f2d · versão 3.4.2</p></div><button onClick={() => setAgentOpen(false)}>×</button></header><div className="guardrail"><span>ESCOPOS ATIVOS</span><div><b>Consultar</b><b>Analisar</b><b>Redigir</b><b className="blocked">Decidir ✕</b></div></div><section className="agent-plan"><h3>Plano de execução</h3>{activeJourney.events.slice(0, Math.min(journeyStep + 2, activeJourney.events.length)).map((event, index) => <div key={event.title} className={index <= journeyStep ? "complete" : "waiting"}><span>{index < journeyStep ? "✓" : index === journeyStep ? "●" : "○"}</span><div><strong>{event.title}</strong><p>{event.detail}</p><small>{event.source} · {index <= journeyStep ? `${640 + index * 180} ms` : "aguardando"}</small></div></div>)}</section><section className="evidence-box"><h3>Evidências e grounding</h3><button><span>▤</span><div><strong>{currentEvent.source}</strong><small>consulta versionada · {formatClock(clock)}</small></div><i>↗</i></button><button><span>⌖</span><div><strong>Contexto espacial CHT</strong><small>extent, UTHs, autoridade e relações</small></div><i>↗</i></button><button><span>◇</span><div><strong>Política AGT-HIL-008</strong><small>aprovação humana obrigatória</small></div><i>↗</i></button></section><section className="agent-output"><div><h3>Saída estruturada</h3><span>{82 + journeyStep * 2}% confiança</span></div><p><b>Fato:</b> {currentEvent.detail}</p><p><b>Inferência:</b> o caso possui informação suficiente para avançar à próxima etapa controlada.</p><p><b>Limite:</b> a autoridade deve validar qualquer despacho, ato ou medida.</p></section><footer><button className="kill-button" onClick={() => { setRunning(false); setToast("Execução pausada e transferida para supervisão humana."); }}>■ Pausar e assumir</button><button className="primary-button" onClick={() => setDecisionOpen(true)}>Revisar proposta →</button></footer></aside></div>}

      {formOpen && <div className="modal-backdrop" onMouseDown={() => setFormOpen(false)}><form className="form-modal" onSubmit={submitForm} onMouseDown={(event) => event.stopPropagation()}><header><div><small>{activeModule.code} · NOVO REGISTRO</small><h2>{activeModule.inputs[0]}</h2><p>Os campos são validados contra identidade, território, unidade e autoridade.</p></div><button type="button" onClick={() => setFormOpen(false)}>×</button></header><div className="form-grid">{activeModule.inputs.map((item, index) => <label key={item} className={index === 0 ? "full" : ""}><span>{item}<b>*</b></span>{index === 0 ? <select required defaultValue=""><option value="" disabled>Selecione…</option><option>{territory}</option><option>Informar novo objeto ou geometria</option></select> : index === 2 ? <select required defaultValue=""><option value="" disabled>Selecione…</option><option>Fonte oficial integrada</option><option>Declaração do usuário</option><option>Observação de campo</option></select> : <input required placeholder={`Informe ${item.toLowerCase()}`} />}</label>)}</div><div className="form-assistant"><span>✦</span><div><strong>Apoio inteligente disponível</strong><p>Identidade, competência e possíveis inconsistências serão exibidas antes do envio.</p></div><button type="button" onClick={() => setToast("Sugestões aplicadas: unidade, período e fonte normalizados.")}>Aplicar sugestões</button></div><label className="form-notes"><span>Observações e finalidade</span><textarea placeholder="Descreva o objetivo operacional e informações complementares…" /></label><footer><span>Rascunho salvo localmente · agora</span><div><button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>Cancelar</button><button type="submit" className="primary-button">Validar e criar workflow →</button></div></footer></form></div>}

      {decisionOpen && <div className="modal-backdrop" onMouseDown={() => setDecisionOpen(false)}><section className="decision-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><small>APROVAÇÃO HUMANA · RISCO MODERADO</small><h2>Revisar proposta assistida</h2><p>{activeJourney.name} · {currentEvent.agent}</p></div><button onClick={() => setDecisionOpen(false)}>×</button></header><div className="decision-summary"><div><span>CONFIANÇA</span><strong>{82 + journeyStep * 2}%</strong></div><div><span>FONTES</span><strong>{3 + journeyStep}</strong></div><div><span>POLÍTICA</span><strong>HIL-2</strong></div><div><span>SLA</span><strong>28 min</strong></div></div><div className="decision-block"><span>FATOS RECUPERADOS</span><p>{currentEvent.detail}</p><small>Fonte: {currentEvent.source} · {formatClock(clock)} BRT</small></div><div className="decision-block inference"><span>INFERÊNCIA DO AGENTE</span><p>O conjunto de evidências é consistente para avançar à próxima etapa, mantendo as ressalvas de incerteza e competência.</p></div><div className="decision-block recommendation"><span>PROPOSTA</span><p>Autorizar o encaminhamento controlado, registrar condicionante de revisão e preservar a marcação “simulado”.</p></div><label className="decision-justification"><span>Justificativa da autoridade</span><textarea defaultValue="Concordo com o encaminhamento, considerando as fontes citadas e os limites registrados." /></label><footer><button className="reject-button" onClick={() => resolveDecision("Rejeição")}>Rejeitar</button><button className="secondary-button" onClick={() => resolveDecision("Devolução para ajustes")}>Editar e devolver</button><button className="primary-button" onClick={() => resolveDecision("Aprovação humana")}>✓ Aprovar e registrar</button></footer></section></div>}

      <div className={`toast ${toast ? "show" : ""}`} role="status"><span>✓</span><p>{toast}</p><button onClick={() => setToast("")}>×</button></div>
    </div>
  );
}
