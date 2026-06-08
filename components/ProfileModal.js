'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'
import { loadLocalProfile, saveLocalProfile, fileToAvatarDataUrl } from '../lib/profileLocal'

const ease = [0.33, 1, 0.68, 1]
const BRAND = '#e53935'

const roleLabel = r => r === 'owner' ? 'Owner' : r === 'admin' ? 'Administrador' : 'Operador'

export default function ProfileModal({ open, onClose, userId, userEmail, userName, role, createdAt, onNameSaved }) {
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const p = loadLocalProfile(userId)
    setNome(p.nome || userName || '')
    setWhatsapp(p.whatsapp || '')
    setInstagram(p.instagram || '')
    setBio(p.bio || '')
    setAvatar(p.avatar || '')
    setOk(false); setErr('')
  }, [open, userId, userName])

  async function pickFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setErr('')
    try {
      const url = await fileToAvatarDataUrl(f)
      setAvatar(url)
    } catch { setErr('Nao consegui processar a imagem') }
    if (fileRef.current) fileRef.current.value = ''
  }

  function fmtWhats(v) {
    const d = String(v).replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  async function save() {
    setSaving(true); setErr(''); setOk(false)
    const trimmed = (nome || '').trim()
    // local: foto + contatos
    saveLocalProfile(userId, { nome: trimmed, whatsapp, instagram: instagram.replace(/^@/, ''), bio, avatar })
    // banco: nome (coluna existente)
    try {
      if (trimmed && userId) {
        const { error } = await supabase.from('profiles').update({ nome: trimmed }).eq('id', userId)
        if (error) throw error
        onNameSaved?.(trimmed)
      }
      setOk(true)
      setTimeout(() => { setOk(false); onClose?.() }, 700)
    } catch (e) {
      // o local já salvou; avisa que o nome não sincronizou no banco
      setErr('Salvo localmente. Nome nao sincronizou agora — tente de novo.')
    }
    setSaving(false)
  }

  const memberSince = createdAt ? new Date(createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : null
  const initial = (nome || userEmail || '?').trim()[0]?.toUpperCase() || '?'

  const label = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }
  const input = { width: '100%', padding: '11px 13px', borderRadius: 9, fontSize: 14, color: 'var(--t1)', background: 'var(--fill-1)', border: '1px solid var(--b2)', outline: 'none', fontFamily: 'inherit' }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.74)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease }}
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--b1)', borderRadius: 18, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
          >
            {/* capa com gradiente vermelho */}
            <div style={{ height: 88, background: `linear-gradient(135deg, ${BRAND}, #a80000)`, borderRadius: '18px 18px 0 0', position: 'relative' }}>
              <button type="button" onClick={onClose} aria-label="Fechar"
                style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 8, background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div style={{ padding: '0 26px 26px' }}>
              {/* avatar sobreposto à capa; nome/cargo ABAIXO (sem cortar) */}
              <div style={{ marginTop: -44, marginBottom: 18 }}>
                <div style={{ position: 'relative', width: 88, height: 88 }}>
                  <div style={{ width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--surface)', background: 'var(--raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}>
                    {avatar
                      ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 34, fontWeight: 700, color: 'var(--t2)' }}>{initial}</span>}
                  </div>
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label="Trocar foto"
                    style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: '50%', background: BRAND, border: '2px solid var(--surface)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} style={{ display: 'none' }} />
                </div>
                <p style={{ fontSize: 19, fontWeight: 700, color: 'var(--t1)', margin: '12px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome || 'Seu nome'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.28)', color: BRAND, letterSpacing: '0.04em' }}>{roleLabel(role)}</span>
                  {memberSince && <span style={{ fontSize: 11, color: 'var(--t4)' }}>desde {memberSince}</span>}
                </div>
              </div>

              {/* campos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={label}>Nome de exibição</label>
                  <input value={nome} onChange={e => setNome(e.target.value)} maxLength={60} placeholder="Como quer ser chamado" style={input} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={label}>WhatsApp</label>
                    <input value={whatsapp} onChange={e => setWhatsapp(fmtWhats(e.target.value))} inputMode="tel" placeholder="(00) 00000-0000" style={input} />
                  </div>
                  <div>
                    <label style={label}>Instagram</label>
                    <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@seuusuario" style={input} />
                  </div>
                </div>
                <div>
                  <label style={label}>Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={160} rows={2} placeholder="Uma frase sobre você (opcional)" style={{ ...input, resize: 'none', lineHeight: 1.5 }} />
                </div>
                <div>
                  <label style={label}>E-mail</label>
                  <input value={userEmail || ''} disabled style={{ ...input, color: 'var(--t3)', opacity: 0.7, cursor: 'not-allowed' }} />
                </div>
              </div>

              {err && <p style={{ fontSize: 12, color: 'var(--loss)', margin: '12px 0 0' }}>{err}</p>}

              <button type="button" onClick={save} disabled={saving}
                style={{ width: '100%', marginTop: 18, padding: '13px 20px', fontSize: 14, fontWeight: 700, borderRadius: 10, border: 'none', cursor: saving ? 'default' : 'pointer', color: '#fff', background: ok ? '#1f9d57' : BRAND, transition: 'background 0.15s', fontFamily: 'inherit' }}>
                {ok ? '✓ Salvo' : saving ? 'Salvando...' : 'Salvar perfil'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
