(function() {

    var qIdList = [];
    var qId = null;
    var pIdList = [];
    var pId = null;
    var propertyValueList = {};
    var qIdNameList = {};
    var filterList = {};
    var resultUrl = 'http://wdq.wmflabs.org/api?q=';
    var getFilterList = function(propertyName) {
        return filterList[propertyName];
    };
    var getQIdNameList = function(propertyName) {
        return qIdNameList[propertyName];
    };
    var getPropertyValueList = function(propertyName) {
        return propertyValueList[propertyName];
    };

    function getProperties(propertyNames) {
        pIdList = [];
        var link = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" + propertyNames + "&language=en&type=property&format=json";
        $("#spinner").show();
        $.getJSON(link + "&callback=?", function(data) {
            $('#propertyNames').find("li").remove();
            $.each(data["search"], function(k, v) {
                if (k == 0) {
                    pId = v["title"].substr(10);
                }
                $("#propertyNames").append($('<li>', {
                    value: k,
                    text: v["label"] + ":" + v["description"].split(";")[0]
                }).addClass("list-group-item").attr("id", k));
                pIdList.push(v["title"].substr(10));

            });
            $("#spinner").hide();
        });
    }

    <!-- ----------------------------------------------------- -->
    function getEntityHints(item) {
        qIdList = [];
        var link = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" + item + "&language=en&format=json";
        $("#spinner").show();
        $.getJSON(link + "&callback=?", function(data) {
            $('#entityOptions').find("li").remove();
            $.each(data["search"], function(k, v) {
                if (k == 0) {
                    qId = v["title"].substr(1);
                }
                $("#entityOptions").append($('<li>', {
                    value: k,
                    text: v["label"] + ":" + v["description"]
                }).addClass("list-group-item").attr("id", k));
                qIdList.push(v["title"].substr(1));
            });
            $("#spinner").hide();
        });
    }

    function getEntityProperties(qId) {
        var entityUrl = "https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&ids=Q" + qId + "&languages=en&format=json";
        $("#spinner").show();
        $.getJSON(entityUrl + "&callback=?", function(data) {
            $.each(data["entities"]["Q" + qId]["claims"], function(key, val) {
                var tempLink1 = "https://www.wikidata.org/wiki/Special:EntityData/" + key + ".json"
                $.getJSON(tempLink1, function(data1) {
                    $.each(val, function(key1, val1) {
                        var numericID = val1["mainsnak"]["datavalue"]["value"]["numeric-id"];
                        var tempLink2 = "https://www.wikidata.org/wiki/Special:EntityData/Q" + numericID + ".json";
                        $('#entityPropertyList').find("li").remove();
                        $.getJSON(tempLink2, function(data2) {
                            if (getPropertyValueList(data1["entities"][key]["labels"]["en"]["value"]) == null) {
                                propertyValueList[data1["entities"][key]["labels"]["en"]["value"]] = data2["entities"]["Q" + numericID]["labels"]["en"]["value"];
                            } else {
                                if (propertyValueList[data1["entities"][key]["labels"]["en"]["value"]].includes(data2["entities"]["Q" + numericID]["labels"]["en"]["value"])) {

                                } else
                                    propertyValueList[data1["entities"][key]["labels"]["en"]["value"]] = propertyValueList[data1["entities"][key]["labels"]["en"]["value"]] + "," + data2["entities"]["Q" + numericID]["labels"]["en"]["value"];
                            }
                            $("#entityPropertyList").append($('<li>', {
                                value: numericID,
                                text: data1["entities"][key]["labels"]["en"]["value"] + ":" + data2["entities"]["Q" + numericID]["labels"]["en"]["value"]
                            }).addClass("list-group-item"));

                        });
                    });
                });
            });
            $("#spinner").hide();
        });
    }
    <!-- ----------------------------------------------------- -->
    function searchText() {
        $("#searchProperty").on("click", function() {
            $("#propertySuggestion").slideDown(1000);
            $("#entity").slideUp("fast");
            $("#entityProperties").slideUp("fast");
            $("#propertyValueSuggestion").slideUp("fast");
            var searchText1 = $("#searchPropertyText").val();
            $("#propertyNames").find('li').remove();
            getProperties(searchText1);
        });

        $("#searchEntity").on("click", function() {
            $("#entity").slideDown(1000);
            $("#propertySuggestion").slideUp("fast");
            $("#propertyValueSuggestion").slideUp("fast");
            $("#entityProperties").slideUp("fast");
            var searchText2 = $("#searchEntityText").val();
            $("#entityPropertyList").find('li').remove();
            $("#entityOptions").find('li').remove();
            getEntityHints(searchText2);
        });
    }
    searchText();

    function getPropertyValues() {
        var resultUrl = 'http://wdq.wmflabs.org/api?q=claim[' + pId + ']';
        var tempURL = 'https://www.wikidata.org/wiki/Special:EntityData/Q';
        $('#valueNames').find("li").remove();
        //$("#spinner").show();
        $.getJSON(resultUrl + "&callback=?", function(data) {
            $.each(data["items"], function(k, v) {
                if (k < 20) {
                    var link = tempURL + v + ".json";
                    $.getJSON(link, function(data) {
                        var property = data["entities"]["Q" + v]["claims"]["P" + pId];
                        $.each(property, function(k1, v1) {
                            var numericID = v1["mainsnak"]["datavalue"]["value"]["numeric-id"];
                            var tempLink2 = "https://www.wikidata.org/wiki/Special:EntityData/Q" + numericID + ".json"
                            $.getJSON(tempLink2, function(data2) {
                                if (getQIdNameList(numericID) == null) {
                                    qIdNameList[numericID] = data2["entities"]["Q" + numericID]["labels"]["en"]["value"];
                                    $("#valueNames").append($('<li>', {
                                        value: numericID,
                                        text: numericID + ":" + data2["entities"]["Q" + numericID]["labels"]["en"]["value"]
                                    }).addClass("list-group-item"));
                                }
                            });
                        });
                    })
                }
            });
            $("#spinner").hide();
        });
    }

    <!----------------------------------->
    function getFilterProperties(qId) {
        filterList = {};
        var entityUrl = "https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&ids=Q" + qId + "&languages=en&format=json";
        $("#spinner").show();
        $.getJSON(entityUrl + "&callback=?", function(data) {
            $.each(data["entities"]["Q" + qId]["claims"], function(key, val) {
                var tempLink1 = "https://www.wikidata.org/wiki/Special:EntityData/" + key + ".json"
                $.getJSON(tempLink1, function(data1) {
                    $.each(val, function(key1, val1) {
                        var numericID = val1["mainsnak"]["datavalue"]["value"]["numeric-id"];
                        var tempLink2 = "https://www.wikidata.org/wiki/Special:EntityData/Q" + numericID + ".json";
                        $.getJSON(tempLink2, function(data2) {
                            if (getFilterList(data1["entities"][key]["labels"]["en"]["value"] + ":" + key) == null) {
                                filterList[data1["entities"][key]["labels"]["en"]["value"] + ":" + key] = data2["entities"]["Q" + numericID]["labels"]["en"]["value"] + ":" + numericID;
                            } else {
                                if (filterList[data1["entities"][key]["labels"]["en"]["value"] + ":" + key].includes(data2["entities"]["Q" + numericID]["labels"]["en"]["value"] + ":" + numericID)) {

                                } else
                                    filterList[data1["entities"][key]["labels"]["en"]["value"] + ":" + key] = filterList[data1["entities"][key]["labels"]["en"]["value"] + ":" + key] + "," + data2["entities"]["Q" + numericID]["labels"]["en"]["value"] + ":" + numericID;
                            }
                        });
                    });
                });
            });
            $("#spinner").hide();
        });
    }

    var qidListInResult = [];
    var objectListInResult = [];

    function getPropertyValueResult() {
        qidListInResult = [];
        objectListInResult = [];
        var claim = 'claim[' + pId + ':' + qId + "]";
        $('#resultList').find("li").remove();
        resultUrl = resultUrl + claim + "%20AND%20";
        var tempURL = 'https://www.wikidata.org/wiki/Special:EntityData/Q';
        $("#spinner").show();
        $.getJSON(resultUrl + "&callback=?", function(data) {
            $.each(data["items"], function(k, v) {
                if (k < 10) {
                    var propertyValueList = getFilterProperties(v);
                    var link = tempURL + v + ".json";
                    $.getJSON(link, function(data) {
                        objectListInResult.push(data);
                        var name = data["entities"]["Q" + v]["labels"]["en"]["value"];
                        qidListInResult.push(name + ":" + v);
                        $("#resultList").append($('<li>', {
                            text: name
                        }).addClass("list-group-item"));
                    });
                }
            });
            $("#spinner").hide();
        });
    }
    <!------------------------------------->
    function getSelectedItem() {
        $("#propertyNames").on("click", ".list-group-item", function() {
            $("#propertySuggestion").slideUp(1000);
            $("#propertyValueSuggestion").slideDown(4000);
            pId = pIdList[$(this).val()];
            getPropertyValues();
        });

        $("#entityOptions").on("click", ".list-group-item", function() {
            $("#entity").slideUp(1000);
            $("#entityProperties").slideDown(4000);
            qId = qIdList[$(this).val()];
            getEntityProperties(qId);
        });
    }
    getSelectedItem();
    var k = 0;

    function getResult() {

        $("#valueNames").on("click", ".list-group-item", function() {
            $('#cbList').find("input").remove();
            $('#cbList').find("label").remove();
            resultUrl = 'http://wdq.wmflabs.org/api?q=';
            qId = $(this).val();
            getPropertyValueResult();
        });

        $("#entityOptions").on("click", ".list-group-item", function() {
            $('#cbList').find("input").remove();
            $('#cbList').find("label").remove();
            resultUrl = 'http://wdq.wmflabs.org/api?q=';
            qId = qIdList[$(this).val()];
            getPropertyValueResult();
        });
    }
    getResult();

    var property = {};

    function addCheckbox(name) {
        var container = $('#cbList');
        var inputs = container.find('input');
        var id = inputs.length;
        container.append($("<div class='checkbox'>")).append($('<input />', {
            type: 'checkbox',
            id: 'cb' + id,
            value: name
        }).addClass("col-lg-1")).append($('<label />', {
            'for': 'cb' + id,
            text: name
        }).addClass("col-lg-3 text-left"));
    }

    function addDropDown(name) {
        tempValue = name.split(",");
        $('#filteredValues').append($('<li>', {
            text: tempValue[0]
        }).addClass("text-center lead"));
        for (var i = 1; i < tempValue.length; i++) {
            $('#filteredValues').append($('<li>', {
                text: tempValue[i]
            }).addClass("list-group-item"));
        }
    }
    <!------------------------------------------------------------------------------------------------->
    var selectedProprtyList = [];

    function showSelectProperties(propertyList, entityList) {
        var tempKeyValue = {};
        for (var i = 0; i < objectListInResult.length; i++) {
            tempQid = "Q" + entityList[i].split(":")[1];
            for (var j = 0; j < propertyList.length; j++) {
                tempPid = propertyList[j].split(":")[1];
                console.log(tempPid);
                tempPropertyValues = objectListInResult[i]["entities"][tempQid]["claims"][tempPid];
                if (tempPropertyValues !== undefined) {
                    $.each(tempPropertyValues, function(key1, val1) {
                        var numericID = val1["mainsnak"]["datavalue"]["value"]["numeric-id"];
                        console.log(numericID);
                        var tempLink = "https://www.wikidata.org/wiki/Special:EntityData/Q" + numericID + ".json";
                        $.getJSON(tempLink, function(data) {
                            for (var k = 0; k < objectListInResult.length; k++) {
                                if (JSON.stringify(objectListInResult[k]).includes(":" + numericID + "}")) {
                                    var name = entityList[k] + ":" + data["entities"]["Q" + numericID]["labels"]["en"]["value"];
                                    if (tempKeyValue[name] != 1) {
                                        tempKeyValue[name] = 1;
                                        $("#resultList").append($('<li>', {
                                            text: entityList[k] + ":" + data["entities"]["Q" + numericID]["labels"]["en"]["value"]
                                        }).addClass("list-group-item"));
                                    }
                                }
                            }
                        });
                    });
                }
            }
        }
    }
    <!------------------------------------->

    function filter() {
        $("#filterButton").on("click", function() {
            $("#checkBoxDiv").slideToggle();
            $('#cbList').find("input").remove();
            $('#cbList').find("label").remove();
            for (var key in filterList) {
                if (filterList.hasOwnProperty(key)) {
                    property[key.split(":")[0]] = key.split(":")[1];
                    addCheckbox(key.split(":")[0]);
                }
            }
        });

        $("#valuesList").on("click", function() {
            var checkedProperties = [];
            $('#filteredValues').find("li").remove();
            $.each($("input[type='checkbox']:checked"), function() {
                checkedProperties.push($(this).val());
                for (var key in filterList) {
                    if (filterList.hasOwnProperty(key)) {
                        if (key.includes($(this).val() + ":")) {
                            var values = filterList[key];
                            addDropDown(key + "," + values);
                        }
                    }
                }
            });
        });

        $("#showValues").on("click", function() {
            selectedProprtyList = [];
            $("#resultList").find('li').remove();
            var checkedProperties = [];
            //$('#filteredValues').find("li").remove();
            $.each($("input[type='checkbox']:checked"), function() {
                checkedProperties.push($(this).val());
                for (var key in filterList) {
                    if (filterList.hasOwnProperty(key)) {
                        if (key.includes($(this).val() + ":")) {
                            selectedProprtyList.push(key);
                        }
                    }
                }
            });
            for (var i = 0; i < qidListInResult.length; i++) {
                getFilterProperties(qidListInResult[i].split(":")[1]);
            }
            showSelectProperties(selectedProprtyList, qidListInResult);
        });

        $("#filteredValues").on("click", ".list-group-item", function() {
            var k = $(this).text();
            for (var key in filterList) {
                if (filterList.hasOwnProperty(key)) {
                    if (filterList[key].includes(k)) {
                        pId = key.split(":")[1].substr(1);
                        qId = k.split(":")[1];
                        $("#resultList").find('li').remove();
                        getPropertyValueResult();

                    }
                }
            }
        });
    }
    filter();
})();
