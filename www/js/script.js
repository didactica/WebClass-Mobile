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
*/
include('js/SQLHelper.js');
include('model/Evento.js');
include('model/Planificacion.js');
include('model/Sector.js');
include('model/Clase.js');
include('model/Nivel.js');

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
        case 'planificacion':
            $.mobile.loading('show',{text: "Leyendo Base de Datos...",textVisible: true,theme: "z",html: ""});
            var selectQuery = "SELECT "+
                    "ulj.*,"+
                    "n.nombre AS nivelNombre "+
                "FROM (SELECT " + 
                        "u.*, " +
                        "s.nombre as sectorNombre " + 
                    "FROM " + 
                        "unidad u " + 
                    "LEFT OUTER JOIN " + 
                        "sector s " + 
                    "ON " + 
                        "u.sector = s.id " + 
                    //"WHERE " + // debug only
                    //    "u.usuario=2213 " + // debug only
                    "ORDER BY " + 
                        "u.fechaini desc) ulj " + 
                "LEFT OUTER JOIN " + 
                    "nivel n " + 
                "ON " + 
                    " n.id = ulj.nivel";
            setUpDatabase();
            sql.transaction(
                function(tx){
                    tx.executeSql(
                        "SELECT * FROM nivel",
                        [],
                        function(tx,res){
                            var niveles = [];
                            if( res && res.rows){
                                for(var i = 0; i<res.rows.length; i++){
                                    niveles.push(res.rows.item(i));
                                }
                            }
                            console.log(JSON.stringify(niveles));
                        },
                        function(tx,err){
                            console.log("Error: " + JSON.stringify(err));
                        }
                    );
                    tx.executeSql(
                        selectQuery,
                        [],
                        function(tx,res){
                            elements = [];
                            if( res!=null && res.rows!=null ){
                                for(var i = 0; i<res.rows.length;i++){
                                    var obj = new Planificacion(tx,null,null,res.rows.item(i));
                                    elements.push(obj);
                                }
                            }
                            callback();
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
                                /*
                                Formato = {[{titulo:'01/05/2015',eventos:[...]}],[{titulo:'02/05/2015',eventos:[...]}]}
                                */
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
                    elements = [];
                    for(var id in tmp[today]){
                        elements.push(tmp[today][id]);
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
            elements = [];
            callback();
            break;
    }
}
function loadPage(page){
    $("#menu_lateral").panel('close');
    if(current!=page){
        current = page;
        for(var id in historyStack){
            if( historyStack[id]==current ){ 
                historyStack = historyStack.slice(0,id);
                break;
            }
        }
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
        case 'unidad':
            title = elements.nombre;
            break;
        default:
            title = page;
            break;
    }
    // Es un titulo, por lo tanto debe ir cada palabra capitalizada.
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
    if(historyStack.length>1){
        historyStack.pop();
        var last = historyStack.pop();
        if(typeof last != 'undefined'){
            loadPage(last);
        }
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
function refreshWidgets(page){
    $("#nav-header").show();
    $("#backButton").show();
    switch(page){
        case 'unidad':
            $("#clases").listview();
            break;
        case 'planificacion':
            $("#unidades").listview();
            $('canvas').each(function(k,v){
                setRadialPercentage( $(v).attr('id'), $(v).attr('data-progress')/100 );
            });
            $(".unidad a").off("click");
            $(".unidad a").on("click",function(ev){
                elements = [];
                var id = ev.target.id;
                setUpDatabase();
                sql.transaction(
                    function(tx){
                        var plan = new Planificacion(tx,id,function(){
                            elements = plan;
                            loadPage('unidad');
                        });
                    },
                    function(tx,error){
                        console.log("Transaction error");
                        console.log(JSON.stringify(tx));
                        console.log(JSON.stringify(error));
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
                for(var id in elements){
                    for(var i in elements[id].eventos){
                        var tmpDay = elements[id].eventos[i];
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
                    $("#nav-header").show();
                    user = resp.user;
                    downloadData(function(){
                        loadPage('home');
                    });
                    /*
                    navigator.notification.alert(
                        'Ingreso Exitoso!',
                        function(){
                        },
                        'Login',
                        'Aceptar'
                    );
                    */
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
    if( (!downloaded) && (navigator.connection.type!=Connection.NONE) ){
        downloaded = true;
        $.mobile.loading('hide');
        $("#contenido").html(compileTemplate('descargando')).promise().done(function(){
            setTimeout(function(){
                $.ajax({
                    url: 'http://didactica.pablogarin.cl/getJSON.php?service=syncData&user='+user+"&sequence="+sequence,
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
        //var mainInterval = window.setInterval(downloadData(callback),(1000*60*10));
    } else {
        callback();
    }
}
function setRadialPercentage(id,percentage){
  var canvas  = document.getElementById(id);
  var context = canvas.getContext('2d');

  var x = canvas.width/2;
  var y = canvas.height/2;
  var radius = 30;
  
  var startAngle = Math.PI/2;
  var endAngle = Math.PI*2*percentage-startAngle;

  context.lineWidth = 5;

  context.beginPath();
  context.arc(x, y, radius, -startAngle,endAngle , false);

  // line color
  context.strokeStyle = 'green';
  context.stroke();
}
function capitalize(str){
    return str.charAt(0).toUpperCase()+str.slice(1);
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