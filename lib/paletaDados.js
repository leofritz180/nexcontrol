'use client'
// ─────────────────────────────────────────────────────────────────────────
// Ponte entre as páginas e a paleta de comandos (Ctrl+K).
//
// A paleta é montada no AppLayout, que não tem metas nem operadores em mãos.
// Em vez de buscar tudo de novo (outra ida ao banco só pra alimentar uma
// busca), a página que JÁ tem os dados os empresta aqui.
//
// É um store mínimo de propósito: sem Context e sem provider, porque um
// provider novo em volta do app obrigaria a re-renderizar a árvore inteira
// quando os dados mudassem.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'

let dados = { metas: [], operadores: [], redes: [], aoNovaMeta: null }
const ouvintes = new Set()

export function publicarNaPaleta(novos) {
  dados = { ...dados, ...novos }
  ouvintes.forEach(f => { try { f(dados) } catch {} })
}

export function useDadosDaPaleta() {
  const [v, setV] = useState(dados)
  useEffect(() => {
    ouvintes.add(setV)
    setV(dados)
    return () => { ouvintes.delete(setV) }
  }, [])
  return v
}

/** Publica e limpa ao sair da tela — evita a paleta mostrar dado de outra página. */
export function useAlimentarPaleta(novos, deps = []) {
  useEffect(() => {
    publicarNaPaleta(novos)
    return () => publicarNaPaleta({ metas: [], operadores: [], redes: [], aoNovaMeta: null })
    // eslint-disable-next-line
  }, deps)
}
