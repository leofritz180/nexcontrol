// ─────────────────────────────────────────────────────────────────────────
// LegalLayout — moldura das páginas legais públicas (Termos, Privacidade).
// Componente de servidor (sem interatividade). Visual alinhado à landing:
// preto profundo, vermelho da marca, tipografia forte.
//
// PARA PREENCHER: assim que houver razão social/CNPJ, preencha EMPRESA abaixo
// que o bloco de identificação aparece sozinho no rodapé das duas páginas.
// ─────────────────────────────────────────────────────────────────────────
import Link from 'next/link'

export const EMPRESA = {
  razaoSocial: '', // ex.: 'NEXCONTROL TECNOLOGIA LTDA'
  cnpj: '',        // ex.: '00.000.000/0001-00'
  endereco: '',    // ex.: 'Cataguases/MG'
}

export const CONTATO = {
  email: 'suporte@nexcpa.com.br',
  whatsapp: '5532998348889',
  whatsappLabel: '(32) 99834-8889',
}

export function Secao({ n, titulo, children }) {
  return (
    <section style={{ marginBottom: 34 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 12px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12, fontWeight: 800, color: '#e11d1d' }}>{String(n).padStart(2, '0')}</span>
        {titulo}
      </h2>
      <div style={{ fontSize: 14.5, lineHeight: 1.75, color: 'rgba(255,255,255,0.62)' }}>{children}</div>
    </section>
  )
}

export function Lista({ itens }) {
  return (
    <ul style={{ margin: '10px 0 0', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
      {itens.map((t, i) => (
        <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span aria-hidden style={{ flexShrink: 0, width: 5, height: 5, borderRadius: '50%', background: '#e11d1d', marginTop: 9 }} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export default function LegalLayout({ titulo, resumo, atualizado, children }) {
  const temEmpresa = EMPRESA.razaoSocial && EMPRESA.cnpj
  return (
    <main style={{ minHeight: '100vh', position: 'relative', background: '#050505' }}>
      {/* brilho ambiente */}
      <div aria-hidden style={{ position: 'fixed', top: '-20%', left: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(225,29,29,0.14) 0%, transparent 65%)', filter: 'blur(70px)', pointerEvents: 'none' }} />

      {/* topo */}
      <header style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <img src="/icons/nexcontrol-icon-clean.png" alt="" width={26} height={26} style={{ width: 26, height: 26, objectFit: 'contain', display: 'block' }} />
            <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.03em' }}>
              <span style={{ color: '#F5F5F5' }}>Nex</span><span style={{ color: '#e11d1d' }}>Control</span>
            </span>
          </Link>
          <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>← Voltar ao site</Link>
        </div>
      </header>

      <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto', padding: '54px 24px 80px' }}>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 900, letterSpacing: '-0.035em', color: '#fff', margin: '0 0 14px', lineHeight: 1.08 }}>{titulo}</h1>
        {resumo && <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: '0 0 10px', maxWidth: 640 }}>{resumo}</p>}
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', margin: '0 0 40px' }}>Última atualização: {atualizado}</p>

        <div style={{ height: 1, background: 'linear-gradient(90deg, #e11d1d, transparent)', marginBottom: 40 }} />

        {children}

        {/* contato */}
        <div style={{ marginTop: 44, padding: '24px 26px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: 15.5, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>Fale com a gente</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>
            Dúvidas sobre estes termos, sobre seus dados ou sobre a sua assinatura:<br />
            E-mail: <a href={`mailto:${CONTATO.email}`} style={{ color: '#ff6b6b', textDecoration: 'none' }}>{CONTATO.email}</a><br />
            WhatsApp: <a href={`https://wa.me/${CONTATO.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ color: '#ff6b6b', textDecoration: 'none' }}>{CONTATO.whatsappLabel}</a>
          </p>
          {temEmpresa && (
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', margin: '14px 0 0', lineHeight: 1.6 }}>
              {EMPRESA.razaoSocial} · CNPJ {EMPRESA.cnpj}{EMPRESA.endereco ? ` · ${EMPRESA.endereco}` : ''}
            </p>
          )}
        </div>

        <div style={{ marginTop: 30, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Link href="/termos" style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Termos de Uso</Link>
          <Link href="/privacidade" style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Política de Privacidade</Link>
          <Link href="/" style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Início</Link>
        </div>
      </div>
    </main>
  )
}
