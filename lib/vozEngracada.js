// ─────────────────────────────────────────────────────────────────────────
// A VOZ ENGRAÇADA — o repertório.
//
// A voz séria e a low profile dizem sempre a mesma coisa do mesmo jeito, e
// isso é uma qualidade delas. A engraçada não pode: piada repetida na
// terceira remessa do dia deixa de ser piada e vira ruído. Então cada
// situação tem um REPERTÓRIO, e o textoDe sorteia um a cada envio.
//
// Regras do repertório:
//   · os números vêm sempre (valor, contas, rede, progresso) — humor não
//     é desculpa pra esconder o que a pessoa precisa saber;
//   · ri COM o operador, nunca dele: prejuízo é "faz parte", não "vacilou";
//   · nada de piada com dinheiro do cliente, com a rede ou com fraude;
//   · frases curtas: o sistema corta o corpo em ~2 linhas no celular.
//
// Cada entrada é d => [ {titulo, corpo}, … ]. Helpers de formato vêm de
// lib/notificacoes (val, rs, REDE…) via `f`, pra não duplicar.
// ─────────────────────────────────────────────────────────────────────────

export function repertorioEngracado(f) {
  const { val, rs, REDE, prog, nome, n } = f
  const contasTxt = d => (d.contas ? n(d.contas, 'conta', 'contas') : null)
  const junta = (...p) => p.filter(Boolean).join(' · ')

  return {
    'meta-criada': d => [
      { titulo: `${nome(d)} abriu meta. Ninguém segura 🐎`, corpo: `${d.contas || 0} DEP na ${REDE(d.rede)}. Reza pela rede.` },
      { titulo: `Meta nova. A rede ainda não sabe o que vai sofrer 😈`, corpo: `${nome(d)} · ${d.contas || 0} DEP · ${REDE(d.rede)}.` },
      { titulo: `${nome(d)} entrou no modo caçador 🏹`, corpo: `${d.contas || 0} DEP na ${REDE(d.rede)}. Os depósitos que se cuidem.` },
      { titulo: `${nome(d)} desligou o piloto automático ✈️`, corpo: `Meta de ${d.contas || 0} DEP na ${REDE(d.rede)}. Cinto apertado.` },
      { titulo: `Alguém acordou disposto hoje ☕`, corpo: `${nome(d)} abriu ${d.contas || 0} DEP na ${REDE(d.rede)}. Café dobrado.` },
      { titulo: `${nome(d)} vs ${REDE(d.rede)}: round 1 🥊`, corpo: `${d.contas || 0} DEP em jogo. Que vença o operador.` },
    ],

    'remessa-nova': d => {
      if (d.bonus) return [
        { titulo: 'A rede deu um bônus. Deve estar passando mal 🤒', corpo: `${nome(d)} · ${val(d.valor)} · ${REDE(d.rede)}.` },
        { titulo: `${nome(d)} achou dinheiro no bolso da calça 👖`, corpo: `Bônus de ${val(d.valor)} na ${REDE(d.rede)}. Não questiona, só aceita.` },
        { titulo: 'Bônus caiu. Foi sem querer, mas caiu 🎁', corpo: `${nome(d)} · ${val(d.valor)} · ${REDE(d.rede)}.` },
        { titulo: 'Cortesia da casa 🍾', corpo: `${nome(d)} registrou ${val(d.valor)} de bônus na ${REDE(d.rede)}. Sem remessa, sem suor.` },
      ]
      const info = junta(val(d.valor), contasTxt(d), REDE(d.rede)) + prog(d)
      if (Number(d.valor) >= 0) return [
        { titulo: `${nome(d)} fez chover e nem tava previsto 🌧️`, corpo: info },
        { titulo: `A ${REDE(d.rede)} pagou e chorou no banheiro 😭`, corpo: `${nome(d)} · ${info}` },
        { titulo: `${nome(d)} operou igual quem tem boleto vencendo 💪`, corpo: info },
        { titulo: `Remessa aprovada com louvor 🎓`, corpo: `${nome(d)} · ${info}` },
        { titulo: `${nome(d)} tá com a mão mais quente que o Chrome 🔥`, corpo: info },
        { titulo: `O gerente da ${REDE(d.rede)} vai ter que explicar isso 📋`, corpo: `${nome(d)} · ${info}` },
        { titulo: `Isso não é remessa, é obra de arte 🖼️`, corpo: `${nome(d)} · ${info}` },
        { titulo: `${nome(d)} mandou a rede pra terapia 🛋️`, corpo: info },
      ]
      return [
        { titulo: `${nome(d)} pagou pra ver e viu 👀`, corpo: `${info}. Faz parte do pacote.` },
        { titulo: `A ${REDE(d.rede)} cobrou pedágio 🛣️`, corpo: `${nome(d)} · ${junta(val(d.valor), contasTxt(d))}${prog(d)}. Segue viagem.` },
        { titulo: `Remessa no vermelho. Tomate, não sangue 🍅`, corpo: `${nome(d)} · ${info}. Vai passar.` },
        { titulo: `${nome(d)} tomou uma. A próxima devolve 🥊`, corpo: `${junta(val(d.valor), contasTxt(d))} · ${REDE(d.rede)}${prog(d)}.` },
        { titulo: `O slot acordou de mau humor 😤`, corpo: `${nome(d)} · ${info}. Não é pessoal.` },
        { titulo: `Prejuízo pequeno, história grande 📖`, corpo: `${nome(d)} · ${info}. Amanhã a gente ri.` },
      ]
    },

    'remessa-feedback': d => {
      const base = `${val(d.valor)} (${rs(d.perConta)}/conta)`
      const nivel = d.nivel || f.nivelRemessa(d.valor, d.perConta)
      return {
        lucro: [
          { titulo: 'O pai tá on 🔥', corpo: `${base}. Continua que tá bonito.` },
          { titulo: 'Lucrou. Pode até tomar água com gás hoje 🥂', corpo: `${base}.` },
          { titulo: 'A rede chorou, você lucrou 😎', corpo: `${base}. Faz de novo.` },
          { titulo: 'Se fosse fácil chamava recreio 🎒', corpo: `${base}. Mas você fez parecer fácil.` },
          { titulo: 'Mais verde que salada de academia 🥗', corpo: `${base}. Segue a dieta.` },
          { titulo: 'Remessa com nota de rodapé: "nasceu pra isso" 📝', corpo: `${base}.` },
          { titulo: 'Deu bom. Deu muito bom 🟢', corpo: `${base}. Guarda a receita.` },
        ],
        baixo: [
          { titulo: 'Arranhão. Nem cicatriz vai deixar 🩹', corpo: `${base}. O salário cobre com folga.` },
          { titulo: 'Perdeu troco de pão 🍞', corpo: `${base}. Nem conta como perda.` },
          { titulo: 'Empatou com juros 🤏', corpo: `${base}. Dentro do combinado.` },
          { titulo: 'Custo do estacionamento 🅿️', corpo: `${base}. Faz parte de sair de casa.` },
        ],
        leve: [
          { titulo: 'Balançou o barco, ninguém caiu 🚣', corpo: `${base}. Segue remando.` },
          { titulo: 'Tropeçou no tapete 🪤', corpo: `${base}. Levanta e finge que foi de propósito.` },
          { titulo: 'Oscilou tipo wi-fi de padaria 📶', corpo: `${base}. Já já volta.` },
          { titulo: 'Leve queda, nada que um café não resolva ☕', corpo: `${base}.` },
        ],
        atencao: [
          { titulo: 'Sinal amarelo. Não corre, mas presta atenção 🚦', corpo: `${base}.` },
          { titulo: 'O gráfico levantou uma sobrancelha 🤨', corpo: `${base}. Olha as próximas com carinho.` },
          { titulo: 'Tá esquentando, e não é o clima 🌡️', corpo: `${base}. Cuidado nas próximas.` },
          { titulo: 'A remessa mandou um "precisamos conversar" 💬', corpo: `${base}.` },
        ],
        redobrada: [
          { titulo: 'Esse slot tá fazendo cosplay de ralo 🕳️', corpo: `${base}. Troca antes que engula tudo.` },
          { titulo: 'O slot te bloqueou no Instagram 🚫', corpo: `${base}. Vai pra outro.` },
          { titulo: 'Tá pesando mais que consciência de domingo 😩', corpo: `${base}. Hora de trocar o slot.` },
          { titulo: 'O slot pediu pra você sair 🚪', corpo: `${base}. Aceita o convite.` },
        ],
        ruim: [
          { titulo: 'Deu ruim. Deu ruim mesmo 😵', corpo: `${base}. Para, respira, revisa.` },
          { titulo: 'Essa remessa foi de base 🪦', corpo: `${base}. Nem tudo foi pra esse mundo pra vencer.` },
          { titulo: 'Se fosse filme, era o momento da virada 🎬', corpo: `${base}. Reescreve o roteiro.` },
          { titulo: 'O saldo pediu arrego 🏳️', corpo: `${base}. Pausa e repensa.` },
        ],
        negativo: [
          { titulo: 'Vermelho de vergonha. Do slot, não seu 🔴', corpo: `${base}. Muda o caminho.` },
          { titulo: 'Isso não é prejuízo, é curso caro 🎓', corpo: `${base}. Diploma na parede, rota nova.` },
          { titulo: 'Abandona o navio? Ainda não. Mas vira o leme 🚢', corpo: `${base}.` },
          { titulo: 'Sangrou. Estanca antes da próxima 🩸', corpo: `${base}. Outra estratégia, agora.` },
        ],
      }[nivel]
    },

    'marco-meta': d => {
      const p = `${d.feitas}/${d.alvo}`
      if (d.marco >= 100) return d.paraOperador ? [
        { titulo: 'META BATIDA. Pode gritar 📣', corpo: `${p} na ${REDE(d.rede)}. Finaliza que o admin fecha.` },
        { titulo: 'Bateu. Bateu e ainda pediu troco 💯', corpo: `${p} DEP na ${REDE(d.rede)}. Só falta finalizar.` },
        { titulo: 'A rede pediu pra você parar 🙏', corpo: `${p} na ${REDE(d.rede)}. Finaliza aí, monstro.` },
        { titulo: 'Missão cumprida. Sem cena pós-créditos 🎬', corpo: `${p} DEP na ${REDE(d.rede)}. Aperta o finalizar.` },
        { titulo: 'Fechou a conta e a boca de muita gente 🤫', corpo: `${p} na ${REDE(d.rede)}. Finaliza e comemora.` },
      ] : [
        { titulo: `${nome(d)} bateu a meta e nem suou 🧊`, corpo: `${p} DEP na ${REDE(d.rede)}. Falta ele finalizar.` },
        { titulo: `Sirene ligada: ${nome(d)} cravou 🚨`, corpo: `${p} na ${REDE(d.rede)}. Meta batida.` },
        { titulo: `${nome(d)} chegou na linha antes do mapa 🏁`, corpo: `${p} DEP na ${REDE(d.rede)}.` },
        { titulo: `A ${REDE(d.rede)} vai lembrar do nome ${nome(d)} 📛`, corpo: `${p} DEP. Meta batida.` },
      ]
      return d.paraOperador ? [
        { titulo: 'Metade. A parte chata já foi 🍕', corpo: `${p} na ${REDE(d.rede)}. Sobrou o recheio.` },
        { titulo: 'Copo meio cheio, e enchendo 🥤', corpo: `${p} DEP na ${REDE(d.rede)}.` },
        { titulo: 'Fim do primeiro tempo, sem cartão 🟨', corpo: `${p} na ${REDE(d.rede)}. Segundo tempo é seu.` },
        { titulo: 'Metade do caminho. O resto é descida 🛷', corpo: `${p} na ${REDE(d.rede)}.` },
      ] : [
        { titulo: `${nome(d)} tá na metade e não desacelera 🏎️`, corpo: `${p} DEP na ${REDE(d.rede)}.` },
        { titulo: `${nome(d)} passou do meio da meta 🚀`, corpo: `${p} na ${REDE(d.rede)}. Foguete não tem ré.` },
        { titulo: `Metade da meta e ${nome(d)} nem piscou 😐`, corpo: `${p} DEP na ${REDE(d.rede)}.` },
        { titulo: `${nome(d)}: 50% feito, 100% confiante 😤`, corpo: `${p} na ${REDE(d.rede)}.` },
      ]
    },

    'meta-finalizada': d => {
      const info = `${d.contas || 0} DEP ${REDE(d.rede)} · ${n(d.nRem || 0, 'remessa', 'remessas')} · ${val(d.valor)}`
      return [
        { titulo: `${nome(d)} finalizou. Agora é com você, chefia 🫡`, corpo: `${info}. Fecha aí.` },
        { titulo: `${nome(d)} terminou a lição. Falta o visto 📝`, corpo: `${info}. Só falta fechar.` },
        { titulo: `Meta na sua mesa, com laço 🎀`, corpo: `${nome(d)} finalizou · ${info}.` },
        { titulo: `${nome(d)} bateu o ponto e foi embora 🕔`, corpo: `${info}. Fecha pra contar o lucro.` },
        { titulo: `${nome(d)}: "terminei, chefia" 📣`, corpo: `${info}. Fecha aí.` },
        { titulo: `Tem meta esperando seu carimbo 🧾`, corpo: `${nome(d)} finalizou · ${info}.` },
        { titulo: `${nome(d)} entregou. Não deixa esfriar 🍲`, corpo: `${info}. Fecha agora.` },
      ]
    },

    'meta-fechada': d => {
      const info = `${d.contas || 0} DEP ${REDE(d.rede)} · ${val(d.lucroFinal)}`
      return Number(d.lucroFinal) >= 0 ? [
        { titulo: 'Fechou no lucro. O contador sorriu 😁', corpo: `${info}. Meta fechada.` },
        { titulo: 'Lucro confirmado. Pode contar pra mãe 📞', corpo: `${info}.` },
        { titulo: 'Meta no bolso e o bolso agradece 🪙', corpo: `${info}. Próxima!` },
        { titulo: 'Fechou bonito, tipo final de novela 💚', corpo: `${info}.` },
        { titulo: 'Deu lucro. Repete a receita, não muda o tempero 🧂', corpo: `${info}.` },
      ] : [
        { titulo: 'Fechou no vermelho. Aprendizado tem preço 🩹', corpo: `${info}. A próxima devolve.` },
        { titulo: 'Essa foi curso pago 🎓', corpo: `${info}. Diploma na parede, próxima é lucro.` },
        { titulo: 'Meta fechada, saldo de cara amarrada 😤', corpo: `${info}. Vira a página.` },
        { titulo: 'Deu ruim, mas fechou. Já é meio caminho 📕', corpo: `${info}.` },
      ]
    },

    'meta-fechada-operador': d => {
      const info = `${d.contas || 0} DEP ${REDE(d.rede)} · suas remessas: ${val(d.valor)}`
      return [
        { titulo: 'Sua meta fechou. Sem cena pós-créditos ✅', corpo: `${info}. Próxima!` },
        { titulo: 'O admin carimbou. Capítulo encerrado 📖', corpo: `${info}.` },
        { titulo: 'Meta fechada. Pode desapegar 🧘', corpo: `${info}. Bora abrir outra.` },
        { titulo: 'Conta fechada, sem pendência, sem drama 🧾', corpo: `${info}.` },
      ]
    },

    'alerta-operacao': d => ({
      sequencia_negativa: [
        { titulo: 'Três seguidas? Isso é a rede te dando um recado 📮', corpo: `${n(d.streak || 0, 'remessa', 'remessas')} no vermelho · ${rs(d.total)}. Muda a estratégia.` },
        { titulo: 'O slot tá em fase de terror 🧟', corpo: `${d.streak || 0} seguidas no prejuízo (${rs(d.total)}). Troca de slot ou de rota.` },
        { titulo: 'Sequência que nem o Flamengo de 2004 queria 📉', corpo: `${d.streak || 0} remessas no vermelho · ${rs(d.total)}. Para e repensa.` },
        { titulo: 'Maré ruim. Sai da água 🌊', corpo: `${n(d.streak || 0, 'remessa seguida', 'remessas seguidas')} no prejuízo · ${rs(d.total)}.` },
      ],
      prejuizo_acima_media: [
        { titulo: 'Ei, isso não é você 🤨', corpo: `${rs(d.perConta)}/conta nesta · sua média é ${rs(d.media)}. Algo mudou.` },
        { titulo: 'Fora da curva. E não pro lado bonito 📊', corpo: `${rs(d.perConta)}/conta contra ${rs(d.media)} de média. Confere o que mudou.` },
        { titulo: 'Essa doeu mais que o normal 😖', corpo: `${rs(d.perConta)}/conta, bem acima da sua média (${rs(d.media)}). Olho vivo.` },
      ],
      meta_parada: [
        { titulo: 'A meta tá no soneca há um tempinho 😴', corpo: `${d.horas || 0}h sem remessa. Bora acordar ela?` },
        { titulo: 'Alô? A meta ligou perguntando de você 📞', corpo: `Parada há ${d.horas || 0}h.` },
        { titulo: 'Poeira acumulando na meta 🧹', corpo: `${d.horas || 0}h sem movimento. Passa um pano.` },
        { titulo: 'A meta sentiu sua falta. Sério 🥺', corpo: `${d.horas || 0}h sem remessa. Volta quando puder.` },
      ],
      meta_sem_inicio: [
        { titulo: 'Criou a meta e foi tomar café? ☕', corpo: `${d.contas || 0} DEP ${REDE(d.rede)} ainda sem remessa nenhuma.` },
        { titulo: 'Motor ligado, carro na garagem 🚗', corpo: `${d.contas || 0} DEP na ${REDE(d.rede)} esperando a primeira remessa.` },
        { titulo: 'A meta tá na largada esperando o tiro 🔫', corpo: `${d.contas || 0} DEP ${REDE(d.rede)}. Dá o primeiro passo.` },
      ],
    }[d.insight] || [{ titulo: 'Alerta da operação', corpo: d.corpo || '' }]),

    'network': d => ({
      comentario: [
        { titulo: `${nome(d)} comentou. Prepara a resposta 💬`, corpo: d.trecho || '' },
        { titulo: `Seu resultado virou assunto 🗣️`, corpo: `${nome(d)}: ${d.trecho || ''}` },
        { titulo: `${nome(d)} deixou um recado no seu post 📝`, corpo: d.trecho || '' },
      ],
      mencao: [
        { titulo: `${nome(d)} falou seu nome. Espirrou? 🤧`, corpo: d.trecho || '' },
        { titulo: `Psiu — ${nome(d)} te marcou 📌`, corpo: d.trecho || '' },
        { titulo: `${nome(d)} te chamou no Network 📣`, corpo: d.trecho || '' },
      ],
      todos: [
        { titulo: `${nome(d)} chamou geral. Até quem tava no banheiro 📣`, corpo: d.trecho || '' },
        { titulo: `Convocação geral do ${nome(d)} 🔊`, corpo: d.trecho || '' },
        { titulo: `Atenção, comunidade 📢`, corpo: `${nome(d)}: ${d.trecho || ''}` },
      ],
      aviso: [
        { titulo: 'Recado da direção. Lê antes de operar 📋', corpo: d.trecho || '' },
        { titulo: 'Aviso novo no Network 📌', corpo: d.trecho || '' },
        { titulo: 'Comunicado oficial, sem meme 📖', corpo: d.trecho || '' },
      ],
    }[d.evento] || [{ titulo: 'Network', corpo: d.trecho || '' }]),

    'conquista': d => {
      if (d.evento === 'comissao') return [
        { titulo: 'Dinheiro que você não operou. O melhor tipo 😏', corpo: `Comissão de ${rs(d.valor)} via PIX.` },
        { titulo: 'PIX de afiliado caiu 📲', corpo: `${rs(d.valor)}. Indicar compensa.` },
        { titulo: 'Comissão na conta. Pode agradecer o indicado 🙏', corpo: `${rs(d.valor)} via PIX.` },
      ]
      const dep = Number(d.depositantes || 0).toLocaleString('pt-BR')
      return [
        { titulo: `Subiu de patente: ${d.patente || ''}. Respeita 🎖️`, corpo: `${dep} depositantes processados.` },
        { titulo: `${d.patente || 'Patente nova'} desbloqueada. Sem código de trapaça 🔓`, corpo: `${dep} depositantes.` },
        { titulo: `Promovido a ${d.patente || 'outro nível'}. Pode atualizar o currículo 🆙`, corpo: `${dep} depositantes na conta.` },
      ]
    },
  }
}
