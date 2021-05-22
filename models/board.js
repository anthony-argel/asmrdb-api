const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BoardSchema = new Schema({
    name: {type: String, minLength: 3, maxLength: 40, required:true},
    date: {type: Date, required:true},
    description: {type: String, minLength:3, maxLength: 100},
    creator: {type: mongoose.SchemaTypes.ObjectId, ref:'User', required:true},
    hidden: {type: Boolean, required:true, default:false}
});

module.exports = mongoose.model('Board', BoardSchema);