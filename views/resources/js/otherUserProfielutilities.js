$(document).ready(function() {

  var username = $('#usernameInfo').text();

  var points = $.get("/getOtherUserPoints/"+username);
  points.done(function( data ) {
    if(data['points'] == -1) $('#points').text("Error");
    else $('#points').text(data['points']);
  });

  var svgPic = $.get('/getProfilePicFromUser/'+username);
  svgPic.done(function( data ) {
    $('#profilePicSVGCard').html($("rect", atob(data['svg'])));
    $('#profilePicSVGCard').attr('viewBox','0 0 4750 1750')
  });
});
