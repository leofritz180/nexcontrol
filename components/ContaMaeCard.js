'use client'
import { useState } from 'react'

/**
 * ContaMaeCard — card de credenciais da conta mae (link + login + senha).
 * Visual de cofre/seguranca. Senha mascarada com toggle de olhinho.
 *
 * Props:
 *   link, setLink           — URL de acesso da plataforma
 *   login, setLogin         — usuario/email da conta mae
 *   senha, setSenha         — senha (mascarada com olhinho)
 *   mostrarSenha, setMostrarSenha — toggle visibilidade
 *   compact                 — versao compacta (menos padding)
 */
export default function ContaMaeCard({
  link, setLink,
  login, setLogin,
  senha, setSenha,
  mostrarSenha, setMostrarSenha,
  compact = false,
}) {
  return (
    <div style={{
      position: 'relative',
      borderRadius: 14,
      background: 'linear-gradient(180deg, rgba(15,15,15,0.85), rgba(8,8,8,0.85))',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: compact ? '14px 16px' : '18px 20px',
      overflow: 'hidden',
    }}>
      {/* Glow sutil no topo */}
      <div style={{
        position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(229,57,53,0.35), transparent)',
      }}/>

      {/* Header com cadeado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(229,57,53,0.1)',
          border: '1px solid rgba(229,57,53,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', margin: '0 0 1px', letterSpacing: '-0.01em' }}>
            Conta mãe
          </p>
          <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', margin: 0, fontWeight: 500 }}>
            Credenciais ficam salvas pra acesso rápido nas remessas
          </p>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
          padding: '3px 8px', borderRadius: 5,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>Opcional</span>
      </div>

      {/* Link */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Link de acesso
        </label>
        <input
          type="url"
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="https://plataforma.com/login"
          style={{
            width: '100%', padding: '10px 14px', fontSize: 13, fontWeight: 500,
            color: '#fafafa', background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9,
            outline: 'none', boxSizing: 'border-box',
            fontFamily: 'var(--mono)',
            transition: 'border-color 0.18s, box-shadow 0.18s',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(229,57,53,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.08)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {/* Login + Senha em grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Login */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Login
          </label>
          <input
            type="text"
            value={login}
            onChange={e => setLogin(e.target.value)}
            placeholder="usuario ou email"
            autoComplete="off"
            style={{
              width: '100%', padding: '10px 14px', fontSize: 13, fontWeight: 500,
              color: '#fafafa', background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9,
              outline: 'none', boxSizing: 'border-box',
              fontFamily: 'var(--mono)',
              transition: 'border-color 0.18s, box-shadow 0.18s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(229,57,53,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.08)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        {/* Senha com olhinho */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Senha
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder={mostrarSenha ? 'sua senha' : '••••••••'}
              autoComplete="new-password"
              style={{
                width: '100%', padding: '10px 40px 10px 14px', fontSize: 13, fontWeight: 500,
                color: '#fafafa', background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9,
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'var(--mono)', letterSpacing: mostrarSenha ? 'normal' : '0.15em',
                transition: 'border-color 0.18s, box-shadow 0.18s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(229,57,53,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.08)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(v => !v)}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                width: 28, height: 28, borderRadius: 7,
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: mostrarSenha ? '#e53935' : 'rgba(255,255,255,0.45)',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {mostrarSenha ? (
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer com selo de seguranca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="rgba(16,185,129,0.7)" strokeWidth="2" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 500 }}>
          Acesso restrito ao seu tenant (RLS) · senha mascarada por padrão
        </p>
      </div>
    </div>
  )
}

/**
 * ContaMaeView — versao read-only pra exibir credenciais salvas
 * em pagina de meta. Inclui copy-to-clipboard.
 */
export function ContaMaeView({ link, login, senha }) {
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  if (!link && !login && !senha) return null

  async function copy(text, field) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1500)
    } catch {}
  }

  return (
    <div style={{
      position: 'relative',
      borderRadius: 14,
      background: 'linear-gradient(180deg, rgba(15,15,15,0.85), rgba(8,8,8,0.85))',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: '18px 20px',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(229,57,53,0.35), transparent)',
      }}/>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', margin: 0, letterSpacing: '-0.01em' }}>
          Conta mãe
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {link && (
          <CredField
            label="Link"
            value={link}
            onCopy={() => copy(link, 'link')}
            copied={copiedField === 'link'}
            asLink
          />
        )}
        {login && (
          <CredField
            label="Login"
            value={login}
            onCopy={() => copy(login, 'login')}
            copied={copiedField === 'login'}
          />
        )}
        {senha && (
          <CredField
            label="Senha"
            value={senha}
            displayValue={mostrarSenha ? senha : '•'.repeat(Math.min(senha.length, 14))}
            onCopy={() => copy(senha, 'senha')}
            copied={copiedField === 'senha'}
            toggle={() => setMostrarSenha(v => !v)}
            mostrar={mostrarSenha}
          />
        )}
      </div>
    </div>
  )
}

function CredField({ label, value, displayValue, onCopy, copied, asLink, toggle, mostrar }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 9,
      background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{
        fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: 42,
      }}>{label}</span>
      <span style={{
        flex: 1, fontSize: 13, color: '#fafafa', fontFamily: 'var(--mono)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        letterSpacing: (label === 'Senha' && !mostrar) ? '0.15em' : 'normal',
      }}>
        {asLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" style={{
            color: '#fafafa', textDecoration: 'none', borderBottom: '1px dotted rgba(229,57,53,0.4)',
          }}>{value}</a>
        ) : (displayValue ?? value)}
      </span>
      {toggle && (
        <button type="button" onClick={toggle} aria-label={mostrar ? 'Ocultar' : 'Mostrar'} style={{
          width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer',
          background: 'transparent', color: mostrar ? '#e53935' : 'rgba(255,255,255,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {mostrar ? (
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      )}
      <button type="button" onClick={onCopy} aria-label="Copiar" style={{
        width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer',
        background: copied ? 'rgba(16,185,129,0.15)' : 'transparent',
        color: copied ? '#10B981' : 'rgba(255,255,255,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.18s, color 0.18s',
      }}>
        {copied ? (
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        ) : (
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        )}
      </button>
    </div>
  )
}
