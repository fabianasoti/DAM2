# Fabiana Sotillo | interfaz integrada · UD2 · Interfaces naturales

Iteración sobre `003-UD1-completa` que añade tres interfaces naturales mediante un **asistente flotante**:

| Interfaz natural | Tecnología | Qué hace |
|---|---|---|
| Lenguaje natural | Ollama (`phi3:mini`) vía `ollama.php` | La petición escrita se responde en Markdown y se pinta en el escenario. |
| Voz a texto | Web Speech API · `SpeechRecognition` | El botón 🎤 dicta la petición (`es-ES`). |
| Texto a voz | Web Speech API · `SpeechSynthesis` | «Hablar respuesta» lee la respuesta; `Esc` la detiene. |

La ventana se arrastra desde su barra, se minimiza con «—» y se redimensiona desde la esquina.

## Ejecutarlo

```bash
ollama pull phi3:mini
php -S localhost:8000
```

Abre `http://localhost:8000` en Chrome o Edge (Firefox no tiene `SpeechRecognition`).

## Novedades

- `ollama.php`: puente navegador → Ollama.
- `index.html`: bloque `#fsAsistente` y enlace «Ejercicios UD2» en la cabecera.
- `css/estilo.css`: sección 16b (asistente, interruptor, respuesta Markdown) con los tokens de mi manual de identidad.
- `js/componentes.js`: clases `MarkdownIU`, `VozIU` y `AsistenteIU` en `fs.iu`.
- `ejercicios/`: 11 ejercicios de cuerpo (MediaPipe) y 8 de realidad aumentada (A-Frame), con mi paleta, Inter y mi monograma. Índice en `http://localhost:8000/ejercicios/`. Necesitan cámara; los avatares usan además micrófono y `../../ollama.php`.
