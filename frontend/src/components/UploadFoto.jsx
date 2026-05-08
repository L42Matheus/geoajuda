import { useState, useRef } from 'react'
import { uploadService } from '../services/api'
import { Camera, X, Loader2, CheckCircle2 } from 'lucide-react'

export default function UploadFoto({ onUpload, fotoAtual }) {
  const [preview, setPreview] = useState(fotoAtual || null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)
  const inputRef = useRef(null)

  const handleArquivoSelecionado = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp']
    if (!tiposPermitidos.includes(file.type)) {
      setErro('Apenas imagens JPEG, PNG ou WebP')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErro('Imagem deve ter no máximo 5MB')
      return
    }

    // Mostrar preview local
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)

    // Enviar para o servidor
    setEnviando(true)
    setErro(null)
    setSucesso(false)

    try {
      const url = await uploadService.enviar(file)
      onUpload?.(url)
      setSucesso(true)
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao enviar imagem')
      setPreview(null)
    } finally {
      setEnviando(false)
    }
  }

  const handleRemover = () => {
    setPreview(null)
    setSucesso(false)
    setErro(null)
    onUpload?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ marginBottom: 0 }}>Foto da Ocorrência (opcional)</label>

      {preview ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={preview}
            alt="Preview"
            style={{
              width: '100%',
              maxHeight: 200,
              objectFit: 'cover',
              borderRadius: 8,
              border: sucesso ? '2px solid #00a878' : '1px solid var(--cinza-borda)'
            }}
          />
          {enviando && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8
            }}>
              <Loader2 size={28} className="spin" color="#0053a0" />
            </div>
          )}
          {sucesso && (
            <div style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: '#00a878',
              borderRadius: '50%',
              padding: 4
            }}>
              <CheckCircle2 size={16} color="#fff" />
            </div>
          )}
          <button
            type="button"
            onClick={handleRemover}
            disabled={enviando}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(0,0,0,0.6)',
              borderRadius: '50%',
              padding: 4,
              color: '#fff',
              opacity: enviando ? 0.5 : 1
            }}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '24px 16px',
            border: '2px dashed var(--cinza-borda)',
            borderRadius: 8,
            cursor: 'pointer',
            color: '#6b7a9d',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#0053a0'
            e.currentTarget.style.background = '#f8fafc'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'var(--cinza-borda)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <Camera size={28} />
          <span style={{ fontSize: '0.9rem' }}>Clique para adicionar foto</span>
          <span style={{ fontSize: '0.78rem', color: '#9aa5b9' }}>JPEG, PNG ou WebP (máx. 5MB)</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleArquivoSelecionado}
            style={{ display: 'none' }}
          />
        </label>
      )}

      {erro && (
        <div style={{
          fontSize: '0.82rem',
          color: '#e03e3e',
          background: '#fce8e8',
          padding: '6px 10px',
          borderRadius: 6
        }}>
          {erro}
        </div>
      )}

      <span style={{ fontSize: '0.76rem', color: '#6b7a9d' }}>
        Fotos aumentam a confiabilidade do relato (+20 pontos)
      </span>
    </div>
  )
}
