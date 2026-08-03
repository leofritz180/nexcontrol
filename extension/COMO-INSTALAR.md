# NexControl — Extensão de Captura de Depósitos

Lê o valor dos QR PIX que aparecem nas abas do bot e envia pro NexControl, que
soma tudo ao vivo no pop-up da meta. Zero digitação, zero login.

## Como cada operador pega a SUA extensão

1. No NexControl, abra a **meta** → clique em **"Configurar extensão"** (ao lado
   do botão de depósitos) → **"Baixar minha extensão"**.
   (O arquivo já vem com a sua chave embutida — não precisa editar nada.)
2. **Descompacte** o `nexcontrol-extensao.zip` numa pasta.
3. No bot (CASH HUNTERS) → **"Adicionar Extensão"** → aponte para essa pasta.
   Se o bot tiver "extensão global/padrão", adicione uma vez e vale pra todos os
   perfis.

> Testar no Chrome normal: `chrome://extensions` → **Modo desenvolvedor** →
> **Carregar sem compactação** → escolha a pasta.

## Como usar

1. No NexControl, abra a **meta** → **"Iniciar depósitos automáticos"**.
2. Rode o bot normalmente. Cada QR PIX que aparecer nas abas vira um depósito e
   o pop-up **soma sozinho** (aparece um "✓ R$ X" no canto da aba a cada captura).
3. Terminou? **"Finalizar e usar total"** → o valor entra na remessa.

## Observações
- A chave é da conta do operador (fica no arquivo, vale pra todas as abas/remessas).
- O mesmo depósito nunca conta 2x (identificado pelo Número do Pedido).
- Funciona com o NexControl aberto em outro navegador que o bot.
- Se um valor não for capturado, me avise **qual casa** — a leitura pode
  precisar de um ajuste fino pra aquele layout.
