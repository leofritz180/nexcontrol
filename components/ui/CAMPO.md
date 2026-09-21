# Kit CAMPO — formulários do NexControl 2.0

Uma caixa só: **44px de altura, raio 14, `var(--input)` + borda `var(--b2)`**; no foco a borda vira `var(--brand)` com anel `rgba(229,57,31,0.12)` em 160ms. Erro pinta a borda de `var(--loss)`, mostra a mensagem embaixo e treme 2px **só quando o erro aparece**. Tudo respeita `prefers-reduced-motion`.

| Bloco | Props |
|---|---|
| `<Campo>` | `rotulo valor aoMudar placeholder icone sufixo erro ajuda tipo desabilitado obrigatorio inputMode autoFoco` (+ `id nome mono aoTeclar aoDesfocar style`) |
| `<CampoMoeda>` | igual, com `R$` fixo e valor em mono; sempre `type="text" inputMode="decimal"` |
| `<Selecao>` | `rotulo valor aoMudar opcoes:[{v,l}] placeholder icone erro ajuda desabilitado obrigatorio` |
| `<Area>` | `rotulo valor aoMudar placeholder erro ajuda alturaMin(96) desabilitado obrigatorio` |
| `<Pilulas>` | `opcoes:[{v,l}] valor aoMudar rotulo ajuda erro desabilitado compacto` — ativa = `#15151a`/branco |
| `<Alternar>` | `ligado aoMudar rotulo descricao desabilitado` |
| `<Linha>` | `minimo(190)` — grid auto-fit que colapsa sozinho no celular |

`aoMudar` entrega a **string já pronta** (não o event); em `Pilulas`/`Alternar` entrega o valor/booleano.
`icone` recebe os `<path>` do `Ico` do bento: `icone={<path d="M12 5v14" />}`.

## Dinheiro

O estado guarda o valor **CRU** (o que foi digitado). Converta só na hora de salvar, com `lerMoeda` — espelho exato do `parseVal` do projeto. Depois, `toFixed(2)` antes de persistir. Existe também `lerMoedaComMilhar`, opt-in, que trata `1.055` como `1055` (o `parseVal` atual devolve `1.055`).

```jsx
import { Campo, CampoMoeda, Selecao, Pilulas, Alternar, Linha, lerMoeda } from '../components/ui/campo'

const [nome, setNome] = useState(''), [dep, setDep] = useState(''), [rede, setRede] = useState('')
const [qtd, setQtd] = useState(10), [bonus, setBonus] = useState(false), [erro, setErro] = useState('')

function salvar(e) {
  e.preventDefault()
  if (!nome.trim()) return setErro('Dá um nome pra meta.')   // o campo treme aqui
  gravar({ nome, deposito: Number(lerMoeda(dep).toFixed(2)), rede, contas: qtd, bonus })
}

<form onSubmit={salvar} style={{ display: 'grid', gap: 14 }}>
  <Campo rotulo="Nome da meta" valor={nome} aoMudar={setNome} erro={erro} obrigatorio
         ajuda="Aparece na lista e no ranking." />
  <Linha>
    <CampoMoeda rotulo="Depósito" valor={dep} aoMudar={setDep} />
    <Selecao rotulo="Rede" valor={rede} aoMudar={setRede} placeholder="Escolher..."
             opcoes={[{ v: 'w1', l: 'W1' }, { v: 'okok', l: 'OKOK' }]} />
  </Linha>
  <Pilulas rotulo="Contas" valor={qtd} aoMudar={setQtd}
           opcoes={[10, 20, 50, 100].map(n => ({ v: n, l: String(n) }))} />
  <Alternar ligado={bonus} aoMudar={setBonus} rotulo="Meta de bônus" descricao="Sem depósito." />
  <button type="submit">Criar meta</button>
</form>
```

Qualquer outro botão dentro do form precisa de `type="button"` — os do kit já são.
