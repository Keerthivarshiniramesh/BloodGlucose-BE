const Express = require('express')
const CognitiveModel = require('../models/Cognitive')
const isAuths = require('../middleware/isAuth')

const CognitiveRouters = Express.Router()

CognitiveRouters.post('/accuracy', isAuths, async (req, res) => {
    try {
        const { patientId, accuracy } = req.body

        if (!patientId || !accuracy) {
            return res.send({ success: false, message: 'Please provide all details!' })
        }

        let Cognitive = await CognitiveModel.find({});
        let userId;
        if (Cognitive.length > 0) {
            let last_user = Cognitive.slice(-1)[0];
            userId = last_user.id + 1;
        } else {
            userId = 1
        }

        const newCognitive = new CognitiveModel({
            id: userId,
            patientId: patientId,
            accuracy: accuracy
        })

        if (!newCognitive)
            return res.send({ success: false, message: "Failed to stored the Cognitive Accuracy!" })

        return res.send({ success: true, message: "Cognitive Accuracy Stored Successfully!" })

    }
    catch (err) {
        console.log("Error in Accuracy :", err)
        return res.send({ success: false, message: 'Trouble in Store Accuracy! Please contact admin.' })
    }
})

CognitiveRouters.get('/fetch-accuracy/:id', isAuths, async (req, res) => {
    try {
        const patientId = req.params.id

        if (!patientId) {
            return res.send({ success: false, message: 'Id not fouund!' })
        }

        let Cognitive = await CognitiveModel.find({ patientId: patientId });


        if (!Cognitive)
            return res.send({ success: false, message: "Cognitive Accuracy is not found in that Patient!" })

        return res.send({ success: true, message: "Cognitive Accuracy Retrieve Successfully!", cognitive: Cognitive })

    }
    catch (err) {
        console.log("Error in Accuracy :", err)
        return res.send({ success: false, message: 'Trouble in Store Accuracy! Please contact admin.' })
    }
})

module.exports = CognitiveRouters