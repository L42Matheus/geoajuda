package br.com.geoajuda.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class UploadService {

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @Value("${upload.max-size-mb:5}")
    private int maxSizeMb;

    @Value("${upload.allowed-types:image/jpeg,image/png,image/webp}")
    private String allowedTypes;

    private static final List<String> ALLOWED_EXTENSIONS = List.of("jpg", "jpeg", "png", "webp");

    public String salvarArquivo(MultipartFile file) throws IOException {
        validarArquivo(file);

        String extensao = getExtensao(file.getOriginalFilename());
        String nomeUnico = UUID.randomUUID().toString() + "." + extensao;

        LocalDate hoje = LocalDate.now();
        String subDir = hoje.getYear() + "/" + String.format("%02d", hoje.getMonthValue());

        Path diretorioDestino = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(subDir);
        Files.createDirectories(diretorioDestino);

        Path arquivoDestino = diretorioDestino.resolve(nomeUnico);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, arquivoDestino, StandardCopyOption.REPLACE_EXISTING);
        }

        return "/uploads/" + subDir + "/" + nomeUnico;
    }

    private void validarArquivo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo não pode estar vazio");
        }

        long maxBytes = maxSizeMb * 1024L * 1024L;
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("Arquivo excede o tamanho máximo de " + maxSizeMb + "MB");
        }

        String contentType = file.getContentType();
        List<String> tiposPermitidos = List.of(allowedTypes.split(","));
        if (contentType == null || !tiposPermitidos.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Tipo de arquivo não permitido. Use: JPEG, PNG ou WebP");
        }

        String extensao = getExtensao(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extensao.toLowerCase())) {
            throw new IllegalArgumentException("Extensão de arquivo não permitida");
        }
    }

    private String getExtensao(String nomeArquivo) {
        if (nomeArquivo == null || !nomeArquivo.contains(".")) {
            throw new IllegalArgumentException("Arquivo deve ter uma extensão válida");
        }
        return nomeArquivo.substring(nomeArquivo.lastIndexOf('.') + 1).toLowerCase();
    }
}
