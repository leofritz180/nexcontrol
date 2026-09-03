import LegalLayout, { Secao, Lista, CONTATO } from '../../components/marketing/LegalLayout'

export const metadata = {
  title: 'Termos de Uso',
  description: 'Termos de Uso da NexControl — regras de contratação, pagamento, cancelamento e uso da plataforma.',
  alternates: { canonical: '/termos' },
}

export default function TermosPage() {
  return (
    <LegalLayout
      titulo="Termos de Uso"
      resumo="Estas são as regras de uso da NexControl. Ao criar uma conta e assinar, você concorda com o que está aqui."
      atualizado="3 de setembro de 2026"
    >
      <Secao n={1} titulo="O que é a NexControl">
        A NexControl é uma plataforma online (SaaS) de <strong style={{ color: '#fff' }}>gestão de operações</strong>: registro
        e acompanhamento de metas, remessas, depósitos, saques, custos, operadores e resultados, com relatórios,
        alertas automáticos e notificações. É uma <strong style={{ color: '#fff' }}>ferramenta de organização e controle</strong> —
        não executa operações por você, não intermedia pagamentos de terceiros e não gerencia dinheiro dos usuários.
      </Secao>

      <Secao n={2} titulo="Conta e cadastro">
        <Lista itens={[
          'Para usar a plataforma é necessário criar uma conta com dados verdadeiros (nome, e-mail e WhatsApp válidos).',
          'Você é responsável por manter a sua senha em sigilo e por tudo que acontecer na sua conta.',
          'A conta é pessoal e vinculada à sua operação. Contas de operadores criadas por você são de sua responsabilidade.',
          'Dados de cadastro incorretos podem impedir o acesso, a recuperação de senha e o recebimento de avisos importantes.',
          'É proibido compartilhar acesso para burlar o limite contratado de operadores.',
        ]} />
      </Secao>

      <Secao n={3} titulo="Planos, preços e pagamento">
        <Lista itens={[
          'O acesso à plataforma é pago. Não há período de teste gratuito: a conta é liberada após a confirmação do pagamento.',
          'O plano custa R$ 59,90 por mês e inclui a plataforma completa. Operadores adicionais são cobrados à parte, conforme o valor exibido no momento da contratação, com desconto por volume.',
          'O pagamento é feito via PIX. A liberação do acesso é automática após a confirmação do pagamento pelo provedor.',
          'Não há fidelidade nem cobrança automática no cartão: a renovação é mensal e depende de um novo pagamento seu.',
          'Se a renovação não for feita até o vencimento, o acesso é suspenso — mas os seus dados permanecem salvos e voltam assim que você renovar.',
          'Os preços podem ser alterados. Alterações valem para as renovações seguintes e serão comunicadas com antecedência.',
        ]} />
      </Secao>

      <Secao n={4} titulo="Cancelamento e reembolso">
        <p style={{ margin: 0 }}>
          Você pode cancelar quando quiser: como a renovação é manual, basta não renovar — não há multa nem burocracia.
        </p>
        <p style={{ margin: '12px 0 0' }}>
          Conforme o <strong style={{ color: '#fff' }}>art. 49 do Código de Defesa do Consumidor</strong>, você pode desistir
          da contratação em até <strong style={{ color: '#fff' }}>7 (sete) dias corridos</strong> contados do pagamento, com
          devolução integral do valor. Basta solicitar pelos canais de contato ao final desta página.
        </p>
      </Secao>

      <Secao n={5} titulo="Uso aceitável">
        <Lista itens={[
          'Não utilize a plataforma para qualquer finalidade ilícita ou que viole a lei aplicável.',
          'Não tente acessar dados de outras operações, burlar limites, aplicar engenharia reversa ou sobrecarregar o sistema.',
          'Não use robôs ou scripts para extrair dados da plataforma sem autorização.',
          'Você é o único responsável pelo conteúdo e pelos dados que registra na plataforma, inclusive pela sua veracidade.',
        ]} />
      </Secao>

      <Secao n={6} titulo="Disponibilidade do serviço">
        Trabalhamos para manter a plataforma disponível de forma contínua, mas o serviço pode ficar temporariamente
        indisponível por manutenção, atualização ou falha de provedores externos (hospedagem, banco de dados, provedor
        de pagamento). Não garantimos disponibilidade ininterrupta e podemos alterar ou descontinuar funcionalidades,
        comunicando as mudanças relevantes.
      </Secao>

      <Secao n={7} titulo="Limitação de responsabilidade">
        <p style={{ margin: 0 }}>
          A NexControl é uma <strong style={{ color: '#fff' }}>ferramenta de gestão e organização de dados</strong>.
          Ela <strong style={{ color: '#fff' }}>não promete, não garante e não projeta resultado financeiro</strong> de
          qualquer natureza. Os números exibidos são cálculos feitos a partir das informações que você mesmo registra.
        </p>
        <p style={{ margin: '12px 0 0' }}>
          As decisões da sua operação são exclusivamente suas. Não nos responsabilizamos por lucros cessantes, perdas
          financeiras, decisões tomadas com base nos relatórios, nem por dados inseridos de forma incorreta.
          Nossa responsabilidade, em qualquer hipótese, fica limitada ao valor pago por você nos últimos 12 meses.
        </p>
      </Secao>

      <Secao n={8} titulo="Propriedade intelectual">
        A marca NexControl, o software, o design, os textos e os materiais da plataforma (incluindo aulas e artes de
        premiação) são de nossa propriedade. Você recebe uma licença de uso pessoal, limitada, não exclusiva e
        intransferível enquanto a assinatura estiver ativa. Os <strong style={{ color: '#fff' }}>dados da sua operação
        continuam sendo seus</strong>.
      </Secao>

      <Secao n={9} titulo="Suspensão e encerramento">
        Podemos suspender ou encerrar contas que violem estes termos, que apresentem indícios de fraude ou que
        prejudiquem o funcionamento da plataforma ou outros usuários. Em caso de encerramento por violação, não há
        devolução de valores referentes ao período já utilizado.
      </Secao>

      <Secao n={10} titulo="Alterações destes termos">
        Estes termos podem ser atualizados. A data da última atualização fica sempre no topo desta página, e mudanças
        relevantes são comunicadas pelos nossos canais. O uso da plataforma após a atualização significa concordância
        com a nova versão.
      </Secao>

      <Secao n={11} titulo="Lei aplicável e foro">
        Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca do
        domicílio do consumidor para dirimir eventuais controvérsias, conforme o Código de Defesa do Consumidor.
      </Secao>

      <Secao n={12} titulo="Privacidade">
        O tratamento dos seus dados pessoais está descrito na nossa{' '}
        <a href="/privacidade" style={{ color: '#ff6b6b', textDecoration: 'none' }}>Política de Privacidade</a>,
        que faz parte integrante destes Termos. Dúvidas podem ser enviadas para{' '}
        <a href={`mailto:${CONTATO.email}`} style={{ color: '#ff6b6b', textDecoration: 'none' }}>{CONTATO.email}</a>.
      </Secao>
    </LegalLayout>
  )
}
