public class Main {
    public static void main(String[] args) {
        CommandInterpreter interpreter = new RobustCommandInterpreter();
        String[] inputs = {
            "Abre la cámara, por favor",
            null,
            "   ",
            "ACTIVA la ayuda, por favor",
            "Quiero salir de la aplicación",
            "enciende la camára",
            "¿Qué tiempo hace hoy?",
            "no quiero salir"
        };

        for (String input : inputs) {
            String result = interpreter.detectIntent(input);
            System.out.printf("Entrada: %-34s -> %s%n",
                    input == null ? "null" : "\"" + input + "\"", result);
        }
    }
}
