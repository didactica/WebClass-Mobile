var Alumno = function(tx,id,callback,json)
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
Alumno.prototype.createTable = function()
{
    var query = "CREATE TABLE IF NOT EXISTS alumno(" +
        " id INTEGER PRIMARY KEY AUTOINCREMENT," + 
        " alumno INTEGER, " +
        " curso INTEGER, " +
        " apoderado INTEGER, " +
        " estado INTEGER, " +
        " colegio INTEGER, " +
        " nivel INTEGER, " +
        " habilitado INTEGER, " +
        " numLista INTEGER " +
    ");";
    this.tx.executeSql(query,[]);
}
Alumno.prototype.getAsistencia = function(mes)
{
    this.asistencias = [];
    var self = this;
    var d = new Date();
    var a = d.getFullYear();
    var m = d.getMonth()+1;
    var fin = new Date(a,m,0,23,59,59);
    var curDate = fin.toLocaleString();
    curDate = curDate.replace(/\//g,'-');
    var query = "SELECT id FROM alumno_asistencia WHERE id_alumno='"+this.id+"'";
    if( (mes!= null) && (typeof mes !== 'undefined') ){
        query += " and fecha between '01-"+mes+"-"+year+"' and '"+curDate.toString()+"'";
    }
    this.tx.executeSql(
        query,
        [],
        function(tx,result){
            if( (result!=null) && (result.rows != null) && (result.rows.length>0) ){
                for(var i=0;i<result.rows.length;i++){
                    var id = (result.rows.item(i)).id;
                    var asObj = new Asistencia(tx,id,function(){
                        self.asistencias.push(asObj);
                    });
                }
            }
        },
        function(tx,error){
            console.log("Error de SQLite: ");
            console.log(tx.message);
            console.log(error.message);
        }
    )
}
Alumno.prototype.setAsistencia = function(estado,justificacion,observaciones,informado){
    var fObj = elements.fecha;
    var fecha = year+'-'+(fObj.mes<10?'0'+parseInt(fObj.mes):fObj.mes)+'-'+(fObj.dia<10?'0'+parseInt(fObj.dia):fObj.dia);
    var self = this;
    var data = [
        this.id,
        fecha,
        (justificacion||''),
        estado,
        (observaciones||''),
        this.curso,
        (informado||'')
    ];
    var query = "INSERT OR REPLACE INTO alumno_asistencia(id_alumno,fecha,justificacion,estado,observaciones,id_curso,informado) VALUES(?,?,?,?,?,?,?)";
    this.tx.executeSql(
        query,
        data,
        function(tx,result){
            var asistencia = {
                id:result.insertId,
                id_alumno:data[0],
                fecha:data[1],
                justificacion:data[2],
                estado:data[3],
                observaciones:data[4],
                id_curso:data[5],
                informado:data[6]
            }
            self.syncToServer(asistencia);
        },
        function(tx,error){
            console.log(JSON.stringify(error));
        }
    );
}
Alumno.prototype.syncToServer = function(asistencia){
    var self = this;
    if( typeof asistencia.id == 'undefined' ){
        
    } else {
        if( (typeof navigator.connection != 'undefined') && (navigator.connection.type!=Connection.NONE) ){
            var user = window.localStorage.getItem('user');
            var token = window.localStorage.getItem('token');
            var data = {
                'service'   : 'syncToServer',
                'table'     : 'alumno_asistencia',
                'user'      : user,
                'key'       : 'id',
                'debug'     : true,
                'index'     : asistencia.id,
                'data'      : asistencia
            }
            $.ajax({
                url:'http://didactica.pablogarin.cl/getJSON.php',
                data: data,
                dataType: 'json',
                success: function(resp){
                    // console.log(JSON.stringify(resp));
                },
                error: function(resp,err){
                    self.setAsistenciaPendiente(asistencia.id);
                    console.log(JSON.stringify(resp));
                    console.log(err)
                }
            });
        } else {
            this.setAsistenciaPendiente(asistencia.id);
        }
    }
}
Alumno.prototype.setAsistenciaPendiente = function(id)
{
    var pendientes = window.localStorage.getItem("pendientes");
    if( pendientes == 'null' || pendientes == null ){
        pendientes = {};
    } else {
        pendientes = JSON.parse(pendientes);
    }
    if( typeof pendientes.alumno_asistencia == 'undefined' ){
        pendientes.alumno_asistencia = ['id'];
    }
    var notIncluded = true;
    for(var i in pendientes.alumno_asistencia){
        if(pendientes.alumno_asistencia[i]==id){
            notIncluded = false;
        }
    }
    if(notIncluded){
        pendientes.alumno_asistencia.push(id);
    }
    pendientes = JSON.stringify(pendientes);
    window.localStorage.setItem("pendientes",pendientes);
}
Alumno.prototype.selectById = function(callback)
{
    var query = "SELECT * FROM alumno a LEFT JOIN usuario_detalle u ON a.alumno=u.idusuario WHERE a.id='"+this.id+"'";
    var self = this;
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
            self.getAsistencia();
            callback();
        },
        function(tx,err){
            console.log("1.- " + JSON.stringify(tx));
            console.log("2.- " + JSON.stringify(err));
        }
    );
}
Alumno.prototype.insert = function(vals,callback)
{
    var query = "INSERT OR REPLACE INTO alumno VALUES(?,?,?,?,?,?,?,?,?)";
    if( typeof vals !== 'undefined' ){
        this.id = vals.id;
        this.alumno = vals.alumno;
        this.curso = vals.curso;
        this.apoderado = vals.apoderado;
        this.estado = vals.estado;
        this.colegio = vals.colegio;
        this.nivel = vals.nivel;
        this.habilitado = vals.habilitado;
        this.numLista = vals.numLista;
    }
    var insertObject = [
        this.id,
        this.alumno,
        this.curso,
        this.apoderado,
        this.estado,
        this.colegio,
        this.nivel,
        this.habilitado,
        this.numLista
    ];
    this.tx.executeSql(query,insertObject,callback,function(tx,error){
        console.log(error.message);
    });
}

Alumno.prototype.initWithJson = function(json,callback)
{
    for(var field in json){
        this[field] = json[field];
    }
    if(callback){
        callback();
    }
}