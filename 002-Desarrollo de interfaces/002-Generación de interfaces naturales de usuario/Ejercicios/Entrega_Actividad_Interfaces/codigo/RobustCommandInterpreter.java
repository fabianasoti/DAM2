import java.text.Normalizer;
import java.util.Locale;

public class RobustCommandInterpreter implements CommandInterpreter {
    @Override
    public String detectIntent(String inputText) {
        if (inputText == null || inputText.isBlank()) {
            return "EMPTY_INPUT";
        }

        String normalized = Normalizer.normalize(
                inputText.toLowerCase(Locale.ROOT).trim(),
                Normalizer.Form.NFD
        ).replaceAll("\\p{M}+", "");

        if (normalized.contains("camara")
                && (normalized.contains("abrir")
                || normalized.contains("abre")
                || normalized.contains("enciende"))) {
            return "OPEN_CAMERA";
        }
        if (normalized.contains("ayuda")) {
            return "ENABLE_HELP_MODE";
        }
        if (normalized.contains("salir")) {
            return "CLOSE_APP";
        }
        return "UNKNOWN";
    }
}
