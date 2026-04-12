/**
 * NexControl — Financial Insights Engine
 * Generates automatic insights from operation data
 */

export function generateInsights({ stats, predictions, goalData, metas, operators, remessas }) {
  const insights = []
  const alerts = []

  const fechadas = metas.filter(m => m.status_fechamento === 'fechada')
  const ativas = metas.filter(m => (m.status || 'ativa') === 'ativa' && m.status_fechamento !== 'fechada')

  // 1. Trend analysis
  if (predictions.trend === 'up' && predictions.pctChange > 0) {
    insights.push({ text: `Lucro cresceu ${predictions.pctChange}% vs semana anterior`, type: 'profit' })
  } else if (predictions.trend === 'down' && predictions.pctChange < 0) {
    alerts.push({ text: `Queda de ${Math.abs(predictions.pctChange)}% no lucro vs semana anterior`, type: 'loss' })
  } else {
    insights.push({ text: 'Operacao estavel em relacao a semana anterior', type: 'neutral' })
  }

  // 2. Profit per meta
  if (fechadas.length > 0) {
    const avg = predictions.mediaPorMeta || (stats.lucroFinal / fechadas.length)
    if (avg > 0) {
      insights.push({ text: `Media de R$ ${fmt(avg)} por meta fechada`, type: 'neutral' })
    }
    // Concentration check
    const sorted = fechadas.map(m => Number(m.lucro_final || 0)).sort((a, b) => b - a)
    if (sorted.length >= 3 && sorted[0] > stats.lucroFinal * 0.5) {
      alerts.push({ text: 'Lucro concentrado em poucas metas — diversifique', type: 'warn' })
    }
  }

  // 3. Win rate
  if (stats.taxa >= 70) {
    insights.push({ text: `Taxa de acerto em ${stats.taxa}% — excelente`, type: 'profit' })
  } else if (stats.taxa >= 50) {
    insights.push({ text: `Taxa de acerto em ${stats.taxa}% — dentro da media`, type: 'neutral' })
  } else if (stats.total > 0) {
    alerts.push({ text: `Taxa de acerto em ${stats.taxa}% — abaixo do ideal`, type: 'loss' })
  }

  // 4. Deposit vs withdrawal pressure
  if (stats.dep > 0 && stats.saq > 0) {
    const ratio = stats.saq / stats.dep
    if (ratio > 0.95) {
      alerts.push({ text: 'Volume sacado muito proximo do depositado — margem apertada', type: 'warn' })
    } else if (ratio < 0.7) {
      insights.push({ text: 'Boa margem entre deposito e saque', type: 'profit' })
    }
  }

  // 5. Goal progress
  if (goalData.target > 0) {
    if (goalData.pct >= 100) {
      insights.push({ text: 'Meta global atingida!', type: 'profit' })
    } else if (goalData.pct >= 75) {
      insights.push({ text: `${goalData.pct}% da meta global — quase la`, type: 'profit' })
    } else if (goalData.pct >= 40) {
      insights.push({ text: `${goalData.pct}% da meta global atingido`, type: 'neutral' })
    } else if (goalData.pct > 0) {
      alerts.push({ text: `Apenas ${goalData.pct}% da meta global — acelere`, type: 'warn' })
    }
    if (goalData.diasRestantes > 0 && goalData.diasRestantes < 999) {
      insights.push({ text: `No ritmo atual, meta em ~${goalData.diasRestantes} dias`, type: 'neutral' })
    }
  }

  // 6. Active vs closed
  if (ativas.length > fechadas.length * 2 && fechadas.length > 0) {
    alerts.push({ text: `${ativas.length} metas abertas vs ${fechadas.length} fechadas — feche pendencias`, type: 'warn' })
  }

  // 7. Operator distribution
  if (operators.length > 1 && fechadas.length > 0) {
    const opMap = {}
    fechadas.forEach(m => { opMap[m.operator_id] = (opMap[m.operator_id] || 0) + Number(m.lucro_final || 0) })
    const vals = Object.values(opMap).sort((a, b) => b - a)
    if (vals.length >= 2 && vals[0] > stats.lucroFinal * 0.7) {
      alerts.push({ text: 'Lucro dependente de um unico operador', type: 'warn' })
    }
  }

  return { insights, alerts }
}

export function getHealthStatus(stats, predictions) {
  let score = 50

  if (stats.lucroFinal > 0) score += 15
  if (stats.taxa >= 60) score += 10
  if (stats.taxa >= 75) score += 5
  if (predictions.trend === 'up') score += 10
  if (predictions.trend === 'down') score -= 15
  if (stats.taxa < 40 && stats.total > 5) score -= 15
  if (stats.lucroFinal < 0) score -= 20
  if (stats.dep > 0 && stats.saq / stats.dep > 0.95) score -= 10

  if (score >= 80) return { label: 'Operacao saudavel', color: 'var(--profit)', level: 'good' }
  if (score >= 60) return { label: 'Desempenho em crescimento', color: 'var(--profit)', level: 'growing' }
  if (score >= 45) return { label: 'Operacao em atencao', color: 'var(--warn)', level: 'attention' }
  if (score >= 30) return { label: 'Desempenho instavel', color: 'var(--warn)', level: 'unstable' }
  return { label: 'Operacao abaixo do esperado', color: 'var(--loss)', level: 'poor' }
}

function fmt(v) {
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
