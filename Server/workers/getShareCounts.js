// Updates facebook and twitter shares
var	request = require('request-enhanced'),
	db = require("./../helpers/db"),
	_ = require('lodash');

var vidlength, done = 0;
var refreshShareCounts = function() {
	console.log('refreshShareCounts')
	db.videos.find({ }, function(err, videos) {
		if (err)
			console.log(err);
		else {
			vidlength = videos.length;
			_.forEach(videos, getShareCounts);
		}
	});
}

var getShareCounts = function(video, index) {
	request.get({
		url: 'https://free.sharedcount.com/url?url=https://www.youtube.com/watch?v=' + video.videoId + '&apikey=e420ebc7ae101c3055a305fa522d65b9075c2edb',
		maxAttempts: 3,
		maxConcurrent: 50
	}, function(error, response){
		if(!error){
			var oldShares = video.shareCounts ? video.shareCounts : { Facebook : { total_count : 0 }, Twitter : 0 };
			var newShares = JSON.parse(response);
			var newFaceBook = parseInt(newShares.Facebook.total_count) - parseInt(oldShares.Facebook.total_count);
			var newTweets = parseInt(newShares.Twitter) - parseInt(oldShares.Twitter);
			db.videos.update({ videoId : video.videoId }, {$set: {
				shareCounts : newShares,
				avgFaceBookShares : video.avgFaceBookShares ? (video.avgFaceBookShares + newFaceBook)/2 : newFaceBook,
				avgTweets : video.avgTweets ? (video.avgTweets + newTweets)/2 : newTweets
			}});
		} 

		done++;
		if(vidlength == done) {
			process.exit();
		}
	});
}

refreshShareCounts();