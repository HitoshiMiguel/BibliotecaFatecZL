import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
// Importamos o ícone novo de Download (Nuvem)
import { BsCheckCircleFill, BsClockHistory, BsXCircleFill, BsCloudArrowDownFill } from 'react-icons/bs';

const API_URL = 'http://localhost:4000/api/publicacoes/minhas-estatisticas';

export default function DashboardStats() {
  const [data, setData] = useState([]);
  
  // Adicionamos 'downloads' no estado
  const [counts, setCounts] = useState({ aprovados: 0, pendentes: 0, rejeitados: 0, downloads: 0 });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
        if (json.ok) {
          const formattedData = json.data.map(item => ({
            name: item.titulo,
            media: Number(item.media_nota),
            votos: item.total_avaliacoes
          }));
          setData(formattedData);
          
          setCounts({
            aprovados: json.meta?.totalAprovados || 0,
            pendentes: json.meta?.totalPendentes || 0,
            rejeitados: json.meta?.totalRejeitados || 0,
            downloads: json.meta?.totalDownloads || 0 // Pega do backend
          });
        } else {
          setError('Falha ao carregar dados');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Não foi possível carregar as estatísticas.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
      Carregando painel...
    </div>
  );

  if (error) return (
    <div style={{ 
      padding: '20px', color: '#dc2626', backgroundColor: '#fee2e2', borderRadius: '8px', textAlign: 'center' 
    }}>
      {error}
    </div>
  );

  // Estilos reutilizáveis
  const containerStyle = {
    backgroundColor: '#fff', 
    borderRadius: '12px', 
    padding: '24px', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
    border: '1px solid #e5e7eb'
  };

  const titleStyle = {
    fontSize: '1.25rem', fontWeight: 'bold', color: '#374151', marginBottom: '20px', 
    borderBottom: '1px solid #eee', paddingBottom: '10px'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'sans-serif', width: '100%' }}>
      
      {/* BLOCO 1: MINHAS SUBMISSÕES */}
      <div style={containerStyle}>
        <h2 style={titleStyle}>Minhas Submissões</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          
          {/* Card Aprovados */}
          <div style={{ 
            borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', color: '#15803d' 
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: '700', opacity: 0.8 }}>
                Aprovadas
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 }}>
                {counts.aprovados}
              </div>
            </div>
            <BsCheckCircleFill size={36} opacity={0.6} />
          </div>

          {/* Card Pendentes */}
          <div style={{ 
            borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #fde047', backgroundColor: '#fefce8', color: '#a16207' 
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: '700', opacity: 0.8 }}>
                Pendentes
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 }}>
                {counts.pendentes}
              </div>
            </div>
            <BsClockHistory size={36} opacity={0.6} />
          </div>

          {/* Card Rejeitados */}
          <div style={{ 
            borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#b91c1c' 
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: '700', opacity: 0.8 }}>
                Rejeitadas
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 }}>
                {counts.rejeitados}
              </div>
            </div>
            <BsXCircleFill size={36} opacity={0.6} />
          </div>

          {/* Card Downloads (AZUL - NOVO) */}
          <div style={{ 
            borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d4ed8' 
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: '700', opacity: 0.8 }}>
                Acessos Total
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 }}>
                {counts.downloads}
              </div>
            </div>
            <BsCloudArrowDownFill size={36} opacity={0.6} />
          </div>

        </div>
      </div>

      {/* BLOCO 2: AVALIAÇÕES RECEBIDAS */}
      {data.length > 0 ? (
        <div style={containerStyle}>
          <h2 style={titleStyle}>
            Avaliações Recebidas
          </h2>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  tick={{fontSize: 13, fill: '#4b5563'}} 
                />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div style={{
                          backgroundColor: '#fff', 
                          padding: '12px', 
                          border: '1px solid #e5e7eb', 
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
                          borderRadius: '8px'
                        }}>
                          <p style={{fontWeight: 'bold', marginBottom: '4px', color: '#1f2937'}}>{d.name}</p>
                          <p style={{color: '#ca8a04', fontWeight: 'bold'}}>★ {d.media.toFixed(1)}</p>
                          <p style={{fontSize: '12px', color: '#6b7280'}}>{d.votos} avaliações</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="media" barSize={28} radius={[0, 6, 6, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.media >= 4 ? '#22c55e' : entry.media >= 2.5 ? '#eab308' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div style={{ ...containerStyle, textAlign: 'center', color: '#9ca3af', backgroundColor: '#f9fafb' }}>
          O gráfico de desempenho aparecerá aqui quando suas submissões receberem avaliações.
        </div>
      )}
    </div>
  );
}