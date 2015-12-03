var async = require('async'),
	fs = require('fs'),
	gm = require('gm'),
	requestOrig = require('request'),
	_ = require('lodash'),
	db = require("./../helpers/db");

var download = function(uri, filename, callback){
	requestOrig(uri).pipe(fs.createWriteStream(filename)).on('close', callback).on('error', function  (error) {
		console.log(error)
	});
};

function compareStills(video, cback) {
	var still1 = 'http://img.youtube.com/vi/' + video.videoId + '/1.jpg';
	var still2 = 'http://img.youtube.com/vi/' + video.videoId + '/2.jpg';
	var still3 = 'http://img.youtube.com/vi/' + video.videoId + '/3.jpg';
	var stills = [still1, still2, still3];
	var images = [];

	async.each(stills, function(still, callback, index) {
		download(still, video.videoId + stills.indexOf(still) + '.jpg', function(){
		  images.push('./' + video.videoId + stills.indexOf(still) + '.jpg');
		  callback();
		});
	}, function(err){
	    if( err ) {
	      console.log('A file failed to process');
	      _.forEach(images, fs.unlink)
	      cback(false)
	    } else {		
	    	gm.compare(images[0], './workers/noPicture.jpg', 0.02, function (err, isEqual, equality, raw, path1, path2) {
			  if (err) return cback(err);
			  if(isEqual) {
			  	_.forEach(images, fs.unlink)
			  	cback(false)
			  } else {
			  	gm.compare(images[0], images[1], 0.002, function (err, isEqual, equality, raw, path1, path2) {
				  if (err) return handle(err);				 
				  if(isEqual) {
				  	gm.compare(images[1], images[2], 0.002, function (err, isEqual, equality, raw, path1, path2) {
					  if (err) return handle(err);
					  _.forEach(images, fs.unlink)
					  cback(isEqual)
					  if(isEqual)
					  	console.log('still video', 'https://www.youtube.com/watch?v=' + video.videoId)
					});
				  } else {
				  	_.forEach(images, fs.unlink)
				  	cback(isEqual)
				  }
				});
			  }
			});
		}
	});
}

function findStills () {
	db.videos.find({ }, function(err, videos) {
		var i = 0;
		setInterval(function() {
			(function(video) {
				compareStills(video, function(isSame) {
					if(isSame === true)
						db.videos.update({ videoId : video.videoId }, {$addToSet: {
							tags : "NotAVid"
						}});
				});
			})(videos[i]);
			i++;
		}, 200)
	});
}

module.exports = {
	compare: compareStills
}