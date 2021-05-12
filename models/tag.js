const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TagSchema = new Schema({
    name: {type:String, required: true},
    description: {type: String},
    addreason: {type: String},
    approved: {type: Boolean, required: true, default: false},
    date: {type: Date, required: true}
});

module.exports = mongoose.model('Tag', TagSchema);