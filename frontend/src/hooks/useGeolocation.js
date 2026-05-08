import { useState, useCallback } from 'react'

/**
 * Hook para obter a localização atual do usuário usando a API
 * Geolocation do navegador.
 *
 * Princípio LGPD: a localização é obtida apenas após consentimento
 * explícito do usuário ao clicar no botão. Não há rastreamento contínuo.
 */
export function useGeolocation() {
  const [coords, setCoords] = useState(null)
  const [error, setError] = useState(null)
  const [carregando, setCarregando] = useState(false)

  const obterLocalizacao = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada neste navegador')
      return Promise.reject('Geolocalização não suportada')
    }

    setCarregando(true)
    setError(null)

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const novaCoord = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            precisao: position.coords.accuracy,
          }
          setCoords(novaCoord)
          setCarregando(false)
          resolve(novaCoord)
        },
        (err) => {
          let mensagem = 'Erro ao obter localização'
          if (err.code === 1) mensagem = 'Permissão de localização negada. Você pode clicar no mapa para selecionar manualmente.'
          else if (err.code === 2) mensagem = 'Localização indisponível no momento'
          else if (err.code === 3) mensagem = 'Tempo esgotado ao obter localização'
          setError(mensagem)
          setCarregando(false)
          reject(mensagem)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0, // sempre obter localização atual
        }
      )
    })
  }, [])

  return { coords, error, carregando, obterLocalizacao }
}
