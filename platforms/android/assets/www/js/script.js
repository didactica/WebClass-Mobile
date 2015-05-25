include('js/SQLHelper.js');
include('model/Evento.js');
include('model/Planificacion.js');

document.addEventListener("deviceready",onDeviceReady,false);
document.addEventListener("backbutton",backButton, false);
document.ready = onDeviceReady;

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
    sql = new SQLHelper();
    createTables();
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
    $.mobile.defaultPageTransition = "slide";
    $(".menuItem").off("click");
    $(".menuItem").on("click",function(ev){
        ev.preventDefault();
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
        token = window.localStorage.getItem("token");
        loadPage('home');
    }
}
function createTables(){
    var obj = new Planificacion(new SQLHelper());
    obj = new Evento(new SQLHelper());
}
function functions(title,callback){
    switch(title){
        case 'planificacion':
            downloadData(function(){
                (new SQLHelper()).queryDB(
                    "SELECT * FROM unidad ORDER BY fechaini",
                    [],
                    function(tx,res){
                        elements = [];
                        if( res!=null && res.rows!=null ){
                            for(var i = 0; i<res.rows.length;i++){
                                var obj = res.rows.item(i);
                                elements.push(obj);
                            }
                        }
                        console.log(JSON.stringify(elements));
                        callback();
                    },
                    function(tx,error){
                        console.log("Error:"+error.message);
                        callback();
                    }
                );
            });
            break;
        case 'home':
            downloadData(function(){
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
                        console.log(JSON.stringify(tmp));
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
            });
            break;
        default:
            elements = [];
            callback();
            break;
    }
}
function loadPage(page){
    $("#menu_lateral").panel('close');
    $.mobile.loading('show',{text: "Cargando...",textVisible: true,theme: "z",html: ""});
    if(current!=page){
        $("#contenido").html("");
        current = page;
        historyStack.push(page);
        functions(page,function(){
            $("#contenido").html(compileTemplate(page)(elements));
            refreshWidgets(page);
            setListeners();
        });
    }
    $.mobile.loading('hide');
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
                        case 1:
                            navigator.app.exitApp();
                            break;
                    }
                },
                'Salir',
                ['Aceptar','Cancelar']
            );
        }
    }
}
function refreshWidgets(page){
    $("#nav-header").show();
    $("#backButton").show();
    switch(page){
        case 'planificacion':
            $("#unidades").listview();
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
                    $("#contenido").html(compileTemplate('home')(elements));
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
                    $("#contenido").html(compileTemplate('home')(elements));
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
    //e.preventDefault();
    var _user = $("[name='user']").val();
    var _pass = $("[name='pass']").val();
    var params = { 'user':_user,'pass':_pass };
    if(navigator.connection.type==Connection.NONE){
        navigator.notification.alert(
            "Para realizar login debe tener conexión a internet.",
            function(){
                $.mobile.loading('hide');
            },
            "Problema de conección.",
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
                    navigator.notification.alert(
                        'Ingreso Exitoso!',
                        function(){
                            user = resp.user;
                            loadPage('home');
                        },
                        'Login',
                        'Aceptar'
                    );
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
        url: template+'.html',
        dataType: 'text',
        success:function(html){
            ret = Handlebars.compile(html)
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
    if(!downloaded){
        downloaded = true;
        $.ajax({
            url: 'http://didactica.pablogarin.cl/getJSON.php?service=syncData&user='+user+"&sequence="+sequence,
            type: 'POST',
            dataType: 'json',
            success: function(resp){
                elements = [];
                if(typeof resp.rows != 'undefined'){
                    var res = resp.rows;
                    for(var className in res){
                        var curRow = res[className];
                        for(var id in curRow){
                            var ins = curRow[id];
                            var obj = eval("new "+className+"(new SQLHelper())");
                            obj.insert(ins);
                        }
                    }
                }
                callback();
            }
        });
        /*
        getEventos(callback);
        getPlanificaciones(callback);
        */
        var mainInterval = window.setInterval(getEventos(callback),(1000*60*10));
    } else {
        callback();
    }
}
function getEventos(callback){
    if(navigator.connection.type==Connection.NONE){
        console.log("Saltando descarga: Sin conexion a internet.");
        callback();
    } else {
        $.ajax({
            url: 'http://didactica.pablogarin.cl/getJSON.php?service=eventos&user='+user+"&sequence="+sequence,
            type: 'POST',
            dataType: 'json',
            success: function(resp){
                elements = [];
                if(typeof resp.rows != 'undefined'){
                    var res = resp.rows;
                    for(var id in res){
                        var ev = new Evento(new SQLHelper());
                        var ins = res[id];
                        ev.insert(ins);
                    }
                }
                callback();
            }
        });
    }
}
function getPlanificaciones(callback){
    if(navigator.connection.type==Connection.NONE){
        console.log("Saltando descarga: Sin conexion a internet.");
        callback();
    } else {
        $.ajax({
            url:'http://didactica.pablogarin.cl/getJSON.php?service=planificacion&user='+user,
            dataType: 'JSON',
            success: function(resp){
                elements = [];
                var res = resp.rows;
                for(var id in res){
                  var ins = res[id];
                  var pl = new Planificacion(new SQLHelper());
                  pl.insert(ins);
                  console.log(JSON.stringify(pl));
                }
                callback();
            }
        });
    }
}