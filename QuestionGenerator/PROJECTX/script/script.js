(function($) {
    var tempURL = "https://www.wikidata.org/wiki/Special:EntityData/Q";
    var qIdList = [];
    var qId = null;
    var pIdList = [];
    var pId = null;


    function getHints(item) {
        var link = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" + item + "&language=en&format=json";
        $.getJSON(link + "&callback=?", function(data) {
            $.each(data["search"], function(k, v) {
                if (k == 0) {
                    qId = v["title"].substr(1);
                }
                $("#properties").append($('<option>', {
                    value: k,
                    text: v["label"] + ":" + v["description"]
                }));
                qIdList.push(v["title"].substr(1));
            });
        });
    }

    function getProperties(propertyNames) {
        var link = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" + propertyNames + "&language=en&type=property&format=json";
        $.getJSON(link + "&callback=?", function(data) {
            $.each(data["search"], function(k, v) {
                if (k == 0) {
                    pId = v["title"].substr(10);
                }
                $("#propertyNames").append($('<option>', {
                    value: k,
                    text: v["label"] + ":" + v["description"]
                }));
                pIdList.push(v["title"].substr(10));
            });
        });

    }

    function searchText() {
        $("#searchButton").on("click", function() {
            var searchText = $("#searchText").val();
            $("#properties").find('option').remove();
            getHints(searchText);
        });

        $("#searchProperty").on("click", function() {
            var searchText = $("#searchPropertyText").val();
            $("#propertyNames").find('option').remove();
            getProperties(searchText);
        });
    }
    searchText();

    function getSelectedItem() {
        var str = "";
        $("#properties").change(function() {
            $("#properties option:selected").each(function(k, v) {
                str += $(this).text() + " ";
                qId = qIdList[$("#properties").val()];
            });
        });

        $("#propertyNames").change(function() {
            $("#propertyNames option:selected").each(function(k, v) {
                str += $(this).text() + " ";
                pId = pIdList[$("#propertyNames").val()];
            });
        });
    }
    getSelectedItem();

    function populateProperties(){
      console.log(propertyValueList);
      for (var key in propertyValueList) {
          if (propertyValueList.hasOwnProperty(key)) {
            $("#propertyFilter").append($('<option>', {
                value: key,
                text: key
            }));
          }
      }
      return;
    }


    var resultUrl = 'http://wdq.wmflabs.org/api?q=';
    var propertyValueList={};
    var getPropertyValueList = function(propertyName) {
        return propertyValueList[propertyName];
    };

      function getEntityProperties(qId){
            var entityUrl = "https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&ids=Q" + qId + "&languages=en&format=json";
            $.getJSON(entityUrl + "&callback=?", function(data) {
                $.each(data["entities"]["Q" + qId]["claims"], function(key, val) {
                    var tempLink1 = "https://www.wikidata.org/wiki/Special:EntityData/" + key + ".json"
                    $.getJSON(tempLink1, function(data1) {
                        $.each(val, function(key1, val1) {
                            var numericID = val1["mainsnak"]["datavalue"]["value"]["numeric-id"];
                            var tempLink2 = "https://www.wikidata.org/wiki/Special:EntityData/Q" + numericID + ".json"
                            $.getJSON(tempLink2, function(data2) {

                              if (getPropertyValueList(data1["entities"][key]["labels"]["en"]["value"]) == null) {
                                  propertyValueList[data1["entities"][key]["labels"]["en"]["value"]] = data2["entities"]["Q" + numericID]["labels"]["en"]["value"];
                              } else {
                                if(propertyValueList[data1["entities"][key]["labels"]["en"]["value"]].includes(data2["entities"]["Q" + numericID]["labels"]["en"]["value"])){

                                }
                                else
                                  propertyValueList[data1["entities"][key]["labels"]["en"]["value"]] = propertyValueList[data1["entities"][key]["labels"]["en"]["value"]]+","+data2["entities"]["Q" + numericID]["labels"]["en"]["value"];
                              }
                              $("#result").append($("<p></p>").text(data1["entities"][key]["labels"]["en"]["value"] + ":" + data2["entities"]["Q" + numericID]["labels"]["en"]["value"]));
                            });
                        });
                    });
                });
            });

            return propertyValueList;
      }

      function getPropertyValueResult(){
           var claim = 'claim[' + pId + ':' + qId + "]";
           var resultUrl = 'http://wdq.wmflabs.org/api?q=' + claim;
           var tempURL = 'https://www.wikidata.org/wiki/Special:EntityData/Q';
           $.getJSON(resultUrl + "&callback=?", function(data) {
               $.each(data["items"], function(k, v) {
              
                      var propertyValueList=getEntityProperties(v);
                       var link = tempURL + v + ".json";
                       $.getJSON(link, function(data) {

                           var name = data["entities"]["Q" + v]["labels"]["en"]["value"];
                           $("#result").append($("<p></p>").text(name));
                       });

               });
           });
           return propertyValueList;
      }



    function result() {
        $("#getResult").on("click", function() {
            $("#result").text("");
            var propertyValueList;
            if (pId == undefined || pId == "") {
            propertyValueList=getEntityProperties(qId);
            }
            else{
            propertyValueList=getPropertyValueResult();
            }
        });
    }
    result();


})(jQuery);
