import { useState, useEffect, useCallback } from 'react'
import MapaOcorrencias from './components/MapaOcorrencias'
import FormularioOcorrencia from './components/FormularioOcorrencia'
import PainelEstatisticas from './components/PainelEstatisticas'
import { ocorrenciaService } from './services/api'
import { Plus, RefreshCw, MapPin, BarChart2, AlertTriangle } from 'lucide-react'
import './index.css'

export default function App() {
  const [ocorrencias, setOcorrencias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [locSelecionada, setLocSelecionada] = useState(null)
  const [centroMapa, setCentroMapa] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('mapa')
  const [filtroMunicipio, setFiltroMunicipio] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const dados = await ocorrenciaService.listar(filtroMunicipio || undefined)
      setOcorrencias(dados)
    } catch (e) {
      console.error('Erro ao carregar ocorrências', e)
    } finally {
      setCarregando(false)
    }
  }, [filtroMunicipio])

  useEffect(() => { carregar() }, [carregar])

  const handleMapClick = (latlng) => {
    setLocSelecionada(latlng)
    setMostrarForm(true)
  }

  // Quando o usuário usa "minha localização" dentro do form
  const handleLocCapturada = (coords) => {
    setLocSelecionada(coords)
    setCentroMapa([coords.lat, coords.lng])
  }

  const handleSucesso = () => {
    setMostrarForm(false)
    setLocSelecionada(null)
    carregar()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* ===== HEADER ===== */}
      <header style={{
        background: '#0053a0',
        color: 'white',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 58,
        boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
        zIndex: 1000,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={22} color="#f5a623" />
          <span style={{ fontFamily: 'Syne', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
            GeoAjuda<span style={{ color: '#f5a623' }}> PB</span>
          </span>
          <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.15)', borderRadius: 6,
            padding: '2px 8px', marginLeft: 4 }}>
            MVP v0.2
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={carregar} disabled={carregando}
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '7px 12px',
              display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} style={{ animation: carregando ? 'spin 1s linear infinite' : 'none' }} />
            Atualizar
          </button>
          <button
            className="btn-primary"
            onClick={() => { setMostrarForm(true); setLocSelecionada(null) }}
            style={{ background: '#f5a623', color: '#1a1f36', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Registrar Ocorrência
          </button>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar esquerda */}
        <aside style={{
          width: 300, flexShrink: 0,
          background: 'var(--cinza-bg)',
          borderRight: '1.5px solid var(--cinza-borda)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Abas */}
          <div style={{ display: 'flex', borderBottom: '1.5px solid var(--cinza-borda)', background: '#fff' }}>
            {[
              { id: 'mapa', label: 'Mapa', icon: <MapPin size={14}/> },
              { id: 'stats', label: 'Painel', icon: <BarChart2 size={14}/> },
            ].map(aba => (
              <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
                style={{
                  flex: 1, border: 'none', borderRadius: 0,
                  background: abaAtiva === aba.id ? '#fff' : '#f4f6fa',
                  color: abaAtiva === aba.id ? '#0053a0' : '#6b7a9d',
                  borderBottom: abaAtiva === aba.id ? '2.5px solid #0053a0' : '2.5px solid transparent',
                  padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 6, fontWeight: abaAtiva === aba.id ? 700 : 500,
                }}>
                {aba.icon} {aba.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {abaAtiva === 'mapa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label>Filtrar por município</label>
                  <input
                    value={filtroMunicipio}
                    onChange={e => setFiltroMunicipio(e.target.value)}
                    placeholder="Ex: Campina Grande"
                  />
                </div>

                <div style={{ background: '#e8f4ff', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: '0.82rem', color: '#0053a0', fontWeight: 600, marginBottom: 4 }}>
                    📍 Como registrar
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#3a5fa0', lineHeight: 1.5 }}>
                    Clique em qualquer ponto do mapa OU use o botão "Minha localização" no formulário.
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6b7a9d', textTransform: 'uppercase',
                    letterSpacing: '0.04em', marginBottom: 8 }}>
                    {ocorrencias.length} ocorrência{ocorrencias.length !== 1 ? 's' : ''}
                  </p>
                  {ocorrencias.slice(0, 8).map(o => (
                    <div key={o.id} style={{
                      background: '#fff', borderRadius: 8, padding: '10px 12px', marginBottom: 8,
                      borderLeft: `3px solid ${o.nivelRisco === 'CRITICO' ? '#e03e3e' : o.nivelRisco === 'ALTO' ? '#e07b3e' : o.nivelRisco === 'MEDIO' ? '#f5a623' : '#00a878'}`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.87rem' }}>{o.municipio}</strong>
                        <span className={`badge badge-${o.nivelRisco.toLowerCase()}`}>{o.nivelRisco}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#6b7a9d', marginTop: 3 }}>
                        {o.tipo} · {o.pessoasAfetadas} pessoas · {o.confiabilidade}% confiança
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {abaAtiva === 'stats' && (
              <PainelEstatisticas ocorrencias={ocorrencias} />
            )}
          </div>
        </aside>

        {/* Área do mapa */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MapaOcorrencias
            ocorrencias={ocorrencias}
            onMapClick={handleMapClick}
            locSelecionada={locSelecionada}
            centro={centroMapa}
          />

          {/* Legenda */}
          <div style={{
            position: 'absolute', bottom: 24, right: 16, background: 'white',
            borderRadius: 10, padding: '10px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            zIndex: 1000, fontSize: '0.78rem',
          }}>
            <p style={{ fontWeight: 700, marginBottom: 6, color: '#1a1f36' }}>Nível de Risco</p>
            {[
              { nivel: 'Crítico', cor: '#e03e3e' },
              { nivel: 'Alto',    cor: '#e07b3e' },
              { nivel: 'Médio',   cor: '#f5a623' },
              { nivel: 'Baixo',   cor: '#00a878' },
            ].map(({ nivel, cor }) => (
              <div key={nivel} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: cor }} />
                <span style={{ color: '#6b7a9d' }}>{nivel}</span>
              </div>
            ))}
            <p style={{ color: '#6b7a9d', marginTop: 6, borderTop: '1px solid #f0f2f7', paddingTop: 6 }}>
              Tamanho = confiabilidade
            </p>
          </div>
        </main>

        {/* Painel do formulário */}
        {mostrarForm && (
          <aside style={{
            width: 380, flexShrink: 0,
            background: '#fff',
            borderLeft: '1.5px solid var(--cinza-borda)',
            overflowY: 'auto',
            padding: 20,
            zIndex: 500,
          }}>
            <FormularioOcorrencia
              locSelecionada={locSelecionada}
              onLocCapturada={handleLocCapturada}
              onSucesso={handleSucesso}
              onCancelar={() => { setMostrarForm(false); setLocSelecionada(null) }}
            />
          </aside>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
