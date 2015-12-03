$(document).ready(function() {
  $('.deleteButton').click(function(event) {
    $target = $(event.target)

    var data = JSON.stringify({
        url: $('.url')[0].href,
        id: $('p')[0].id
      });
     $.ajax({
        "url": "/blogs/" + $('p')[0].id + '/delete/',
        "type": "POST",
        "contentType": "application/json",
        "data": data,
        "success": function() {
          location.reload()
        }
    });
  });

  $('.verifyButton').click(function(event) {
    $target = $(event.target)
    
    var data = JSON.stringify({
        url: $('.url')[0].href,
        id: $('p')[0].id
      });
     $.ajax({
        "url": "/blogs/" + $('p')[0].id + '/verify/',
        "type": "POST",
        "contentType": "application/json",
        "data": data,
        "success": function() {
          location.reload()
        }
    });
  });

  $('.tumblrButton').click(function(event) {
    $target = $(event.target)
    
    var data = JSON.stringify({
        url: $('.url')[0].href,
        id: $('p')[0].id
      });
     $.ajax({
        "url": "/blogs/" + $('p')[0].id + '/tumblr/',
        "type": "POST",
        "contentType": "application/json",
        "data": data,
        "success": function() {
          location.reload()
        }
    });
  });

  $('.changeUrl').click(function(event) {
    $target = $(event.target)
    $.ajax({
        "url": "/blogs/" + $('p')[0].id + '/update_url/' + encodeURIComponent($('.newUrl').val()),
        "type": 'POST', 
        "contentType": 'application/json', 
        "success": function() {
          location.reload()
        }
    });
  });
})