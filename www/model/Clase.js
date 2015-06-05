var Clase = function(tx,id,callback,json){
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
Clase.prototype.createTable = function() {
    var query = "CREATE TABLE IF NOT EXISTS clase(" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT," + 
        "nombre TEXT," + 
        "unidad INTEGER," + 
        "profesor INTEGER," + 
        "tipo INTEGER," + 
        "fechaini INTEGER," + 
        "fechafin INTEGER," + 
        "creacion INTEGER," + 
        "modificacion INTEGER," + 
        "estado INTEGER," + 
        "asignacion INTEGER," + 
        "ejecucion INTEGER," + 
        "curso INTEGER," + 
        "horas INTEGER," + 
        "orden INTEGER," + 
        "ordenxunidad INTEGER," + 
        "visible INTEGER," + 
        "aprobacion_utp INTEGER," + 
        "id_ant INTEGER," + 
        "validado INTEGER," + 
        "edicion INTEGER" + 
    ");";
    this.tx.executeSql(query,[]);
}
Clase.prototype.insert = function(vals){
    var query = "INSERT OR REPLACE INTO clase VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
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
            this.unidad = vals.unidad;
            this.profesor = vals.profesor;
            this.tipo = vals.tipo;
            this.fechaini = vals.fechaini;
            this.fechafin = vals.fechafin;
            this.creacion = vals.creacion;
            this.modificacion = vals.modificacion;
            this.estado = vals.estado;
            this.asignacion = vals.asignacion;
            this.ejecucion = vals.ejecucion;
            this.curso = vals.curso;
            this.horas = vals.horas;
            this.orden = vals.orden;
            this.ordenxunidad = vals.ordenxunidad;
            this.visible = vals.visible;
            this.aprobacion_utp = vals.aprobacion_utp;
            this.id_ant = vals.id_ant;
            this.validado = vals.validado;
            this.edicion = vals.edicion;
        }
    }
    var insertObject = [
        this.id,
        this.nombre,
        this.unidad,
        this.profesor,
        this.tipo,
        this.fechaini,
        this.fechafin,
        this.creacion,
        Date.now(),
        this.estado,
        this.asignacion,
        this.ejecucion,
        this.curso,
        this.horas,
        this.orden,
        this.ordenxunidad,
        this.visible,
        this.aprobacion_utp,
        this.id_ant,
        this.validado,
        this.edicion
    ];
    var self = this;
    this.tx.executeSql(
        query,
        insertObject,
        function(tx){
            //window.localStorage.setItem("modificacion",SDate.now());
            self.syncToServer();
        },
        function(tx,error){
            console.log(JSON.stringify(error));
            console.log(error.message);
        }
    );
}
Clase.prototype.getFechaini = function(){
    var d = new Date(0);
    d.setUTCSeconds(this.fechaini);
    return d.toLocaleFormat();
}
Clase.prototype.getFechafin = function(){
    var d = new Date(0);
    d.setUTCSeconds(this.fechafin);
    return d.toLocaleFormat();
}
Clase.prototype.initWithJson = function(json,callback){
    for(var field in json){
        this[field] = json[field];
    }
    var d = new Date(0);
    d.setUTCSeconds(this.fechaini);
    this.fechainibonita = d.toLocaleDateString();
    d = new Date(0);
    d.setUTCSeconds(this.fechafin);
    this.fechafinbonita = d.toLocaleDateString();
    if(callback){
        callback();
    }
}
Clase.prototype.selectById = function(callback){
    var self = this;
    var query = "SELECT * FROM clase WHERE id='"+this.id+"'";
    this.tx.executeSql(
        query,
        [],
        function(tx,result){
            if( result!=null && result.rows!=null && result.rows.length>0 ){
                var row = result.rows.item(0);
                for(var field in row){
                    self[field] = row[field];
                }
                var d = new Date(0);
                d.setUTCSeconds(self.fechaini);
                self.fechainibonita = d.toLocaleDateString();
                d = new Date(0);
                d.setUTCSeconds(self.fechafin);
                self.fechafinbonita = d.toLocaleDateString();
            }
            callback();
        },
        function(tx,error){
            console.log("Error en select de Clase");
            console.dir(error);
        }
    );
}
Clase.prototype.syncToServer = function(){
    if( typeof this.id == 'undefined' ){
        
    } else {
        if( (typeof navigator.connection != 'undefined') && (navigator.connection.type!=Connection.NONE) ){
            var user = window.localStorage.getItem('user');
            var token = window.localStorage.getItem('token');
            var data = {
                'service'   : 'syncToServer',
                'table'     : 'clase',
                'user'      : user,
                'key'       : 'id',
                'index'     : this.id,
                'data'      : {
                    'id'       : this.id,
                    'nombre'   : this.nombre,
                    'unidad'   : this.unidad,
                    'profesor' : this.profesor,
                    'tipo'     : this.tipo,
                    'fechaini' : this.fechaini,
                    'fechafin' : this.fechafin,
                    'creacion' : this.creacion,
                    'modificacion' : this.modificacion,
                    'estado'   : this.estado,
                    'asignacion'   : this.asignacion,
                    'ejecucion'    : this.ejecucion,
                    'curso'    : this.curso,
                    'horas'    : this.horas,
                    'orden'    : this.orden,
                    'ordenxunidad' : this.ordenxunidad,
                    'visible'  : this.visible,
                    'aprobacion_utp': this.aprobacion_utp,
                    'id_ant'   : this.id_ant,
                    'validado' : this.validado,
                    'edicion'   : this.edicion
                }
            }
            $.ajax({
                url:'http://didactica.pablogarin.cl/getJSON.php',
                data: data,
                dataType: 'json',
                success: function(resp){

                },
                error: function(resp,err){
                    console.log(JSON.stringify(resp));
                    console.log(err)
                }
            });
        } else {
            var pendientes = window.localStorage.getItem("pendientes");
            if( pendientes == 'null' || pendientes == null ){
                pendientes = {};
            } else {
                pendientes = JSON.parse(pendientes);
            }
            if( typeof pendientes.clase == 'undefined' ){
                pendientes.clase = ['id'];
            }
            var notIncluded = true;
            for(var i in pendientes.clase){
                if(pendientes.clase[i]==this.id){
                    notIncluded = false;
                }
            }
            if(notIncluded){
                pendientes.clase.push(this.id);
            }
            pendientes = JSON.stringify(pendientes);
            window.localStorage.setItem("pendientes",pendientes);
        }
    }
}
/*
id INTEGER
nombre TEXT
unidad INTEGER
profesor INTEGER
tipo INTEGER
fechaini INTEGER
fechafin INTEGER
creacion INTEGER
modificacion INTEGER
estado INTEGER
asignacion INTEGER
ejecucion INTEGER
curso INTEGER
horas INTEGER
orden INTEGER
ordenxunidad INTEGER
visible INTEGER
aprobacion_utp INTEGER
id_ant INTEGER
validado INTEGER
edicion INTEGER
*/