# Krilion 🦐

Jogo de conhecimentos gerais em português: encontre uma resposta válida e pouco óbvia para mergulhar mais fundo. Versão independente, gratuita e inspirada nas regras de Krillion descritas pelo usuário, com interface, ilustrações e animações próprias.

## Jogar

- **Diário:** sete perguntas iguais para todos na mesma versão do catálogo. Cada pergunta dura 25 segundos e rende até 1.000 metros; o máximo é 7.000 metros. Um novo desafio começa à meia-noite de **America/Sao_Paulo**.
- **Infinito:** rodadas ilimitadas de geografia, ciência, cultura, natureza ou todos os assuntos. As perguntas não se repetem dentro de um ciclo; ao esgotar o assunto, um novo ciclo começa.
- **Seis temas visuais:** oceano, claro, floresta, pôr do sol, lavanda e alto contraste.
- Mergulho animado, camarão explorador em SVG, bolhas, peixes, raios de luz e efeitos sonoros opcionais.
- Progresso diário, estatísticas e preferências salvos no navegador. Compartilhamento de resultado sem revelar respostas.
- Navegação por teclado, modais acessíveis, movimento reduzido e layout responsivo.

**Raridade editorial:** a pontuação usa valores fixos de curadoria, não frequências reais de respostas de outros jogadores. As respostas são verificadas em um catálogo local com enunciados de escopo definido. Acentos, caixa, espaços e pontuação são normalizados; aliases explícitos aceitam variantes comuns. Respostas desconhecidas, perguntas puladas e tempo esgotado rendem zero. A raridade não é uma medida científica de conhecimento ou popularidade.

## Desenvolvimento

Requer **Node.js 24** e npm. Não há banco de dados, chaves de API, autenticação nem serviços pagos.

```sh
npm ci
npm run dev
```

O Vite utiliza a porta 5173. Nesta configuração de nuvem, valide o serviço por requisições locais; a interface de onboarding não oferece prévia web.

```sh
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run preview
```

Os testes de navegador usam Chromium em `/usr/bin/chromium`, quando disponível, ou a instalação do Playwright. Em outro computador, execute `npx playwright install chromium` uma vez. É possível informar um executável usando `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

O build gera **`dist/`**, que pode ser publicado em qualquer hospedagem estática com HTTPS. Não é necessário servidor de aplicação. O código não faz chamadas a serviços externos durante a partida.

### GitHub Pages

Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. O workflow `.github/workflows/deploy-pages.yml` instala as dependências, testa, compila e publica somente `dist/` a cada atualização da `main`. Também é possível executá-lo manualmente na aba **Actions**.

Os caminhos de assets são relativos, permitindo servir o jogo em `https://phaelpp3.github.io/krilion/` ou em outra subpasta. Não publique a raiz do código-fonte diretamente: seu `index.html` é uma entrada de desenvolvimento que referencia TypeScript; o navegador precisa do JavaScript gerado por `npm run build`.

## Estrutura

```text
src/App.tsx                 Fluxo de jogo, cronômetro e resultados
src/components/GameShell.tsx Navegação, temas e modais
src/components/OceanScene.tsx Ilustração e animações submarinas
src/data/questions.ts       Perguntas, respostas, aliases e raridades
src/lib/game.ts             Seleção diária, validação e persistência
src/lib/preferences.ts      Temas, data de Brasília e aleatoriedade estável
src/lib/statistics.ts       Estatísticas locais e sequência diária
tests/browser.spec.ts       Testes funcionais no Chromium
```

Para ampliar o catálogo, mantenha IDs estáveis, enunciados objetivos e respostas completas para o escopo de cada pergunta. Os testes verificam colisões de aliases, reconhecimento das respostas, limites de raridade e sete perguntas distintas no diário. Mudanças no catálogo ou no algoritmo podem alterar desafios; a igualdade diária é garantida entre clientes da mesma versão.

## Persistência e limites

O prazo absoluto de uma pergunta diária é salvo ao começar. Recarregar a página, abrir menus ou deixar a aba não reinicia os 25 segundos. Após recarregar, a rodada expirada é registrada uma única vez. O diário concluído permanece disponível para consulta; o modo infinito permite continuar jogando.

O histórico do infinito é acumulado nas estatísticas; a partida infinita em andamento vive na sessão e reinicia ao recarregar. Se o armazenamento estiver bloqueado, a interface avisa e permite jogar na sessão atual. Não há sincronização entre dispositivos nem ranking global. Alterar o armazenamento ou relógio do dispositivo pode modificar resultados; este jogo local não implementa competição verificada por servidor.

Não há analytics ou cookies de terceiros. Limpar os dados do navegador remove progresso e preferências. O aplicativo é gratuito; os custos de uma hospedagem escolhida dependem do provedor.

## Referência

O site de referência retornou HTTP 403 durante a implementação. As regras foram implementadas a partir da descrição fornecida, sem acesso à interface original para comparação visual ou tradução literal. Todos os textos visíveis desta implementação estão em português.

## Licença

MIT para o código e as ilustrações originais deste repositório. Krillion e seus conteúdos originais pertencem aos respectivos titulares; este projeto não é afiliado ao jogo original.
