const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChannelSchema = new Schema({
    name: { type: String, required: true, minLength: 1, maxLength: 20 },
    imageurl: { type: String },
    instagram: { type: String },
    startdate: { type: Date },
    enddate: { type: Date },
    lastytrefresh: { type: Date, required: true },
    viewcount: { type: Number, required: true },
    videocount: { type: Number, required: true },
    // controlled by user
    aliases: { type: String, minLength: 0, maxLength: 400 },
    status: {
        type: String,
        enum: ["Active", "Inactive", "Unknown"],
        default: "Active",
    },
    youtube: { type: String, maxLength: 100, match: /^[a-zA-Z0-9_-\s]*$/g },
    niconico: { type: String, maxLength: 100, match: /^[a-zA-Z0-9_-\s]*$/g },
    twitter: { type: String, maxLength: 100, match: /^[a-zA-Z0-9_-\s]*$/g },
    tags: [
        {
            name: { type: String, required: true },
            _id: { type: Schema.Types.ObjectId, ref: "Tag", required: true },
        },
    ],
});

module.exports = mongoose.model("Channel", ChannelSchema);
