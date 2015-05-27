var Clase = function(tx,id,callback,json){
    if(json!=null){
        this.initWithJson(json);
    } else {
        this.tx = tx;
        this.createTable();
        if(id!=null){
            this.id = id;
            this.selectById(callback);
        }
    }
}
Clase.prototype.createTable = function() {
    var query = "CREATE TABLE IF NOT EXISTS clase(" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT," + 
        "nombre TEXT," + 
        "unidad INTEGER," + 
        "profesor INTEGER," + 
        "tipo INTEGER," + 
        "fechaini INTEGER," + 
        "fechafin INTEGER," + 
        "creacion INTEGER," + 
        "modificacion INTEGER," + 
        "estado INTEGER," + 
        "asignacion INTEGER," + 
        "ejecucion INTEGER," + 
        "curso INTEGER," + 
        "horas INTEGER," + 
        "orden INTEGER," + 
        "ordenxunidad INTEGER," + 
        "visible INTEGER," + 
        "aprobacion_utp INTEGER," + 
        "id_ant INTEGER," + 
        "validado INTEGER," + 
        "edicion INTEGER" + 
    ");";
    this.tx.executeSql(query,[]);
}
Clase.prototype.insert = function(vals){
    var query = "INSERT OR REPLACE INTO clase VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    if( typeof vals != 'undefined' ){
        this.id = vals.id;
        this.nombre = vals.nombre;
        this.unidad = vals.unidad;
        this.profesor = vals.profesor;
        this.tipo = vals.tipo;
        this.fechaini = vals.fechaini;
        this.fechafin = vals.fechafin;
        this.creacion = vals.creacion;
        this.modificacion = vals.modificacion;
        this.estado = vals.estado;
        this.asignacion = vals.asignacion;
        this.ejecucion = vals.ejecucion;
        this.curso = vals.curso;
        this.horas = vals.horas;
        this.orden = vals.orden;
        this.ordenxunidad = vals.ordenxunidad;
        this.visible = vals.visible;
        this.aprobacion_utp = vals.aprobacion_utp;
        this.id_ant = vals.id_ant;
        this.validado = vals.validado;
        this.edicion = vals.edicion;
    }
    var insertObject = [
        this.id,
        this.nombre,
        this.unidad,
        this.profesor,
        this.tipo,
        this.fechaini,
        this.fechafin,
        this.creacion,
        this.modificacion,
        this.estado,
        this.asignacion,
        this.ejecucion,
        this.curso,
        this.horas,
        this.orden,
        this.ordenxunidad,
        this.visible,
        this.aprobacion_utp,
        this.id_ant,
        this.validado,
        this.edicion
    ];
    this.tx.executeSql(query,insertObject,null,function(tx,error){
        console.log(error.message);
    });
}
Clase.prototype.getFechaini = function(){
    var d = new Date(0);
    d.setUTCSeconds(this.fechaini);
    return d.toLocaleFormat();
}
Clase.prototype.getFechafin = function(){
    var d = new Date(0);
    d.setUTCSeconds(this.fechafin);
    return d.toLocaleFormat();
}
Clase.prototype.initWithJson = function(json){
    for(var field in json){
        this[field] = json[field];
    }
}
Clase.prototype.selectById = function(callback){
    var query = "SELECT * FROM clase WHERE id='"+this.id+"'";
    this.tx.executeSql(
        query,
        [],
        function(tx,result){
            for(var i=0; i<result.rows.length; i++){
                var row = result.rows.item(i);
                for(var field in row){
                    this[field] = row[field];
                }
            }
            callback();
        },
        function(tx,error){
            console.log("Error en select de Clase");
            console.dir(error);
        }
    );
}
/*
id INTEGER
nombre TEXT
unidad INTEGER
profesor INTEGER
tipo INTEGER
fechaini INTEGER
fechafin INTEGER
creacion INTEGER
modificacion INTEGER
estado INTEGER
asignacion INTEGER
ejecucion INTEGER
curso INTEGER
horas INTEGER
orden INTEGER
ordenxunidad INTEGER
visible INTEGER
aprobacion_utp INTEGER
id_ant INTEGER
validado INTEGER
edicion INTEGER
*/