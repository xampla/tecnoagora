$(document).ready(function() {

  $('#buttonChangeProfilePic').click(function(event) {
    event.preventDefault();
    var chgProfilePic = $.get("/changeProfilePic");
    chgProfilePic.done(function( data ) {
      if(data["ok"]) {
        $('#modalBotiga').modal('show');
        $('#modalBotigaBody').text(data["msg"]+data["points"]);
      }
    });
  });

  $('#acceptModalButton').click(function(event) {
    event.preventDefault();
    var chgProfilePicAccept = $.post("/changeProfilePic");
    chgProfilePicAccept.done(function( data ) {
      if(data['ok']) {
        $('#alertModalBotiga').html(
          '<div class="alert alert-success alert-dismissible fade show" role="alert"> \
            <small>'+data['msg']+'</small> \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
      }
      else {
        $('#alertModalBotiga').html(
          '<div class="alert alert-danger alert-dismissible fade show" role="alert"> \
            <small>'+data['msg']+'</small> \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
      }
    });
  });

});
