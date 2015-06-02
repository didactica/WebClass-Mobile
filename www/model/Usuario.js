var Usuario = function(tx,id,callback,json){
    this.tx = tx;
    this.createTable();
    if(typeof json!='undefined'){
        this.insert(json);
        callback();
    }
}
Usuario.prototype.createTable = function() {
    var query = "CREATE TABLE IF NOT EXISTS usuario(" +
        " id INTEGER PRIMARY KEY AUTOINCREMENT," + 
        " nombre_usuario VARCHAR(45)," + 
        " clave VARCHAR(32)," + 
        " fecha_creacion INTEGER," + 
        " fecha_modificacion INTEGER," + 
        " visible INTEGER," + 
        " estado INTEGER," + 
        " idrol INTEGER," + 
        " idcolegio INTEGER," + 
        " idtema INTEGER," + 
        " imagen VARCHAR(50)," + 
        " id_ant INTEGER" + 
    ");";
    this.tx.executeSql(query,[]);
}
Usuario.prototype.insert = function(vals){
    var query = "INSERT OR REPLACE INTO usuario VALUES(?,?,?,?,?,?,?,?,?,?,?,?)";
    if( typeof vals != 'undefined' ){
        this.id = vals.id;
        this.nombre_usuario = vals.nombre_usuario;
        this.clave = vals.clave;
        this.fecha_creacion = vals.fecha_creacion;
        this.fecha_modificacion = vals.fecha_modificacion;
        this.visible = vals.visible;
        this.estado = vals.estado;
        this.idrol = vals.idrol;
        this.idcolegio = vals.idcolegio;
        this.idtema = vals.idtema;
        this.imagen = vals.imagen;
        this.id_ant = vals.id_ant;
    }
    var insertObject = [
        this.id,
        this.nombre_usuario,
        this.clave,
        this.fecha_creacion,
        this.fecha_modificacion,
        this.visible,
        this.estado,
        this.idrol,
        this.idcolegio,
        this.idtema,
        this.imagen,
        this.id_ant
    ];
    this.tx.executeSql(query,insertObject,null,function(tx,error){
        console.log(error.message);
    });
}
Usuario.prototype.fetchUser = function(id){
    var user_name;
    if( navigator.connection.type!=Connection.NONE ){
        $.ajax({
            url:'http://didactica.pablogarin.cl/getJSON.php?service=usuario&id='+id,
            dataType:'json',
            async:false,
            success:function(res){
                if( typeof res.data != 'undefined' ){
                    user_name = res.data.nombre_usuario;
                    sql.transaction(function(tx){
                        new Usuario(tx,null,null,res.data);
                    });
                }
            },
            error:function(res,err){
                console.log(JSON.stringify(res),JSON.stringify(err));
            }
        });
    } else {
        console.log('Sin conexión.');
    }
    return user_name;
}