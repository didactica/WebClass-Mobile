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
include('js/SQLHelper.js');
include('model/Evento.js');
include('model/Planificacion.js');
include('model/Sector.js');
include('model/Clase.js');
include('model/Nivel.js');
include('model/Sector_Grupo.js');
include('model/Usuario.js');
include('model/Alumno.js');
include('model/Asistencia.js');
include('model/Curso.js');
include('model/DetalleUsuario.js');

document.addEventListener("deviceready",onDeviceReady,false);
document.addEventListener("backbutton",backButton, false);

var sql;
var user;
var token;
var historyStack = [];
var current;
var elements = [];
var curDate;
var months = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
var alertUp = false;
var sequence = 0;
var downloaded = false;
var where;
var lastObject = [];

$.event.special.swipe.scrollSupressionThreshold = 10; // More than this horizontal displacement, and we will suppress scrolling.
$.event.special.swipe.horizontalDistanceThreshold = 30; // Swipe horizontal displacement must be more than this.
$.event.special.swipe.durationThreshold = 500;  // More time than this, and it isn't a swipe.
$.event.special.swipe.verticalDistanceThreshold = 75;

$.mobile.filterable.prototype.options.filterCallback = filtrarPlanificaciones;

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
            callback();
            break;
        case 'asistencia':
            var d = new Date();
            var y = d.getFullYear();
            var tmp = months;
            tmp.splice(0,1);
            elements.months = [];
            for(var k in tmp){
                var monthNumber = parseInt(k)+1;
                if(monthNumber<10){
                    monthNumber = '0'+monthNumber;
                } else {
                    monthNumber = String(monthNumber);
                }
                var curr = {'key':monthNumber+'-'+y,'month':months[k]};
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
                            console.log(JSON.stringify(err.message));
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
                "FROM (SELECT " + 
                        "u.*, " +
                        "s.nombre as sectorNombre " + 
                    "FROM " + 
                        "unidad u " + 
                    "LEFT OUTER JOIN " + 
                        "sector s " + 
                    "ON " + 
                        "u.sector = s.id " + 
                    "WHERE " + 
                        where + // debug only
                    " ORDER BY " + 
                        "u.fechaini desc) ulj " + 
                "LEFT OUTER JOIN " + 
                    "nivel n " + 
                "ON " + 
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
                            console.log(JSON.stringify(err.message));
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
                            console.log(JSON.stringify(err.message));
                        }
                    );
                },
                function(tx,error){
                    console.log("Error:"+tx.message);
                    callback();
                }
            );
            break;
        case 'home':
            $.mobile.loading('show',{text: "Leyendo Base de Datos...",textVisible: true,theme: "z",html: ""});
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
                    console.log("Error:"+error.message);
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
            console.log("After loading: " + JSON.stringify(elements));
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
        case 'unidad':
            title = elements.nombre;
            break;
        case 'verunidad':
            title = elements.nombre;
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
    } else {
        if(historyStack.length>1){
            $.mobile.loading('show').promise().done(function(){
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
var menuOpen = false;
var changing = false;
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
    switch(page){
        case 'asistencia':
            $("#filtrarAsistencia").off("click");
            $("#filtrarAsistencia").on("click",function(ev){
                var mes = $("select[name='mes-asistencia']").val();
                var curso = $("select[name='curso-asistencia']").val();
                if( (mes === 'empty') || (curso === 'empty') ){
                    navigator.notification.alert('Debe seleccionar mes y curso',null,'Error','Aceptar');
                } else {
                    console.log("Curso es "+curso);
                    $.mobile.loading('show').promise().done(function(){
                        setUpDatabase();
                        sql.transaction(
                            function(tx){
                                elements.alumnos = [];
                                var query = "SELECT * FROM alumno a LEFT JOIN usuario u ON a.alumno=u.id WHERE a.curso="+curso;
                                console.log(query);
                                tx.executeSql(
                                    query,
                                    [],
                                    function(tx,res){
                                        var counter = 0;
                                        if( (res.rows!=null) && (res.rows.length>0) ){
                                            for(var i=0;i<res.rows.length;i++){
                                                var cur = res.rows.item(i);
                                                var alumno = new Alumno(null,null,null,cur);
                                                elements.alumnos.push(alumno);
                                            }
                                        }
                                        console.log(JSON.stringify(elements.alumnos));
                                        loadPage('lista-asistencia');
                                    },
                                    function(arg1, arg2){
                                        console.log("arg1: "+JSON.stringify(arg1));
                                        console.log("arg2: "+JSON.stringify(arg2));
                                    }
                                );
                            }
                        );
                    });
                }
            });
            break;
        case 'unidad':
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
                    y -= menu.offsetTop;
                    xf = $(menu).width()-(x-15);
                    yf = $(menu).height()-(y-15);
                    if(x<0||y<0||xf<0||yf<0){
                        $(menu).remove();
                    }
                }
            });
            $("#clases").listview();
            $("#clases .menu").each(function(k,v){
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
                        },
                        {
                            text:'Eliminar',
                            rel:'',
                            anchor:'#',
                            action:function(){
                                var c = confirm('Seguro desea eliminar el elemento seleccionado?');
                                if(c){
                                    alert('Borrado! (No realmente xDD)');
                                }
                            }
                        },
                        {
                            text:'Tarea',
                            rel:'',
                            anchor:'#',
                            action:function(){
                                alert('tarea!');
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
                                    console.log("Transaction error: " + error.message );
                                    navigator.notification.alert('No se pudo abrir la planificacion seleccionada.',null,'Error','Aceptar');
                                }
                            );
                        }
                    },
                    {
                        text:'Eliminar',
                        rel:'',
                        anchor:'#',
                        action:function(){
                            var c = confirm('Seguro desea eliminar el elemento seleccionado?');
                            if(c){
                                alert('Borrado! (No realmente xDD)');
                            }
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
                        console.log("Transaction error: " + error.message );
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
                            var message = "Titulo: " + tmpDay.nombre + "\n" + "Fecha Inicio:" + tmpDay.fechaini + " a las " + tmpDay.horaini + "\n" + "Fecha Fin: " + tmpDay.fechafin + " a las " + tmpDay.horafin + "\n" + "Descripción: " + det + "\n";
                            if(navigator.notification){
                                navigator.notification.alert(message,null,'Detalle de Evento','Aceptar');
                            } else {
                                console.log(message);
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
        var pos = $(this).offset().top-100;
        $(document.body).animate({"top":"+="+pos+"px"});
    });
    $('input').off('blur')
    $('input').on('blur', function(ev) {
        if(ev.target.tagName!='INPUT'){
            $(document.body).animate({scrollTop:0});
        }
    });
    $("#btn-login").on("click",function(ev){
        ev.preventDefault();
        $.mobile.loading('show');
        login();
    });
    $("#btn-logout").on("click",function(ev){
        ev.preventDefault();
        logout();
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
function login()
{
    var _user = $("[name='user']").val();
    var _pass = $("[name='pass']").val();
    var params = { 'user':_user,'pass':_pass };
    if(navigator.connection.type==Connection.NONE){
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
            url:'http://didactica.pablogarin.cl/login.php',
            data: params,
            dataType:'json',
            success : function(resp){
                if(resp.state==0){
                    window.localStorage.setItem('user', resp.user);
                    window.localStorage.setItem('token', resp.hash);
                    window.localStorage.setItem('colegio', resp.userData.idcolegio);
                    window.localStorage.setItem('rol', resp.userData.idrol);
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
            console.log(JSON.stringify(res));
            console.log(JSON.stringify(error));
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
    $("#nav-header").hide();
    if(!callback){
        loadPage('home');
    }
    if( (!downloaded) && (typeof navigator.connection!='undefined' && navigator.connection.type!=Connection.NONE) ){
        downloaded = true;
        $.mobile.loading('hide');
        $("#contenido").html(compileTemplate('descargando')).promise().done(function(){
            var modificacion = window.localStorage.getItem('modificacion');
            if( typeof modificacion === 'undefined' ){
                modificacion = 0;
            }
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
                                        var params = {
                                            'service':'syncToServer',
                                            'key':key,
                                            'table':table,
                                            'user':user,
                                            'data':data
                                        }
                                        $.ajax({
                                            url:'http://didactica.pablogarin.cl/getJSON.php',
                                            data:params,
                                            dataType:'json',
                                            async:false,
                                            success:function(res){
                                                if(res.status==0){
                                                    delete tmpObj[table];
                                                    tmpObj = JSON.stringify(tmpObj);
                                                    window.localStorage.setItem('pendientes',tmpObj);
                                                }
                                            }
                                        });
                                    }
                                },
                                function(tx,err){
                                    console.log(JSON.stringify(tx));
                                    console.log(JSON.stringify(err));
                                }
                            );
                        } else {
                            tmpObj[table] = [];
                        }
                    }
                });
            }
            setTimeout(function(){
                var urlString = 'http://didactica.pablogarin.cl/getJSON.php?service=syncData&user='+user+"&modificacion="+modificacion;
                var curso = window.localStorage.getItem('curso');
                if( curso!=null ){
                    urlString += "&curso="+curso;
                } else {
                    urlString += "&curso=11682";
                }
                var colegio = window.localStorage.getItem('colegio');
                urlString += "&colegio="+colegio;
                $.ajax({
                    url: urlString,
                    type: 'POST',
                    dataType: 'json',
                    success: function(resp){
                        sql.transaction(
                            function(tx){
                                elements = [];
                                if(typeof resp.rows != 'undefined'){
                                    var res = resp.rows;
                                    for(var className in res){
                                        var curRow = res[className];
                                        for(var id in curRow){
                                            var ins = curRow[id];
                                            var obj = eval("new "+className+"(tx)");
                                            obj.insert(ins);
                                        }
                                    }
                                }
                            },
                            function(error){
                                console.log("Error de SQL");
                                console.dir(JSON.stringify(error));
                                callback();
                            },
                            callback
                        );
                    },
                    error: callback
                });
            },1000);
        });
    } else {
        callback();
    }
}
function setRadialPercentage(id,percentage){
    var canvas  = document.getElementById(id);
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
    var gradiente = context.createLinearGradient(0,0,x*2,0);
    //color verde/azulado
    gradiente.addColorStop(0,"#007070");
    // color verde medio-claro
    gradiente.addColorStop(1,"#00AF00");
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
    context.strokeStyle = gradiente;
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
                    item.addEventListener("click",cur.action);
                    item.addEventListener("click",function(){
                        $("#menu-moreover").hide();
                    })
                    menu.appendChild(item);
                } else {
                    success = false;
                    console.log("Los items del menu tienen un formato inválido.");
                }
            }
        } else {
            success = false;
            console.log("Los items del menu tienen un formato inválido.");
        }
    }catch(ex){
        console.log(ex);
        success = false;
    } finally {
        if(!success){
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
            menuOpen = true;
        }
    }
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

var touchOffsetX = 0;
var touchOffsetY = 0;
var go = false;
var changing = false;
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
            console.log(arg0);
        }
    );
}
function prevent(e){
    e.preventDefault();
}
function stop(e){
    document.removeEventListener("touchmove", prevent, false);
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