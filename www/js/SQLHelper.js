var SQLHelper = function(){
	this.db = window.openDatabase("WebClassMobile", "1.0", "WebClass Educational Suite Mobile", 1024*1024*10);
	console.log('DB initialized: '+this.db);
}
SQLHelper.prototype.queryDB = function(query,values,successCallback,errorCallback){
	this.db.transaction(
	    function(tx){
	        tx.executeSql(
	            query,
	            values,
	            successCallback,
	            errorCallback
	        );
	    },
	    this.errorCB,
	    this.successCB
	);
}
SQLHelper.prototype.readDB = function(table,where,order,columns,limit,successCallback){
	if(typeof columns == 'undefined'){
		columns = "*";
	}
	var query = "SELECT " + columns + " FROM " + table;
	if(typeof where != 'undefined'){
		query += " WHERE " + where;
	}
	if(typeof order != 'undefined'){
		query += " ORDER BY "+order;
	}
	if(typeof limit != 'undefined'){
		query += " LIMIT "+limit;
	}
	var ret = [];
	queryDB = this.queryDB;
	var db = window.openDatabase("WebClassMobile", "1.0", "WebClass Educational Suite Mobile", 1024*1024*10);
   	db.transaction(
   		function(tx){
			ret = queryDB(query);
		},
		function(error){
    		navigator.notification.alert(error.message,null,'Error','Aceptar');
			ret = false;
		}
	);
	return ret;
}
SQLHelper.prototype.errorCB = function(tx){
	console.log(tx.message);
}
SQLHelper.prototype.successCB = function(tx,list){
	console.log('exito');
}
/* codigo antiguo
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
    console.dir(tx.exception);
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
//*/