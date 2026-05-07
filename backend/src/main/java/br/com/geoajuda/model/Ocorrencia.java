package br.com.geoajuda.model;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;
import java.time.LocalDateTime;

@Entity
@Table(name = "ocorrencia")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ocorrencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String municipio;

    @Column(length = 100)
    private String bairro;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoOcorrencia tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_risco", nullable = false)
    private NivelRisco nivelRisco = NivelRisco.MEDIO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusOcorrencia status = StatusOcorrencia.PENDENTE;

    @Column(name = "familias_afetadas")
    private Integer familiasAfetadas = 0;

    @Column(name = "pessoas_afetadas")
    private Integer pessoasAfetadas = 0;

    @Column(name = "necessidade_principal", length = 200)
    private String necessidadePrincipal;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(columnDefinition = "GEOMETRY(Point,4326)", nullable = false)
    private Point localizacao;

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @Column(name = "confiabilidade")
    private Integer confiabilidade = 0;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }

    // Enums internos
    public enum TipoOcorrencia { ALAGAMENTO, ENCHENTE, ENXURRADA, DESLIZAMENTO, OUTRO }
    public enum NivelRisco { BAIXO, MEDIO, ALTO, CRITICO }
    public enum StatusOcorrencia {
        PENDENTE, EM_ANALISE, CONFIRMADA_COMUNIDADE,
        CONFIRMADA_ORGAO, EM_ATENDIMENTO, ATENDIDA, DUPLICADA, FALSA
    }
}
