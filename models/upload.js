const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UploadSchema = new Schema({
    name: {type: String, required: true},
    description: {type: String, required:true},
    channelid: {type: Schema.Types.ObjectId, ref: 'Channel', required: true},
    magnet: {type: String, required: true},
    authorid: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    date: {type: Date, required:true}
});

module.exports = mongoose.model('Upload', UploadSchema);