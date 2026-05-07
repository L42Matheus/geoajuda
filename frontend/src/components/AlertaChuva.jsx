import { useState, useEffect } from 'react'
import { Cloud, CloudRain, Droplet, AlertCircle } from 'lucide-react'
import { chuvaService } from '../services/api'

const NIVEL_CONFIG = {
  SEM_CHUVA:   { cor: '#6b7a9d', bg: '#f4f6fa', icone: <Cloud size={16}/>,     label: 'Sem chuva significativa' },
  FRACA:       { cor: '#0053a0', bg: '#e8f4ff', icone: <Droplet size={16}/>,   label: 'Chuva fraca'    },
  MODERADA:    { cor: '#1a75d2', bg: '#dbeafe', icone: <CloudRain size={16}/>, label: 'Chuva moderada' },
  FORTE:       { cor: '#c47d0e', bg: '#fff7e6', icone: <CloudRain size={16}/>, label: 'Chuva forte'    },
  MUITO_FORTE: { cor: '#e07b3e', bg: '#fff0e6', icone: <AlertCircle size={16}/>, label: 'Chuva muito forte' },
  EXTREMA:     { cor: '#e03e3e', bg: '#fce8e8', icone: <AlertCircle size={16}/>, label: 'Chuva EXTREMA'  },
}

export default function AlertaChuva({ municipio }) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (!municipio) { setDados(null); return }

    setCarregando(true)
    chuvaService.consultar(municipio)
      .then(setDados)
      .catch(() => setDados(null))
      .finally(() => setCarregando(false))
  }, [municipio])

  if (!municipio || carregando) return null
  if (!dados) return null

  const config = NIVEL_CONFIG[dados.nivelAlerta] || NIVEL_CONFIG.SEM_CHUVA

  return (
    <div style={{
      background: config.bg,
      borderLeft: `4px solid ${config.cor}`,
      borderRadius: 8,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: config.cor }}>{config.icone}</span>
        <strong style={{ fontSize: '0.88rem', color: config.cor }}>
          {config.label}
        </strong>
      </div>

      <div style={{ display: 'flex', gap: 14, fontSize: '0.82rem', color: '#1a1f36' }}>
        <span>📊 24h: <strong>{dados.acumulado24h.toFixed(1)} mm</strong></span>
        <span>⏱ 1h: <strong>{dados.acumulado1h.toFixed(1)} mm</strong></span>
      </div>

      <p style={{ fontSize: '0.74rem', color: '#6b7a9d' }}>
        Fonte: CEMADEN · {dados.municipio}
      </p>
    </div>
  )
}
