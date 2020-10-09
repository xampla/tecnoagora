$( document ).ready(function() {
  //Return all projects
  $.ajax({
    type : "GET",
    url : "/projects",
    success: function(res){
      $('#list-projectes ul').empty();
      console.log("Success: ", res);
      $.each(res, function(i, proj){
        $('#list-projectes').append(
          '<a href="#!" class="list-group-item list-group-item-action flex-column align-items-start"> \
            <div class="row row-lg-10"> \
              <div class="col"> \
                <div class="d-flex"> \
                  <h5 class="mb-1">' + proj.title + '<small class="text-muted"> 12/09/2020 </small></h5> \
                </div> \
                <p class="mb-1">' + proj.descSmall + '</p> \
                <small>' + proj.link + '</small> \
              </div> \
              <div class="col-lg-1"> \
                  <small>1.450 vots</small> \
              </div> \
            </div> \
          </a>')
      });
    },
    error : function(e) {
      $("#list-projectes").html("<strong>Error</strong>");
      console.log("ERROR: ", e);
    }
  });

  //Return last 5 added projects
  $.ajax({
    type : "GET",
    url : "/projects",
    success: function(res){
      $('#list-lastProjects ul').empty();
      console.log("Success: ", res);
      $.each(res, function(i, proj){
        if(i>=5) return false;
        $('#list-lastProjects').append(
          '<a href="#!" class="list-group-item list-group-item-action flex-column align-items-start"> \
            <div class="row row-sm-9"> \
              <div class="col"> \
                <div class="d-flex"> \
                  <h5 class="mb-1">' + proj.title + '<small class="text-muted"> 12/09/2020 </small></h5> \
                </div> \
                <p class="mb-1">' + proj.descSmall + '</p> \
              </div> \
              <div class="col-sm-3"> \
                  <small>1.450 vots</small> \
              </div> \
            </div> \
          </a>')
      });
    },
    error : function(e) {
      $("#list-lastProjects").html("<strong>Error</strong>");
      console.log("ERROR: ", e);
    }
  });
})
