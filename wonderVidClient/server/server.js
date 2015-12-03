var base_url;
TopVideos = new Mongo.Collection('videos');
LiveVideos = new Mongo.Collection('live');
EmergingVideos = new Mongo.Collection('emerging');
AllStarVideos = new Mongo.Collection('allStar');
HipHopVideos = new Mongo.Collection('hiphop');
IndieVideos = new Mongo.Collection('indie');
ElectronicVideos = new Mongo.Collection('electronic');
RockVideos = new Mongo.Collection('rock');

Meteor.startup(function () {
  Future = Npm.require('fibers/future');
  ServiceConfiguration.configurations.upsert({
    service: "google"
  },{
    $set : {
      service: "google",
      clientId: "1017109112095-0f5c5pm9ko8bsojihiq17o0dgfmbhmac.apps.googleusercontent.com",
      loginStyle: "redirect",
      secret: "VBFRTPKgrck5cNSRh7Kv-DdQ"
    }
  });
  if(Meteor.absoluteUrl() == 'http://localhost:3000/') 
    base_url = "http://localhost:5000";
  else 
    base_url = "https://wondervid.herokuapp.com";
  
  
  updateAll(updates);
  var minutes = 30, the_interval = minutes * 60 * 1000;
  Meteor.setInterval(_.bind(updateAll, null, updates), the_interval);
});

var updates = [
  {
    url: '/videos',
    collection: TopVideos
  },
  {
    url: '/hiphop',
    collection: HipHopVideos
  },
  {
    url: '/indie',
    collection: IndieVideos
  },
  {
    url: '/electronic',
    collection: ElectronicVideos
  },
  {
    url: '/rock',
    collection: RockVideos
  },
  {
    url: '/live',
    collection: LiveVideos
  },
  {
    url: '/emerging',
    collection: EmergingVideos
  },
  {
    url: '/allstars',
    collection: AllStarVideos
  }
];

var updateAll = function(updates) {
  if(updates && updates.length != 0) {
    var first = _.first(updates)
    console.log('updating ' + first.url)
    updateThis(first.url, first.collection);
    Meteor.setTimeout(function() {
      updateAll(_.rest(updates));
    }, 10000);
  }
}

var updateThis = function(url, collection) {
  Meteor.http.get(base_url + url, function(err, res) {
    _.forEach(res.data, function(node, index) {
      node.rank = index + 1;
      var video = collection.findOne({rank:node.rank})
      if(video && video.videoId != node.videoId) {
        delete node._id;
        collection.upsert({rank:node.rank}, node, {upsert:true});
      } else {
        delete node._id;
        collection.upsert({rank:node.rank}, node, {upsert:true});
      }
    })    
  })
}

Meteor.publish('videos', function(type) {
  if (type == "topVideos") {
    return TopVideos.find({}, {sort:{rank:1}});
  } else if (type == 'live') {
    return LiveVideos.find({}, {sort:{rank:1}});
  } else if (type == 'emerging') {
    return EmergingVideos.find({}, {sort:{rank:1}});
  } else if (type == 'allStar') {
    return AllStarVideos.find({}, {sort:{rank:1}});
  } else if (type == 'hiphop') {
    return HipHopVideos.find({}, {sort:{rank:1}});
  } else if (type == 'indie') {
    return IndieVideos.find({}, {sort:{rank:1}});
  } else if (type == 'electronic') {
    return ElectronicVideos.find({}, {sort:{rank:1}});
  } else if (type == 'rock') {
    return RockVideos.find({}, {sort:{rank:1}});
  }
  return [];
});

Meteor.publish("userData", function () {
  if (this.userId)
    return Meteor.users.find({_id: this.userId});
  else 
    this.ready();
});

Meteor.methods({
  flagVideo: function(videoId, tag) {
    Meteor.http.put(base_url + '/flag/' + videoId + '?tag=' + tag);
  },
  likeVideo: function(id, like) {
    var apiKey = 'AIzaSyBbd9SAd34t1c1Z12Z0qLhFDfG3UKksWzg';
    Meteor.http.post('https://www.googleapis.com/youtube/v3/videos/rate?id='+id+'&rating=' + like + '&key{'+apiKey+'}&access_token='+Meteor.user().services.google.accessToken, function(err, result) {
      if(err.response && err.response.statusCode === 401) {
        Meteor.call('refreshOAuthToken', {name: 'google', url: 'https://accounts.google.com/o/oauth2/token'}, function(err, token) {
          if(!err) 
            Meteor.call('likeVideo', id, like);
          else 
            console.log(err);
        });
      }
    }); 
  },
  refreshOAuthToken: function(service) {
    var getNewAccessToken = function(service) {
      result = Meteor.http.post(service.url, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}, content: oAuthRefreshBody(service)});
      return result.data ? result.data.access_token : null;
    }
    var oAuthRefreshBody = function(service) {
      loginServiceConfig = Accounts.loginServiceConfiguration.findOne({service: service.name});
      return 'refresh_token=' + Meteor.user().services[service.name].refreshToken +
          '&client_id=' + loginServiceConfig.clientId +
          '&client_secret=' + loginServiceConfig.secret +
          '&grant_type=refresh_token';
    }
    var storeNewAccessToken = function(service, newAccessToken) {
      var o = {};
      o['services.' + service.name + '.accessToken'] = newAccessToken;
      Meteor.users.update(Meteor.userId(), {$set: o});
    }
    var token = getNewAccessToken(service);
    storeNewAccessToken(service, token);
    return token;
  },
  likedVideos: function(token) {
    token = token ? token : Meteor.user().services.google.accessToken;
    var fut = new Future();
    var apiKey = 'AIzaSyBbd9SAd34t1c1Z12Z0qLhFDfG3UKksWzg';
    Meteor.http.get('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true&key={{'+apiKey+'}&access_token='+token, function(err, likeList) {
      if(!err) {
        var likePlaylist = Meteor.http.get('https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&maxResults=50&playlistId=' + likeList.data.items[0].contentDetails.relatedPlaylists.likes + '&key={{'+apiKey+'}&access_token='+token)
        likePlaylist.data.items = _.map(likePlaylist.data.items, function(item, index) {
          item.title = item.snippet.title;
          item.videoId = item.contentDetails.videoId
          item.thumbnail = {};
          item.thumbnail.high = {},
          item.rank = index + 1;
          item.youTubePostDate = item.snippet.publishedAt;
          item.description = item.snippet.description;

          if(item.snippet.thumbnails)
            item.thumbnail.high.url  = item.snippet.thumbnails.high.url;

          var bigThumb;
          var smallThumb;
          if(item.snippet['thumbnails']) {
            if(item.snippet['thumbnails'].maxres) {
              bigThumb = item.snippet['thumbnails'].maxres.url;
            } else if (item.snippet['thumbnails'].standard) {
              bigThumb = item.snippet['thumbnails'].standard.url;
            } else {
              bigThumb = item.snippet['thumbnails'].high.url;
            }

            if(item.snippet['thumbnails'].standard) {
              smallThumb = item.snippet['thumbnails'].standard.url;
            } else {
              smallThumb = item.snippet['thumbnails'].high.url;
            }
          }

          
          item.thumbHQ = bigThumb
          item.thumbSmall = smallThumb;

          return item;
        });

        fut['return'](likePlaylist.data.items ? likePlaylist.data.items : []);
      } else if (err.response.statusCode == 401) {
        Meteor.call('refreshOAuthToken', {name: 'google', url: 'https://accounts.google.com/o/oauth2/token'},
          function(err, token) {
            if(!err) {
              fut['return'](Meteor.call('likedVideos'));
            } else {
              console.log(err)
            }
        });
      }
    });
    return fut.wait(); 
  }
});