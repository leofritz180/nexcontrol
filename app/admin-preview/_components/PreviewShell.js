'use client'
import PreviewSidebar from './PreviewSidebar'
import PreviewHeader from './PreviewHeader'

// Casca visual da rota de preview — substitui o AppLayout SOMENTE aqui.
// Sidebar colapsavel (overlay no hover, conteudo nao reflui) + header em faixa.
export default function PreviewShell({ children, onRefresh }) {
  return (
    <div
      className="pv-root"
      style={{
        // Fonte premium de dashboard SÓ no preview — redefine as variáveis de
        // fonte; números seguem em --mono (JetBrains). Nada vaza pra produção.
        '--font-sans': "'Geist', 'Inter', system-ui, -apple-system, sans-serif",
        '--font-display': "'Geist', 'Inter', system-ui, sans-serif",
        fontFamily: "var(--font-sans)",
      }}
    >
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap" />
      <PreviewSidebar />
      <div className="pv-main" style={{ marginLeft: 76 }}>
        <PreviewHeader onRefresh={onRefresh} />
        <div className="pv-content">{children}</div>
      </div>
      <style jsx global>{`
        @media (max-width: 768px) { .pv-main { margin-left: 0 !important; } }
        /* Identidade vermelha: ícones neutros (currentColor) viram vermelho.
           Não afeta ícones de status (lucro/prejuízo usam cor explícita) nem o gráfico. */
        .pv-content svg[stroke="currentColor"] { color: #FF3131; }
      `}</style>
    </div>
  )
}
