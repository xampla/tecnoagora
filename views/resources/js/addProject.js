$( document ).ready(function() {
  $('#previModal').on('shown.bs.modal', function (e) {
    var content = $('#inputDescBig').val();
    var prev = $.post("/preview", {content: content});

    prev.done(function( data ) {
      $('#preBody').html(data['preview']);
      $('#preTitle').html($('#inputTittle').val());
      var date = new Date();
      var username = data['user'];
      var msg = data['msg'];
      $('#preFooter').html(
        '<div class="row"> \
          <div class="col text-left"> \
            '+msg+': '+username+' </div> \
          <div class="col text-right">' + date.getDate()+'/' +date.getMonth()+'/'+date.getFullYear()+ '</div> \
        </div>');
    });
  });

  $(".myPop").on("click", function (e) {
    e.preventDefault();
    return true;
  });
  $('.myPop').popover();

  $('#addProjectForm').submit(function(event){
    event.preventDefault();
    var url = $(this).attr( "action" );
    var title = $('#inputTittle').val();
    var git = $('#inputLinkGit').val();
    var descSmall = $('#inputDescSmall').val();
    var descBig = $('#inputDescBig').val();
    var web = $('#inputLinkWeb').val();
    var tags = $('#tags').val();

    var addProj = $.post(url, {title:title,link:git,linkWeb:web,descBig:descBig,descSmall:descSmall,tags:tags});
    addProj.done(function( data ) {
      var msg = data['msg'];
      if(data['ok']) {
        var id = data['id'];
        $('#alertAddProj').html(
          '<div class="alert alert-success alert-dismissible fade show" role="alert"> \
            <small>'+msg+'</small> \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
        window.setTimeout(function(){
          window.location.pathname = "/projects/"+id;
        }, 1500);
      }
      else {
        $('#alertAddProj').html(
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
