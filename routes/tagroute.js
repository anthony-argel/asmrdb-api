var express = require('express');
var router = express.Router();

const Tag = require('../models/tag');
const {DateTime} = require('luxon');

const { body, validationResult } = require('express-validator');

// return all tags in the database as a json file
router.get('/', (req, res, next) => {
    Tag.find().exec((err, result) => {
        if(err) { res.status(400).json({message: 'something went wrong'});}
        else {res.status(200).json({tags: result});}
    })
});

// CRUD 
//create
router.post('/', [
    body('name').trim().isLength({min:1}).withMessage('Name must be at least 1 character long').escape(),
    body('description').escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(errors) {
            res.status(400).json({errors: errors});
        }

        const newTag = new Tag({
            name: req.body.name,
            date: DateTime.now(),
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