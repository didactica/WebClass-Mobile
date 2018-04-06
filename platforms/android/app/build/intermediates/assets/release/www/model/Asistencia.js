var Asistencia = function(tx,id,callback,json)
{
    // setear todas las variables a usar.
    this.id = null;
    this.id_alumno = null;
    this.fecha = null;
    this.justificacion = null;
    this.estado = null;
    this.observaciones = null;
    this.id_curso = null;
    this.informado = null;
    this.horaLlegada = null;
    this.estadoFinal = null;
    this.class = null;

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
Asistencia.prototype.createTable = function()
{
    var query = "CREATE TABLE IF NOT EXISTS alumno_asistencia(" +
        " id INTEGER PRIMARY KEY AUTOINCREMENT," +  
        " id_alumno INTEGER," + 
        " fecha date," + 
        " justificacion varchar(256)," + 
        " estado INTEGER," + 
        " observaciones varchar(256)," + 
        " id_curso INTEGER," + 
        " informado INTEGER," +
        " horaLlegada varchar(32)," +
        " estadoFinal INTEGER," +
        " ultima_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP," +
        " CONSTRAINT asisUnica UNIQUE(id_alumno, fecha, id_curso)" + 
    ");";
    this.tx.executeSql(query,[]);
}
Asistencia.prototype.selectById = function(callback)
{
    var query = "SELECT * FROM alumno_asistencia WHERE id='"+this.id+"'";
    this.tx.executeSql(
        query,
        [],
        function(tx,result){
            if( result!=null && result.rows!=null && result.rows.length>0 ){
                var row = result.rows.item(0);
                for(var field in row){
                    self[field] = row[field];
                }
            }
            if( typeof callback !== 'undefined' ){
                callback();
            }
        },
        function(tx,err){
            console.log("1.- " + JSON.stringify(tx));
            console.log("2.- " + JSON.stringify(err));
        }
    );
}
Asistencia.prototype.insert = function(vals,callback)
{
    var query = "INSERT OR REPLACE INTO alumno_asistencia VALUES(?,?,?,?,?,?,?,?,?,?,?)";
    if( typeof vals !== 'undefined' ){
        this.id = vals.id;
        this.id_alumno = vals.id_alumno;
        this.fecha = vals.fecha;
        this.justificacion = vals.justificacion;
        this.estado = vals.estado;
        this.observaciones = vals.observaciones;
        this.id_curso = vals.id_curso;
        this.informado = vals.informado;
        this.horaLlegada = vals.horaLlegada;
        this.estadoFinal = vals.estadoFinal;
    }
	if( !Date.now() ){
		Date.now = function(){ return new Date().getTime(); }
	}
    var insertObject = [
        this.id,
        this.id_alumno,
        this.fecha,
        this.justificacion,
        this.estado,
        this.observaciones,
        this.id_curso,
        this.informado,
        this.horaLlegada,
        this.estadoFinal,
		Date.now()
    ];
    this.tx.executeSql(query,insertObject,callback,function(tx,error){
        console.log(error.message);
    });
}
Asistencia.prototype.initWithJson = function(json,callback){
    for(var field in json){
        this[field] = json[field];
    }
    if(callback){
        callback();
    }
}
// metodo de tipo estatico.
/*Asistencia.prototype.getAsistenciaPorAlumno = function(alumnoObj,tx)
{
    var query = "SELECT * FROM alumno_asistencia WHERE id_alumno='"+idAlumno+"'";
    tx.executeSql(
        query,
        [],
        function(tx,result){
            var asistencia = {};
            if( result!=null && result.rows!=null && result.rows.length>0 ){
                var row = result.rows.item(0);
                for(var field in row){
                    self[field] = row[field];
                }
            }
        },
        function(tx,err){
            console.log("1.- " + JSON.stringify(tx));
            console.log("2.- " + JSON.stringify(err));
        }
    );
}
//*/
