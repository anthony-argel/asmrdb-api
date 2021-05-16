const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {type: String, required: true, minLength: 3, maxLength:30},
    password: {type: String, required: true, minLength: 3, maxLength:2000},
    email: {type: String, required: true, minLength:3, maxLength:50},
    joindate: {type: Date, required: true},
    admin: {type: Boolean, required: true, default: false}
});

module.exports = mongoose.model('User', UserSchema);