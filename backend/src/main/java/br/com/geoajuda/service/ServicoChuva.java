package br.com.geoajuda.service;

import br.com.geoajuda.dto.openmeteo.OpenMeteoResponse;
import br.com.geoajuda.service.GeocodingService.Coordenadas;
import lombok.Builder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Serviço de consulta de dados pluviométricos.
 *
 * Estratégia: consulta a API Open-Meteo para obter dados reais de precipitação.
 * Fallback automático para dados simulados caso a API esteja indisponível.
 *
 * A API Open-Meteo é gratuita e não requer autenticação.
 * Documentação: https://open-meteo.com/en/docs
 */
@Slf4j
@Service
public class ServicoChuva {

    private final RestClient openMeteoRestClient;
    private final GeocodingService geocodingService;

    @Value("${openmeteo.cache.ttl-minutes:30}")
    private int cacheTtlMinutes;

    @Value("${openmeteo.fallback.enabled:true}")
    private boolean fallbackEnabled;

    // Cache em memória
    private final Map<String, DadosChuva> cache = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> cacheExpira = new ConcurrentHashMap<>();

    public ServicoChuva(@Qualifier("openMeteoRestClient") RestClient openMeteoRestClient,
                        GeocodingService geocodingService) {
        this.openMeteoRestClient = openMeteoRestClient;
        this.geocodingService = geocodingService;
    }

    @Getter
    @Builder
    public static class DadosChuva {
        private String municipio;
        private double acumulado24h;   // em mm
        private double acumulado1h;    // em mm
        private LocalDateTime ultimaAtualizacao;
        private NivelAlerta nivelAlerta;
        private String fonte;          // "OPEN_METEO", "FALLBACK_SIMULADO"

        public enum NivelAlerta {
            SEM_CHUVA,      // < 1mm em 24h
            FRACA,          // 1-10mm
            MODERADA,       // 10-30mm
            FORTE,          // 30-60mm
            MUITO_FORTE,    // 60-100mm
            EXTREMA         // > 100mm
        }
    }

    /**
     * Consulta dados de chuva para um município.
     * Útil para validação cruzada de relatos: se choveu forte na região,
     * o relato ganha confiabilidade adicional.
     */
    public DadosChuva consultarPorMunicipio(String municipio) {
        String chave = normalizar(municipio);

        // Verifica cache
        if (cacheValido(chave)) {
            log.debug("Cache hit para município: {}", municipio);
            return cache.get(chave);
        }

        // Busca coordenadas do município
        Coordenadas coord = geocodingService.buscarCoordenadas(municipio);
        log.debug("Coordenadas para {}: lat={}, lng={}", municipio, coord.getLatitude(), coord.getLongitude());

        // Tenta consultar API Open-Meteo
        DadosChuva dados = consultarOpenMeteo(municipio, coord);

        // Atualiza cache
        cache.put(chave, dados);
        cacheExpira.put(chave, LocalDateTime.now().plusMinutes(cacheTtlMinutes));

        return dados;
    }

    /**
     * Verifica se há chuva forte nas últimas 24h numa coordenada.
     * Usado pela lógica de confiabilidade do OcorrenciaService.
     */
    public boolean choveuForteNasUltimas24h(double lat, double lng, String municipio) {
        DadosChuva dados = consultarPorMunicipio(municipio);
        return dados.getAcumulado24h() >= 30.0; // limiar: chuva forte = 30mm/24h
    }

    /**
     * Consulta a API Open-Meteo para obter dados de precipitação.
     */
    private DadosChuva consultarOpenMeteo(String municipio, Coordenadas coord) {
        try {
            log.info("Consultando Open-Meteo para {}: lat={}, lng={}",
                    municipio, coord.getLatitude(), coord.getLongitude());

            OpenMeteoResponse response = openMeteoRestClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/forecast")
                            .queryParam("latitude", coord.getLatitude())
                            .queryParam("longitude", coord.getLongitude())
                            .queryParam("hourly", "precipitation")
                            .queryParam("past_hours", 24)
                            .queryParam("forecast_hours", 1)
                            .queryParam("timezone", "America/Sao_Paulo")
                            .build())
                    .retrieve()
                    .body(OpenMeteoResponse.class);

            if (response != null && response.getHourly() != null) {
                return processarResposta(municipio, response);
            }

            log.warn("Resposta vazia da API Open-Meteo para {}", municipio);
            return fallbackSeHabilitado(municipio);

        } catch (Exception e) {
            log.error("Erro ao consultar Open-Meteo para {}: {}", municipio, e.getMessage());
            return fallbackSeHabilitado(municipio);
        }
    }

    /**
     * Processa a resposta da API Open-Meteo.
     */
    private DadosChuva processarResposta(String municipio, OpenMeteoResponse response) {
        List<Double> precipitacoes = response.getHourly().getPrecipitation();

        if (precipitacoes == null || precipitacoes.isEmpty()) {
            log.warn("Sem dados de precipitação para {}", municipio);
            return fallbackSeHabilitado(municipio);
        }

        // Calcula acumulado das últimas 24h
        double acum24h = precipitacoes.stream()
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .sum();

        // Última hora (último valor)
        double acum1h = 0.0;
        if (!precipitacoes.isEmpty()) {
            Double ultimo = precipitacoes.get(precipitacoes.size() - 1);
            acum1h = ultimo != null ? ultimo : 0.0;
        }

        log.info("Open-Meteo: {} - acum24h={} mm, acum1h={} mm", municipio, round(acum24h), round(acum1h));

        return DadosChuva.builder()
                .municipio(municipio)
                .acumulado24h(round(acum24h))
                .acumulado1h(round(acum1h))
                .ultimaAtualizacao(LocalDateTime.now())
                .nivelAlerta(classificarAlerta(acum24h))
                .fonte("OPEN_METEO")
                .build();
    }

    /**
     * Retorna dados simulados se fallback estiver habilitado.
     */
    private DadosChuva fallbackSeHabilitado(String municipio) {
        if (fallbackEnabled) {
            log.info("Usando fallback simulado para {}", municipio);
            return simularDados(municipio);
        }
        throw new RuntimeException("API Open-Meteo indisponível e fallback desabilitado");
    }

    /**
     * Verifica se o cache ainda é válido.
     */
    private boolean cacheValido(String chave) {
        return cache.containsKey(chave) &&
               cacheExpira.containsKey(chave) &&
               cacheExpira.get(chave).isAfter(LocalDateTime.now());
    }

    /**
     * Normaliza chave para cache.
     */
    private String normalizar(String texto) {
        return texto.toLowerCase().trim();
    }

    // ===== Simulação (fallback) =====
    // Baseada em dados típicos da estação chuvosa da Paraíba (mar-jul).
    private DadosChuva simularDados(String municipio) {
        long seed = municipio.toLowerCase().hashCode() + System.currentTimeMillis() / (1000L * 60 * 30);
        Random rand = new Random(seed);

        // Distribuição: 60% sem chuva forte, 25% moderada, 15% forte/extrema
        double r = rand.nextDouble();
        double acum24h, acum1h;

        if (r < 0.60) {
            acum24h = rand.nextDouble() * 8;       // 0-8mm
            acum1h = acum24h * 0.3;
        } else if (r < 0.85) {
            acum24h = 10 + rand.nextDouble() * 25; // 10-35mm
            acum1h = 3 + rand.nextDouble() * 8;
        } else if (r < 0.95) {
            acum24h = 40 + rand.nextDouble() * 40; // 40-80mm
            acum1h = 8 + rand.nextDouble() * 18;
        } else {
            acum24h = 90 + rand.nextDouble() * 50; // 90-140mm (extremo)
            acum1h = 25 + rand.nextDouble() * 30;
        }

        return DadosChuva.builder()
                .municipio(municipio)
                .acumulado24h(round(acum24h))
                .acumulado1h(round(acum1h))
                .ultimaAtualizacao(LocalDateTime.now())
                .nivelAlerta(classificarAlerta(acum24h))
                .fonte("FALLBACK_SIMULADO")
                .build();
    }

    private DadosChuva.NivelAlerta classificarAlerta(double acum24h) {
        if (acum24h < 1) return DadosChuva.NivelAlerta.SEM_CHUVA;
        if (acum24h < 10) return DadosChuva.NivelAlerta.FRACA;
        if (acum24h < 30) return DadosChuva.NivelAlerta.MODERADA;
        if (acum24h < 60) return DadosChuva.NivelAlerta.FORTE;
        if (acum24h < 100) return DadosChuva.NivelAlerta.MUITO_FORTE;
        return DadosChuva.NivelAlerta.EXTREMA;
    }

    private double round(double val) {
        return Math.round(val * 10.0) / 10.0;
    }
}
