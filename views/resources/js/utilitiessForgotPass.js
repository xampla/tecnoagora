$(document).ready(function() {

  $('#resetForm').submit(function( event ) {
    event.preventDefault();
    var url = $(this).attr( "action" );
    var email = $('#inputEmail').val();
    var reset = $.post(url, {email: email});

    reset.done(function( data ) {
      var msg = data['msg'];
      if(data['ok']) {
        $('#alertInfo').html(
          '<div class="alert alert-success alert-dismissible fade show" role="alert"> \
            '+msg+' \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
        }
        else {
          '<div class="alert alert-danger alert-dismissible fade show" role="alert"> \
            '+msg+' \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>'
        }
    });
  });

  $('#recoverForm').submit(function( event ) {
    event.preventDefault();
    var url = window.location.pathname;
    var pass1 = $('#password').val();
    var pass2 = $('#passwordCheck').val();
    var reset = $.post(url, {pass1: pass1, pass2: pass2});

    reset.done(function( data ) {
      var str = data['msg'];
      if(data['ok']) {
        $('#recoverInfo').html(
          '<div class="alert alert-success alert-dismissible fade show" role="alert"> \
            '+str+' \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
          window.setTimeout(function(){
            window.location.pathname = "/login";
          }, 3000);
        }
        else {
          $('#recoverInfo').html(
            '<div class="alert alert-danger alert-dismissible fade show" role="alert"> \
              '+str+' \
              <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
                <span aria-hidden="true">&times;</span> \
              </button> \
            </div>');
        }

        $('#password').val("");
        $('#passwordCheck').val("");
    });
  });
});
