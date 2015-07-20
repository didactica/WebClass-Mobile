/* https://github.com/pablogarin/WebClass-Mobile.git
* 
* cl.webclass.webclassmobile
* Autor: Pablo Garín.
* Versión: 1.0.20150527
*
* ----- DETALLES TECNICOS -----
* Framework PhoneGap
* - Node.js       : 0.12.2
* - Cordova       : 5.0.0
* - jQuery        : 1.10.2
* - jQuery Mobile : 1.4.5
* - HanldeBars.js : 1.0.rc.1
* -----------------------------
*
* Estructura: La aplicacion se basa en un modelo similar a un MVC:
* tiene una capa de modelos de la base de datos que se encargan de las
* operaciones CRUD de la tabla a la que representa cada clase (carpeta 
* www/model), una capa de vistas, la que es principalmente un compilador
* de templates de JavaScript, y finalmente una capa de controlador que se
* encarga de realizar la logica de negocio necesaria.
*
* La base de datos de la app se genera a partir de los 
* modelos de cada tabla y es de tipo SQLite (Web SQL). 
* 
* La aplicación tiene un objeto general llamado "elements",
* el cual se encarga de almacenar los datos de la vista en uso. Estos 
* datos se recogen antes de armar la vista en la clase functions. A su 
* vez, la biblioteca Handlebars.js (http://handlebarsjs.com/) se encarga
* de tomar los html y compilarlos con los elementos guardados en nuestro 
* objeto elements.
* 
* Principales Metodos: 
* - loadPage(pagina): Se encarga de realizar todas las opciones de
*   compilador de vistas la aplicación; primero llama a functions para cargar 
*   desde la base de datos la informacion necesaria a nuestro objeto elements,
*   luego llama al metodo compileTemplate(page). Finalmente llama a 2 metodos
*   de control: refreshWidgets que se encarga de actualizar los elementos de
*   las vistas de jQuery Mobile, y setListeners que se encarga de reinicializar
*   los manejadores de eventos para los DOM (botones, anclas, input, etc).
* - setUpDatabase(): Re-inicializa el objeto de la base de datos (FIXME).
* - include(script): se encarga de incorporar a la aplicacion scripts de
*   javascript a medida que se van requiriendo (disminución de tiempo de 
*   carga inicial).
* - DownloadData(callback): inicia la descarga desde el servidor con los
*   datos del usuario actual y guarda o actualiza los registros de la base 
*   de datos local.
* Metodos de apoyo:
* - functions(page): Se encarga de cargar los elementos necesarios en el
*   objeto global de la app (elements). Por defecto deja el objeto como un
*   arreglo vacio cuando no existe una regla para la vista cargada.
* - compileTemplate(page): buscar el template y compila la vista, pasando el
*   objeto global para tener los datos a mostrar.
* TENER CUIDADO CON:
* - La aplicación está pensada para funcionar con o sin internet, por lo que 
*   cualquier join que se haga al seleccionar valores de la base de datos debe
*   ser del tipo left join para que llene con null en el caso de no encontrar
*   la referencia, y luego dentro del codigo delegar al modelo la busqueda de
*   ese usuario y grabarlo en la base de datos para uso futuro.
*/
// HEADER START
include('js/SQLHelper.js');
include('model/Evento.js');
include('model/Planificacion.js');
include('model/Sector.js');
include('model/Clase.js');
include('model/ClaseDetalle.js');
include('model/Nivel.js');
include('model/Sector_Grupo.js');
include('model/Usuario.js');
include('model/Alumno.js');
include('model/Asistencia.js');
include('model/Curso.js');
include('model/DetalleUsuario.js');
include('js/md5.js');

document.addEventListener("deviceready",onDeviceReady,false);
document.addEventListener("backbutton",backButton, false);

var urlWS = "http://proyecto.webescuela.cl/sistema/testing/mobile";
//var urlWS = "http://didactica.pablogarin.cl/mobile";
var sql;
var user;
var token;
var historyStack = [];
var current;
var elements = [];
var tables = ['evento','sector','sector_grupo','unidad','clase','clase_detalle','nivel','curso','alumno','alumno_asistencia','usuario','usuario_detalle'];
var curDate;
var months = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
var days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
var alertUp = false;
var sequence = 0;
var downloaded = false;
var where;
var lastObject = [];
var d = new Date();
var year = d.getFullYear();
var curMonth = d.getMonth()+1;
var tableIndex = 0;
var lastId = 0;
var syncSize = 0;
var totalSyncs = 0;
var inserts = {};
var menuOpen = false;
var changing = false;
var touchOffsetX = 0;
var touchOffsetY = 0;
var go = false;
var changing = false;
var asistencia = {};
var editAsistencia = false;
var transferConectionSize = 200; // CANTIDAD DE REGISTROS POR CONEXION.
/*
var transferInterval = setInterval(function(){
    if( (typeof navigator.connection!='undefined') && (navigator.connection.type!=Connection.NONE) ){
        syncToServer();
        getTableFromServer(function(){
            var d = new Date();
            console.log('update: '+d.toLocaleTimeString());
        });
    }
},60000);
//*/

$.event.special.swipe.scrollSupressionThreshold = 10; // More than this horizontal displacement, and we will suppress scrolling.
$.event.special.swipe.horizontalDistanceThreshold = 30; // Swipe horizontal displacement must be more than this.
$.event.special.swipe.durationThreshold = 500;  // More time than this, and it isn't a swipe.
$.event.special.swipe.verticalDistanceThreshold = 75;

$.mobile.filterable.prototype.options.filterCallback = filtrarPlanificaciones;
// HEADER END
// IMPLEMENTATION START
function onDeviceReady()
{
    setUpDatabase();
    var date = new Date();
    var year = date.getFullYear()
    var month = date.getMonth()+1;
    var day = date.getDate();
    if( month<10 ){
        month = String('0'+month);
    } else {
        month = String(month);
    }
    if(day<10){
        day = String("0"+day);
    } else {
        day = String(day);
    }
    curDate = {'y':year,'m':month,'d':day};
    user = window.localStorage.getItem("user");
    sequence = window.localStorage.getItem('sequence');
    if( sequence==null ){
        sequence = 0;
    }
    //$.mobile.defaultPageTransition = "slide";
    $(".menuItem").off("click");
    $(".menuItem").on("click",function(ev){
        ev.preventDefault();
        $.mobile.loading('show',{text: "Cargando...",textVisible: true,theme: "z",html: ""});
        loadPage($(this).attr('template'));
    });
    $("#backButton").off("click");
    $("#backButton").on("click",function(ev){
        ev.preventDefault();
        backButton();
    });
    if(user == null){
        $("#nav-header").hide();
        loadPage('login');
    } else {
        downloadData(function(){
            token = window.localStorage.getItem("token");
            loadPage('home');
        });
    }
}
function setUpDatabase(){
    sql = window.openDatabase("WebClassMobile", "1.0", "WebClass Educational Suite Mobile", 1024*1024*10);
}
function functions(title,callback){
    switch(title){
        case 'lista-asistencia':
            var curso = elements.curso;
            var dia = elements.dia;
            var mes = elements.mes;
            elements = {};
            var d = new Date(Date.UTC(year,mes,1));
            if( parseInt(dia) >= d.getDate() ){
                elements.next = false;
            } else {
                elements.next = true;
            }
            if( parseInt(dia) <= 1 ){
                elements.prev = false;
            } else {
                elements.prev = true;
            }
            elements.fecha = {'formated': (dia+' de '+months[parseInt(mes)]+', '+year),dia:dia, mes:mes };
            $.mobile.loading('show').promise().done(function(){
                if(isNaN(curso)){
                    backButton();
                } else {
                    setUpDatabase();
                    sql.transaction(
                        function(tx){
                            var hoy = year+'-'+(mes<10?'0'+parseInt(mes):mes)+'-'+(dia<10?'0'+parseInt(dia):dia);
                            var qCurso = "SELECT * FROM curso WHERE id='"+curso+"'";
                            tx.executeSql(
                                qCurso,
                                [],
                                function(tx,result){
                                    if( result.rows!=null && result.rows.length>0 ){
                                        var res = result.rows.item(0);
                                        elements.curso = res;
                                    }
                                },
                                function(tx,err){
                                    if( typeof console !== 'undefiend' ){
                                        console.log(JSON.stringify(err));
                                    }
                                }
                            );
                            var asistenciaAlumnos = {};
                            tx.executeSql(
                                "SELECT * FROM alumno_asistencia WHERE id_curso='"+curso+"' AND fecha='"+hoy+"'",
                                [],
                                function(tx,result){
                                    if( result.rows!=null && result.rows.length>0 ){
                                        for(var i=0;i<result.rows.length;i++){
                                            var cur = result.rows.item(i);
                                            // usar campo id de la tabla alumno.
                                            asistencia[(cur.id_alumno)] = cur;
                                            var estado = '';
                                            var icon = '';
                                            switch(cur.estado){
                                                case 0:
                                                    estado = 'presente';
                                                    icon = 'fa-check';
                                                    break;
                                                case 1:
                                                    estado = 'ausente';
                                                    icon = 'fa-remove';
                                                    break;
                                                case 2:
                                                    if(cur.estadoFinal==1){
                                                        estado = 'presente'; 
                                                    }
                                                    if(cur.estadoFinal==0){
                                                        estado = 'ausente'; 
                                                    }
                                                    icon = 'fa-clock-o';
                                                    break;
                                                default:
                                                    estado = 'sinconfirmar';
                                                    icon = 'fa-question';
                                            }
                                            asistenciaAlumnos[cur.id_alumno] = {estado:estado,icon:icon};
                                        }
                                    }
                                },
                                function(tx,error){
                                    if( typeof console !== 'undefiend' ){
                                        console.log(error);
                                    }
                                }
                            );
                            elements.alumnos = [];
                            var query = "SELECT *, a.id as realId FROM alumno a LEFT JOIN usuario_detalle u ON a.alumno=u.idusuario WHERE a.estado=1 AND a.habilitado=1 AND a.curso='"+curso+"' AND a.alumno in (SELECT id FROM usuario WHERE visible=1) ORDER BY u.apellido_paterno";
                            tx.executeSql(
                                query,
                                [],
                                function(tx,res){
                                    var counter = 0;
                                    if( (res.rows!=null) && (res.rows.length>0) ){
                                        for(var i=0;i<res.rows.length;i++){
                                            var cur = res.rows.item(i);
                                            //*
                                            // usar campo id de la tabla alumno.
                                            if( typeof asistencia[(cur.realId)] === 'undefined' ){
                                                asistencia[(cur.realId)] = null;
                                            }
                                            //*/
                                            var resObj = asistenciaAlumnos[cur.realId];
                                            if( typeof resObj == 'undefined' ){
                                                if(editAsistencia){
                                                    resObj = {estado:'presente',icon:'fa-check'}
                                                } else {
                                                    resObj = {estado:'sinconfirmar',icon:'fa-question'}
                                                }
                                            }
                                            cur.class = resObj.estado;
                                            cur.icon = resObj.icon;
                                            var alumno = new Alumno(null,null,null,cur);
                                            elements.alumnos.push(alumno);
                                        }

                                    }
                                    callback();
                                },
                                function(arg1, arg2){
                                    if( typeof console !== 'undefiend' ){
                                        console.log("arg1: "+JSON.stringify(arg1));
                                        console.log("arg2: "+JSON.stringify(arg2));
                                    }
                                    callback();
                                }
                            );
                        }
                    );
                }
                
            });
            break;
        case 'asistencia':
            var d = new Date();
            tmp = [];
            for(var i in months){
                tmp.push(months[i]);
            }
            tmp.splice(0,1);
            elements.months = [];
            for(var k in tmp){
                var monthNumber = parseInt(k)+1;
                if(monthNumber<10){
                    monthNumber = '0'+monthNumber;
                } else {
                    monthNumber = String(monthNumber);
                }
                var curr = {'key':monthNumber,'month':tmp[k]};
                elements.months.push(curr);
            }
            setUpDatabase();
            sql.transaction(
                function(tx){
                    tx.executeSql(
                        "SELECT nombre,MAX(id) as id FROM curso GROUP BY nombre",
                        [],
                        function(tx,res){
                            elements.cursos = [];
                            if( res && res.rows && res.rows.length>0 ){
                                for(var i = 0; i<res.rows.length; i++){
                                    var curObj = res.rows.item(i);
                                    elements.cursos.push({'label':curObj.nombre,'value':curObj.id})
                                }
                            }
                            callback();
                        },
                        function(tx,err){
                            if( typeof console !== 'undefiend' ){
                                console.log(JSON.stringify(err.message));
                            }
                            callback();
                        }
                    );
                }
            );
            break;
        case 'planificacion':
            if( (typeof where == 'undefined') || (where==null) || (where.length==0) ){
                where = "1=1";
            }
            $.mobile.loading('show',{text: "Leyendo Base de Datos...",textVisible: true,theme: "z",html: ""});
            var selectQuery = "SELECT "+
                    "ulj.*,"+
                    "n.nombre AS nivelNombre, "+
                    "(SELECT COUNT(1) AS totalClases FROM clase WHERE clase.unidad=ulj.id and clase.ejecucion=1) as clasesTerminadas " +
                " FROM (SELECT " + 
                        "u.*, " +
                        "s.nombre as sectorNombre " + 
                    " FROM " + 
                        " unidad u " + 
                    " LEFT OUTER JOIN " + 
                        " sector s " + 
                    " ON " + 
                        " u.sector = s.id " + 
                    " WHERE " + 
                        where + // debug only
                    " ORDER BY " + 
                        "u.fechaini desc) ulj " + 
                " LEFT OUTER JOIN " + 
                    " nivel n " + 
                " ON " + 
                    " n.id = ulj.nivel";
            setUpDatabase();
            sql.transaction(
                function(tx){
                    tx.executeSql(
                        selectQuery,
                        [],
                        function(tx,res){
                            elements = [];
                            if( res!=null && res.rows!=null ){
                                elements.unidades = [];
                                for(var i = 0; i<res.rows.length;i++){
                                    var obj = new Planificacion(tx,null,null,res.rows.item(i));
                                    elements.unidades.push(obj);
                                }
                            }
                        }
                    );
                    tx.executeSql(
                        "SELECT DISTINCT(nombre) FROM nivel ORDER BY orden",
                        [],
                        function(tx,res){
                            elements.niveles = [];
                            if( res && res.rows && res.rows.length>0 ){
                                for(var i = 0; i<res.rows.length; i++){
                                    var curObj = res.rows.item(i);
                                    elements.niveles.push({'label':curObj.nombre,'value':normalize(curObj.nombre)})
                                }
                            }
                        },
                        function(tx,err){
                            if( typeof console !== 'undefiend' ){
                                console.log(JSON.stringify(err.message));
                            }
                        }
                    );
                    tx.executeSql(
                        "SELECT DISTINCT(nombre) FROM sector_grupo",
                        [],
                        function(tx,res){
                            elements.sectores = [];
                            if( res && res.rows && res.rows.length>0 ){
                                for(var i = 0; i<res.rows.length; i++){
                                    var curObj = res.rows.item(i);
                                    elements.sectores.push({'label':curObj.nombre,'value':normalize(curObj.nombre)})
                                }
                            }
                            callback();
                        },
                        function(tx,err){
                            if( typeof console !== 'undefiend' ){
                                console.log(JSON.stringify(err.message));
                            }
                        }
                    );
                },
                function(tx,error){
                    if( typeof console !== 'undefiend' ){
                        console.log("Error:"+tx.message);
                    }
                    callback();
                }
            );
            break;
        case 'home':
            $.mobile.loading('show',{text: "Leyendo Base de Datos...",textVisible: true,theme: "z",html: ""});
            var userData = JSON.parse(window.localStorage.getItem('userData'));
            $("#nombreUsuario").html(userData.nombre_usuario+' '+userData.apellido_paterno);
            (new SQLHelper()).queryDB(
                "SELECT * FROM evento ORDER BY fechaini",
                [],
                function(tx,res){
                    var tmp = {};
                    if( res!=null && res.rows!=null ){
                        for(var i = 0; i<res.rows.length;i++){
                            var obj = res.rows.item(i);
                            var month = obj.fechaini.split('/');
                            if( String(month[1])==String(curDate.m) && String(month[2])==String(curDate.y) ){
                                if(tmp[month[1]+'/'+month[2]]==null){
                                    tmp[month[1]+'/'+month[2]] = [];
                                }
                                if(tmp[month[1]+'/'+month[2]][month[0]+'/'+month[1]+'/'+month[2]]==null){
                                    tmp[month[1]+'/'+month[2]][month[0]+'/'+month[1]+'/'+month[2]] = {
                                        'titulo':month[0]+'/'+month[1]+'/'+month[2],
                                        'eventos':[]
                                    };
                                }
                                tmp[month[1]+'/'+month[2]][month[0]+'/'+month[1]+'/'+month[2]].eventos.push(obj);
                            }
                        }
                    }
                    var today = curDate.m+'/'+curDate.y;
                    elements = {eventos:[]};
                    for(var id in tmp[today]){
                        elements.eventos.push(tmp[today][id]);
                    }
                    callback();
                },
                function(tx,error){
                    if( typeof console !== 'undefiend' ){
                        console.log("Error:"+error.message);
                    }
                    callback();
                }
            );
            break;
        case 'unidad':
            callback();
            break;
        default:
            if( typeof elements == 'undefined' || elements == null ){
                elements = [];   
            }
            callback();
            break;
    }
}
function loadPage(page){
    $("#menu_lateral").panel('close');
    if(current!=page){
        current = page;
        /* no borrar, se puede reutilizar más adelante dependiendo de las necesidades futuras.
        for(var id in historyStack){
            if( historyStack[id]==current ){ 
                historyStack = historyStack.slice(0,id);
                break;
            }
        }
        //*/
        $("#contenido").html("");
        functions(page,function(){
            historyStack.push(page);
            setTitle(page);
            $("#contenido").html(compileTemplate(page));
            $.mobile.loading('hide');
            refreshWidgets(page);
            setListeners();
        });
    } else {
        $.mobile.loading('hide');
    }
}
function setTitle(page){
    var title = page;
    switch(page){
        case 'lista-asistencia':
            title = "Asistencia";
            break;
        case 'asistencia':
            title = "Asistencia";
            break;
        case 'unidad':
            title = elements.nombre;
            break;
        case 'verunidad':
            title = "Detalle Unidad";
            break
        case 'home':
            title = "Calendario";
            break;
        default:
            if( typeof elements.title != 'undefined' ){
                title = elements.title;
            } else {
                title = page;
            }
            break;
    }
    // Es un titulo, por lo tanto debe ir cada palabra capitalizada.
    if( typeof title == 'undefined' ){
        title = "WebClass";
    }
    var words = title.split(' ');
    title = '';
    for(var i in words){
        var t = words[i];
        t = capitalize(t);
        title += t+' ';
    }
    $("#header-title").html(title);
}
function backButton(){
    if( $( ".ui-page" ).jqmData( "panel" ) === "open" ){
        $("#menu_lateral").panel('close');
    } else if( $("#menu-moreover").length>0 ) {
        $("#menu-moreover").remove();
    } else if($("#background-blur").css('display')=='block'){
        $("#background-blur").remove();
    } else {
        if(historyStack.length>1){
            $.mobile.loading('show').promise().done(function(){
                if(editAsistencia){
                    editAsistencia = false;
                }
                historyStack.pop();
                var last = historyStack.pop();
                if(typeof last != 'undefined'){
                    if(lastObject.length>0){
                        elements = lastObject.pop();
                    }
                    loadPage(last);
                }
            });
        } else {
            if(!alertUp){
                alertUp = true;
                navigator.notification.confirm(
                    '¿Seguro desea salir de la aplicación?',
                    function(index){
                        alertUp = false;
                        switch(index){
                            case 2:
                                navigator.app.exitApp();
                                break;
                        }
                    },
                    'Salir',
                    ['Cancelar','Aceptar']
                );
            }
        }
    }
}
function refreshWidgets(page){
    $("#nav-header").show();
    $("#backButton").show();
    $("#nav-more").hide();
    $(".ui-page").trigger('create');
    $( document ).on("swipeleft",function(ev){
        if( $( ".ui-page" ).jqmData( "panel" ) !== "open" ){
            $("#menu_lateral").panel('open');
        }
    });
    $('html, body').animate({scrollTop: 0}, 300);
    // OJO!! puede dejar la cagaa esta leserita.
    //*
    $('html').off("click");
    $("html").on("click",function(e){
        var x;
        var y;
        if (e.pageX || e.pageY) { 
          x = e.pageX;
          y = e.pageY;
        }
        else { 
          x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
          y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
        } 
        var menu = document.getElementById('menu-moreover');
        if(menu != null){
            x -= menu.offsetLeft;
            y -= menu.offsetTop-30;
            xf = $(menu).width()-(x-15);
            yf = $(menu).height()-(y-15);
            if(x<0||y<0||xf<0||yf<0){
                $(menu).remove();
            }
        }
    });
    //*/
    switch(page){
        case 'lista-asistencia':
            if(!editAsistencia){
                $(".header .control.next, .header .control.prev").on("click",function(ev){
                    var mes = elements.fecha.mes;
                    var curso = elements.curso.id;
                    var d = new Date(Date.UTC(year,mes,1));
                    var dia = parseInt(elements.fecha.dia);
                    var downward = false;
                    if( $(this).hasClass('prev') && dia>1 ){
                        downward = true;
                        dia--;
                    }
                    if( $(this).hasClass('next') && dia<d.getDate()){
                        downward = false;
                        dia++;
                    }
                    dia = getWorkday(year,mes,dia,downward);
                    current = 'null';
                    elements = {'dia':dia, 'curso':curso, 'mes':mes}
                    if( historyStack[historyStack.length-1]=='lista-asistencia' ){
                        historyStack.pop();   
                    }
                    elements = {'dia':dia, 'curso':curso, 'mes':mes}
                    loadPage('lista-asistencia');
                });
            } else {
                $(".header .control.next, .header .control.prev").off("click")
            }
            // Si el mes seleccionado es el en curso, debe permitir editar
            if( elements.fecha.mes == curMonth ){
                $("#nav-more").show();
                if(editAsistencia){
                    $("#alumno-lista .menu").each(function(k,v){
                        $(v).on("click",function(evt){
                            var dom = v;
                            var parent = $(v).parents('li');
                            var id = $(v).attr("href");
                            var secuencia = window.localStorage.getItem('secuencia');
                            id = id.substring(1);
                            var mes = elements.fecha.mes;
                            var curso = elements.curso.id;
                            var dia = parseInt(elements.fecha.dia);
                            var menu = [
                                {
                                    text:'Asistente',
                                    rel:'',
                                    anchor:'#',
                                    action:function(){
                                        parent.addClass('presente');
                                        parent.removeClass('ausente');
                                        parent.find('i.fa').removeClass('fa-question');
                                        parent.find('i.fa').addClass('fa-check');
                                        parent.find('i.fa').removeClass('fa-clock-o');
                                        parent.find('i.fa').removeClass('fa-remove');
                                        var tmp = {
                                            id_alumno:id,
                                            fecha:(year+'-'+mes+'-'+(dia<10?'0'+dia:dia)),
                                            justificacion:'',
                                            estado:0,
                                            observaciones:'',
                                            id_curso:curso
                                        }
                                        asistencia[id] = tmp;
                                    }
                                },
                                {
                                    text:'Ausente...',
                                    rel:'',
                                    anchor:'#',
                                    action:function(){
                                        promptWindow(
                                            null,
                                            function(results){
                                                if(results.buttonIndex==1){
                                                    parent.removeClass('presente');
                                                    parent.addClass('ausente');
                                                    parent.find('i.fa').removeClass('fa-question');
                                                    parent.find('i.fa').removeClass('fa-check');
                                                    parent.find('i.fa').removeClass('fa-clock-o');
                                                    parent.find('i.fa').addClass('fa-remove');
                                                    var tmp = {
                                                        id_alumno:id,
                                                        fecha:(year+'-'+mes+'-'+(dia<10?'0'+dia:dia)),
                                                        justificacion:results.checkbox1,
                                                        estado:1,
                                                        observaciones:(results.text1),
                                                        id_curso:curso
                                                    }
                                                    asistencia[id] = tmp;
                                                }
                                            },
                                            'Ausente',
                                            ['Cancelar','Grabar'],
                                            [{type:'text',label:'Observaciones'},{type:'checkbox',label:'Justificado'}]
                                        );
                                    }
                                },
                                {
                                    text:'Atrasado...',
                                    rel:'',
                                    anchor:'#',
                                    action:function(){
                                        promptWindow(
                                            null,
                                            function(results){
                                                if(results.buttonIndex==1){
                                                    if( results.radio3[1] ){
                                                        parent.addClass('presente');
                                                        parent.removeClass('ausente');
                                                    } else {
                                                        parent.removeClass('presente');
                                                        parent.addClass('ausente');
                                                    }
                                                    //parent.addClass('atrasado');
                                                    //parent.removeClass('ausente');
                                                    parent.find('i.fa').removeClass('fa-question');
                                                    parent.find('i.fa').removeClass('fa-check');
                                                    parent.find('i.fa').addClass('fa-clock-o');
                                                    parent.find('i.fa').removeClass('fa-remove');
                                                    var tmp = {
                                                        id_alumno:id,
                                                        fecha:(year+'-'+mes+'-'+(dia<10?'0'+dia:dia)),
                                                        justificacion:results.checkbox1,
                                                        estado:2,
                                                        observaciones:(results.text1),
                                                        id_curso:curso,
                                                        estadoFinal:(results.radio3[1]?1:0),
                                                        horaLlegada:results.time1
                                                    }
                                                    asistencia[id] = tmp;
                                                }
                                            },
                                            'Atrasado',
                                            ['Cancelar','Grabar'],
                                            [
                                                {type:'text',label:'Observaciones'},
                                                {type:'time',label:'Hora de llegada'},
                                                {type:'checkbox',label:'Justificado'},
                                                {type:'radio',label:'Estado Final',values:{'presente':'1','ausente':'0'} }
                                            ]
                                        );
                                    }
                                },
                                {
                                    text:'Sin Registro',
                                    rel:'',
                                    anchor:'#',
                                    action:function(){
                                        parent.removeClass('presente');
                                        parent.removeClass('ausente');
                                        parent.find('i.fa').addClass('fa-question');
                                        parent.find('i.fa').removeClass('fa-check');
                                        parent.find('i.fa').removeClass('fa-clock-o');
                                        parent.find('i.fa').removeClass('fa-remove');
                                        var tmp = {
                                            id_alumno:id,
                                            fecha:(year+'-'+mes+'-'+(dia<10?'0'+dia:dia)),
                                            justificacion:'',
                                            estado:null,
                                            observaciones:'',
                                            id_curso:curso
                                        }
                                        asistencia[id] = tmp;
                                    }
                                }
                            ]
                            createMenu(menu,1,dom);
                        });
                    });
                } else {
                    $("#nav-more").off('click');
                    $("#nav-more").on('click',function(evt){
                        var mes = elements.fecha.mes;
                        var curso = elements.curso.id;
                        var dia = parseInt(elements.fecha.dia);
                        if(!editAsistencia){
                            var menu = [
                                {
                                    text:'Tomar Asistencia',
                                    rel:'',
                                    anchor:'#',
                                    action:function(){
                                        promptWindow(
                                            'Por favor ingrese su contraseña',
                                            function(results){
                                                var pass = results.password1;
                                                if(results.buttonIndex==1){
                                                    var userData = window.localStorage.getItem('userData');
                                                    if( typeof userData === 'string' ){
                                                        userData = JSON.parse(userData);
                                                    }
                                                    var realPass = userData.clave;
                                                    if( md5(pass)!==realPass ){
                                                        if( typeof navigator.notification !== 'undefined' ){
                                                                navigator.notification.alert(
                                                                'La clave ingresada es incorrecta',
                                                                null,
                                                                'Error',
                                                                'Aceptar'
                                                            );  
                                                        } else {
                                                            alert('La clave ingresada es incorrecta');
                                                        }
                                                    } else {
                                                        editAsistencia = true;
                                                        current = 'null';
                                                        if( historyStack[historyStack.length-1]=='lista-asistencia' ){
                                                            historyStack.pop();   
                                                        }
                                                        elements = {'dia':dia, 'curso':curso, 'mes':mes}
                                                        loadPage('lista-asistencia');
                                                    }
                                                }
                                            },
                                            'Identificación',
                                            ['Cancelar','Aceptar'],
                                            ['password']
                                        );
                                    }
                                }
                            ];
                            createMenu(menu);
                        } else {
                            // IS EDITING
                            var menu = [
                                {
                                    text:'Grabar',
                                    rel:'',
                                    anchor:'#',
                                    action:function(){
                                        grabarAsistencia(mes,curso,dia);
                                    }
                                },
                                {
                                    text:'Descartar',
                                    rel:'',
                                    anchor:'#',
                                    action:function(){
                                        editAsistencia = false;
                                        current = 'null';
                                        if( historyStack[historyStack.length-1]=='lista-asistencia' ){
                                            historyStack.pop();   
                                        }
                                        elements = {'dia':dia, 'curso':curso, 'mes':mes}
                                        loadPage('lista-asistencia');
                                    }
                                }
                            ];
                            createMenu(menu);
                        }
                    });
                }
                
            } else {
                editAsistencia = false;
            }
            break;
        case 'asistencia':
            $("#filtrarAsistencia").off("click");
            $("#filtrarAsistencia").on("click",function(ev){
                var mes = $("select[name='mes-asistencia']").val();
                var curso = $("select[name='curso-asistencia']").val();
                if( (mes === 'empty') || (curso === 'empty') ){
                    navigator.notification.alert('Debe seleccionar mes y curso',null,'Error','Aceptar');
                } else {
                    elements = {'curso': curso,'mes':mes};
                    $.mobile.loading('show').promise().done(function(){
                        var workTransaction = true;
                        setUpDatabase();
                        sql.transaction(function(tx){
                            var thisDate = new Date(year,parseInt(mes),0);
                            var totalDays = thisDate.getDate();
                            elements.diasMes = [];
                            for(var i=0;i<totalDays;i++){
                                var thisCurDate = new Date(year,thisDate.getMonth(),i+1);
                                var diaNumero = thisCurDate.getDate();
                                /*
                                if(diaNumero<10){
                                    diaNumero = '0'+diaNumero;
                                } else {
                                    diaNumero = String(diaNumero);
                                }
                                //*/
                                var query = "SELECT (SELECT COUNT(1) FROM alumno a WHERE a.estado=1 AND a.habilitado=1 AND a.curso='"+curso+"' AND a.alumno in (SELECT id FROM usuario WHERE visible=1)) AS total, (SELECT COUNT(1) FROM alumno_asistencia WHERE estado=0 AND id IN (SELECT max(id) FROM alumno_asistencia WHERE id_curso='"+curso+"' AND estado=0 AND fecha='"+year+"-"+(mes>10?mes:'0'+parseInt(mes))+"-"+(diaNumero>10?diaNumero:'0'+parseInt(diaNumero))+"' group by id_alumno)) AS presentes, '"+diaNumero+"-"+mes+"-"+year+"' as currentdate;";
                                tx.executeSql(
                                    query,
                                    [],
                                    function(tx,result){
                                        if( (result!==null) && (result.rows.length>0) ){
                                            var res = result.rows.item(0);
                                            var total = res.total;
                                            /*if(isNaN(total)){
                                                total = 0;
                                            }*/
                                            var presentes = res.presentes;
                                            var progress = Math.floor((parseInt(presentes)*100)/parseInt(total));
                                            if( isNaN(progress) ){
                                                progress = 0;
                                            }
                                            var resultDate = (res.currentdate).split('-');
                                            var dateObj = new Date(Date.UTC(resultDate[2],parseInt(resultDate[1])-1,parseInt(resultDate[0])+1,0,0,0));
                                            if( dateObj.getDay() != 0 && dateObj.getDay() != 6 ){
                                                var diaDeLaSemana = days[dateObj.getDay()];
                                                elements.diasMes.push({'fecha':diaDeLaSemana,'dia':(resultDate[0]<10?'0'+resultDate[0]:resultDate[0]),'progress':progress});
                                            }
                                            if(resultDate[0]==totalDays){
                                                postProcessAsistencia(mes,curso);
                                            }
                                        }
                                    },
                                    function(arg1,arg2){
                                        if( typeof console !== 'undefiend' ){
                                            console.log('Error de SQL:');
                                            console.log(JSON.stringify(arg1));
                                            console.log(JSON.stringify(arg2));
                                        }
                                        workTransaction = false;
                                    }
                                );
                            }
                        });
                    }); 
                }
            });
            break;
        case 'verunidad':
            $("#clasesUnidad .clase .verclase").each(function(k,v){
                $(v).off("click");
                $(v).on("click",function(evt){
                    var dom = v;
                    var id = $(v).attr("href");
                    id = id.substring(1);
                    $.mobile.loading('show').promise().done(function(){
                        sql.transaction(function(tx){
                            var clase = new Clase(tx,id,function(){
                                lastObject.push(elements);
                                elements = clase;
                                loadPage('clase');
                            });
                        });
                    });
                });
            });
            break;
        case 'unidad':
            $("#clases").listview();
            $("#clases .menu").each(function(k,v){
                $(v).off("click");
                $(v).on("click",function(evt){
                    var dom = v;
                    var id = $(v).attr("href");
                    id = id.substring(1);
                    var menu = [
                        {
                            text:'Ver',
                            rel:'',
                            anchor:'#',
                            action:function(){
                                sql.transaction(function(tx){
                                    var clase = new Clase(tx,id,function(){
                                        lastObject.push(elements);
                                        elements = clase;
                                        loadPage('clase');
                                    });
                                });
                            }
                        }
                    ]
                    createMenu(menu,1,dom);
                });
            });
            $("#nav-more").show();
            $("#nav-more").off("click");
            $("#nav-more").on("click",function(evt){
                var id = elements.id;
                var data = [
                    {
                        text:'Ver',
                        rel:'',
                        anchor:'#',
                        action : function(){
                            setUpDatabase();
                            sql.transaction(
                                function(tx){
                                    var plan = new Planificacion(tx,id,function(){
                                        lastObject.push(elements);
                                        elements = plan;
                                        loadPage('verunidad');
                                    });
                                },
                                function(error){
                                    if( typeof console !== 'undefiend' ){
                                        console.log("Transaction error: " + error.message );
                                    }
                                    navigator.notification.alert('No se pudo abrir la planificacion seleccionada.',null,'Error','Aceptar');
                                }
                            );
                        }
                    }
                ];
                createMenu(data);
            });
            //$(document).off("swipeleft");
            $("#clases li").on("touchstart",function(ev){
                go = false;
                changing = true;
                document.addEventListener("touchmove", prevent, false);
                var touch = ev.originalEvent.touches[0];
                touchOffsetX = touch.pageX;
                touchOffsetY = touch.pageY;
            });
            $("#clases li").on("touchmove",slideUnlock);
            $("#clases li").on("touchend",function(ev){
                stop(ev.originalEvent);
                changing = false;
                $(this).find('.active').animate({left:'0'});   
                /*
                if(!changing){
                    $(this).find('.active').animate({left:'0'});
                }//*/
            });
            break;
        case 'planificacion':
            $("input.filterPlanificacion").on("keyup",function(){
                var query = '';
                $(".filterPlanificacion").each(function(k,v){
                    query += ' '+$(v).val();
                });
                $("#filterPlanificacion").val(query).trigger('keyup');
            });
            $("select.filterPlanificacion").change(function(){
                var query = '';
                $(".filterPlanificacion").each(function(k,v){
                    query += ' '+$(v).val();
                });
                $("#filterPlanificacion").val(query).trigger('keyup');
            });
            $('canvas').each(function(k,v){
                setRadialPercentage( $(v).attr('id'), $(v).attr('data-progress')/100 );
            });
            $(".unidad a").off("click");
            $(".unidad a").on("click",function(ev){
                $.mobile.loading('show');
                ev.preventDefault();
                elements = [];
                var id = $(this).attr('id');
                setUpDatabase();
                sql.transaction(
                    function(tx){
                        var plan = new Planificacion(tx,id,function(){
                            lastObject.push(elements);
                            elements = plan;
                            loadPage('unidad');
                        });
                    },
                    function(error){
                        if( typeof console !== 'undefiend' ){
                            console.log("Transaction error: " + error.message );
                        }
                        navigator.notification.alert('No se pudo abrir la planificacion seleccionada.',null,'Error','Aceptar');
                    }
                );
            });
            break;
        case 'home':
            $("#month").html(months[parseInt(curDate.m)]+' '+curDate.y);
            $("#backButton").hide();
            $(".control.prev").off("click");
            $(".control.next").off("click");
            $(".control.next").on("click",function(ev){
                ev.preventDefault();
                $("#contenido").html("");
                $.mobile.loading('show');
                var newMonth = parseInt(curDate.m)+1;
                var newYear = parseInt(curDate.y);
                if( newMonth == 13){
                     newYear+=1;
                     newMonth = 1;
                }
                newMonth = newMonth<10 ? String('0'+newMonth) : String(newMonth);
                curDate.m = newMonth;
                curDate.y = String(newYear);
                functions('home',function(){
                    $("#contenido").html(compileTemplate('home'));
                    refreshWidgets('home');
                    $.mobile.loading('hide');
                });
            });
            $(".control.prev").on("click",function(ev){
                ev.preventDefault();
                $("#contenido").html("");
                $.mobile.loading('show');
                var newMonth = parseInt(curDate.m)-1;
                var newYear = parseInt(curDate.y);
                if( newMonth == 0){
                     newYear-=1;
                     newMonth = 12;
                }
                newMonth = newMonth<10 ? String('0'+newMonth) : String(newMonth);
                curDate.m = newMonth;
                curDate.y = String(newYear);
                functions('home',function(){
                    $("#contenido").html(compileTemplate('home'));
                    refreshWidgets('home');
                    $.mobile.loading('hide');
                });
            });
            $(".eventoItem").off("click");
            $(".eventoItem").on("click",function(ev){
                ev.preventDefault();
                var selected = $(this).attr('href');
                for(var id in elements.eventos){
                    for(var i in elements.eventos[id].eventos){
                        var tmpDay = elements.eventos[id].eventos[i];
                        if(tmpDay.id==selected){
                            var det = tmpDay.descripcion == null ? 'Sin Descripción' : tmpDay.descripcion;
                            det = strip(det);
                            var message = "Titulo: " + tmpDay.nombre + "\n" + "Fecha Inicio:" + tmpDay.fechaini + " a las " + tmpDay.horaini + "\n" + "Fecha Fin: " + tmpDay.fechafin + " a las " + tmpDay.horafin + "\n" + "Descripción: " + det + "\n";
                            if(navigator.notification){
                                navigator.notification.alert(message,null,'Detalle de Evento','Aceptar');
                            } else {
                                if( typeof console !== 'undefiend' ){
                                    console.log(message);
                                }
                            }
                        }
                    }
                }
            });
            $("#eventos").listview();
            var pos = $("li[value='"+curDate.d+"/"+curDate.m+"/"+curDate.y+"']");
            if(pos.length>1){
                pos = (pos.position()).top;
                window.scrollTo({top:pos});
            }
            break;
        case 'login':
            logout();
            break;
    }
}
function setListeners(){
    $('input').off('focus');
    $('input').on('focus', function() {
        var topOffset = parseInt(($('#document-page').css('top')).replace('px',''))*(-1);
        var pos = Math.ceil($(this).offset().top-($(this).height()+topOffset));
        var css = {top:"-"+pos+"px"};
        $('#document-page').animate(css);
        $(this).on('blur',function(ev){
            if( ev.relatedTarget==null || ev.relatedTarget.tagName !== 'INPUT' ){
                $('#document-page').animate({top:'0px'});
            }
            $(this).off('blur');
        });
    });
    /* NO SACAR, SE PUEDE REUTILIZAR.
    $('input').off('blur')
    $('input').on('blur', function(ev) {
        console.log(ev.originalEvent.target==this);
        if(ev.target.tagName!='INPUT'){
            $('#document-page').animate({top:'0px'});
        }
    });
    //*/
    $("#btn-login").on("click",function(ev){
        ev.preventDefault();
        $.mobile.loading('show');
        login();
    });
    $("#btn-logout").on("click",function(ev){
        ev.preventDefault();
		var options = window.localStorage.getItem('colegios');
		options = JSON.parse(options);
		promptWindow(
			'Cambiar de colegio o cerrar sesión',
			function(result){ 
				if(result.buttonIndex==1){
					$.mobile.loading('show');
					var idusuario = result['select-one1'];
					logout();
					login(idusuario);
				}
				if(result.buttonIndex==0){
					logout();
				}
			},
			'Sesión',
			['Cambiar','Cerrar Sesión'],
			[{type:'select',label:'Seleccione el colegio:',options:options}]
		);
		/*
        ev.preventDefault();
        logout();
		//*/
    });
    $("#btn-menu_lateral, #btn-menu_lateral i").off("click");
    $("#btn-menu_lateral, #btn-menu_lateral i").on("click",function(ev){
        $("#menu_lateral").panel('open');
    });
    /*
    $(window).on("click",function(ev){
        console.log(ev.target);
    });
    //*/
}
function login(colegio)
{
    var _user = $("[name='user']").val();
    var _pass = $("[name='pass']").val();
    var params = { 'user':_user,'pass':_pass };
    if(colegio){
        params.idusuario = colegio;
        if( typeof console !== 'undefiend' ){
            console.log(params);
        }
    }
    if( (typeof navigator.connection !== 'undefined') && (navigator.connection.type==Connection.NONE) ){
        navigator.notification.alert(
            "Para realizar login debe tener conexión a internet.",
            function(){
                $.mobile.loading('hide');
            },
            "Problema de conexión.",
            "Aceptar"
        );
    } else {
        $.ajax({
            url:urlWS+'/login.php',
            data: params,
            dataType:'json',
            success : function(resp){
                if(resp.state==0){
                    if( typeof resp.selectColegio !== 'undefined' ){
                        $.mobile.loading('hide');
                        var options = [];
                        for( var id in resp.selectColegio ){
                            var curOpt = (resp.selectColegio)[id];
                            options.push({value:id,label:curOpt})
                        }
						window.localStorage.setItem('colegios',JSON.stringify(options));
                        promptWindow(
                            '',
                            function(result){ 
                                if(result.buttonIndex==1){
                                    $.mobile.loading('show');
                                    var idusuario = result['select-one1'];
                                    login(idusuario);
                                }
                            },
                            'Colegio',
                            ['Cancelar','Aceptar'],
                            [{type:'select',label:'Seleccione el colegio:',options:options}]
                        );
                    } else {
                        window.localStorage.setItem('user', resp.user);
                        window.localStorage.setItem('token', resp.hash);
                        window.localStorage.setItem('colegio', resp.userData.idcolegio);
                        window.localStorage.setItem('rol', resp.userData.idrol);
                        window.localStorage.setItem('userData',JSON.stringify(resp.userData));
                        sql.transaction(function(tx){
                            new Usuario(
                                tx,
                                null,
                                function(){
                                    $("#nav-header").show();
                                    user = resp.user;
                                    downloadData(function(){
                                        loadPage('home');
                                    });
                                },
                                resp.userData
                            );
                        });
                    }
                    
                } else {
                    if(resp.state==1){
                        navigator.notification.alert(resp.message,function(){$("input[name='pass']").val('');$('input[name=user]').focus();},'Error de Login','Aceptar');
                        $.mobile.loading('hide');
                    } else {
                        navigator.notification.alert('Lo sentimos, ocurrió un error durante el Login. Por favor intntelo nuevamente.',null,'Error','Aceptar');
                        $.mobile.loading('hide');
                    }
                }
            },
            error: function(response,error,exception){
                $.mobile.loading('hide');
                navigator.notification.alert('No se pudo realizar el login',function(){$("input[name='pass']").val('');$('input[name=user]').focus();},'Error de Login','Aceptar');
            }
        });
    }
    return false;
}
function logout(){
    $("#nav-header").hide();
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('secuencia');
    for(var id in tables){
        window.localStorage.removeItem('sizeof-'+tables[id]);
    }
    sql.transaction(
        function(tx){
            tx.executeSql("DROP TABLE evento");
            tx.executeSql("DROP TABLE sector");
            tx.executeSql("DROP TABLE sector_grupo");
            tx.executeSql("DROP TABLE unidad");
            tx.executeSql("DROP TABLE clase");
            tx.executeSql("DROP TABLE nivel");
            tx.executeSql("DROP TABLE curso");
            tx.executeSql("DROP TABLE alumno");
            tx.executeSql("DROP TABLE alumno_asistencia");
            tx.executeSql("DROP TABLE usuario");
            tx.executeSql("DROP TABLE usuario_detalle");
        }
    );
    downloaded = false;
    user = null;
    historyStack = [];
    loadPage('login');
}
function compileTemplate(template){
    var ret;
    $.ajax({
        url: 'view/'+template+'.html',
        dataType: 'text',
        success:function(html){
            ret = Handlebars.compile(html)(elements);
        },
        error:function(res,error){
            if( typeof console !== 'undefiend' ){
                console.log(JSON.stringify(res));
                console.log(JSON.stringify(error));
            }
            ret = "<h3>Template no encontrado.</h3>";
        },
        async: false
    });
    return ret;
}
function include(script){
    var js = document.createElement("script");
    js.type = "text/javascript";
    js.src = script;
    document.body.appendChild(js);
}
function downloadData(callback){
    sql.transaction(function(tx){
        //  THE CONSTRUCTOR FOR EACH MODEL CREATES THE TABLE THAT REPRESENTS THAT ENTITY.
        new Evento(tx);
        new Sector(tx);
        new SectorGrupo(tx);
        new Planificacion(tx);
        new Clase(tx);
        new Nivel(tx);
        new Curso(tx);
        new Alumno(tx);
        new Asistencia(tx);
        new Usuario(tx);
        new DetalleUsuario(tx);
    });
    $("#nav-header").hide();
    if(!callback){
        loadPage('home');
    }
    if( (typeof navigator.connection!='undefined') && (navigator.connection.type!=Connection.NONE) ){
        $.mobile.loading('hide');
        $("#contenido").html(compileTemplate('descargando')).promise().done(function(){
            syncToServer(function(){
                getTableFromServer(callback);
            });
        });
    } else {
        callback();
    }
}
function syncToServer(getTables){
    var pendientes = window.localStorage.getItem("pendientes");
    if(pendientes!=null && pendientes!='null'){
        pendientes = JSON.parse(pendientes);
        sql.transaction(function(tx){
            var tmpObj = pendientes;
            for( var table in tmpObj ){
                var arr = tmpObj[table];
                var key = arr[0];
                if(typeof key=='string'){
                    arr.splice(0,1);
                    var query = 'SELECT * FROM '+table+' WHERE '+key+' IN ('+arr.join(',')+')';
                    tx.executeSql(
                        query,
                        [],
                        function(tx,res){
                            if( res && res.rows ){
                                var data = [];
                                for(var i=0;i<res.rows.length;i++){
                                    data.push(res.rows.item(i));
                                }
                                if(data.length>0){
                                    var params = {
                                        'service':'syncToServer',
                                        'key':key,
                                        'table':table,
                                        'user':user,
                                        'data':data
                                    }
                                    $.ajax({
                                        url:urlWS+'/getJSON.php',
                                        type:'POST',
                                        data:params,
                                        dataType:'json',
                                        // async:false, // ojo con esto, ya que a veces provoca "parsererror". <- TODO: averiguar más acerca de este error.
                                        success:function(res){
                                            if(res.status==0){
                                                delete tmpObj[table];
                                                tmpObj = JSON.stringify(tmpObj);
                                                if(tmpObj=='{}'){
                                                    window.localStorage.removeItem('pendientes');
                                                } else {
                                                    window.localStorage.setItem('pendientes',tmpObj);
                                                }
                                            }
                                        },
                                        error:function(res,error,errorThrown){
                                            if( typeof console !== 'undefiend' ){
                                                console.log(JSON.stringify(res));
                                                console.log(error);
                                                console.log(errorThrown);
                                            }
                                        }
                                    });
                                }
                            }
                        },
                        function(tx,err){
                            if( typeof console !== 'undefiend' ){
                                console.log(JSON.stringify(tx));
                                console.log(JSON.stringify(err));
                            }
                        }
                    );
                } else {
                    tmpObj[table] = [];
                }
            }
            if(getTables){
                getTables();
            }
        });
    } else {
        if(getTables){
            getTables();
        }
    }
}
function getTableFromServer(callback)
{
    var table = tables[tableIndex];
    if( typeof table === 'undefined' ){
        insertIntoDatabase(callback);
        return;
    } else {
        var secuencia = window.localStorage.getItem('secuencia');
        if( typeof secuencia === 'undefined' || secuencia==null){
            secuencia = 0;
        }
        var params = {
            service     : 'syncData',
            user        : user,
            secuencia   : secuencia,
            table       : table,
            offset      : lastId
        };
        var colegio = window.localStorage.getItem('colegio');
        if( (typeof colegio === 'undefined') || (colegio==null) || (colegio.length<=0) ){
            colegio = 0;
        }
        params.colegio = colegio;
        var urlString = urlWS+'/getJSON.php';
        $.ajax({
            url     : urlString,
            data    : params,
            type    : 'POST',
            dataType: 'json',
            success : function(resp){
                var curT = resp.table;
                if( typeof resp.syncSize !== 'undefined' ){
                    syncSize = resp.syncSize;
                    if(parseInt(syncSize)<1){
                        callback();
                        return;
                    }
                }
                if( lastId==0 ){
                    window.localStorage.setItem('sizeof-'+curT,resp.size);
                    lastId=1;
                    if(String(resp.size) === '0'){
                        tableIndex++;
                        lastId=0;
                    }
                    getTableFromServer(callback);
                } else {
                    // resolution shouldn't be over 100.
                    var prog = ((Math.ceil((totalSyncs/syncSize)*100))/100);
                    setRadialPercentage("theRoadSoFar",(prog>1?1:prog));
                    var tableSize = window.localStorage.getItem('sizeof-'+curT);
                    if(typeof resp.rows !== 'undefined'){
                        lastId+=transferConectionSize;
                        if(lastId>parseInt(tableSize)){
                            lastId=0;
                            tableIndex++;
                        } else {
                            totalSyncs+=transferConectionSize;
                        }
                        var res = resp.rows;
                        for(var className in res){
                            var curRow = res[className];
                            for(var id in curRow){
                                if( typeof inserts[className] === 'undefined' ){
                                    inserts[className] = [];
                                }
                                var curObj = (res[className])[id];
                                (inserts[className]).push(curObj);

                            }
                        }
                        getTableFromServer(callback);
                    } else {
                        // it shouldn't come to this, but just in case...
                        if( typeof console !== 'undefiend' ){
                            console.log('Warning: Handling download with wrong parameters. Please check the WebService.');
                            console.log('Response from server was: '+JSON.stringify(resp));
                        }
                        getTableFromServer(callback);
                    }
                }
            },
            error   : function(resp,err){
                getTableFromServer(callback)
            }
        });
    }
}
function insertIntoDatabase(callback){
    tableIndex = 0;
    totalSyncs = 0;
    var secuencia = window.localStorage.getItem("secuencia");
    if( typeof secuencia === 'undefined' ){
        secuencia = 0;
    } else {
        secuencia = parseInt(secuencia);
        if(isNaN(secuencia)){
            secuencia = 0;
        }
    }
    sql.transaction(
        function(tx){
            for(var className in inserts){
                for(var id in inserts[className]){
                    var curIns = (inserts[className])[id];
                    if( parseInt(curIns.secuencia)>parseInt(secuencia) ){
                        secuencia = curIns.secuencia;
                    }
                    var obj = eval("new "+className+"(tx)");
                    obj.insert(curIns,function(){
                        
                    });
                }
            }
            window.localStorage.setItem("secuencia",secuencia);
            if(callback){
                callback();
            }
        }
    );
}
function setRadialPercentage(id,percentage){
    var canvas  = document.getElementById(id);
    while(canvas==null){
        canvas  = document.getElementById(id);
    }
    var context = canvas.getContext('2d');
    // limpiamos primero.
    context.clearRect(0, 0, canvas.width, canvas.height);
    // dividimos el alto y el ancho del canvas para obtener las coordenadas del punto medio.
    var x = canvas.width/2;
    var y = canvas.height/2;
    // Establecemos el radio a 33 px
    var radius = 33;
    // definimos el angulo de inicio y fin.
    var startAngle = Math.PI/2;
    var endAngle = Math.PI*2*percentage-startAngle;
    // definimos el ancho de la linea
    context.lineWidth = 5;
    // creamos una gradiente para el color del circulo.
    //var gradiente = context.createLinearGradient(0,0,x*2,0);
    //color verde/azulado
    //gradiente.addColorStop(0,"#007070");
    // color verde medio-claro
    //gradiente.addColorStop(1,"#00AF00");
    // iniciamos el proceso de dibujo
    context.beginPath();
    // establecemos el recorrido de la circunferencia con sus puntos de coordenada (x,y), 
    // angulo de inicio y de fin, e indicamos que se dibuje en sentido de las agujas del reloj.
    context.arc(x, y, radius, -startAngle,endAngle , false);
    // establecemos la fuente, tamaño y posición de la letra.
    context.font = "1.3em Helvetica";
    context.textAlign = "center";
    // establecemos el porcentaje en el centro del circulo
    context.fillText(String(Math.ceil(percentage*100))+'%',x,y*1.15);
    // definimos el color de la linea de la circunferencia
    //context.strokeStyle = gradiente;
    context.strokeStyle = "rgb(32, 138, 212)";
    // dibujamos todo.
    context.stroke();
}
//*
function setRadialPercentageAnimated(id,percentage){
  var canvas  = document.getElementById(id);
  var context = canvas.getContext('2d');

  context.clearRect(0, 0, canvas.width, canvas.height);

  var x = canvas.width/2;
  var y = canvas.height/2;
  
  var radius = 33;
  
  var startAngle = Math.PI/2;
  var endAngle = Math.PI*2*percentage-startAngle;

  context.lineWidth = 5;

  var gradiente = context.createLinearGradient(0,0,x*2,0);
  gradiente.addColorStop(0,"#007070");
  gradiente.addColorStop(1,"#00AF00");

  context.beginPath();
  context.arc(x, y, radius, 0,2*Math.PI , false);

  context.strokeStyle = "#cccccc";
  context.stroke();

  var curPerc = 0;

  function animate(current){
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    if(isNaN(current)){
        current = 0;
    }
    context.arc(x, y, radius, -startAngle,(2*Math.PI*(current/100))-startAngle , false);

    context.font = "1.3em Helvetica";
    context.textAlign = "center";
    context.fillText(String(Math.ceil(current))+'%',x,y*1.15);

    // line color
    context.strokeStyle = gradiente;
    context.stroke();
    curPerc += 1;
    if(curPerc>percentage*100){
        curPerc = percentage*100;
    }
    if(curPerc<=percentage*100){
        requestAnimationFrame(function () {
            animate(curPerc);
        });
    }
  }
  animate();
}
//*/
function capitalize(str){
    return str.charAt(0).toUpperCase()+str.slice(1);
}
function filtrarPlanificaciones(index, str){
    var cur = ($("#unidades li"))[index];
    var text = $(cur).find('*').text();
    text = (text.replace(/\s+/g,' ')).toLowerCase();
    var words = text.split(' ');
    if(str){
        str = regexpVowels(str);
        var regExp = new RegExp(str);
        return !regExp.test(text);
    }
    return !!str;
}
function regexpVowels(str){
    str = (str.replace(/\s+/g,' ')).toLowerCase();
    var searches = [
        /(a|á|ä|à|â)/g,
        /(e|é|ë|è|ê)/g,
        /(i|í|ï|ì|î)/g,
        /(o|ó|ö|ò|ô)/g,
        /(u|ú|ü|ù|û)/g
    ];
    var replacements = [
        '(a|á|ä|à|â)',
        '(e|é|ë|è|ê)',
        '(i|í|ï|ì|î)',
        '(o|ó|ö|ò|ô)',
        '(u|ú|ü|ù|û)'
    ]
    for(var i in searches){
        str = str.replace(searches[i],replacements[i]);
    }
    str = str.trim();
    str = str.replace(/\s+/g,')(?=.*');
    return '(?=.*'+str+')';
}
function normalize(str){
    str = (str.replace(/\s+/g,' ')).toLowerCase();
    var searches = [
        /(a|á|ä|à|â)/g,
        /(e|é|ë|è|ê)/g,
        /(i|í|ï|ì|î)/g,
        /(o|ó|ö|ò|ô)/g,
        /(u|ú|ü|ù|û)/g
    ];
    var replacements = [
        'a',
        'e',
        'i',
        'o',
        'u'
    ];
    for(var i in searches){
        str = str.replace(searches[i],replacements[i]);
    }
    str  = str.trim();
    str = str.toLowerCase();
    return str;
}
function createMenu(items,direction,trigger){
    // http://jsperf.com/adding-html-via-js <-- razón por la que no se usa innerHTML
    // segun mediciones este menu anda hasta 3 veces mas rapido que el hecho con jquery mobile o con texto
    var success = true;
    if( typeof direction === 'undefined' ){
        direction = 1;
    }
    if(direction>1){
        direction = 1;
    }
    if(direction<0){
        direction = 0;
    }
    if( $("#menu-moreover").length !== 0 ){
        $("#menu-moreover").remove();
    }
    if(typeof trigger === 'undefined'){
        trigger = document.getElementById("nav-more");
    }
    if(typeof trigger === 'string'){
        trigger = document.getElementById(trigger);
    }
    try{
        var menu = document.createElement("ul");
        var rel = document.createAttribute("data-role");
        menu.id = "menu-moreover";
        menu.className = "menu-flotante";
        rel.value = "listview";
        menu.setAttributeNode(rel);
        if( typeof items === "object" ){
            for(var i in items){
                if( typeof items[i] === "object" ){
                    var cur = items[i];
                    var item = document.createElement("li");
                    var anchor = document.createElement("a");
                    var itemRel = document.createAttribute("data-rel");
                    anchor.setAttribute("href","#"+cur.anchor);
                    anchor.appendChild(document.createTextNode(cur.text));
                    item.appendChild(anchor);
                    itemRel.value = cur.rel;
                    item.setAttributeNode(itemRel);
                    var icon = document.createAttribute("data-icon");
                    icon.value = "false";
                    item.setAttributeNode(icon);
                    item.addEventListener("click",cur.action);
                    item.addEventListener("click",function(){
                        $("#menu-moreover").hide();
                    })
                    menu.appendChild(item);
                } else {
                    success = false;
                    if( typeof console !== 'undefiend' ){
                        console.log("Los items del menu tienen un formato inválido.");
                    }
                }
            }
        } else {
            success = false;
            if( typeof console !== 'undefiend' ){
                console.log("Los items del menu tienen un formato inválido.");
            }
        }
    }catch(ex){
        if( typeof console !== 'undefiend' ){
            console.log(ex);
        }
        success = false;
    } finally {
         if(!success){
            if( typeof console !== 'undefiend' ){
                console.log('not success!!');
            }
            return false;
        } else {
            document.body.appendChild(menu);
            var menuDom = $("#menu-moreover");
            menuDom.listview();
            var offset = menuDom.width()*direction;
            var rect = trigger.getBoundingClientRect();
            var rightVal = document.body.getBoundingClientRect().right - ( document.body.getBoundingClientRect().right - rect.right + rect.width/2 );
            menuDom.css({
                left    : (rightVal-offset),
                top     : ($(trigger).offset().top+$(trigger).height()/2),
                display : 'block !important'
            });
            menuDom.show();
            menuOpen = true;
        }
    }
}
function prettyTitle(table){
    var title = table;
    switch(table){
        default:
            title = capitalize(title);
            title = title.replace(/_/g,' ');
            break;
    }
    return title;
}
function getPosition(element) {
    var xPosition = 0;
    var yPosition = 0;
      
    while (element) {
        xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
    }
    return { x: xPosition, y: yPosition };
}
function slideUnlock(ev){
    // METODO GRAFICO
    var li = $(this);
    var touch = ev.originalEvent.touches[0];
    var displacement = touch.pageX;
    var xDisp = touch.pageX - touchOffsetX;
    var yDisp = touch.pageY - touchOffsetY;
    if( !go ){
        // el primer evento va a ser descartado para poder determinar si es hacia el lado o hacia arriba.
        if( Math.abs(xDisp) > Math.abs(yDisp) ){
            go = true;
        } else {
            stop(ev.originalEvent);
        }
    } else {
        if( changing ){
            if( displacement-touchOffsetX > li.width()/2 ){
                changing = false;
                var id = $(this).attr('data-idref');
                var ejecucion = 0;
                var current = li.find('.active');
                if(current.hasClass('ejecucion-clase-0')){
                    var newVal = 1;
                } else {
                    var newVal = 0;
                }
                current.animate({left:1000},{
                    complete:function(){
                        changeEjecucionClase(id,newVal);
                        if(newVal){
                            li.find('.ejecucion-clase-1').addClass('active');
                        } else {
                            li.find('.ejecucion-clase-0').addClass('active');
                        }
                        current.removeClass('active');
                        current.css({zIndex:1,left:0})
                    }
                    //li.on("touchmove",slideUnlock);
                });
            } else if(displacement-touchOffsetX>=0) {
                $(this).find('.active').css({left:displacement-touchOffsetX});
            }
        }
    }
}
function changeEjecucionClase(id,newVal){
    // METODO FUNCIONAL
    var cont = $("#clase-li-"+id);
    if( typeof newVal === 'undefined' ){
        newVal = 0;
    }
    sql.transaction(
        function(tx){
            var c = new Clase(tx,id,function(){
                c.ejecucion = newVal;
                c.insert();
            });
        },
        function(arg0){
            if( typeof console !== 'undefiend' ){
                console.log(arg0);
            }
        }
    );
}
function prevent(e){
    e.preventDefault();
}
function stop(e){
    document.removeEventListener("touchmove", prevent, false);
}
function postProcessAsistencia(mes,curso){
    $("#contenido").html(compileTemplate('asistencia-fecha'));
    $(".ui-page").trigger('create');
    $.mobile.loading('hide');
    $( document ).on("swipeleft",function(ev){
        if( $( ".ui-page" ).jqmData( "panel" ) !== "open" ){
            $("#menu_lateral").panel('open');
        }
    });
    $('canvas').each(function(k,v){
        setRadialPercentage( $(v).attr('id'), $(v).attr('data-progress')/100 );
    });
    $(".diaAsistencia").on("click",function(ev){
        var dia = this.id;
        elements = {'dia':dia, 'curso':curso, 'mes':mes}
        loadPage('lista-asistencia');
    });
}
function grabarAsistencia(mes,curso,dia){
    var querys = [];
    for( var id in asistencia ){
        var obj = asistencia[id];
        var fields = '';
        var values = '';
        if( obj === null ){
            obj = {
                id_alumno:id,
                fecha:(year+'-'+mes+'-'+(dia<10?'0'+dia:dia)),
                justificacion:'',
                estado:0,
                observaciones:'',
                id_curso:curso
            }
        }
        for(var fieldName in obj){
            if(fields!=''){
                fields+=',';
            }
            fields+=fieldName;
            if(values!=''){
                values+=',';
            }
            values+="'"+obj[fieldName]+"'"
        }
        if(values!=''){
            querys.push("INSERT OR REPLACE INTO alumno_asistencia("+fields+") VALUES("+values+")");
        }
    }
    setUpDatabase();
    sql.transaction(function(tx){
        for(var i=0;i<querys.length;i++){
            tx.executeSql(
                querys[i],
                [],
                function(tx,result){
                    var pendientes = window.localStorage.getItem('pendientes');
                    if( pendientes == null || pendientes == 'null' ){
                        pendientes = {};
                    } else {
                        pendientes = JSON.parse(pendientes);
                    }
                    if( typeof pendientes.alumno_asistencia === 'undefined' ){
                        pendientes.alumno_asistencia = ['id'];
                    }
                    var thisId = result.insertId;
                    pendientes.alumno_asistencia.push(thisId);
                    pendientes = JSON.stringify(pendientes);
                    window.localStorage.setItem('pendientes',pendientes);
                },
                function(tx,error){
                    if( typeof console !== 'undefiend' ){
                        console.log(error);
                        console.log(JSON.stringify(error));
                    }
                }
            );
        }
        navigator.notification.alert('Exito',null,'La asistencia fue guardada con éxito.','Aceptar');
        editAsistencia = false;
        current = 'null';
        if( historyStack[historyStack.length-1]=='lista-asistencia' ){
            historyStack.pop();   
        }
        elements = {'dia':dia, 'curso':curso, 'mes':mes}
        loadPage('lista-asistencia');
        setTimeout(function(){
            if( (typeof navigator.connection!='undefined') && (navigator.connection.type!=Connection.NONE) ){
                syncToServer();
            }
        },10000);
    });
}
function getWorkday(year,month,day,downward){
    if( (downward==null) || (typeof downward=='undefined') ){
        downward = false;
    }
    var locDay = day;
    var d = new Date(Date.UTC(year,month-1,day+1));
    if( d.getDay() == 6 || d.getDay() == 0 ){
        if(downward){
            locDay--;
        } else {
            locDay ++;
        }
        locDay = getWorkday(year,month,locDay,downward);
    }
    return locDay;
}
function promptWindow(message,action,title,buttons,inputTypes){
    // message: string, action: function(), title: string, buttons:[strings...],inputTypes:[strings...]
    $("#background-blur").remove();
    var backgroundBlur = document.createElement('div');
    backgroundBlur.id = 'background-blur';
    var dialog = document.createElement("div");
    dialog.id = "dialogBox";
    var titleDom = document.createElement('h3');
    titleDom.appendChild(document.createTextNode(title));
    dialog.appendChild(titleDom);
    if(message!=null){
        dialog.appendChild(document.createTextNode(message));
    }
    // dialog.className = "dialogBox";
    var form = document.createElement('form');
    form.id = "promptWindow";
    var checkSetted = false;
    for(var i=0;i<inputTypes.length;i++){
        if( typeof (inputTypes[i]) === 'object' ){
            var label = document.createElement('label');
            label.className = "promptLabel";
            var inpObj = inputTypes[i];
            var inp = document.createElement('input');
            inp.type = inpObj.type;
            switch(inpObj.type){
                case 'text':
                    inp.className='form-control';
                    label.appendChild(document.createTextNode('  '+inpObj.label));
                    label.appendChild(inp);
                    break;
                case 'checkbox':
                    inp.value=inpObj.label;
                    label.appendChild(inp);
                    label.appendChild(document.createTextNode('  '+inpObj.label));
                    break;
                case 'radio':
                    var fieldset = document.createElement('fieldset');
                    var itemRel = document.createAttribute("data-type");
                    itemRel.value = "horizontal";
                    fieldset.setAttributeNode(itemRel);
                    itemRel = document.createAttribute("data-role");
                    itemRel.value = "controlgroup";
                    fieldset.setAttributeNode(itemRel);
                    var legend = document.createElement('legend');
                    legend.appendChild(document.createTextNode(inpObj.label));
                    fieldset.appendChild(legend);
                    for(var est in inpObj.values){
                        var cVal = (inpObj.values)[est];
                        var inp = document.createElement('input');
                        inp.value=cVal;
                        inp.id = "radio-"+est;
                        inp.name = "radio"+i;
                        inp.type = inpObj.type;
                        fieldset.appendChild(inp);
                        var label = document.createElement('label');
                        itemRel = document.createAttribute("for");
                        itemRel.value = "radio-"+est;
                        label.setAttributeNode(itemRel); 
                        label.appendChild(document.createTextNode(' '+capitalize(est)+'  '));
                        fieldset.appendChild(label);
                    }
                    label = fieldset;
                    break;
                case 'select':
                    inp = document.createElement('select');
                    inp.id="selectColegio";
                    for( var i in inpObj.options ){
                        var curOpt = (inpObj.options)[i];
                        var opt = document.createElement('option');
                        opt.value = curOpt.value;
                        opt.appendChild(document.createTextNode(curOpt.label));
                        inp.appendChild(opt);
                    }
                    label.appendChild(document.createTextNode('  '+inpObj.label));
                    label.appendChild(inp);
                    break;
                default:
                    inp.className='form-control';
                    label.appendChild(document.createTextNode('  '+inpObj.label));
                    label.appendChild(inp);
                    break;
            }
            form.appendChild(label);
        } else if( typeof (inputTypes[i]) === 'string' ){
            var cont = document.createElement('div');
            cont.className = "form-group"
            var inp = document.createElement('input');
            inp.type = inputTypes[i];
            inp.className='form-control';
            form.appendChild(inp);
        }
    }
    dialog.appendChild(form);
    var indexes = {};
    for(var i=0;i<2;i++){
        var btn = document.createElement('a');
        btn.setAttribute('href','#');
        btn.id='indexSelected'+i;
        btn.className = 'btn btn-info';
        btn.appendChild(document.createTextNode(buttons[i]));
        btn.addEventListener('click',function(evt){
            var ind = (evt.target.id).replace('indexSelected','');
            var result = {buttonIndex:ind};
            $('#dialogBox input, #dialogBox select').each(function(k,v){
                var t = v.type || 'select';
                if( typeof indexes[t] === 'undefined' ){
                    indexes[t] = 1;
                }
                if( t === 'checkbox' ){
                    result[t+indexes[t]] = ($(v).is(':checked')?1:0);
                } else if( t === 'radio' ){
                    if( typeof result[v.name] === 'undefined' ){
                        result[v.name] = {};
                    }
                    result[v.name][v.value] = $(v).is(':checked');
                } else {
                    result[t+indexes[t]] = v.value;
                }
                indexes[t]++;
            });
            action(result);
            $("#background-blur").remove();
        },null);
        dialog.appendChild(btn);
    }
    backgroundBlur.appendChild(dialog);
    document.getElementById('document-page').appendChild(backgroundBlur);
    $("#dialogBox").trigger('create');
}
function strip(html)
{
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}
/*
(function(){
  var cache = {};
 
  this.tmpl = function tmpl(str, data){
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(str) ?
      cache[str] = cache[str] ||
        tmpl(document.getElementById(str).innerHTML) :
     
      // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +
       
        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +
       
        // Convert the template into pure JavaScript
        str
          .replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("p.push('")
          .split("\r").join("\\'")
      + "');}return p.join('');");
   
    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };
})();
//*/
Handlebars.registerHelper('ifCond', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});
// IMPLEMENTATION END
