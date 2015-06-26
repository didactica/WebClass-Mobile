var Curso = function(tx,id,callback,json)
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
Curso.prototype.createTable = function() {
    var query = "CREATE TABLE IF NOT EXISTS curso(" +
        "id INTEGER, " + 
        "nombre varchar(500), " + 
        "letra varchar(45), " + 
        "nivel INTEGER, " + 
        "ensenanza INTEGER, " + 
        "colegio INTEGER, " + 
        "profesor INTEGER, " + 
        "visible INTEGER, " + 
        "periodo_evaluacion INTEGER, " + 
        "ano INTEGER, " + 
        "prcmatricula INTEGER, " + 
        "jornada INTEGER " + 
    ");";
    this.tx.executeSql(query,[]);
}
Curso.prototype.selectById = function(callback)
{
    var query = "SELECT * FROM curso WHERE id='"+this.id+"'";
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
Curso.prototype.insert = function(vals,callback){
    var query = "INSERT OR REPLACE INTO curso VALUES(?,?,?,?,?,?,?,?,?,?,?,?)";
    if( typeof vals != 'undefined' ){
        this.id = vals.id;
        this.nombre = vals.nombre;
        this.letra = vals.letra;
        this.nivel = vals.nivel;
        this.ensenanza = vals.ensenanza;
        this.colegio = vals.colegio;
        this.profesor = vals.profesor;
        this.visible = vals.visible;
        this.periodo_evaluacion = vals.periodo_evaluacion;
        this.ano = vals.ano;
        this.prcmatricula = vals.prcmatricula;
        this.jornada = vals.jornada;
    }
    var insertObject = [
        this.id,
        this.nombre,
        this.letra,
        this.nivel,
        this.ensenanza,
        this.colegio,
        this.profesor,
        this.visible,
        this.periodo_evaluacion,
        this.ano,
        this.prcmatricula,
        this.jornada
    ];
    this.tx.executeSql(query,insertObject,callback,function(tx,error){
        console.log(error.message);
    });
}
Curso.prototype.initWithJson = function(json,callback){
    for(var field in json){
        this[field] = json[field];
    }
    if(callback){
        callback();
    }
}