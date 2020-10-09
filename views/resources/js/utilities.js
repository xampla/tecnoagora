$(document).ready(function() {

  $('#addComment').submit(function( event ) {
    event.preventDefault();
    var url = $(this).attr( "action" );
    var com = $('#inputDesc').val();
    var posting = $.post(url, {desc: com});

    posting.done(function( data ) {
      if(data['ok']) {
        var d = new Date(data['date']);
        var day = d.getDate();
        var month = d.getMonth()+1;
        var year = d.getFullYear();
        $('#empty-comments').remove();
        $('#list-comments').append(
          '<li class="list-group-item my-1"> \
          <div class="row"> \
            <div class="col-auto mr-auto"> \
              <strong>' + data['creator'] + ':</strong> \
            </div> \
            <div class="col-auto text-muted"> \
              ' + day+'/'+month+'/'+year + ' \
            </div> \
          </div> \
          <div class="row"> \
            <div class="col"> \
              ' + data['comment'] + ' \
            </div> \
          </div> \
        </li>');
      }
    });
  });

  $('#saveForm').submit(function( event ) {
    event.preventDefault();
    var url = $( this ).attr( "action" );
    var posting = $.post(url);
    var $saveSVG = $('#saveSVG');
    $('#rateButton').removeClass("pulse");

    posting.done(function( data ) {
      if(data['ok']) {
        var idProj = url.split("/")[2];
        var action = url.split("/")[1];
        if(action=="saveProject") {
          $('#saveForm').attr("action", "/unsaveProject/"+idProj);
          $('#saveField').attr("value", data['numSaves']);
          $saveSVG.html(
          '<button class="btn btn-outline-secondary greybutton pulse" type="submit"> \
            <svg class="bi bi-bookmark-dash" width="1.2em" height="1.2em" viewBox="0 0 16 16" fill="black" xmlns="http://www.w3.org/2000/svg"> \
              <path fill-rule="evenodd" d="M11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5zM4.5 2a.5.5 0 0 0-.5.5v11.066l4-2.667 4 2.667V8.5a.5.5 0 0 1 1 0v6.934l-5-3.333-5 3.333V2.5A1.5 1.5 0 0 1 4.5 1h4a.5.5 0 0 1 0 1h-4z"/> \
            </svg>\
          </button>');
        }
        else {
          $('#saveForm').attr("action", "/saveProject/"+idProj);
          $('#saveField').attr("value", data['numSaves']);
          $saveSVG.html(
          '<button class="btn btn-outline-secondary greybutton pulse" type="submit"> \
            <svg class="bi bi-bookmark-plus" width="1.2em" height="1.2em" viewBox="0 0 16 16" fill="black" xmlns="http://www.w3.org/2000/svg"> \
              <path fill-rule="evenodd" d="M4.5 2a.5.5 0 0 0-.5.5v11.066l4-2.667 4 2.667V8.5a.5.5 0 0 1 1 0v6.934l-5-3.333-5 3.333V2.5A1.5 1.5 0 0 1 4.5 1h4a.5.5 0 0 1 0 1h-4zm9-1a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1H13V1.5a.5.5 0 0 1 .5-.5z"/> \
              <path fill-rule="evenodd" d="M13 3.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0v-2z"/> \
            </svg>\
          </button>');
        }
      }
    });
  });

  $('#rateForm').submit(function( event ) {
    event.preventDefault();
    var url = $( this ).attr( "action" );
    var posting = $.post(url);
    var $rateSVG = $('#rateSVG');
    $('#rateButton').removeClass("pulse");

    posting.done(function( data ) {
      if(data['ok']) {
        var idProj = url.split("/")[2];
        var action = url.split("/")[1];
        if(action=="rateProj") {
          $('#rateForm').attr("action", "/unrateProj/"+idProj);
          $('#pointField').attr("value", data['points']);
          $rateSVG.html(
          '<button class="btn btn-outline-secondary greybutton pulse" type="submit"> \
          <svg class="bi bi-star-fill" width="1.2em" height="1.2em" viewBox="0 0 16 16" fill="#ffe44d" xmlns="http://www.w3.org/2000/svg"> \
            <path stroke="black" d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/> \
          </svg>\
          </button>');
        }
        else {
          $('#rateForm').attr("action", "/rateProj/"+idProj);
          $('#pointField').attr("value", data['points']);
          $rateSVG.html(
          '<button class="btn btn-outline-secondary greybutton pulse" type="submit"> \
          <svg class="bi bi-star-fill" width="1.2em" height="1.2em" viewBox="0 0 16 16" fill="#000000" xmlns="http://www.w3.org/2000/svg"> \
            <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/> \
          </svg> \
          </button>');
        }
      }
    });
  });

  $('#gitButton').on('click', function(event) {
    var value = $( this ).attr( "value" );
    window.open(value);
  });

  $('#webButton').on('click', function(event) {
    var value = $( this ).attr( "value" );
    window.open(value);
  });

  /*$( "#editButton" ).click(function() {
    var url = $( this ).attr( "action" );
    var edit = $.get(url);
    edit.done(function( data ) {
      $('#container').empty();
      $('#container').html(data);
    });
  });*/
});
