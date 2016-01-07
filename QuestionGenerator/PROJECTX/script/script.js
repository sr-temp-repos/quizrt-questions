(function($) {
  var tempURL = "https://www.wikidata.org/wiki/Special:EntityData/Q";

    // var maleCricketerList = 'http://wdq.wmflabs.org/api?q=claim[106:12299841]%20AND%20claim[27:668]%20AND%20claim[21:6581097]';
    // var typeID="#cricketers";
    // getList(tempURL, maleCricketerList, typeID);

  var typeID="#actors";
  var maleActorList = 'http://wdq.wmflabs.org/api?q=claim[106:33999]%20AND%20claim[27:668]%20AND%20claim[21:6581097]';
  getList(tempURL, maleActorList, typeID);

  function getList(tempURL, playListURL, typeID) {
      $.getJSON(playListURL + "&callback=?", function(data) {
          $.each(data["items"], function(k, v) {
              var link = tempURL + v + ".json";
              $.getJSON(link, function(data) {
                  var name = data["entities"]["Q" + v]["labels"]["en"]["value"];
                  $(typeID).append($('<option>', {
                      value: k,
                      text: name
                  }));
                  //$("#cricketers").append($("<p></p>").text(name));
              });
          });
      });
  }
})(jQuery);
