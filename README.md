# GeoAjuda PB — MVP v0.2

Plataforma web colaborativa para mapeamento de pessoas afetadas por chuvas e enchentes na Paraíba.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + React-Leaflet |
| Backend | Java 17 + Spring Boot 3.2 |
| Banco | PostgreSQL 15 + PostGIS 3.3 |
| Infra | Docker + Docker Compose |
| Mapa | Leaflet + OpenStreetMap |

## Diferenciais (v0.2)

### 🎯 Geolocalização do cidadão
Botão "Usar minha localização atual" no formulário utiliza a API Geolocation do navegador
para preencher automaticamente as coordenadas. O mapa é re-centralizado com animação
suave (`flyTo`) na localização capturada. **Princípio LGPD:** nenhuma localização é
obtida sem consentimento explícito do usuário (clique no botão).

### 🌧 Validação cruzada com dados pluviométricos (CEMADEN)
Ao selecionar o município no formulário, um banner exibe os dados pluviométricos das
últimas 24h e a classificação de alerta (sem chuva → moderada → forte → extrema).
Esses dados são também usados pelo backend para enriquecer o cálculo do índice de
confiabilidade do relato.

> **Nota técnica:** o CEMADEN não disponibiliza atualmente uma API REST pública aberta.
> O `ServicoChuva` implementado é uma camada de abstração (Strategy pattern) com dados
> simulados realistas baseados em padrões observados do CEMADEN. A interface está pronta
> para substituição por integração formal (CEMADEN WebService, INMET ou Open-Meteo) sem
> alteração da lógica de negócio.

## Rodando o projeto

```bash
cd geoajuda
docker-compose up --build
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API REST | http://localhost:8080/api |

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/ocorrencias` | Lista ocorrências públicas |
| `GET` | `/api/ocorrencias?municipio=Ingá` | Filtra por município |
| `GET` | `/api/ocorrencias/proximas?lat=&lng=&raio=` | Busca por raio (metros) |
| `POST` | `/api/ocorrencias` | Registra nova ocorrência |
| `PATCH` | `/api/ocorrencias/{id}/status` | Atualiza status (admin) |
| `GET` | `/api/chuva?municipio=Ingá` | **NOVO** — Dados pluviométricos do município |

## Lógica de Confiabilidade (v0.2)

Baseada em Sekajugo et al. (2022) e Tavra et al. (2024) — validação em camadas.

| Critério | Pontos |
|----------|--------|
| Localização geográfica informada | +15 |
| Foto/vídeo anexado | +20 |
| 3+ relatos próximos (raio 500m) | +25 |
| 1–2 relatos próximos | +12 |
| Descrição detalhada (>50 chars) | +10 |
| Dados restritos preenchidos | +15 |
| **Compatibilidade com chuva forte (CEMADEN)** | **+15** |

Total máximo: 100%

## Diferenciação vs. Sistemas Existentes

| Pergunta | Google SOS | CEMADEN | **GeoAjuda PB** |
|----------|:---:|:---:|:---:|
| Está chovendo forte aqui? | ✅ | ✅ | ❌ |
| Tem risco de enchente? | ✅ | ✅ | ❌ |
| **Quem está ilhado agora?** | ❌ | ❌ | **✅** |
| **Quantas famílias precisam de abrigo?** | ❌ | ❌ | **✅** |
| **Onde tem idoso/PcD que precisa resgate?** | ❌ | ❌ | **✅** |

## Estrutura do Projeto

```
geoajuda/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/br/com/geoajuda/
│       │   ├── GeoajudaApplication.java
│       │   ├── controller/
│       │   │   ├── OcorrenciaController.java
│       │   │   └── ChuvaController.java          ← NOVO
│       │   ├── service/
│       │   │   ├── OcorrenciaService.java
│       │   │   └── ServicoChuva.java             ← NOVO
│       │   ├── repository/OcorrenciaRepository.java
│       │   ├── model/Ocorrencia.java
│       │   ├── dto/OcorrenciaDTO.java
│       │   └── config/CorsConfig.java
│       └── resources/
│           ├── application.properties
│           └── init.sql
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── services/api.js
        ├── hooks/
        │   └── useGeolocation.js                 ← NOVO
        └── components/
            ├── MapaOcorrencias.jsx
            ├── FormularioOcorrencia.jsx
            ├── PainelEstatisticas.jsx
            └── AlertaChuva.jsx                   ← NOVO
```

## Próximos passos (pós-MVP v0.2)

- [ ] Substituir `ServicoChuva` simulado por integração real (CEMADEN/INMET/Open-Meteo)
- [ ] Autenticação JWT para o painel restrito
- [ ] Upload de fotos (integração com MinIO/S3)
- [ ] Mapa de calor por densidade de ocorrências
- [ ] Exportação de dataset anonimizado (CSV/GeoJSON)
- [ ] Notificações push para agentes da Defesa Civil
- [ ] Painel admin com validação de relatos
- [ ] Testes automatizados (JUnit + React Testing Library)

## Aspectos éticos e LGPD

- Geolocalização obtida apenas com consentimento explícito do usuário (clique no botão)
- Dados restritos (nome, telefone, endereço) armazenados separadamente e nunca expostos no mapa público
- Dataset anonimizado contém apenas dados agregados, sem possibilidade de identificação individual
- Cache de dados de chuva (30 min) reduz consultas externas e protege metadados de uso

Ver Seção 11 do artigo GeoAjuda PB para detalhes sobre conformidade LGPD.
