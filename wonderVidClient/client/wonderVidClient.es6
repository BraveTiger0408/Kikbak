var red = {
	hex : '#D6373A',
	light: '#C04848',
	dark : '#480048',
	rgb : 'rgba(214,55,58,0.5)',
	tag : "url('/images/rankBackgroundRed.png')"
}
var green = {
	hex : '#31C663',
	light: '#1D976C',
	dark : '#93F9B9',
	rgb : 'rgba(49,198,99,0.5)',
	tag : "url('/images/rankBackground.png')"
}
var blue = {
	hex : '#406EAA',
	light: '#7474BF',
	dark : '#348AC7',
	rgb : 'rgba(64,110,170,0.5)',
	tag : "url('/images/rankBackgroundBlue.png')"
}
var yellow = {
	hex : '#F7DD72',
	light: '#F09819',
	dark : '#EDDE5D',
	rgb : 'rgba(247,221,114,0.5)',
	tag : "url('/images/rankBackgroundYellow.png')"
}

colors = { red, green, blue, yellow };
currentTime = null;
_.enFunction = (func, ...args) => {
	return function() {
		if(args && args.length)
			func(...args);
		else
			func()
	}
}

Meteor.startup(() => {
	currentTime = new Date();
	Session.set('currentVideo', null);
	Session.set('userLikes', []);
	Session.setDefault('stateImage', 'playButton.png');
	Session.setDefault('selectedGenre', 'Top Videos');
	Session.set('playerPushedTop', true);
	Session.set('playerMinimized', false);
	if(!Cookie.get('color'))
		changeColor(colors.blue);
	else
		changeColor(JSON.parse(Cookie.get('color')));

	Accounts.ui.config({
		requestPermissions: {
			google: ['https://www.googleapis.com/auth/youtube']
		},
		requestOfflineToken: {google:true}
	});

	if(Meteor.user())
		getLikes();

	Mousetrap.bind('esc', reverseDropDownAnimation);
	Mousetrap.bind('right', _.enFunction(videoShortcut, "right"));
	Mousetrap.bind('left', _.enFunction(videoShortcut, "left"));
	Mousetrap.bind('down', restartDropDown);
	Mousetrap.bind('m',  minimizePlayerAnimation);
	Mousetrap.bind('space', togglePlayState);

});

function videoShortcut(direction, test) { // needs a this context
	if(video) {
		if(event)
			event.preventDefault();
		direction == 'right' ? video.nextVideo() : video.previousVideo();
	}
}

/**
 * Scrolls window to a video ina certain direction
 * @param  {String} direction "left" or "right"
 */
function scrollToCurrentVideo(direction) {
	var selectedElement = $(".single > .selected").parent();
	selectedElement = direction == "right" ? selectedElement.next() : selectedElement.prev();
	var left = selectedElement.offset().left;
	var right = selectedElement.width() + left;

	if (left < window.scrollX) 
		window.scrollTo(left, window.scrollY);
	else if (right > window.scrollX + window.innerWidth) 
		window.scrollTo(right - window.innerWidth, window.scrollY);
}

function togglePlayState() {
	if(video && video.getPlayerState() == YT.PlayerState.PLAYING)
		video.pauseVideo();
	else
		video.playVideo();
}

function setPseudoClass(rule, prop, value) {
	_.forEach(document.styleSheets, sheet => {
		_.forEach(sheet.cssRules, cssRule => {
			if(cssRule.selectorText && cssRule.selectorText.indexOf(rule) == 0)
				cssRule.style[prop] = value;
		})
	});
}

// ============== Accounts ============== //
var _logout = Meteor.logout;
Meteor.logout = function customLogout() {
	Session.set('userLikes', []);
	_logout.apply(Meteor, arguments);
}

Accounts.onLogin(getLikes);
function getLikes() {
	Meteor.call('likedVideos', function(err, res) {
		if(!err) 
			Session.set('userLikes', res);
	}); 
}

function reRank(videos) {
	return videos.map((video, rank) => {
		video.rank = rank + 1;
		return video;
	});
}

function hitLikeButton(video) {
	if(!Meteor.user())
		AntiModals.overlay('simpleModal');
	else {
		var index = likesIds().indexOf(video.videoId);
		likeVid(video, index, index > -1 ? 'none' : 'like');
	}
}

function likeVid(video, index, rating) {
	var likes = Session.get('userLikes');
	Meteor.call('likeVideo', video.videoId, rating, res => {
		if (!res || !res.error) {
			if (rating == 'none')
				likes.splice(index, 1);
			else
				likes.unshift(video);
			Session.set('userLikes', reRank(likes));
		}
	});
}

// ============== Helpers ============== //
video = null;
var playButton = "fa-play", 
		pauseButton = "fa-pause", tlMinimize = null, 
		tlDropdown = null, ytPlaylist = [];

Template.registerHelper('color', () => {
	return Session.get('color');
});

Template.registerHelper('colorImage', ()  => {
	return Session.get('colorImage');
});

Template.registerHelper('big', ()  => {
	return Session.get('device-screensize') != 'small' && Session.get('device-screensize') != 'medium';
});

Template.registerHelper('playerPushedTop', function() {
	return Session.get('playerPushedTop');
})

Template.registerHelper('playerMinimized', function() {
	return Session.get('playerMinimized');
})

Template.registerHelper('and', function () {
  var args = Array.prototype.slice.call(arguments, 0, -1);  // exclude key=value args
  return _.every(args, function (arg) {
    return !!arg;
  });
});

Template.registerHelper('or', function (...rest) {
  var args = Array.prototype.slice.call(rest, 0, -1);  // exclude key=value args
  var values = args.map(arg => !!arg);
  return _.contains(values, true);
});

function colorSwap(color) {
	Session.set('color', color.hex);
	Session.set('colorImage', color.tag);
	Session.set('colorRgb', color.rgb);
	setPseudoClass(".middle", "background", `-webkit-linear-gradient(90deg, ${color.light} 10%, ${color.dark} 90%)`);
	setPseudoClass(".middle", "background", `-moz-linear-gradient(90deg, ${color.light} 10%, ${color.dark} 90%)`);
	setPseudoClass(".middle", "background", `-webkit-linear-gradient(90deg, ${color.light} 10%, ${color.dark} 90%)`);
	setPseudoClass(".middle", "background", `-o-linear-gradient(90deg, ${color.light} 10%, ${color.dark} 90%)`);
	setPseudoClass(".middle", "background", `linear-gradient(90deg, ${color.light} 10%, ${color.dark} 90%)`);

	setPseudoClass("#login-buttons .login-buttons-with-only-one-button .login-button", "background", color.hex);
	setPseudoClass("#login-buttons .login-button:hover, .accounts-dialog .login-button:hover", "color", color.hex);
	setPseudoClass("#login-buttons .login-buttons-with-only-one-button .login-button", "border", `1px solid ${color.rgb}`);
	setPseudoClass(".single .selected", "border", `3px solid ${color.hex}`);
	setPseudoClass(".single .overlay:hover", "background-color", color.rgb);
}

function changeColor(color) {
	Cookie.set('color', JSON.stringify(color));
	colorSwap(color);
}

Template.simpleModal.helpers({
	loggedIn() {
		AntiModals.dismissOverlay($('.anti-modal-box'));
		return Meteor.user() ? "You're logged in!" : "You're not logged in!";
	},
})

Template.helpModal.helpers({
	shortcut() {
		return [{ key:'m', exp:'Minimize the player' },
						{ key:'esc', exp:'Push the player to the top' },
						{ key:'down', exp:'Bring the player down from the top' },
						{ key:'->', exp:'Next song' },
						{ key:'<-', exp:'Previous song' },
						{ key:'space', exp:'Pause the song' }];
	}
});

Template.helpModal.events({
	'click .about': (evt, f) => {
		AntiModals.dismissOverlay( AntiModals.dismissOverlay($(f.firstNode).parent()));
	}
})

// ============== Header ============== //
Template.about.events({
	'click .goBack': () => { Router.go('/') }
})

Template.header.helpers({
	genres() { 
		return [{type:"Top Videos", className: "topVideos"}, 
				{type:"Emerging", className: "emergingVideos"},
				{type:"All Star", className: "allStarVideos"},
				{type:"Hip Hop", className: "hipHopVideos"},
				{type:"Indie", className: "indieVideos"},
				{type:"Electronic", className: "electronicVideos"},
				{type:"Rock/Metal", className: "rockVideos"},
				{type:"Live", className: "liveVideos"}];
	},
	selectedGenre() {
		return Session.get('selectedGenre');
	},
	currentVideo() {
		return Session.get('currentVideo');
	},
	stateImage() {
		return Session.get("stateImage");
	},
	isLiked() {
		return likesIds().indexOf(Session.get('currentVideo').videoId) > -1;
	},
	isVideo() {
		return Session.get('currentVideo') != null;
	},
	notPlayerPushedTop() {
		mobileSafariHack('.mobile-exit');
		return !Session.get('playerPushedTop' );
	}
});

function mobileSafariHack(className) {
	Meteor.defer(function() {
		$(className).on('click', function() {});
	});
}

function likesIds() {
	return Session.get('userLikes').map(like => like.videoId);
}

CurrentVideos = null;
Template.header.events({
	'click .aboutDrop': () => {
		Router.go('/about');
	},
	'click .help': () => {
		AntiModals.overlay('helpModal');
	},
	'click .topVideos': () => {
		Router.go('/');
	},
	'click .allStarVideos': () => {
		Router.go('/allStar');
	},
	'click .hipHopVideos': () => {
		Router.go('/hipHop');
	},
	'click .indieVideos': () => {
		Router.go('/indie');
	},
	'click .electronicVideos': () => {
		Router.go('/electronic');
	},
	'click .rockVideos': () => {
		Router.go('/rock');
	},
	'click .liveVideos': () => {
		Router.go('/live');
	},
	'click .electronicVideos': () => {
		Router.go('/electronic');
	},
	'click .emergingVideos': () => {
		Router.go('/emerging');
	},
	"click .playButton":  () => {
		if (Session.equals("stateImage",playButton)) {
			video.playVideo();
			Session.set('stateImage', pauseButton);
		} else {
			video.pauseVideo();
			Session.set('stateImage', playButton);
		}
		restartDropDown();
	},
	"click .nextButton": () => {
		Session.set('stateImage', pauseButton);
		video.nextVideo();	
	},
	"click .prevButton": () => {
		Session.set('stateImage', pauseButton);
		video.previousVideo();	
	},
	'click .likedVideos' : () => {
		if(!Meteor.user())
			AntiModals.overlay('simpleModal');
		else
			Router.go('/likes');
	},
	'click #headerLike': () => {
		hitLikeButton(Session.get("currentVideo"));
	},
	'click .mobile-exit': reverseDropDownAnimation
});

// ============== Body ============== //
Template.gridThumbs.rendered = () => {
	$(".scroll-container").mousewheel(function(event, delta, deltaX, deltaY) {
		var singleDelta = (Math.abs(deltaX)>Math.abs(deltaY)) ? (-1 * deltaX) : deltaY; 
		if(Session.get('playerPushedTop') == true || Session.get('playerMinimized') == true) {
			event.preventDefault();

			// Determine the proper way to scroll (vert or horizontal) by
			// checking if the scrolling width exceeds the window width, and 
			// if the scrolling height exceeds the window height.
			if (this.scrollWidth > this.clientWidth){
				$(event.currentTarget).scrollLeft(event.currentTarget.scrollLeft + singleDelta * -30, 0);
			}
			else if (this.scrollHeight > this.clientHeight)
				$(event.currentTarget).scrollLeft(0, event.currentTarget.scrollTop + singleDelta * -30);
		}		
	});

	$('.lm-social-share-facebook').text("");
	$('.lm-social-share-twitter').text("");
}

Template.layout.helpers({
	platformClasses() {
	    var classes = [];

	    if (Meteor.isCordova) {
	      classes.push('platform-cordova');
	    }
	    if (Meteor.isClient) {
	      classes.push('platform-web');
	    }
	    if ((Meteor.isCordova && Platform.isIOS()) || Session.get('platformOverride') === 'iOS') {
	      classes.push('platform-ios');
	    }
	    if ((Meteor.isCordova && Platform.isAndroid()) || Session.get('platformOverride') === 'Android') {
	      classes.push('platform-android');
	    }

	    return classes.join(' ');
  }
})

var lastTime;
document.addEventListener("resume", function() {
	if(!lastTime)
		lastTime = currentTime;

	var diffMS = new Date() - lastTime;
	var minutes = (diffMS / (1000 * 60)).toFixed(1);

	if(minutes > 30) {
		subs.clear();
		lastTime = new Date();
	}
}, false);

Template.layout.helpers({
  templateGestures: {
    'doubletap *': function (event, templateInstance) {
    	console.log('closePlayer')
    	reverseDropDownAnimation()
      /* `event` is the Hammer.js event object */
       // `templateInstance` is the `Blaze.TemplateInstance` 
      /* `this` is the data context of the element in your template, so in this case `someField` from `someArray` in the template */
    },
  	'swipeleft *': function (event, templateInstance) {
    	video.nextVideo();
    },
  	'swiperight *': function (event, templateInstance) {
    	video.previousVideo();
    }
  }
});

// ============== Animations ============== //
function determineColor(dark, white) {
	return Session.equals("color", colors.yellow.hex) ? dark : white;
}

function minimizePlayerAnimation() {
	if(tlMinimize == null){
		tlMinimize = new TimelineLite();
		tlMinimize.to(".playerNavBar", 0.25, {ease: Expo.easeIn, right: "15%"});
		tlMinimize.to(".togglePlayer", 0.25, {ease: Expo.easeIn, opacity: "0"});
		tlMinimize.to(".playerSideBar", 0.25, {ease: Expo.easeIn, left: "23%"});
		tlMinimize.insert( new TweenLite(".player", 0.5, {width: "100%", height: "100%", right: 0}), 0);
		tlMinimize.to(".playerContainer", 0.5, {ease: Expo.easeOut, width: "25%", height: "25%", bottom: 0, right: 0, top: "initial"});
		tlMinimize.to(".playerNavBarMinimized", 0, {display: "block"});
		tlMinimize.to(".playerNavBarMinimized", 0.25, {top: "-20%"});
		Session.set('playerMinimized', true);
	} else if(Session.get('playerMinimized') == true){
		expandPlayerAnimation();
	} else{
		tlMinimize.restart();
		Session.set('playerMinimized', true);		
	}
}

function reverseDropDownAnimation() {
	if(video) {
		video.pauseVideo();
		Session.set('playerPushedTop', true);
		tlDropdown.reverse();
		Session.set('playerMinimized', false);
	}
}

function closeVideoAnimation() {
	setTimeout(() => {
		tlMinimize.reverse();
		setSidebarPositions();
	}, 500);
	Session.set('playerPushedTop', true);
	Session.set('playerMinimized', false);
	TweenLite.to(".playerContainer", 0.5, {autoAlpha:0, display:"none"});
	video.pauseVideo();
}

function expandPlayerAnimation() {
	tlMinimize.reverse();
	Session.set('playerPushedTop', false);
	Session.set('playerMinimized', false);
}

function dropDownInit() {
	Session.set('playerPushedTop', false);
	Session.set('playerMinimized', false);
	setSidebarPositions();
}

function setSidebarPositions() {
	if(Session.get("device-screensize") != 'small' && Session.get("device-screensize") != 'medium') {
		document.getElementById("playerNavBar").style.right = "15%";
		document.getElementById("playerSideBar").style.left = "23%";
		document.getElementById("playerNavBarMinimized").style.top = "0%";
	}
}

function restartDropDown() {	
	if(Session.equals('playerPushedTop', true) && Session.equals('playerMinimized', false)){
		dropDownInit();
		tlDropdown.restart();
		TweenLite.to(".playerContainer", 0, {autoAlpha:1, display:"block"});
	}
}

function createDropDownAnimation() {
	dropDownInit();
	tlDropdown = new TimelineLite();
	TweenLite.to(".playerContainer", 0, {autoAlpha:1, display:"block"});
	tlDropdown.from(".playerContainer", 0.5, {x:0, y: -screen.height, z: 0});
	tlDropdown.to(".playerContainer", 0.5, {ease: Expo.easeIn, x:0, y: 0, z: 0});
	tlDropdown.to(".playerNavBar", 0.55, {ease: Expo.easeIn, right: "-16px"});
	tlDropdown.to(".playerSideBar", 0.5, {ease: Expo.easeIn, left: "0%"}, '-=0.5');

	setTimeout(function() {
		$('.lm-social-share-facebook').text("");
		$('.lm-social-share-twitter').text("");
	},0);
}

// ============== Player ============== //
Template.player.helpers({
	needOverlay() {
		return Session.get('currentVideo') && Session.get('playerMinimized') == false && Session.get('playerPushedTop') == false;
	},
	currentVideo() {
		return Session.get('currentVideo') ? Session.get('currentVideo') : {description:""};
	},
	sharedata() {
		var video = Session.get('currentVideo');
		if(video) {
			return {
				facebook: true,
				twitter: true,
				pinterest: false,
				shareData: {
					defaultShareText: `${video.title} #musicvideo -- Found on Kikbak.tv youtu.be/${video.videoId}`
				}
			}
		} else
			return {};
	},
	minimized() {
		return Session.get('playerMinimized');
	},
	pushedTop() {
		mobileSafariHack('.downArrow')
		return Session.get('playerPushedTop') && Session.get('currentVideo') != null;
	},
	formedDate() {
		if(Session.get("currentVideo")) {
			var dateString = Session.get("currentVideo").youTubePostDate;
			return `${dateString.substring(5,7)} • ${dateString.substring(8,10)} • ${dateString.substring(0,4)}`;
		}
	},
	fbCounter() {
		var $el = $(".sideLikes p"), delay = 0;
		$el.text("");
		if(tlDropdown && tlDropdown.isActive()) delay = 2000;
		if(Session.get('currentVideo') && Session.get('currentVideo').shareCounts){
			var count = Session.get('currentVideo').shareCounts.Facebook.total_count;
		    $({percentage: 0}).stop(true).delay(delay).animate({percentage: count}, {
		        duration : 3000,
        		easing: "easeOutExpo",
		        step: function () {
		            var percentageVal =  Math.round(this.percentage) ? Math.round(this.percentage) : 0;
		            $el.text(percentageVal);
		        }
		    }).promise().done(function () {
		        $el.text(count);
		    });
		}
	},
	twCounter() {
		var $el = $(".sideDislikes p"), delay = 0;
		$el.text("");
		if(tlDropdown && tlDropdown.isActive()) delay = 2000;
		if(Session.get('currentVideo') && Session.get('currentVideo').shareCounts){
			var count = Session.get('currentVideo').shareCounts.Twitter;
		    $({percentage: 0}).stop(true).delay(delay).animate({percentage: count}, {
		        duration : 3000,
        		easing: "easeOutExpo",
		        step: function () {
		            var percentageVal =  Math.round(this.percentage) ? Math.round(this.percentage) : 0;
		            $el.text(percentageVal);
		        }
		    }).promise().done(function () {
		        $el.text(count);
		    });
		}
	}

});

Template.player.events({
	'click .blackOverlay': reverseDropDownAnimation,
	"click .togglePlayer": reverseDropDownAnimation,
	"click .minimizePlayer": minimizePlayerAnimation,
	"click .expandPlayer": expandPlayerAnimation,
	"click .closePlayer": closeVideoAnimation,
	"click .fa-chevron-down": restartDropDown,
	"mouseenter .fa-chevron-down": function (evt) {
		$(evt.currentTarget).removeClass("bounce");
		setTimeout(function() {
			$(evt.currentTarget).addClass("bounce");
		},0)
	},
	'click .flag-live': () => {
		flagVideo("Are you sure this is a high quality live video?", "live-high-quality");
	},
	'click .flag-livehh': () => {
		flagVideo("Are you sure this is a handheld live video?", "live-handheld");
	},
	'click .flag-interview': () => {
		flagVideo("Are you sure this is an interview?", "interview");
	},
	'click .flag-still': () => {
		flagVideo("Are you sure this is a still frame?", "still-shot");
	}
});

function flagVideo(message, tag) {
	new Confirmation({
		message: message,
		title: "Flag Video",
		cancelText: "Cancel",
		okText: "Ok",
		success: true // wether the button should be green or red
	}, ok => {
		Meteor.call('flagVideo', Session.get('currentVideo').videoId, tag);
	});
}

// ============== Grid Thumbs ============== //
Template.gridThumbs.helpers({
	alwaysShowTitles() {
		return Session.get('alwaysShowTitles');
	},
	turnDevice() {
		if(Session.get('device-orientation') == 'portrait')
			AntiModals.overlay('turnScreenModal')
		else
			AntiModals.dismissOverlay($('.anti-modal-box'));
	},
	isSelected() {
		return Session.get('currentVideo') ? Session.get('currentVideo').videoId == this.videoId : false;
	},
	isLiked() {
		return likesIds().indexOf(this.videoId) > -1;
	},
	hidePlayer() {
		return Session.get('playerTuckedLeft');
	},
	featured() {
		return (this.rank == 1 || (this.rank - 1) % 13 == 0) ? "featured" : "";
	},
	videos() {
		return Session.get('videos');
	}
});

Template.gridThumbs.events({
	"click .single": function (event) { // needs its own this
		if (event.target.className.indexOf("fa-heart-o") > -1 || event.target.className.indexOf("fa-heart") > -1){
			if(!Meteor.user())
				AntiModals.overlay('simpleModal');
			else
				hitLikeButton(this);
		} else {
			var index = Session.get('playlist').indexOf(this.videoId);
			if (index == -1) {
				Session.set('currentVideo', Session.get('videos')[this.rank + 1]);
				return video.playVideoAt(this.rank);
			}
			hitSquare(this, index);
		}
		
	},
	'click .like': function() { // needs its own this
		if(!Meteor.user())
			AntiModals.overlay('simpleModal');
		else
			hitLikeButton(this);
	}
});

function hitSquare(thisVid, index) {
	var oldVid = Session.get('currentVideo');
	Session.set('currentVideo', thisVid);
	if (oldVid && oldVid.videoId == thisVid.videoId && Session.equals("playerMinimized",true)){
		video.playVideo();
		expandPlayerAnimation();
	} else if (Session.equals('playerMinimized', true)){
		if(nextList) { 
			video.loadPlaylist(nextList.videoIds, index);
			nextList = null;
		} else
			video.playVideoAt(index);
	} else if (tlDropdown == null || Session.equals('playerPushedTop', true)){		
		createDropDownAnimation();
		if(nextList) {
			video.loadPlaylist(nextList.videoIds, index);
			nextList = null;
		}	else if(oldVid != null)
			video.playVideoAt(index);
		else
			renderVids(index);
	} else{ // dont think it ever gets here
		console.log("after: " + index);
		console.log('ooops we were using it')
		// restartDropDown();
		// if(nextList) {
		// 	video.loadPlaylist(nextList.videoIds, index); //need to test
		// 	nextList = null;
		// 	//updateList(video);
		// }
		// else
		// 	video.playVideoAt(index);
	}
}
// ============== Video Helpers ============== //
function findVid(videoId) {
	return _.find(Session.get('videos'), video => {
		return video.videoId == videoId;
	});
}

function updateList(event) {
	if (video.route != nextList.name) { // new page play first
		event.loadPlaylist(nextList.videoIds);
		Session.set('currentVideo', Session.get('videos')[0]);
	} else { // reload on same page, play next rank. SHOULD try to find id first then play rank if it can find it
		event.loadPlaylist(nextList.videoIds, Session.get('currentVideo').rank);
		Session.set('currentVideo', Session.get('videos')[Session.get('currentVideo').rank]);
	}
	video.route = nextList.name;
	nextList = null;
}

firstPlay = true, nextList = null;
renderVids = function renderVids(index) {
	Session.set("stateImage",pauseButton);	
	video = new YT.Player("player", {
		events: {
			onReady(event) {
				if(index != null)
					event.target.loadPlaylist(Session.get('playlist'), index);
				else
					event.target.cuePlaylist(Session.get('playlist'));
			},
			onStateChange(event) {
				if (firstPlay && event.data == YT.PlayerState.PLAYING) {
					firstPlay = false;
					Session.set('playlist', video.getPlaylist());
				}
				if(event.data == YT.PlayerState.PLAYING) {
					var nextVid = findVid(event.target.getVideoUrl().match(/[?&]v=([^&]+)/)[1]);
					Session.set('currentVideo', nextVid);
					Session.set("stateImage", pauseButton);
				} else if (event.data == YT.PlayerState.PAUSED) {
					Session.set("stateImage", playButton);
				} else if (event.data == YT.PlayerState.ENDED) {
					console.log(nextList)
					if(nextList)
						updateList(event.target);
					else {
						var nextVid = findVid(event.target.getVideoUrl().match(/[?&]v=([^&]+)/)[1]);
						Session.set('currentVideo', nextVid);
					}
				}
			},
			onError(errorCode) { //video unavailable
				if(errorCode.data == 100 || errorCode.data == 150)
					video.nextVideo();
			}
		} 
	});
	video.route = Router.current().route.getName();
	// YT.load();   	
};