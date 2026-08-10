'use client'
import { useState } from 'react'
import { Icon, I } from '../_components/icons'
import { Panel, PanelHead, PageHead, Field, Input, Select, Segmented, useToast, Def } from '../_components/ui'
import { assinatura, brl } from '../_components/data'

const MODELOS = [
  { id: 'fixo', label: 'Fixo por depositante' },
  { id: 'percentual', label: '% do lucro' },
  { id: 'divisao', label: 'Divisão de resultado' },
]

function Toggle({ on, onChange, label, hint }) {
  return (
    <button type="button" className="v2-toggle-row" onClick={() => onChange(!on)}>
      <span style={{ minWidth: 0, textAlign: 'left' }}>
        <span className="v2-row-t" style={{ display: 'block' }}>{label}</span>
        {hint && <span className="v2-row-s" style={{ display: 'block' }}>{hint}</span>}
      </span>
      <span className={`v2-switch ${on ? 'is-on' : ''}`}><i /></span>
    </button>
  )
}

export default function Config() {
  const toast = useToast()
  const sub = assinatura(3)
  const [nome, setNome] = useState('Operação DS')
  const [modelo, setModelo] = useState('fixo')
  const [valorFixo, setValorFixo] = useState('12,00')
  const [notifPush, setNotifPush] = useState(true)
  const [notifEmail, setNotifEmail] = useState(true)
  const [alertaSeq, setAlertaSeq] = useState(true)
  const [alertaParada, setAlertaParada] = useState(false)

  return (
    <>
      <PageHead title="Configurações" sub="Preferências da operação, remuneração e alertas." />

      <div className="v2-grid-2">
        <div className="v2-stack">
          <Panel>
            <PanelHead title="Operação" sub="Identificação e time" />
            <div style={{ padding: 18, display: 'grid', gap: 14 }}>
              <Field label="Nome da operação">
                <Input value={nome} onChange={e => setNome(e.target.value)} />
              </Field>
              <Field label="Fuso horário" hint="Usado no fechamento do dia operacional (vira às 5h).">
                <Select value="brt" onChange={() => {}} options={[{ value: 'brt', label: 'America/Sao_Paulo (BRT)' }]} />
              </Field>
              <Field label="Moeda">
                <Select value="brl" onChange={() => {}} options={[{ value: 'brl', label: 'Real brasileiro (R$)' }]} />
              </Field>
              <div>
                <button type="button" className="v2-btn-primary" onClick={() => toast('Preferências salvas', 'profit')}>Salvar alterações</button>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Remuneração do operador" sub="Modelo aplicado às novas metas" />
            <div style={{ padding: 18, display: 'grid', gap: 14 }}>
              <Segmented options={MODELOS} value={modelo} onChange={setModelo} size="sm" />
              {modelo === 'fixo' && (
                <Field label="Valor por depositante" hint="Pago por conta processada na meta.">
                  <Input value={valorFixo} inputMode="decimal" onChange={e => setValorFixo(e.target.value)} />
                </Field>
              )}
              {modelo === 'percentual' && (
                <Field label="Percentual do lucro final" hint="Aplicado somente quando a meta fecha positiva.">
                  <Input defaultValue="20" inputMode="decimal" />
                </Field>
              )}
              {modelo === 'divisao' && (
                <Field label="Percentual do operador" hint="O operador assume a mesma fatia no prejuízo. Não é retroativo.">
                  <Input defaultValue="50" inputMode="decimal" />
                </Field>
              )}
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--t4)', lineHeight: 1.6 }}>
                A alteração vale só para metas criadas a partir de agora. Metas em andamento mantêm o modelo original.
              </p>
            </div>
          </Panel>
        </div>

        <div className="v2-stack">
          <Panel>
            <PanelHead title="Notificações" sub="Como você quer ser avisado" />
            <div style={{ padding: '6px 18px 14px' }}>
              <Toggle on={notifPush} onChange={setNotifPush} label="Push no navegador" hint="Meta fechada, saque pendente e alertas críticos" />
              <Toggle on={notifEmail} onChange={setNotifEmail} label="E-mail" hint="Resumo diário da operação às 9h" />
              <Toggle on={alertaSeq} onChange={setAlertaSeq} label="Sequência negativa" hint="Avisa após 2 remessas negativas seguidas" />
              <Toggle on={alertaParada} onChange={setAlertaParada} label="Meta parada" hint="Avisa quando uma meta fica 12h sem remessa" />
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Plano" sub="Assinatura atual"
              action={<button type="button" className="v2-link">Gerenciar</button>} />
            <div style={{ padding: 18 }}>
              <Def label="Plano" value={`${sub.plano} · ${sub.operadores} operadores`} />
              <Def label="Valor mensal" value={brl(sub.total)} />
              <Def label="Método" value={sub.metodo} />
              <Def label="Status" value="Ativa" tom="profit" />
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Zona de risco" sub="Ações irreversíveis" />
            <div style={{ padding: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="v2-btn-ghost" onClick={() => toast('Exportação iniciada')}>
                <Icon d={I.download} size={13} style={{ marginRight: 6, verticalAlign: '-2px' }} />Exportar todos os dados
              </button>
              <button type="button" className="v2-btn-danger" onClick={() => toast('Ação bloqueada no modo demonstração', 'loss')}>
                Encerrar operação
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
