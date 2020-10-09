$(document).ready(function() {

  var points = $.get("/getUserPoints");
  points.done(function( data ) {
    console.log(data);
    $('#points').text(data['points']);
  });

  var svgPic = $.get('/getProfilePic');
  svgPic.done(function( data ) {
    $('#profilePicSVGCard').html($("rect", atob(data['svg'])));
    $('#profilePicSVGCard').attr('viewBox','0 0 4750 1750')
  });

  var memberDate = $.get("/getUserMemberDate");
  memberDate.done(function( data ) {
    $('#memberDate').text(data['date']);
  });

  var url = "/projectesTendencia";
  var trending = $.get(url);
  trending.done(function( data ) {
    console.log(data);
    if(data['ok']) {
      $.each(data['trending'], function(i, proj){
        $('#list-projectes').append(
        '<li class="list-group-item"> \
          <div class="d-flex"> \
            <h6 class="mb-1"><a href="/projects/'+proj._id+'">' + proj.title + '</a></h6> \
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
    }
  });

  $('#results').on('click','#bestResult',function(){
    var term = $('#term')[0].innerText;
    $.get( "/sortSearch", {searchType: "bestResult", searchedTerm: term}, function(data) {printProjects(data)});
  });
  $('#results').on('click','#mostRated',function(){
    var term = $('#term')[0].innerText;
    $.get( "/sortSearch", {searchType: "mostRated", searchedTerm: term}, function(data){printProjects(data)});
  });
  $('#results').on('click','#leastRated',function(){
    var term = $('#term')[0].innerText;
    $.get( "/sortSearch", {searchType: "leastRated", searchedTerm: term}, function(data){printProjects(data)});
  });
  $('#results').on('click','#recentlyUpdated',function(){
    var term = $('#term')[0].innerText;
    $.get( "/sortSearch", {searchType: "recentlyUpdated", searchedTerm: term}, function(data){printProjects(data);});
  });
  $('#results').on('click','#leastRecentlyUpdated',function(){
    var term = $('#term')[0].innerText;
    $.get( "/sortSearch", {searchType: "leastRecentlyUpdated", searchedTerm: term}, function(data){printProjects(data)});
  });

  $('.rateForm').submit(function( event ) {
    event.preventDefault();
    var url = $( this ).attr( "action" );
    var posting = $.post(url);
    var idProj = url.split("/")[2];
    var action = url.split("/")[1];

    posting.done(function( data ) {
      if(data['ok']) {
        var $rateSVG = $('#rateSVG_'+idProj);
        console.log($rateSVG);
        if(action=="rateProj") {
          $('#rateForm_'+idProj).attr("action", "/unrateProj/"+idProj);
          $('#pointField_'+idProj).attr("value", data['points']);
          $rateSVG.html(
          '<button class="btn btn-outline-secondary greybutton" type="submit"> \
          <svg class="bi bi-star-fill" width="1.2em" height="1.2em" viewBox="0 0 16 16" fill="#ffe44d" xmlns="http://www.w3.org/2000/svg"> \
            <path stroke="black" d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/> \
          </svg>\
          </button>');
        }
        else {
          $('#rateForm_'+idProj).attr("action", "/rateProj/"+idProj);
          $('#pointField_'+idProj).attr("value", data['points']);
          $rateSVG.html(
          '<button class="btn btn-outline-secondary greybutton" type="submit"> \
          <svg class="bi bi-star-fill" width="1.2em" height="1.2em" viewBox="0 0 16 16" fill="#000000" xmlns="http://www.w3.org/2000/svg"> \
            <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/> \
          </svg> \
          </button>');
        }
      }
    });
  });

  function printProjects(projects) {
    $('#results').empty();
    $('#results').append(projects);
  }

  function updatePagination(data) {
    var page = JSON.parse($(data).filter('#pageInfo')[0].innerText);
    console.log(page);
    var term = $('#term')[0].innerText;

    var $pageUl = $('#pageUl');
    $pageUl.empty();
    $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p='+page.prev+'">Previous</a></li>');
    if(page.total<=10){
       for(var j=1; j<=page.total; j++) {
        if(j == page.actual){
          $pageUl.append('<li class="page-item active" aria-current="page"><a class="page-link" href="/search?search='+term+'&p='+j+'">'+j+'</a></li>');
         } else {
          $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p='+j+'">'+j+'</a></li');
         }
       }
     } else {
       if(page.actual<=5){
         for(var j=1; j<=5; j++) {
           if(j == page.actual) {
             $pageUl.append('<li class="page-item active" aria-current="page"><a class="page-link" href="/search?search='+term+'&p='+j+'">'+j+'</a></li>');
           } else {
             $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p='+j+'">'+j+'</a></li');
           }
         }
         if(page.actual==5) {
           $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p=6">6</a></li');
           $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p=7">7</a></li');
         }
       } else if(page.actual>=7 && (page.total-page.actual)>5){
         $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p=1">1</a></li');
         $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p=2">2</a></li');
         $pageUl.append('<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1" aria-disabled="true">...</a></li>');

         for(var j=page.actual-2; j<=page.actual+2; j++) {
           if(j == page.actual){
             $pageUl.append('<li class="page-item active" aria-current="page"><a class="page-link" href="/search?search='+term+'&p='+j+'">'+j+'</a></li>');
           } else {
             $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p='+j+'">'+j+'</a></li');
           }
         }
         $pageUl.append('<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1" aria-disabled="true">...</a></li>');
         $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p='+page.total-1+'">'+page.total-1+'</a></li');
         $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p='+page.total+'">'+page.total+'</a></li');
       } else if((page.total-page.actual)<=5){
         $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p=1">1</a></li');
         $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p=2">2</a></li');
         $pageUl.append('<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1" aria-disabled="true">...</a></li>');
         if(page.total-(page.actual-1)==6){
           $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p='+page.actual-1+'">'+page.actual-1+'</a></li');
         }
         for(var j=page.total-5; j<=page.total; j++) {
          if(j == page.actual){
            $pageUl.append('<li class="page-item active" aria-current="page"><a class="page-link" href="/search?search='+term+'&p='+j+'">'+j+'</a></li>');
           } else {
            $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p='+j+'">'+j+'</a></li');
           }
         }
       }
     }
   $pageUl.append('<li class="page-item"><a class="page-link" href="/search?search='+term+'&p='+page.next+'">Previous</a></li>');
  }
});
