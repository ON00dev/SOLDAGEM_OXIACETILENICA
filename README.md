# Laboratório Virtual — Soldagem Oxiacetilênica (OAW)

Simulador 3D interativo e didático da soldagem oxiacetilênica (*Oxy-Acetylene Welding*, OAW) e da brasagem, executado 100% no navegador — sem backend, sem cadastro, sem banco de dados. Todos os textos e a interface estão em português (pt-BR).

> ⚠️ **Ambiente educacional.** As simulações são **ilustrativas e aproximadas**: não reproduzem regulagens reais de pressão de gás, não exibem valores de temperatura com precisão e **não substituem treinamento supervisionado** nem as normas de segurança aplicáveis (NR-06, NR-15, NR-23, NR-34). A avaliação do modo Prática é **didática**, não representa qualificação profissional.

---

## Como executar

Requisitos: Node.js 18+ e npm.

```bash
# instalar dependências
npm install

# servidor de desenvolvimento
npm run dev

# build de produção (gera dist/)
npm run build

# servir o build localmente
npm run preview
```

O site é estático — a pasta `dist/` pode ser hospedada em qualquer servidor de arquivos estáticos (GitHub Pages, Netlify, nginx etc.). A base de URLs é relativa (`base: './'`), então funciona em subcaminhos.

### Testes automatizados

```bash
# verificar se o preview está no ar primeiro (npm run preview)
node scripts/smoke.mjs   # smoke test completo: módulos, câmeras, modos, teclado
node scripts/shots.mjs   # gera capturas de tela em shots/
```

Os testes usam Playwright (incluído como devDependency) em modo headless.

---

## Módulos didáticos

| # | Módulo | Conteúdo principal |
|---|--------|--------------------|
| 1 | Fundamentos do processo OAW | Poça de fusão, cordão, ZTA, junta de topo, física do processo |
| 2 | Tipos de chama | Neutra · oxidante · carburante — proporção O₂:C₂H₂ e aparência |
| 3 | Soldagem à esquerda | Forehand: chama à frente, vareta mergulhada à frente do cone |
| 4 | Soldagem à direita | Backhand + comparação lado A/B simultânea |
| 5 | Autógena e metal de adição | Junta formada só pelo metal base vs. com adição |
| 6 | Brasagem oxiacetilênica | Metal base **não funde**, folga capilar, visão em corte da junta |
| 7 | Erros e defeitos | Velocidade excessiva, mordea, mordida, respingo, perfuração |
| 8 | Segurança operacional | EPIs, ventilação, prevenção de incêndio, cilindros e retrocesso de chama |

## Modos de uso

- **Explicação** — passos manuais (Anterior/Próxima) com texto de apoio.
- **Demonstração** — reprodução automática com play/pause/reiniciar, avanço por etapa, câmera lenta (0,25× a 2×) e retrocesso coerente via snapshots de simulação.
- **Prática** — você controla velocidade, distância do bico, inclinação e alimentação da vareta em tempo real e recebe uma **avaliação didática** (cobertura da junta, regularidade, distância, alimentação, penalidades por perfuração/chama oxidante).

## Controles

- Barra de transporte (inferior): Reiniciar · Anterior · Play/Pause · Próxima · velocidade · etiquetas.
- Seletor de câmera: visão geral, superior, lateral, frontal, acompanhamento do maçarico, poça, comparação A/B, cilindros, prevenção de incêndio, vistas da brasagem.
- **Atalhos de teclado**: `Espaço` play/pause · `←`/`→` etapa anterior/próxima · `R` reiniciar · `C` alterna câmera · `L` etiquetas · `H` ocultar interface · `P` modo apresentador · `1–8` módulos.
- **Modo Apresentador**: tipografia ampliada, ocultações automáticas para projeção em sala.

## Arquitetura

```
src/
├── main.js            bootstrap da aplicação (expõe window.OAW p/ depuração)
├── core/
│   ├── stage.js       renderer WebGL, luzes, sala (piso/parede), qualidade (baixa/média/alta)
│   ├── cameras.js     CameraDirector — presets fixos + câmeras de acompanhamento
│   └── utils.js       damp, deg2rad etc.
├── engine/
│   ├── demo.js        DemoController — cenários, etapas, snapshots, modo prática
│   └── tags.js        etiquetas CSS2D + seta de direção
├── sim/
│   ├── thermal.js     grade térmica 2D (difusão) + rampa de cor GLSL
│   └── station.js     WeldStation — chapas, poça, cordão instanciado, métricas
├── env/
│   ├── bench.js       bancada ripada, torno, cilindros, mangueiras, extintor
│   ├── torch.js       maçarico (corpo, válvulas, bico lathe)
│   ├── flame.js       chama GLSL (cone interno, envoltório, penacho) por mixRatio
│   ├── rod.js         vareta com consumo
│   ├── braze.js       rig de brasagem — tubo + luva, corte por clipping plane
│   └── audio.js       Web Audio — sopro contínuo + crepitação da poça
├── content/
│   └── modules.js     os 8 módulos: etapas, legendas, parâmetros, referências
└── ui/
    └── ui.js          painéis, navegação, modos, atalhos, progresso (localStorage)
```

### Como a simulação funciona (visão geral honesta)

- **Térmica**: grade 2D de difusão de calor (Uint8, escala 0–1,6 onde 1,0 = fusão) com injeção gaussiana na poça; a potência cai com o quadrado da distância do bico. Daí emergem naturalmente: velocidade alta → falta de fusão; velocidade baixa → perfuração.
- **Chama**: geometria lathe com shader GLSL aditivo; o parâmetro `mixRatio` (0,8–1,35) gera os três tipos visuais de chama.
- **Brasagem**: estados de aquecimento/escoamento da liga com visão em corte por clipping plane — o metal base permanece abaixo da fusão.
- **Coordenadas**: o avanço é sempre +X; inclinação positiva = chama aponta para +X. Convenção documentada no conteúdo do módulo 3.

### Limitações conhecidas

- Sem física de fluidos real: a poça é aproximada (visual + grade térmica).
- Valores numéricos exibidos (~temperaturas, proporções de mistura) são **didáticos e aproximados**; confirmar em fonte técnica antes de uso formal.
- Sem modelagem metalúrgica real (microestrutura, tensões residuais, distorção calculada).
- Áudio sintetizado (Web Audio), não amostras reais.

## Referências (indicadas no aplicativo)

- InfoSolda — portal brasileiro de soldagem (infosolda.com.br)
- AWS — *Welding Handbook*, capítulos sobre OAW/brasagem (aws.org)
- TWI — base de conhecimento de processos (twi-global.com)
- Literatura técnica de fabricantes: ESAB, Lincoln Electric, Miller, Fronius
- SENAI / FBTS — material didático de formação de soldadores
- Normas regulamentadoras NR-06, NR-15, NR-23, NR-34 — gov.br/trabalho-e-emprego
- ABNT / ISO 6520-1 — terminologia e classificação de imperfeições

> As referências listam **tipos de fonte** para consulta; nenhuma citação numérica foi inventada neste material.

## Stack

HTML5 · CSS3 · JavaScript (ES modules, sem framework) · Three.js · WebGL/GLSL · CSS2DRenderer · Web Audio API · Vite · Playwright (testes).
