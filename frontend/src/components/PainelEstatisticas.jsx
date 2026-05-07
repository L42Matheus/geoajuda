import { AlertTriangle, Users, Home, Activity } from 'lucide-react'

const NIVEL_COR = { BAIXO: '#00a878', MEDIO: '#f5a623', ALTO: '#e07b3e', CRITICO: '#e03e3e' }
const NIVEL_LABEL = { BAIXO: 'Baixo', MEDIO: 'Médio', ALTO: 'Alto', CRITICO: 'Crítico' }

export default function PainelEstatisticas({ ocorrencias }) {
  const total = ocorrencias.length
  const totalPessoas = ocorrencias.reduce((s, o) => s + (o.pessoasAfetadas || 0), 0)
  const totalFamilias = ocorrencias.reduce((s, o) => s + (o.familiasAfetadas || 0), 0)
  const criticos = ocorrencias.filter(o => o.nivelRisco === 'CRITICO').length

  // Contagem por nível
  const porNivel = ['CRITICO', 'ALTO', 'MEDIO', 'BAIXO'].map(n => ({
    nivel: n,
    count: ocorrencias.filter(o => o.nivelRisco === n).length,
  }))

  // Top municípios
  const porMunicipio = ocorrencias.reduce((acc, o) => {
    acc[o.municipio] = (acc[o.municipio] || 0) + 1
    return acc
  }, {})
  const topMunicipios = Object.entries(porMunicipio)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Cards de totais */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { icon: <AlertTriangle size={18} color="#e03e3e"/>, label: 'Ocorrências', value: total },
          { icon: <Activity size={18} color="#e03e3e"/>, label: 'Críticas', value: criticos },
          { icon: <Users size={18} color="#0053a0"/>, label: 'Pessoas', value: totalPessoas },
          { icon: <Home size={18} color="#0053a0"/>, label: 'Famílias', value: totalFamilias },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{
            background: '#fff', borderRadius: 10, padding: '12px 14px',
            boxShadow: '0 1px 6px rgba(0,83,160,0.08)',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{icon}
              <span style={{ fontSize: '0.75rem', color: '#6b7a9d', fontWeight: 600, textTransform: 'uppercase' }}>
                {label}
              </span>
            </div>
            <span style={{ fontSize: '1.6rem', fontFamily: 'Syne', fontWeight: 800 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Por nível de risco */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,83,160,0.08)' }}>
        <h3 style={{ fontSize: '0.82rem', color: '#6b7a9d', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
          Por Nível de Risco
        </h3>
        {porNivel.map(({ nivel, count }) => (
          <div key={nivel} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: NIVEL_COR[nivel] }} />
            <span style={{ flex: 1, fontSize: '0.87rem' }}>{NIVEL_LABEL[nivel]}</span>
            <div style={{ flex: 2, background: '#f4f6fa', borderRadius: 4, height: 7, overflow: 'hidden' }}>
              <div style={{
                width: total ? `${(count / total) * 100}%` : '0%',
                height: '100%', background: NIVEL_COR[nivel], borderRadius: 4,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: 20, textAlign: 'right' }}>{count}</span>
          </div>
        ))}
      </div>

      {/* Top municípios */}
      {topMunicipios.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,83,160,0.08)' }}>
          <h3 style={{ fontSize: '0.82rem', color: '#6b7a9d', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
            Municípios com Ocorrências
          </h3>
          {topMunicipios.map(([municipio, count]) => (
            <div key={municipio} style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f0f2f7',
              fontSize: '0.87rem' }}>
              <span>📍 {municipio}</span>
              <span style={{ fontWeight: 700, color: '#0053a0' }}>{count}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
