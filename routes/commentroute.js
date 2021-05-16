const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const {DateTime} = require('luxon');
const User = require('../models/user');
const Comment = require('../models/comment');
const {body, validationResult} = require('express-validator')

router.get('/', (req, res, next) => {
    Comment.find().exec((err, results) => {
        if(err){return res.status(400).json({message:err})}
        res.status(200).json({comments:results});
    });
});

// CRUD
// create
router.post('/', passport.authenticate('jwt', {session:false}), [
    body('channelid').exists(),
    body('comment').trim().isString().isLength({min:0, max:1000}),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {return res.status(400).json({errors:errors.array()})}

        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
        let newComment = new Comment({
            authorid: decoded.user._id,
            channelid: req.body.channelid,
            comment: req.body.comment,
            date: DateTime.now()
        }).save((err) => {
            if(err) {return res.status(400).json({message:err})}
            res.status(200).json({message:'saved comment'});
        });

    }
]);

// get
router.get('/:id', (req, res, next) => {
    Comment
    .find({channelid:req.params.id})
    .populate('authorid', '_id username date')
    .exec((err, results) => {
        if(err) {return res.status(400).json({message:"An error has occurred"})}
        res.status(200).json({comments: results});
    });
}); 

//delete
router.delete('/', passport.authenticate('jwt', {session:false}), (req, res, next) => {
    const userToken = req.headers.authorization;
    const token = userToken.split(' ');
    const decoded = jwt.verify(token[1], process.env.SECRET);
    if(req.body.authorid !== decoded.user._id) {
        if(decoded.user.admin !== true) {
            return res.sendStatus(400);
        }
    }

    Comment.findByIdAndDelete(req.body.commentid)
    .exec((err) => {
        if(err){return res.sendStatus(400)}
        res.sendStatus(200)
    })
});

module.exports = router;