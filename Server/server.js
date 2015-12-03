var http = require('http'),
	router = require('./router');
 
var app = router();
http.createServer(app).listen(app.get('port'), function(){
	if (process && process.env && process.env.NODE_ENV !== 'development') {
	    console.log = function () {};
	}  
	console.log('Express server listening on port ' + app.get('port'));
});