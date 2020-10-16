$( document ).ready(function() {
  $('#cat').click(function(event) {
    event.preventDefault();
    var url = "/changeLang";
    var changeLang = $.get(url, {lang: "cat"});
    changeLang.done(function( data ) {
      location.reload();
    });
  });

  $('#en').click(function(event) {
    event.preventDefault();
    var url = "/changeLang";
    var changeLang = $.get(url, {lang: "en"});
    changeLang.done(function( data ) {
      location.reload();
    });
  });

  $('#es').click(function(event) {
    event.preventDefault();
    var url = "/changeLang";
    var changeLang = $.get(url, {lang: "es"});
    changeLang.done(function( data ) {
      location.reload();
    });
  });
});
