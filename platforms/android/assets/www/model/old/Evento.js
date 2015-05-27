var Evento = function(con,id){
    this.con = con;
    this.createTable();
    if(typeof id != 'undefined'){
        this.id = id;
        this.selectId(this.id);
    }
}
Evento.prototype.createTable = function() {
    var query = 'CREATE TABLE IF NOT EXISTS evento('+
        'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
        'nombre varchar(40), '+
        'descripcion varchar(255),' +
        'curso integer, '+
        'tipo integer, '+
        'fechaini varchar(40),' +
        'fechafin varchar(40),' +
        'horaini varchar(40),' +
        'horafin varchar(40),'+
        'estado varchar(45),'+
        'creacion varchar(45),'+
        'modificacion varchar(45),'+
        'visible integer,'+
        'colegio integer'+
    ');';
    this.con.queryDB(query,[]);
}
Evento.prototype.selectId = function(id,callback){
    var data = this.con.queryDB("SELECT * FROM evento WHERE id='"+this.id+"'",[],function(tx,res){
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
Evento.prototype.insert = function(vals){
    var query = "INSERT OR REPLACE INTO evento VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    if( typeof vals != 'undefined' ){
        this.id = parseInt(vals.id);
        this.nombre = vals.nombre;
        this.descripcion = vals.descripcion;
        this.curso = parseInt(vals.curso);
        this.tipo = parseInt(vals.tipo);
        this.fechaini = vals.fechaini;
        this.fechafin = vals.fechafin;
        this.horaini = vals.horaini;
        this.horafin = vals.horafin;
        this.estado = vals.estado;
        this.creacion = vals.creacion;
        this.modificacion = vals.modificacion;
        this.visible =  parseInt(vals.visible);
        this.colegio = parseInt(vals.colegio);
    }
    var insertObject = [
        this.id,
        this.nombre,
        this.descripcion,
        this.curso,
        this.tipo,
        this.fechaini,
        this.fechafin,
        this.horaini,
        this.horafin,
        this.estado,
        this.creacion,
        this.modificacion,
        this.visible,
        this.colegio
    ];
    this.con.queryDB(query,insertObject,null,function(tx,error){
        console.log(error.message);
    });
}
/*
id int(11)
nombre varchar(45)
usuario int(10)
descripcion text
curso int(11)
tipo int(11)
fechaini varchar(45)
fechafin varchar(45)
estado varchar(45)
creacion varchar(45)
modificacion varchar(45)
visible int(11)
colegio int(11)
id_ant int(11)
*/