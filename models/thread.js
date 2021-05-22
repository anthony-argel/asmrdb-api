const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ThreadSchema = new Schema({
    title: {type:String, minLength:3, maxLength: 50, required:true},
    date: {type: Date, required: true},
    author: {type: mongoose.SchemaTypes.ObjectId, ref:'User', required:true},
    comment: {type: String, maxLength: 10000},
    board: {type: mongoose.SchemaTypes.ObjectId, ref:'Board', required: true},
    commentdeleted: {type: Boolean, required:true, default:false},
    editdate: {type: Date}
});

module.exports = mongoose.model('Thread', ThreadSchema);