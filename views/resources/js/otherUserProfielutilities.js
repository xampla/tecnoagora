$(document).ready(function() {

  var points = $.get("/getUserPoints");
  points.done(function( data ) {
    $('#points').text(data['points']);
  });

  var memberDate = $.get("/getUserMemberDate");
  memberDate.done(function( data ) {
    $('#memberDate').text(data['date']);
  });

  var username = $('#usernameInfo').text();
  console.log(username);
  var svgPic = $.get('/getProfilePicFromUser/'+username);
  svgPic.done(function( data ) {
    $('#profilePicSVGCard').html($("rect", atob(data['svg'])));
    $('#profilePicSVGCard').attr('viewBox','0 0 4750 1750')
  });
});
