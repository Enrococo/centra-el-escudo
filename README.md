# Centra el escudo 🇪🇸

Primera versión funcional de un juego de precisión hecho con Angular 21 + TypeScript. No necesita backend ni dependencias adicionales.

## 1. Crear el proyecto Angular

```bash
npx @angular/cli@21 new centra-el-escudo --standalone --routing=false --style=css
cd centra-el-escudo
```

Copia la carpeta `src/app` de este paquete sobre la carpeta `src/app` del proyecto generado y sustituye `src/styles.css` por el incluido aquí.

## 2. Ejecutar

```bash
npm start
```

Abre la URL local que indique Angular CLI (normalmente `http://localhost:4200`).

## Cómo se juega

- Arrastra el escudo con ratón o con el dedo.
- Usa el control deslizante para cambiar su tamaño.
- Pulsa **Comprobar** para ver la puntuación.
- Pulsa **Reintentar** para empezar otra ronda.

## Modelo de referencia

El objetivo inicial usa una aproximación visual de la colocación oficial: centro del escudo a un tercio de la longitud de la bandera desde el lado del asta, centrado verticalmente y con una altura equivalente al 40 % de la altura de la bandera. La puntuación compara posición y tamaño por separado y los combina en una puntuación sobre 100.

El escudo SVG incluido es una ilustración simplificada para que la demo funcione sin recursos externos. Para una versión de publicación, conviene sustituirlo por un SVG oficial/contrastado y verificar las medidas exactas con la normativa aplicable.

## Estructura

- `src/app/app.component.ts`: estado, interacción por pointer events y cálculo de puntuación.
- `src/app/app.component.html`: interfaz.
- `src/app/app.component.css`: estilo responsive del juego.
- `src/styles.css`: estilos globales.
