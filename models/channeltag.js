const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChannelTagSchema = new Schema({
    channelid: {type: Schema.Types.ObjectId, ref: 'Channel', required: true},
    tagid: {type: Schema.Types.ObjectId, ref: 'Tag', required: true}
});

module.exports = mongoose.model('ChannelTag', ChannelTagSchema);