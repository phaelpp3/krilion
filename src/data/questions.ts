export type CategoryId = 'todos' | 'geografia' | 'ciencia' | 'cultura' | 'natureza';

export interface Answer {
  label: string;
  aliases?: string[];
  /** Estimativa editorial entre 0 e 1, não uma frequência medida de jogadores. */
  rarity: number;
}

export interface Question {
  id: string;
  category: Exclude<CategoryId, 'todos'>;
  prompt: string;
  hint: string;
  answers: Answer[];
}

export const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: 'todos', label: 'Todos os assuntos', icon: '✦' },
  { id: 'geografia', label: 'Geografia', icon: '🌎' },
  { id: 'ciencia', label: 'Ciência', icon: '⚛' },
  { id: 'cultura', label: 'Cultura', icon: '🎭' },
  { id: 'natureza', label: 'Natureza', icon: '🌿' },
];

type Entry = [label: string, rarity: number, ...aliases: string[]];
const answers = (entries: Entry[]): Answer[] => entries.map(([label, rarity, ...aliases]) => ({ label, rarity, aliases }));

// Catálogo autoral em português. Os enunciados delimitam conjuntos finitos.
// As raridades são estimativas editoriais, jamais estatísticas de uma comunidade.
// IDs estáveis identificam os desafios salvos. Mudanças na seleção exigem nova versão da chave do motor.
export const QUESTIONS: Question[] = [
  {
    id: 'geo-brasil-ufs', category: 'geografia',
    prompt: 'Diga uma unidade federativa do Brasil.',
    hint: 'Valem os 26 estados e o Distrito Federal. Siglas também são aceitas.',
    answers: answers([
      ['São Paulo', .08, 'SP'], ['Rio de Janeiro', .12, 'RJ'], ['Minas Gerais', .18, 'MG'],
      ['Bahia', .22, 'BA'], ['Paraná', .3, 'PR'], ['Rio Grande do Sul', .26, 'RS'],
      ['Pernambuco', .35, 'PE'], ['Ceará', .32, 'CE'], ['Santa Catarina', .38, 'SC'],
      ['Goiás', .45, 'GO'], ['Pará', .44, 'PA'], ['Espírito Santo', .6, 'ES'],
      ['Maranhão', .55, 'MA'], ['Amazonas', .42, 'AM'], ['Mato Grosso', .58, 'MT'],
      ['Mato Grosso do Sul', .68, 'MS'], ['Paraíba', .62, 'PB'], ['Rio Grande do Norte', .64, 'RN'],
      ['Piauí', .75, 'PI'], ['Alagoas', .7, 'AL'], ['Sergipe', .81, 'SE'],
      ['Tocantins', .86, 'TO'], ['Rondônia', .88, 'RO'], ['Acre', .7, 'AC'],
      ['Amapá', .94, 'AP'], ['Roraima', 1, 'RR'], ['Distrito Federal', .72, 'DF'],
    ]),
  },
  {
    id: 'geo-america-sul', category: 'geografia',
    prompt: 'Diga um país soberano da América do Sul.',
    hint: 'São 12 países. Territórios, como a Guiana Francesa, não entram.',
    answers: answers([
      ['Brasil', .05], ['Argentina', .15], ['Chile', .25], ['Uruguai', .3], ['Paraguai', .4],
      ['Peru', .42], ['Colômbia', .38], ['Venezuela', .48], ['Bolívia', .55], ['Equador', .66],
      ['Guiana', .9, 'Guyana'], ['Suriname', 1, 'Surinam'],
    ]),
  },
  {
    id: 'geo-capitais-sul', category: 'geografia',
    prompt: 'Diga a capital de um país da América do Sul.',
    hint: 'Para a Bolívia, valem a capital constitucional e a sede do governo.',
    answers: answers([
      ['Brasília', .08], ['Buenos Aires', .16], ['Santiago', .3], ['Montevidéu', .4, 'Montevideo'],
      ['Assunção', .52, 'Asunción'], ['Lima', .35], ['Bogotá', .4], ['Caracas', .55],
      ['Quito', .65], ['Sucre', .93], ['La Paz', .7], ['Georgetown', .96], ['Paramaribo', 1],
    ]),
  },
  {
    id: 'geo-uniao-europeia', category: 'geografia',
    prompt: 'Diga um dos 27 países da União Europeia.',
    hint: 'Considere os membros desde 2020. Reino Unido, Noruega e Suíça não fazem parte.',
    answers: answers([
      ['Alemanha', .1], ['França', .08], ['Itália', .14], ['Espanha', .18], ['Portugal', .2],
      ['Áustria', .48], ['Bélgica', .42], ['Bulgária', .7], ['Chipre', .92], ['Croácia', .68],
      ['Dinamarca', .45], ['Eslováquia', .85], ['Eslovênia', .88], ['Estônia', .91],
      ['Finlândia', .58], ['Grécia', .32], ['Hungria', .65], ['Irlanda', .52],
      ['Letônia', .95], ['Lituânia', .9], ['Luxemburgo', .86], ['Malta', 1],
      ['Países Baixos', .4, 'Holanda'], ['Polônia', .5], ['Tchéquia', .72, 'República Tcheca', 'Chéquia'],
      ['Romênia', .76, 'Roménia'], ['Suécia', .38],
    ]),
  },
  {
    id: 'geo-cplp', category: 'geografia',
    prompt: 'Diga um país membro da CPLP.',
    hint: 'São os nove membros plenos da Comunidade dos Países de Língua Portuguesa.',
    answers: answers([
      ['Brasil', .06], ['Portugal', .12], ['Angola', .35], ['Moçambique', .45],
      ['Cabo Verde', .6], ['Guiné-Bissau', .78, 'Guiné Bissau'],
      ['São Tomé e Príncipe', .9, 'São Tomé'], ['Timor-Leste', .86, 'Timor Leste'],
      ['Guiné Equatorial', 1],
    ]),
  },
  {
    id: 'geo-nordeste', category: 'geografia',
    prompt: 'Diga um estado do Nordeste brasileiro.',
    hint: 'A região tem nove estados. Você também pode usar a sigla.',
    answers: answers([
      ['Bahia', .08, 'BA'], ['Pernambuco', .2, 'PE'], ['Ceará', .28, 'CE'],
      ['Maranhão', .55, 'MA'], ['Paraíba', .6, 'PB'], ['Rio Grande do Norte', .65, 'RN'],
      ['Alagoas', .75, 'AL'], ['Piauí', .9, 'PI'], ['Sergipe', 1, 'SE'],
    ]),
  },
  {
    id: 'geo-africa-onu', category: 'geografia',
    prompt: 'Diga um país africano membro da ONU.',
    hint: 'São 54 países. Valem nomes em português e suas formas mais conhecidas.',
    answers: answers([
      ['África do Sul', .08], ['Egito', .1], ['Angola', .15], ['Marrocos', .24], ['Nigéria', .28],
      ['Quênia', .3, 'Quénia'], ['Moçambique', .25], ['Argélia', .35], ['Tunísia', .4], ['Líbia', .48],
      ['Etiópia', .4], ['Gana', .38], ['Senegal', .45], ['Camarões', .45], ['Costa do Marfim', .5],
      ['Madagascar', .4], ['Cabo Verde', .55], ['Guiné-Bissau', .65], ['Guiné Equatorial', .84],
      ['São Tomé e Príncipe', .88, 'São Tomé'], ['Sudão', .6], ['Sudão do Sul', .8],
      ['República Democrática do Congo', .62, 'RDC', 'Congo-Kinshasa'],
      ['República do Congo', .72, 'Congo', 'Congo-Brazzaville'], ['Ruanda', .66], ['Uganda', .68],
      ['Tanzânia', .58], ['Zâmbia', .67], ['Zimbábue', .65, 'Zimbabwe', 'Zimbabué'],
      ['Namíbia', .66], ['Botsuana', .78, 'Botswana'], ['Maláui', .86, 'Malawi', 'Malaui'],
      ['Lesoto', .96, 'Lesotho'], ['Essuatíni', 1, 'Eswatini', 'Suazilândia'],
      ['Maurício', .86, 'Maurícia', 'Ilhas Maurício', 'Mauritius'], ['Seicheles', .9, 'Seychelles'],
      ['Comores', .98, 'Comoros'], ['Djibuti', .95, 'Djibouti'], ['Eritreia', .93],
      ['Somália', .6], ['Chade', .75], ['Níger', .73], ['Mali', .67], ['Burkina Faso', .85],
      ['Benim', .88, 'Benin'], ['Togo', .84], ['Guiné', .82, 'Guiné-Conacri'],
      ['Libéria', .78], ['Serra Leoa', .82], ['Gâmbia', .91], ['Mauritânia', .88],
      ['Gabão', .81], ['República Centro-Africana', .96, 'República Centro Africana'], ['Burundi', .97],
    ]),
  },
  {
    id: 'geo-america-central', category: 'geografia',
    prompt: 'Diga um país da América Central continental.',
    hint: 'São os sete países entre o México e a Colômbia. Ilhas do Caribe não entram.',
    answers: answers([
      ['Panamá', .15], ['Costa Rica', .25], ['Guatemala', .48], ['Honduras', .55],
      ['El Salvador', .66, 'Salvador'], ['Nicarágua', .75], ['Belize', 1],
    ]),
  },
  {
    id: 'ciencia-elementos-30', category: 'ciencia',
    prompt: 'Diga um dos primeiros 30 elementos químicos.',
    hint: 'Número atômico de 1 a 30: do hidrogênio ao zinco. Símbolos também valem.',
    answers: answers([
      ['Hidrogênio', .1, 'H'], ['Hélio', .25, 'He'], ['Lítio', .5, 'Li'], ['Berílio', .95, 'Be'],
      ['Boro', .8, 'B'], ['Carbono', .12, 'C'], ['Nitrogênio', .25, 'N', 'Azoto'], ['Oxigênio', .08, 'O'],
      ['Flúor', .45, 'F'], ['Neônio', .68, 'Ne', 'Néon'], ['Sódio', .32, 'Na'], ['Magnésio', .42, 'Mg'],
      ['Alumínio', .28, 'Al'], ['Silício', .48, 'Si'], ['Fósforo', .46, 'P'], ['Enxofre', .5, 'S'],
      ['Cloro', .4, 'Cl'], ['Argônio', .8, 'Ar', 'Árgon'], ['Potássio', .38, 'K'], ['Cálcio', .3, 'Ca'],
      ['Escândio', 1, 'Sc'], ['Titânio', .65, 'Ti'], ['Vanádio', .98, 'V'], ['Cromo', .7, 'Cr', 'Crômio'],
      ['Manganês', .84, 'Mn'], ['Ferro', .18, 'Fe'], ['Cobalto', .78, 'Co'], ['Níquel', .62, 'Ni'],
      ['Cobre', .28, 'Cu'], ['Zinco', .45, 'Zn'],
    ]),
  },
  {
    id: 'ciencia-planetas', category: 'ciencia',
    prompt: 'Diga um dos oito planetas do Sistema Solar.',
    hint: 'Use a classificação atual: planetas anões, como Plutão, não entram.',
    answers: answers([
      ['Terra', .06], ['Marte', .12], ['Júpiter', .28], ['Saturno', .35], ['Vênus', .5],
      ['Mercúrio', .68], ['Urano', .85], ['Netuno', 1, 'Neptuno'],
    ]),
  },
  {
    id: 'ciencia-unidades-si', category: 'ciencia',
    prompt: 'Diga uma das sete unidades de base do SI.',
    hint: 'Valem o nome e o símbolo. Unidades derivadas, como newton, não entram.',
    answers: answers([
      ['Metro', .15, 'm'], ['Quilograma', .28, 'kg', 'Kilograma'], ['Segundo', .22, 's'],
      ['Ampere', .62, 'A', 'Ampère'], ['Kelvin', .6, 'K'], ['Mol', .82], ['Candela', 1, 'cd'],
    ]),
  },
  {
    id: 'ciencia-grandezas-si', category: 'ciencia',
    prompt: 'Diga uma das sete grandezas de base do SI.',
    hint: 'Uma grandeza é aquilo que se mede, como comprimento. Não digite a unidade.',
    answers: answers([
      ['Comprimento', .15], ['Massa', .22], ['Tempo', .12],
      ['Corrente elétrica', .6, 'Intensidade da corrente elétrica', 'Corrente'],
      ['Temperatura termodinâmica', .55, 'Temperatura'],
      ['Quantidade de substância', .9, 'Quantidade de matéria'], ['Intensidade luminosa', 1],
    ]),
  },
  {
    id: 'ciencia-aminoacidos', category: 'ciencia',
    prompt: 'Diga um dos 20 aminoácidos padrão das proteínas.',
    hint: 'Valem nomes em português ou abreviações de três letras. Selenocisteína e pirrolisina ficam fora deste grupo de 20.',
    answers: answers([
      ['Alanina', .45, 'Ala'], ['Arginina', .4, 'Arg'], ['Asparagina', .85, 'Asn'],
      ['Ácido aspártico', .8, 'Aspartato', 'Asp'], ['Cisteína', .65, 'Cys'],
      ['Glutamina', .18, 'Gln'], ['Ácido glutâmico', .5, 'Glutamato', 'Glu'], ['Glicina', .25, 'Gly'],
      ['Histidina', .82, 'His'], ['Isoleucina', .68, 'Ile'], ['Leucina', .35, 'Leu'], ['Lisina', .5, 'Lys'],
      ['Metionina', .75, 'Met'], ['Fenilalanina', .58, 'Phe'], ['Prolina', .7, 'Pro'],
      ['Serina', .72, 'Ser'], ['Treonina', 1, 'Thr'], ['Triptofano', .2, 'Trp'],
      ['Tirosina', .62, 'Tyr'], ['Valina', .56, 'Val'],
    ]),
  },
  {
    id: 'ciencia-espectro', category: 'ciencia',
    prompt: 'Diga uma das sete faixas tradicionais do espectro eletromagnético.',
    hint: 'Pense em tipos de radiação, das ondas de rádio aos raios gama.',
    answers: answers([
      ['Ondas de rádio', .28, 'Rádio', 'Radiofrequência'], ['Micro-ondas', .4, 'Microondas'],
      ['Infravermelho', .5, 'Radiação infravermelha'], ['Luz visível', .2, 'Visível'],
      ['Ultravioleta', .55, 'Radiação ultravioleta', 'UV'], ['Raios X', .35, 'Raio X'],
      ['Raios gama', 1, 'Raio gama', 'Gama'],
    ]),
  },
  {
    id: 'ciencia-grupo-18', category: 'ciencia',
    prompt: 'Diga um elemento do grupo 18 da tabela periódica.',
    hint: 'É a coluna dos gases nobres. O elemento sintético 118 também vale. Símbolos são aceitos.',
    answers: answers([
      ['Hélio', .1, 'He'], ['Neônio', .3, 'Ne', 'Néon'], ['Argônio', .45, 'Ar', 'Árgon'],
      ['Criptônio', .65, 'Kr', 'Crípton'], ['Xenônio', .72, 'Xe', 'Xénon'],
      ['Radônio', .86, 'Rn', 'Rádon'], ['Oganessônio', 1, 'Og', 'Oganesson', 'Oganessão'],
    ]),
  },
  {
    id: 'ciencia-mudancas-estado', category: 'ciencia',
    prompt: 'Diga uma mudança entre os estados sólido, líquido e gasoso.',
    hint: 'Valem as seis transições e nomes usuais de suas modalidades, como evaporação.',
    answers: answers([
      ['Fusão', .22, 'Derretimento'], ['Solidificação', .32, 'Congelamento'],
      ['Vaporização', .15, 'Evaporação', 'Ebulição', 'Calefação'],
      ['Condensação', .48, 'Liquefação'], ['Sublimação', .8],
      ['Ressublimação', 1, 'Deposição', 'Sublimação inversa', 'Desublimação'],
    ]),
  },
  {
    id: 'cultura-alfabeto-grego', category: 'cultura',
    prompt: 'Diga o nome de uma das 24 letras do alfabeto grego.',
    hint: 'Escreva o nome em português ou use o símbolo grego.',
    answers: answers([
      ['Alfa', .08, 'Alpha', 'α'], ['Beta', .12, 'β'], ['Gama', .22, 'Gamma', 'γ'], ['Delta', .2, 'δ'],
      ['Épsilon', .6, 'Epsilon', 'ε'], ['Zeta', .7, 'ζ'], ['Eta', .85, 'η'], ['Teta', .65, 'Theta', 'θ'],
      ['Iota', .7, 'ι'], ['Capa', .7, 'Kappa', 'κ'], ['Lambda', .55, 'Lâmbda', 'λ'],
      ['Mi', .84, 'Mu', 'μ'], ['Ni', .95, 'Nu', 'ν'], ['Csi', 1, 'Xi', 'ξ'],
      ['Ômicron', .5, 'Omicron', 'ο'], ['Pi', .15, 'π'], ['Rô', .88, 'Rho', 'ρ'],
      ['Sigma', .3, 'σ', 'ς'], ['Tau', .68, 'τ'], ['Ípsilon', .75, 'Upsilon', 'υ'],
      ['Fi', .5, 'Phi', 'φ'], ['Qui', .9, 'Chi', 'χ'], ['Psi', .6, 'ψ'], ['Ômega', .25, 'Omega', 'ω'],
    ]),
  },
  {
    id: 'cultura-notas', category: 'cultura',
    prompt: 'Diga uma das sete notas musicais naturais.',
    hint: 'Use o nome da nota ou a cifra. Sustenidos e bemóis não entram.',
    answers: answers([
      ['Dó', .1, 'C', 'Ut'], ['Ré', .35, 'D'], ['Mi', .45, 'E'], ['Fá', .65, 'F'],
      ['Sol', .2, 'G'], ['Lá', .6, 'A'], ['Si', 1, 'B', 'Ti'],
    ]),
  },
  {
    id: 'cultura-harry-potter', category: 'cultura',
    prompt: 'Diga o título de um dos sete livros principais de Harry Potter.',
    hint: 'Pode omitir “Harry Potter e”. Peças de teatro e livros extras não entram.',
    answers: answers([
      ['A Pedra Filosofal', .12, 'Pedra Filosofal', 'Harry Potter e a Pedra Filosofal'],
      ['A Câmara Secreta', .4, 'Câmara Secreta', 'Harry Potter e a Câmara Secreta'],
      ['O Prisioneiro de Azkaban', .3, 'Prisioneiro de Azkaban', 'Harry Potter e o Prisioneiro de Azkaban'],
      ['O Cálice de Fogo', .5, 'Cálice de Fogo', 'Harry Potter e o Cálice de Fogo'],
      ['A Ordem da Fênix', .75, 'Ordem da Fênix', 'Harry Potter e a Ordem da Fênix'],
      ['O Enigma do Príncipe', 1, 'Enigma do Príncipe', 'Harry Potter e o Enigma do Príncipe', 'O Príncipe Mestiço', 'Príncipe Mestiço'],
      ['As Relíquias da Morte', .62, 'Relíquias da Morte', 'Harry Potter e as Relíquias da Morte'],
    ]),
  },
  {
    id: 'cultura-oscar-2010', category: 'cultura',
    prompt: 'Diga um vencedor do Oscar de melhor filme nas cerimônias de 2010 a 2019.',
    hint: 'Vale o ano da cerimônia, não o lançamento. Títulos em português ou no original são aceitos.',
    answers: answers([
      ['Guerra ao Terror', .8, 'The Hurt Locker'], ['O Discurso do Rei', .55, 'Discurso do Rei', "The King's Speech"],
      ['O Artista', 1, 'Artista', 'The Artist'], ['Argo', .6],
      ['12 Anos de Escravidão', .45, 'Doze Anos de Escravidão', '12 Years a Slave'],
      ['Birdman', .65, 'Birdman ou A Inesperada Virtude da Ignorância'],
      ['Spotlight', .88, 'Spotlight Segredos Revelados'],
      ['Moonlight', .4, 'Moonlight Sob a Luz do Luar'],
      ['A Forma da Água', .35, 'Forma da Água', 'The Shape of Water'],
      ['Green Book', .5, 'Green Book O Guia', 'Green Book Um Guia para a Vida'],
    ]),
  },
  {
    id: 'cultura-maravilhas-antigas', category: 'cultura',
    prompt: 'Diga uma das sete maravilhas do mundo antigo.',
    hint: 'É a lista histórica, que inclui a Grande Pirâmide de Gizé.',
    answers: answers([
      ['Grande Pirâmide de Gizé', .1, 'Pirâmide de Gizé', 'Pirâmides de Gizé', 'Pirâmide de Quéops', 'Pirâmides do Egito'],
      ['Jardins Suspensos da Babilônia', .35, 'Jardins Suspensos', 'Jardins da Babilônia'],
      ['Estátua de Zeus em Olímpia', .65, 'Estátua de Zeus', 'Zeus de Olímpia'],
      ['Templo de Ártemis em Éfeso', .78, 'Templo de Ártemis', 'Templo de Diana'],
      ['Mausoléu de Halicarnasso', 1, 'Mausoléu de Mausolo', 'Mausoléu de Halicarnassus'],
      ['Colosso de Rodes', .6], ['Farol de Alexandria', .45],
    ]),
  },
  {
    id: 'cultura-maravilhas-modernas', category: 'cultura',
    prompt: 'Diga uma das sete novas maravilhas do mundo, eleitas em 2007.',
    hint: 'É a lista da votação New7Wonders. A pirâmide de Gizé recebeu status honorário e não entra nas sete eleitas.',
    answers: answers([
      ['Cristo Redentor', .1, 'Cristo'], ['Muralha da China', .25, 'Grande Muralha', 'Grande Muralha da China'],
      ['Coliseu', .35, 'Coliseu de Roma', 'Colosseum'], ['Taj Mahal', .5, 'Tajmahal'],
      ['Machu Picchu', .45, 'Machu Pichu'], ['Chichén Itzá', .9, 'Chichen Itza'], ['Petra', 1],
    ]),
  },
  {
    id: 'cultura-musas', category: 'cultura',
    prompt: 'Diga uma das nove musas da mitologia grega.',
    hint: 'As nove filhas de Zeus e Mnemósine, associadas às artes e ao conhecimento.',
    answers: answers([
      ['Calíope', .35, 'Calliope'], ['Clio', .18], ['Erato', .65], ['Euterpe', .7],
      ['Melpômene', .85, 'Melpomene'], ['Polímnia', 1, 'Polyhymnia', 'Poliímnia'],
      ['Tália', .4, 'Thalia'], ['Terpsícore', .9, 'Terpsichore'], ['Urânia', .55, 'Urania'],
    ]),
  },
  {
    id: 'cultura-machado-romances', category: 'cultura',
    prompt: 'Diga um dos nove romances de Machado de Assis.',
    hint: 'Valem os romances publicados de Ressurreição a Memorial de Aires. Contos e novelas, como O Alienista, não entram.',
    answers: answers([
      ['Dom Casmurro', .08], ['Memórias Póstumas de Brás Cubas', .2, 'Memórias Póstumas', 'Brás Cubas'],
      ['Quincas Borba', .38], ['Helena', .5], ['Ressurreição', .8],
      ['A Mão e a Luva', .72, 'Mão e a Luva'], ['Iaiá Garcia', 1, 'Yayá Garcia'],
      ['Esaú e Jacó', .9], ['Memorial de Aires', .85],
    ]),
  },
  {
    id: 'natureza-biomas-brasil', category: 'natureza',
    prompt: 'Diga um dos seis biomas continentais do Brasil.',
    hint: 'Use a classificação do IBGE. O sistema costeiro-marinho não faz parte desta lista de seis.',
    answers: answers([
      ['Amazônia', .12, 'Floresta Amazônica'], ['Mata Atlântica', .28], ['Cerrado', .4],
      ['Caatinga', .62], ['Pantanal', .6], ['Pampa', 1, 'Pampas', 'Campos Sulinos'],
    ]),
  },
  {
    id: 'natureza-big-five', category: 'natureza',
    prompt: 'Diga um dos animais dos “Big Five” africanos.',
    hint: 'É o grupo tradicional de cinco grandes animais dos safáris.',
    answers: answers([
      ['Leão', .12], ['Elefante', .25, 'Elefante africano'], ['Rinoceronte', .5, 'Rinoceronte negro'],
      ['Leopardo', .72], ['Búfalo', 1, 'Búfalo africano', 'Búfalo do Cabo'],
    ]),
  },
  {
    id: 'natureza-grupos-plantas', category: 'natureza',
    prompt: 'Diga um dos quatro grandes grupos de plantas da classificação escolar.',
    hint: 'São os grupos tradicionalmente ensinados do musgo às plantas com flores. Digite o grupo, não uma espécie.',
    answers: answers([
      ['Angiospermas', .25, 'Angiosperma'], ['Gimnospermas', .6, 'Gimnosperma'],
      ['Briófitas', .7, 'Briófita'], ['Pteridófitas', 1, 'Pteridófita'],
    ]),
  },
  {
    id: 'natureza-vertebrados', category: 'natureza',
    prompt: 'Diga um dos cinco grupos de vertebrados da classificação escolar.',
    hint: 'Use os cinco grupos tradicionais, como mamíferos. A pergunta não usa a taxonomia cladística moderna.',
    answers: answers([
      ['Mamíferos', .15, 'Mamífero'], ['Aves', .28, 'Ave'], ['Peixes', .38, 'Peixe'],
      ['Répteis', .65, 'Réptil'], ['Anfíbios', 1, 'Anfíbio'],
    ]),
  },
  {
    id: 'natureza-taxonomia', category: 'natureza',
    prompt: 'Diga um dos oito níveis principais da classificação biológica.',
    hint: 'Do domínio à espécie. Subcategorias, como subfamília, não entram.',
    answers: answers([
      ['Domínio', 1], ['Reino', .25], ['Filo', .68, 'Divisão'], ['Classe', .5],
      ['Ordem', .65], ['Família', .4], ['Gênero', .6], ['Espécie', .15],
    ]),
  },
  {
    id: 'natureza-oceanos', category: 'natureza',
    prompt: 'Diga um dos cinco oceanos da Terra.',
    hint: 'Considere a divisão em cinco oceanos, incluindo o Austral.',
    answers: answers([
      ['Atlântico', .12, 'Oceano Atlântico'], ['Pacífico', .2, 'Oceano Pacífico'],
      ['Índico', .55, 'Oceano Índico'], ['Ártico', .8, 'Oceano Ártico', 'Glacial Ártico', 'Oceano Glacial Ártico'],
      ['Austral', 1, 'Oceano Austral', 'Antártico', 'Oceano Antártico', 'Glacial Antártico', 'Oceano Glacial Antártico'],
    ]),
  },
  {
    id: 'natureza-fases-lua', category: 'natureza',
    prompt: 'Diga uma das quatro fases principais da Lua.',
    hint: 'Pense nas quatro fases tradicionais do calendário. Não entram fases intermediárias, como a gibosa.',
    answers: answers([
      ['Lua cheia', .12, 'Cheia'], ['Lua nova', .35, 'Nova'],
      ['Quarto crescente', .65, 'Lua crescente', 'Crescente'], ['Quarto minguante', 1, 'Lua minguante', 'Minguante'],
    ]),
  },
  {
    id: 'natureza-arco-iris', category: 'natureza',
    prompt: 'Diga uma das sete cores tradicionais do arco-íris.',
    hint: 'É a divisão convencional em sete cores, do vermelho ao violeta.',
    answers: answers([
      ['Vermelho', .12], ['Laranja', .4, 'Alaranjado'], ['Amarelo', .25], ['Verde', .35],
      ['Azul', .18], ['Anil', 1, 'Índigo'], ['Violeta', .65, 'Roxo'],
    ]),
  },
];
