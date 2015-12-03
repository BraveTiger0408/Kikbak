// Simple implementation to find the genre of a video. This should be replaced by alchemy.io
var _ = require('lodash'),
	blockRegex = require('./blockRegex'),
	blockedTitles = blockRegex.titles,
	blockedPublished = blockRegex.publishers;
var checkLive = function(text, youTubeDescription, uploader, title) {
	var tags = [];
	if (blockedTitles.test(title))
		tags = ['Live'];
	if (blockedPublished.test(uploader.toLowerCase()))
		tags = ['Live'];
	if(youTubeDescription.indexOf('GGN') > -1) 
		tags = ['Live'];
	return tags;
}

var checkMusicVideo = function(text, youTubeDescription, uploader, title) {
	var tags = [];
	if (title.toLowerCase().indexOf('official video') > -1 || title.toLowerCase().indexOf('music video') > -1
	 || uploader.toLowerCase().indexOf('vevo') > -1) {
		tags = ["Music Video"];
	}
	return tags;
}

var checkSeries = function(text, youTubeDescription, uploader, title) {
	var episodeRegex = /episode [0-9]+/i;
	if(episodeRegex.test(title)) {
		return ['NotAVid'];
	}
}

var tagFunctions = [checkMusicVideo, checkLive, checkSeries];
var getTag = function(html, $, youTubeDescription, title, uploader) {
	var tags = [];
	if (html.each) {
		html.each(function(i, el) {
			var text = $(this).text().toLowerCase();
			_.forEach(tagFunctions, function(tagIt) {
				tags = _.union(tags, tagIt(text, youTubeDescription, uploader, title));
			});
		});
	}
	return tags;
}

var getTagBasedOnVid = function(youTubeDescription, title, uploader) {
	var tags = [];
	_.forEach(tagFunctions, function(tagIt) {
		tags = _.union(tags, tagIt(null, youTubeDescription, uploader, title));
	});
	return tags;
}

module.exports = {
	getTag : getTag,
	getTagBasedOnVid : getTagBasedOnVid
}