var express = require('express');
var router = express.Router();

const Tag = require('../models/tag');
const Channel = require('../models/channel');
const {DateTime} = require('luxon');
const async = require('async');

const { body, validationResult } = require('express-validator');

// return all tags in the database as a json file
router.get('/', (req, res, next) => {
    async.parallel({
        approved: function(callback) {
            Tag.find({approved: 'true'}).exec(callback);        
        },
        waiting: function(callback) {
            Tag.find({approved: 'false'}).exec(callback);
        }
    },
    (err, results) => {
        if(err) {return res.sendStatus(400);}

        res.status(200).json({approved: results.approved, waiting: results.waiting})
    })
});

router.get('/latest', (req, res) => {
  Tag
  .find({approved:true})
  .sort({_id: -1})
  .limit(5)
  .exec((err, results) => {
    if(err) {return res.sendStatus(400);}
    res.status(200).json({tags: results});
  })
})

router.get('/:id/channels', (req, res, next) => {
    async.parallel({
        channels: function(cb) {
            Channel.find({'tags._id': req.params.id}).exec(cb);
        },
        tag: function(cb) {
            Tag.findById(req.params.id).exec(cb);
        }
    }, (err, results) => {
        if(err) {return res.sendStatus(400);}
        res.status(200).json({channels: results.channels, tag: results.tag});
    })
});

router.get('/:id/channels/:start', (req, res, next) => {
    let startInd = parseInt(req.params.start);
    if (typeof startInd !== 'number') {
      res.sendStatus(404);
    }
    if(startInd <= 0) {
      res.sendStatus(404);
    }
    async.parallel({
        channels: function(cb) {
            Channel.find({'tags._id': req.params.id}).skip(40 *(startInd - 1)).limit(40).exec(cb);
        },
        tag: function(cb) {
            Tag.findById(req.params.id).exec(cb);
        },
        totalchannels: function(cb) {
            Channel.countDocuments({'tags._id': req.params.id}).exec(cb);
        }
    }, (err, results) => {
        if(err) {return res.sendStatus(400);}
        res.status(200).json({channels: results.channels, tag: results.tag, totalchannels: results.totalchannels});
    })
});

// CRUD 
//create
router.post('/', [
    body('name').trim().isString().isLength({min:3, max: 40}).withMessage('Name must be at least 3 characters long').escape(),
    body('description').isString().isLength({min:3, max:200}),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors});
        }
        const newTag = new Tag({
            name: req.body.name,
            date: DateTime.now(),
            addreason: req.body.reason,
            description: req.body.description === '' ? undefined : req.body.description
        });
    
        newTag.save((err) => {
            if(err) {return res.status(400).json({message: 'something went wrong'});}
            else {res.status(200).json({message:'tag saved'});}
        });
    }
]);
    
// read
router.get('/:id', (req, res, next) => {
    Tag.findById(req.params.id).exec((err, result) => {
        if(err) {res.status(400).json({message: 'something went wrong'});}
        else {res.status(200).json({tag: result});}
    })
})

// update
router.put('/:id', [
    body('description').trim().exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {return res.status(400).json({message: 'something went wrong'})}
        else {
            Tag.findByIdAndUpdate(req.params.id, {description: req.body.description}, (err, result) => {
                if(err) {return res.status(400).json({message: 'something went wrong'})}
                else {
                    res.status(200).json({message:'updated description'})
                }
            })
        }
    }
]);


// delete
router.delete('/:id', (req, res, next) => {
    Tag.findByIdAndDelete(req.params.id).exec((err) => {
        if(err) {return res.sendStatus(400)}
        else {res.sendStatus(200)}
    })
});

  

module.exports = router;