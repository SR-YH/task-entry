# Notion Task PWA

PWA estática para preparar Issues destinados al repositorio privado `SR-YH/notion-task-manager`.

## Flujo

```text
Formulario PWA
  -> URL de Issue prerrellenada
  -> GitHub
  -> GitHub Actions
  -> DeepSeek
  -> Notion
```

La PWA:

- No contiene secretos.
- No llama directamente a DeepSeek ni Notion.
- Guarda el borrador únicamente en `localStorage`.
- Funciona como aplicación instalable y con soporte offline para la interfaz.
- Requiere una sesión de GitHub para confirmar el Issue en el repositorio privado.

## Desarrollo local

```powershell
python -m http.server 8080
```

Abrir `http://localhost:8080`.

## GitHub Pages

Publicar desde la rama `main`, carpeta raíz.

URL esperada:

<https://sr-yh.github.io/notion-task-pwa/>