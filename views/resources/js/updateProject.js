$( document ).ready(function() {
  $('#exampleModal').on('shown.bs.modal', function (e) {
    var content = $('#inputDescBig').val();
    var prev = $.post("/preview", {content: content});

    prev.done(function( data ) {
      $('#preBody').html(data['preview']);
      $('#preTitle').html($('#inputTittle').val());
      var date = new Date();
      var username = data['user'];
      var str = data['str'];
      $('#preFooter').html(
        '<div class="row"> \
          <div class="col text-left"> \
            '+str+': '+username+' </div> \
          <div class="col text-right">' + date.getDate()+'/' +date.getMonth()+'/'+date.getFullYear()+ '</div> \
        </div>');
    });
  });

  $(".myPop").on("click", function (e) {
    e.preventDefault();
    return true;
  });
  $('.myPop').popover();
})
