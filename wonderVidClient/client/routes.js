Router.plugin('loading', {loadingTemplate: 'loading'});

Router.configure({
  loadingTemplate: 'loading',
  trackPageView: true
});

TopVideos = new Mongo.Collection('videos');
LiveVideos = new Mongo.Collection('live');
EmergingVideos = new Mongo.Collection('emerging');
AllStarVideos = new Mongo.Collection('allStar');
HipHopVideos = new Mongo.Collection('hiphop');
IndieVideos = new Mongo.Collection('indie');
ElectronicVideos = new Mongo.Collection('electronic');
RockVideos = new Mongo.Collection('rock');

Router.route('/about', {
  layoutTemplate: 'layout',
  template: 'about',
  onBeforeAction: function() {
    Session.set('about', true);
    Session.set('selectedGenre', 'About');
    this.next();
  }
});

subs = new SubsManager({
  expireIn: 30
});
Router.route('/', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return subs.subscribe('videos', 'topVideos');
  },
  data: function() {
    return updateGrid('Top Videos', TopVideos, this, '/');
  }
}); 

Router.route('/allStar', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  subs.subscribe('videos', 'allStar');
  },
  data: function() {
    return updateGrid('All Star', AllStarVideos, this, '/allStar');
  }
});

Router.route('/live', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return  subs.subscribe('videos', 'live');
  },
  data: function() {
   return updateGrid('Live', LiveVideos, this);
  }
});

Router.route('/emerging', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return subs.subscribe('videos', 'emerging');
  },
  data: function() {
    return updateGrid('Emerging', EmergingVideos, this);
  }
});  

Router.route('/hiphop', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return subs.subscribe('videos', 'hiphop');
  },
  data: function() {
    return updateGrid('Hip Hop', HipHopVideos, this);
  }
});  

Router.route('/indie', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return subs.subscribe('videos', 'indie');
  },
  data: function() {
    return updateGrid('Indie', IndieVideos, this);
  }
}); 

Router.route('/electronic', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return subs.subscribe('videos', 'electronic');
  },
  data: function() {
    return updateGrid('Electronic', ElectronicVideos, this);
  }
}); 

Router.route('/rock', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    return subs.subscribe('videos', 'rock');
  },
  data: function() {
    return updateGrid('Rock/Metal', RockVideos, this);
  }
}); 

LikedVideos = new Mongo.Collection(null);
Router.route('/likes', {
  layoutTemplate: 'layout',
  template: 'gridThumbs',
  waitOn: function() {
    if(!Meteor.user())
      AntiModals.overlay('simpleModal');

    return [function() {
      return Session.get('userLikes').length > 0;
    }]
  },
  data: function() {
    Session.set('videos', null);
    Session.set('selectedGenre', 'Likes');

    var videos = Session.get('userLikes');
    _.forEach(videos, function(video) {
      delete video._id;
      LikedVideos.update({rank: video.rank}, video, {upsert:true})
    });
    CurrentVideos = LikedVideos;
    var templateData = { videos: videos  };

    Session.set('playlist', _.map(videos, function(video) {
      return video.videoId;
    }));
    Session.set('videos', videos);
    setUpNextList(_.pluck(videos, 'videoId'));
  }
}); 

var setUpNextList = function(videoIds) {
  if (video) {
    nextList = {
      videoIds : videoIds,
      name : Router.current().route.getName()
    };
  }
}

var lastGrid = null; //this allows the the grid to be updated once per route visit, collection should updated every route change
var updateGrid = function(genre, collection, route) {
  if (route.ready() && lastGrid != genre) {
    lastGrid = genre;
    Session.set('videos', null);
    Session.set('selectedGenre', genre);
    var videos = collection.find({}, {sort:{rank:1}}).fetch();
    var vidIds = _.pluck(videos, 'videoId');
    var templateData = { videos: videos  };
    Session.set('playlist', vidIds);
    Session.set('videos', videos);
    setUpNextList(vidIds);
    CurrentVideos = collection;
  }
}