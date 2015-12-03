// Updates data for existing videos, or removes if too old.
var	db = require("./../helpers/db"),
	_ = require('lodash'),
	request = require('request-enhanced'),
	YouTube = require('youtube-node');

var youTube = new YouTube();
var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7, OLDVIDEOMAXDAYS = 50;
var youtubeKey = 'AIzaSyBbd9SAd34t1c1Z12Z0qLhFDfG3UKksWzg';
youTube.setKey(youtubeKey);
var vidlength;

var updateStatsForAllVids = function() {
	console.log('updateYoutubeData')
	db.videos.find({ }, function(err, videos) {  	
		if (err)
			console.log(err);
		else  {
			vidlength = videos.length;
			_.forEach(videos, updateStats);
		}
	});
}

var done = 0;
var updateStats = function(video, index) {
	var vidId = video.videoId;
	request.get({
		url: 'https://www.googleapis.com/youtube/v3/videos?part=statistics%2Csnippet&id=' + video.videoId  + '&key=' + youtubeKey,
		maxAttempts:3,
		pool: {maxSockets: 10}
	}, function(error, result){
		result = JSON.parse(result);
		if(result && result['items'] && result['items'][0]) {
			if ((Date.now() - Date.parse(result['items'][0]['snippet']['publishedAt']))/day > OLDVIDEOMAXDAYS) {
				db.videos.remove({ videoId : vidId });
				console.log('removed', vidId, (Date.now() - Date.parse(result['items'][0]['snippet']['publishedAt']))/day);
				return;
			}

			var oldStats = video.oldStats;
			var newStats = result['items'][0]['statistics'];
			var newViews = (parseInt(newStats.viewCount) - parseInt(oldStats.viewCount));
			var newLikes = (parseInt(newStats.likeCount) - parseInt(oldStats.likeCount));
			var newDislikes = (parseInt(newStats.dislikeCount) - parseInt(oldStats.dislikeCount));
			var newFavorites = (parseInt(newStats.favoriteCount) - parseInt(oldStats.favoriteCount));
			var newComments = (parseInt(newStats.commentCount) - parseInt(oldStats.commentCount));
			// console.log(parseInt(newStats.viewCount), '-', parseInt(oldStats.viewCount), '=', newViews, video.avgViewPerHalfHour, (video.avgViewPerHalfHour + newViews)/2)
			db.videos.update({ videoId : vidId }, {$set: {
				oldStats : newStats,
				avgViewPerHalfHour : video.avgViewPerHalfHour ? (video.avgViewPerHalfHour + newViews)/2 : newViews,
				avgLikePerHalfHour : video.avgLikePerHalfHour ? (video.avgLikePerHalfHour + newLikes)/2 : newLikes,
				avgDislikePerHalfHour : video.avgDislikePerHalfHour ? (video.avgDislikePerHalfHour + newDislikes)/2 : newDislikes,
				avgFavoritePerHalfHour : video.avgFavoritePerHalfHour ? (video.avgFavoritePerHalfHour + newFavorites)/2 : newFavorites,
				avgCommentPerHalfHour : video.avgCommentPerHalfHour ? (video.avgCommentPerHalfHour + newComments)/2 : newComments
			}});
		} else if (result && result['items'] && result['items'].length === 0)
			db.videos.update({videoId : video.videoId}, {$addToSet: {tags: "NotAVid"}});
		done++;
		if(vidlength == done) 
			process.exit();
	});
}

updateStatsForAllVids();