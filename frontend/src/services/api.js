import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const ocorrenciaService = {
  listar: (municipio) =>
    api.get('/ocorrencias', { params: municipio ? { municipio } : {} }).then(r => r.data),

  criar: (dados) =>
    api.post('/ocorrencias', dados).then(r => r.data),

  proximas: (lat, lng, raio = 1000) =>
    api.get('/ocorrencias/proximas', { params: { lat, lng, raio } }).then(r => r.data),

  atualizarStatus: (id, status, observacao) =>
    api.patch(`/ocorrencias/${id}/status`, { status, observacao }).then(r => r.data),
}

export const chuvaService = {
  consultar: (municipio) =>
    api.get('/chuva', { params: { municipio } }).then(r => r.data),
}

export default api
