# NexControl — Documentacao Completa do Sistema (v2)

## 1. Visao Geral

### O que e o NexControl
NexControl e um SaaS de controle operacional para gestores de operacoes de iGaming/CPA (afiliados de apostas). Permite que o usuario gerencie operadores, controle remessas, acompanhe metas e veja o lucro/prejuizo da operacao em tempo real.

### Problema que resolve
Gestores de operacao de CPA operam com multiplas contas, multiplos operadores e dezenas de remessas diarias. Sem controle, e impossivel saber se a operacao esta lucrando ou perdendo dinheiro. O NexControl centraliza tudo em um unico painel com inteligencia automatica.

### Publico-alvo
- Gestores de operacoes de CPA (admins)
- Operadores que executam as metas (operators)
- O dono da plataforma (owner) — acesso unico

### Objetivo principal
Dar ao admin visao total da operacao em tempo real: quanto entrou, quanto saiu, qual operador esta performando, qual rede e mais lucrativa, e qual o lucro real apos custos.

---

## 2. Contexto Operacional

### Glossario
- **Meta**: um objetivo de depositos a ser cumprido em uma rede. Ex: "30 DEP na W1" = 30 depositos na rede W1.
- **Remessa**: cada lote de depositos registrado dentro de uma meta. Contem deposito, saque, lucro, prejuizo, contas processadas.
- **Depositantes / Contas**: numero de contas de apostas utilizadas em cada remessa. Ex: 5 contas em uma remessa.
- **Deposito**: valor total depositado nas contas de apostas naquela remessa.
- **Saque**: valor total sacado das contas apos jogar.
- **Resultado**: saque - deposito. Positivo = lucro na remessa. Negativo = prejuizo.
- **Rede**: plataforma/cassino utilizado (ex: W1, VOY, OKOK, DY, 91, WE, etc).
- **Operador**: pessoa que executa as metas (faz depositos, joga, saca).
- **Admin**: gestor da operacao. Cria metas, acompanha resultados, fecha metas com salario/bau/custos.

### Como funciona o fluxo real
1. Admin cria uma meta (ex: "30 DEP W1" — 30 depositos na rede W1)
2. Operador recebe a meta e comeca a operar
3. Para cada lote de depositos, o operador registra uma remessa com: deposito, saque, contas usadas, slot utilizado
4. O sistema calcula automaticamente: lucro, prejuizo, resultado por conta
5. Quando todas as contas sao processadas, o operador finaliza a meta
6. O admin fecha a meta definindo: salario, bau (bonus das contas), custos fixos (proxy, SMS), taxa do agente
7. O sistema calcula o **lucro final**: resultado das remessas + salario + bau - custos - taxas

### Como o lucro e gerado
Na operacao CPA, o lucro vem do bau (bonus coletado das contas de apostas) e do salario pago pela plataforma. O prejuizo vem do saldo perdido nos jogos. O lucro final = (salario + bau) - (prejuizo das remessas + custos operacionais). E normal ter prejuizo nas remessas — o salario e bau compensam.

### Modelos de remuneracao de operadores
- **Fixo por depositante**: admin paga R$ X por conta processada (ex: R$ 2/dep)
- **Percentual do lucro**: admin paga X% do lucro final ao operador
- **Divisao de resultado**: admin e operador dividem lucro E prejuizo por percentual (ex: 50/50)

---

## 3. Estrutura do Sistema

### Paginas publicas
| Pagina | Funcao |
|--------|--------|
| `/` (Landing) | Pagina de vendas com social proof, demo ao vivo, CTA de cadastro |
| `/login` | Autenticacao de usuarios existentes |
| `/signup` | Cadastro de novos admins (cria tenant + trial de 3 dias) |
| `/invite` | Convite para operadores (link com token) |
| `/billing` | Planos e pagamento via PIX (Asaas) |

### Dashboard Admin
| Pagina | Funcao |
|--------|--------|
| `/admin` | Painel central: lucro acumulado, KPIs, insights rotativos, previsao, ranking, remessas recentes. 4 abas: Visao geral, Minha operacao, Metas & Fechamento, Lixeira |
| `/operadores` | Gestao da equipe: ranking, equipe, folha de pagamento, configuracoes (modelo de remuneracao, slots favoritos) |
| `/redes` | Ranking estrategico de redes: score, rentabilidade, recomendacoes IA, alertas |
| `/faturamento` | Analise financeira: receita, evolucao, historico detalhado, previsoes |
| `/custos` | Gestao de custos operacionais: proxy, SMS, instagram, bot, VPS, outros. KPIs e grafico por tipo |
| `/meta/[id]` | Detalhe da meta: registrar remessas, historico, insights, score, previsao, fechamento |
| `/pix` | Gestao de chaves PIX da operacao |
| `/slots` | Catalogo de slots premium (PRO) |
| `/proxy` | Loja de proxies |
| `/tutorial` | Video tutorial + checklist de onboarding |

### Dashboard Operador
| Pagina | Funcao |
|--------|--------|
| `/operator` | Painel do operador: metas ativas, KPIs (sem dados financeiros sensiveis), acoes rapidas |
| `/performance` | Performance pessoal: KPIs, evolucao, ranking, conquistas |
| `/meta/[id]` | Mesma pagina de detalhe da meta (compartilhada admin/operador) |
| `/slots` | Catalogo de slots |
| `/proxy` | Loja de proxies |
| `/pix` | Chaves PIX do operador |

### Owner Dashboard (exclusivo)
| Pagina | Funcao |
|--------|--------|
| `/owner` | Centro de comando: receita total, funil de conversao, ranking de admins, movimentacao, inteligencia executiva, previsoes, alertas, usuarios online |
| `/owner/admins` | Lista completa de admins com metricas, filtros, busca, perfil clicavel |

---

## 4. Fluxo do Usuario

### Primeiro acesso
1. Usuario chega na landing page
2. Ve social proof (numeros animados, feed ao vivo, dashboard demo)
3. Clica em "Comecar agora"
4. Cria conta (signup) → tenant criado automaticamente com trial de 3 dias
5. Entra no sistema e ve o **modo demonstracao** (dados simulados)

### Operacao diaria (Admin)
1. Cria meta para operador (ex: "30 DEP W1")
2. Operador recebe e comeca a operar
3. Operador registra remessas com deposito, saque, contas, slot
4. Admin acompanha em tempo real via dashboard
5. Quando concluida, admin fecha a meta com salario/bau/custos
6. Lucro final e calculado e exibido

### Operacao diaria (Operador)
1. Entra no sistema, ve meta ativa em destaque
2. Clica na meta, abre tela de detalhe
3. Registra remessas no formulario horizontal
4. Recebe feedback instantaneo (toast no canto inferior + insight de slot)
5. Quando termina todas as contas, finaliza a meta
6. Admin fecha com valores finais

---

## 5. Modo Demonstracao

### Como funciona
Quando um admin ou operador novo entra sem dados reais (metas.length === 0), o sistema mostra uma experiencia demo completa com dados simulados.

### O que e simulado
- 3 operadores ficticios (Rafael, Juliana, Lucas)
- 8 metas nas redes W1, OKOK, VOY, DY
- 19 remessas com valores realistas
- 8 custos operacionais
- Ranking de operadores e redes
- Insights e feed de atividade

### Onde aparece
- Dashboard admin (visao geral)
- Dashboard operador
- Operadores (ranking, equipe, folha)
- Redes (ranking)
- Faturamento (KPIs, charts, historico)
- Custos (KPIs, grafico, lista)

### Identificacao
Banner pulsante em todas as paginas demo: "Exemplo de operacao em andamento — os dados reais comecam quando voce criar sua primeira meta."

### Transicao demo → real
Quando o usuario cria a primeira meta real, `shouldShowDemo()` retorna false e o modo demo desaparece automaticamente. Dados reais e demo nunca se misturam.

---

## 6. Regras Importantes

### Metas e remessas
- Cada meta pertence a um operador especifico (`operator_id`)
- Metas soft-deleted via `deleted_at` (nunca apagadas de verdade)
- Redeposito nao conta na progressao de contas da meta
- Resultado por conta usa `contas_remessa` da remessa (nao total da meta)
- Media por conta usa contas JA FEITAS (nao total da meta)

### Calculo de lucro final
```
lucro_final = resultado_remessas + salario + bau - custo_fixo - taxa_agente
```
Onde `resultado_remessas = sum(lucro) - sum(prejuizo)` de todas as remessas da meta.

### Custos operacionais
- Custos da tabela `costs` (proxy, SMS, etc) sao do TENANT, nao da meta
- Sao subtraidos do lucro total na exibicao, UMA UNICA VEZ
- Custos da meta (custo_fixo, taxa_agente) ja estao dentro do `lucro_final`
- Os dois tipos de custo sao DIFERENTES e nao se duplicam

### Divisao de resultado
- Modelo `divisao_resultado`: operador recebe X% do lucro E assume X% do prejuizo
- Requer confirmacao explicita do admin para ativar
- Aplica-se apenas a novas metas (nao retroativo)
- Campos salvos na meta: `resultado_operador`, `resultado_admin`, `percentual_operador`, `modelo_remuneracao`

### Seguranca e acesso
- RLS (Row Level Security) no Supabase por `tenant_id`
- Operador nao ve dados financeiros sensiveis (salario, bau, lucro_final)
- Owner acessa via email fixo (`leofritz180@gmail.com`)
- SubscriptionGate bloqueia acesso apos trial expirar
- Trial: 3 dias a partir da criacao do tenant
- Banner de trial aparece apos 1 minuto da criacao da conta

---

## 7. Stack Tecnica

| Tecnologia | Uso |
|-----------|-----|
| Next.js 14 (App Router) | Framework frontend + API routes |
| Supabase | PostgreSQL + Auth + RLS + Realtime |
| Framer Motion | Animacoes e transicoes |
| Vercel | Deploy automatico via git push |
| Asaas | Gateway de pagamento PIX |
| Web Push (VAPID) | Notificacoes push |
| PWA | Service worker + install prompt |

### Banco de dados (principais tabelas)
| Tabela | Funcao |
|--------|--------|
| `profiles` | Usuarios (admin/operator), tenant_id, role, nome, email |
| `tenants` | Organizacao (trial_end, subscription_status, operation_model, payment settings) |
| `metas` | Metas operacionais (titulo, rede, contas, status, lucro_final, salario, bau, custos) |
| `remessas` | Registros de deposito/saque (deposito, saque, lucro, prejuizo, resultado, contas_remessa, slot_name) |
| `costs` | Custos operacionais (type, amount, date, tenant_id) |
| `subscriptions` | Assinaturas ativas (status, expires_at, tenant_id) |
| `invites` | Convites de operadores (token, tenant_id) |
| `presence` | Presenca online (session_id, last_seen) |
| `activity_logs` | Log de atividades por meta |
| `asaas_payments` | Pagamentos PIX processados |
| `push_subscriptions` | Inscricoes de push notification |

---

## 8. Direcao de UI/UX

### Estilo visual
- **Dark premium obrigatorio** — fundo #04070e, cards #0c1220
- **Fintech/trading desk** — sensacao de sistema financeiro em tempo real
- **Verde = lucro, Vermelho = prejuizo, Amarelo = atencao, Azul = info**
- **Numeros em JetBrains Mono** — monospace para dados financeiros
- **Sidebar fixa 248px** (desktop), drawer no mobile

### Animacoes
- Count-up nos valores financeiros
- Fade-up stagger nos cards
- Glow pulsante em alertas
- Shimmer em progress bars
- Motion hover (scale + shadow)
- Entrada com framer-motion (duration 0.3-0.5s)

### Mobile first
- Grids stackam via classes: `g-4`, `g-5`, `g-6`, `g-side`, `g-form`
- Breakpoints: 1024px (tablet), 768px (mobile), 480px (phones)
- Safe areas para iPhone (env(safe-area-inset))
- Inputs com min-height 42px para toque
- Efeitos pesados removidos em phones < 480px
- Scroll do mouse nao altera inputs numericos

### Performance
- Animacoes leves (framer-motion, nao CSS pesado)
- Blur reduzido/removido em mobile
- Polling de 30s para dados (nao websocket)
- Optimistic updates em remessas (aparece instantaneo)
- Lazy loading de componentes pesados (dynamic import)

---

## 9. Diretrizes para Futuras Alteracoes

### Regras obrigatorias
1. **NUNCA alterar logica de calculo** sem revisao rigorosa
2. **NUNCA misturar dados demo com dados reais**
3. **SEMPRE preservar desktop** ao fazer mudancas mobile
4. **SEMPRE usar toFixed(2)** em calculos financeiros antes de salvar
5. **NUNCA subtrair custos mais de uma vez** — valores brutos no state, NET na exibicao
6. **SEMPRE usar `type="button"`** em botoes dentro de forms que nao sao submit
7. **SEMPRE testar em mobile** apos alteracoes visuais
8. **NUNCA simplificar o core** — melhorar, nao reduzir

### Padroes de codigo
- Componentes em JavaScript (nao TypeScript)
- Inline styles com objetos JS (nao CSS modules)
- Framer Motion para animacoes
- supabase client para queries
- service_role key apenas em API routes (server-side)
- Formato brasileiro: R$ X.XXX,XX

### Deploy
- Git push para main → Vercel auto-deploy
- Build: `npx next build --no-lint`
- Sem testes automatizados (validacao manual)

---

## 10. Pontos de Atencao

### Areas criticas
- **Calculo de lucro_final**: formula `liq + salario + bau - custo - taxa`. Qualquer erro aqui impacta todos os admins.
- **Subtracao de custos**: custos operacionais (proxy/SMS) devem ser subtraidos UMA UNICA VEZ na exibicao.
- **parseVal**: funcao que trata formato brasileiro (1.055 = 1055). Input type="text" com inputMode="decimal" para deposito/saque.
- **RLS no Supabase**: tenant_id filtra dados. Se RLS falhar, dados de um tenant podem vazar para outro.
- **SubscriptionGate**: controla acesso. Se falhar, usuarios sem assinatura acessam features pagas.

### Bugs historicos corrigidos
- Custos subtraidos 2x (corrigido: bruto no state, NET na UI)
- Editar meta fechada re-fechava e sobrescrevia dados (corrigido: `update_lucro_only` flag)
- Scroll do mouse alterava valores em inputs (corrigido: CSS + blur on wheel)
- Formato brasileiro causava calculo errado (corrigido: parseVal)
- Botoes de slot dentro de form disparavam submit (corrigido: type="button")
- Media por conta usava total da meta em vez de contas ja feitas (corrigido)
- Notificacao de push nao chegava por causa de delay no refresh (corrigido: optimistic update)

### Monitoramento
- Presence API: `/api/presence` — ping a cada 30s, online = ultimos 5 min
- Auto-refresh: polling de 30s no admin, 10s no detalhe de meta ativa
- Push notifications: VAPID + web-push via `/api/push/send`

---

## 11. Monetizacao

### Modelo
- Trial de 3 dias (automatico no signup)
- Assinatura mensal via PIX (Asaas)
- Base: R$ 39,90/mes (admin solo)
- Operadores adicionais: preco escalonado

### Features PRO
- Slots Premium (catalogo de jogos com favoritos)
- Ranking de redes (analise estrategica avancada)
- Previsao inteligente
- Alertas estrategicos

### Conversao
- Banner de trial com urgencia progressiva (verde → amarelo → laranja → vermelho)
- Modal de conversao apos trial expirar
- Cards PRO bloqueados com blur e CTA
- Landing page com social proof e demo ao vivo
