document.addEventListener("deviceready",onDeviceReady,false);
document.ready = onDeviceReady;
var user;
var token;
var db;
var historyStack = [];
var current;

function onDeviceReady()
{
    loadPage('home');
}
function loadPage(page,elements){
    console.log('loading: '+page);
    if(current!=page){
        current = page;
        historyStack.push("#page-"+String(historyStack.length+1));
        var id = "#contenido-"+String(historyStack.length);
        var index = String(historyStack.length);
        $("body").append(compileTemplate('container')({'index':index}));
        $(id).html(compileTemplate(page)(elements));
        $.mobile.changePage("#page-"+historyStack.length);
        setListeners();
    }
}
/*
function backButton(){
    console.log('back');
    if(historyStack.length>1){
        historyStack.pop();
        var last = historyStack.pop();
        if(typeof last != 'undefined'){
            $.mobile.changePage(last,{reverse:true,transition:'slide'})
        }
    }
}
//*/
function setListeners(){
    $("#menu_lateral").panel('refresh');
    $("#login").on("click",function(ev){
        ev.preventDefault();
        $.mobile.loading('show');
        login();
    });
    $("#logout").on("click",function(ev){
        logout();
    });
    /*
    $("#backButton").off("click");
    $("#backButton").on("click",function(ev){
        ev.preventDefault();
        backButton();
    });
    //*/
    //$(".menuItem").off("click");
    $(".menuItem").on("click",function(ev){
        ev.preventDefault();
        $("#menu_lateral").panel('close');
        loadPage($(this).attr('template'));
    });
}
function login()
{
    //e.preventDefault();
    var _user = $("[name='user']").val();
    var _pass = $("[name='pass']").val();
    var params = { 'user':_user,'pass':_pass };
    $.getJSON('https://pablogarin.cl/login.php',params,function(resp){
    //$.getJSON('http://pablogarin.cl/login.php',params,function(resp){
        console.log(resp.hash);
        console.log(resp.ok);
        //resp = eval("("+resp+")");
        if(resp.ok){
            window.localStorage.setItem('user', params.user);
            window.localStorage.setItem('token', resp.hash);
            window.location = 'alumnos.html';
        }
    });
    return false;
}
function populateDB(tx)
{
    //tx.executeSql("DROP TABLE ALUMNO");
    tx.executeSql("CREATE TABLE IF NOT EXISTS ALUMNO(ID INTEGER PRIMARY KEY AUTOINCREMENT, NOMBRE VARCHAR(128) NOT NULL, DESCRIPCION TEXT)");
    console.log('Base de datos creada');
    tx.executeSql("SELECT * FROM ALUMNO",[],populateList,errorCB);
    //tx.executeSql("INSERT INTO ALUMNO(NOMBRE, DESCRIPCION) VALUES('Alumno Apellido','Prueba de base de datos'), ('Otro Alumno','más pruebas')");
}
function errorCB(tx)
{
    console.log("SQL Error: " + tx.message);
    console.dir(tx);
}
function successCB(tx)
{
    //console.log(tx.message)
}
function submitAlumno(form)
{
    db.transaction(insertQuery, errorCB, successCB);
    return false;
}
function insertQuery(tx)
{
    var _nombre = $("[name='nombre']").val();
    var _desc   = $("[name='desc']").val();
    var data = [_nombre,_desc];
    tx.executeSql('INSERT INTO ALUMNO(NOMBRE,DESCRIPCION) VALUES(?,?)',data,successCB,errorCB);
    tx.executeSql("SELECT * FROM ALUMNO",[],populateList,errorCB);
}

function populateList(tx,list)
{
    var html = '';
    var len  = list.rows.length;
    for(var i = 0; i<len; i++){
        html += "<li>" + list.rows.item(i).NOMBRE + "</li>";
    }
    $("#listaAlumnos").html(html);
    $("#listaAlumnos").listview('refresh');
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
