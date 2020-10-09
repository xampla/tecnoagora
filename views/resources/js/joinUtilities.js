$( document ).ready(function() {

  $('#joinForm').submit(function(event){
    event.preventDefault();
    var url = $(this).attr( "action" );
    var name = $('#inputJoinName').val();
    var surname = $('#inputJoinSurname').val();
    var username = $('#inputJoinUsername').val();
    var email = $('#inputJoinEmail').val();
    var bio = $('#inputJoinBio').val();
    var web = $('#inputJoinLink').val();
    var pass = $('#inputJoinPass').val();

    var addProj = $.post(url, {name:name,surname:surname,username:username,pass:pass,email:email,socialLink:web,description:bio});
    addProj.done(function( data ) {
      var msg = data['msg'];
      if(data['ok']) {
        $('#alertJoinInfo').html(
          '<div class="alert alert-success alert-dismissible fade show" role="alert"> \
            <small>'+msg+'</small> \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
        window.setTimeout(function(){
          window.location.pathname = "/login";
        }, 1500);
      }
      else {
        $('#alertJoinInfo').html(
          '<div class="alert alert-danger alert-dismissible fade show" role="alert"> \
            <small>'+msg+'</small> \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
      }
    });
  });

});
