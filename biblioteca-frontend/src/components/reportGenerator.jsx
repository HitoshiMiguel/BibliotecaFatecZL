import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- HELPER FUNCTIONS ---
const getDataAtual = () => {
  return new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('pt-BR');
};

const setupHeader = (doc, title, userName) => {
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${getDataAtual()}`, 14, 28);
  doc.text(`Solicitante: ${userName || 'Administrador'}`, 14, 33);
  
  doc.setDrawColor(200);
  doc.line(14, 38, 196, 38);
};

const setupFooter = (doc) => {
  // CORREÇÃO (getNumberOfPages):
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${totalPages}`, 105, 287, { align: 'center' });
  }
};

const savePDF = (doc, prefix, userName) => {
  const nomeSeguro = userName || 'Visitante';
  const cleanName = String(nomeSeguro).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const dataArquivo = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  doc.save(`${prefix}_${cleanName}_${dataArquivo}.pdf`);
};

// ====================================================================
// 1. RELATÓRIO DO USUÁRIO COMUM (Mantido Igual)
// ====================================================================
export const generateUserReport = (userStats, chartData, listaCompleta, userName) => {
  const listaSegura = Array.isArray(listaCompleta) ? listaCompleta : [];
  const doc = new jsPDF('p', 'mm', 'a4');

  setupHeader(doc, "Relatório de Estatísticas", userName);

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Resumo Quantitativo", 14, 48);

  const qtdAprovados = listaSegura.filter(i => String(i.status||'').toLowerCase() === 'aprovado').length;
  const qtdPendentes = listaSegura.filter(i => String(i.status||'').toLowerCase() === 'pendente').length;
  const qtdRejeitados = listaSegura.filter(i => String(i.status||'').toLowerCase() === 'rejeitado').length;

  const resumoData = [
    ['Aprovadas', qtdAprovados], 
    ['Pendentes', qtdPendentes],
    ['Rejeitadas', qtdRejeitados],
    ['Total de Acessos', userStats.downloads || userStats.acessos || 0],
  ];

  autoTable(doc, {
    startY: 53,
    head: [['Categoria', 'Quantidade']],
    body: resumoData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 40, halign: 'center' } },
    margin: { left: 14 }
  });

  let finalY = doc['lastAutoTable']?.finalY || 60; 

  const criarTabelaDetalhada = (titulo, statusFiltro, corHeader) => {
    const itens = listaSegura.filter(item => {
      const statusItem = String(item.status || '').toLowerCase().trim();
      return statusItem === statusFiltro;
    });

    if (itens.length === 0) return; 

    if (finalY > 240) { doc.addPage(); finalY = 20; }

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`${titulo} (${itens.length})`, 14, finalY + 15);

    const body = itens.map(item => [
      item.titulo_proposto || item.titulo || 'Sem título',
      item.tipo ? item.tipo.toUpperCase() : 'OUTRO',
      formatDate(item.data_submissao || item.data_publicacao || new Date())
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Título da Obra', 'Tipo', 'Data']],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: corHeader, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 30, halign: 'center' }, 2: { cellWidth: 40, halign: 'center' } },
      margin: { left: 14 }
    });

    finalY = doc['lastAutoTable']?.finalY || finalY;
  };

  criarTabelaDetalhada("Itens Pendentes", "pendente", [241, 196, 15]);
  criarTabelaDetalhada("Itens Publicados/Aprovados", "aprovado", [39, 174, 96]);
  criarTabelaDetalhada("Itens Rejeitados", "rejeitado", [192, 57, 43]);

  if (chartData && chartData.length > 0) {
    if (finalY > 240) { doc.addPage(); finalY = 20; }
    doc.setFontSize(14);
    doc.text("Detalhamento das Notas (Aprovados)", 14, finalY + 15);
    const avaliacoesBody = chartData.map(item => [item.name || item.label, item.media || item.value]);
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Trabalho', 'Nota Média']],
      body: avaliacoesBody,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80] },
      margin: { left: 14 }
    });
  }

  setupFooter(doc);
  savePDF(doc, 'relatorio_usuario', userName);
};

// ====================================================================
// 2. RELATÓRIO DE ADMIN (NOVO)
// ====================================================================
export const generateAdminReport = (dataRaw, userName) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Header Padrão
  setupHeader(doc, "Relatório Gerencial - Painel Admin", userName);

  let finalY = 45;

  // --- SEÇÃO 1: USUÁRIOS ---
  if (dataRaw?.users) {
    const u = dataRaw.users;
    const totalUsers = (Number(u.ativos)||0) + (Number(u.inativos)||0) + (Number(u.bloqueados)||0);
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Panorama de Usuários (Total: ${totalUsers})`, 14, finalY);

    const userBody = [
      ['Usuários Ativos', u.ativos || 0],
      ['Usuários Inativos', u.inativos || 0],
      ['Usuários Bloqueados', u.bloqueados || 0]
    ];

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Status', 'Quantidade']],
      body: userBody,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }, // Verde Esmeralda
      margin: { left: 14 }
    });
    finalY = doc['lastAutoTable']?.finalY || finalY + 40;
  }

  // --- SEÇÃO 2: RESERVAS ---
  if (dataRaw?.reservations) {
    const r = dataRaw.reservations;
    const totalRes = (Number(r.ativas)||0) + (Number(r.pendentes)||0) + (Number(r.concluidas)||0) + (Number(r.canceladas)||0);

    if (finalY > 230) { doc.addPage(); finalY = 20; }
    
    doc.setFontSize(14);
    doc.text(`Panorama de Reservas (Total: ${totalRes})`, 14, finalY + 15);

    const resBody = [
      ['Ativas (Em andamento)', r.ativas || 0],
      ['Pendentes', r.pendentes || 0],
      ['Concluídas', r.concluidas || 0],
      ['Canceladas', r.canceladas || 0]
    ];

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Status da Reserva', 'Quantidade']],
      body: resBody,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }, // Azul
      margin: { left: 14 }
    });
    finalY = doc['lastAutoTable']?.finalY || finalY + 40;
  }

  // --- SEÇÃO 3: ACERVO ---
  if (dataRaw?.acervo) {
    const a = dataRaw.acervo;
    const totalAcervo = (Number(a.livrosFisicos)||0) + (Number(a.itensDigitais)||0);

    if (finalY > 230) { doc.addPage(); finalY = 20; }

    doc.setFontSize(14);
    doc.text(`Composição do Acervo (Total: ${totalAcervo})`, 14, finalY + 15);

    const acervoBody = [
      ['Livros Físicos', a.livrosFisicos || 0],
      ['Itens Digitais', a.itensDigitais || 0]
    ];

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Tipo de Item', 'Quantidade']],
      body: acervoBody,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
      
      // MUDANÇA AQUI:
      styles: { 
        textColor: 50 
      },
      
      margin: { left: 14 }
    });
  }

  setupFooter(doc);
  savePDF(doc, 'relatorio_gerencial_admin', userName);
};