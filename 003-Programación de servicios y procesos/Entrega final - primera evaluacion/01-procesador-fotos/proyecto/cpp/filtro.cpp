// Versión en C++ del procesador de fotos: la misma tarea que la página web, desde la línea de comandos.
// Aplica un filtro a todas las fotos de una carpeta y mide el tiempo con 1, 2, 4 y 8 hilos.
// El reparto de fotos entre hilos lo hace OpenMP.
//
// Instalar librerías: sudo apt install libopencv-dev pkg-config
// Compilar: g++ -O2 -fopenmp filtro.cpp -o filtro $(pkg-config --cflags --libs opencv4)
//
// Ejecutar: ./filtro <filtro> <repeticiones> <carpeta con fotos> [guardar]
// Ejemplo:  ./filtro negativo 200 ../fotos
// Filtros:  grises, sepia, negativo, brillo
// Si se añade "guardar", las fotos filtradas se guardan en la carpeta "salida"

#include <opencv2/opencv.hpp>
#include <omp.h>
#include <iostream>
#include <iomanip>
#include <vector>
#include <string>
#include <algorithm>
#include <filesystem>

using namespace std;
using namespace cv;
namespace fs = std::filesystem;


// ---------------------------------------------
// Filtros: son los mismos que en filtros.js
// OpenCV guarda los colores en orden B, G, R (azul, verde, rojo)
// ---------------------------------------------

// Mantiene un valor entre 0 y 255
unsigned char limitar(double valor){
    if(valor < 0)   { return 0; }
    if(valor > 255) { return 255; }
    return (unsigned char)(valor + 0.5);
}

void grises(Mat& imagen){
    unsigned char* pixeles = imagen.data;
    long total = (long)imagen.rows * imagen.cols;

    for(long i = 0; i < total; i++){
        unsigned char* p = pixeles + i * 3;   // p[0]=B, p[1]=G, p[2]=R
        unsigned char gris = limitar(p[2] * 0.299 + p[1] * 0.587 + p[0] * 0.114);
        p[0] = gris;
        p[1] = gris;
        p[2] = gris;
    }
}

void sepia(Mat& imagen){
    unsigned char* pixeles = imagen.data;
    long total = (long)imagen.rows * imagen.cols;

    for(long i = 0; i < total; i++){
        unsigned char* p = pixeles + i * 3;
        double b = p[0];
        double g = p[1];
        double r = p[2];

        p[2] = limitar(r * 0.393 + g * 0.769 + b * 0.189);
        p[1] = limitar(r * 0.349 + g * 0.686 + b * 0.168);
        p[0] = limitar(r * 0.272 + g * 0.534 + b * 0.131);
    }
}

void negativo(Mat& imagen){
    unsigned char* pixeles = imagen.data;
    long total = (long)imagen.rows * imagen.cols * 3;

    for(long i = 0; i < total; i++){
        pixeles[i] = 255 - pixeles[i];
    }
}

void brillo(Mat& imagen){
    unsigned char* pixeles = imagen.data;
    long total = (long)imagen.rows * imagen.cols * 3;

    for(long i = 0; i < total; i++){
        pixeles[i] = limitar(pixeles[i] + 50);
    }
}

// Aplica el filtro que se pida por nombre. Devuelve false si no existe.
bool aplicarFiltro(const string& nombre, Mat& imagen){
    if(nombre == "grises")   { grises(imagen);   return true; }
    if(nombre == "sepia")    { sepia(imagen);    return true; }
    if(nombre == "negativo") { negativo(imagen); return true; }
    if(nombre == "brillo")   { brillo(imagen);   return true; }
    return false;
}


// ---------------------------------------------
// Programa principal
// ---------------------------------------------
int main(int argc, char* argv[]){

    // 1. Compruebo los argumentos
    if(argc < 4){
        cout << "Uso: ./filtro <filtro> <repeticiones> <carpeta con fotos> [guardar]" << endl;
        cout << "Filtros: grises, sepia, negativo, brillo" << endl;
        return 1;
    }

    string nombreFiltro = argv[1];
    int repeticiones = max(1, atoi(argv[2]));
    string carpeta = argv[3];
    bool guardar = (argc >= 5 && string(argv[4]) == "guardar");

    if(nombreFiltro != "grises" && nombreFiltro != "sepia" &&
       nombreFiltro != "negativo" && nombreFiltro != "brillo"){
        cout << "El filtro '" << nombreFiltro << "' no existe." << endl;
        return 1;
    }

    // 2. Leo todas las fotos de la carpeta (jpg, jpeg y png)
    vector<string> nombres;

    if(!fs::is_directory(carpeta)){
        cout << "No encuentro la carpeta: " << carpeta << endl;
        return 1;
    }

    for(const auto& entrada : fs::directory_iterator(carpeta)){
        string extension = entrada.path().extension().string();
        transform(extension.begin(), extension.end(), extension.begin(), ::tolower);

        if(extension == ".jpg" || extension == ".jpeg" || extension == ".png"){
            nombres.push_back(entrada.path().string());
        }
    }
    sort(nombres.begin(), nombres.end());

    vector<Mat> originales;
    vector<string> nombresValidos;

    for(const string& ruta : nombres){
        Mat imagen = imread(ruta, IMREAD_COLOR);
        if(imagen.empty()){
            cout << "No he podido leer: " << ruta << endl;
        }else{
            originales.push_back(imagen);
            nombresValidos.push_back(fs::path(ruta).stem().string());
        }
    }

    if(originales.empty()){
        cout << "No hay fotos en la carpeta." << endl;
        return 1;
    }

    int total = (int)originales.size();

    cout << total << " fotos, filtro " << nombreFiltro << ", "
         << repeticiones << " repeticiones" << endl;
    cout << "Tu equipo tiene " << omp_get_num_procs() << " núcleos" << endl << endl;

    // 3. Mido el tiempo con 1, 2, 4 y 8 hilos
    int cantidades[] = {1, 2, 4, 8};
    double tiempos[4];
    vector<Mat> resultados(total);

    for(int c = 0; c < 4; c++){

        int hilos = cantidades[c];
        double inicio = omp_get_wtime();

        // OpenMP reparte las fotos entre los hilos.
        // schedule(dynamic): cada hilo coge la siguiente foto cuando acaba la suya
        // (igual que la cola de fotos de la página web)
        #pragma omp parallel for num_threads(hilos) schedule(dynamic)
        for(int i = 0; i < total; i++){
            for(int r = 0; r < repeticiones; r++){
                resultados[i] = originales[i].clone();   // parto siempre de la original
                aplicarFiltro(nombreFiltro, resultados[i]);
            }
        }

        tiempos[c] = (omp_get_wtime() - inicio) * 1000;   // en milisegundos
    }

    // 4. Muestro la tabla (mismas columnas que la página web)
    cout << "| Hilos | Tiempo (ms) | Mejora | Eficiencia |" << endl;
    cout << "|---|---|---|---|" << endl;

    for(int c = 0; c < 4; c++){
        double mejora = tiempos[0] / tiempos[c];
        double eficiencia = mejora / cantidades[c] * 100;

        cout << "| " << cantidades[c]
             << " | " << fixed << setprecision(0) << tiempos[c]
             << " | " << setprecision(2) << mejora << "×"
             << " | " << setprecision(0) << eficiencia << " % |" << endl;
    }

    // 5. Si se pide, guardo las fotos filtradas (fuera de la medición)
    if(guardar){
        fs::create_directories("salida");
        for(int i = 0; i < total; i++){
            imwrite("salida/" + nombresValidos[i] + "-" + nombreFiltro + ".jpg", resultados[i]);
        }
        cout << endl << total << " fotos guardadas en la carpeta salida" << endl;
    }

    return 0;
}
