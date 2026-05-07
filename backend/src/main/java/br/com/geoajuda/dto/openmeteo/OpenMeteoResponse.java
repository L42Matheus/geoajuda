package br.com.geoajuda.dto.openmeteo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * DTO para deserialização da resposta da API Open-Meteo.
 *
 * Exemplo de resposta:
 * {
 *   "latitude": -7.12,
 *   "longitude": -34.84,
 *   "hourly": {
 *     "time": ["2024-01-15T00:00", "2024-01-15T01:00", ...],
 *     "precipitation": [0.0, 0.5, 1.2, ...]
 *   }
 * }
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenMeteoResponse {

    private Double latitude;
    private Double longitude;

    @JsonProperty("generationtime_ms")
    private Double generationTimeMs;

    @JsonProperty("utc_offset_seconds")
    private Integer utcOffsetSeconds;

    private String timezone;

    @JsonProperty("timezone_abbreviation")
    private String timezoneAbbreviation;

    private Double elevation;

    @JsonProperty("hourly_units")
    private HourlyUnits hourlyUnits;

    private Hourly hourly;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class HourlyUnits {
        private String time;
        private String precipitation;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Hourly {
        private List<String> time;
        private List<Double> precipitation;
    }
}
