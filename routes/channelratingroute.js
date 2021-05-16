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
        if(err){return res.status(400).json({message:'an error occurred while retrieving ratings'})}
        else {
            res.status(200).json({ratings: results});
        }
    })
});

router.get('/latest', (req, res) => {
    ChannelRating
    .find()
    .populate('raterid', 'username _id')
    .populate('channelid', 'name _id')
    .sort({_id: -1})
    .limit(5)
    .exec((err, results) => {
      if(err) {return res.sendStatus(400);}
      res.status(200).json({reviews: results});
    })
  })

// CRUD
// create and update
router.post('/:id', passport.authenticate('jwt', {session:false}), [
    body('rating').isInt({min:0, max:10}).exists(),
    body('review').isString({max:1000}),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.sendStatus(400);
        }

        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
        ChannelRating.find({channelid: req.params.id, raterid:decoded.user._id})
        .exec((err, result) => {
            if(err) {
                return res.sendStatus(400);
            }
            else if(result.length >0) {
                ChannelRating.findOneAndUpdate({channelid: req.params.id, raterid:decoded.user._id},
                    {rating: req.body.rating, review: req.body.review}, (err) => {
                        if(err) {
                            return res.sendStatus(400);
                        }
                        else {
                            return res.sendStatus(200);
                        }
                    })
            }
            else {
                const newRating = ChannelRating({
                    channelid: req.params.id,
                    raterid: decoded.user._id,
                    rating: req.body.rating,
                    review: req.body.review,
                    date: DateTime.now()
                })

                newRating.save((err) => {
                    if(err) {return res.sendStatus(400)}
                    else {
                        return res.sendStatus(200);
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
        if(err) {return res.sendStatus(400)}
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
        
        ChannelRating.findOneAndDelete({channelid: req.params.id, raterid: decoded.user._id}).exec(err => {
            if(err) {return res.sendStatus(400);}
                res.sendStatus(200);
        })
})

module.exports = router;