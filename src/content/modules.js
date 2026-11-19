/**
 * Conteúdo educacional dos 8 módulos (pt-BR).
 *
 * Convenções de etapas: cada etapa tem
 *  - title, caption (legenda sincronizada), dur (s de animação), camera,
 *  - enter(ctx): configura o cenário ao entrar na etapa,
 *  - during(ctx, k, dt): interpolação contínua durante a etapa (k: 0→1).
 *
 * OBSERVAÇÃO DE HONESTIDADE CIENTÍFICA: parâmetros do simulador (velocidade,
 * distância, alimentação, mistura de gases) são valores didáticos relativos.
 * Não correspondem a regulagens reais de pressão dos cilindros.
 */

const PARK = [-150, 46, -50];      // posição de espera do maçarico
const WELD_PARK = [-105, 13, 0];   // início da junta (bico sobre a peça)

export const MODULES = [
  /* ================================================================
     MÓDULO 1 — FUNDAMENTOS
     ================================================================ */
  {
    id: 'm1',
    num: 1,
    title: 'Fundamentos do processo OAW',
    short: 'Como a chama funde o metal',
    scenario: 'butt',
    baseCfg: { speed: 18, standoff: 10, lean: 38, feed: 0.7, rodMode: 'ahead', weave: 1.6, thick: 3 },
    intro:
      'A soldagem oxiacetilênica (OAW) é um processo de soldagem por fusão que utiliza o calor da ' +
      'combustão do acetileno (C₂H₂) com oxigênio (O₂). A chama atinge temperaturas máximas na faixa de ' +
      'aproximadamente 3.100 °C a 3.200 °C, suficientes para fundir localmente o metal base.',
    blocks: [
      {
        h: 'Como o calor atua',
        body:
          'O calor é transferido da chama para as peças por radiação e convecção, concentrando-se na região ' +
          'imediatamente à frente do bico. O metal aquece, passa pela incandescência e funde, formando a ' +
          '<strong>poça de fusão</strong>, que acompanha o deslocamento do maçarico e solidifica atrás dele, ' +
          'formando o cordão.'
      },
      {
        h: 'Aplicação',
        body:
          'Processo versátil e de baixo custo de investimento, usado em manutenção, fabricação leve, tubulações ' +
          'de pequeno diâmetro, reparo e brasagem. Exige habilidade manual para coordenar chama, vareta e avanço.'
      },
      {
        h: 'O que observar na demonstração',
        body:
          'Acompanhe as etapas: apresentação da junta → aproximação do maçarico → aquecimento → poça de fusão → ' +
          'deslocamento → solidificação e cordão. Use a câmera da poça de fusão para ver o metal mudar de cor.'
      }
    ],
    steps: [
      {
        title: 'Apresentação da junta',
        dur: 7,
        camera: 'overview',
        enter: (c) => {
          const st = c.st();
          st.reset();
          st.cfg.running = false;
          st.flameHold = false;
          c.tags.hideAll();
          if (c.arrow) c.arrow.visible = false;
          c.app.director.set('overview', true);
        },
        caption: 'Duas chapas de aço-carbono preparadas em <strong>junta de topo</strong>. O objetivo é fundir as bordas e obter uma junta contínua após a solidificação.'
      },
      {
        title: 'Aproximação do maçarico',
        dur: 5,
        camera: 'chase',
        enter: (c) => {
          const st = c.st();
          st.reset();
          st.cfg.manualTorch = true;
          st.cfg.running = false;
          st.flameHold = false;
          st.rod.group.visible = false;
          c.tags.show('torch');
          c.app.director.set('chase', true);
        },
        during: (c, k) => {
          const st = c.st();
          st.torch.group.position.lerpVectors(
            new (st.torch.group.position.constructor)(...PARK),
            new (st.torch.group.position.constructor)(...WELD_PARK),
            Math.min(1, k * 1.15)
          );
          st.torch.group.rotation.z = 0.1 * (1 - k);
        },
        caption: 'O operador aproxima o maçarico da junta mantendo o bico a uma distância controlada da peça — a <strong>distância bico–peça</strong> é um dos parâmetros-chave.'
      },
      {
        title: 'Aquecimento localizado',
        dur: 9,
        camera: 'pool',
        enter: (c) => {
          const st = c.st();
          st.cfg.manualTorch = false;
          st.flameHold = true;
          st.cfg.running = false;
          st.cfg.standoff = 15;
          c.app.director.set('pool', true);
        },
        during: (c, k) => {
          c.st().cfg.standoff = 15 - 5 * k; // aproxima gradualmente: aquecimento crescente
        },
        caption: 'O metal aquece gradualmente: escurece, passa pela <strong>incandescência</strong> (vermelho → laranja) e prepara-se para fundir. Quanto menor a distância, mais energia incide na peça.'
      },
      {
        title: 'Formação da poça de fusão',
        dur: 6,
        camera: 'pool',
        enter: (c) => {
          const st = c.st();
          st.cfg.standoff = 10;
          st.flameHold = true;
          st.cfg.running = false;
          c.tags.show('pool');
          c.tags.show('seam');
          c.app.director.set('pool', true);
        },
        caption: 'Ao atingir a temperatura de fusão, forma-se a <strong>poça de fusão</strong> — um pequeno volume de metal líquido sobre a junta. É nela que o material de adição será depositado.'
      },
      {
        title: 'Deslocamento e metal de adição',
        dur: 14,
        camera: 'pool',
        enter: (c) => {
          const st = c.st();
          st.cfg.running = true;
          st.flameHold = false;
          st.cfg.rodMode = 'ahead';
          st.cfg.feed = 0.7;
          st.cfg.lean = 38;
          st.cfg.speed = 18;
          c.tags.show('rod');
          if (c.arrow) c.arrow.visible = true;
        },
        caption: 'O maçarico avança ao longo da junta. A <strong>vareta de adição</strong> mergulha na poça, funde e incorpora-se ao metal, enquanto a poça solidifica atrás da chama.'
      },
      {
        title: 'Solidificação e cordão',
        dur: 9,
        camera: 'top',
        enter: (c) => {
          const st = c.st();
          st.cfg.running = false;
          st.flameHold = false;
          c.tags.hideAll();
          c.app.director.set('top', true);
        },
        caption: 'Sem fonte de calor, a poça solidifica. O resultado é o <strong>cordão de solda</strong>, cercado pela <strong>zona termicamente afetada</strong> — região que aqueceu sem fundir e resfriou.'
      }
    ],
    conclusion:
      'A soldagem oxiacetilênica funde o metal base (e, quando usado, o metal de adição) com uma chama de ' +
      'alta temperatura. O controle de chama, distância e velocidade define a qualidade da junta.',
    refs: [
      'AWS, <em>Welding Handbook</em>, vol. 2 — processos de soldagem por fusão (capítulo OAW/OFC)',
      'InfoSolda — soldagem oxiacetilênica (infosolda.com.br)',
      'Literatura técnica ESAB e Lincoln Electric sobre processos a chama (acesso geral)'
    ],
    params: [
      { id: 'speed', label: 'Velocidade de avanço', min: 6, max: 45, step: 1, value: 18, unit: 'u/s', help: 'Velocidade do maçarico ao longo da junta (valor didático relativo).' },
      { id: 'standoff', label: 'Distância bico–peça', min: 5, max: 26, step: 1, value: 10, unit: 'u', help: 'Distância vertical entre o bico e a peça.' },
      { id: 'lean', label: 'Inclinação do maçarico', min: 10, max: 70, step: 1, value: 38, unit: '°', help: 'Ângulo da chama em relação à vertical.' },
      { id: 'feed', label: 'Alimentação de vareta', min: 0, max: 1, step: 0.05, value: 0.7, unit: '', help: 'Intensidade com que a vareta é fundida e depositada.' }
    ]
  },

  /* ================================================================
     MÓDULO 2 — TIPOS DE CHAMA
     ================================================================ */
  {
    id: 'm2',
    num: 2,
    title: 'Tipos de chama',
    short: 'Neutra, oxidante e carburante',
    scenario: 'flame',
    baseCfg: { speed: 0, standoff: 10, lean: 20, rodMode: 'none', weave: 0, flamePower: 1, thick: 3 },
    intro:
      'A proporção relativa entre oxigênio e acetileno define o caráter da chama. Três tipos principais ' +
      'são empregados: <strong>neutra</strong>, <strong>oxidante</strong> (excesso de oxigênio) e ' +
      '<strong>carburante/redutora</strong> (excesso de acetileno).',
    blocks: [
      {
        h: 'Chama neutra',
        body:
          'Proporção aproximadamente equilibrada. Cone interno bem definido, sem penacho intermediário. ' +
          'É a chama de uso mais frequente na soldagem de aço-carbono e de muitos outros materiais.'
      },
      {
        h: 'Chama oxidante',
        body:
          'Excesso relativo de oxigênio: cone interno mais curto e ruído geralmente mais intenso. Pode causar ' +
          'oxidação do metal fundido. Empregada em situações específicas (ex.: certas operações com latões, em que ' +
          'a chama levemente oxidante auxilia o controle da evaporação de zinco), sempre conforme o procedimento.'
      },
      {
        h: 'Chama carburante (redutora)',
        body:
          'Excesso relativo de acetileno: apresenta o <strong>penacho intermediário</strong> esbranquiçado além do ' +
          'cone interno. Atmosfera com potencial carburante — pode alterar quimicamente a superfície do metal. ' +
          'Usada em aplicações específicas, como revestimentos por fundição de superfície (hardfacing).'
      },
      {
        h: 'Controles desta demonstração',
        body:
          'O controle de <em>mistura relativa O₂:C₂H₂</em> altera comprimento e formato da chama, presença do ' +
          'penacho e o aquecimento qualitativo da peça. <em>Os valores são ilustrativos — não representam ' +
          'regulagem real de pressão de gás.</em>'
      }
    ],
    steps: [
      {
        title: 'Chama neutra',
        dur: 10,
        camera: 'torch',
        enter: (c) => {
          const st = c.st();
          st.reset();
          st.flameHold = true;
          st.torch.flame.setMix(1.0);
          c.tags.showOnly(['cone', 'env']);
          c.app.director.set('torch', true);
        },
        caption: '<strong>Chama neutra</strong>: cone interno luminoso e bem definido, envoltório azul-violeta, <em>sem</em> penacho. Referência para soldagem de aço-carbono.'
      },
      {
        title: 'Chama oxidante',
        dur: 10,
        camera: 'torch',
        enter: (c) => {
          c.st().torch.flame.setMix(1.25);
          c.tags.showOnly(['cone', 'env']);
        },
        caption: '<strong>Chama oxidante</strong> (excesso de O₂): cone interno mais curto e pontiagudo, ruído mais intenso. O excesso pode causar oxidação do metal fundido — observe a escamação escura na região aquecida.'
      },
      {
        title: 'Chama carburante',
        dur: 10,
        camera: 'torch',
        enter: (c) => {
          c.st().torch.flame.setMix(0.85);
          c.tags.showOnly(['cone', 'env', 'feather']);
        },
        caption: '<strong>Chama carburante</strong> (excesso de C₂H₂): surge o <strong>penacho intermediário</strong> esbranquiçado entre o cone e o envoltório. Atmosfera redutora/carburante — uso em aplicações específicas.'
      },
      {
        title: 'Aquecimento e distribuição térmica',
        dur: 8,
        camera: 'pool',
        enter: (c) => {
          c.st().torch.flame.setMix(1.0);
          c.tags.showOnly([]);
          c.app.director.set('pool', true);
        },
        caption: 'A distribuição térmica qualitativa muda com a chama: observe o halo de aquecimento na peça enquanto o tipo de chama é alternado no painel de controles.'
      }
    ],
    duringTags: true,
    conclusion:
      'A leitura visual da chama (cone interno, penacho, ruído) permite identificar o tipo de chama em campo. ' +
      'A escolha depende do material e do procedimento de soldagem ou brasagem.',
    refs: [
      'AWS, <em>Welding Handbook</em>, vol. 2 — regulagem de chama oxiacetilênica',
      'InfoSolda — tipos de chama (infosolda.com.br)',
      'Literatura de fabricantes (ESAB, Victor/Miller) sobre ajuste de chama'
    ],
    params: [
      { id: 'mix', label: 'Mistura relativa O₂:C₂H₂', min: 0.8, max: 1.35, step: 0.01, value: 1.0, unit: '', help: 'Proporção ilustrativa: ~1,0 neutra · >1,1 oxidante · <0,95 carburante.', live: true },
      { id: 'mixPresets', kind: 'presets', label: 'Tipos de chama', presets: [{ label: 'Neutra', value: 1.0 }, { label: 'Oxidante', value: 1.25 }, { label: 'Carburante', value: 0.85 }], help: 'Atalhos para os três tipos clássicos.' },
      { id: 'flamePower', label: 'Energia da chama (ilustrativo)', min: 0.5, max: 1.5, step: 0.05, value: 1.0, unit: '×', help: 'Multiplicador qualitativo do aporte térmico.', live: true }
    ]
  },

  /* ================================================================
     MÓDULO 3 — SOLDAGEM À ESQUERDA
     ================================================================ */
  {
    id: 'm3',
    num: 3,
    title: 'Soldagem à esquerda (forehand)',
    short: 'Chama aponta para a região não soldada',
    scenario: 'butt',
    baseCfg: { speed: 18, standoff: 10, lean: 38, feed: 0.7, rodMode: 'ahead', weave: 1.6, thick: 3 },
    intro:
      'Na soldagem <strong>à esquerda</strong> (forehand / leftward), o maçarico avança com a chama orientada ' +
      'para a <strong>região ainda não soldada</strong> — a chama "olha" na direção do avanço. A vareta atua à ' +
      'frente, mergulhando na poça formada na borda de fusão.',
    blocks: [
      {
        h: 'Geometria operacional',
        body:
          'Maçarico inclinado (tipicamente na faixa de 30° a 45° em relação à vertical, valor de referência que ' +
          'varia com espessura e procedimento), chama apontada para o metal frio à frente. A vareta segue em ângulo ' +
          'com a ponta dentro da poça, à frente do cone da chama.'
      },
      {
        h: 'Aplicações típicas',
        body:
          '<ul><li>Chapas de menor espessura (referência didática frequente: inferior a ~3 mm)</li>' +
          '<li>Trabalhos leves de fabricação e manutenção</li>' +
          '<li>Situações em que o controle visual da poça é prioritário</li></ul>'
      },
      {
        h: 'Por que o calor "empurra" a poça',
        body:
          'Com a chama voltada para o metal frio, parte do calor pré-aquece a borda ainda não fundida, o que ' +
          'facilita o molhamento e o controle da poça em chapas finas — no simulador, observe a região ' +
          'laranja à frente da poça.'
      }
    ],
    steps: [
      {
        title: 'Posicionamento — orientação',
        dur: 7,
        camera: 'chase',
        enter: (c) => {
          const st = c.st();
          st.reset();
          st.cfg.running = false;
          st.flameHold = false;
          st.cfg.lean = 38;
          st.cfg.rodMode = 'ahead';
          st.rod.group.visible = true;
          c.tags.showOnly(['torch', 'rod', 'seam']);
          if (c.arrow) c.arrow.visible = true;
          c.app.director.set('chase', true);
        },
        caption: 'Soldagem à esquerda: a chama aponta para a <strong>direção de avanço</strong> (seta laranja), pré-aquecendo a região ainda não soldada. A vareta atua <strong>à frente</strong> do maçarico.'
      },
      {
        title: 'Passada completa',
        dur: 14,
        camera: 'pool',
        enter: (c) => {
          const st = c.st();
          st.cfg.running = true;
          st.flameHold = false;
          st.cfg.speed = 18;
          c.app.director.set('pool', true);
        },
        caption: 'A poça avança: a vareta mergulha à frente do cone, funde e o maçarico a segue. Observe o pré-aquecimento na borda ainda fria.'
      },
      {
        title: 'Análise do cordão',
        dur: 7,
        camera: 'top',
        enter: (c) => {
          c.st().cfg.running = false;
          c.st().flameHold = false;
          c.tags.showOnly([]);
          c.app.director.set('top', true);
        },
        caption: 'Cordão formado com chama orientada à frente. Técnica característica de chapas finas e trabalhos que exigem controle visual cuidadoso da poça.'
      }
    ],
    conclusion:
      'À esquerda: chama no sentido do avanço, vareta à frente — boa visibilidade da poça e pré-aquecimento do ' +
      'metal frio; técnica tradicionalmente associada a chapas de menor espessura.',
    refs: [
      'AWS, <em>Welding Handbook</em>, vol. 2 — técnicas forehand/backhand',
      'InfoSolda — soldagem à esquerda e à direita (infosolda.com.br)',
      'Apostilas de formação SENAI em soldagem oxiacetilênica (acesso geral)'
    ],
    params: [
      { id: 'speed', label: 'Velocidade de avanço', min: 6, max: 45, step: 1, value: 18, unit: 'u/s', help: 'Mudanças afetam largura da trilha térmica e fusão.', live: true },
      { id: 'standoff', label: 'Distância bico–peça', min: 5, max: 26, step: 1, value: 10, unit: 'u', help: 'Aproximar aumenta o aporte de calor.', live: true },
      { id: 'lean', label: 'Inclinação do maçarico', min: 10, max: 70, step: 1, value: 38, unit: '°', help: 'Ângulo da chama em relação à vertical.', live: true },
      { id: 'feed', label: 'Alimentação de vareta', min: 0, max: 1, step: 0.05, value: 0.7, unit: '', help: '0 = autógena (sem adição).', live: true }
    ]
  },

  /* ================================================================
     MÓDULO 4 — SOLDAGEM À DIREITA + COMPARAÇÃO
     ================================================================ */
  {
    id: 'm4',
    num: 4,
    title: 'Soldagem à direita (backhand)',
    short: 'Chama aponta para a região já soldada',
    scenario: 'compare',
    baseCfg: { speed: 18, standoff: 10, feed: 0.7, weave: 1.6, thick: 3 },
    intro:
      'Na soldagem <strong>à direita</strong> (backhand / rightward), o maçarico avança com a chama orientada ' +
      'para a <strong>região já soldada</strong> — o cone da chama aquece a poça e o cordão recém-formado. ' +
      'A vareta atua atrás do maçarico, e a inclinação do bico costuma ser mais fechada.',
    blocks: [
      {
        h: 'Geometria operacional',
        body:
          'Bico apontado para trás (em direção ao cordão), inclinação mais fechada do que na técnica à esquerda ' +
          '(valores de referência na faixa de 45° a 60°, conforme espessura e procedimento). A vareta é apresentada ' +
          'à poça pelo lado de trás.'
      },
      {
        h: 'Aplicações típicas',
        body:
          '<ul><li>Chapas relativamente espessas</li>' +
          '<li>Situações que exigem maior aproveitamento térmico na poça</li>' +
          '<li>Operações previstas em procedimentos de soldagem específicos</li></ul>'
      },
      {
        h: 'Comparação com a técnica à esquerda',
        body:
          'Lado A (esquerda): chama à frente, pré-aquecendo o metal frio. Lado B (direita): chama aquece poça e ' +
          'cordão atrás do bico. As duas configurações mudam a distribuição qualitativa do calor ao longo da junta ' +
          '— compare as trilhas térmicas nos dois lados durante a execução simultânea.'
      },
      {
        h: 'Honestidade técnica',
        body:
          'Literatura de processo associa a técnica à direita a vantagens térmicas em chapas espessas; ganhos ' +
          'exatos de penetração ou consumo de gás dependem do procedimento e não são afirmados aqui sem dados ' +
          'que os sustentem.'
      }
    ],
    steps: [
      {
        title: 'Duas orientações, mesmo caminho',
        dur: 7,
        camera: 'compare',
        enter: (c) => {
          for (const st of c.stations) { st.reset(); st.cfg.running = false; st.flameHold = false; }
          c.tags.showOnly(['torch', 'rod', 'seam']);
          c.app.ui.showCompare(true);
          c.app.director.set('compare', true);
        },
        caption: '<strong>Lado A — à esquerda</strong>: chama à frente. <strong>Lado B — à direita</strong>: chama para trás, sobre a região já soldada. Mesma velocidade, mesma distância.'
      },
      {
        title: 'Execução simultânea',
        dur: 14,
        camera: 'compare',
        enter: (c) => {
          for (const st of c.stations) st.cfg.running = true;
        },
        caption: 'Passadas simultâneas: observe a posição da vareta (à frente no A, atrás no B) e a distribuição do calor — no B o cone aquece a poça e o cordão.'
      },
      {
        title: 'Comparação dos cordões',
        dur: 8,
        camera: 'compare',
        enter: (c) => {
          for (const st of c.stations) { st.cfg.running = false; st.flameHold = false; }
          c.tags.showOnly([]);
          c.app.ui.showCompare(false);
        },
        caption: 'Resumo: à esquerda — pré-aquecimento do metal frio, boa visibilidade da poça (chapas finas). À direita — calor concentrado na poça/cordão (chapas espessas, maior aproveitamento térmico).'
      }
    ],
    conclusion:
      'As duas técnicas diferem na orientação da chama e na posição da vareta, alterando a distribuição de calor ' +
      'ao longo da junta. A escolha considera espessura, posição de solda e procedimento aplicável.',
    refs: [
      'AWS, <em>Welding Handbook</em>, vol. 2 — forehand e backhand',
      'InfoSolda — soldagem à direita (infosolda.com.br)',
      'Literatura de fabricantes (ESAB, Lincoln Electric) sobre técnicas de chama'
    ],
    params: [
      { id: 'speed', label: 'Velocidade de avanço (ambos)', min: 6, max: 45, step: 1, value: 18, unit: 'u/s', help: 'Aplicada simultaneamente às duas estações.', live: true }
    ]
  },

  /* ================================================================
     MÓDULO 5 — AUTÓGENA E METAL DE ADIÇÃO
     ================================================================ */
  {
    id: 'm5',
    num: 5,
    title: 'Autógena e metal de adição',
    short: 'Com e sem vareta',
    scenario: 'butt',
    baseCfg: { speed: 16, standoff: 10, lean: 38, feed: 0, rodMode: 'none', weave: 1.2, thick: 3 },
    intro:
      'A soldagem pode ser executada <strong>sem metal de adição</strong> (autógena), fundindo apenas as bordas ' +
      'do metal base, ou <strong>com vareta</strong>, quando o material adicionado compõe o cordão.',
    blocks: [
      {
        h: 'Soldagem sem metal de adição',
        body:
          'As bordas fundem e se unem pelo próprio metal base. O cordão resultante é mais baixo e a técnica exige ' +
          'bordas bem preparadas e aproximação adequada. Aplicável em chapas finas e situações em que se deseja ' +
          'mínima adição de material.'
      },
      {
        h: 'Soldagem com vareta de adição',
        body:
          'A vareta funde na poça e incorpora-se ao cordão, aumentando seu volume e reforço. A quantidade ' +
          'alimentada influencia a geometria do cordão — no simulador, o consumo da vareta é visível e o cordão ' +
          'cresce com a alimentação.'
      },
      {
        h: 'Comparação',
        body:
          'Alternando os métodos com condições semelhantes, observe: cordão mais baixo e estreito na autógena; ' +
          'cordão mais alto e volumoso com adição. A escolha depende da espessura, do preparo e do reforço desejado.'
      }
    ],
    steps: [
      {
        title: 'Soldagem autógena (sem adição)',
        dur: 14,
        camera: 'pool',
        enter: (c) => {
          const st = c.st();
          st.reset();
          st.cfg.rodMode = 'none';
          st.cfg.feed = 0;
          st.cfg.speed = 16;
          st.cfg.running = true;
          st.flameHold = false;
          st.rod.group.visible = false;
          c.tags.show('seam');
        },
        caption: '<strong>Sem metal de adição</strong>: as bordas fundem e unem-se pelo próprio metal base. Cordão mais baixo — observe a poça estreita.'
      },
      {
        title: 'Análise do cordão autógeno',
        dur: 6,
        camera: 'top',
        enter: (c) => {
          c.st().cfg.running = false;
          c.st().flameHold = false;
          c.app.director.set('top', true);
        },
        caption: 'Junta consolidada apenas com o metal base. Indicada quando se quer mínima adição e preparo das bordas é adequado.'
      },
      {
        title: 'Com vareta de adição',
        dur: 14,
        camera: 'pool',
        enter: (c) => {
          const st = c.st();
          st.reset();
          st.cfg.rodMode = 'ahead';
          st.cfg.feed = 0.8;
          st.cfg.speed = 16;
          st.cfg.running = true;
          c.tags.show('rod');
        },
        caption: '<strong>Com vareta</strong>: o metal de adição funde na poça e incorpora-se ao cordão. Note o <strong>consumo progressivo</strong> da vareta e o cordão mais volumoso.'
      },
      {
        title: 'Comparação dos métodos',
        dur: 7,
        camera: 'top',
        enter: (c) => {
          c.st().cfg.running = false;
          c.st().flameHold = false;
          c.tags.showOnly([]);
        },
        caption: 'Cordão com adição: mais alto e volumoso. Autógeno: mais baixo. A quantidade de metal adicionado molda a geometria aproximada da junta.'
      }
    ],
    conclusion:
      'Com ou sem adição, a junta se forma pela fusão. O metal de adição amplia as possibilidades de espessura ' +
      'e reforço do cordão; a autógena reduz material adicionado, mas exige bordas bem preparadas.',
    refs: [
      'AWS, <em>Welding Handbook</em>, vol. 2 — materiais de adição para OAW',
      'InfoSolda — varetas e consumíveis oxiacetilênicos (infosolda.com.br)',
      'Literatura de fabricantes de consumíveis (ESAB)'
    ],
    params: [
      { id: 'feed', label: 'Alimentação de vareta', min: 0, max: 1, step: 0.05, value: 0.8, unit: '', help: 'Aumente para ver o cordão ganhar volume.', live: true },
      { id: 'rodPresets', kind: 'presets', label: 'Método', presets: [{ label: 'Autógena', value: 0 }, { label: 'Com vareta', value: 0.8 }], help: 'Alternar entre os dois métodos mantendo condições semelhantes.' },
      { id: 'speed', label: 'Velocidade de avanço', min: 6, max: 40, step: 1, value: 16, unit: 'u/s', help: '', live: true }
    ]
  },

  /* ================================================================
     MÓDULO 6 — BRASAGEM OXIACETILÊNICA
     ================================================================ */
  {
    id: 'm6',
    num: 6,
    title: 'Brasagem oxiacetilênica',
    short: 'Metal base não funde — capilaridade',
    scenario: 'braze',
    baseCfg: {},
    intro:
      'Na brasagem, o <strong>metal base não funde</strong>: o calor promove a fusão de um metal de adição ' +
      'apropriado, que molha as superfícies e preenche a folga da junta, principalmente por ' +
      '<strong>capilaridade</strong>. Na brasagem convencional, o metal de adição apresenta liquidus acima de ' +
      '450 °C e inferior à temperatura solidus dos metais base.',
    blocks: [
      {
        h: 'A junta e a folga',
        body:
          'A conexão demonstrada é uma <strong>conexão por luva</strong> entre dois tubos de cobre: o consumível ' +
          'funde e escoa na folga capilar entre o tubo e a luva. Folgas adequadas (dependem do consumível e do ' +
          'material) favorecem o preenchimento por capilaridade.'
      },
      {
        h: 'Visualização em corte',
        body:
          'A etapa de corte remove metade do conjunto para mostrar o preenchimento interno da folga — algo ' +
          'impossível de ver diretamente na prática, e por isso valioso didaticamente.'
      },
      {
        h: 'Brasagem ≠ soldagem por fusão',
        body:
          'Ambas podem usar chama oxiacetilênica, mas são processos distintos: na soldagem por fusão o metal base ' +
          'funde; na brasagem ele permanece sólido, e a união decorre do molhamento e do preenchimento capilar do ' +
          'consumível (com papel do fluxo/desoxidante na prática).'
      }
    ],
    steps: [
      {
        title: 'Peças e posicionamento',
        dur: 6,
        camera: 'braze',
        enter: (c) => {
          c.rig.reset();
          c.rig.set({
            cutaway: false, heatLevel: 0, flow: 0, alloy: 0,
            torch: { x: 0, standoff: 14, lean: 30, on: false },
            rod: { x: -34, y: 16, consumption: 0 }
          });
          c.tags.hideAll();
          c.app.director.set('overview', true);
        },
        caption: 'Conexão entre dois tubos de cobre por <strong>luva de latão</strong>. A brasagem une as peças sem fundir o metal base.'
      },
      {
        title: 'Visualização em corte',
        dur: 5,
        camera: 'brazeCut',
        enter: (c) => {
          c.rig.set({ cutaway: true, torch: { on: false } });
          c.tags.show('brazeCut');
          c.app.director.set('side', true);
        },
        caption: 'No corte, vê-se a <strong>folga capilar</strong> entre o tubo e a luva — é por ela que o consumível fundido será puxado por capilaridade.'
      },
      {
        title: 'Aquecimento da junta',
        dur: 8,
        camera: 'brazeClose',
        enter: (c) => { c.app.director.set('torch', true); },
        during: (c, k) => {
          c.rig.set({ heatLevel: 0.2 + 0.65 * k, torch: { x: 0, standoff: 14, lean: 30, on: true } });
        },
        caption: 'A chama aquece o conjunto de forma distribuída. O metal base aquece, mas <strong>permanece sólido</strong> — abaixo da sua temperatura de fusão.'
      },
      {
        title: 'Fusão do consumível',
        dur: 5,
        camera: 'brazeClose',
        enter: (c) => { c.tags.show('brazeAlloy'); c.app.director.set('pool', true); },
        during: (c, k) => {
          c.rig.set({
            heatLevel: 0.9, alloy: k,
            torch: { x: 0, standoff: 14, lean: 30, on: true },
            rod: { x: 30 - 26 * k, y: 14 - 12 * k, consumption: 0.25 * k }
          });
        },
        caption: 'A vareta de brasagem <strong>funde</strong> (liquidus acima de 450 °C, inferior ao solidus do metal base) e molha a superfície aquecida.'
      },
      {
        title: 'Escoamento por capilaridade',
        dur: 7,
        camera: 'braze',
        enter: (c) => { c.app.director.set('side', true); },
        during: (c, k) => {
          c.rig.set({
            flow: k, heatLevel: 0.9 - 0.08 * k, alloy: 1,
            torch: { x: 14 * Math.sin(k * Math.PI), standoff: 14, lean: 30, on: true },
            rod: { x: 6 - 22 * k, y: 1.8 - 0.8 * k, consumption: 0.25 + 0.35 * k }
          });
        },
        caption: 'O consumível líquido <strong>escoa pela folga</strong> puxado por capilaridade, preenchendo a região de união entre tubo e luva.'
      },
      {
        title: 'Preenchimento completo',
        dur: 4,
        camera: 'braze',
        enter: (c) => {
          c.rig.set({ flow: 1, heatLevel: 0.82, alloy: 1, torch: { x: 0, standoff: 14, lean: 30, on: false } });
        },
        caption: 'Folga preenchida ao longo da conexão — a união depende da continuidade do preenchimento capilar.'
      },
      {
        title: 'Resfriamento e solidificação',
        dur: 8,
        camera: 'braze',
        during: (c, k) => {
          c.rig.set({ heatLevel: 0.82 * (1 - k), flow: 1, alloy: 1, torch: { on: false }, rod: { x: -20, y: 16, consumption: 0.6 } });
        },
        caption: 'Ao resfriar, o consumível solidifica formando a junta. O metal base permaneceu sem fusão — característica que distingue a brasagem da soldagem por fusão.'
      }
    ],
    conclusion:
      'Brasagem oxiacetilênica: aquecer o conjunto, fundir o consumível, deixar a capilaridade preencher a folga. ' +
      'Metal base íntegro — processo distinto da soldagem por fusão, ainda que use a mesma fonte de calor.',
    refs: [
      'AWS, <em>Welding Handbook</em>, vol. 2 — brasagem (brazing) com chama',
      'ISO 857-2 / terminologia ISO relacionada a brasagem (verificar edição vigente)',
      'Literatura de fabricantes de consumíveis de brasagem (ESAB, Johnson Matthey — acesso geral)'
    ],
    params: []
  },

  /* ================================================================
     MÓDULO 7 — ERROS E DEFEITOS
     ================================================================ */
  {
    id: 'm7',
    num: 7,
    title: 'Erros e defeitos',
    short: 'Consequências da execução inadequada',
    scenario: 'butt',
    baseCfg: { speed: 18, standoff: 10, lean: 38, feed: 0.7, rodMode: 'ahead', weave: 1.6, thick: 2 },
    intro:
      'Parâmetros inadequados produzem efeitos característicos na junta. Os cenários a seguir são ' +
      '<strong>resultados possíveis</strong> — não consequências inevitáveis de um único parâmetro, que sempre ' +
      'interage com espessura, material e posicionamento.',
    blocks: [
      {
        h: 'Velocidade excessiva',
        body: 'Aquecimento insuficiente por unidade de comprimento: possível falta de fusão e cordão irregular.'
      },
      {
        h: 'Velocidade muito baixa',
        body: 'Excesso de aporte térmico na mesma região: maior área aquecida e, em chapas finas, possibilidade de perfuração.'
      },
      {
        h: 'Distância inadequada',
        body: 'Distância grande reduz drasticamente a energia que incide na peça e dificulta o controle da poça.'
      },
      {
        h: 'Alimentação irregular',
        body: 'Variação na adição gera cordão com geometria irregular e possíveis descontinuidades.'
      },
      {
        h: 'Tipo de chama inadequado',
        body: 'Chama oxidante pode favorecer oxidação do metal (escamas escuras na zona aquecida); carburante pode alterar quimicamente a superfície.'
      }
    ],
    steps: [
      {
        title: 'Referência — passada adequada',
        dur: 14,
        camera: 'side',
        enter: (c) => {
          const st = c.st();
          st.reset();
          st.cfg.speed = 18; st.cfg.standoff = 10; st.cfg.feed = 0.7; st.cfg.beadJitter = 0;
          st.torch.flame.setMix(1.0); st.cfg.flamePower = 1.0;
          st.cfg.running = true;
          st.metrics.startedAt = 0;
          c.app.director.set('side', true);
        },
        caption: '<strong>Referência</strong>: velocidade, distância, alimentação e chama adequadas — cordão contínuo e fusão ao longo da junta.'
      },
      {
        title: 'Velocidade excessiva',
        dur: 12,
        camera: 'side',
        enter: (c) => {
          const st = c.st();
          st.reset();
          st.cfg.speed = 45; st.cfg.running = true;
          st.metrics.startedAt = 0;
        },
        caption: '<strong>Velocidade excessiva</strong>: a energia por comprimento é insuficiente — trechos sem fusão e cordão intermitente (observe a trilha térmica estreita).'
      },
      {
        title: 'Velocidade muito baixa',
        dur: 16,
        camera: 'side',
        enter: (c) => {
          const st = c.st();
          st.reset();
          st.cfg.speed = 8; st.cfg.running = true;
          st.metrics.startedAt = 0;
        },
        caption: '<strong>Velocidade muito baixa</strong>: excesso de calor na mesma região — poça cresce e, em chapa fina, pode <strong>perfurar</strong> o material (burn-through).'
      },
      {
        title: 'Distância inadequada',
        dur: 15,
        camera: 'side',
        enter: (c) => {
          const st = c.st();
          st.reset();
          st.cfg.speed = 16; st.cfg.standoff = 26; st.cfg.running = true;
          st.metrics.startedAt = 0;
        },
        caption: '<strong>Bico distante</strong>: a energia que chega à peça cai fortemente com a distância — aquecimento fraco, poça difícil de manter e fusão incompleta.'
      },
      {
        title: 'Alimentação irregular',
        dur: 14,
        camera: 'top',
        enter: (c) => {
          const st = c.st();
          st.reset();
          st.cfg.speed = 18; st.cfg.standoff = 10;
          st.cfg.beadJitter = 0.9;
          st.cfg.running = true;
          st.metrics.startedAt = 0;
          c.app.director.set('top', true);
        },
        caption: '<strong>Alimentação irregular</strong>: cordão com volume alternado — geométrica e visualmente descontínuo, com possíveis descontinuidades internas.'
      },
      {
        title: 'Chama inadequada (oxidante)',
        dur: 14,
        camera: 'side',
        enter: (c) => {
          const st = c.st();
          st.reset();
          st.cfg.speed = 18; st.cfg.standoff = 10; st.cfg.beadJitter = 0;
          st.torch.flame.setMix(1.25);
          st.cfg.flamePower = 1.05;
          st.cfg.running = true;
          st.metrics.startedAt = 0;
        },
        caption: '<strong>Chama oxidante</strong> em soldagem de aço-carbono: excesso de O₂ favorece oxidação — observe as escamas escuras na zona aquecida (efeito ilustrativo).'
      }
    ],
    conclusion:
      'Cada desvio de parâmetro produz assinaturas visuais distintas: trilha estreita (velocidade alta), perfuração ' +
      '(velocidade baixa em chapa fina), fusão incompleta (distância grande), cordão irregular (adição desigual) e ' +
      'oxidação (chama inadequada). Corrigir significa reequilibrar o conjunto de parâmetros.',
    refs: [
      'AWS, <em>Welding Handbook</em>, vol. 1 — defeitos de soldagem e causas',
      'ISO 6520-1 — classificação de imperfeições em soldagem a fusão (verificar edição vigente)',
      'InfoSolda — defeitos de soldagem (infosolda.com.br)'
    ],
    params: [
      { id: 'speed', label: 'Velocidade de avanço', min: 5, max: 50, step: 1, value: 18, unit: 'u/s', help: 'Experimente os extremos e compare com os cenários.', live: true },
      { id: 'standoff', label: 'Distância bico–peça', min: 5, max: 30, step: 1, value: 10, unit: 'u', help: '', live: true },
      { id: 'feed', label: 'Alimentação de vareta', min: 0, max: 1, step: 0.05, value: 0.7, unit: '', help: '', live: true },
      { id: 'mixPresets', kind: 'presets', label: 'Chama', presets: [{ label: 'Neutra', value: 1.0 }, { label: 'Oxidante', value: 1.25 }, { label: 'Carburante', value: 0.85 }], help: '' }
    ]
  },

  /* ================================================================
     MÓDULO 8 — SEGURANÇA
     ================================================================ */
  {
    id: 'm8',
    num: 8,
    title: 'Segurança operacional',
    short: 'Riscos, EPIs e normas aplicáveis',
    scenario: 'safety',
    baseCfg: {},
    intro:
      'A soldagem oxiacetilênica envolve chama aberta, gases comprimidos, radiação do processo e fumos metálicos. ' +
      'A segurança combina EPIs, proteção coletiva, inspeção de equipamentos e organização da área — com base nas ' +
      'normas aplicáveis (NR-06, NR-15, NR-23 e NR-34, quando pertinentes).',
    blocks: [
      {
        h: 'Proteção individual',
        body:
          'Proteção ocular com filtro apropriado (óculos de solda/lentes conforme o processo), luvas de raspa, ' +
          'vestimenta de algodão pesado com mangas compridas, sem bolsos abertos ou partes sintéticas (NR-06).'
      },
      {
        h: 'Ventilação e fumos',
        body:
          'Ventilação adequada e controle de fumos metálicos na zona de respiração (NR-15 — agentes ambientais). ' +
          'Em espaços confinados, seguem-se requisitos próprios e avaliação de atmosfera.'
      },
      {
        h: 'Incêndio e equipamentos',
        body:
          'Remoção/proteção de materiais combustíveis, vigia de fogo e extintores acessíveis (NR-23). Cilindros em ' +
          'pé e fixados, mangueiras e conexões inspecionadas, e <strong>dispositivos contra retrocesso de chama</strong> ' +
          'instalados nas linhas (NR-34 — quando aplicável a soldagem e corte a quente em ambientes marítimos/industriais).'
      },
      {
        h: 'Importante',
        body:
          'Este simulador <strong>não substitui treinamento supervisionado</strong>, a leitura das normas vigentes ' +
          'nem as instruções dos fabricantes. Consulte sempre as edições atualizadas no site oficial do Ministério ' +
          'do Trabalho e Emprego.'
      }
    ],
    steps: [
      {
        title: 'Proteção individual (NR-06)',
        dur: 8,
        camera: 'operator',
        enter: (c) => {
          c.tags.showOnly(['epi', 'gloves']);
        },
        caption: 'Proteção ocular com filtro apropriado, luvas de raspa e vestimenta adequada — exigências amparadas pela <strong>NR-06</strong> (EPIs).'
      },
      {
        title: 'Ventilação e fumos metálicos (NR-15)',
        dur: 8,
        camera: 'ventilation',
        showFumes: true,
        enter: (c) => {
          c.tags.showOnly(['vent', 'fumes']);
        },
        caption: 'Ventilação e controle de fumos na zona de respiração — limites e agentes ambientais tratados na <strong>NR-15</strong>.'
      },
      {
        title: 'Prevenção de incêndio (NR-23)',
        dur: 8,
        camera: 'extinguisher',
        enter: (c) => {
          c.tags.showOnly(['ext', 'area']);
          c.app.director.set('extinguisher', true);
        },
        caption: 'Área limpa de combustíveis, vigia e extintor acessível — diretrizes da <strong>NR-23</strong> (proteção contra incêndios).'
      },
      {
        title: 'Cilindros e retrocesso de chama (NR-34)',
        dur: 9,
        camera: 'cylinders',
        enter: (c) => {
          c.tags.showOnly(['cyl', 'arrest']);
          c.app.director.set('cylinders', true);
        },
        caption: 'Cilindros em pé e fixados, mangueiras inspecionadas e <strong>dispositivos contra retrocesso de chama</strong> nas linhas — requisitos associados à <strong>NR-34</strong> quando aplicável.'
      },
      {
        title: 'Inspeção e organização',
        dur: 8,
        camera: 'ventilation',
        enter: (c) => {
          c.tags.showOnly(['hose', 'area']);
        },
        caption: 'Inspeção de mangueiras, conexões e bico antes do uso; bancada organizada e área sinalizada. Segurança é parte do procedimento, não um acessório.'
      }
    ],
    conclusion:
      'Riscos do processo: chama aberta, gases comprimidos, radiação e fumos. Controles: EPIs, ventilação, ' +
      'prevenção de incêndio, dispositivos contra retrocesso e inspeção de equipamentos — NR-06, NR-15, NR-23 e ' +
      'NR-34 conforme pertinência.',
    refs: [
      'NR-06 — Equipamentos de Proteção Individual (gov.br/trabalho-e-emprego)',
      'NR-15 — Atividades e Operações Insalubres (agentes ambientais)',
      'NR-23 — Proteção contra Incêndios',
      'NR-34 — Condições e Meio Ambiente de Trabalho na Indústria da Construção e Reparação Naval (soldagem e corte a quente)',
      'Fundacentro — publicações de segurança em soldagem e corte (gov.br/fundacentro)'
    ],
    params: []
  }
];

export const GLOBAL_REFS = [
  { t: 'InfoSolda', d: 'Portal brasileiro de soldagem — conceitos de processos a chama (infosolda.com.br).' },
  { t: 'AWS — American Welding Society', d: '<em>Welding Handbook</em>, capítulos sobre OAW/brasagem (aws.org).' },
  { t: 'TWI — The Welding Institute', d: 'Base de conhecimento sobre processos de soldagem (twi-global.com).' },
  { t: 'ESAB / Lincoln Electric / Miller / Fronius', d: 'Literatura técnica de fabricantes sobre equipamentos e técnicas de chama.' },
  { t: 'SENAI / FBTS', d: 'Material didático de formação de soldadores no Brasil (senai.br, fbts.org.br).' },
  { t: 'Normas regulamentadoras', d: 'NR-06, NR-15, NR-23, NR-34 — texto vigente em gov.br/trabalho-e-emprego.' },
  { t: 'ABNT / ISO', d: 'Terminologia e classificação de imperfeições (ex.: ISO 6520-1; edições ABNT correspondentes no abntcatalogo.com.br).' },
  { t: 'Itens pendentes de validação', d: 'Valores numéricos de temperatura e proporcões de mistura exibidos são aproximados e didáticos; confirmar em fonte técnica antes de uso formal.', pending: true }
];

export const GLOSSARY = [
  ['Poça de fusão', 'Volume de metal líquido formado pela ação do calor; solidifica formando o cordão.'],
  ['Cordão de solda', 'Metal solidificado ao longo da junta, incluindo o metal de adição.'],
  ['ZTA', 'Zona termicamente afetada — região do metal base aquecida sem fusão, com alteração de estrutura.'],
  ['Cone interno', 'Região luminosa junto ao bico; zona de maior temperatura da chama.'],
  ['Penacho', 'Zona esbranquiçada além do cone, característica do excesso de acetileno (chama carburante).'],
  ['Autógena', 'Soldagem sem metal de adição — a junta é formada pelo próprio metal base.'],
  ['Capilaridade', 'Efeito que faz o consumível fundido escoar por folgas estreitas na brasagem.']
];
