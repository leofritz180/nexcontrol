'use client'
import PreviewSidebar from './PreviewSidebar'
import PreviewHeader from './PreviewHeader'

// Casca visual da rota de preview — substitui o AppLayout SOMENTE aqui.
// Sidebar colapsavel (overlay no hover, conteudo nao reflui) + header em faixa.
export default function PreviewShell({ children, onRefresh }) {
  return (
    <>
      <PreviewSidebar />
      <div className="pv-main" style={{ marginLeft: 76 }}>
        <PreviewHeader onRefresh={onRefresh} />
        <div>{children}</div>
      </div>
      <style jsx global>{`
        @media (max-width: 768px) { .pv-main { margin-left: 0 !important; } }
      `}</style>
    </>
  )
}
