Usando jQuery con NPM
=====================

> Este ejemplo está basado en el blogpost [Using jQuery plugins with NPM](http://blog.npmjs.org/post/112064849860/using-jquery-plugins-with-npm)

## Método 1: Incluir los archivos directamente

Este enfoque se verá muy familiar, y es la más sencilla de conseguir trabajo, ya que no requiere ningún tipo de herramientas extra. Usted sólo le añade una etiqueta de script a tu HTML que utiliza la ruta completa del archivo .js como el src.

En la raíz de su directorio, cree un archivo `index.html`.
Agregue la siguiente línea al cuerpo.

```
<span class="title-tipso tipso_style" data-tipso="This is a loaded TIPSO!">Roll over to see the tip</span>
```

Añadir jQuery de una CDN. Cualquiera de los CDN hará.
```
<script src="https://code.jquery.com/jquery-2.1.3.min.js"></script>
```
Hacer que el árbol de dependencias tan plano como puede ser
```
npm dedupe
```
Porque estamos declarando todas nuestras dependencias en `package.json`, realmente no tenemos que hacer esto, pero es una buena práctica.
Añadir JavaScript del paquete Tipso
```
<script src="node_modules/tipso/src/tipso.js"></script>
```
Añadir un archivo script.js nombrados con su guión, que utiliza Tipso añadir una información sobre herramientas.
```
jQuery(function(){
  jQuery('.title-tipso').tipso();
});
```
Añadir CSS del Tipso
```
<link rel="stylesheet" href="node_modules/tipso/src/tipso.css" />
```

Abra `index.html` en el navegador y pase el cursor sobre el texto. Usted debe ver la información sobre herramientas pop-up en una burbuja.
Usted va a terminar con un documento que tiene este aspecto:
```
<!doctype html>
<html>
<head>
  <title>npm and jQuery demo</title>
  <link rel="stylesheet" href="node_modules/tipso/src/tipso.css" />
</head>
<body>
  <span class="title-tipso tipso_style" data-tipso="This is a loaded TIPSO!">Roll over to see the tip</span>

  <script src="https://code.jquery.com/jquery-2.1.3.min.js"></script>
  <script src="node_modules/tipso/src/tipso.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

#### Inconvenientes

Hay algunos inconvenientes a este método.

1. Este enfoque no es muy fácil de mantener. La dependencia que tiene Tipso en jQuery no se define en ninguna parte excepto en la cabeza del desarrollador. Si un nuevo desarrollador se enciende, o si usted se vuelve a este código de 6 meses más tarde, no va a ser obvio que hay que añadir los scripts cuando necesite cambiar la finalidad de una función en otra parte del sitio.
2. Este enfoque también no es tan eficiente como podría ser en términos de la cantidad de solicitudes que estés haciendo para los activos. Hay cuatro peticiones que se realizan aquí para obtener archivos de su guión, el Tipso JS, CSS Tipso y jQuery (aunque eso es viniendo de un CDN, por lo que es probable que sea en caché ya). La ineficiencia del manejo de cada archivo por separado no es tan obvia para una manifestación como esta, donde sólo hay unos pocos archivos, pero se convertirá en notable en un proyecto más amplio.
3. Su estructura de directorios node_modules podría cambiar. Puesto que los caminos están codificados en `index.html`, su aplicación va a romper si ejecuta la actualización NGP y directorios que nos trasladasen alrededor. Es poco probable que suceda en una aplicación simple como esto, pero es algo a tener en cuenta en los proyectos más complicados. Hay soluciones que puede utilizar para este que no vamos a cubrir aquí.


No vamos a ser capaces de fijar el número 3 hasta que hagamos mejoras en el propio plugin en el próximo artículo, pero podemos arreglar los problemas 1 y 2 mediante el uso de una herramienta llamada Browserify, que trae algunas otras ventajas también.

## Método 2: Hacer un bundle con Browserify

Browserify es una herramienta que hace que sea más fácil de usar paquetes de back-end y front-end juntos, y luego bundle todo eso JavaScript para arriba en un solo archivo que se puede incluir en tu HTML. Por ejemplo, con Browserify puede utilizar las ngraph.generators y paquetes ngraph.vivasvg para crear una animación del punto de explotar.

Además de hacer más fácil para que su código de front-end para utilizar los paquetes 127,000+ en NGP, Browserify también hace que sea más fácil para su equipo para desarrollar de forma modular, lo que mejora la estructura de su código y hace que sea más fácil de mantener. Vas a ver esto en acción en el próximo artículo.

Muchas personas no se dan cuenta de esto, pero incluso si usted está trabajando con un plugin de jQuery que no es compatible CommonJS, todavía se pueden utilizar Browserify.

### Configurando Browserify

Browserify es una herramienta de línea de comandos que se utiliza en la construcción de su proyecto. No se carga cuando se está ejecutando la aplicación. Esto significa que debe ser instalado en todo el mundo, no como una dependencia del proyecto

```
npm install -g browserify
```

Si obtiene un error que dice `EACCES`, echa un vistazo a nuestros documentos de los permisos de fijación, o simplemente ejecutar el comando con `sudo`.

### Juntando el JavaScript

En primer lugar, vamos a abrigarse el JavaScript que estamos utilizando

1. Preparar `index.html` para el cambio mediante la eliminación de las etiquetas de script y enlaces existentes, y la adición de una sola etiqueta script que hace referencia a `bundle.js`:

```
<!doctype html>
<html>
<head>
  <title>npm and jQuery demo
</head>
<body>
  <span class="title-tipso tipso_style" data-tipso="This is a loaded TIPSO!">Roll over to see the tip

  <script src="./bundle.js">
</body>
</html>
```

El archivo `bundle.js` es lo Browserify producirá para nosotros. Incluirá todos nuestros paquetes de JavaScript, además de una forma de garantizar que las dependencias se pasan correctamente a los módulos que dependen de ellos.

2. Añadir jQuery como dependencia. Esto hará más fácil de lo requieran en sus otros archivos `.js`
```
npm install --save jquery
```

> Note: You could continue to use the jQuery script tag if you wanted to, instead. We are declaring it as a dependency (and requiring it in the next step) for consistency in dependency handling, but you may want to maintian the performance benefits of a CDN-ed jQuery.

3. Cree un archivo `entry.js`.

```
global.jQuery = require('jquery');
require('tipso');

jQuery(function(){
  jQuery('.title-tipso').tipso();
});
```

Este será el punto de entrada donde Browserify se iniciará. A partir de ahí, se buscará dependencias y seguir el árbol de dependencias para ver qué código se debe incluir en bundle.js.

Es la misma que la secuencia de comandos que teníamos en `index.html` antes. Pero esta vez, en lugar de incluir jQuery y Tipso como etiquetas de secuencia de comandos separados, estamos usando la función de requerir Nodo dejar Browserify sabemos que dependemos de ellos.

Cuando se carga en el navegador, Tipso adhiere al objeto global jQuery. Sin embargo, en Node.js las variables que declaramos con var son locales al módulo, en lugar de ser global. Para Tipso a unirse, tenemos que exponer jQuery como global, por lo que vamos atribuimos al objeto global que Browserify ofrece.

4. Dile a Browserify donde puede encontrar Tipso. Para ello, agregue una key navegador interior de su `package.json`

```
"browser": {
  "tipso": "./node_modules/tipso/src/tipso.js"
}
```

> Si el archivo principal en el archivo package.json de Tipso señaló el archivo tipso.js, no necesitaríamos para hacer esto. Cubriremos esto en el próximo artículo.

5. Ejecute `browserify` para crear el `bundle.js`

```
browserify entry.js --debug > bundle.js
```

Utilizamos la bandera --debug añadir mapas fuente al archivo incluido. Esto hará que sea más fácil de depurar en la consola del navegador

Abra el archivo `index.html` y pase el cursor sobre el texto. Verá el texto pop-up, pero no va a tener el buen contorno de la burbuja. Esto se debe a que no hemos añadido el CSS de vuelta en aún.

### Agregar el CSS

La mejor práctica para el manejo de los activos de front-end, como archivos CSS, aún se está desarrollando. La comunidad ha llegado con múltiples soluciones, pero ninguna es un claro ganador. Estamos hablando a través de los problemas con proyectos en diferentes ecosistemas de front-end para averiguar las mejores estrategias para todo el mundo, y será el desarrollo de un mejor apoyo, pero por camino ahora no hay bien establecidas para hacerlo.

La forma más fácil que hemos encontrado es usar parcelify, pero también se puede encontrar diferentes enfoques que funcionan mejor para usted.

1. Instale `parcelify` globalmente
```
npm install -g parcelify
```
2. Envía parcelify donde puede encontrar la CSS que usted necesita. Para ello, agregue una key de `style` dentro de su `package.json`:

```
"style": [
  "./node_modules/tipso/src/tipso.css"
]
```

> Este es otro paso podríamos eliminar haciendo un cambio al paquete Tipso, y vamos a ver cómo en el próximo artículo.

3. Ejecute `parcelify` para crear el `bundle.css`
```
"build": "browserify entry.js --debug > bundle.js -p [ parcelify -o bundle.css ]"
```
4. Añadir un elemento de enlace para `bundle.css` de `index.html`

```
<link rel="stylesheet" href="bundle.css" />
```
5. Actualizar `index.html` y rodar sobre el texto. El CSS burbuja ha sido restaurada.

## Usar un CDN para jQuery (opcional)

En el primer enfoque, se utilizó un CDN a la fuente de jQuery. Usted puede haber notado que el segundo enfoque no hizo esto. En su lugar, se lía jQuery para arriba en el archivo bundle.js. Esto significa que bundle.js es un archivo más pesado de lo que debe ser.

Pero esto no tiene por qué ser el caso. Usted puede utilizar este método y seguir utilizando un CDN para jQuery usando una herramienta llamada [browserify-shim](https://www.npmjs.com/package/browserify-shim). No vamos a cubrir ese uso aquí, pero usted puede encontrar más información sobre él en README de browserify-shim.

## Resumiendo

En este artículo, usted aprendió cómo utilizar un plugin de jQuery que se ha publicado hasta la NGP la manera de una manera que no haga uso de características de la NGP específica o módulos CommonJS rápida y sucia.

El primer enfoque es similar a la práctica actual la mayoría de los desarrolladores, los scripts de abastecimiento directamente y hacer el seguimiento de las dependencias -que guiones dependen de que otros-en la cabeza. Este enfoque también hace más solicitudes en la red de lo que necesita, lo que hace que los tiempos de carga más lenta, y hardcodes nombres de archivo, lo que significa que si se actualiza el código de la biblioteca y los archivos se ha movido en torno a esa biblioteca, estas referencias codificadas podrían romper .

El segundo enfoque, utilizando Browserify agrupar dependencias, hizo las dependencias explict utilizando la función requerirá incluir código donde más se necesita. Esto hace que sea más fácil para un nuevo desarrollador que viene (o que en 6 meses) para entender que las secuencias de comandos se utilizan en otras partes de la aplicación. Browserify también combina los archivos JavaScript y CSS, lo que ayudará con tiempos de carga de página si tiene varios guiones y archivos CSS. Por desgracia, no nos alejamos de el problema de hardcoding nombres de archivo. Las rutas de acceso a CSS y JS de Tipso tuvieron que ser hardcoded en package.json.

Pero hay una manera de resolver este último problema. En el próximo artículo, verás cómo puede mejorar sus propios plugins para incorporar características NGP específico y hacer que su código sea más modular.

Como hemos dicho antes, hay un montón de maneras de trabajar con los activos de front-end. Si usted tiene otras soluciones que funcionan bien para usted, háganoslo saber en los comentarios o en Twitter.