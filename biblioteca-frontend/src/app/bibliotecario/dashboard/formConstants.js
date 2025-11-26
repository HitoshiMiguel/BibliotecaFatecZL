export const TIPOS = [
  { label: 'TCC', value: 'tcc' },
  { label: 'Artigo', value: 'artigo' },
  { label: 'Livro', value: 'livro' },
];

export const FIELDS_BY_TYPE = {
  tcc: [
    { name: 'titulo_proposto', label: 'Título', type: 'text', required: true },
    { name: 'autor', label: 'Autor', type: 'text', required: true },
    { name: 'orientador', label: 'Orientador', type: 'text' },
    { name: 'curso', label: 'Curso', type: 'text' },
    { name: 'instituicao', label: 'Instituição', type: 'text' },
    { name: 'ano_defesa', label: 'Ano de Defesa', type: 'number', required: true },
    { name: 'descricao', label: 'Descrição', type: 'textarea' },
  ],
  artigo: [
    { name: 'titulo', label: 'Título', type: 'text', required: true },
    { name: 'autor', label: 'Autor', type: 'text', required: true },
    { name: 'instituicao', label: 'Instituição', type: 'text' }, // ADICIONADO
    { name: 'conferencia', label: 'Conferência', type: 'text' },
    { name: 'periodico', label: 'Periódico', type: 'text' },     // ADICIONADO
    { name: 'ano_publicacao', label: 'Ano de Publicação', type: 'number', required: true },
    { name: 'descricao', label: 'Descrição', type: 'textarea' },
  ],
  livro: [
    { name: 'titulo', label: 'Título', type: 'text', required: true },
    { name: 'autor', label: 'Autor', type: 'text', required: true },
    { name: 'editora', label: 'Editora', type: 'text' },
    { name: 'ano_publicacao', label: 'Ano de Publicação', type: 'number', required: true },
    { name: 'descricao', label: 'Descrição', type: 'textarea' },
  ],
};