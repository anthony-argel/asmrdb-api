var express = require('express');
var router = express.Router();
const Channel = require('../models/channel');
const Tag = require('../models/tag');
const Rating = require('../models/channelrating');
const Comment = require('../models/comment')
const {DateTime} = require('luxon');
const async = require('async');

const {body, validationResult} = require('express-validator');
const {google} = require('googleapis');
const user = require('../models/user');
const { route } = require('./tagroute');

const jwt = require('jsonwebtoken');
const passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
  Channel.find().exec((err, results) => {
    if(err) {return res.status(400).json({message: 'an error occurred'})}
    else {
      res.status(200).json({channels: results});
    }
  })
});

router.get('/limit/:start', function(req, res, next) {
  let startInd = parseInt(req.params.start);
  if (typeof startInd !== 'number') {
    res.sendStatus(404);
  }
  if(startInd <= 0) {
    res.sendStatus(404);
  }
  async.parallel({
    channels: function(cb) {
      Channel.find().skip(50*(startInd - 1)).limit(50).exec(cb);
    },
    totalchannels: function(cb) {
      Channel.countDocuments().exec(cb);
    }
  }, (err, results) => {
    if(err) {return res.sendStatus(400)}
    res.status(200).json({channels:results.channels, totalchannels:results.totalchannels})
  })
});


router.get('/:start/search',
  (req, res, next) => {
    let startInd = parseInt(req.params.start);
    if (typeof startInd !== 'number') {
      res.sendStatus(404);
    }
    if(startInd <= 0) {
      res.sendStatus(404);
    }
    async.parallel({
      channels: function(cb) {
        Channel
        .find({$text: {$search: req.query.query, $caseSensitive: false}})
        .sort({score:{$meta: 'textScore'}})
        .limit(40)
        .skip(40 * (startInd - 1))
        .exec(cb);
      },
      totalchannels: function(cb) {
        Channel
        .countDocuments({$text: {$search: req.query.query, $caseSensitive: false}})
        .exec(cb)
      }
    }, (err, results) => {
      if(err) {return res.sendStatus(400)}
      res.status(200).json({channels: results.channels, totalChannels: results.totalchannels})
    })
  }
);

router.get('/latest', (req, res) => {
  Channel
  .find()
  .sort({_id: -1})
  .limit(3)
  .exec((err, results) => {
    if(err) {return res.sendStatus(400);}
    res.status(200).json({channels: results});
  })
})

// CRUD
//create
router.post('/', passport.authenticate('jwt', {session:false}), [
  body('status').trim().isString().isLength({max:100}).exists(),
  body('niconico').trim().isString().isLength({max:100}),
  body('youtube').trim().exists().isString().isLength({max:100}),
  body('twitter').trim().isString().isLength({max:100}),
  (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {return res.sendStatus(400)}
    else {
      Channel.find({youtube:req.body.youtube}, {_id:1}).exec((err, result) => {
        if(err) {return res.sendStatus(400)}
        if (result.length > 0) {
          return res.status(200).json({channelid: result});
        }
      });
        google.youtube('v3').channels.list({
          "key": process.env.YT_API_KEY,
          "part": [
            "snippet",
            "contentDetails",
            "statistics",
            "contentOwnerDetails",
            "brandingSettings",
            "localizations",
            "brandingSettings"
          ],
          "id": [
            req.body.youtube
          ]
        }).then((response) => {
          const data = response.data;
          const newChannel = new Channel({
            name: data.items[0].snippet.title,
            aliases: typeof data.items[0].localizations === 'undefined' || typeof data.items[0].localizations.en_US === 'undefined' ? undefined : data.items[0].localizations.en_US.title,
            status: req.body.status,
            imageurl: data.items[0].snippet.thumbnails.medium.url,
            youtube: req.body.youtube,
            niconico: req.body.niconico !== '' ? req.body.niconico : undefined,
            twitter: req.body.twitter !== '' ? req.body.twitter : undefined,
            instagram: req.body.instagram !== '' ? req.body.instagram : undefined,
            startdate: data.items[0].snippet.publishedAt,
            enddate: req.body.endDate !== undefined ? req.body.endDate : undefined,
            lastytrefresh: DateTime.now(),
            viewcount: data.items[0].statistics.viewCount,
            videocount: data.items[0].statistics.videoCount
          });
    
          newChannel.save((err) => {
            if(err) {return res.status(400).json({message: 'an error occurred here', err})}
            else {
              Channel.find({youtube: req.body.youtube}, {_id:1}).exec((err, result) => {
                if(err) {return res.sendStatus(400);}
                  res.status(200).json({channelid: result})
              })
            }
          })          


        }).catch((err) => {return res.status(400).json({message:'something went wrong'});})
    }
  }
]);

// read
router.get('/:id', (req, res, next) => {
    Channel.findById(req.params.id).exec((err, result) => {
        if(err) {return next(err);}
        else {
          res.status(200).json({channel: result})
        }
    })
});

// update
router.put('/:id', passport.authenticate('jwt', {session:false}), [
  body('status').trim().isString().isLength({max:100}),
  body('niconico').trim().isString().isLength({max:100}),
  body('aliases').trim().isString().isLength({max:400}),
  body('twitter').trim().isString().isLength({max:100}),
  (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {res.status(400).json({message: 'an error occurred'})}
    else {
      const updatedData = {};

      if(typeof req.body.status !== 'undefined' ) {
        updatedData.status = req.body.status;
      } 
      if(typeof req.body.niconico !=='undefined') {
        updatedData.niconico = req.body.niconico;
      } 
      if(typeof req.body.twitter !== 'undefined') {
        updatedData.twitter = req.body.twitter;
      }
      if(typeof req.body.aliases !== 'undefined') {
        updatedData.aliases = req.body.aliases;
      }

      Channel.findByIdAndUpdate(req.params.id, updatedData, (err) => {
        if(err) {return res.status(400).json({message:'an error occurred while updating the channel.'})}
        else {
          res.status(200).json({message:'updated channel'})
        }
      })
    }
  }
]);


// refresh youtube data
router.post('/:id/refresh', (req, res, next) => {
  Channel.findById(req.params.id).exec((err, result) => {
    if (err) {return res.status(400).json({message:'Unable to find channel in database.'});}
    else {
      let dt = DateTime.fromJSDate(result.lastytrefresh);
      let timeDifference = dt.diffNow('days').as('days');
      if( timeDifference > -1) {
        return res.status(400).json({reason: 'Already updated in the last 24 hours'});
      }

  google.youtube('v3').channels.list({
    "key": process.env.YT_API_KEY,
    "part": [
      "snippet",
      "contentDetails",
      "statistics",
      "contentOwnerDetails",
      "brandingSettings",
      "localizations",
      "brandingSettings"
    ],
    "id": [
      result.youtube
    ]
  }).then((response) => {
    const data = response.data;
    const updateInfo = {
      name: data.items[0].snippet.title, 
      imageurl: data.items[0].snippet.thumbnails.medium.url,
      lastytrefresh: DateTime.now(),
      viewcount: data.items[0].statistics.viewCount,
      videocount: data.items[0].statistics.videoCount
    };

    Channel.findByIdAndUpdate(req.params.id, updateInfo, (err) => {
      if(err) {return res.status(400).json({message:'something went wrong while refreshing the channel data'})}
      else {
        return res.status(200).json({message:'refreshed channel'})
      }
    })          
  }).catch((err) => {return res.status(400).json({message:'something went wrong'});})
    }
  })
})

// delete
router.delete('/:id', passport.authenticate('jwt', {session:false}), (req, res, next) => {

  const userToken = req.headers.authorization;
  const token = userToken.split(' ');
  const decoded = jwt.verify(token[1], process.env.SECRET);
  if(decoded.user.admin !== true) {
    return res.sendStatus(403);
  }
  Channel.findByIdAndDelete(req.params.id).exec((err) => {
    if(err) {return res.status(400).json({message: 'something went wrong'})}
    else {
      res.status(200).json({message: 'success'});
    }
  });
});


// call other data here as well such as tag list
router.get('/:id/all', (req, res, next) => {
  async.parallel({
    channel: function(cb) {
      Channel.findById(req.params.id)
      .populate({
        path:'tags',
        populate: {path:'tags'}
      })
      .exec(cb);
    },
    rating: function(cb) {
      Rating.find({channelid: req.params.id}).populate('raterid', '_id username').exec(cb);
    },
    comments: function(cb) {
      Comment
      .find({channelid:req.params.id})
      .populate('authorid', '_id username date')
      .exec(cb);
    },
    allTags: function(cb) {
      Tag.find().exec(cb);
    }
  },
    (err, result) => {
      if(err) {return res.status(400).json({message : "An error occurred"})}
      res.status(200).json({allTags:result.allTags, channelTags: result.channelTags, channel: result.channel, comments: result.comments, ratings: result.rating});
    }
  )
});


// tag stuff, should this be it's own route?

router.post('/:id/tag', passport.authenticate('jwt', {session:false}), 
  [
    body('tagid').isString().exists(),
    (req, res, next) => {
      const errors = validationResult(req);
      if(!errors.isEmpty()) {return res.sendStatus(400)}
      Tag.findById(req.body.tagid).exec((err, result) => {
        if(err) {return res.status(400).json({err});}
        Channel.findOneAndUpdate({_id: req.params.id}, {
          $addToSet: {
            tags: {tagname: result.name, _id:req.body.tagid}
          } 
        })
        .exec((err) => {
          if(err) {return res.status(400).json({err});}
          res.sendStatus(200);
        })
      });
    }
])

router.delete('/:id/tag',passport.authenticate('jwt', {session:false}), (req, res, next) => {
    Channel.findOneAndUpdate({_id: req.params.id}, {
      $pull: {
        tags: {_id: req.body.tagid}
      } 
    })
    .exec((err) => {
      if(err) {return res.sendStatus(400);}
      res.sendStatus(200);
    });
})

module.exports = router;
