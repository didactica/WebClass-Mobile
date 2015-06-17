var DetalleUsuario = function(tx,id,callback,json){
    this.tx = tx;
    this.createTable();
    if(typeof json!='undefined'){
        this.insert(json);
        callback();
    }
}
DetalleUsuario.prototype.createTable = function() {
    var query = "CREATE TABLE IF NOT EXISTS usuario_detalle(" +
        " id INTEGER PRIMARY KEY AUTOINCREMENT," + 
        "idusuario int(11), " + 
        "rut varchar(45), " + 
        "nombre_usuario varchar(25), " + 
        "apellido_paterno varchar(45), " + 
        "apellido_materno varchar(45), " + 
        "sexo int(11), " + 
        "direccion varchar(100), " + 
        "idcomuna int(11), " + 
        "idprovincia int(11), " + 
        "idregion int(11), " + 
        "telefono int(11), " + 
        "correo varchar(100), " + 
        "cargo varchar(75), " + 
        "celular int(11), " + 
        "observaciones varchar(100), " + 
        "nivel_capacitacion float, " + 
        "fecha_capacitacion int(11), " + 
        "graduado int(11), " + 
        "creador int(11), " + 
        "iduniversidad int(11), " + 
        "titulo_universitario varchar(100), " + 
        "nacimiento varchar(45), " + 
        "fecha_inicio_capacitacion int(11), " + 
        "porcentaje_enc double, " + 
        "sms tinyint(4), " + 
        "sms_disponible int(11), " + 
        "pass_mail varchar(250) " + 
    ");";
    this.tx.executeSql(query,[]);
}
DetalleUsuario.prototype.insert = function(vals){
    var query = "INSERT OR REPLACE INTO usuario_detalle VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    if( typeof vals != 'undefined' ){
        this.id = vals.id;
        this.idusuario = vals.idusuario;
        this.rut = vals.rut;
        this.nombre_usuario = vals.nombre_usuario;
        this.apellido_paterno = vals.apellido_paterno;
        this.apellido_materno = vals.apellido_materno;
        this.sexo = vals.sexo;
        this.direccion = vals.direccion;
        this.idcomuna = vals.idcomuna;
        this.idprovincia = vals.idprovincia;
        this.idregion = vals.idregion;
        this.telefono = vals.telefono;
        this.correo = vals.correo;
        this.cargo = vals.cargo;
        this.celular = vals.celular;
        this.observaciones = vals.observaciones;
        this.nivel_capacitacion = vals.nivel_capacitacion;
        this.fecha_capacitacion = vals.fecha_capacitacion;
        this.graduado = vals.graduado;
        this.creador = vals.creador;
        this.iduniversidad = vals.iduniversidad;
        this.titulo_universitario = vals.titulo_universitario;
        this.nacimiento = vals.nacimiento;
        this.fecha_inicio_capacitacion = vals.fecha_inicio_capacitacion;
        this.porcentaje_enc = vals.porcentaje_enc;
        this.sms = vals.sms;
        this.sms_disponible = vals.sms_disponible;
        this.pass_mail = vals.pass_mail;
    }
    var insertObject = [
        this.id,
        this.idusuario,
        this.rut,
        this.nombre_usuario,
        this.apellido_paterno,
        this.apellido_materno,
        this.sexo,
        this.direccion,
        this.idcomuna,
        this.idprovincia,
        this.idregion,
        this.telefono,
        this.correo,
        this.cargo,
        this.celular,
        this.observaciones,
        this.nivel_capacitacion,
        this.fecha_capacitacion,
        this.graduado,
        this.creador,
        this.iduniversidad,
        this.titulo_universitario,
        this.nacimiento,
        this.fecha_inicio_capacitacion,
        this.porcentaje_enc,
        this.sms,
        this.sms_disponible,
        this.pass_mail
    ];
    this.tx.executeSql(query,insertObject,null,function(tx,error){
        console.log(error.message);
    });
}