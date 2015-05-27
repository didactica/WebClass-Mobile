var Planificacion = function(tx){
    this.tx = tx;
    this.createTable();
}
Planificacion.prototype.createTable = function() {
    var query = 'CREATE TABLE IF NOT EXISTS unidad('+
        "id integer primary key autoincrement," + 
        "nombre text," + 
        "tipo integer," + 
        "sector integer," + 
        "colegio integer," + 
        "usuario integer," + 
        "orden integer," + 
        "observacion text," + 
        "clases integer," + 
        "horas integer," + 
        "estado integer," + 
        "creacion integer," + 
        "modificacion integer," + 
        "fechaini integer," + 
        "fechafin integer," + 
        "metodo integer," + 
        "visible integer," + 
        "id_ant integer," + 
        "ambitos varchar(45)," + 
        "nivel integer," + 
        "aprobacion_utp integer," + 
        "origen integer," + 
        "validado integer," + 
        "edicion integer," + 
        "pae integer" +  
    ');';
    this.tx.executeSql(query,[]);
}
Planificacion.prototype.selectId = function(id,callback){
    this.tx.executeSql("SELECT * FROM unidad WHERE id='"+this.id+"'",[],function(tx,res){
        if( res!=null && res.rows!=null ){
            var data = res.rows.item(0);
            this.id = parseInt(data.id);
            this.nombre = data.nombre;
            this.descripcion = data.descripcion;
            this.curso = parseInt(data.curso);
            this.tipo = parseInt(data.tipo);
            this.fechaini = data.fechaini;
            this.fechafin = data.fechafin;
            this.horaini = data.horaini;
            this.horafin = data.horafin;
            this.estado = data.estado;
            this.creacion = data.creacion;
            this.modificacion = data.modificacion;
            this.visible =  parseInt(data.visible);
            this.colegio = parseInt(data.colegio);
            callback();
        }
    });
}
Planificacion.prototype.insert = function(vals){
    var query = "INSERT OR REPLACE INTO unidad VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    if( typeof vals != 'undefined' ){
        this.id = vals.id;
        this.nombre = vals.nombre;
        this.tipo = vals.tipo;
        this.sector = vals.sector;
        this.colegio = vals.colegio;
        this.usuario = vals.usuario;
        this.orden = vals.orden;
        this.observacion = vals.observacion;
        this.clases = vals.clases;
        this.horas = vals.horas;
        this.estado = vals.estado;
        this.creacion = vals.creacion;
        this.modificacion = vals.modificacion;
        this.fechaini = vals.fechaini;
        this.fechafin = vals.fechafin;
        this.metodo = vals.metodo;
        this.visible = vals.visible;
        this.id_ant = vals.id_ant;
        this.ambitos = vals.ambitos;
        this.nivel = vals.nivel;
        this.aprobacion_utp = vals.aprobacion_utp;
        this.origen = vals.origen;
        this.validado = vals.validado;
        this.edicion = vals.edicion;
        this.pae = vals.pae;
    }
    var insertObject = [
        this.id,
        this.nombre,
        this.tipo,
        this.sector,
        this.colegio,
        this.usuario,
        this.orden,
        this.observacion,
        this.clases,
        this.horas,
        this.estado,
        this.creacion,
        this.modificacion,
        this.fechaini,
        this.fechafin,
        this.metodo,
        this.visible,
        this.id_ant,
        this.ambitos,
        this.nivel,
        this.aprobacion_utp,
        this.origen,
        this.validado,
        this.edicion,
        this.pae
    ];
    this.tx.executeSql(query,insertObject,null,function(tx,error){
        console.log(error.message);
    });
}
/*
id int(11)
nombre text
tipo int(11)
sector int(11)
colegio int(11)
usuario int(10)
orden int(11)
observacion text
clases int(11)
horas int(11)
estado int(11)
creacion int(11)
modificacion int(11)
fechaini int(11)
fechafin int(11)
metodo int(11)
visible int(2)
id_ant int(11)
ambitos varchar(45)
nivel int(11)
aprobacion_utp int(1)
origen int(1)
validado int(11)
edicion int(11)
pae int(1)
//*/