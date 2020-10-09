$(document).ready(function() {

  $('#contactForm').submit(function( event ) {
    event.preventDefault();
    var url = $(this).attr( "action" );
    var name = $('#inputName').val();
    var surname = $('#inputSurname').val();
    var desc = $('#inputDesc').val();
    var email = $('#inputMail').val();
    var contact = $.post(url, {name: name, surname:surname, desc:desc, email: email});

    contact.done(function( data ) {
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
        $('#alertInfo').html(
          '<div class="alert alert-danger alert-dismissible fade show" role="alert"> \
              '+msg+' \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
      }
    });
  });

});
