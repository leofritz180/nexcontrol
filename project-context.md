# NexControl — Contexto do Projeto

## Visao geral
NexControl e um SaaS de controle operacional focado em:
- gestao de operadores
- controle de remessas
- acompanhamento de lucro em tempo real

## Objetivo do produto
Permitir que o usuario:
- veja onde ganha e perde dinheiro
- controle toda operacao em tempo real
- tome decisoes baseadas em dados

## Posicionamento
NAO e apenas um dashboard.

E:
- Sistema de inteligencia da operacao
- Plataforma de lucro em tempo real

## Publico
- operadores
- gestores de operacao
- usuarios que controlam multiplas contas/remessas

## Estrategia de monetizacao
- modelo PRO (principal)
- trial de 3 dias
- bloqueio de features avancadas

## Features PRO (principais)
- previsao inteligente (IA)
- ranking de redes
- analises estrategicas
- insights automaticos

## Diretrizes de UI
- estilo fintech premium
- dark mode obrigatorio
- foco em performance (leve e rapido)
- evitar excesso de animacoes pesadas

## Diretrizes de UX
- tudo deve parecer rapido
- sensacao de sistema ao vivo
- foco em conversao para PRO

## Arquitetura atual
- sidebar com modulos:
  - Admin
  - Operadores
  - Faturamento
  - Chaves PIX
  - Assinatura
  - Tutorial
  - Owner (apenas dono)

## Stack tecnica
- Next.js 14 (App Router)
- Supabase (PostgreSQL + Auth + RLS)
- Framer Motion
- Vercel (deploy)
- Asaas (PIX payments)
- PWA (push notifications)

## Paleta de cores
- Brand: #e53935 (vermelho)
- Profit: #22C55E (verde)
- Loss: #EF4444 (vermelho)
- Warn: #F59E0B (amarelo)
- Background: #04070e (preto azulado)
- Surface: #0c1220 (cards)
- Text: #F1F5F9 / #94A3B8 / #64748B

## Regras importantes
- nao poluir layout
- priorizar clareza e impacto
- performance > efeitos visuais
- sempre pensar em conversao
- verde = lucro, vermelho = prejuizo
- numeros em JetBrains Mono
- sidebar fixa 248px esquerda
- mobile: sidebar vira drawer

## Instrucao para desenvolvimento
Sempre que gerar codigo ou alteracoes:
- seguir esse contexto
- nao quebrar consistencia do projeto
- manter estilo dark premium
- priorizar conversao PRO
