package br.com.geoajuda.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Configuração do RestClient para a API Open-Meteo.
 * Fornece dados meteorológicos gratuitos incluindo precipitação.
 */
@Configuration
public class OpenMeteoConfig {

    @Value("${openmeteo.api.base-url:https://api.open-meteo.com/v1}")
    private String baseUrl;

    @Value("${openmeteo.api.timeout-connect-ms:5000}")
    private int connectTimeout;

    @Value("${openmeteo.api.timeout-read-ms:10000}")
    private int readTimeout;

    @Bean
    public RestClient openMeteoRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }
}
