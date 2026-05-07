package br.com.geoajuda.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Serviço de geocodificação para municípios da Paraíba.
 *
 * Utiliza mapeamento estático dos principais municípios para evitar
 * dependência de APIs externas de geocodificação.
 * Fallback para João Pessoa caso o município não seja encontrado.
 */
@Service
public class GeocodingService {

    @Getter
    @AllArgsConstructor
    public static class Coordenadas {
        private final double latitude;
        private final double longitude;
    }

    // Coordenadas dos principais municípios da Paraíba
    private static final Map<String, Coordenadas> MUNICIPIOS_PB = new ConcurrentHashMap<>();

    static {
        // Capital e região metropolitana
        MUNICIPIOS_PB.put("joao pessoa", new Coordenadas(-7.1195, -34.8450));
        MUNICIPIOS_PB.put("cabedelo", new Coordenadas(-6.9811, -34.8339));
        MUNICIPIOS_PB.put("bayeux", new Coordenadas(-7.1250, -34.9322));
        MUNICIPIOS_PB.put("santa rita", new Coordenadas(-7.1139, -34.9783));
        MUNICIPIOS_PB.put("conde", new Coordenadas(-7.2592, -34.9067));

        // Agreste e Brejo
        MUNICIPIOS_PB.put("campina grande", new Coordenadas(-7.2306, -35.8811));
        MUNICIPIOS_PB.put("guarabira", new Coordenadas(-6.8550, -35.4900));
        MUNICIPIOS_PB.put("sape", new Coordenadas(-7.0936, -35.2283));
        MUNICIPIOS_PB.put("queimadas", new Coordenadas(-7.3592, -35.9011));
        MUNICIPIOS_PB.put("esperanca", new Coordenadas(-7.0228, -35.8564));
        MUNICIPIOS_PB.put("lagoa seca", new Coordenadas(-7.1581, -35.8531));
        MUNICIPIOS_PB.put("inga", new Coordenadas(-7.2819, -35.6100));
        MUNICIPIOS_PB.put("itabaiana", new Coordenadas(-7.3286, -35.3331));

        // Sertão
        MUNICIPIOS_PB.put("patos", new Coordenadas(-7.0244, -37.2747));
        MUNICIPIOS_PB.put("sousa", new Coordenadas(-6.7592, -38.2283));
        MUNICIPIOS_PB.put("cajazeiras", new Coordenadas(-6.8900, -38.5564));
        MUNICIPIOS_PB.put("pombal", new Coordenadas(-6.7689, -37.8019));
        MUNICIPIOS_PB.put("monteiro", new Coordenadas(-7.8894, -37.1200));

        // Litoral Norte
        MUNICIPIOS_PB.put("rio tinto", new Coordenadas(-6.8044, -35.0786));
        MUNICIPIOS_PB.put("mamanguape", new Coordenadas(-6.8389, -35.1261));

        // Outros municípios relevantes
        MUNICIPIOS_PB.put("areia", new Coordenadas(-6.9661, -35.6981));
        MUNICIPIOS_PB.put("bananeiras", new Coordenadas(-6.7500, -35.6319));
        MUNICIPIOS_PB.put("picui", new Coordenadas(-6.5086, -36.3483));
        MUNICIPIOS_PB.put("sumé", new Coordenadas(-7.6714, -36.8806));
        MUNICIPIOS_PB.put("sume", new Coordenadas(-7.6714, -36.8806));
        MUNICIPIOS_PB.put("princesa isabel", new Coordenadas(-7.7350, -38.0128));
        MUNICIPIOS_PB.put("catole do rocha", new Coordenadas(-6.3431, -37.7475));
    }

    // Fallback: João Pessoa (capital)
    private static final Coordenadas FALLBACK = MUNICIPIOS_PB.get("joao pessoa");

    /**
     * Busca coordenadas para um município.
     *
     * @param municipio Nome do município
     * @return Coordenadas do município ou de João Pessoa como fallback
     */
    public Coordenadas buscarCoordenadas(String municipio) {
        if (municipio == null || municipio.isBlank()) {
            return FALLBACK;
        }

        String chaveNormalizada = normalizar(municipio);
        return MUNICIPIOS_PB.getOrDefault(chaveNormalizada, FALLBACK);
    }

    /**
     * Verifica se um município está mapeado.
     */
    public boolean municipioConhecido(String municipio) {
        if (municipio == null || municipio.isBlank()) {
            return false;
        }
        return MUNICIPIOS_PB.containsKey(normalizar(municipio));
    }

    /**
     * Normaliza o nome do município para busca.
     * Remove acentos, converte para minúsculas e trim.
     */
    private String normalizar(String texto) {
        String normalizado = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .toLowerCase()
                .trim();
        return normalizado;
    }
}
