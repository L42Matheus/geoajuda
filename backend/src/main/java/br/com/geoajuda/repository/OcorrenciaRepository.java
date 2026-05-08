package br.com.geoajuda.repository;

import br.com.geoajuda.model.Ocorrencia;
import br.com.geoajuda.model.Ocorrencia.StatusOcorrencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OcorrenciaRepository extends JpaRepository<Ocorrencia, Long> {

    // Busca ocorrências públicas (excluindo falsas e duplicadas)
    List<Ocorrencia> findByStatusNotIn(List<StatusOcorrencia> statuses);

    // Busca por município
    List<Ocorrencia> findByMunicipioIgnoreCaseAndStatusNotIn(
        String municipio, List<StatusOcorrencia> statuses
    );

    // Busca ocorrências em raio (metros) de um ponto — usa PostGIS ST_DWithin
    @Query(value =
        "SELECT * FROM ocorrencia " +
        "WHERE status NOT IN ('FALSA', 'DUPLICADA') " +
        "AND ST_DWithin(" +
        "  CAST(localizacao AS geography), " +
        "  CAST(ST_SetSRID(ST_MakePoint(?2, ?1), 4326) AS geography), " +
        "  ?3" +
        ") " +
        "ORDER BY ST_Distance(" +
        "  CAST(localizacao AS geography), " +
        "  CAST(ST_SetSRID(ST_MakePoint(?2, ?1), 4326) AS geography)" +
        ")", nativeQuery = true)
    List<Ocorrencia> findProximas(double lat, double lng, double raioMetros);

    // Conta relatos próximos (usado para calcular confiabilidade)
    @Query(value =
        "SELECT COUNT(*) FROM ocorrencia " +
        "WHERE id != ?1 " +
        "AND status NOT IN ('FALSA', 'DUPLICADA') " +
        "AND ST_DWithin(" +
        "  CAST(localizacao AS geography), " +
        "  (SELECT CAST(localizacao AS geography) FROM ocorrencia WHERE id = ?1), " +
        "  500" +
        ")", nativeQuery = true)
    Long contarRelatosProximos(Long id);
}
