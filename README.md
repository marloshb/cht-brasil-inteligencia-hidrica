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

## M3 — Motor Regulatório detalhado

O Motor Regulatório transforma instrumentos e matrizes de competência em representações citáveis, territoriais, temporais e testáveis. O conteúdo demonstrativo sempre orienta a conferência na fonte oficial e não produz decisão jurídica automaticamente. O produto possui oito áreas:

- **Regras:** catálogo com autoridade, fonte, vigência, território, expressão canônica, explicação, confiança, testes e consumidores;
- **Competências:** resolvedor baseado em CHT-ID, geometria, domínio do trecho, finalidade e data de referência, com evidências e resultado indicativo;
- **Instrumentos:** captura governada de leis, matrizes, atos e deliberações, preservando texto, publicação, vigência e regras derivadas;
- **Agenda regulatória:** marcos futuros, releases, mudanças de contratos e análise de impacto nos módulos consumidores;
- **Testes:** casos unitários, territoriais, temporais e de regressão, com falhas bloqueando a promoção de releases;
- **Conflitos:** fila de sobreposições por hierarquia, território, vigência, finalidade e autoridade, sempre resolvida por decisão humana;
- **Versões:** releases imutáveis, comparação de regras e vocabulários, gates de promoção e histórico de aprovações;
- **Consultas:** GeoRAG Normativo com contexto espacial e temporal, fontes citadas, confiança, explicação e limites de uso.

O M3 recebe `cht:passport-context` do M2, publica `cht:regulatory-context` para M4 e demais consumidores, usa `cht:focus-map` para competência territorial e envia conflitos, releases e validações ao M0 por `cht:module-event`. O agente pode consultar, citar, testar e explicar, mas não decidir, certificar, conceder ou negar atos.

## M4 — Regulação de Usos detalhada

O módulo operacionaliza demandas e obrigações de uso da água sem substituir a análise técnica nem a autoridade responsável pelo ato. Todas as áreas compartilham CHT-ID, passaporte, competência, ato, medição, cenário e trilha de decisão:

- **Pré-análise:** workflow executável em seis etapas, dossiê federado, comparação demanda × autorização, checklist, alternativas e proposta não vinculante;
- **Demandas:** triagem, pré-análise, exigência, decisão humana, protocolo demonstrativo e acompanhamento por SLA, risco e autoridade;
- **Atos:** registro federado de autorizações, fontes, vigências, limites, regimes, versões e relações com M1, M2, M3 e M5;
- **Condicionantes:** agenda sincronizada, filtros, evidência versionada, conclusão rastreável e retorno das obrigações ao passaporte M2;
- **Automonitoramento:** série temporal, limites, lacunas, flags e reconciliação que preserva o dado bruto e publica uma versão qualificada no M5;
- **Cobrança:** memória transparente e simulada com volume, preço, coeficiente, fontes e divergências, sem emissão financeira;
- **Revisões:** gatilhos por demanda, vigência, regra, identidade ou medição, com snapshot, análise de impacto e decisão da autoridade;
- **Conflitos:** comparação de demanda e restrição, fatores de risco, evidências, alternativas, recomendação assistida e decisão humana justificada.

O M4 recebe `cht:regulatory-context` do M3 e também aceita `cht:passport-context` do M2. Publica `cht:regulation-context` para M5, M6 e M7; devolve prazos e conclusões ao M2 por `cht:regulation-obligation-event`; sincroniza a seleção com o ArcGIS por `cht:focus-map`; e envia demandas críticas, revisões e decisões ao M0 por `cht:module-event`. O agente de Pré-análise Regulatória pode consultar, comparar, simular e redigir, mas seu escopo de outorgar permanece bloqueado e qualquer encaminhamento exige revisão humana.

## M5 — Data Hub detalhado

O Data Hub integra observações hidrológicas, telemetria, automonitoramento e imagens orbitais em produtos rastreáveis. O fluxo preserva o dado bruto, aplica contratos e QA/QC, cria versões qualificadas e entrega contexto consistente aos módulos consumidores. O produto possui oito áreas operacionais:

- **Estações:** rede integrada com identidade, operador, variáveis, saúde, latência, completude, qualidade, localização ArcGIS e registro governado de novos pontos;
- **Séries:** hidrograma, comparação bruto × qualificado, linhagem raw → validação → QA/QC → publicação, versões, flags e exportação com metadados;
- **Telemetria:** conectores API, MQTT e lote, offsets, filas, idempotência, replay, contratos, event stream e pausa sem perda de estado;
- **Imagens:** busca STAC, Sentinel, Landsat, CBERS e GOES, cobertura, COG, máscaras, índices, vetores derivados, incerteza e eventos territoriais;
- **Cobertura:** disponibilidade espacial, temporal e por variável, redundância, lacunas prioritárias e otimização assistida da expansão da rede;
- **Qualidade:** regras de schema, unidade, tempo e consistência, fila de inconsistências, evidências, comparação, revisão humana e reprocessamento versionado;
- **Eventos:** detecção, qualificação, correlação por CHT-ID, entrega no Event Bus, assinantes, acknowledgements e feedback dos consumidores;
- **Catálogo:** produtos, responsáveis, padrões, acesso, SLA, qualidade, APIs OGC/SensorThings/STAC, contratos e linhagem ponta a ponta.

O M5 recebe `cht:regulation-context` do M4 e `cht:identity-context` do M1. Publica `cht:data-context` para M6, M7, M9 e M10; retorna séries qualificadas e evidências ao M4 por `cht:monitoring-evidence-event`; recebe evidências georreferenciadas do M7 por `cht:field-evidence-event`; movimenta o mapa por `cht:focus-map`; e envia anomalias e falhas de qualidade ao M0 por `cht:module-event`. O agente de Qualidade de Dados pode validar, comparar e propor flags ou backfill, mas não apaga nem sobrescreve a zona bruta e submete publicações controladas à política de aprovação.

## M6 — Balanço & Cenários detalhado

O M6 combina observações qualificadas, demandas reguladas, regras, infraestrutura e forçantes climáticas para comparar alternativas com escala, horizonte e incerteza explícitos. Modelos e cenários são versionados e reproduzíveis; recomendações sempre permanecem submetidas à decisão humana. O produto possui oito áreas:

- **Balanço atual:** oferta, demanda, saldo, reserva, rede BHO6, fontes, percentis, diagnóstico, ressalvas e memória de cálculo;
- **Modelos:** Model Registry com domínio de aplicabilidade, engine, resolução, skill, incerteza, contratos de entrada, testes, gates, ativação e rollback;
- **Cenários:** workbench parametrizado por clima, demanda, eficiência, regras, infraestrutura e horizonte, com execução acompanhada e resultados comparáveis;
- **Reservatórios:** volume, afluência, defluência, curva-alvo, restrições, operação simulada e efeitos a jusante sem comando operacional;
- **Águas subterrâneas:** poços, nível, recarga, retirada, interação com águas superficiais, cobertura de monitoramento e confiança;
- **Previsões:** ensemble, fan chart P10–P90, mediana, gatilhos, skill, fontes e decomposição da incerteza;
- **Comparações:** matriz multicritério, pesos, análise de sensibilidade, trade-offs, recomendação assistida e decisão humana justificada;
- **Biblioteca:** modelos, datasets, forçantes e pacotes de cenários com versão, checksum, licença, ambiente, linhagem e reutilização controlada.

O M6 recebe `cht:data-context` do M5 e `cht:regulation-context` do M4. Publica `cht:scenario-context` para M7, M8, M9 e M10; devolve resultados e cenários selecionados ao M4 por `cht:scenario-result-event`; solicita revisões específicas ao M5 por `cht:data-quality-request`; sincroniza recortes com o ArcGIS por `cht:focus-map`; e envia alertas, alternativas e decisões ao M0 por `cht:module-event`. O agente de Modelagem e Cenários pode executar, simular e comparar, mas não opera infraestrutura, altera atos, publica previsões oficiais ou decide investimentos.

## M7 — GeoFiscal detalhado

O GeoFiscal transforma indícios territoriais em casos rastreáveis sem presumir irregularidade. A jornada conecta sensoriamento remoto, telemetria, regulação, cenários, planejamento, operação offline, evidências e decisão humana. O produto possui oito áreas operacionais:

- **Detecções:** indícios de satélite, telemetria, regras e denúncias com método, confiança, persistência, risco, limites e correlação M1/M4/M5/M6;
- **Risco:** priorização multicritério explicável, pesos versionados, materialidade, urgência, criticidade, histórico, capacidade de equipe e fila P1–P4;
- **Casos:** dossiê correlacionado e workflow completo de triagem, investigação, ordem, campo, decisão, monitoramento e conclusão;
- **Ordens:** objetivo, competência, equipe, agenda, rota, segurança, checklist, pacote ArcGIS offline e emissão apenas após aprovação humana;
- **Campo:** navegação offline, posição GNSS, checklist persistente, captura assinada, fila criptografada, sincronização e encerramento da vistoria;
- **Evidências:** imagem, formulário, documento e leitura com hash, assinatura, posição, relógio, coletor, manifest, contestação e cadeia de custódia;
- **Conformidade:** esperado × observado, fonte normativa, fatos, inferências, limites, confiança e conclusão motivada pela autoridade;
- **Resultados:** medidas, acompanhamento, efetividade, reincidência, tempo mediano, funil operacional e retroalimentação do planejamento.

O M7 recebe `cht:data-context` do M5, `cht:scenario-context` do M6 e `cht:regulation-context` do M4. Publica `cht:inspection-context` para preservar o caso nos módulos consumidores; devolve evidências ao M5 por `cht:field-evidence-event`; envia resultados ao M4 por `cht:inspection-result-event`, que cria revisão, condicionante e obrigação no M2; sincroniza a seleção ArcGIS por `cht:focus-map`; e escala riscos e resultados ao M0 por `cht:module-event`. O Assistente de Vistoria pode consultar, correlacionar, priorizar e redigir, mas não emite ordem, sanciona, autua, presume responsabilidade ou decide o caso.

## M8 — Planejamento Hídrico detalhado

O M8 conecta planos, programas, ações, projetos, investimentos, metas, evidências e benefícios em uma cadeia territorial rastreável. O planejamento usa cenários, regulação e dados qualificados sem transformar recomendações em compromissos automáticos. O produto possui oito áreas operacionais:

- **Planos:** registro versionado, escopo, horizonte, governança, alinhamento PNRH/PERH/plano de bacia, estrutura importada e base decisória conectada;
- **Programas:** eixos, objetivos, responsáveis, orçamento, capacidade de entrega, benefícios, pactos e governança interfederativa;
- **Ações:** território, responsável, período, prioridade, orçamento, progresso, marcos, dependências, riscos e evidências por módulo;
- **Projetos:** quadro stage-gate da estruturação à operação, prontidão, risco, CAPEX, critérios, condicionantes e decisão humana;
- **Investimentos:** planejado, comprometido e executado, fontes, waterfall, cobertura territorial, lacunas e conciliação demonstrativa;
- **Metas:** baseline, valor atual, alvo, prazo, fonte, qualidade, tendência, contribuição e contrato de monitoramento no M5;
- **Resultados:** produtos, resultados, benefícios, contribuição, evidências M5/M7, verificação e limites de atribuição causal;
- **Avaliação:** maturidade, eficácia, eficiência, impacto, governança, achados, aprendizado, reprogramação e publicação de nova versão.

O M8 recebe `cht:scenario-context` do M6, `cht:data-context` do M5, `cht:regulation-context` do M4 e `cht:inspection-result-event` do M7. Publica `cht:planning-context` para preservar plano, ação e projeto nos módulos consumidores; solicita novo cenário ao M6 por `cht:planning-demand-event`; cria contratos de indicadores no M5 por `cht:planning-monitoring-request`; abre revisão e condicionante no M4 por `cht:planning-regulatory-action-event`; sincroniza seleções no ArcGIS por `cht:focus-map`; e envia pactos, gates e reprogramações ao M0 por `cht:module-event`. O Agente de Portfólio pode consultar, comparar, priorizar e redigir, mas não pactua metas, compromete orçamento, cancela projetos, publica planos ou decide investimentos.

## M9 — Eventos Críticos detalhado

O M9 funciona como sala de situação para secas, cheias, qualidade e falhas de infraestrutura. O quadro operacional comum combina observação, previsão, exposição, recursos, decisões e uma timeline imutável, sem executar comandos externos automaticamente. O produto possui oito áreas:

- **Situação atual:** mapa operacional ArcGIS, incidentes ativos, exposição, recursos, objetivos do turno, feed em tempo real e briefing;
- **Incidentes:** verificação, ativação, coordenação, estabilização, recuperação, encerramento e revisão com comando e SLA explícitos;
- **Secas:** Monitor de Secas, SPI/SPEI, vazão, armazenamento, demanda, persistência, população exposta e escada de gatilhos;
- **Cheias:** hidrograma observado e previsto, faixa P10–P90, limiares, tempo de antecedência, ativos e comunidades expostas;
- **Reservatórios:** volume, afluência, defluência, curva-alvo, restrições, efeitos a montante/jusante e simulação sem comando operacional;
- **Cenários:** alternativas comparáveis, confiança, impacto, custo, velocidade, reversibilidade, governança, gatilhos e rollback;
- **Recursos:** equipes, sensores, comunicação, modelagem, disponibilidade, ETA, cobertura, mobilização e impacto no portfólio;
- **Pós-evento:** replay do estado e das decisões, desempenho meta × observado, lições, responsáveis, prazos e plano de ação.

O M9 recebe `cht:data-context` do M5, `cht:scenario-context` do M6, `cht:planning-context` do M8, `cht:field-evidence-event` do M7 e `cht:regulation-context` do M4. Publica `cht:critical-event-context` para preservar incidente e comando nos módulos consumidores; solicita intensificação de observações ao M5 por `cht:incident-data-request`; solicita execução prioritária ao M6 por `cht:incident-scenario-request`; envia mobilização e impacto financeiro ao M8 por `cht:resource-priority-event`; sincroniza a seleção ArcGIS por `cht:focus-map`; e escala ativações, briefings e decisões ao M0 por `cht:module-event`. O Agente de Crise pode consultar, correlacionar, simular e redigir, mas não decreta emergência, publica alerta, opera reservatórios, mobiliza terceiros ou decide medidas.

## M10 — Qualidade da Água detalhado

O M10 integra classe, condição observada, metas progressivas, cargas, pressões, exposição e medidas de recuperação no mesmo recorte hidrográfico. O produto trata resultados como evidências contextualizadas — com método, incerteza, versão e fonte — e mantém decisão humana para qualquer efeito regulatório, alerta ou investimento. Possui oito áreas operacionais:

- **Situação:** quadro integrado com mapa ArcGIS, IQA, desconformidades, alertas contextuais, fontes, contratos e saúde das integrações;
- **Trechos:** passaporte BHO6/CHT-ID, classe, condição, tendência, conectividade, pressões, população exposta e perfil longitudinal;
- **Enquadramento:** classe oficial × condição equivalente × meta progressiva, regra temporal citável, matriz de parâmetros, gap e revisão humana;
- **Qualidade:** amostras, estações, parâmetros, método, laboratório, limite, incerteza, cadeia de custódia, QA/QC, versão qualificada e heatmap temporal;
- **Lançamentos:** inventário de fontes, titular, ato, tratamento, vazão e carga autorizadas × observadas, capacidade de assimilação e reconciliação;
- **Pressões:** atribuição probabilística de fontes pontuais, difusas e acidentais, ranking, CAR/SICAR, SNIS, Living Atlas, uso do solo e evidências M7;
- **Metas:** baseline, atual, alvo, prazo, fonte, trajetória, risco, contrato de indicador no M5 e vínculo com planejamento;
- **Recuperação:** portfólio de medidas, custo, benefício, carga evitada, ganho de IQA, cenários, gates, rollback, efetividade e decisão colegiada.

O M10 recebe `cht:data-context` do M5, `cht:regulation-context` do M4, `cht:scenario-context` do M6, `cht:field-evidence-event` do M7, `cht:planning-context` do M8 e `cht:critical-event-context` do M9. Publica `cht:water-quality-context` para preservar trecho, classe e condição nos consumidores; cria contratos de monitoramento no M5 por `cht:quality-data-request`; solicita cenários de cargas e recuperação ao M6 por `cht:quality-scenario-request`; abre revisão e condicionante no M4 por `cht:quality-regulatory-review-event`; envia medidas, orçamento indicativo e gates ao M8 por `cht:quality-recovery-action-event`; escala sinais persistentes ao M9 por `cht:quality-incident-event`; sincroniza o mapa por `cht:focus-map`; e envia desconformidades e decisões ao M0 por `cht:module-event`. O Agente de Qualidade pode consultar, correlacionar, simular e redigir, mas não altera enquadramento, licencia lançamento, sanciona usuário, publica alerta ou decide investimento.

## M11 — Governança Federativa detalhado

O M11 governa a cooperação entre União, estados, Distrito Federal, comitês, custodiantes e consumidores da plataforma. A solução preserva autoridade e dados na fonte, torna contratos e políticas observáveis e registra cada mudança, acesso e decisão sem executar efeitos externos automaticamente. Possui oito áreas operacionais:

- **Entes:** papéis, autoridade, acordos, maturidade, capacidade, contratos, qualidade, SLA, adoção, mapa ArcGIS e plano de adesão;
- **Contratos de dados:** custodiante, consumidor, schema, classificação, SLO/SLA, qualidade, versão, compatibilidade, change window, rollback e ativação humana;
- **Catálogo:** ativos federados, domínios, padrões DCAT-AP/OGC, classificação, proveniência, lineage, consumidores e eventos de transformação;
- **Qualidade:** score federativo, dimensões por ente, heatmap, achados, contratos afetados, responsáveis, prazos, evidências e planos de melhoria;
- **Acessos:** identidade, finalidade, base/consentimento, minimização, classificação, escopo, risco, expiração, revogação e sincronização com o M2;
- **Interoperabilidade:** origem, destino, padrão, mapping, conformance, latência, taxa de sucesso, payloads, testes, homologação e remediação no M1;
- **Transparência:** inventários e pacotes, agregação, anonimização, classificação, completude, licença, checklist, assinatura e publicação responsável;
- **Auditoria:** eventos imutáveis, ator, ação, objeto, decisão, correlationId, hash encadeado, retenção, anomalias e replay entre módulos.

O M11 recebe `cht:identity-context`, `cht:passport-context`, `cht:regulatory-context`, `cht:regulation-context`, `cht:data-context`, `cht:scenario-context`, `cht:inspection-context`, `cht:planning-context`, `cht:critical-event-context`, `cht:water-quality-context` e os eventos transversais `cht:module-event`. Publica `cht:governance-context` para preservar ente, acordo e contrato; ativa contratos no M5 por `cht:federative-data-contract-event`; envia políticas de acesso ao M2 por `cht:governance-access-policy-event`; encaminha remediações de mapping ao M1 por `cht:interoperability-remediation-event`; cria ações de adoção no M8 por `cht:governance-adoption-action-event`; registra pacotes por `cht:governance-transparency-event`; sincroniza o ArcGIS por `cht:focus-map`; e escala pactos, achados e decisões ao M0 por `cht:module-event`. O Agente de Governança pode consultar, comparar, testar e redigir, mas não assina pacto, concede acesso, altera autoridade, aplica sanção, publica dados ou decide orçamento.

## M12 — Central de Agentes detalhada

O M12 é o plano de controle de IA da suíte CHT Brasil. Ele recebe contexto e eventos de M0–M11, classifica intenção e risco, escolhe agentes especializados, limita ferramentas por política, acompanha cada execução e devolve apenas efeitos aprovados ao módulo responsável. Possui oito áreas operacionais:

- **Copiloto:** entrada conversacional contextual, sugestões de tarefas, roteamento visual, especialistas, fontes, fatos, inferências, alternativas, limites e pontos de decisão humana;
- **Catálogo:** agentes, donos, finalidades, módulos, modelos, versões, ferramentas autorizadas, ações negadas, risco, desempenho, pausa e novas execuções;
- **Execuções:** filas, tarefas, sujeitos, rotas, duração, tokens, custo, confiança, trace distribuído, plano de oito etapas, evidências, checkpoints e exportação OpenTelemetry;
- **Aprovações:** identidade da autoridade, finalidade, política, efeito exato, expiração, risco, rollback, justificativa, aprovação ou rejeição e devolução controlada;
- **Exceções:** falhas, recusas de política, baixa confiança, timeouts, citações divergentes, contenção, investigação, resolução, playbooks e kill switch;
- **Conhecimento:** Context Bus, GeoRAG, ArcGIS/Living Atlas, séries M5, políticas M11, fontes federativas, versões, frescor, qualidade, cobertura, lineage e atualização incremental;
- **Avaliações:** suites de tarefa, grounding, segurança e adversarial, releases, regressões, drift, latência, gates, canário progressivo, observação e rollback;
- **Observabilidade:** disponibilidade, throughput, latência, cache, recusas seguras, tokens, custos, SLO por agente, eventos de segurança, FinOps e contenção global.

O M12 recebe `cht:identity-context`, `cht:passport-context`, `cht:regulatory-context`, `cht:regulation-context`, `cht:data-context`, `cht:scenario-context`, `cht:inspection-context`, `cht:planning-context`, `cht:critical-event-context`, `cht:water-quality-context`, `cht:governance-context`, `cht:module-event` e solicitações explícitas `cht:agent-work-request`. Publica `cht:agent-context` e `cht:agent-run-event` para preservar execução e correlação; devolve efeitos humanos por `cht:agent-approved-action-event`; registra remediações por `cht:agent-exception-remediation-event`; solicita atualização de grounding ao M5 por `cht:agent-knowledge-request`; e envia avaliações e releases ao M11 por `cht:agent-evaluation-event`. As ocorrências relevantes chegam ao M0 por `cht:module-event`. O Orquestrador opera com política deny-by-default: agentes podem consultar, correlacionar, simular e redigir, mas não recebem autoridade para decidir, assinar, publicar, sancionar, operar infraestrutura ou comprometer recursos.

## Configuração GIS

O protótipo usa o CDN oficial do ArcGIS Maps SDK 5.1. Não há chave hardcoded. A demonstração usa OSM e serviços públicos, portanto funciona sem segredo. Em uma evolução autenticada, a chave deve ser fornecida apenas por variável de ambiente e restringida por domínio e escopo.

Fontes públicas demonstradas:

- ANA/SNIRH — Hidrografia/BHO;
- ArcGIS Living Atlas — Esri Hydro Reference Overlay;
- camadas locais sintéticas de UTHs, objetos e criticidade.

## Roteiro rápido

1. Abra **Aplicações** e navegue entre os 13 produtos; percorra M1, M2 e as oito áreas operacionais de M3, M4, M5, M6, M7, M8, M9, M10, M11 e M12.
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
