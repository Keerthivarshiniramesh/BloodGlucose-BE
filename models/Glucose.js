const mongoose = require("mongoose");

const glucoseSchema = new mongoose.Schema({
    entry_id: Number,
    ir: Number,
    red: Number,
    glucose: Number,
    status: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Glucose", glucoseSchema);   