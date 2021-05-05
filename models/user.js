const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {type: String, required: true, maxlength:30},
    password: {type: String, required: true},
    email: {type: String, required: true},
    joindate: {type: Date, required: true},
    admin: {type: Boolean, required: true, default: false}
});

module.exports = mongoose.model('User', UserSchema);