const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const {DateTime} = require('luxon');
const ChannelRating = require('../models/channelrating');
const {body, validationResult} = require('express-validator');


// get all 
router.get('/', (req, res, next) => {
    ChannelRating.find()
    .exec((err, results)=>{
        if(err){res.status(400).json({message:'an error occurred while retrieving ratings'})}
        else {
            res.status(400).json({ratings: results});
        }
    })
});

// CRUD
// create and update
router.post('/:id', passport.authenticate('jwt', {session:false}), [
    body('rating').isInt({min:0, max:10}),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors:errors.array()})
        }

        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
        ChannelRating.find({channelid: req.params.id, raterid:decoded.user._id})
        .exec((err, result) => {
            if(err) {
                res.status(400).json({message:err});
            }
            else if(result.length >0) {
                ChannelRating.findOneAndUpdate({channelid: req.params.id, raterid:decoded.user._id},
                    {rating: req.body.rating}, (err) => {
                        if(err) {
                            res.status(400).json({message:err});
                        }
                        else {
                            res.status(200).json({message:'updated rating.'})
                        }
                    })
            }
            else {
                const newRating = ChannelRating({
                    channelid: req.params.id,
                    raterid: decoded.user._id,
                    rating: req.body.rating,
                    date: DateTime.now()
                })

                newRating.save((err) => {
                    if(err) {res.status(400).json({message: err})}
                    else {
                        res.status(200).json({message:'saved rating'});
                    }
                })
            }
        })

    }   
]);

// read
router.get('/:id', (req, res, next) => {
    ChannelRating.find({channelid:req.params.id})
    .exec((err, results)=> {
        if(err) {res.status(400).json({message:'an error occurred while retrieving channel rating.'})}
        else {
            let ratingCount = 0;
            for(let i = 0; i < results.length; i++) {
                ratingCount += results[i].rating;
            }
            res.status(200).json({channelrating: ratingCount});
        }
    })
})

// delete
router.delete('/:id', passport.authenticate('jwt', {session:false}), 
    (req, res, next) => {
        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
        ChannelRating.findByIdAndDelete({raterid: decoded.user._id}).exec(err => {
            if(err) {
                res.status(400).json({message:'error deleting rating.'})
            }
            else {
                res.status(200).json({message:'deleted rating.'})
            }
        })
})

module.exports = router;