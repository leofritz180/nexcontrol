'use client'
// /convite/<token> — a página que a pessoa convidada abre. Mostra a oferta
// (N meses grátis, até N operadores), guarda o token e manda pro cadastro;
// o resgate acontece no fim do signup (ou na volta do /billing-mp).
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { SOMBRA, Ico, RED, RED2 } from '../../../components/ui/bento'

const I_PRESENTE = <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M5 12v9h14v-9M12 8a3 3 0 1 1 3-3c0 3-3 3-3 3M12 8a3 3 0 1 0-3-3c0 3 3 3 3 3" /></>
const I_CHECK = <polyline points="20 6 9 17 4 12" />

export default function ConvitePage() {
  const { token } = useParams()
  const router = useRouter()
  const [st, setSt] = useState({ carregando: true })

  useEffect(() => {
    if (!token) return
    fetch('/api/convite/verificar?t=' + encodeURIComponent(token)).then(r => r.json()).then(j => setSt({ ...j, carregando: false })).catch(() => setSt({ ok: false, motivo: 'erro', carregando: false }))
  }, [token])

  function aceitar() {
    try { localStorage.setItem('nx_convite', token) } catch {}
    router.push('/signup?convite=' + encodeURIComponent(token))
  }

  const meses = st.meses === 1 ? '1 mês' : `${st.meses} meses`
  return (
    <main className="nx-bento nx-light" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg, #f3f3f5)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 460, background: 'var(--surface, #fff)', border: '1px solid var(--b1)', borderRadius: 26, boxShadow: SOMBRA.flutuante, padding: '30px 28px' }}>
        <img src="/brand/nex-mark.png" alt="Nex Control" width={48} height={48} style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 18 }} />
        {st.carregando ? (
          <p style={{ color: 'var(--t3)', margin: 0 }}>Conferindo o convite…</p>
        ) : !st.ok ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', margin: '0 0 8px', letterSpacing: '-0.025em' }}>{st.motivo === 'expirado' ? 'Este convite expirou' : 'Convite inválido'}</h1>
            <p style={{ fontSize: 14, color: 'var(--t3)', margin: 0, lineHeight: 1.55 }}>Peça um novo link pra quem te convidou.</p>
          </>
        ) : st.usado ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', margin: '0 0 8px', letterSpacing: '-0.025em' }}>Este convite já foi usado</h1>
            <p style={{ fontSize: 14, color: 'var(--t3)', margin: '0 0 18px', lineHeight: 1.55 }}>Cada link vale pra uma conta só. Se foi você, é só entrar.</p>
            <a href="/login" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 18px', borderRadius: 30, background: 'var(--fill-1)', border: '1px solid var(--b2)', color: 'var(--t1)', fontWeight: 800, textDecoration: 'none' }}>Entrar</a>
          </>
        ) : (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 20, background: 'rgba(229,57,31,0.08)', color: RED, fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', marginBottom: 14 }}>
              <Ico d={I_PRESENTE} s={13} c={RED} /> CONVITE
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', margin: '0 0 8px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>Você foi convidado a testar a Nex Control</h1>
            <p style={{ fontSize: 14, color: 'var(--t3)', margin: '0 0 18px', lineHeight: 1.55 }}>Acesso completo, sem cartão e sem cobrança. Quando acabar, você decide se continua.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[`${meses} grátis, a partir do cadastro`, `Até ${st.operadores} operador${st.operadores === 1 ? '' : 'es'} na sua equipe`, 'Metas, remessas, faturamento, Network, Sala ao vivo — tudo liberado'].map(t => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--t2)' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 8, flexShrink: 0, background: 'var(--profit-dim)', border: '1px solid var(--profit-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--profit)' }}><Ico d={I_CHECK} s={12} c="var(--profit)" /></span>{t}
                </li>
              ))}
            </ul>
            <motion.button type="button" onClick={aceitar} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              style={{ width: '100%', minHeight: 48, borderRadius: 30, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 800, color: '#fff', background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 10px 26px rgba(229,57,31,0.3)' }}>
              Criar minha conta grátis
            </motion.button>
            <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: '12px 0 0', textAlign: 'center' }}>Este link vale pra uma conta só · válido até {new Date(st.validoAte).toLocaleDateString('pt-BR')}</p>
          </>
        )}
      </motion.div>
    </main>
  )
}
