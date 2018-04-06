var ClaseDetalle = function(tx){
    this.tx = tx;
    this.createTable();
}
ClaseDetalle.prototype.createTable = function() {
    var query = "CREATE TABLE IF NOT EXISTS clase_detalle(" +
        " id INTEGER PRIMARY KEY NOT NULL," + 
        " idclase INTEGER," + 
        " inicio TEXT," + 
        " desarrollo TEXT," + 
        " cierre TEXT," + 
        " evaluacion TEXT," + 
        " motivacion TEXT," + 
        " recursos TEXT," + 
        " instruccion TEXT," + 
        " observacion TEXT," + 
        " comentario TEXT" + 
    ");";
    this.tx.executeSql(query,[]);
}
ClaseDetalle.prototype.insert = function(vals,callback){
    var query = "INSERT OR REPLACE INTO clase_detalle VALUES(?,?,?,?,?,?,?,?,?,?,?)";
    if( typeof vals != 'undefined' ){
        this.id = vals.id;
        this.idclase = vals.idclase;
        this.inicio = vals.inicio;
        this.desarrollo = vals.desarrollo;
        this.cierre = vals.cierre;
        this.evaluacion = vals.evaluacion;
        this.motivacion = vals.motivacion;
        this.recursos = vals.recursos;
        this.instruccion = vals.instruccion;
        this.observacion = vals.observacion;
        this.comentario = vals.comentario;
    }
    var insertObject = [
        this.id,
        this.idclase,
        this.inicio,
        this.desarrollo,
        this.cierre,
        this.evaluacion,
        this.motivacion,
        this.recursos,
        this.instruccion,
        this.observacion,
        this.comentario
    ];
    this.tx.executeSql(query,insertObject,callback,function(tx,error){
        console.log(error.message);
    });
}