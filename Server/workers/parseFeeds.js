// Goes through all of the blogs
var http = require('http'),
	_ = require('lodash'),
	parser = require('parse-rss'),
	request = require('request-enhanced'),
	requestOrig = require('request'),
	cheerio = require('cheerio'),
	getYouTubeID = require('get-youtube-id'),
	youtubeThumbnail = require('youtube-thumbnail'),
	YouTube = require('youtube-node'),
	db = require("./../helpers/db"),
	getTags = require('./../helpers/getTags'),
	analyzePost = require('./../helpers/alchemyHelper'),
	pictureUtility = require('./../helpers/pictureUtility');

var youTube = new YouTube();
var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7, OLDVIDEOMAXDAYS = 50;
var youtubeKey = 'AIzaSyBbd9SAd34t1c1Z12Z0qLhFDfG3UKksWzg';
youTube.setKey(youtubeKey);

var refreshBlogsFeeds = function() {
	console.log('Finding new videos...');
	db.blogs.find({ tested : true}, function(err, blogs) {
		_.forEach(blogs, parseFeed);
	});
}

var posts = 0;
var parseFeed = function(url) {
	parser(url.url, function(err, postsData) {
		if(err) {
			// console.log('parseFeed', url, err);
		}
		else  {
			_.forEach(postsData, _.bind(getHtml, null, _, url));
		}
	});
}

var getHtml = function(post, blog) {
	request.get({
		url: post.link,
		maxAttempts:3,
		maxConcurrent: 50
	}, function(error, response){
		// First we'll check to make sure no errors occurred when making the request
		if(!error){
			// Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionalit
			var $ = cheerio.load(response);
			handlePost($, blog, post.link);
		} else {
			// console.log("getHtml", blog, post.link, error);
		}
	});
}

var handlePost = function($, blog, link) {
	var iframes = $('iframe');

	_.forEach(iframes, function(iframe) {
		if(iframe.attribs.src && iframe.attribs.src.indexOf('youtu') > -1) {
			addToDb(iframe.attribs.src, blog, $, link);
		}
	});
}

var tagVideo = function(vidId, html, $) {
	youTube.getById(vidId, function(error, result) {
		if(!error) {
			var tags;
			if(result && result['items'] && result['items'][0] && result['items'][0]['snippet'])
				tags = getTags.getTag(html, $, result['items'][0]['snippet']['description'], result['items'][0]['snippet']['title'], result['items'][0]['snippet']['channelTitle']);
			else
				tags = getTags.getTag(html, $, '', '', '');
			db.videos.update({ videoId : vidId }, {$addToSet: {
				tags : {$each:tags}
			}});
		}
	});
}

var addToDb = function(url, blog, $, link) {
	var vidId = getYouTubeID(url);
	db.videos.find({ videoId : vidId }, function(err, video) {  
		if (err) {
			// console.log('addToDb', err);
		} else {
			if (video.length > 0)
				updateVid(video, blog, vidId, $, link);
			else
				newVid(vidId, url, blog, $, link);
		}
	});
}

var updateVid = function(vidList, blog, vidId, $, link) {
	video = vidList[0];
	var foundUrls = _.map(video.foundOn, function(url) { return url.url });
	if (!_.includes(foundUrls,  blog.url)) {
		console.log('updating', video.title, video.foundOn, blog);
		var blogs = blog.tags ? blog.tags : [];
		var tags = _.union(getTags.getTag($('p'), $, "", "", ""), blogs);
		db.videos.update({ videoId : vidId }, {
			$addToSet: {
				foundOn : blog
			}
		});
		db.videos.update({ videoId : vidId }, {$addToSet: {
			tags : {$each:tags}
		}});
		db.videos.update({ videoId : vidId }, {$addToSet: {
			origPosts : link
		}});
	}
	posts++;
}

var newVid = function(vidId, url, blog, $, link) {
	//checkstills
	request.get({
		url: 'https://www.googleapis.com/youtube/v3/videos?part=statistics%2Csnippet&id=' + vidId  + '&key=' + youtubeKey,
		maxAttempts:3,
		maxConcurrent: 50
	}, function(error, result) {
		result = JSON.parse(result);
		if(result && result['items'] && result['items'].length > 0 
			&& /official audio|\(audio\)|\[audio\]|audio only/i.exec(result['items'][0]['snippet']['title']) == null) {
			if ((Date.now() - Date.parse(result['items'][0]['snippet']['publishedAt']))/day > OLDVIDEOMAXDAYS)
				return;

			pictureUtility.compare({ videoId: vidId }, function(isSame) {
				var blogs = blog.tags ? blog.tags : [];
				var tags =  _.union(getTags.getTag($('p'), $, result['items'][0]['snippet']['description'], result['items'][0]['snippet']['title'], result['items'][0]['snippet']['channelTitle']), blogs)
				console.log('adding', result['items'][0]['snippet']['title'], vidId); 

				if(isSame) {
					tags.push('NotAVid')
					db.videos.update({ videoId : vidId }, {
						$setOnInsert: {
							videoId : vidId,
							foundOn : [blog],
							origPosts : [link],
							dateFound : _.now()
						},
						$addToSet: { tags : { $each: tags } }
					}, { upsert : true }, function(err, res) {
						console.log(err, res)
					});
				} else {
					var bigThumb;
					var smallThumb;
					if(result['items'][0]['snippet']['thumbnails'].maxres) {
						bigThumb = result['items'][0]['snippet']['thumbnails'].maxres.url;
					} else if (result['items'][0]['snippet']['thumbnails'].standard) {
						bigThumb = result['items'][0]['snippet']['thumbnails'].standard.url;
					} else {
						bigThumb = result['items'][0]['snippet']['thumbnails'].high.url;
					}

					if(result['items'][0]['snippet']['thumbnails'].standard) {
						smallThumb = result['items'][0]['snippet']['thumbnails'].standard.url;
					} else {
						smallThumb = result['items'][0]['snippet']['thumbnails'].high.url;
					}

					analyzePost(link, function(tagFound) {
						if(tagFound && !_.includes(tags, "Music Video"))
							tags.push(tagFound)
						console.log('analyzed', link, tagFound);
						db.videos.update({ videoId : vidId }, {
							$setOnInsert: {
								youTubePostDate : result['items'][0]['snippet']['publishedAt'],
								videoId : vidId,
								foundOn : [blog],
								origPosts : [link],
								dateFound : _.now(),
								thumbnail : youtubeThumbnail(url),
								thumbHQ: bigThumb,
								thumbSmall: smallThumb,
								title : result['items'][0]['snippet']['title'],
								description : result['items'][0]['snippet']['description'],
								publishedBy : result['items'][0]['snippet']['channelTitle'],
								oldStats : result['items'][0]['statistics'],
								avgViewPerHalfHour : 0,
								avgLikePerHalfHour : 0,
								avgDislikePerHalfHour : 0,
								avgFavoritePerHalfHour : 0,
								avgCommentPerHalfHour : 0,
								taxonomy: taxonomy,
								keywords: keywords
							},
							$addToSet: {
								tags : {
									$each: tags
								}
							}
						}, { upsert : true }, function(err, res) {
							console.log(err, res)
						});
					});
				}
				posts++;
			}); 
		} else if (error) {
			// console.log(error);
		}			
	});
}

var lastPosts;
setInterval(function() {
	if (lastPosts == posts) {
		console.log('searched', posts, 'posts');
		process.exit();
	} else {
		lastPosts = posts
	}
}, 120000)

refreshBlogsFeeds();
