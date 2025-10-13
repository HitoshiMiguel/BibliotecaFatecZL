// Arquivo: src/app/teste/page.jsx

export default function TestePage() {
  return (
    // Esta div com altura gigante é só para forçar a barra de rolagem
    <div style={{ height: '3000px', padding: '40px' }}>
      <h1>Página de Teste</h1>
      <p>Role para baixo para ver se o header fica fixo no topo.</p>
    </div>
  );
}