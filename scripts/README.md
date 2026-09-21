# Checagens antes de publicar

`npm run check` roda as duas de uma vez. Nenhuma entra no build — o deploy
continua com `next build --no-lint`.

## `npm run lint:undef`

ESLint com duas regras só:

- **`no-undef`** — pega variável usada e não declarada. O `next build`
  compila isso sem reclamar e só estoura no navegador do cliente. Foi
  exatamente o que derrubou o `/admin` em 21/09/2026 (`claro is not
  defined`): um script de edição falhou no meio, não gravou a declaração, e
  o código que dependia dela foi gravado normalmente.
- **`react-hooks/rules-of-hooks`** — pega hook depois de `return`
  condicional. É o React #300 ("rendered fewer hooks than expected"), que
  derruba a tela inteira pelo error boundary. Acontece quando um hook
  devolve `false` no primeiro render e `true` depois — o segundo render sai
  cedo e pula os hooks seguintes.

**Ambas precisam sair vazias.** Se acusar algo, é bug de verdade.

Quando precisar de uma guarda antes dos hooks, use um invólucro com um hook
só, que monta ou não o componente real:

```jsx
export function Efeito(props) {
  const claro = useBento()
  if (claro) return null
  return <EfeitoEscuro {...props} />
}
```

## `npm run check:contraste`

Resolve os tokens dos dois temas (bento claro e Nex Noir) e mede o contraste
WCAG de cada par cor/fundo escrito em estilo inline.

Use `node scripts/contraste.mjs --lista` para ver cada ponto.

**O número não chega a zero, e tudo bem.** O script não enxerga o que está
atrás do elemento, então conta como problema:

- texto branco sobre botão de gradiente vermelho;
- selo e legenda sobre a arte de uma capa (slots, aulas, premiações);
- texto sobre imagem.

A linha de base em 21/09/2026, com tudo migrado, era **18 no claro e 5 no
Noir**, todos falso-positivo desse tipo. O que importa é o número **não
subir**: se subir, alguma cor nova entrou errado.

O token `--t4` é ignorado de propósito — ele é o rótulo apagado, fraco por
desenho e não por engano.
