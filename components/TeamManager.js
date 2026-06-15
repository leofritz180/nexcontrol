'use client'
import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─────────────────────────────────────────────────────────────
// EQUIPES / OPERADOR LÍDER — painel de gestão (DS MENTORIA 2.0)
// Permite: criar equipe, definir o operador líder e quais
// operadores compõem cada equipe. Persiste via /api/admin/set-team.
// ─────────────────────────────────────────────────────────────

const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'
const getInitial = p => getName(p).charAt(0).toUpperCase()

export default function TeamManager({ operators = [], adminId, onChanged }) {
  const [newTeam, setNewTeam] = useState('')
  const [extraTeams, setExtraTeams] = useState([]) // equipes criadas ainda sem membros
  const [saving, setSaving] = useState(null) // operator_id em saving
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const inputRef = useRef(null)

  // Equipes existentes = nomes distintos vindos dos operadores + as recém-criadas
  const teams = useMemo(() => {
    const set = new Set()
    operators.forEach(o => { if (o.team) set.add(o.team) })
    extraTeams.forEach(t => set.add(t))
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [operators, extraTeams])

  const unassigned = useMemo(() => operators.filter(o => !o.team), [operators])

  function membersOf(team) {
    return operators.filter(o => o.team === team)
  }
  function leaderOf(team) {
    return operators.find(o => o.team === team && o.is_team_leader) || null
  }

  async function apply(operator_id, team, is_leader) {
    setSaving(operator_id); setError('')
    try {
      const res = await fetch('/api/admin/set-team', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId, operator_id, team, is_leader }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erro ao salvar'); setSaving(null); return }
      if (onChanged) await onChanged()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(null)
    }
  }

  function addTeam() {
    setError(''); setOkMsg('')
    const name = newTeam.trim()
    if (!name) {
      setError('Digite um nome para a equipe (ex.: Shark).')
      if (inputRef.current) inputRef.current.focus()
      return
    }
    if (teams.some(t => t.toLowerCase() === name.toLowerCase())) {
      setError(`A equipe "${name}" já existe.`)
      setNewTeam('')
      return
    }
    setExtraTeams(prev => [...prev, name])
    setNewTeam('')
    setOkMsg(`Equipe "${name}" criada. Agora adicione os operadores e defina o líder.`)
    setTimeout(() => setOkMsg(''), 5000)
  }

  const card = {
    background: 'linear-gradient(145deg, rgba(14,22,38,0.7), rgba(8,14,26,0.7))',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
    boxShadow: '0 8px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
  }

  const Avatar = ({ op, leader }) => (
    <div style={{
      width: 36, height: 36, borderRadius: 11, flexShrink: 0,
      background: leader ? 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.08))' : 'rgba(255,255,255,0.06)',
      border: `1.5px solid ${leader ? 'var(--loss-border, rgba(239,68,68,0.4))' : 'rgba(255,255,255,0.1)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 15, fontWeight: 800, color: '#fff',
    }}>{getInitial(op)}</div>
  )

  const TeamSelect = ({ op }) => (
    <select
      value={op.team || ''}
      disabled={saving === op.id}
      onChange={e => apply(op.id, e.target.value || null, false)}
      style={{
        padding: '7px 10px', borderRadius: 9, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)',
        color: '#fff', cursor: 'pointer', maxWidth: 170,
      }}>
      <option value="" style={{ background: '#0c1322' }}>Sem equipe</option>
      {teams.map(t => <option key={t} value={t} style={{ background: '#0c1322' }}>{t}</option>)}
    </select>
  )

  return (
    <div style={{ marginBottom: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="var(--loss, #ef4444)" strokeWidth="2.2" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>Equipes</p>
          <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: '2px 0 0', fontWeight: 500 }}>
            Crie equipes, defina o operador líder e quem faz parte de cada uma
          </p>
        </div>
      </div>

      {/* Criar nova equipe */}
      <div style={{ ...card, padding: '16px 18px', marginBottom: 18 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Nova equipe</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            ref={inputRef}
            value={newTeam}
            onChange={e => setNewTeam(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTeam() } }}
            placeholder="Ex.: Shark, Lucas Neves..."
            style={{
              flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff',
            }}/>
          <button type="button" onClick={addTeam}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: 'linear-gradient(180deg, var(--loss, #ef4444), #c62828)', color: '#fff', fontSize: 13, fontWeight: 800,
              boxShadow: '0 6px 18px rgba(239,68,68,0.35)',
            }}>
            Criar equipe
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', marginBottom: 14, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ff9d9d', fontSize: 12.5, fontWeight: 600 }}>
          {error}
        </div>
      )}
      {okMsg && (
        <div style={{ padding: '10px 14px', marginBottom: 14, borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#7ee2b8', fontSize: 12.5, fontWeight: 600 }}>
          {okMsg}
        </div>
      )}

      {/* Equipes existentes */}
      {teams.length === 0 ? (
        <div style={{ ...card, padding: '36px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>Nenhuma equipe criada ainda. Crie a primeira acima.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AnimatePresence>
            {teams.map(team => {
              const members = membersOf(team)
              const leader = leaderOf(team)
              return (
                <motion.div key={team} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...card, padding: '18px 20px' }}>
                  {/* Team header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Equipe {team}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', padding: '3px 9px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {members.length} operador{members.length !== 1 ? 'es' : ''}
                      </span>
                    </div>
                    {leader ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ffb3b3', padding: '4px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        Líder: {getName(leader)}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        Sem líder definido
                      </span>
                    )}
                  </div>

                  {/* Members */}
                  {members.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--t4)', margin: 0 }}>Nenhum operador nesta equipe. Use o seletor dos operadores abaixo para adicionar.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {members.map(op => {
                        const isLeader = op.is_team_leader
                        return (
                          <div key={op.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 11,
                            background: isLeader ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isLeader ? 'rgba(239,68,68,0.22)' : 'rgba(255,255,255,0.06)'}`,
                          }}>
                            <Avatar op={op} leader={isLeader} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{getName(op)}</span>
                                {isLeader && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', color: '#ffb3b3', padding: '2px 7px', borderRadius: 5, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>LÍDER</span>}
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--t4)' }}>{op.email}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button type="button" disabled={saving === op.id}
                                onClick={() => apply(op.id, team, !isLeader)}
                                style={{
                                  padding: '7px 12px', borderRadius: 9, fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                                  background: isLeader ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.14)',
                                  border: `1px solid ${isLeader ? 'rgba(255,255,255,0.14)' : 'rgba(239,68,68,0.3)'}`,
                                  color: isLeader ? 'var(--t3)' : '#ffb3b3',
                                }}>
                                {isLeader ? 'Remover líder' : 'Tornar líder'}
                              </button>
                              <TeamSelect op={op} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Adicionar operador direto nesta equipe */}
                  {unassigned.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)' }}>Adicionar operador:</span>
                      <select
                        value=""
                        onChange={e => { if (e.target.value) apply(e.target.value, team, false) }}
                        style={{
                          padding: '8px 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', cursor: 'pointer',
                        }}>
                        <option value="" style={{ background: '#0c1322' }}>Selecione um operador...</option>
                        {unassigned.map(o => <option key={o.id} value={o.id} style={{ background: '#0c1322' }}>{getName(o)}</option>)}
                      </select>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Operadores sem equipe */}
      {unassigned.length > 0 && (
        <div style={{ ...card, padding: '18px 20px', marginTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
            Sem equipe ({unassigned.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unassigned.map(op => (
              <div key={op.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 11,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <Avatar op={op} leader={false} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', display: 'block' }}>{getName(op)}</span>
                  <span style={{ fontSize: 11, color: 'var(--t4)' }}>{op.email}</span>
                </div>
                <TeamSelect op={op} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
