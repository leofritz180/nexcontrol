'use client'
// ─────────────────────────────────────────────────────────────────────────
// PRÉVIA DO UPSELL — página só para o dono ver como ficou.
//
// O pagamento aqui é INERTE (`demo`): dá pra percorrer as quatro telas sem
// gerar cobrança nenhuma. Nenhum PIX real sai daqui.
//
// Some quando não for mais necessária — é andaime, não produto.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react'
import UpsellNetwork from '../../components/UpsellNetwork'

export default function PreviaUpsell() {
  // a prévia não tem sessão, e sem sessão o DesignMode não liga o tema do
  // painel — que é onde este bloco vive de verdade. Força e segura.
  useEffect(() => {
    const por = () => document.documentElement.classList.add('nx-bento', 'nx-light')
    por()
    const t = setInterval(por, 150)
    return () => clearInterval(t)
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: '#eef0f3', padding: '40px 20px' }}>
      <div style={{ maxWidth: 460, margin: '0 auto' }}>
        <p style={{ fontSize: 12, color: '#6c6c78', textAlign: 'center', margin: '0 0 18px' }}>
          Prévia — o pagamento aqui é simulado, nada é cobrado.
        </p>
        <UpsellNetwork demo nomeInicial="Leonardo" email="previa@nexcpa.com.br" tenantId="previa" userId="previa" />
      </div>
    </main>
  )
}
