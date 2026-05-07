import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, useMap } from 'react-leaflet'
import { AlertTriangle, Users, Home, Clock } from 'lucide-react'

const CORES = {
  BAIXO:   { fill: '#00a878', stroke: '#007a58' },
  MEDIO:   { fill: '#f5a623', stroke: '#c47d0e' },
  ALTO:    { fill: '#e07b3e', stroke: '#b85a1c' },
  CRITICO: { fill: '#e03e3e', stroke: '#b01c1c' },
}

const raioParaConfianca = (c) => {
  if (c >= 80) return 13
  if (c >= 60) return 10
  if (c >= 30) return 8
  return 6
}

const TIPO_LABEL = {
  ALAGAMENTO: 'Alagamento', ENCHENTE: 'Enchente', ENXURRADA: 'Enxurrada',
  DESLIZAMENTO: 'Deslizamento', OUTRO: 'Outro',
}

const STATUS_LABEL = {
  PENDENTE: 'Pendente', EM_ANALISE: 'Em Análise',
  CONFIRMADA_COMUNIDADE: 'Confirmada pela Comunidade',
  CONFIRMADA_ORGAO: 'Confirmada por Órgão Público',
  EM_ATENDIMENTO: 'Em Atendimento', ATENDIDA: 'Atendida',
}

// Componente que recentra o mapa quando o centro muda (ex.: GPS captura)
function CentralizadorMapa({ centro }) {
  const map = useMap()
  useEffect(() => {
    if (centro) map.flyTo(centro, 15, { duration: 1.2 })
  }, [centro, map])
  return null
}

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) })
  return null
}

export default function MapaOcorrencias({ ocorrencias, onMapClick, locSelecionada, centro }) {
  const CENTER_DEFAULT = [-7.23, -36.82]

  return (
    <MapContainer
      center={CENTER_DEFAULT}
      zoom={7}
      style={{ height: '100%', width: '100%', minHeight: 480 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {centro && <CentralizadorMapa centro={centro} />}
      {onMapClick && <ClickHandler onMapClick={onMapClick} />}

      {locSelecionada && (
        <CircleMarker
          center={[locSelecionada.lat, locSelecionada.lng]}
          radius={10}
          pathOptions={{ color: '#0053a0', fillColor: '#1a75d2', fillOpacity: 0.8, weight: 2 }}
        >
          <Popup>📍 Sua localização selecionada</Popup>
        </CircleMarker>
      )}

      {ocorrencias.map((o) => {
        const cor = CORES[o.nivelRisco] || CORES.MEDIO
        const raio = raioParaConfianca(o.confiabilidade)
        return (
          <CircleMarker
            key={o.id}
            center={[o.latitude, o.longitude]}
            radius={raio}
            pathOptions={{
              color: cor.stroke,
              fillColor: cor.fill,
              fillOpacity: 0.85,
              weight: 1.5,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'DM Sans, sans-serif', minWidth: 220 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ fontSize: '1rem' }}>{TIPO_LABEL[o.tipo]}</strong>
                  <span className={`badge badge-${o.nivelRisco.toLowerCase()}`}>
                    {o.nivelRisco}
                  </span>
                </div>

                <p style={{ color: '#6b7a9d', fontSize: '0.82rem', marginBottom: 8 }}>
                  📍 {o.bairro ? `${o.bairro}, ` : ''}{o.municipio}
                </p>

                {o.descricao && (
                  <p style={{ fontSize: '0.88rem', marginBottom: 10, lineHeight: 1.5 }}>
                    {o.descricao}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}>
                    <Home size={13} /> {o.familiasAfetadas} famílias
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}>
                    <Users size={13} /> {o.pessoasAfetadas} pessoas
                  </span>
                </div>

                {o.necessidadePrincipal && (
                  <div style={{ background: '#fff7e6', borderRadius: 6, padding: '5px 9px', fontSize: '0.82rem', marginBottom: 8 }}>
                    <AlertTriangle size={12} style={{ marginRight: 4, color: '#f5a623' }} />
                    {o.necessidadePrincipal}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#6b7a9d' }}>
                  <span>{STATUS_LABEL[o.status] || o.status}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={11} />
                    {new Date(o.criadoEm).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div style={{ marginTop: 8, background: '#f4f6fa', borderRadius: 6, padding: '4px 8px', fontSize: '0.76rem' }}>
                  Confiabilidade: <strong>{o.confiabilidade}%</strong>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
