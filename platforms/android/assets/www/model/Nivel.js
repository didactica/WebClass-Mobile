var Nivel = function(tx,id,callback,json){
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
Nivel.prototype.createTable = function() {
    var query = "CREATE TABLE IF NOT EXISTS nivel(" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT," + 
        "nombre varchar(60)," + 
        "abreviatura varchar(20)," + 
        "nomenclatura varchar(10)," + 
        "orden INTEGER," + 
        "ano INTEGER," + 
        "visible INTEGER," + 
        "id_ant INTEGER," + 
        "codigo_tipo_ensenanza INTEGER," + 
        "codigo_grado INTEGER" + 
    ");";
    this.tx.executeSql(
        query,
        [],
        function(tx){
            //console.log('tabla nivel creada');
        },
        function(tx,err){
            console.log("Error al crear tabla 'nivel'.");
            console.log(JSON.stringify(tx));
            console.log(JSON.stringify(err));
        }
    );
}
Nivel.prototype.insert = function(vals){
    var query = "INSERT OR REPLACE INTO nivel VALUES(?,?,?,?,?,?,?,?,?,?)";
    if( typeof vals != 'undefined' ){
        this.id = vals.id;
        this.nombre = vals.nombre;
        this.abreviatura = vals.abreviatura;
        this.nomenclatura = vals.nomenclatura;
        this.orden = vals.orden;
        this.ano = vals.ano;
        this.visible = vals.visible;
        this.id_ant = vals.id_ant;
        this.codigo_tipo_ensenanza = vals.codigo_tipo_ensenanza;
        this.codigo_grado = vals.codigo_grado;
    }
    var insertObject = [
        this.id,
        this.nombre,
        this.abreviatura,
        this.nomenclatura,
        this.orden,
        this.ano,
        this.visible,
        this.id_ant,
        this.codigo_tipo_ensenanza,
        this.codigo_grado
    ];
    this.tx.executeSql(query,insertObject,null,function(tx,error){
        console.log(error.message);
    });
}
/*
Nivel.prototype.getFechaini = function(){
    var d = new Date(0);
    d.setUTCSeconds(this.fechaini);
    return d.toLocaleFormat();
}
Nivel.prototype.getFechafin = function(){
    var d = new Date(0);
    d.setUTCSeconds(this.fechafin);
    return d.toLocaleFormat();
}
*/
Nivel.prototype.initWithJson = function(json){
    for(var field in json){
        this[field] = json[field];
    }
}
Nivel.prototype.selectById = function(callback){
    var query = "SELECT * FROM nivel WHERE id='"+this.id+"'";
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
            console.log("Error en select de Nivel");
            console.dir(error);
        }
    );
}
/*

*/