var express = require('express');
var router = express.Router();

const Tag = require('../models/tag');
const ChannelTag = require('../models/channeltag');
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
    console.log(req.query);
    async.parallel({
        channels: function(cb) {
            Channel.find({'tags.tagid': req.params.id}).exec(cb);
        },
        tag: function(cb) {
            Tag.findById(req.params.id).exec(cb);
        }
    }, (err, results) => {
        if(err) {return res.sendStatus(400);}
        res.status(200).json({channels: results.channels, tag: results.tag});
    })
    
});

// CRUD 
//create
router.post('/', [
    body('name').trim().isLength({min:1}).withMessage('Name must be at least 1 character long').escape(),
    body('description').escape(),
    (req, res, next) => {
        console.log('got here')
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors, message:'errors on validation'});
        }
        console.log('got here next');
        const newTag = new Tag({
            name: req.body.name,
            date: DateTime.now(),
            addreason: req.body.reason,
            description: req.body.description === '' ? undefined : req.body.description
        });
    
        newTag.save((err) => {
            if(err) {res.status(400).json({message: 'something went wrong'});}
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
        if(!errors.isEmpty()) {res.status(400).json({message: 'something went wrong'})}
        else {
            Tag.findByIdAndUpdate(req.params.id, {description: req.body.description}, (err, result) => {
                if(err) {res.status(400).json({message: 'something went wrong'})}
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
        if(err) {res.status(400).json({message: 'something went wrong'});}
        else {res.status(200).json({message:'tag deleted'});}
    })
});

  

module.exports = router;