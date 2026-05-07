package br.com.geoajuda.controller;

import br.com.geoajuda.service.ServicoChuva;
import br.com.geoajuda.service.ServicoChuva.DadosChuva;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chuva")
@RequiredArgsConstructor
@Tag(name = "Dados Pluviométricos", description = "Consulta de dados de chuva (Open-Meteo)")
public class ChuvaController {

    private final ServicoChuva servicoChuva;

    @Operation(summary = "Consultar dados de chuva", description = "Retorna dados pluviométricos acumulados do município (fonte: Open-Meteo API, com fallback simulado)")
    @GetMapping
    public ResponseEntity<DadosChuva> consultar(
        @Parameter(description = "Nome do município", required = true) @RequestParam String municipio
    ) {
        return ResponseEntity.ok(servicoChuva.consultarPorMunicipio(municipio));
    }
}
