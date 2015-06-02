var SectorGrupo = function(tx){
    this.tx = tx;
    this.createTable();
}
SectorGrupo.prototype.createTable = function() {
    var query = "CREATE TABLE IF NOT EXISTS sector_grupo(" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT," + 
        "nombre VARCHAR(45)"+
    ");";
    this.tx.executeSql(query,[]);
}
SectorGrupo.prototype.insert = function(vals){
    var query = "INSERT OR REPLACE INTO sector_grupo VALUES(?,?)";
    if( typeof vals != 'undefined' ){
        this.id = vals.id;
        this.nombre = vals.nombre;
    }
    var insertObject = [
        this.id,
        this.nombre,
    ];
    this.tx.executeSql(query,insertObject,null,function(tx,error){
        console.log(error.message);
    });
}