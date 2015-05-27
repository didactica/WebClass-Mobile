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
- DownloadData(callback): inicia la descarga desde el servidor con los
  datos del usuario actual y guarda o actualiza los registros de la base 
  de datos local.
Metodos de apoyo:
- functions(page): Se encarga de cargar los elementos necesarios en el
  objeto global de la app (elements). Por defecto deja el objeto como un
  arreglo vacio cuando no existe una regla para la vista cargada.
- compileTemplate(page): buscar el template y compila la vista, pasando el
  objeto global para tener los datos a mostrar.