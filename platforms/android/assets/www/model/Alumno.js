var Alumno = function(tx,id,callback,json)
{
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
Alumno.prototype.createTable = function()
{
    var query = "CREATE TABLE IF NOT EXISTS alumno(" +
        " id INTEGER PRIMARY KEY AUTOINCREMENT," + 
        " alumno INTEGER, " +
        " curso INTEGER, " +
        " apoderado INTEGER, " +
        " estado INTEGER, " +
        " colegio INTEGER, " +
        " nivel INTEGER, " +
        " habilitado INTEGER, " +
        " numLista INTEGER " +
    ");";
    this.tx.executeSql(query,[]);
}
Alumno.prototype.getAsistencia = function(mes)
{
    this.asistencias = [];
    var self = this;
    var d = new Date();
    var a = d.getFullYear();
    var m = d.getMonth()+1;
    var fin = new Date(a,m,0,23,59,59);
    var curDate = fin.toLocaleString();
    curDate = curDate.replace(/\//g,'-');
    var query = "SELECT id FROM alumno_asistencia WHERE id_alumno='"+this.id+"'";
    if( (mes!= null) && (typeof mes !== 'undefined') ){
        query += " and fecha between '01-"+mes+"' and '"+curDate.toString()+"'";
    }
    this.tx.executeSql(
        query,
        [],
        function(tx,result){
            if( (result!=null) && (result.rows != null) && (result.rows.length>0) ){
                for(var i=0;i<result.rows.length;i++){
                    var id = (result.rows.item(i)).id;
                    console.log('id: '+id);
                    var asObj = new Asistencia(tx,id,function(){
                        self.asistencias.push(asObj);
                    });
                }
            }
        },
        function(tx,error){
            console.log("Error de SQLite: ");
            console.log(tx.message);
            console.log(error.message);
        }
    )
}
Alumno.prototype.selectById = function(callback)
{
    var query = "SELECT * FROM alumno a LEFT JOIN usuario u ON a.alumno=u.id WHERE a.id='"+this.id+"'";
    var self = this;
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
            self.getAsistencia();
            callback();
        },
        function(tx,err){
            console.log("1.- " + JSON.stringify(tx));
            console.log("2.- " + JSON.stringify(err));
        }
    );
}
Alumno.prototype.insert = function(vals)
{
    var query = "INSERT OR REPLACE INTO alumno VALUES(?,?,?,?,?,?,?,?,?)";
    if( typeof vals !== 'undefined' ){
        this.id = vals.id;
        this.alumno = vals.alumno;
        this.curso = vals.curso;
        this.apoderado = vals.apoderado;
        this.estado = vals.estado;
        this.colegio = vals.colegio;
        this.nivel = vals.nivel;
        this.habilitado = vals.habilitado;
        this.numLista = vals.numLista;
    }
    var insertObject = [
        this.id,
        this.alumno,
        this.curso,
        this.apoderado,
        this.estado,
        this.colegio,
        this.nivel,
        this.habilitado,
        this.numLista
    ];
    this.tx.executeSql(query,insertObject,null,function(tx,error){
        console.log(error.message);
    });
}

Alumno.prototype.initWithJson = function(json,callback)
{
    for(var field in json){
        this[field] = json[field];
    }
    if(callback){
        callback();
    }
}