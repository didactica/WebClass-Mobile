var Sector = function(con,id){
    this.con = con;
    this.createTable();
    if(typeof id != 'undefined'){
        this.id = id;
        this.selectId(this.id);
    }
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
    this.con.queryDB(query,[]);
}
Sector.prototype.insert = function(vals){
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
    this.con.queryDB(query,insertObject,null,function(tx,error){
        console.log(error.message);
    });
}