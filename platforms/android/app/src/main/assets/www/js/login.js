document.addEventListener('deviceready',onDeviceReady,false);
function onDeviceReady()
{
    $("#loginForm").on("submit",function(ev){
        alert('login');
        $("#send").attr('disabled','disabled');
        ev.preventDefault();
        return login();
    })
}
function login()
{
    //e.preventDefault();
    var params = { 'user':$("[name='user']").val(),'pass':$("[name='pass']").val() };
    $.post('https://pablogarin.cl/login.php',params,function(resp){
    //$.post('http://pablogarin.cl/login.php',params,function(resp){
        console.log(resp);
        resp = eval("("+resp+")");
        if(resp.ok){
            window.localStorage.setItem('user', params.user);
            window.localStorage.setItem('token', resp.hash);
            $.mobile.changePage('index.html',{reverse:false,transition:'slide'});
        }
    });
    return false;
}
