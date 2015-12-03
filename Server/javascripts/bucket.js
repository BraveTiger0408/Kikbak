$(document).ready(function() {
  $('.moveKeywords').click(function(event) {
    var $selected = []
    $(".oldkeywords option:selected").each(function(index, selection) {
      $selected.push($(selection).text().match(/(?:"[^"]*"|^[^"]*$)/)[0].replace(/"/g, ""));
    });
    $.ajax({
        "url": "/buckets/" + $('h1').text() + '/moveKeywords/' + encodeURIComponent($selected.join()),
        "type": 'POST', 
        "contentType": 'application/json', 
        "success": function() {
          location.reload()
        }
    });
  });

  $('.deleteApprovedKeywords').click(function(event) {
    var $selected = []
    $selected.push($(".newkeywords option:selected").text().match(/(?:"[^"]*"|^[^"]*$)/)[0].replace(/"/g, ""));
    $.ajax({
        "url": "/buckets/" + $('h1').text() + '/deleteApprovedKeywords/' + encodeURIComponent($selected.join()),
        "type": 'POST', 
        "contentType": 'application/json', 
        "success": function() {
          location.reload()
        }
    });
  });

  $('.moveTaxonomy').click(function(event) {
    var $selected = []
    $(".oldTaxonomy option:selected").each(function(index, selection) {
      console.log($(selection).text().match(/(?:"[^"]*"|^[^"]*$)/)[0].replace(/"/g, ""));
      $selected.push($(selection).text().match(/(?:"[^"]*"|^[^"]*$)/)[0].replace(/"/g, ""));
    });
    $.ajax({
        "url": "/buckets/" + $('h1').text() + '/moveTaxonomy/' + encodeURIComponent($selected.join()),
        "type": 'POST', 
        "contentType": 'application/json', 
        "success": function() {
          location.reload()
        }
    });
  });

  $('.deleteSolidTaxonomy').click(function(event) {
    var $selected = []
    $selected.push($(".newTaxonomy option:selected").text().match(/(?:"[^"]*"|^[^"]*$)/)[0].replace(/"/g, ""));
    $.ajax({
        "url": "/buckets/" + $('h1').text() + '/deleteSolidTaxonomy/' + encodeURIComponent($selected.join()),
        "type": 'POST', 
        "contentType": 'application/json', 
        "success": function() {
          location.reload()
        }
    });
  });

  $('.moveEntities').click(function(event) {
    var $selected = []
    $(".oldEntities option:selected").each(function(index, selection) {
      $selected.push($(selection).text().match(/(?:"[^"]*"|^[^"]*$)/)[0].replace(/"/g, ""));
    });
    $.ajax({
        "url": "/buckets/" + $('h1').text() + '/moveEntities/' + encodeURIComponent($selected.join()),
        "type": 'POST', 
        "contentType": 'application/json', 
        "success": function() {
          location.reload()
        }
    });
  });

  $('.deleteSolidEntities').click(function(event) {
    var $selected = []
    $selected.push($(".newEntities option:selected").text().match(/(?:"[^"]*"|^[^"]*$)/)[0].replace(/"/g, ""));
    $.ajax({
        "url": "/buckets/" + $('h1').text() + '/deleteSolidEntities/' + encodeURIComponent($selected.join()),
        "type": 'POST', 
        "contentType": 'application/json', 
        "success": function() {
          location.reload()
        }
    });
  });

})