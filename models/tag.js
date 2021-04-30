const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TagSchema = new Schema({
    name: {type:String, required: true},
    description: {type: String},
    date: {type: Date, required: true}
});

module.exports = mongoose.model('Tag', TagSchema);