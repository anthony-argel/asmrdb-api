const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const {body, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const Board = require('../models/board');
const Thread = require('../models/thread');
const {DateTime} = require('luxon');

const async = require('async');

router.get('/', (req, res) => {
    Board.find({hidden:false}, {_id:1, description:1, name:1}).sort({name:1}).exec((err, result) => {
        if(err) {return res.sendStatus(400)}
        res.status(200).json({boards: result});
    })
})

// CRUD
router.post('/',passport.authenticate('jwt', {session:false}),  [
    body('name').trim().isString().withMessage('Name must be a string').isLength({min:3, max:40}).withMessage('Name must be between 3-40 characters long').exists(),
    body('description').trim().isString().withMessage('Description must be a string').isLength({min:3, maxLength:100}).withMessage('Description must be within 3-100 characters long').exists(),
    (req, res) => {
        
        const errors = validationResult(req);
        if(!errors.isEmpty()) {res.status(400).json({message:errors.array()})}

        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
        if(decoded.user.admin !== true) {
            return res.sendStatus(403);
        }

        let formattedName = req.body.name.toUpperCase();
        Board.find({name: formattedName}).exec((err, result) => {
            if(err) {return res.sendStatus(400)}
            if(result.length > 0) {
                return res.status(400).json({error: 'A board with that name already exists'})
            }
            const newBoard = new Board({
                name: formattedName,
                description: req.body.description,
                date: DateTime.now(),
                creator: decoded.user._id
            });

            newBoard.save((err) => {
                if(err) {return res.sendStatus(400)}
                res.sendStatus(200);
            })
        })
    }
]);

router.get('/:id', (req, res) => {
    Board.findById(req.params.id).exec((err, result) => {
        if(err) {return res.sendStatus(400)}
        async.parallel({
            board: function(cb) {
                Board.findById(req.params.id, {name:1, description:1}).exec(cb);
            },
            deletedThread: function(cb) {
                Thread.find({board:req.params.id, commentdeleted:true}, {title:1, date:1})
                .exec(cb);
            },
            threads: function(cb) {
                Thread.find({board:req.params.id, commentdeleted:false}, {title:1, date:1, author:1, comment:1, editdate:1})
                .populate('author', {_id:1, username:1})
                .exec(cb)
            }
        }, (err, results) => {
            if(err) {return res.sendStatus(400)}
            res.status(200).json({board:results.board, threads: results.deletedThread.concat(results.threads)})
        })
    })
})

router.delete('/:id', passport.authenticate('jwt', {session:false}), (req, res) => {
    const userToken = req.headers.authorization;
    const token = userToken.split(' ');
    const decoded = jwt.verify(token[1], process.env.SECRET);
    if(decoded.user.admin !== true) {
        return res.sendStatus(403);
    }
    Board.findByIdAndUpdate(req.params.id, {hidden:true}, err => {
        if(err) {return res.sendStatus(400)}
        return res.sendStatus(200);
    })
});

module.exports = router;
