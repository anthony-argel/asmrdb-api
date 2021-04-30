const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserRatingSchema = new Schema({
    raterid: {type: Schema.Types.ObjectId, ref:'User', required:true},
    ratedid: {type: Schema.Types.ObjectId, ref:'User', required:true},
    rating: {type: Number, min:-1, max:1, enum:[-1,1], required: true},
    date: {type: Date, required: true}
});

module.exports = mongoose.model('UserRating', UserRatingSchema);