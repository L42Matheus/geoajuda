package br.com.geoajuda.service;

import br.com.geoajuda.dto.OcorrenciaDTO.*;
import br.com.geoajuda.model.Ocorrencia;
import br.com.geoajuda.model.Ocorrencia.StatusOcorrencia;
import br.com.geoajuda.repository.OcorrenciaRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OcorrenciaService {

    private final OcorrenciaRepository repo;
    private final ServicoChuva servicoChuva;
    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    private static final List<StatusOcorrencia> EXCLUIDOS =
        List.of(StatusOcorrencia.FALSA, StatusOcorrencia.DUPLICADA);

    // --- Criação ---
    @Transactional
    public PublicaResponse criar(CriarRequest req) {
        Point ponto = GF.createPoint(new Coordinate(req.getLongitude(), req.getLatitude()));

        Ocorrencia o = Ocorrencia.builder()
            .municipio(req.getMunicipio())
            .bairro(req.getBairro())
            .tipo(req.getTipo())
            .nivelRisco(req.getNivelRisco())
            .familiasAfetadas(req.getFamiliasAfetadas())
            .pessoasAfetadas(req.getPessoasAfetadas())
            .necessidadePrincipal(req.getNecessidadePrincipal())
            .descricao(req.getDescricao())
            .localizacao(ponto)
            .fotoUrl(req.getFotoUrl())
            .confiabilidade(0)
            .build();

        o = repo.save(o);
        o.setConfiabilidade(calcularConfiabilidade(o, req));
        o = repo.save(o);

        return toPublicaResponse(o);
    }

    // --- Listagem pública ---
    @Transactional(readOnly = true)
    public List<PublicaResponse> listarPublicas() {
        return repo.findByStatusNotIn(EXCLUIDOS)
            .stream().map(this::toPublicaResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PublicaResponse> listarPorMunicipio(String municipio) {
        return repo.findByMunicipioIgnoreCaseAndStatusNotIn(municipio, EXCLUIDOS)
            .stream().map(this::toPublicaResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PublicaResponse> listarProximas(double lat, double lng, double raioMetros) {
        return repo.findProximas(lat, lng, raioMetros)
            .stream().map(this::toPublicaResponse).toList();
    }

    @Transactional
    public PublicaResponse atualizarStatus(Long id, AtualizarStatusRequest req) {
        Ocorrencia o = repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Ocorrência não encontrada: " + id));
        o.setStatus(req.getStatus());
        return toPublicaResponse(repo.save(o));
    }

    /**
     * Cálculo do índice de confiabilidade.
     * Baseado em Sekajugo et al. (2022) — validação em camadas.
     * Inclui validação cruzada com dados pluviométricos (CEMADEN).
     */
    private int calcularConfiabilidade(Ocorrencia o, CriarRequest req) {
        int pontos = 0;

        // (1) Localização geográfica informada
        pontos += 15;

        // (2) Foto/vídeo anexado
        if (req.getFotoUrl() != null && !req.getFotoUrl().isBlank()) {
            pontos += 20;
        }

        // (3) Múltiplos relatos próximos (raio 500m)
        long relatosPróximos = repo.contarRelatosProximos(o.getId());
        if (relatosPróximos >= 3) pontos += 25;
        else if (relatosPróximos >= 1) pontos += 12;

        // (4) Descrição detalhada
        if (req.getDescricao() != null && req.getDescricao().length() > 50) {
            pontos += 10;
        }

        // (5) Dados restritos preenchidos
        boolean temDadosRestritos = req.getNomeResponsavel() != null
            || req.getTelefone() != null
            || req.getQtdMoradores() != null;
        if (temDadosRestritos) pontos += 15;

        // (6) Validação cruzada com dados pluviométricos (CEMADEN)
        try {
            boolean choveuForte = servicoChuva.choveuForteNasUltimas24h(
                req.getLatitude(), req.getLongitude(), req.getMunicipio()
            );
            if (choveuForte) pontos += 15;
        } catch (Exception e) {
            // Falhas externas não devem comprometer o registro do relato
        }

        return Math.min(pontos, 100);
    }

    private PublicaResponse toPublicaResponse(Ocorrencia o) {
        return PublicaResponse.builder()
            .id(o.getId())
            .municipio(o.getMunicipio())
            .bairro(o.getBairro())
            .tipo(o.getTipo())
            .nivelRisco(o.getNivelRisco())
            .status(o.getStatus())
            .familiasAfetadas(o.getFamiliasAfetadas())
            .pessoasAfetadas(o.getPessoasAfetadas())
            .necessidadePrincipal(o.getNecessidadePrincipal())
            .descricao(o.getDescricao())
            .latitude(o.getLocalizacao().getY())
            .longitude(o.getLocalizacao().getX())
            .confiabilidade(o.getConfiabilidade())
            .criadoEm(o.getCriadoEm())
            .build();
    }
}
