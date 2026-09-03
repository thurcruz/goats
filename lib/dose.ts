export interface Dose {
  number: number
  title: string
  minutes: number
  tags: string[]
  body: string
  takeaway: string
}

export const doses: Dose[] = [
  {
    number: 1,
    title: 'Por que seu cérebro prefere recompensas imediatas?',
    minutes: 3,
    tags: ['Psicologia', 'Comportamento'],
    body: 'O cérebro humano evoluiu para valorizar ganhos imediatos porque, por milênios, o futuro era incerto demais para se apostar nele. Esse viés — chamado desconto hiperbólico — faz uma recompensa pequena agora parecer maior do que uma grande recompensa amanhã. Entender isso é o primeiro passo para desenhar sistemas que tornem o esforço de hoje mais concreto do que a promessa do futuro.',
    takeaway: 'Torne a recompensa de cada hábito mais imediata e visível para vencer o desconto hiperbólico.',
  },
  {
    number: 2,
    title: 'A regra dos 2 minutos',
    minutes: 2,
    tags: ['Produtividade', 'Hábitos'],
    body: 'Todo grande hábito começa por uma versão que cabe em dois minutos. "Ler antes de dormir" vira "ler uma página". "Treinar" vira "calçar o tênis". A ideia não é fazer pouco para sempre, mas dominar a arte de aparecer. Um hábito precisa existir antes de poder melhorar — e a constância vale mais do que a intensidade no começo.',
    takeaway: 'Reduza o próximo hábito à sua versão de 2 minutos. A constância vem antes da intensidade.',
  },
  {
    number: 3,
    title: 'O custo invisível de decidir o tempo todo',
    minutes: 3,
    tags: ['Foco', 'Energia'],
    body: 'Cada pequena decisão consome um pouco da sua energia mental — um fenômeno conhecido como fadiga de decisão. Ao final do dia, escolhas ruins não vêm de falta de disciplina, mas de uma mente esgotada por centenas de microdecisões. Rotinas e ambientes preparados não são rigidez: são uma forma de proteger sua melhor energia para o que realmente importa.',
    takeaway: 'Automatize decisões pequenas com rotinas para preservar energia mental para o que importa.',
  },
  {
    number: 4,
    title: 'Você não se lembra do que viveu, e sim do que reviveu',
    minutes: 4,
    tags: ['Memória', 'Aprendizado'],
    body: 'A memória não funciona como uma gravação, mas como uma reconstrução. Cada vez que você lembra de algo, reescreve levemente a lembrança. Por isso, revisar ativamente um aprendizado — em vez de apenas reler — é o que o fixa. O esforço de recuperar a informação da própria cabeça é justamente o que fortalece a trilha neural.',
    takeaway: 'Para reter um aprendizado, recupere-o de memória em vez de reler. O esforço é o que fixa.',
  },
  {
    number: 5,
    title: 'Identidade move mais do que metas',
    minutes: 3,
    tags: ['Comportamento', 'Motivação'],
    body: 'Metas dizem o que você quer alcançar; identidade diz quem você acredita ser. Quem se vê como "uma pessoa que treina" não precisa negociar consigo mesma todo dia. Mudanças duradouras acontecem quando cada ação vira um pequeno voto para o tipo de pessoa que você quer se tornar — e não apenas um passo em direção a um número.',
    takeaway: 'Aja como um pequeno voto para a pessoa que você quer ser, não só rumo a um número.',
  },
]

export function todaysDose(): Dose {
  const index = Math.floor(Date.now() / 86_400_000) % doses.length
  return doses[index]
}
