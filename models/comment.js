const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    authorid: {type: Schema.Types.ObjectId, ref:'User', required: true},
    channelid: {type: Schema.Types.ObjectId, ref:'Channel', required: true},
    comment: {type: String, required: true},
    date: {type: Date, required: true}
});

module.exports = mongoose.model('Comment', CommentSchema);