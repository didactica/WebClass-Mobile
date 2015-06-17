var Planificacion = function(tx,id,callback,json){
    this.tx = tx;
    if(typeof json != 'undefined'){
        this.initWithJson(json,callback);
    } else {
        this.createTable();
        if(id!=null){
            this.id = id;
            this.selectById(callback);
        }
    }
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
Planificacion.prototype.initWithJson = function(json,callback){
    for(var field in json){
        this[field] = json[field];
    }
    this.fechaBonitaIni = this.getFechaini();
    this.fechaBonitaFin = this.getFechafin();
    this.progress = ((this.clasesTerminadas*100)/this.clases);
}
Planificacion.prototype.selectById = function(callback){
    // this es una variable contextual, por lo que reservamos la global para trabajar con un subcontexto
    var self = this;
    var query = "SELECT un3.*, us.nombre_usuario as autor " + 
        "FROM (" + 
        "   SELECT un2.*, s.nombre as sectorNombre " + 
        "   FROM (" + 
        "       SELECT un.*, n.nombre as nivelNombre " + 
        "       FROM unidad un " + 
        "       LEFT JOIN nivel n " + 
        "       ON n.id=un.nivel " + 
        "       WHERE un.id='"+this.id+"'" + 
        "   ) un2 " + 
        "   LEFT JOIN sector s" + 
        "   ON s.id=un2.sector" + 
        ") un3 " + 
        "LEFT JOIN usuario us " + 
        "ON un3.usuario=us.id;";
    this.tx.executeSql(
        query,
        [],
        function(tx,res){
            if( res!=null && res.rows!=null && res.rows.length>0 ){
                var data = res.rows.item(0);
                for(var field in data){
                    self.setField(field,data[field]);
                }
                if( this.autor == null ){
                    (new Usuario(tx)).fetchUser(this.usuario,callback);
                }
                self.setField('fechaBonitaIni',self.getFechaini());
                self.setField('fechaBonitaFin',self.getFechafin());
                self.getClases(callback);
            } else {
                callback();
            }
        },function(tx,err){
            console.log("1.- "+JSON.stringify(tx));
            console.log("2.- "+err.message);
            //loadPage('planificacion');
            $.mobile.loading('hide');
            return false;
        }
    );
}
Planificacion.prototype.setField = function(field,value){
    this[field] = value;
}
Planificacion.prototype.insert = function(vals){
    var query = "INSERT OR REPLACE INTO unidad VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    if( typeof vals != 'undefined' ){
        if( 
            (
                (typeof this.modificacion != 'undefined') && 
                (vals.modificacion>this.modificacion)
            ) || 
            (typeof this.modificacion == 'undefined') 
        ){
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
        Date.now(),
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
Planificacion.prototype.getClases = function(callback){
    var self = this;
    this.numeroClases = this.clases;
    this.clases = [];
    var query = "SELECT * FROM clase where unidad='"+this.id+"'";
    var totalClases = this.clases;
    var clasesTerminadas = 0;
    this.tx.executeSql(query,[],function(tx,res){
        for(var i = 0; i<res.rows.length;i++){
            var obj = res.rows.item(i);
            if( obj.ejecucion==1 ){
                clasesTerminadas++;
            }
            var c = new Clase(tx,null,null,obj);
            self.clases.push(c);
        }
        var avg = clasesTerminadas/totalClases;
        self.progress = avg*100;
        callback();
    });
}
Planificacion.prototype.getFechaini = function(){
    var d = new Date(0);
    d.setUTCSeconds(this.fechaini);
    return d.toLocaleDateString();
}
Planificacion.prototype.getFechafin = function(){
    var d = new Date(0);
    d.setUTCSeconds(this.fechafin);
    return d.toLocaleDateString();
}
//Planificacion.prototype.addClass = function(class){ [ . . . ] }
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