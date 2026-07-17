// Traduz mensagens de erro do Supabase Auth (vem em ingles) pra PT-BR.
// Usado no /signup e /login — o cliente nunca deve ver erro em ingles.
// Mensagem desconhecida cai num fallback generico em portugues.

const MAP = [
  [/user already registered|already been registered/i, 'Este email já está cadastrado. Faça login ou recupere sua senha.'],
  [/password should be at least|password.*too short/i, 'A senha precisa ter pelo menos 6 caracteres.'],
  [/invalid login credentials/i, 'Email ou senha incorretos.'],
  [/email not confirmed/i, 'Confirme seu email antes de entrar (veja sua caixa de entrada).'],
  [/unable to validate email|invalid format|invalid email/i, 'Email inválido. Confira e tente de novo.'],
  [/rate limit|too many requests/i, 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.'],
  [/signup.*disabled/i, 'Cadastro temporariamente indisponível. Tente de novo em instantes.'],
  [/network|fetch failed|failed to fetch/i, 'Erro de conexão. Verifique sua internet e tente de novo.'],
  [/user not found/i, 'Não encontramos uma conta com este email.'],
  [/same.*password|different from the old/i, 'A nova senha precisa ser diferente da anterior.'],
]

export function translateAuthError(message, fallback = 'Algo deu errado. Tente de novo em instantes.') {
  const msg = String(message || '')
  for (const [re, pt] of MAP) if (re.test(msg)) return pt
  return msg ? fallback : fallback
}
