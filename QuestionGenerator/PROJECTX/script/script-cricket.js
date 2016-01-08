(function($) {

// Code to get the search item from text box
var itemToBeSearched;

  $("#categorySearch").on('click', function() {
         itemToBeSearched=$('#category').val().trim();
         searchForItem(itemToBeSearched);

  });

  $("#category").on( "keydown", function(event) {
        if(event.which == 13){
          itemToBeSearched=$('#category').val().trim();
          searchForItem(itemToBeSearched);
      }
    });

})(jQuery);


function searchForItem(itemToBeSearched)
{
  $("#containerForSearch").empty();
  $("#containerForNumberOfSearchResult").empty();
  $("#guidingTextForSearchResult").empty();
  $("#forSubCategories").empty();
  $("#forFetchingSelectedData").empty();
  $("#displayFinalData").empty();


  var displayData;
  var itemSearchUrl="https://www.wikidata.org/w/api.php?action=wbsearchentities&search="+itemToBeSearched+"&language=en&format=json";
  $.getJSON(itemSearchUrl + "&callback=?", function(data) {

    if (data.search.length == 1) {
      $('<div class="panel panel-default text-center"><div class="panel-body">'
        + data.search.length+'    result'
        +'</div></div>'
    ).appendTo('#containerForNumberOfSearchResult');
  }
  else if (data.search.length >1) {
    $('<div class="panel panel-default text-center"><div class="panel-body">'
      +  data.search.length + '    results'
      +'</div></div>'
  ).appendTo('#containerForNumberOfSearchResult');

    $('<div class="panel panel-default text-center"><div class="panel-body">'
      + 'The Search Has Resulted In Following Result(s)... Select One To Continue'
      +'</div></div>'
  ).appendTo('#guidingTextForSearchResult');
  }
  else {
    $('<div class="panel panel-default text-center"><div class="panel-body">'
      + 'NO RESULTS FOUND... KINDLY CHECK FOR TYPO... :-) '
      +'</div></div>'
  ).appendTo('#containerForNumberOfSearchResult');
  }
    for (var i = 0; i < data.search.length; i++) {
      if (data.search[i].description!==undefined) {
        displayData="description";
      }
      else {
        displayData="label"
      }
      $('<button class="btn btn-success btn-block responsive-width" type="button" data-number='+i+' id=searchResult'+i+'>'
        +data.search[i][displayData]+
        '</button>'
    ).appendTo('#containerForSearch');
    $("#searchResult"+i).on('click',function(){
      var selectedResult=$(this).data('number');
      var selectedResultUrl=data.search[selectedResult].concepturi;
      processSelectedUrl(selectedResultUrl,$(this).text());
    });
    }
  });
}

function processSelectedUrl(selectedResultUrl,descOrLabel){
  $("#containerForSearch").empty();
  $("#containerForNumberOfSearchResult").empty();
  $("#guidingTextForSearchResult").empty();
  $("#displayFinalData").empty();


  $('<div class="panel panel-success text-center"><div class="panel-heading">'
    + descOrLabel
    +'</div></div>'
  ).appendTo('#containerForNumberOfSearchResult');
if(selectedResultUrl=="http://www.wikidata.org/entity/Q12299841")
{
  processListOfCricketers(selectedResultUrl);
}
}

function processListOfCricketers(selectedResultUrl){

  appendGenderHandednessCountryDiv();

  }

function appendGenderHandednessCountryDiv(){

  var objectForSelection={};
  $("#forSubCategories").empty();
  $("#forFetchingSelectedData").empty();
  forFetchingSelectedData


  $('<div class="col-sm-4 text-justify pull-left "> '
    +'<div class="panel panel-warning text-center"><div class="panel-heading">'
    +'Gender'
    +'</div> <div class="panel-body">'
    +'<div class="radio"> <label><input type="radio" name="optradio" value="Male">Male</label> </div> <div class="radio"> <label><input type="radio" name="optradio" value="Female">Female</label> </div> <div class="radio "> <label><input type="radio" name="optradio" checked="checked" value="Either">Either</label></div>'
    +'</div></div>'
    +'</div>'
    +'<div class="col-sm-4 text-justify pull-left "> '
    +'<div class="panel panel-default text-center"><div class="panel-heading">'
    +'Handedness'
    +'</div> <div class="panel-body">'
    +'<div class="radio"> <label><input type="radio" name="optradio1" value="Left">Left</label> </div> <div class="radio"> <label><input type="radio" name="optradio1"  value="Right">Right</label> </div> <div class="radio "> <label><input type="radio" name="optradio1" checked="checked" value="Either">Either</label></div>'
    +'</div></div>'
    +'</div>'
    +'<div class="col-sm-4 text-justify pull-left "> '
    +'<div class="panel panel-info text-center"><div class="panel-heading">'
    +'Country'
    +'</div> <div class="panel-body">'
    +'<div class="radio"> <label><input type="radio" name="optradio2" value="India">India</label> </div> <div class="radio"> <label><input type="radio" name="optradio2" value="Pakistan">Pakistan</label> </div> <div class="radio "> <label><input type="radio" name="optradio2" checked="checked" value="Either">Either</label></div>'
    +'</div></div>'
    +'</div>'
  ).appendTo('#forSubCategories');


$('<button class="btn btn-info btn-block responsive-width" type="button" id="fetchSelectedData">'
  +'Get The Selected Data'
  +'</button>').appendTo('#forFetchingSelectedData');

  $("#forFetchingSelectedData").on('click',function(){
    objectForSelection.gender=$("input[name=optradio]:checked").attr('value');
    objectForSelection.handedness=$("input[name=optradio1]:checked").attr('value');
    objectForSelection.country=$("input[name=optradio2]:checked").attr('value');
    generateCannedQueries(objectForSelection)
  });
}


function generateCannedQueries(objectForSelection)
{
  $("#displayFinalData").empty();
  var CricketerList = 'http://wdq.wmflabs.org/api?q=claim[106:12299841]';
  var tempURL = "https://www.wikidata.org/wiki/Special:EntityData/Q";

  $.getJSON(CricketerList + "&callback=?", function(data) {
    console.log("hello");
    // console.log(data);
    $.each(data["items"], function(k, v) {
          var link = tempURL + v + ".json";
          $.getJSON(link, function(data) {
    //           var country = data["entities"]["Q" + v]["labels"]["en"]["value"];
              console.log(data);
    // //           $('<div class="panel panel-default text-center"><div class="panel-heading">'
    // //             +name
    // //             +'</div></div>'
    // //         ).appendTo('#displayFinalData');
          });
      });
  });

  var tempClaims;

  if(objectForSelection.gender=="Either")
  {}
  else if (objectForSelection.gender=="Male") {
    tempClaims=" AND claim[21:6581097]";
  }
  else {
    tempClaims=" AND claim[21:6581072]";
  }
  if (tempClaims) {
    CricketerList+=tempClaims;
  }
  if(objectForSelection.handedness=="Either")
  {}
  else if (objectForSelection.handedness=="Right") {
    tempClaims=" AND claim[552:3039938]";
  }
  else {
    tempClaims=" AND claim[552:789447]";
  }
  if (tempClaims) {
    CricketerList+=tempClaims;
  }

  if(objectForSelection.country=="Either")
  {tempClaims=" AND claim[27:668,27:843]";}
  else if (objectForSelection.country=="India") {
    tempClaims=" AND claim[27:668]";
  }
  else {
tempClaims=" AND claim[27:843]"
  }

  if (tempClaims) {
    CricketerList+=tempClaims;
  }
// console.log(CricketerList);
    $.getJSON(CricketerList + "&callback=?", function(data) {
      // console.log(data);
      $.each(data["items"], function(k, v) {
            var link = tempURL + v + ".json";
            $.getJSON(link, function(data) {
                var name = data["entities"]["Q" + v]["labels"]["en"]["value"];
                // console.log(name);
                $('<div class="panel panel-default text-center"><div class="panel-heading">'
                  +name
                  +'</div></div>'
              ).appendTo('#displayFinalData');
            });
        });
    });
}
