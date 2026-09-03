import LegalLayout, { Secao, Lista, CONTATO } from '../../components/marketing/LegalLayout'

export const metadata = {
  title: 'Política de Privacidade',
  description: 'Como a NexControl coleta, usa, armazena e protege os seus dados pessoais, conforme a LGPD.',
  alternates: { canonical: '/privacidade' },
}

export default function PrivacidadePage() {
  return (
    <LegalLayout
      titulo="Política de Privacidade"
      resumo="Como coletamos, usamos, guardamos e protegemos os seus dados — e quais são os seus direitos pela LGPD (Lei 13.709/2018)."
      atualizado="3 de setembro de 2026"
    >
      <Secao n={1} titulo="Quem trata os seus dados">
        A NexControl, responsável pela plataforma disponível em nexcpa.com.br, atua como
        <strong style={{ color: '#fff' }}> controladora</strong> dos dados de cadastro e cobrança, e como
        <strong style={{ color: '#fff' }}> operadora</strong> dos dados que você registra sobre a sua operação.
        Contato pelos canais no fim desta página.
      </Secao>

      <Secao n={2} titulo="Dados que coletamos">
        <p style={{ margin: 0 }}><strong style={{ color: '#fff' }}>Dados de cadastro:</strong> nome, e-mail, número de WhatsApp e nome da operação.</p>
        <p style={{ margin: '10px 0 0' }}><strong style={{ color: '#fff' }}>Dados operacionais:</strong> metas, remessas, depósitos, saques, custos, resultados, operadores cadastrados e demais informações que você insere.</p>
        <p style={{ margin: '10px 0 0' }}><strong style={{ color: '#fff' }}>Dados de cobrança:</strong> registro dos pagamentos (valor, data, status). <strong style={{ color: '#fff' }}>Não recebemos nem armazenamos dados de cartão</strong> — o pagamento é via PIX, processado pelo provedor.</p>
        <p style={{ margin: '10px 0 0' }}><strong style={{ color: '#fff' }}>Dados técnicos:</strong> registros de acesso, data/hora de login, e informações do dispositivo necessárias ao funcionamento e à segurança.</p>
      </Secao>

      <Secao n={3} titulo="Para que usamos">
        <Lista itens={[
          'Fornecer a plataforma e calcular os seus resultados.',
          'Autenticar o acesso e manter a segurança da conta.',
          'Processar a assinatura, liberar o acesso e emitir avisos de vencimento.',
          'Enviar notificações operacionais (metas, alertas da IA, movimentação da equipe) e comunicados sobre o serviço.',
          'Prestar suporte e responder às suas solicitações.',
          'Melhorar a plataforma, a partir de métricas de uso agregadas.',
        ]} />
      </Secao>

      <Secao n={4} titulo="Base legal">
        Tratamos os seus dados com base na <strong style={{ color: '#fff' }}>execução do contrato</strong> (prestar o serviço
        que você contratou), no <strong style={{ color: '#fff' }}>cumprimento de obrigação legal</strong> (guarda de registros e
        obrigações fiscais), no <strong style={{ color: '#fff' }}>legítimo interesse</strong> (segurança e melhoria do produto) e no
        <strong style={{ color: '#fff' }}> consentimento</strong>, quando aplicável — por exemplo, para notificações push, que você
        pode desativar a qualquer momento.
      </Secao>

      <Secao n={5} titulo="Isolamento entre operações">
        Cada operação é <strong style={{ color: '#fff' }}>isolada no banco de dados</strong>: um cliente não acessa os dados de
        outro. Dentro da sua operação, os operadores têm acesso restrito e
        <strong style={{ color: '#fff' }}> não visualizam informações financeiras sensíveis</strong> reservadas ao administrador.
      </Secao>

      <Secao n={6} titulo="Com quem compartilhamos">
        <p style={{ margin: '0 0 10px' }}>Não vendemos os seus dados. Compartilhamos apenas com fornecedores necessários para o serviço funcionar:</p>
        <Lista itens={[
          'Supabase — banco de dados e autenticação.',
          'Vercel — hospedagem da aplicação.',
          'Mercado Pago — processamento dos pagamentos via PIX.',
          'Resend — envio dos e-mails transacionais e avisos de assinatura.',
        ]} />
        <p style={{ margin: '12px 0 0' }}>
          Também podemos compartilhar dados quando exigido por lei, ordem judicial ou autoridade competente.
        </p>
      </Secao>

      <Secao n={7} titulo="Por quanto tempo guardamos">
        Mantemos os seus dados enquanto a sua conta existir. Se a assinatura vencer, os dados
        <strong style={{ color: '#fff' }}> permanecem salvos</strong> para que você possa retomar de onde parou. Você pode pedir a
        exclusão a qualquer momento — ressalvados os registros que a lei nos obriga a manter, como os de natureza fiscal.
      </Secao>

      <Secao n={8} titulo="Seus direitos (LGPD)">
        <p style={{ margin: '0 0 4px' }}>A qualquer momento você pode solicitar:</p>
        <Lista itens={[
          'Confirmação de que tratamos os seus dados e acesso a eles.',
          'Correção de dados incompletos, inexatos ou desatualizados.',
          'Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.',
          'Portabilidade dos seus dados.',
          'Informação sobre com quem compartilhamos os seus dados.',
          'Revogação do consentimento, quando essa for a base legal utilizada.',
        ]} />
        <p style={{ margin: '12px 0 0' }}>
          Basta escrever para <a href={`mailto:${CONTATO.email}`} style={{ color: '#ff6b6b', textDecoration: 'none' }}>{CONTATO.email}</a>.
          Respondemos no prazo legal.
        </p>
      </Secao>

      <Secao n={9} titulo="Cookies e armazenamento local">
        Usamos armazenamento local no navegador para manter você conectado e guardar preferências de uso da interface
        (por exemplo, avisos já vistos). <strong style={{ color: '#fff' }}>Não usamos cookies de publicidade</strong> nem
        rastreamento para anúncios de terceiros.
      </Secao>

      <Secao n={10} titulo="Segurança">
        Adotamos medidas técnicas para proteger os seus dados, como conexão criptografada (HTTPS), senhas armazenadas
        de forma cifrada, isolamento por operação e restrição de acesso administrativo. Nenhum sistema é totalmente
        imune a incidentes: caso ocorra um incidente relevante, comunicaremos você e a ANPD conforme a lei.
      </Secao>

      <Secao n={11} titulo="Menores de idade">
        A plataforma é destinada a maiores de 18 anos. Não coletamos intencionalmente dados de menores de idade.
      </Secao>

      <Secao n={12} titulo="Alterações desta política">
        Esta política pode ser atualizada. A data da última atualização fica no topo da página, e mudanças relevantes
        serão comunicadas pelos nossos canais.
      </Secao>
    </LegalLayout>
  )
}
