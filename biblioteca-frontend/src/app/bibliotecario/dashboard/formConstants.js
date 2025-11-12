export const TIPOS = [
  { value: 'tcc', label: 'TCC' },
  { value: 'artigo', label: 'Artigo' },
  { value: 'livro', label: 'Livro' },
];

export const FIELDS_BY_TYPE = {
  tcc: [
    { name: 'titulo_proposto', label: 'Título', type: 'text', required: true },
    { name: 'autor', label: 'Autor', type: 'text', required: true },
    { name: 'orientador', label: 'Orientador', type: 'text' },
    { name: 'curso', label: 'Curso', type: 'text' },
    { name: 'instituicao', label: 'Instituição', type: 'text' },
    { name: 'ano_defesa', label: 'Ano de Defesa', type: 'number' },
    { name: 'descricao', label: 'Descrição', type: 'textarea' },
  ],
  artigo: [
    { name: 'titulo_proposto', label: 'Título', type: 'text', required: true },
    { name: 'autor', label: 'Autor', type: 'text', required: true },
    { name: 'conferencia', label: 'Conferência', type: 'text' },
    // ... (resto dos campos de artigo) ...
    { name: 'descricao', label: 'Descrição', type: 'textarea' },
  ],
  livro: [
    { name: 'titulo_proposto', label: 'Título', type: 'text', required: true },
    { name: 'autor', label: 'Autor', type: 'text', required: true },
    { name: 'editora', label: 'Editora', type: 'text' },
    // ... (resto dos campos de livro) ...
    { name: 'descricao', label: 'Descrição', type: 'textarea' },
  ],
};