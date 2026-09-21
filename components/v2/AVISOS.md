# Avisos (toasts) — NexControl 2.0

O `<ProvedorDeAvisos>` já está montado em `app/layout.js`. Em qualquer componente
client (`'use client'`) é só puxar o hook — não precisa importar nada global.

```js
import { useAviso } from '../../components/v2/Avisos'

const { sucesso, erro, info, fechar, limpar } = useAviso()

sucesso('Custo salvo')
erro('Não deu pra salvar', { descricao: 'Verifique a conexão e tente de novo.' })
info('Sincronizando…', { duracao: 0 })   // duracao 0 = fica até clicarem no X
```

`opts` aceita `{ desfazer: fn, duracao: ms, descricao: string }`.
Padrões de duração: 5s (sucesso/info), 7s (erro), 8s (quando tem `desfazer`).
Cada função devolve o `id` do aviso — use com `fechar(id)` pra tirar na mão.
Máximo de 3 na tela; o mais antigo sai. A barra de tempo PAUSA com o mouse em cima.

## Exemplo: excluir custo com desfazer

```js
async function excluirCusto(custo) {
  setCustos(lista => lista.filter(c => c.id !== custo.id))   // some da tela na hora
  const t = setTimeout(() => { apagarNoBanco(custo.id) }, 6000) // só grava depois
  sucesso('Custo excluído', {
    descricao: custo.nome,
    desfazer: () => { clearTimeout(t); setCustos(lista => [...lista, custo]) },
  })
}
```

Regra de ouro do desfazer: adie a escrita destrutiva no banco até o aviso expirar.
Se a exclusão já foi gravada, o `desfazer` tem que recriar o registro — e aí trate
a falha com `erro(...)`, senão o usuário acha que voltou e não voltou.
