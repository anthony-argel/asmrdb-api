const express = require("express");
const router = express.Router();
const UserRating = require('../models/userrating');
const async = require('async');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const {DateTime} = require('luxon');
const {body, validationResult} = require('express-validator');

router.get('/', (req, res, next) => {
    UserRating.find().exec((err, result) => {
        if(err){res.status(400).json({message:'no ratings found'})}
        else {
            res.status(200).json({message:result});
        }
    })
})

// CRUD
// create and update (?)
router.post('/:id', passport.authenticate('jwt', {session:false}), [
    body('rating').isIn([-1,1]),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {res.status(400).json({message:errors});}
        else {
            const userToken = req.headers.authorization;
            const token = userToken.split(' ');
            const decoded = jwt.verify(token[1], process.env.SECRET);

            UserRating.find({ratedid: req.params.id, raterid: decoded.user._id}).exec((err, result) => {
                if(err) {res.status(400).json({message:'an error occurred while rating'});}
                else if(result.length > 0) {
                    UserRating.findOneAndUpdate({ratedid: req.params.id, raterid: decoded.user._id}, {rating: req.body.rating}, (err, foundRating) => {
                        if(err) {res.status(400).json({message:err})}
                        if(foundRating) {
                            res.status(200).json({message:'updated rating.'})
                        }
                        else {
                            res.status(400).json({message: 'An error occurred while rating.'})
                        }
                    });
                }
                else {
                    const newRating = new UserRating({
                        raterid: decoded.user._id,
                        ratedid: req.params.id,
                        rating: req.body.rating,
                        date: DateTime.now()
                    });
    
                    newRating.save((err) => {
                        if(err) {res.status(400).json({message:'an error occurred while saving the rating.'})}
                        else {
                            res.status(200).json({message: 'rating uploaded'});
                        }
                    })
                }



            });
        }        
    }
    ]
);

// read
router.get('/:id', (req, res, next) => {
    async.parallel({
        upvotes: function(callback) {
            UserRating.count({ratedid: req.params.id, rating: 1}).exec(callback);
        },
        downvotes: function(callback) {
            UserRating.count({ratedid: req.params.id, rating: -1}).exec(callback);
        }
    }, (err, result) => {
        if(err) {res.status(400).json({message:"an error occurred while counting user rating."})}
        else if (result) {
            res.status(200).json({userrating:result.upvotes + (result.downvotes * -1)})
        }
        else {
            res.status(200).json({userrating: 0})            
        }
    })
});

// delete
router.delete('/:id', passport.authenticate('jwt', {session:false}), (req, res, next) => {

    const userToken = req.headers.authorization;
    const token = userToken.split(' ');
    const decoded = jwt.verify(token[1], process.env.SECRET);

    UserRating.findOneAndDelete({ratedid: req.params.id, raterid: decoded.user._id}).exec((err) => {
        if(err){res.status(400).json({Message:'unable to delete rating. user may not exist.'})}
        else {res.status(200).json({message: 'deleted rating'})}
    })
})

module.exports = router;