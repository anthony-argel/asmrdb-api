const express = require('express');
var router = express.Router();
const Upload = require('../models/upload');
const Channel = require('../models/channel');
const User = require('../models/user');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const {body, validationResult} = require('express-validator');

const async = require('async');
const { DateTime } = require('luxon');

router.get('/', (req, res, next) => {
    Upload.find().limit(10).exec((err, result) => {
        if(err) {res.status(400).json({message: 'an error has occurred'});}
        res.status(200).json({uploads: result});
    });
});

// CRUD
// create
router.post('/', passport.authenticate('jwt', {session:false}), [
    body('name').trim().exists(),
    body('description').trim().exists(),
    body('channelid').trim().exists(),
    body('magneturl').trim().exists(),
    (req,res, next) => {
        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
        
        const errors = validationResult(req);
        if(!errors.isEmpty()) {res.status(400).json({message: 'an error has occurred'});}
        else {
            async.parallel({
                channel: function(callback) {
                    Channel.findById(req.body.channelid).exec(callback);
                },
                uploader: function(callback) {
                    User.findById(decoded.user._id).exec(callback);
                }
            }, (err, results) => {
                if(err) {
                    return res.status(400).json({message: 'an error occurred.'})
                }
                if(results.channel === null) {res.status(400).json({message:'channel not found'});}
                else if (results.uploader === null) {res.status(400).json({message: 'uploader not found'});}
                else {
                    const newUpload = new Upload({
                        name: req.body.name,
                        description: req.body.description,
                        channelid: req.body.channelid,
                        magnet: req.body.magneturl,
                        authorid: decoded.user._id,
                        date: DateTime.now()
                    });

                    newUpload.save(err => {
                        if(err) {
                            res.status(400).json({message: "an error occurred while uploading"})
                        }
                        else {
                            res.status(200).json({message: "magnet uploaded"});
                        }
                    })
                }
            })
        }
    }
]);

// read
router.get('/:id', (req, res, next) => {
    Upload.findById(req.params.id).exec((err, result) => {
        if(err) { return res.status(400).json({message:'unable to find magnet'});}
        if(result) {
            res.status(200).json({magnet:result});
        }
        else {
            res.status(400).json({message:'unable to find magnet'});
        }
    })
});

// update 
// router.post('/:id', passport.authenticate('jwt', {session:false}), [
//     (req, res, next) => {
        
//     }
// ]);

// delete
router.delete('/:id', passport.authenticate('jwt', {session:false}), 
    (req, res, next) => {
        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
    
        Upload.findOneAndDelete({_id: req.params.id, authorid: decoded.user._id}, 
            (err) => {
                if(err) { return res.status(400).json({message:err});}
                res.status(200).json({message:'magnet deleted'});
            })    
    
    }
)

module.exports = router;