$( document ).ready(function() {

  $('#logForm').submit(function( event ) {
    event.preventDefault();
    var url = $(this).attr( "action" );
    var email = $('#inputEmailLog').val();
    var password = $('#inputPassLog').val();
    var remember = document.getElementById('inputRemLog').checked;

    var login = $.post(url, {email: email, pass:password, remember:remember});
    login.done(function( data ) {
      console.log(data);
      var msg = data['msg'];
      if(data['ok']) {
        $('#alertLogInfo').html(
          '<div class="alert alert-success alert-dismissible fade show" role="alert"> \
            <small>'+msg+'</small> \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
        window.setTimeout(function(){
          window.location.pathname = "/explora";
        }, 1500);
      }
      else {
        $('#alertLogInfo').html(
          '<div class="alert alert-danger alert-dismissible fade show" role="alert"> \
            <small>'+msg+'</small> \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
      }
    });
  });

  $('#logForm2').submit(function( event ) {
    event.preventDefault();
    var url = $(this).attr( "action" );
    var email = $('#inputEmailLog2').val();
    var password = $('#inputPassLog2').val();
    var remember = document.getElementById('inputRemLog2').checked;

    var login = $.post(url, {email: email, pass:password, remember:remember});
    login.done(function( data ) {
      var msg = data['msg'];
      if(data['ok']) {
        $('#alertLogInfo2').html(
          '<div class="alert alert-success alert-dismissible fade show" role="alert"> \
            <small>'+msg+'</small> \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
        window.setTimeout(function(){
          window.location.pathname = "/explora";
        }, 1500);
      }
      else {
        $('#alertLogInfo2').html(
          '<div class="alert alert-danger alert-dismissible fade show" role="alert"> \
            <small>'+msg+'</small> \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
      }
    });
  });

  $('#logForm_3').submit(function( event ) {
    event.preventDefault();
    var url = $(this).attr( "action" );
    var email = $('#inputEmailLog_3').val();
    var password = $('#inputPassLog_3').val();
    var remember = document.getElementById('inputRemLog_3').checked;

    var login = $.post(url, {email: email, pass:password, remember:remember});
    login.done(function( data ) {
      console.log(data);
      var msg = data['msg'];
      if(data['ok']) {
        $('#alertLogInfo_3').html(
          '<div class="alert alert-success alert-dismissible fade show" role="alert"> \
            <small>'+msg+'</small> \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
        window.setTimeout(function(){
          location.reload(); 
        }, 1500);
      }
      else {
        $('#alertLogInfo_3').html(
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
