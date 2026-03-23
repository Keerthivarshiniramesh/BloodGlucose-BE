const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    id: { type: Number, required: true, trim: true },
    patientId: { type: String, trim: true },
    accuracy: { type: String, trim: true }
})

const userModel = mongoose.model('neuro-cognitive', userSchema)

module.exports = userModel