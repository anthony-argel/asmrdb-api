const express = require('express');
const router = express.Router();

const {body, validationResult} = require('express-validator');

const Thread = require('../models/thread');
const ThreadComment = require('../models/threadcomment');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const async = require('async');

const {DateTime} = require('luxon');

// CRUD
router.post('/', passport.authenticate('jwt', {session:false}), [
    body('title').trim().isString().isLength({min:3, max:50}).exists(),
    body('comment').trim().isString().isLength({max:10000}).exists(),
    body('boardid').trim().isString().exists(),
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {return res.status(400).json({errors:errors.array()})}

        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
        const newThread = new Thread({
            title: req.body.title,
            date: DateTime.now(),
            author: decoded.user._id,
            comment: req.body.comment,
            board: req.body.boardid
        })

        newThread.save(err => {
            if(err) {return res.sendStatus(400)}
            res.sendStatus(200);
        })
    }
])


router.get('/:id', (req, res) => {
    async.parallel({
        threaddata: function(cb) {
            Thread.findById(req.params.id).exec(cb);
        },
        comments: function(cb) {
            ThreadComment.find({threadid: req.params.id, deleted:false}, {author:1, comment:1, replyingto:1, date:1}).exec(cb);
        },
        deletedcomments: function(cb) {
            ThreadComment.find({threadid:req.params.id, deleted:true}, {replyingto:1, date:1}).exec(cb);
        }
    }, (err, results) => {
        if(err) {return res.sendStatus(400)}
        let returnData = { comments: results.comments.concat(results.deletedcomments)};
        if(results.threaddata.commentdeleted === true) {
            returnData.threaddata = {title:results.threaddata.title, date:results.threaddata.date}
        }
        else {
            returnData.threadData = {author: results.threaddata.author, title: results.threaddata.title, 
                date: results.threaddata.date, comment: results.threaddata.comment}
        }res.status(200).json(returnData)
    })
});


router.put('/:id', passport.authenticate('jwt', {session:false}), [
    body('comment').trim().isString().isLength({max:10000}).exists(),
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {return res.status(400).json({message:'Comment string is required'});}
        Thread.findById(req.params.id).exec((err1, result1) => {
            if(err1) {return res.sendStatus(400)}
            Thread.findOneAndUpdate({_id:req.params.id},
                {comment:req.body.comment, editdate: DateTime.now(), _id:result1._id}, 
                (err) => {
                if(err){return res.sendStatus(400)}
                res.status(200).json({comment:req.body.comment});
            });
        })
    }
]);

router.delete('/:id', passport.authenticate('jwt', {session:false}), (req, res) => {
    const userToken = req.headers.authorization;
    const token = userToken.split(' ');
    const decoded = jwt.verify(token[1], process.env.SECRET);
    Thread.findOneAndUpdate({_id:req.params.id, author:decoded.user._id}, {commentdeleted:true}, (err) => {
        if(err) {return res.sendStatus(400)}
        res.sendStatus(200);
    })
});

// CRUD for comments
router.post('/:id/comment', passport.authenticate('jwt', {session:false}),[
    body('comment').isString().withMessage('Comment must be a string').trim().isLength({max:10000}),
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {return res.status(400).json({errors:errors.array()})}

        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
        
        const commentData = {
            author: decoded.user._id,
            comment: req.body.comment,
            threadid: req.params.id,
            date: DateTime.now(),
            deleted: false
        }
        
        const newThreadComment = new ThreadComment(commentData);

        newThreadComment.save(err => {
            if(err) {return res.sendStatus(400)}
            res.sendStatus(200);
        })
}])

router.put('/:id/comment/:commentid', passport.authenticate('jwt', {session:false}), [
    body('comment').trim().isString().withMessage('Comment must be a string').isLength({max:10000}).exists(),
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {return res.status(400).json({errors:errors.array()})}

        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);

        ThreadComment.findOneAndUpdate({author:decoded.user._id, threadid:req.params.id, _id:req.params.commentid}, 
            {comment: req.body.comment, editdate: DateTime.now()},
            (err) => {
            if(err) {return res.sendStatus(400)}
            res.sendStatus(200);
        })
}]);

router.delete('/:id/comment/:commentid', passport.authenticate('jwt', {session:false}), (req, res) => {
    const userToken = req.headers.authorization;
    const token = userToken.split(' ');
    const decoded = jwt.verify(token[1], process.env.SECRET);

    ThreadComment.findOneAndUpdate({_id:commentid, author:decoded.user._id}, {deleted: true}, (err) => {
        if(err) {return res.sendStatus(400)}
        res.sendStatus(200);
    })
})

module.exports = router;