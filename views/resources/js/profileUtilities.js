$(document).ready(function() {

  var discover = $.get("/discoverProjects");
  discover.done(function( data ) {
    var msg = data['msg'];
    if(data['ok']) {
      $.each(data['discover'], function(i, proj){
        $('#list-discover').append(
          '<li class="list-group-item"> \
            <div class="d-flex"> \
              <a href="/projects/'+proj._id+'"><h6 class="mb-1">' + proj.title + '</h6></a> \
            </div> \
            <p class="mb-1"><small>' + proj.descSmall + '</small></p> \
            <div class="text-right"><small class="text-muted" id="date'+i+'"></small></div> \
          </li>');
        var d = new Date(proj.date);
        var day = d.getDate();
        var month = d.getMonth()+1;
        var year = d.getFullYear()
        $('#date'+i).text(day +'/'+ month +'/'+ year);
      });
      $('#list-discover').append('<li class="list-group-item"><a href="/explora">'+msg+' &rarr;</a></li>');
    }
    else {
      $('#list-discover').append(
        '<li class="list-group-item"> \
          <div class="d-flex"> \
            '+msg+'> \
          </div> \
          <div class="text-right"><small class="text-muted" id="date'+i+'"></small></div> \
        </li>');
    }
  });

  var points = $.get("/getUserPoints");
  points.done(function( data ) {
    console.log(data);
    $('#points').text(data['points']);
  });

  var memberDate = $.get("/getUserMemberDate");
  memberDate.done(function( data ) {
    $('#memberDate').text(data['date']);
  });

  var activity = $.get("/activity");
  activity.done(function( data ) {
    if(data['ok'] && data['activity'].length != 0) {
      var lang = data['lang'];
      $.each(data['activity'], function(i, act){
        var date = new Date(act.date);
        var formated_date = date.getDate() + '/' + date.getMonth() + '/' + date.getYear();
        var msg = "";
        if(act.actType == "projectAdded") {
          msg = data['msg']['proj_afegit'][lang];
        } else if(act.actType == "projectRated") {
          msg = data['msg']['proj_valorat'][lang];
        }
        else if(act.actType == "projectSaved") {
          msg = data['msg']['proj_guardat'][lang];
        } else if(act.actType == "projectDeleted") {
          msg = data['msg']['proj_eliminat'][lang];
        } else {
          msg = data['msg']['proj_comentat'][lang];
        }
        $('#list-activity').append(
        '<a class="list-group-item list-group-item-action"> \
          <div class="row"> \
            <div class="col-sm-10"> \
              <div class="d-flex"> \
                <h6 class="mb-1">' + msg + '</h6> \
              </div> \
            </div> \
            <div class="col-sm-2"> \
              <small class="text-muted"> ' + formated_date + ' </small> \
            </div> \
          </div> \
          <div class="row"> \
            <div class="col"> \
              <p class="mb-1"><small>' + act.body + '</small></p> \
            </div> \
          </div> \
        </a>');
      });
    }
    else {
      $('#list-activity').append(
      '<a class="list-group-item list-group-item-action"> \
        <div class="row"> \
          <div class="col"> \
            <p class="mb-1"><small>' + data['msg']['no_disponible'][lang] + '</small></p> \
          </div> \
        </div> \
      </a>');
    }
  });

  $('#updateProfile').submit(function( event ) {
    event.preventDefault();
    var url = $(this).attr( "action" );
    var name = $('#inputName').val();
    var surname = $('#inputSurname').val();
    var desc = $('#inputDesc').val();
    var posting = $.post(url, {name: name, surname:surname, desc:desc});

    posting.done(function( data ) {
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

  $('#updatePassword').submit(function( event ) {
    event.preventDefault();
    var url = $(this).attr( "action" );
    var actualPass = $('#actualPass').val();
    var newPass = $('#newPass').val();
    var newPassCheck = $('#newPassCheck').val();
    var posting = $.post(url, {actualPass: actualPass, newPass: newPass, newPassCheck: newPassCheck});

    posting.done(function( data ) {
      var msg = data["str"];
      if(data['ok']) {
        $('#alertPassInfo').html(
          '<div class="alert alert-success alert-dismissible fade show" role="alert"> \
            '+msg+' \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
      }
      else {
        $('#alertPassInfo').html(
          '<div class="alert alert-danger alert-dismissible fade show" role="alert"> \
            '+msg+' \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
      }
      actualPass = $('#actualPass').val("");
      newPass = $('#newPass').val("");
      newPassCheck = $('#newPassCheck').val("");
    });
  });

  $('#updateEmail').submit(function( event ) {
    event.preventDefault();
    var url = $(this).attr( "action" );
    var password = $('#passwordEmail').val();
    var email = $('#currentEmail')[0].getAttribute("value");
    var newEmail = $('#newEmail').val();

    var posting = $.post(url, {email:email, newEmail: newEmail, password: password});

    posting.done(function( data ) {
      var msg = data["msg"];
      if(data['ok']) {
        $('#alertEmailInfo').html(
          '<div class="alert alert-success alert-dismissible fade show" role="alert"> \
            '+msg+' \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
      }
      else {
        $('#alertEmailInfo').html(
          '<div class="alert alert-danger alert-dismissible fade show" role="alert"> \
            '+msg+' \
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
              <span aria-hidden="true">&times;</span> \
            </button> \
          </div>');
      }
      newEmail = $('#newEmail').val("");
      password = $('#passwordEmail').val("");
    });
  });


  var svgPic = $.get('/getProfilePic');
  svgPic.done(function( data ) {
    $('#profilePicSVG').html($("rect", atob(data['svg'])));
    $('#profilePicSVG').attr('viewBox','0 0 4750 1750');

    $('#profilePicSVGCard').html($("rect", atob(data['svg'])));
    $('#profilePicSVGCard').attr('viewBox','0 0 4750 1750')
  });

});
