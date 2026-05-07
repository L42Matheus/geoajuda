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
    @Query(value = """
        SELECT * FROM ocorrencia
        WHERE status NOT IN ('FALSA', 'DUPLICADA')
        AND ST_DWithin(
            localizacao::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :raioMetros
        )
        ORDER BY ST_Distance(
            localizacao::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        )
        """, nativeQuery = true)
    List<Ocorrencia> findProximas(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("raioMetros") double raioMetros
    );

    // Conta relatos próximos (usado para calcular confiabilidade)
    @Query(value = """
        SELECT COUNT(*) FROM ocorrencia
        WHERE id != :id
        AND status NOT IN ('FALSA', 'DUPLICADA')
        AND ST_DWithin(
            localizacao::geography,
            (SELECT localizacao::geography FROM ocorrencia WHERE id = :id),
            500
        )
        """, nativeQuery = true)
    Long contarRelatosProximos(@Param("id") Long id);
}
