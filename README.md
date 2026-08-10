# CHT Brasil — mockup funcional

Protótipo navegável da suíte **Cadastro Hídrico Territorial do Brasil — o CAR da Água**. A aplicação demonstra como identidade territorial, GIS, dados federados, workflows, modelagem e agentes governados podem operar sobre o mesmo contexto e linha do tempo.

## Experiência implementada

- shell corporativo de missão crítica com navegação global e menu contextual;
- seletor de produtos M0–M12, preservando território, tempo e caso ativo;
- mapa real com ArcGIS Maps SDK for JavaScript 5.1 Web Components;
- base OSM, ANA Hidrografia/BHO, Living Atlas Hydro Reference e camadas sintéticas CHT;
- dashboards, mapa, workflows, tabelas, status, formulários e relatórios por módulo;
- jornadas J1 Ampliação de captação, J2 Vistoria inteligente e J3 Crise hídrica;
- event bus demonstrativo com live, pause, avanço, velocidades 1×/2×/5× e replay;
- Central de Agentes com trace, fontes, confiança, guardrails, aprovação e kill switch;
- decisões humanas explícitas e dados sintéticos identificados na interface.

## Organização dos produtos

| Código | Produto | Missão |
| --- | --- | --- |
| M0 | Torre de Controle | visão nacional, alertas, casos e decisões |
| M1 | Identidade Hídrica | CHT-ID, UTH, crosswalks e proveniência |
| M2 | Passaporte Hídrico | cadastro federado, obrigações e compartilhamento |
| M3 | Motor Regulatório | competência, regras versionadas e GeoRAG |
| M4 | Regulação de Usos | pré-análise, outorga, cobrança e automonitoramento |
| M5 | Data Hub | estações, séries, telemetria e qualidade |
| M6 | Balanço & Cenários | modelos, oferta, demanda e incerteza |
| M7 | GeoFiscalização | detecção, risco, campo, evidência e despacho |
| M8 | Planejamento Hídrico | planos, portfólio, investimento e resultado |
| M9 | Eventos Críticos | seca, cheia, incidentes, alternativas e resposta |
| M10 | Qualidade da Água | enquadramento, pressões, cargas e recuperação |
| M11 | Governança Federativa | contratos, qualidade, acesso e transparência |
| M12 | Central de Agentes | orquestração, aprovações e observabilidade |

## Arquitetura de demonstração

O estado compartilhado funciona como um **Context Bus**: módulo, território, jornada, evento, mapa, indicadores, fila e agente mudam de forma coordenada. Os dados são fixtures determinísticas no cliente; as integrações reais usadas no mapa são somente serviços públicos. Em produção, o mesmo contrato pode ser conectado a APIs, eventos, Feature Services, OGC APIs, STAC e motores BPM.

O mockup nunca concede aos agentes autoridade para outorgar, sancionar, publicar atos, emitir boletins oficiais ou encerrar incidentes. Esses passos usam a fila de aprovação humana.

## M0 — Torre de Controle detalhada

A Torre de Controle opera como o centro de coordenação da suíte e possui sete visões conectadas:

- **Visão nacional:** arquitetura fonte → Event Bus → Context Bus → consumidores, rede M1–M12 e quadro de comando;
- **Mapa operacional:** composição de camadas ANA/Living Atlas/CHT, ações territoriais e handoff para módulos especialistas;
- **Alertas:** filtros, priorização, evidências, confiança, reconhecimento, escalonamento e criação de caso;
- **Casos:** fluxo de triagem, investigação, decisão, monitoramento e conclusão, preservando SLA e correlationId;
- **Agenda de decisões:** proposta estruturada, autoridade competente, fatos, inferências, limites e aprovação humana;
- **Briefing:** síntese editável por turno, fontes, mudanças, validação e exportação;
- **Desempenho:** saúde das integrações, qualidade, frescor, consumidores, throughput e SLA por fluxo crítico.

Alertas podem gerar casos; casos avançam por workflow; decisões aprovadas atualizam o caso; integrações expõem seus consumidores; e qualquer handoff abre M4, M5, M7, M9, M11 ou M12 mantendo o mesmo contexto territorial.

## M1 — Identidade Hídrica detalhada

O núcleo mestre resolve a identidade compartilhada pelos demais produtos sem substituir a autoridade dos sistemas de origem. As oito áreas são funcionais e mantêm seleção, território, mapa e versão sincronizados:

- **Busca mestre:** pesquisa multichave por CHT-ID, identificador federado, nome, ato, endereço ou coordenada, com golden record, confiança e proveniência;
- **UTHs:** registro territorial com endereço hídrico, domínio, autoridade, fontes e ciclo de vida que nunca reutiliza um identificador;
- **Resolver duplicidades:** fila explicável, comparação lado a lado, evidências, divergências e fusão humana, reversível e versionada;
- **Crosswalks:** correspondências temporais bidirecionais entre CNARH, Águas Brasil, órgãos estaduais, SICAR, SIGEF e Hidroweb;
- **Relações:** grafo territorial, hidrológico, regulatório e observacional com handoff para os módulos consumidores;
- **Versões:** histórico imutável, diff de atributos, fontes e relações, além de solicitação governada de reversão;
- **Qualidade:** KPIs, contratos por fonte e fila de inconsistências com encaminhamento para curadoria e Torre de Controle;
- **Importação:** wizard fonte → mapeamento → validação → resolução → publicação, com idempotência, exceções e eventos downstream.

O M1 publica `cht:focus-map` para o quadro ArcGIS e `cht:module-event` para o M0. Assim, uma inconsistência ou importação com exceções aparece na Torre de Controle, enquanto a escolha de uma identidade reposiciona o mapa no mesmo contexto. A fusão de identidades críticas sempre exige curador humano e cria uma nova versão; registros brutos, identificadores de origem e decisões anteriores permanecem preservados.

## M2 — Passaporte Hídrico detalhado

O Passaporte Hídrico reúne o contexto necessário para orientar pessoas, empresas e autoridades sem substituir os cadastros, atos e certidões mantidos nas fontes oficiais. Sete áreas operam sobre o mesmo CHT-ID:

- **Meus territórios:** carteira de passaportes vinculados, papel do usuário, completude, situação contextual, próxima obrigação e atividade recente;
- **Buscar passaporte:** busca protegida por papel e finalidade, com dados pessoais mascarados e sincronização territorial no mapa;
- **Regularidade:** matriz explicável de identidade, representação, atos, licenciamento, monitoramento e fiscalização, sempre distinguindo fatos, inferências e limites;
- **Obrigações:** agenda de prazos, autoridade, evidência e situação, com conclusão registrada ou handoff para M3, M4, M5 e M7;
- **Evidências:** cofre versionado com fonte, referência, captura, vigência, integridade e validação assistida, sem apagar itens expirados;
- **Solicitações:** workflow em seis etapas para vínculo, retificação e complementação, incluindo identidade M1, Gov.br, evidências e aprovação humana;
- **Compartilhamentos:** acesso temporário, consentido, minimizado, autenticado, rastreável e imediatamente revogável.

O Copiloto do Passaporte consulta M1, Águas Brasil, Gov.br e M5, explica pendências e propõe tratamento, mas não certifica regularidade, representação ou vínculo. O M1 emite `cht:identity-context`, o M2 distribui `cht:passport-context` aos consumidores e usa `cht:module-event` para enviar atrasos e aprovações ao M0. Seleções continuam usando `cht:focus-map` no quadro ArcGIS compartilhado.

## Configuração GIS

O protótipo usa o CDN oficial do ArcGIS Maps SDK 5.1. Não há chave hardcoded. A demonstração usa OSM e serviços públicos, portanto funciona sem segredo. Em uma evolução autenticada, a chave deve ser fornecida apenas por variável de ambiente e restringida por domínio e escopo.

Fontes públicas demonstradas:

- ANA/SNIRH — Hidrografia/BHO;
- ArcGIS Living Atlas — Esri Hydro Reference Overlay;
- camadas locais sintéticas de UTHs, objetos e criticidade.

## Roteiro rápido

1. Abra **Aplicações** e navegue entre os 13 produtos; percorra as oito visões do M1 e as sete visões funcionais do M2.
2. Altere o **Contexto territorial** na barra superior.
3. Inicie J1, J2 ou J3 e use os controles live/replay no rodapé.
4. Abra a execução do agente para ver plano, ferramentas, evidências e limites.
5. Use **Revisar proposta** para aprovar, editar ou rejeitar com justificativa.
6. Explore as abas de blueprint para features, fluxo, inputs, outputs, reports e integrações de cada módulo.

## Execução local

Requer Node.js 22 ou superior.

```bash
npm install
npm run dev
```

Validação:

```bash
npm run build
node --test tests/rendered-html.test.mjs
```

## Limitações do mockup

- dados de negócio, atos, pessoas e decisões são sintéticos;
- downloads são demonstrativos e não representam documentos oficiais;
- integrações externas podem variar em disponibilidade; o mapa e as jornadas mantêm fallback local;
- autenticação, persistência federativa, assinatura e efeitos transacionais são contratos de produção, não capacidades deste protótipo.
