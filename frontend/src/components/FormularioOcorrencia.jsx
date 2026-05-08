import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { ocorrenciaService } from '../services/api'
import { useGeolocation } from '../hooks/useGeolocation'
import AlertaChuva from './AlertaChuva'
import UploadFoto from './UploadFoto'
import { MapPin, Crosshair, ChevronDown, ChevronUp, CheckCircle2, X, Loader2 } from 'lucide-react'

const MUNICIPIOS_PB = [
  'Campina Grande', 'João Pessoa', 'Ingá', 'Esperança', 'Patos',
  'Cajazeiras', 'Sousa', 'Guarabira', 'Santa Rita', 'Bayeux',
  'Cabedelo', 'Sapé', 'Itabaiana', 'Queimadas', 'Monteiro',
  'Sumé', 'Pombal', 'Picuí', 'Cuité', 'Lagoa Seca',
]

export default function FormularioOcorrencia({ locSelecionada, onLocCapturada, onSucesso, onCancelar }) {
  const [mostrarRestrito, setMostrarRestrito] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState(null)

  const { obterLocalizacao, carregando: gpsCarregando, error: gpsError } = useGeolocation()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      latitude: locSelecionada?.lat ?? '',
      longitude: locSelecionada?.lng ?? '',
      familiasAfetadas: 0,
      pessoasAfetadas: 0,
    }
  })

  // Sincroniza coordenadas quando vêm de fora
  useEffect(() => {
    if (locSelecionada) {
      setValue('latitude', locSelecionada.lat)
      setValue('longitude', locSelecionada.lng)
    }
  }, [locSelecionada, setValue])

  const municipioSelecionado = watch('municipio')

  // Botão "Usar minha localização"
  const handleUsarMinhaLocalizacao = async () => {
    try {
      const coords = await obterLocalizacao()
      onLocCapturada?.({ lat: coords.lat, lng: coords.lng })
    } catch (e) {
      // Erro tratado pelo hook (gpsError)
    }
  }

  const onSubmit = async (dados) => {
    setEnviando(true)
    setErro(null)
    try {
      const payload = {
        ...dados,
        latitude: parseFloat(dados.latitude),
        longitude: parseFloat(dados.longitude),
        familiasAfetadas: parseInt(dados.familiasAfetadas) || 0,
        pessoasAfetadas: parseInt(dados.pessoasAfetadas) || 0,
      }
      await ocorrenciaService.criar(payload)
      setSucesso(true)
      setTimeout(() => { onSucesso?.() }, 1800)
    } catch (e) {
      setErro('Erro ao enviar o relato. Verifique os dados e tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (sucesso) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 12 }}>
      <CheckCircle2 size={52} color="#00a878" />
      <h3 style={{ color: '#00a878' }}>Relato enviado!</h3>
      <p style={{ color: '#6b7a9d', textAlign: 'center', fontSize: '0.9rem' }}>
        Sua ocorrência foi registrada e aparecerá no mapa em instantes.
      </p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={{ fontSize: '1.15rem' }}>Registrar Ocorrência</h2>
        {onCancelar && (
          <button type="button" onClick={onCancelar}
            style={{ background: 'none', padding: 4, color: '#6b7a9d' }}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Botão de geolocalização */}
      <button
        type="button"
        onClick={handleUsarMinhaLocalizacao}
        disabled={gpsCarregando}
        style={{
          background: '#00a878', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '10px 14px',
          opacity: gpsCarregando ? 0.7 : 1,
        }}>
        {gpsCarregando ? <Loader2 size={16} className="spin" /> : <Crosshair size={16} />}
        {gpsCarregando ? 'Obtendo localização...' : 'Usar minha localização atual'}
      </button>

      {gpsError && (
        <div style={{ fontSize: '0.78rem', background: '#fff7e6', borderRadius: 8,
          padding: '7px 11px', color: '#c47d0e' }}>
          {gpsError}
        </div>
      )}

      {/* Status da localização */}
      {locSelecionada ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem',
          background: '#e8f4ff', borderRadius: 8, padding: '7px 11px', color: '#0053a0' }}>
          <MapPin size={14} />
          {locSelecionada.lat.toFixed(5)}, {locSelecionada.lng.toFixed(5)}
        </div>
      ) : (
        <div style={{ fontSize: '0.84rem', background: '#fff7e6', borderRadius: 8,
          padding: '7px 11px', color: '#c47d0e' }}>
          ⚠️ Use o botão acima ou clique no mapa para selecionar a localização
        </div>
      )}

      {/* Município */}
      <div>
        <label>Município *</label>
        <select {...register('municipio', { required: 'Obrigatório' })}>
          <option value="">Selecione...</option>
          {MUNICIPIOS_PB.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {errors.municipio && <span style={errStyle}>{errors.municipio.message}</span>}
      </div>

      {/* Alerta de chuva CEMADEN */}
      {municipioSelecionado && <AlertaChuva municipio={municipioSelecionado} />}

      {/* Bairro */}
      <div>
        <label>Bairro / Região</label>
        <input {...register('bairro')} placeholder="Ex: Centro, Bodocongó..." />
      </div>

      {/* Tipo e Risco */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label>Tipo de Ocorrência *</label>
          <select {...register('tipo', { required: 'Obrigatório' })}>
            <option value="">Selecione...</option>
            <option value="ALAGAMENTO">Alagamento</option>
            <option value="ENCHENTE">Enchente</option>
            <option value="ENXURRADA">Enxurrada</option>
            <option value="DESLIZAMENTO">Deslizamento</option>
            <option value="OUTRO">Outro</option>
          </select>
          {errors.tipo && <span style={errStyle}>{errors.tipo.message}</span>}
        </div>
        <div>
          <label>Nível de Risco *</label>
          <select {...register('nivelRisco', { required: 'Obrigatório' })}>
            <option value="">Selecione...</option>
            <option value="BAIXO">🟢 Baixo</option>
            <option value="MEDIO">🟡 Médio</option>
            <option value="ALTO">🟠 Alto</option>
            <option value="CRITICO">🔴 Crítico</option>
          </select>
          {errors.nivelRisco && <span style={errStyle}>{errors.nivelRisco.message}</span>}
        </div>
      </div>

      {/* Famílias e Pessoas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label>Famílias Afetadas</label>
          <input type="number" min="0" {...register('familiasAfetadas')} />
        </div>
        <div>
          <label>Pessoas Afetadas</label>
          <input type="number" min="0" {...register('pessoasAfetadas')} />
        </div>
      </div>

      {/* Necessidade principal */}
      <div>
        <label>Necessidade Principal</label>
        <input {...register('necessidadePrincipal')}
          placeholder="Ex: Abrigo temporário, Resgate, Alimentos..." />
      </div>

      {/* Descrição */}
      <div>
        <label>Descrição da Situação</label>
        <textarea rows={3} {...register('descricao')}
          placeholder="Descreva o que está acontecendo, o nível da água, acesso à área..."
          style={{ resize: 'vertical' }}
        />
        <span style={{ fontSize: '0.76rem', color: '#6b7a9d' }}>
          Descrições detalhadas aumentam a confiabilidade do relato
        </span>
      </div>

      {/* Upload de Foto */}
      <UploadFoto onUpload={url => setValue('fotoUrl', url)} />

      {/* Coordenadas ocultas */}
      <input type="hidden" {...register('latitude', { required: true })} />
      <input type="hidden" {...register('longitude', { required: true })} />

      {/* Seção de dados restritos (colapsável) */}
      <div style={{ borderTop: '1.5px solid var(--cinza-borda)', paddingTop: 14 }}>
        <button type="button"
          onClick={() => setMostrarRestrito(v => !v)}
          style={{ background: 'none', padding: 0, color: '#0053a0', display: 'flex', alignItems: 'center', gap: 6 }}>
          {mostrarRestrito ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          Dados para contato e resgate (confidenciais)
        </button>
        <p style={{ fontSize: '0.78rem', color: '#6b7a9d', marginTop: 4 }}>
          Visíveis apenas para agentes da Defesa Civil. Aumentam a prioridade de atendimento.
        </p>

        {mostrarRestrito && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label>Nome do Responsável</label>
                <input {...register('nomeResponsavel')} placeholder="Seu nome" />
              </div>
              <div>
                <label>Telefone</label>
                <input {...register('telefone')} placeholder="(83) 99999-9999" />
              </div>
            </div>

            <div>
              <label>Endereço Completo</label>
              <input {...register('enderecoCompleto')} placeholder="Rua, número, bairro" />
            </div>

            <div>
              <label>Número de Moradores</label>
              <input type="number" min="1" {...register('qtdMoradores')} />
            </div>

            <div>
              <label style={{ marginBottom: 8 }}>Grupos vulneráveis presentes</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { key: 'temCriancas', label: '👶 Crianças' },
                  { key: 'temIdosos', label: '👴 Idosos' },
                  { key: 'temPcd', label: '♿ PcD' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6,
                    textTransform: 'none', fontSize: '0.88rem', fontWeight: 500, color: '#1a1f36' }}>
                    <input type="checkbox" {...register(key)} style={{ width: 'auto' }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ marginBottom: 8 }}>Necessidades urgentes</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { key: 'precisaResgate', label: '🚁 Resgate' },
                  { key: 'precisaAbrigo', label: '🏠 Abrigo' },
                  { key: 'precisaAlimento', label: '🍱 Alimento' },
                  { key: 'precisaMedicamento', label: '💊 Medicamento' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6,
                    textTransform: 'none', fontSize: '0.88rem', fontWeight: 500, color: '#1a1f36' }}>
                    <input type="checkbox" {...register(key)} style={{ width: 'auto' }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {erro && (
        <div style={{ background: '#fce8e8', color: '#b01c1c', borderRadius: 8,
          padding: '10px 14px', fontSize: '0.88rem' }}>
          {erro}
        </div>
      )}

      <button type="submit" className="btn-primary"
        disabled={enviando || !locSelecionada}
        style={{ opacity: (!locSelecionada || enviando) ? 0.6 : 1 }}>
        {enviando ? 'Enviando...' : 'Registrar Ocorrência'}
      </button>
    </form>
  )
}

const errStyle = { color: '#e03e3e', fontSize: '0.78rem', marginTop: 3 }
