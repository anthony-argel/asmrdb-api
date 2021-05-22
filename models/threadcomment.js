const mongoose= require('mongoose');
const Schema = mongoose.Schema;

const ThreadCommentSchema = new Schema({
    author: {type: mongoose.SchemaTypes.ObjectId, ref:'User', required:true},
    comment: {type: String, maxLength: 10000},
    deleted: {type:Boolean, required:true, default:false},
    threadid: {type:mongoose.SchemaTypes.ObjectId, ref:'Thread', required:true},
    date: {type: Date, required: true},
    editdate: {type:Date}
});

module.exports = mongoose.model('ThreadComment', ThreadCommentSchema);