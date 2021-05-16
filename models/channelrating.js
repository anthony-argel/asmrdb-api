const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChannelRatingSchema = new Schema({
    channelid: {type: Schema.Types.ObjectId, ref:'Channel', required:true},
    raterid: {type: Schema.Types.ObjectId, ref:'User', required:true},
    date: {type: Date, required: true},
    // user controlled
    rating: {type: Number, min:0, max:10, required: true, default: 7},
    review: {type: String, max:1000}
});

module.exports = mongoose.model('ChannelRating', ChannelRatingSchema);