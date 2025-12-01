import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { BsCheckCircleFill, BsClockHistory, BsXCircleFill, BsCloudArrowDownFill } from 'react-icons/bs';
import { FaFilePdf } from 'react-icons/fa';
import { generateUserReport } from './reportGenerator'; 

// Ajuste para pegar a URL do ambiente ou fallback
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_URL = `${BASE_URL}/api/publicacoes/minhas-estatisticas`;

export default function DashboardStats({ listaCompleta = [], user }) {
  
  const [chartData, setChartData] = useState([]);
  const [counts, setCounts] = useState({ 
    aprovados: 0, 
    pendentes: 0, 
    rejeitados: 0, 
    downloads: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userName = user?.nome || "Usuário"; 

  // 1. Fetch de Dados Reais (Notas e Acessos)
  useEffect(() => {
    // Se não tiver token/user, talvez nem devesse chamar, mas vamos proteger no catch
    setLoading(true);
    fetch(API_URL, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar estatísticas');
        return res.json();
      })
      .then(json => {
        if (json.ok || json.success) { // Algumas APIs retornam .ok, outras .success
          
          // Formata dados para o gráfico
          const formattedData = (json.data || []).map(item => ({
            name: item.titulo || 'Sem título',
            media: Number(item.media_nota || 0),
            votos: Number(item.total_avaliacoes || 0),
            // Guarda dados extras se precisar no tooltip
            fullData: item 
          }));
          setChartData(formattedData);
          
          // Atualiza contadores (Prioriza dados do backend se existirem, senão calcula da lista)
          // Nota: O backend sabe o total de Downloads, a lista local não.
          const totalAprovadosLocal = listaCompleta.filter(s => s.status?.toLowerCase() === 'aprovado').length;
          const totalPendentesLocal = listaCompleta.filter(s => ['pendente', 'analise'].includes(s.status?.toLowerCase())).length;
          const totalRejeitadosLocal = listaCompleta.filter(s => s.status?.toLowerCase() === 'rejeitado').length;

          setCounts({
            aprovados: json.meta?.totalAprovados ?? totalAprovadosLocal,
            pendentes: json.meta?.totalPendentes ?? totalPendentesLocal,
            rejeitados: json.meta?.totalRejeitados ?? totalRejeitadosLocal,
            downloads: json.meta?.totalDownloads || 0 // Esse só vem do backend
          });
        } else {
          // Se a API não retornar dados estruturados, usamos o fallback local
          throw new Error('Formato inesperado');
        }
      })
      .catch(err => {
        console.error("Erro stats:", err);
        // Fallback: Usa dados da lista local se a API de stats falhar
        const totalAprovados = listaCompleta.filter(s => s.status?.toLowerCase() === 'aprovado').length;
        const totalPendentes = listaCompleta.filter(s => ['pendente', 'analise'].includes(s.status?.toLowerCase())).length;
        const totalRejeitados = listaCompleta.filter(s => s.status?.toLowerCase() === 'rejeitado').length;
        
        setCounts({ aprovados: totalAprovados, pendentes: totalPendentes, rejeitados: totalRejeitados, downloads: 0 });
        setChartData([]); // Sem dados do backend, sem gráfico de notas
      })
      .finally(() => setLoading(false));
  }, [listaCompleta]); // Recarrega se a lista mudar (ex: usuário atualizou algo)

  const handleDownloadPDF = () => {
    if (typeof generateUserReport === 'function') {
      generateUserReport(counts, chartData, listaCompleta, userName);
    } else {
      alert("Erro: Gerador de relatório não encontrado.");
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Carregando estatísticas...</div>;

  // Estilos inline para o componente (mantendo padrão do seu código)
  const containerStyle = { 
    backgroundColor: '#fff', 
    borderRadius: '8px', 
    padding: '25px', 
    border: '1px solid #eee',
    marginBottom: '20px'
  };
  
  const titleStyle = { 
    fontSize: '1.2rem', 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: '25px', 
    borderBottom: '1px solid #f0f0f0', 
    paddingBottom: '10px' 
  };

  return (
    <div style={{ width: '100%', fontFamily: 'sans-serif' }}>
      
      {/* 1. CARDS DE RESUMO */}
      <div style={containerStyle}>
        <h2 style={titleStyle}>Minhas Submissões</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px' 
        }}>
          <CardStat 
            label="Aprovadas" 
            value={counts.aprovados} 
            icon={<BsCheckCircleFill size={32} opacity={0.8}/>} 
            color="#166534" bg="#dcfce7" border="#bbf7d0" 
          />
          <CardStat 
            label="Pendentes" 
            value={counts.pendentes} 
            icon={<BsClockHistory size={32} opacity={0.8}/>} 
            color="#854d0e" bg="#fef9c3" border="#fde047" 
          />
          <CardStat 
            label="Rejeitadas" 
            value={counts.rejeitados} 
            icon={<BsXCircleFill size={32} opacity={0.8}/>} 
            color="#991b1b" bg="#fee2e2" border="#fecaca" 
          />
          <CardStat 
            label="Acessos Totais" 
            value={counts.downloads} 
            icon={<BsCloudArrowDownFill size={32} opacity={0.8}/>} 
            color="#1e40af" bg="#dbeafe" border="#bfdbfe" 
          />
        </div>
      </div>

      {/* 2. GRÁFICO DE AVALIAÇÕES (Recharts Responsivo) */}
      {chartData.length > 0 ? (
        <div style={containerStyle}>
          <h2 style={titleStyle}>Média de Avaliações</h2>
          
          {/* Wrapper com altura fixa é CRUCIAL para o ResponsiveContainer funcionar */}
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="vertical" 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120} 
                  tick={{ fontSize: 12, fill: '#555' }} 
                  tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 15)}...` : val}
                />
                <Tooltip cursor={{fill: '#f9fafb'}} content={<CustomTooltip />} />
                <Bar dataKey="media" barSize={24} radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.media >= 4 ? '#22c55e' : entry.media >= 2.5 ? '#eab308' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div style={{ ...containerStyle, textAlign: 'center', color: '#999', padding: '40px' }}>
          <p>Ainda não há avaliações registradas para exibir no gráfico.</p>
        </div>
      )}

      {/* 3. BOTÃO DE DOWNLOAD CENTRALIZADO */}
      <div style={{ 
        marginTop: '30px', 
        textAlign: 'center', 
        paddingTop: '20px', 
        borderTop: '1px dashed #ddd' 
      }}>
        <button 
          onClick={handleDownloadPDF}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '10px', 
            backgroundColor: '#b20000', 
            color: 'white', 
            padding: '14px 28px', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '1rem',
            boxShadow: '0 4px 6px rgba(178, 0, 0, 0.2)',
            transition: 'transform 0.2s',
            maxWidth: '100%',
            width: 'auto'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <FaFilePdf size={18} /> 
          Baixar Relatório Completo
        </button>
        <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#888' }}>
          Gera um PDF com estatísticas, histórico e lista de obras.
        </p>
      </div>

    </div>
  );
}

// Componente Auxiliar: Card de Estatística
const CardStat = ({ label, value, icon, color, bg, border }) => (
  <div style={{ 
    borderRadius: '8px', 
    padding: '20px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: bg, 
    color: color,
    border: `1px solid ${border}`,
    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
  }}>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '2rem', fontWeight: 'bold', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700', marginTop: '5px', opacity: 0.9 }}>{label}</span>
    </div>
    {icon}
  </div>
);

// Componente Auxiliar: Tooltip Personalizado (com props padrão para evitar erro TS)
const CustomTooltip = ({ active = false, payload = [], label = '' }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '12px', 
        border: '1px solid #ddd', 
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)', 
        borderRadius: '8px' 
      }}>
        <p style={{fontWeight: 'bold', marginBottom: '5px', color: '#333', fontSize: '0.9rem'}}>{d.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <span style={{color: '#666'}}>Média:</span>
          <strong style={{color: d.media >= 4 ? '#166534' : '#ca8a04'}}>★ {d.media.toFixed(1)}</strong>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>
          {d.votos} avaliações recebidas
        </div>
      </div>
    );
  }
  return null;
};