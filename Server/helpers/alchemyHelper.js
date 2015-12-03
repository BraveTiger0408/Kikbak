var db = require("./../helpers/db"),
	_ = require('lodash'),
	AlchemyAPI = require('./../javascripts/alchemyapi'),
	alchemyapi = new AlchemyAPI();

function analyzePost(url, callback) {
	alchemyapi.combined('url', url, {
		extract: ['keyword', 'taxonomy', 'entity']
	}, function(data) {
    // console.log(data)
		var keywords = data.keywords ? data.keywords : [];
		var taxonomy = data.taxonomy ? data.taxonomy : [];	
		var entities = data.entities ? data.entities : [];
		db.buckets.find({}, function(err, buckets) {
			var bestBucket, bestOverall = 0;
			_.forEach(buckets, function(bucket) {
				var keywordConfidence = compareKeywords(bucket.approvedKeywords, bucket.magicWords, keywords),
					taxonomyConfidence = compareTaxonomy(bucket.solidTaxonomy, taxonomy),
					entityConfidence = compareEntity(bucket.solidEntities, bucket.entitiyTypes, entities);

				var	overall = keywordConfidence + (taxonomyConfidence * 1.5) + entityConfidence;

							console.log(keywordConfidence, taxonomyConfidence, entityConfidence, overall)

				if(overall >= 1.5 && overall > bestOverall) {
					bestBucket = bucket;
					bestOverall = overall
				}
			});
			if(bestBucket) {
				callback(bestBucket.tag);
        addData(data, bestBucket);
      } else
				callback();
		});
	});
}

function addData(data, bucket) {
  _.forEach(data.taxonomy, function(taxonomy) {
    db.buckets.find({ 
      tag: bucket.tag, 
      "taxonomy.text": taxonomy.label
    }, function(err, res) {
      if(res.length === 0) {
        db.buckets.update({ tag: bucket.tag }, { 
          $addToSet : {
            taxonomy: {
              text: taxonomy.label,
              count: 1,
              score: parseFloat(taxonomy.score) 
            }
          }
        }, function(err, res) {
          // console.log(err, res)
        });
      } else {
        db.buckets.update({ 
          tag: bucket.tag, 
          "taxonomy.text": taxonomy.label
        }, { 
          $inc: { 
            "taxonomy.$.count" : 1,
            "taxonomy.$.score" : parseFloat(taxonomy.score) 
          }
        }, function(err, res) {
          // console.log(err, res)
        });
      }
    });
  });

  _.forEach(data.keywords, function(keyword) {
    db.buckets.find({ 
      tag: bucket.tag, 
      "keywords.text": keyword.text
    }, function(err, res) {
      if(res.length === 0) {
        db.buckets.update({ tag: bucket.tag }, { 
          $addToSet : {
            keywords: {
              text: keyword.text,
              count: 1,
              score: parseFloat(keyword.relevance) 
            }
          }
        }, function(err, res) {
          // console.log(err, res)
        });
      } else {
        // res = res[0];
        // var keywordRecord = _.find(res.keywords, function(keywordRec) {
        //   return keywordRec.text === keyword.text;
        // });

        // if(keywordRecord && keywordRecord.score > 10) {
        //   db.buckets.find({
        //     tag: {$ne: bucket.tag}, 
        //     keywords:{
        //       $elemMatch:{
        //         text: keyword.text,
        //         score: { $gt: keywordRecord.score }
        //       }
        //     }
        //   }, function(err, res) {
        //     if(res.length === 0) { //not found in other sets
        //       console.log('new new')
        //       // db.buckets.update({ tag: bucket.tag }, {$addToSet: {approvedKeywords: keyword.text}}
        //     } else {
        //       console.log(res)
        //       var otherRecords = _.map(res, function(result) {
        //         return _.find(result.keywords, function(word) {
        //           return word.text == keyword.text;
        //         });
        //       });
        //       var bigger = _.find(otherRecords, function(record) {
        //         return record.score > keywordRecord.score;
        //       })
        //       if(!bigger) {
        //         //add to bucket
        //         db.buckets.update({ tag: bucket.tag }, {$addToSet: {approvedKeywords: keyword.text}}
        //         //remove from other buckets
        //         db.buckets.update({
        //           tag: {$ne: bucket.tag}, 
        //           $pull: { keywords: { $elemMatch: { text: keyword.text } } }
        //         });
        //       }
        //     }
        //   })
        // }

        db.buckets.update({ 
          tag: bucket.tag, 
          "keywords.text": keyword.text
        }, { 
          $inc: { 
            "keywords.$.count" : 1,
            "keywords.$.score" : parseFloat(keyword.relevance) 
          }
        }, function(err, res) {
          // console.log(err, res)
        });
      }
    });
  });

  _.forEach(data.entities, function(entity) {
    db.buckets.find({ 
      tag: bucket.tag, 
      "entities.text": entity.text
    }, function(err, res) {
      if(res.length === 0) {
        db.buckets.update({ tag: bucket.tag }, { 
          $addToSet : {
            entities: {
              text: entity.text,
              count: 1,
              score: parseFloat(entity.relevance),
              timesFound: [ Date.now() ]
            }
          }
        }, function(err, res) {
          // console.log(err, res)
        });
      } else {
        //could have problems if multiple hit too fast
        res = res[0];
        var entitiyRecord = _.find(res.entities, function(entitiyRec) {
          return entitiyRec.text === entity.text;
        });
        // if(!entitiyRecord.timesFound)
        //   entitiyRecord.timesFound = [];
        // if(entitiyRecord.timesFound.length > 10)
        //   entitiyRecord.timesFound.shift();
        // entitiyRecord.timesFound.push(Date.now());

        // var newEntity = null;
        // if(entitiyRecord.timesFound.length >= 7) {
        //   var timeDelta = compareTimes(entitiyRecord.timesFound.slice(3));
        //   var typeGood = _.find(entity.disambiguated && entity.disambiguated.subType, function(type) { 
        //     return _.includes(bucket.entitiyTypes, type) 
        //   });
        //   if(timeDelta < 600000 && typeGood) { // 10 minutes and type is accepted
        //     newEntity = entitiyRecord.text;
        //   }
        // } 

        db.buckets.update({ 
          tag: bucket.tag, 
          "entities.text": entity.text
        }, { 
          $inc: { 
            "entities.$.count" : 1,
            "entities.$.score" : parseFloat(entity.relevance),
          },
          $set: {
            "entities.$.timesFound" : entitiyRecord.timesFound
          },
          // $addToSet: {
          //   solidEntities: newEntity
          // }
        }, function(err, res) {
          // console.log(err, res)
        });
      }
    });
  });
}

function compareTimes(times) {
  return _.reduceRight(times, function(accummulatedTime, time, index) {
      var more = index > 0 ? time - times[index - 1] : 0;
      return accummulatedTime + more;
    }, 0);   
}

function compareKeywords(base, magicWords, found) {
	var confidence = 0, hasMusicVideo = false, hasMagicWord = false;

	_.forEach(found, function(keyword) {
    var text = keyword.text, foundMagic = false;
    _.forEach(magicWords, function(magicWord) {
      if(text.toLowerCase().indexOf(magicWord) > -1) {
        foundMagic = true;
        hasMagicWord = true;
      }
    });

		if(_.includes(base, keyword.text)) {
      if(foundMagic)
			  confidence += (parseFloat(keyword.relevance) * 2)
      else
        confidence += parseFloat(keyword.relevance)
		} else if (foundMagic) {
			confidence += (parseFloat(keyword.relevance) * 1.5)
		}

		if(keyword.text.toLowerCase().indexOf('music video') > -1)
			hasMusicVideo = true;
    if(text.toLowerCase() === 'video')
      confidence -= 1;
	});
  if(hasMusicVideo && !hasMagicWord)
    confidence -= 5 //magic number, dont want music videos to be tagged
  
	return confidence;
}

function compareTaxonomy(base, found) {
	var confidence = 0;

	_.forEach(found, function(taxonomy) {
		if(_.includes(base, taxonomy.label)) {
			if (taxonomy.confident && taxonomy.confident == 'no')
				confidence += (parseFloat(taxonomy.score) * parseFloat(taxonomy.score))
			else
				confidence += parseFloat(taxonomy.score)
		}
	});

	return confidence;
}

function compareEntity(base, entitiyTypes, found) {
	var confidence = 0;

	_.forEach(found, function(entity) {
    if(_.includes(base, entity.text)) {
			confidence += parseFloat(entity.relevance)
		}
	});

	return confidence;
}

// Needs Rework
function gatherInfo(genre) {
	db.buckets.find({tag: genre}, function(err, frame) {
		if(err)
			return console.log(err)

		var searchedPosts = frame[0].searchedPosts;
		db.videos.find({tags:genre.toLowerCase()}, function(err, videos) {
			if(!err) {
				var i = 0;
				var inter = setInterval(function() {
					if(i === videos.length)
						return clearInterval(inter);

					var video = videos[i++];
					_.forEach(video.origPosts, function(url) { // go through post found 
						if(!_.includes(searchedPosts, url)) { // exclude already visited posts
							console.log(video.title, i)
							searchedPosts = _.union(searchedPosts, url);
							alchemyapi.combined('url', url, {
                extract: ['keyword', 'taxonomy', 'entity']
              }, function(data) {
				        addData(data, {tag: genre});
								db.buckets.update({tag: genre}, {
									$addToSet: {
										'searchedPosts' : url
									}
								})
							});
						} 
					});
				}, 500);
			} else {
				console.log(err)
			}
		});
	});
}

function countAlchemy(genre) {
	db.buckets.find({tag: genre}, function(err, frame) {
		console.log("========== " + genre + " ========");
		setPrint(frame[0].taxonomy, "taxonomy");
		console.log("==============================");
		setPrint(frame[0].entities, "entities");
		console.log("==============================");
    setPrint(frame[0].keywords, "keywords");
	});
}

function toArray(data) {
  return _.map(data, function(val, key) {
    return {
      text: key,
      count: val.count
    };
  });
}

function bySortedValue(obj, callback, context) {
    var tuples = [];

    for (var key in obj) tuples.push([key, obj[key]]);

    tuples.sort(function(a, b) { 
      return a[1].count < b[1].count ? 1 : a[1].count > b[1].count ? -1 : 0 
    });

    var length = 0;
    while (length++ != 100) callback.call(context, tuples[length][0], tuples[length][1]);
}

function setPrint(sets, name) {
	console.log("Total " + name + ": " + _.keys(sets).length);
	console.log("Total unique " + name + ": " + _.keys(sets).length);	
	console.log("Top 10 most common " + name);
	// bySortedValue(sets, function(key, value) {
	// 	console.log(key, value);
	// });
  console.log(sets.sort(function(a, b) {
    return a.count - b.count;
  }).reverse().slice(0, 100))
}	

function counts(sets) {
  var dictionary = {};
  var nodupes = _.uniq(sets, false);
  _.forEach(sets, function(index) {
    if(dictionary[index] === undefined) dictionary[index] = { count : 0 };
    dictionary[index].count++;
  });
  return dictionary;
}

function objectize(sets) {
  var dictionary = _.object(_.map(sets, function(val, key) {
    return [key, {
      count: val
    }]
  }));
  return dictionary;
}

module.exports = analyzePost;

analyzePost("http://hiphopsince1987.com/2015/videos/zay-bella-push-it-video/", function(tag) {
	console.log(tag)
})
// // gatherInfo("Interview")
// countAlchemy("Live")
  // var subtractedKeywords = _.filter(frame[0].keywords, function(keyword) {
//     var found = false;

//     _.forEach(frame[0].entities, function(val,entity) {
//       if(keyword.indexOf(entity) > -1) {
//         found = true;
//         return false;
//       }
//     });

//     return !found;
//   });
  // var x = setPrint(counts(subtractedKeywords), "Keywords without entities");
//   _.forEach(x, function(val, key) {
//     if(key.indexOf('.') > -1 || key[0] === '$') {
//       console.log(key)
//       delete x[key]
//     }
//   }) 
//   db.buckets.update({tag:genre}, {$set : {keywords: x}}, function(err, res) {
//     console.log(err, res)
//   })