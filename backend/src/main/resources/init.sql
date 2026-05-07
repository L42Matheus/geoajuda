-- GeoAjuda PB — Init Schema
-- Compatível com JPA/Hibernate usando @Enumerated(EnumType.STRING)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Ocorrência pública (dados anonimizados)
-- Nota: Enums são armazenados como VARCHAR para compatibilidade com JPA
CREATE TABLE ocorrencia (
    id              BIGSERIAL PRIMARY KEY,
    municipio       VARCHAR(100) NOT NULL,
    bairro          VARCHAR(100),
    tipo            VARCHAR(50) NOT NULL CHECK (tipo IN ('ALAGAMENTO', 'ENCHENTE', 'ENXURRADA', 'DESLIZAMENTO', 'OUTRO')),
    nivel_risco     VARCHAR(20) NOT NULL DEFAULT 'MEDIO' CHECK (nivel_risco IN ('BAIXO', 'MEDIO', 'ALTO', 'CRITICO')),
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_ANALISE', 'CONFIRMADA_COMUNIDADE', 'CONFIRMADA_ORGAO', 'EM_ATENDIMENTO', 'ATENDIDA', 'DUPLICADA', 'FALSA')),
    familias_afetadas   INTEGER DEFAULT 0,
    pessoas_afetadas    INTEGER DEFAULT 0,
    necessidade_principal VARCHAR(200),
    descricao       TEXT,
    localizacao     GEOMETRY(Point, 4326) NOT NULL,
    foto_url        VARCHAR(500),
    confiabilidade  INTEGER DEFAULT 0 CHECK (confiabilidade BETWEEN 0 AND 100),
    criado_em       TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Dados restritos (acesso apenas a usuários autorizados)
CREATE TABLE ocorrencia_restrita (
    id              BIGSERIAL PRIMARY KEY,
    ocorrencia_id   BIGINT NOT NULL REFERENCES ocorrencia(id),
    nome_responsavel VARCHAR(150),
    telefone        VARCHAR(20),
    endereco_completo VARCHAR(300),
    qtd_moradores   INTEGER,
    tem_criancas    BOOLEAN DEFAULT FALSE,
    tem_idosos      BOOLEAN DEFAULT FALSE,
    tem_pcd         BOOLEAN DEFAULT FALSE,
    precisa_resgate BOOLEAN DEFAULT FALSE,
    precisa_abrigo  BOOLEAN DEFAULT FALSE,
    precisa_alimento BOOLEAN DEFAULT FALSE,
    precisa_medicamento BOOLEAN DEFAULT FALSE
);

-- Validações aplicadas a uma ocorrência
CREATE TABLE validacao (
    id              BIGSERIAL PRIMARY KEY,
    ocorrencia_id   BIGINT NOT NULL REFERENCES ocorrencia(id),
    tipo_validacao  VARCHAR(50) NOT NULL, -- FOTO, GEOLOCALIZACAO, MULTIPLOS_RELATOS, AREA_RISCO, DADO_OFICIAL, AGENTE_PUBLICO
    pontuacao       INTEGER NOT NULL DEFAULT 0,
    observacao      TEXT,
    criado_em       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices geoespaciais
CREATE INDEX idx_ocorrencia_localizacao ON ocorrencia USING GIST (localizacao);
CREATE INDEX idx_ocorrencia_municipio ON ocorrencia (municipio);
CREATE INDEX idx_ocorrencia_status ON ocorrencia (status);
CREATE INDEX idx_ocorrencia_nivel ON ocorrencia (nivel_risco);

-- View pública anonimizada (sem dados pessoais)
CREATE VIEW vw_ocorrencias_publicas AS
SELECT
    o.id,
    o.municipio,
    o.bairro,
    o.tipo,
    o.nivel_risco,
    o.status,
    o.familias_afetadas,
    o.pessoas_afetadas,
    o.necessidade_principal,
    o.descricao,
    ST_X(o.localizacao) AS longitude,
    ST_Y(o.localizacao) AS latitude,
    o.confiabilidade,
    o.criado_em
FROM ocorrencia o
WHERE o.status NOT IN ('FALSA', 'DUPLICADA');

-- Dados de exemplo para desenvolvimento
INSERT INTO ocorrencia (municipio, bairro, tipo, nivel_risco, status, familias_afetadas, pessoas_afetadas, necessidade_principal, descricao, localizacao, confiabilidade)
VALUES
  ('Campina Grande', 'Bodocongó', 'ALAGAMENTO', 'ALTO', 'CONFIRMADA_COMUNIDADE', 12, 47, 'Abrigo temporário', 'Rua alagada após chuva de 3h. Várias famílias sem acesso.', ST_SetSRID(ST_MakePoint(-35.8817, -7.2306), 4326), 75),
  ('João Pessoa', 'Cristo', 'ENCHENTE', 'CRITICO', 'EM_ATENDIMENTO', 30, 120, 'Resgate urgente', 'Nível do rio subiu 2m em menos de 1h. Famílias ilhadas.', ST_SetSRID(ST_MakePoint(-34.8631, -7.1195), 4326), 90),
  ('Ingá', 'Centro', 'ENXURRADA', 'MEDIO', 'PENDENTE', 5, 18, 'Alimentos e água', 'Enxurrada danificou casas no centro histórico.', ST_SetSRID(ST_MakePoint(-35.6108, -7.2842), 4326), 40),
  ('Esperança', 'Bairro Novo', 'ALAGAMENTO', 'BAIXO', 'ATENDIDA', 3, 9, 'Limpeza e desobstrução', 'Via desobstruída após ação da Defesa Civil.', ST_SetSRID(ST_MakePoint(-35.8608, -7.0311), 4326), 85),
  ('Patos', 'Centro', 'ENCHENTE', 'ALTO', 'CONFIRMADA_ORGAO', 20, 78, 'Abrigo e medicamentos', 'Transbordamento do açude afetou bairros próximos.', ST_SetSRID(ST_MakePoint(-37.2781, -7.0244), 4326), 80);
