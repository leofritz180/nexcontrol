# NexControl — Extensão de Captura de Depósitos

Lê o valor dos QR PIX que aparecem nas abas do bot e envia pro NexControl, que
soma tudo ao vivo no pop-up da meta. Zero digitação.

## Como instalar no bot (CASH HUNTERS)

1. No bot, clique em **"Adicionar Extensão"**.
2. Aponte para a pasta desta extensão:
   `C:\Users\USER\Downloads\nexcontrol-FINAL-v6\nexcontrol-final\extension`
   (ou descompacte o `nexcontrol-extensao.zip` e aponte para a pasta).
3. Ative a extensão. Se o bot tiver "extensão global/padrão", adicione uma vez
   e vale pra todos os perfis.

> Se preferir testar no Chrome normal: acesse `chrome://extensions`, ligue o
> **Modo desenvolvedor**, clique em **Carregar sem compactação** e escolha a
> pasta `extension`.

## Como usar

1. Clique no ícone da extensão (quebra-cabeça → NexControl) e **conecte** com o
   email e senha da sua conta NexControl. (Só uma vez.)
2. No NexControl, abra a **meta** e clique em **"Iniciar depósitos automáticos"**.
3. Rode o bot normalmente. Cada QR PIX que aparecer nas abas vira um depósito e
   o pop-up **soma sozinho**. No canto da aba aparece um "✓ R$ X" a cada captura.
4. Terminou? Clique em **"Finalizar e usar total"** → o valor entra na remessa.

## Observações
- Funciona mesmo com o NexControl aberto em outro navegador (tudo passa pelo
  servidor, ligado à sua conta).
- O mesmo depósito nunca conta 2x (identificado pelo Número do Pedido).
- Se um valor não for capturado, me avise **qual casa** — a leitura pode
  precisar de um ajuste fino pra aquele layout.
