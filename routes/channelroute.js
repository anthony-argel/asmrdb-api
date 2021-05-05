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

/* GET home page. */
router.get('/', function(req, res, next) {
  Channel.find().limit(10).exec((err, results) => {
    if(err) {res.status(400).json({message: 'an error occurred'})}
    else {
      res.status(200).json({channels: results});
    }
  })
});

// CRUD
//create
router.post('/', [
  body('status').trim().exists(),
  body('niconico').trim(),
  body('youtube').trim().exists(),
  body('twitter').trim(),
  body('instagram').trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {res.status(400).json({message: 'an error occurred'})}
    else {
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
            if(err) {res.status(400).json({message: 'an error occurred'})}
            else {
              res.status(400).json({message: 'channel uploaded'})
            }
          })          


        }).catch((err) => {res.status(400).json({message:'something went wrong'});})
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
router.put('/:id', [
  (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {res.status(400).json({message: 'an error occurred'})}
    else {

      const updatedData = {};

      if(req.body.status !== '') {
        updatedData.status = req.body.status;
      }
      if(req.body.niconico !== '') {
        updatedData.niconico = req.body.niconico;
      }
      if(req.body.twitter !== '') {
        updatedData.twitter = req.body.twitter;
      }
      if(req.body.instagram !== '') {
        updatedData.instagram = req.body.instagram;
      }
      if(typeof req.body.enddate !== 'undefined') {
        updatedData.enddate = req.body.enddate;
      }

      Channel.findByIdAndUpdate(req.params.id, updatedData, (err) => {
        if(err) {res.status(400).json({message:'an error occurred while updating the channel.'})}
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
    if (err) {res.status(400).json({message:'Unable to find channel in database.'});}
    else {
      

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
      aliases: typeof data.items[0].localizations === 'undefined' || typeof data.items[0].localizations.en_US === 'undefined' ? undefined : data.items[0].localizations.en_US.title,
      imageurl: data.items[0].snippet.thumbnails.medium.url,
      lastytrefresh: DateTime.now(),
      viewcount: data.items[0].statistics.viewCount,
      videocount: data.items[0].statistics.videoCount
    };

    Channel.findByIdAndUpdate(req.params.id, updateInfo, (err) => {
      if(err) {res.status(400).json({message:'something went wrong while refreshing the channel data'})}
      else {
        res.status(200).json({message:'refreshed channel'})
      }
    })          
  }).catch((err) => {res.status(400).json({message:'something went wrong'});})
    }
  })
})

// delete
router.delete('/:id', (req, res, next) => {
  Channel.findByIdAndDelete(req.params.id).exec((err) => {
    if(err) {res.status(400).json({message: 'something went wrong'})}
    else {
      res.status(200).json({message: 'success'});
    }
  });
});


// call other data here as well such as tag list
router.get('/:id/all', (req, res, next) => {
  async.parallel({
    channel: function(cb) {
      Channel.findById(req.params.id).exec(cb);
    },
    rating: function(cb) {
      Rating.find({channelid: req.params.id}).exec(cb);
    },
    comments: function(cb) {
      Comment
      .find({channelid:req.params.id})
      .populate('authorid', '_id username date')
      .exec(cb);
    }
  },
    (err, result) => {
      if(err) {return res.status(400).json({message : "An error occurred"})}
      let channelRating = 0;
      for(let i = 0; i < result.rating.length; i++) {
        channelRating += result.rating[i].rating;
        channelRating /= result.rating.length;
      }
      res.status(200).json({channel: result.channel, rating: channelRating, comments: result.comments, numRaters: result.rating.length});
    }
  )
});

router.get('/:ytchannelid/refresh', (req, res, next) => {
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
      req.params.ytchannelid
    ]
  }).then((response) => {
    res.status(200).json({data: response.data});
  }).catch((err) => res.status(400).json({message: 'something went wrong while updating the channel'}))
}); 

module.exports = router;
