const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const {DateTime} = require('luxon');
const Comment = require('../models/comment');

router.get('/', (req, res, next) => {
    Comment.find().exec((err, results) => {
        if(err){return res.status(400).json({message:err})}
        
    });
});

module.exports = router;