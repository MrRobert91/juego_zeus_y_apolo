# juego_zeus_y_apolo

Juego web ligero de esquivar rayos: Zeus se mueve en la parte superior del escenario y lanza rayos hacia Apolo, que debe esquivarlos para sumar puntos.

## Caracteristicas

- Frontend puro con HTML, CSS y JavaScript, sin Node ni backend.
- Persistencia local en navegador usando `localStorage`.
- Ranking de las 10 mejores puntuaciones.
- Formulario al final de la partida si entras en el top 10.
- Controles de teclado en escritorio.
- Controles tactiles visibles solo en dispositivos moviles.
- Boton para pantalla completa.
- Docker listo para desplegar como sitio estatico con Nginx.
- Carpeta `public/assets` preparada para sustituir los placeholders por tus imagenes finales.

## Estructura

- `index.html`: interfaz del juego.
- `app.js`: logica del juego y ranking local.
- `styles.css`: estilos y responsive.
- `public/assets/`: placeholders de Zeus, Apolo, fondo y rayo.
- `Dockerfile`: imagen estatica con Nginx.

## Ejecutar en local

Abre `index.html` en un navegador o sirve la carpeta del proyecto con cualquier hosting estatico simple.

## Ejecutar con Docker

Construir imagen:

```bash
docker build -t juego-zeus-apolo .
```

Lanzar contenedor:

```bash
docker run --rm -p 8080:80 juego-zeus-apolo
```

Abrir en navegador:

```text
http://localhost:8080
```

## Persistencia de puntuaciones

Las puntuaciones se guardan solo en el navegador del jugador mediante `localStorage`. No hay backend, no hay Node y no hay fichero en servidor. Si limpias los datos del navegador o cambias de navegador/dispositivo, el ranking se pierde.

## Sustituir assets

Puedes reemplazar estos archivos manteniendo los mismos nombres:

- `public/assets/zeus.svg`
- `public/assets/apollo.svg`
- `public/assets/lightning.svg`
- `public/assets/background.svg`
