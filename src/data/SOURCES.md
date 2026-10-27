# Curadoria do catálogo — versão 2

Critério: perguntas abertas do cotidiano, com pontos de entrada familiares. A dificuldade deve estar em lembrar uma resposta menos comum. Não usar perguntas sobre conjuntos pequenos ou conhecimento especializado (fases da Lua, musas, aminoácidos etc.).

O catálogo tem **27 perguntas**, com **100 a 5.289 respostas por pergunta** e **10.211 respostas cadastradas no total**. Essa soma conta entradas por pergunta: uma mesma resposta pode caber em mais de uma pergunta. Os 6.752 aliases são contados separadamente e não aumentam o número mostrado ao jogador.

## Referência de formato

Consultados em 26/10/2026:

- [Perguntas diárias públicas de Krillion](https://krillion.io/api/today): entre os exemplos observados estavam pratos latino-americanos, coisas expressas como porcentagem e configurações do celular que podem ser ligadas ou desligadas.
- [FAQ de Krillion](https://krillion.io/faq): descreve reunir fontes amplas, aceitar aliases e trabalhar com perguntas que podem ter milhares de respostas. A própria FAQ reconhece possíveis omissões de respostas válidas.

Os enunciados, grupos de respostas e raridades aqui foram elaborados para o português e o repertório brasileiro. Não foram copiados os bancos de respostas, pesos ou ilustrações do original. A raridade continua sendo uma estimativa editorial fixa, informada na interface.

## Municípios brasileiros

`cities-br.json` deriva do arquivo [csv/municipios.csv](https://github.com/kelvins/municipios-brasileiros/blob/503e2f70bbf1b4b7ec0b1f68b09086ccc38fe861/csv/municipios.csv) do projeto **kelvins/municipios-brasileiros**, revisão `503e2f70bbf1b4b7ec0b1f68b09086ccc38fe861`, sob licença MIT. Uma cópia da licença e do aviso de copyright está em `public/licenses/municipios-brasileiros-MIT.txt` e acompanha o build.

Transformação aplicada: extrair os nomes e os códigos de UF dos 5.571 registros; agrupar nomes que ficam iguais após remover acentos e pontuação; preservar as UFs de cada nome. Resultado: 5.289 nomes aceitos, incluindo Brasília. Localidades homônimas não são contadas várias vezes na mesma pergunta. Coordenadas e outros campos não foram incorporados.

As formas `nome + UF` são aliases, exceto quando colidem com outro nome: `Aracatu BA` não pode roubar `Araçatuba`, nem `POA` substituir `Poá`. Esses casos têm testes de regressão. Os apelidos locais são explícitos, como `Sampa`, `BH`, `Floripa` e `Rio`.

Os escores das cidades não são estatísticas de população. Capitais e destinos conhecidos receberam grupos de familiaridade editorial; os demais nomes usam uma faixa editorial comum. A fonte de municípios não fornece raridade.

## Outros temas

`countries.json` e os módulos `geography`, `nature`, `everyday` e `culture` contêm listas curadas manualmente. Países constituintes e territórios são explicitamente aceitos no enunciado correspondente. Comidas, frutas e outros termos usam nomes populares e variantes regionais; não exigem nomenclatura científica.

Os conjuntos são amplos, mas não se apresentam como exaustivos. A busca de respostas após cada rodada mostra o que é reconhecido e informa que ainda pode faltar uma resposta válida. Somente nomes e aliases registrados são aceitos: a normalização não inventa correspondências aproximadas.

## Manutenção

- Toda pergunta deve oferecer pelo menos 80 respostas distintas e pelo menos dez entradas de familiaridade alta. O catálogo atual supera esse piso em todas as perguntas.
- Incluir respostas óbvias e variantes comuns antes das raras. Os testes incluem cinco respostas familiares para cada pergunta.
- Sinônimos não viram opções extras. Manter um nome canônico e aliases e testar colisões de normalização.
- Cada pergunta precisa ter ao menos uma resposta com pontuação de 1.000 m.
- O diário usa os quatro assuntos, com no máximo duas perguntas de cada um.
- Alterações incompatíveis no catálogo exigem uma nova versão de sessão. A versão 2 usa `krilion.daily.v2:`; os dados da versão 1 e as estatísticas gerais permanecem no navegador.
