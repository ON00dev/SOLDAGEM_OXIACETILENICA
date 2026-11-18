# PROJETO: SIMULADOR INTERATIVO 3D DE SOLDAGEM OXIACETILÊNICA (OAW)

## 1. MISSÃO

Atue como um engenheiro de software sênior, especialista em computação gráfica 3D, simulação física, desenvolvimento web e design educacional industrial.

Desenvolva uma aplicação web interativa para demonstrar, explicar e simular as principais técnicas da **soldagem oxiacetilênica (OAW — Oxyacetylene Welding)**.

O projeto será utilizado como recurso didático em uma apresentação sobre processos de soldagem industrial.

**Objetivo central:** permitir que estudantes visualizem, compreendam e comparem como cada técnica de soldagem oxiacetilênica é executada, quais movimentos são utilizados, quais fenômenos ocorrem no metal e em quais situações cada técnica é aplicada.

Não desenvolva um jogo genérico, uma apresentação de slides disfarçada de simulador ou uma animação sem interação.

A aplicação deverá funcionar como um laboratório virtual de demonstração técnica, com modelos tridimensionais, animações operacionais, controles interativos, explicações contextualizadas e feedback visual.

---

## 2. PRINCÍPIOS OBRIGATÓRIOS

O desenvolvimento deverá seguir seis princípios:

1. **Fidelidade técnica:** movimentos, nomenclaturas, aplicações e fenômenos devem corresponder às referências de soldagem.
2. **Realismo visual:** representar equipamentos, chamas, metais e cordões de maneira convincente.
3. **Didática:** explicar claramente o que acontece, como acontece e por que acontece.
4. **Interatividade real:** alterações realizadas pelo usuário devem produzir efeitos observáveis.
5. **Clareza operacional:** o usuário deve conseguir acompanhar os movimentos sem conhecimento prévio.
6. **Honestidade científica:** diferenciar simulações aproximadas de fenômenos fisicamente validados.

A prioridade é ensinar as técnicas, não reproduzir integralmente um simulador profissional de treinamento industrial.

---

# 3. ESCOPO TÉCNICO

## Tecnologias

Utilizar:

- HTML5.
- CSS3.
- JavaScript ou TypeScript.
- Three.js.
- WebGL.
- GLSL para shaders.
- Web Audio API.
- Vite para desenvolvimento e compilação.

A aplicação deverá funcionar inteiramente no navegador.

Não utilizar backend, autenticação, banco de dados ou serviços pagos.

O projeto deverá ser modular, organizado e preparado para evolução.

## Requisitos de execução

- Compatibilidade com navegadores modernos.
- Interface adaptável a diferentes resoluções.
- Suporte prioritário a computadores.
- Controles de mouse e teclado.
- Qualidade gráfica ajustável.
- Funcionamento local após instalação das dependências.
- Possibilidade de publicação em hospedagem estática.

---

# 4. ESTRUTURA EDUCACIONAL

Organize o simulador em oito módulos principais:

1. Fundamentos da soldagem oxiacetilênica.
2. Tipos de chama.
3. Técnica de soldagem à esquerda.
4. Técnica de soldagem à direita.
5. Soldagem com e sem metal de adição.
6. Brasagem oxiacetilênica.
7. Comparação de técnicas e defeitos.
8. Segurança operacional.

Cada módulo deverá conter:

**Descrição:** explicação do princípio técnico.

**Aplicação:** onde e por que a técnica é utilizada.

**Demonstração:** animação tridimensional que mostra a execução.

**Orientação:** identificação dos movimentos, posições e fenômenos.

**Interação:** controles que permitam experimentar variáveis relevantes.

**Conclusão:** resumo do que foi aprendido.

Os textos devem ser escritos em português brasileiro, com linguagem técnica acessível a estudantes.

---

# 5. AMBIENTE 3D

Criar uma bancada de soldagem industrial visualmente realista.

## Elementos

- Bancada metálica.
- Duas chapas de aço-carbono.
- Junta de topo.
- Maçarico oxiacetilênico.
- Bico do maçarico.
- Vareta de adição.
- Chama dinâmica.
- Poça de fusão.
- Cordão de solda.
- Zona termicamente afetada, representada de forma didática.
- Iluminação industrial.
- Sombras e reflexos.

Os objetos devem apresentar proporções coerentes.

Não utilizar cubos ou cilindros genéricos como representação final dos equipamentos.

Empregar geometrias detalhadas, materiais PBR, texturas procedurais e shaders quando apropriado.

## Câmeras

Disponibilizar:

- Visão geral da bancada.
- Visão superior.
- Visão lateral.
- Visão aproximada do maçarico.
- Visão da poça de fusão.
- Câmera de acompanhamento.

Permitir girar, aproximar e afastar a câmera.

O usuário deverá conseguir pausar uma demonstração e inspecionar a posição dos equipamentos.

---

# 6. MÓDULO 1 — FUNDAMENTOS DO PROCESSO OAW

## Conteúdo técnico

A soldagem oxiacetilênica é um processo de soldagem por fusão que utiliza o calor gerado pela combustão do acetileno (C₂H₂) com oxigênio (O₂).

A chama pode alcançar temperaturas máximas próximas de 3.100 °C a 3.200 °C, conforme as condições de combustão.

O calor é transferido para as peças, provocando aquecimento e fusão localizada do metal base.

A poça de fusão acompanha o deslocamento do maçarico e posteriormente solidifica, formando a junta soldada.

## Demonstração obrigatória

Criar uma sequência tridimensional:

1. Apresentação das chapas e da junta.
2. Aproximação do maçarico.
3. Aquecimento localizado.
4. Mudança gradual da aparência do metal.
5. Formação da poça de fusão.
6. Deslocamento da fonte de calor.
7. Solidificação progressiva.
8. Formação do cordão.

A animação deverá permitir pausa, repetição e câmera lenta.

Adicionar legendas sincronizadas para explicar cada etapa.

---

# 7. MÓDULO 2 — TIPOS DE CHAMA

Implementar três configurações distintas de chama.

## 7.1. Chama neutra

**Características:**
- Proporção aproximadamente equilibrada de oxigênio e acetileno fornecidos ao maçarico.
- Cone interno bem definido.
- Ausência do penacho intermediário característico de excesso de acetileno.
- Utilização frequente em soldagem de aço-carbono e outros materiais compatíveis.

**Demonstração:**
- Exibir cone interno e envoltório externo.
- Identificar as regiões visíveis da chama.
- Demonstrar aquecimento da peça.
- Explicar aplicações e limitações.

## 7.2. Chama oxidante

**Características:**
- Excesso relativo de oxigênio.
- Cone interno mais curto.
- Ruído geralmente mais intenso.
- Possibilidade de oxidação excessiva do metal.
- Aplicações específicas em determinadas ligas.

**Demonstração:**
- Alterar visualmente o formato da chama.
- Comparar com a chama neutra.
- Explicar os possíveis efeitos metalúrgicos.
- Mostrar por que a escolha depende do material e do procedimento.

## 7.3. Chama carburante ou redutora

**Características:**
- Excesso relativo de acetileno.
- Presença de penacho intermediário.
- Atmosfera com potencial redutor e carburante.
- Aplicações específicas em determinados materiais e revestimentos.

**Demonstração:**
- Destacar o penacho de acetileno.
- Identificar as regiões da chama.
- Explicar a possibilidade de alteração química do metal.

## Controles interativos

Criar um seletor entre os três tipos.

Adicionar controles didáticos de mistura relativa dos gases.

A alteração deverá modificar:

- Comprimento visual da chama.
- Formato do cone interno.
- Presença ou ausência do penacho.
- Aparência da chama.
- Representação qualitativa da distribuição térmica.

Não representar os controles como regulagens reais de cilindros ou pressões de operação.

Exibir aviso de que a simulação é ilustrativa.

---

# 8. MÓDULO 3 — SOLDAGEM À ESQUERDA (LEFTWARD / FOREHAND)

## Objetivo

Demonstrar a técnica de avanço à esquerda, especialmente utilizada em materiais de menor espessura.

## Aplicações

- Chapas finas.
- Trabalhos leves de fabricação.
- Determinadas operações de reparo.
- Situações em que o controle da poça de fusão é importante.

A referência de espessuras inferiores a aproximadamente 3 mm poderá ser utilizada como orientação didática, sem tratá-la como limite universal.

## Técnica operacional

Demonstrar:

1. Posicionamento do maçarico.
2. Orientação da chama para a região ainda não soldada.
3. Posicionamento da vareta.
4. Formação inicial da poça.
5. Avanço progressivo.
6. Alimentação do metal de adição.
7. Formação do cordão.

## Representação visual

Adicionar:

- Seta de direção de avanço.
- Indicador de orientação da chama.
- Identificação do maçarico.
- Identificação da vareta.
- Destaque da poça de fusão.
- Representação da região aquecida.

A câmera deverá permitir observar a relação espacial entre maçarico, vareta e junta.

## Interação

Permitir alterar:

- Velocidade de avanço.
- Distância do maçarico.
- Inclinação.
- Alimentação de vareta.

O resultado deverá refletir qualitativamente as alterações.

Demonstrar situações de avanço lento, adequado e rápido.

Explicar os efeitos de cada situação.

---

# 9. MÓDULO 4 — SOLDAGEM À DIREITA (RIGHTWARD / BACKHAND)

## Objetivo

Demonstrar a técnica de avanço à direita e compará-la com a soldagem à esquerda.

## Aplicações

- Chapas relativamente espessas.
- Situações que exigem maior aproveitamento térmico.
- Operações previstas em procedimentos específicos de soldagem.

## Técnica operacional

Demonstrar:

1. Posicionamento inicial.
2. Orientação da chama para a região já soldada.
3. Posição relativa da vareta.
4. Formação da poça.
5. Avanço à direita.
6. Formação do cordão.
7. Solidificação.

## Comparação

Criar uma visualização dividida:

**Lado A — Soldagem à esquerda**

**Lado B — Soldagem à direita**

Mostrar simultaneamente:

- Sentido de avanço.
- Orientação do maçarico.
- Posição da vareta.
- Distribuição qualitativa do calor.
- Formação do cordão.
- Aplicações típicas.

Permitir pausar ambas as demonstrações no mesmo estágio.

Não afirmar ganhos exatos de penetração ou economia de gás sem dados técnicos que sustentem os valores.

---

# 10. MÓDULO 5 — SOLDAGEM AUTÓGENA E METAL DE ADIÇÃO

## Soldagem sem metal de adição

Demonstrar a união das bordas por fusão do próprio metal base.

A simulação deverá mostrar:

- Aquecimento.
- Formação da poça.
- União das bordas.
- Solidificação.

Explicar quando essa técnica pode ser utilizada.

## Soldagem com vareta de adição

Demonstrar:

- Posicionamento da vareta.
- Aproximação da poça de fusão.
- Fusão progressiva do metal de adição.
- Incorporação do material.
- Formação do cordão.

A vareta deverá apresentar consumo visual progressivo.

A quantidade de material adicionado deverá influenciar a geometria aproximada do cordão.

## Comparação

Permitir alternar entre os dois métodos mantendo condições semelhantes.

Explicar as diferenças de aplicação e de formação da junta.

---

# 11. MÓDULO 6 — BRASAGEM OXIACETILÊNICA

## Objetivo

Demonstrar a utilização da chama oxiacetilênica para realizar brasagem.

## Princípio

Na brasagem, o metal base não é fundido.

O calor promove a fusão de um metal de adição apropriado, que molha as superfícies e pode preencher a folga da junta por capilaridade.

Na brasagem convencional, o metal de adição apresenta temperatura liquidus superior a 450 °C e inferior à temperatura solidus dos metais base.

## Cenário

Criar uma conexão entre dois tubos metálicos.

Demonstrar:

1. Posicionamento das peças.
2. Aquecimento da junta.
3. Aproximação do metal de adição.
4. Fusão do consumível.
5. Escoamento na região de união.
6. Preenchimento da folga.
7. Resfriamento e solidificação.

## Recursos visuais

Implementar uma visualização em corte para demonstrar o preenchimento interno.

Adicionar legendas explicando o fenômeno de capilaridade.

Comparar brasagem e soldagem por fusão.

Destacar que são processos distintos, embora ambos possam utilizar uma chama oxiacetilênica.

---

# 12. MODELO TÉRMICO E FORMAÇÃO DO CORDÃO

Implementar uma simulação térmica simplificada.

O modelo deverá considerar:

- Fonte de calor localizada.
- Distribuição espacial de energia.
- Movimento do maçarico.
- Velocidade de avanço.
- Distância até a peça.
- Espessura do material.
- Aquecimento.
- Resfriamento.
- Formação aproximada da poça de fusão.

Utilizar uma grade térmica ou abordagem equivalente.

A resposta visual deverá ser contínua e coerente.

## Estados visuais do metal

1. Metal frio.
2. Aquecimento inicial.
3. Incandescência.
4. Região de fusão.
5. Metal em resfriamento.
6. Cordão solidificado.

Criar shaders que representem as transições.

O cordão deverá surgir progressivamente no caminho da soldagem.

Não criar simplesmente uma linha brilhante seguindo o maçarico.

## Limitações

O modelo não precisa reproduzir integralmente dinâmica dos fluidos, metalurgia computacional ou transferência de calor industrial de alta precisão.

Entretanto, deve manter relações qualitativas plausíveis.

Identificar explicitamente os resultados como estimativas didáticas.

---

# 13. MÓDULO 7 — ERROS E DEFEITOS

Criar cenários comparativos para demonstrar consequências de execução inadequada.

## Exemplos

**Velocidade excessiva**
- Aquecimento insuficiente.
- Possibilidade de falta de fusão.
- Cordão irregular.

**Velocidade muito baixa**
- Excesso de aporte térmico.
- Maior região aquecida.
- Possibilidade de perfuração em chapas finas.

**Distância inadequada**
- Alteração da distribuição de calor.
- Dificuldade de controle da poça.

**Alimentação irregular**
- Variação na geometria do cordão.
- Possibilidade de descontinuidade.

**Tipo de chama inadequado**
- Possíveis efeitos químicos e metalúrgicos indesejados.

Cada cenário deverá apresentar uma explicação clara.

Os defeitos devem ser tratados como resultados possíveis, não como consequências inevitáveis de um único parâmetro.

---

# 14. MÓDULO 8 — SEGURANÇA

Apresentar os principais cuidados relacionados ao processo:

- Proteção ocular apropriada.
- Luvas e vestimentas adequadas.
- Ventilação.
- Controle de fumos metálicos.
- Prevenção de incêndios.
- Segurança dos cilindros.
- Mangueiras e conexões.
- Dispositivos contra retrocesso de chama.
- Inspeção de equipamentos.
- Organização da área de trabalho.

Relacionar os conteúdos às normas aplicáveis, especialmente NR-06, NR-15, NR-23 e NR-34 quando pertinente.

As informações deverão ser fundamentadas em documentação oficial.

Não utilizar o simulador para substituir treinamento supervisionado.

---

# 15. MODOS DE UTILIZAÇÃO

Implementar três modos integrados.

## Modo Explicação

Apresentar textos técnicos, esquemas, destaques e informações contextualizadas.

O usuário deverá compreender a técnica antes de executar a demonstração.

## Modo Demonstração

Reproduzir animações orientadas.

Controles:

- Iniciar.
- Pausar.
- Continuar.
- Reiniciar.
- Avançar etapa.
- Voltar etapa.
- Câmera lenta.
- Alterar ângulo de visualização.

As legendas deverão acompanhar as ações.

## Modo Prática

Permitir que o usuário controle parâmetros da soldagem.

As alterações deverão influenciar o comportamento da simulação.

Apresentar feedback imediato sobre os efeitos.

Adicionar uma avaliação final simples, baseada em critérios educacionais e não em certificação profissional.

---

# 16. INTERFACE

Criar uma interface com aparência de software técnico industrial.

## Layout

**Painel esquerdo**
- Navegação pelos módulos.
- Seleção das técnicas.
- Progresso da apresentação.

**Área central**
- Simulação tridimensional.
- Ferramentas de câmera.
- Indicadores visuais.
- Animações.

**Painel direito**
- Nome da técnica.
- Descrição.
- Aplicações.
- Características.
- Orientações operacionais.
- Parâmetros interativos.

**Barra inferior**
- Reprodução.
- Pausa.
- Reinício.
- Velocidade.
- Câmera.
- Modo de aprendizagem.

## Design

Utilizar:

- Fundo grafite.
- Superfícies cinza-escuro.
- Elementos metálicos.
- Destaques em laranja e azul.
- Tipografia legível.
- Ícones discretos.
- Animações suaves.

Priorizar a leitura em projetores e monitores.

Evitar excesso de informações sobrepostas à simulação.

---

# 17. RECURSOS ESPECÍFICOS PARA APRESENTAÇÃO

Criar um **Modo Apresentador**, destinado ao uso em sala de aula.

Nesse modo:

- A simulação ocupa a maior parte da tela.
- Os textos são ampliados.
- Controles secundários são ocultados.
- As etapas podem ser avançadas manualmente.
- As demonstrações podem ser pausadas em pontos importantes.
- Setas e identificadores podem ser ativados.
- A câmera pode focar automaticamente nos componentes relevantes.

Adicionar atalhos de teclado para:

- Iniciar ou pausar.
- Avançar.
- Retroceder.
- Reiniciar.
- Alternar câmera.
- Exibir ou ocultar explicações.

O apresentador deverá conseguir explicar as técnicas sem precisar manipular muitos controles simultaneamente.

---

# 18. REFERÊNCIAS TÉCNICAS

Consultar documentação verificável de:

- InfoSolda — https://infosolda.com.br/
- Lincoln Electric — https://www.lincolnelectric.com/
- ESAB — https://www.esab.com/pt/br/
- AWS — https://www.aws.org/
- TWI — https://www.twi-global.com/
- SENAI — https://www.senai.br/
- FBTS — https://www.fbts.org.br/
- Fronius — https://www.fronius.com/
- Miller Electric — https://www.millerwelds.com/
- ISO — https://www.iso.org/
- ABNT — https://www.abntcatalogo.com.br/
- Ministério do Trabalho — https://www.gov.br/trabalho-e-emprego/
- Fundacentro — https://www.gov.br/fundacentro/

Não inventar referências.

Registrar a origem dos conceitos utilizados.

Se não houver acesso à documentação necessária, sinalizar as informações pendentes de validação.

Incluir uma seção de referências acessível na interface.

---

# 19. PLANO DE IMPLEMENTAÇÃO

Organizar o trabalho em fases verificáveis.

### Fase 1 — Estrutura e interface
- Configurar o projeto.
- Criar arquitetura modular.
- Implementar navegação.
- Criar layout.

### Fase 2 — Ambiente 3D
- Modelar bancada.
- Modelar chapas.
- Modelar maçarico.
- Modelar vareta.
- Configurar câmeras e iluminação.

### Fase 3 — Chama e transferência de calor
- Implementar três tipos de chama.
- Criar shaders.
- Implementar aquecimento.
- Representar fusão e resfriamento.

### Fase 4 — Técnicas operacionais
- Soldagem à esquerda.
- Soldagem à direita.
- Soldagem autógena.
- Soldagem com metal de adição.
- Brasagem.

### Fase 5 — Conteúdo educacional
- Explicações.
- Legendas sincronizadas.
- Setas e identificadores.
- Comparações.
- Referências.

### Fase 6 — Interatividade
- Controles do usuário.
- Feedback visual.
- Demonstração de defeitos.
- Modo prática.

### Fase 7 — Apresentação e qualidade
- Modo apresentador.
- Otimização gráfica.
- Testes funcionais.
- Revisão técnica.
- Correção de problemas.

---

# 20. CRITÉRIOS DE QUALIDADE

Antes de considerar o projeto concluído, verificar:

- O maçarico apresenta geometria convincente.
- Os três tipos de chama são distinguíveis.
- A orientação das técnicas à esquerda e à direita está correta.
- A vareta acompanha a operação adequadamente.
- O metal responde visualmente ao aquecimento.
- A poça de fusão apresenta comportamento contínuo.
- O cordão é formado progressivamente.
- A brasagem não funde o metal base.
- As demonstrações podem ser pausadas e reiniciadas.
- Os controles alteram efetivamente a simulação.
- As explicações correspondem ao fenômeno demonstrado.
- As referências técnicas estão identificadas.
- O projeto funciona sem backend.
- Não existem botões sem funcionalidade.
- O desempenho é adequado para apresentação.

Não declarar uma funcionalidade concluída apenas porque sua interface foi criada.

---

# 21. INSTRUÇÕES DE EXECUÇÃO

Primeiro, analise a estrutura do repositório.

Se houver código existente, preserve as convenções e componentes reutilizáveis.

Se o repositório estiver vazio, inicialize uma arquitetura adequada.

Em seguida:

1. Crie um plano de implementação.
2. Identifique os módulos e suas dependências.
3. Estabeleça critérios de aceitação verificáveis.
4. Implemente a estrutura fundamental.
5. Desenvolva as demonstrações progressivamente.
6. Teste cada funcionalidade.
7. Corrija problemas identificados.
8. Documente as limitações.
9. Prepare o projeto para execução local e publicação.

Não implementar todas as funcionalidades em um único arquivo.

Não utilizar simulações falsas apenas para cumprir requisitos.

Não substituir interatividade por animações pré-gravadas.

Não apresentar precisão física inexistente.

Caso uma funcionalidade avançada seja inviável, implemente uma aproximação didática tecnicamente justificável e documente suas limitações.

---

# 22. RESULTADO FINAL ESPERADO

Entregar um **laboratório virtual 3D de soldagem oxiacetilênica**, com aparência profissional e funcionamento interativo.

A aplicação deverá permitir que um estudante:

- Entenda o funcionamento da soldagem oxiacetilênica.
- Reconheça os três tipos de chama.
- Observe a execução da soldagem à esquerda.
- Observe a execução da soldagem à direita.
- Compare as técnicas.
- Compreenda o uso do metal de adição.
- Diferencie soldagem por fusão e brasagem.
- Visualize a formação do cordão.
- Experimente parâmetros operacionais.
- Entenda as consequências de erros.
- Reconheça os principais riscos do processo.

**PRIORIDADE ABSOLUTA:**

O simulador deve ensinar visualmente as técnicas da soldagem oxiacetilênica com fidelidade conceitual, movimentos coerentes, explicações claras e interatividade funcional.

O realismo gráfico deve servir ao aprendizado, e não substituí-lo.