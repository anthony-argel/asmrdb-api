const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChannelSchema = new Schema({
    name: {type:String, required:true},
    aliases: {type:String},
    status: {type: String, enum:['Active', 'Inactive', 'Unknown'], default: 'Active'},
    imageurl: {type: String},
    youtube: {type: String},
    niconico: {type: String},
    twitter: {type: String},
    instagram: {type: String},
    startdate: {type:Date},
    enddate: {type: Date},
    lastytrefresh: {type:Date, required:true},
    viewcount: {type:Number, required: true},
    videocount: {type:Number, required: true},
    tags: [Schema.Types.ObjectId]
});

module.exports = mongoose.model('Channel', ChannelSchema);