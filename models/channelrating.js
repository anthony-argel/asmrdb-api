const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChannelRatingSchema = new Schema({
    channelid: {type: Schema.Types.ObjectId, ref:'Channel', required:true},
    raterid: {type: Schema.Types.ObjectId, ref:'User', required:true},
    rating: {type: Number, min:0, max:10, required: true, default: 7},
    review: {type:String, max:500},
    date: {type: Date, required: true}
});

module.exports = mongoose.model('ChannelRating', ChannelRatingSchema);