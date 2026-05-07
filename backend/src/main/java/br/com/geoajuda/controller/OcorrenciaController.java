package br.com.geoajuda.controller;

import br.com.geoajuda.dto.OcorrenciaDTO.*;
import br.com.geoajuda.service.OcorrenciaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ocorrencias")
@RequiredArgsConstructor
@Tag(name = "Ocorrências", description = "Endpoints para gerenciamento de ocorrências de desastres")
public class OcorrenciaController {

    private final OcorrenciaService service;

    @Operation(summary = "Registrar nova ocorrência", description = "Cria uma nova ocorrência de desastre no sistema")
    @PostMapping
    public ResponseEntity<PublicaResponse> criar(@Valid @RequestBody CriarRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @Operation(summary = "Listar ocorrências", description = "Lista todas as ocorrências públicas, opcionalmente filtradas por município")
    @GetMapping
    public ResponseEntity<List<PublicaResponse>> listar(
        @Parameter(description = "Filtrar por nome do município") @RequestParam(required = false) String municipio
    ) {
        if (municipio != null && !municipio.isBlank()) {
            return ResponseEntity.ok(service.listarPorMunicipio(municipio));
        }
        return ResponseEntity.ok(service.listarPublicas());
    }

    @Operation(summary = "Buscar ocorrências próximas", description = "Busca ocorrências dentro de um raio (em metros) de uma coordenada")
    @GetMapping("/proximas")
    public ResponseEntity<List<PublicaResponse>> proximas(
        @Parameter(description = "Latitude", required = true) @RequestParam double lat,
        @Parameter(description = "Longitude", required = true) @RequestParam double lng,
        @Parameter(description = "Raio em metros (padrão: 1000)") @RequestParam(defaultValue = "1000") double raio
    ) {
        return ResponseEntity.ok(service.listarProximas(lat, lng, raio));
    }

    @Operation(summary = "Atualizar status", description = "Atualiza o status de uma ocorrência (uso administrativo)")
    @PatchMapping("/{id}/status")
    public ResponseEntity<PublicaResponse> atualizarStatus(
        @Parameter(description = "ID da ocorrência") @PathVariable Long id,
        @Valid @RequestBody AtualizarStatusRequest req
    ) {
        return ResponseEntity.ok(service.atualizarStatus(id, req));
    }
}
