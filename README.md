# Integrantes
Braulio Cambronero Murillo C38879
Bryan Salamanca Castillo C4J562

# InventarioLab
Aplicación móvil desarrollada con **Apache Cordova** para la gestión de inventario de equipos de laboratorio y consulta de proveedores técnicos.

## Requisitos previos
- Node.js (LTS) y npm
- Apache Cordova CLI (`npm install -g cordova`)
- Para Android: JDK 17 y Android SDK (Build-Tools 33.0.2)

## Instalación y ejecución

### En navegador (entorno de pruebas de Cordova)
```bash
npm install
cordova platform add browser
cordova run browser
```

### Generar APK para Android
```bash
npm install
cordova platform add android
cordova build android
```
El archivo compilado se genera en:
`platforms/android/app/build/outputs/apk/debug/app-debug.apk`

## Estructura del proyecto
```text
inventario-cordova/
├── config.xml
├── package.json
├── README.md
└── www/
    ├── index.html
    ├── css/index.css
    ├── js/index.js
    └── data/productos_prueba.json
```

## Limitaciones
- Los registros del inventario se guardan de forma local en `localStorage`.
- Para conectar con un backend Django local desde un emulador Android, se debe utilizar `http://10.0.2.2:8000/...` y habilitar CORS en el servidor.
