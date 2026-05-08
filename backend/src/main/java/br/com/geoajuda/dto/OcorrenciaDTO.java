package br.com.geoajuda.dto;

import br.com.geoajuda.model.Ocorrencia.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

// DTO de criação de ocorrência (dados públicos + restritos)
public class OcorrenciaDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CriarRequest {

        // Dados públicos
        @NotBlank(message = "Município é obrigatório")
        private String municipio;

        private String bairro;

        @NotNull(message = "Tipo de ocorrência é obrigatório")
        private TipoOcorrencia tipo;

        @NotNull(message = "Nível de risco é obrigatório")
        private NivelRisco nivelRisco;

        @Min(0) private Integer familiasAfetadas = 0;
        @Min(0) private Integer pessoasAfetadas = 0;

        @Size(max = 200)
        private String necessidadePrincipal;

        private String descricao;

        @NotNull(message = "Latitude é obrigatória")
        @DecimalMin("-90.0") @DecimalMax("90.0")
        private Double latitude;

        @NotNull(message = "Longitude é obrigatória")
        @DecimalMin("-180.0") @DecimalMax("180.0")
        private Double longitude;

        private String fotoUrl;

        // Dados restritos (opcionais)
        private String nomeResponsavel;
        private String telefone;
        private String enderecoCompleto;
        private Integer qtdMoradores;
        private Boolean temCriancas;
        private Boolean temIdosos;
        private Boolean temPcd;
        private Boolean precisaResgate;
        private Boolean precisaAbrigo;
        private Boolean precisaAlimento;
        private Boolean precisaMedicamento;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PublicaResponse {
        private Long id;
        private String municipio;
        private String bairro;
        private TipoOcorrencia tipo;
        private NivelRisco nivelRisco;
        private StatusOcorrencia status;
        private Integer familiasAfetadas;
        private Integer pessoasAfetadas;
        private String necessidadePrincipal;
        private String descricao;
        private Double latitude;
        private Double longitude;
        private String fotoUrl;
        private Integer confiabilidade;
        private LocalDateTime criadoEm;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AtualizarStatusRequest {
        @NotNull private StatusOcorrencia status;
        private String observacao;
    }
}
