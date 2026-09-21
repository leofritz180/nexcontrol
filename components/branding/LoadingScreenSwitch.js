'use client'
// ─────────────────────────────────────────────────────────────────────────
// Escolhe QUAL tela de abertura mostrar: a antiga (escura, todo mundo) ou a
// do V2 (clara, só contas com `nx-bento` no <html> — ver lib/theme-v2.js).
//
// Usa useBento em vez de isNex2 porque a classe é aplicada por DesignMode
// depois que a sessão resolve: o hook é reativo e acompanha essa virada.
//
// O latch `ativo` existe por um motivo concreto: o nx-bento também SAI ao
// entrar em rotas escuras de propósito (/owner etc.). Sem o latch, essa
// troca de classe remontaria a tela de carregamento no meio da navegação.
// Todos os hooks ficam antes de qualquer return — retorno condicional antes
// de hook já derrubou a produção com React #300.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useBento } from '../../lib/useBento'
import GlobalLoadingScreen from './GlobalLoadingScreen'
import CarregandoV2 from '../v2/CarregandoV2'

export default function LoadingScreenSwitch() {
  const bento = useBento()
  const [ativo, setAtivo] = useState(true)

  // Folga sobre os 1,6s que cada tela leva pra se esconder sozinha. O timer
  // reinicia quando `bento` vira porque a sessão pode demorar: se a troca
  // acontecesse no fim da janela, a tela do V2 seria cortada no meio.
  // Só desliga, nunca religa — depois da primeira vez o switch fica inerte.
  useEffect(() => {
    const t = setTimeout(() => setAtivo(false), 2400)
    return () => clearTimeout(t)
  }, [bento])

  if (!ativo) return null
  return bento ? <CarregandoV2 /> : <GlobalLoadingScreen />
}
