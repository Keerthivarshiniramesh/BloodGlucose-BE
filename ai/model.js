const tf = require("@tensorflow/tfjs");
const mongoose = require("mongoose");
const Glucose = require("../models/Glucose");

let model = null;
let scaler = null;

// 🔥 Train Model
async function trainModel() {
    const data = await Glucose.find();

    if (!data || data.length < 10) {
        console.log("❌ Not enough data to train");
        return;
    }

    // ✅ Find max values (for normalization)
    const irMax = Math.max(...data.map(d => d.ir));
    const redMax = Math.max(...data.map(d => d.red));
    const glucoseMax = Math.max(...data.map(d => d.glucose));

    scaler = { irMax, redMax, glucoseMax };

    // ✅ Normalize
    const inputs = data.map(d => [
        d.ir / irMax,
        d.red / redMax
    ]);

    const labels = data.map(d => [
        d.glucose / glucoseMax
    ]);

    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(labels);

    // 🔥 Model architecture
    const newModel = tf.sequential();
    newModel.add(tf.layers.dense({ units: 8, inputShape: [2], activation: "relu" }));
    newModel.add(tf.layers.dense({ units: 4, activation: "relu" }));
    newModel.add(tf.layers.dense({ units: 1 }));

    newModel.compile({
        optimizer: tf.train.adam(0.01),
        loss: "meanSquaredError"
    });

    console.log("Training model...");

    await newModel.fit(xs, ys, {
        epochs: 50,
        batchSize: 8,
        shuffle: true
    });

    model = newModel;

    console.log("✅ Model trained successfully");
}

// 🔥 Predict Function
async function predict(ir, red) {

    // ❗ If model not ready → train
    if (!model) {
        console.log("⚡ Model not found, training now...");
        await trainModel();
    }

    // ❗ If still no model → fallback
    if (!model || !scaler) {
        return (ir / red) * 100;
    }

    // ✅ Normalize input
    const irN = ir / scaler.irMax;
    const redN = red / scaler.redMax;

    const input = tf.tensor2d([[irN, redN]]);
    const output = model.predict(input);

    const predictedNormalized = output.dataSync()[0];

    // ✅ Denormalize
    const predictedGlucose = predictedNormalized * scaler.glucoseMax;

    return predictedGlucose;
}

// 🔥 Optional: Retrain manually
async function retrain() {
    await trainModel();
}

module.exports = {
    predict,
    trainModel,
    retrain
};  