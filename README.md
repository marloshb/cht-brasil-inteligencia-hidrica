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

## Configuração GIS

O protótipo usa o CDN oficial do ArcGIS Maps SDK 5.1. Não há chave hardcoded. A demonstração usa OSM e serviços públicos, portanto funciona sem segredo. Em uma evolução autenticada, a chave deve ser fornecida apenas por variável de ambiente e restringida por domínio e escopo.

Fontes públicas demonstradas:

- ANA/SNIRH — Hidrografia/BHO;
- ArcGIS Living Atlas — Esri Hydro Reference Overlay;
- camadas locais sintéticas de UTHs, objetos e criticidade.

## Roteiro rápido

1. Abra **Aplicações** e navegue entre os 13 produtos.
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
