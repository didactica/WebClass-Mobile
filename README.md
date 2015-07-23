cl.webclass.webclassmobile
Autor: Pablo Garín.
Versión: 1.0.20150527

-----------------------------
DETALLES TECNICOS.

Framework PhoneGap

- Node.js       : 0.12.2
- Cordova       : 5.0.0
- jQuery        : 1.10.2
- jQuery Mobile : 1.4.5
- HanldeBars.js : 1.0.rc.1

-----------------------------

LIBREACION DE RESPONSABILIDADES - DISCLAIMER: RELEASE OF RESPONSABILITY
-----------------------------
- Se usará alternadamente inglés como idioma de documentación, y sin notificacion previa.
- Si no entiende el comentario, favor referir a un traductor (Recomendación: https://translate.google.es/).

-----------------------------

Para compilar la app se debe instalar "node.js" (https://nodejs.org/download/),
y luego ejecutar "C:\> npm install -g phonegap". 

Para probar la app se debe ir a la carpeta donde ésta se encuentra y ejecutar "phonegap 
run <plataforma>". Por ejemplo, si deseo correr la app en un dispositivo Android, debo ejecutar 
"phonegap run android". Los APK se generan en la carpeta "platforms/android/build/output/apk". 
Estos APK están sin firma.

Estructura: La aplicacion se basa en un modelo similar a un MVC:
tiene una capa de modelos de la base de datos que se encargan de las
operaciones CRUD de la tabla a la que representa cada clase (carpeta 
www/model), una capa de vistas, la que es principalmente un compilador
de templates de JavaScript, y finalmente una capa de controlador que se
encarga de realizar la logica de negocio necesaria.

La base de datos de la app se genera a partir de los 
modelos de cada tabla y es de tipo SQLite (Web SQL). 

La aplicación tiene un objeto general llamado "elements",
el cual se encarga de almacenar los datos de la vista en uso. Estos 
datos se recogen antes de armar la vista en la clase functions. A su 
vez, la biblioteca Handlebars.js (http://handlebarsjs.com/) se encarga
de tomar los html y compilarlos con los elementos guardados en nuestro 
objeto elements.

Principales Metodos: 
---------------------
- loadPage(pagina): Se encarga de realizar todas las opciones de
  compilador de vistas la aplicación; primero llama a functions para cargar 
  desde la base de datos la informacion necesaria a nuestro objeto elements,
  luego llama al metodo compileTemplate(page). Finalmente llama a 2 metodos
  de control: refreshWidgets que se encarga de actualizar los elementos de
  las vistas de jQuery Mobile, y setListeners que se encarga de reinicializar
  los manejadores de eventos para los DOM (botones, anclas, input, etc).
- setUpDatabase(): Re-inicializa el objeto de la base de datos (FIXME).
- include(script): se encarga de incorporar a la aplicacion scripts de
  javascript a medida que se van requiriendo (disminución de tiempo de 
  carga inicial).
- downloadData(callback): inicia la descarga desde el servidor con los
  datos del usuario actual y guarda o actualiza los registros de la base 
  de datos local. El uso correcto de éste método es como se muestra a conitnuación:
<pre>downloadData(function(){
		/* modificar aca las variables globales que se deseen */
		loadPage(paginaDestino);
});</pre>

Metodos de apoyo:
---------------------
- functions(page): Se encarga de cargar los elementos necesarios en el
  objeto global de la app (elements). Por defecto deja el objeto como un
  arreglo vacio cuando no existe una regla para la vista cargada.
- compileTemplate(page): buscar el template y compila la vista, pasando el
  objeto global para tener los datos a mostrar.

Componentes:
---------------------
Estos con componentes antiguos, pero no pertenecen a una framework publico, por lo que no hay documentación de ellos.
- promptWindow(message,action,title,buttons,inputTypes): despliega una ventana de dialogo editable y configurable. Acepta 6 parametros obligatorios: mensaje, accion de respuesta al presionar un botón, titulo, texto en los botones (máximo 2) y cuadros de ingreso de datos. Al presionar un boton se devuelve un objeto con la información del dialogo, tales como valores de los campos, boton presionado, etc. Si se desea anidar dialogos, se debe realizar lo siguiente:<pre>result.remove = false;</pre>El uso correcto de éste componente es como se muestra a continuación:
<pre>
promptWindow(
		'Esto es un mensaje largo',
		function(result){
			/* la variable result trae los detalles de las acciones del dialogo */
			/* hay 2 buttonIndex: 0 y 1, donde 0 es izquierdo y 1 es derecho */
			if(result.buttonIndex==0){
				// ACCION PARA EL BOTÓN IZQUIERDO
			}
			if(result.buttonIndex==1){
				// ACCION PARA EL BOTÓN DERECHO
			}
		},
		'Titulo de Dialogo',
		['Left button','Right button'],
		[{type:'text',label:'Input de Texto',options:null},{type:'select',label:'Select',options:[{value:1,label:'primera opcion'},{value:2,lable:'segunda opcion'}]}]
);
</pre>
- createMenu(items,direction,trigger): Éste metodo crea un menú flotante con un listado de acciones (items), las cuales poseen los siguientes campos: 'text' que es el texto del botón, 'rel' que es un 'data-rel' opcional del botón, 'anchor' en caso de que queramos cambiar a otra pagina, y 'action' que es una funcion a ejecutar al presionar dicho boton. La direccion y trigger son opcionales, siempre y cuando exista un boton o ancla html llamado "menu-moreover". La dirección puede ser 0 o 1, que es izquierda o derecha respectivamente, e indica hacia que lado se abre el menu, y trigger que es un objeto DOM y representa el boton gatillante. El correcto uso es como se demuestra a continuación:
<pre>
/* por orden declaramos los items en una variable aparte, pero no es obligatorio */
var items = [
		{
			text:'Boton 1',
			rel:'',
			anchor:'#',
			action: function(){
				alert('boton 1!!!');
			}
		}
];
var dom = document.getElementById('ver-menu'); // este es el boton en el html que abre el menu
createMenu(items,1,dom)
</pre>
