var Sector = function(tx){
    this.tx = tx;
    this.createTable();
}
Sector.prototype.createTable = function() {
    var query = "CREATE TABLE IF NOT EXISTS sector(" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT," + 
        "nombre VARCHAR(500)," + 
        "nomenclatura VARCHAR(10) NOT NULL," + 
        "orden INTEGER," + 
        "nivel INTEGER," + 
        "grupo INTEGER," + 
        "visible INTEGER," + 
        "id_ant INTEGER NOT NULL"+
    ");";
    this.tx.executeSql(query,[]);
}
Sector.prototype.insert = function(vals,callback){
    var query = "INSERT OR REPLACE INTO sector VALUES(?,?,?,?,?,?,?,?)";
    if( typeof vals != 'undefined' ){
        this.id = vals.id;
        this.nombre = vals.nombre;
        this.nomenclatura = vals.nomenclatura;
        this.orden = vals.orden;
        this.nivel = vals.nivel;
        this.grupo = vals.grupo;
        this.visible = vals.visible;
        this.id_ant = vals.id_ant;
    }
    var insertObject = [
        this.id,
        this.nombre,
        this.nomenclatura,
        this.orden,
        this.nivel,
        this.grupo,
        this.visible,
        this.id_ant
    ];
    this.tx.executeSql(query,insertObject,callback,function(tx,error){
        console.log(error.message);
    });
}