const tf = require("@tensorflow/tfjs");
const xlsx = require("xlsx");

let model = null;
let scaler = null;

// ✅ Load Excel Data
function loadExcelData(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    return jsonData.map(row => ({
        ir: Number(row.IR),
        red: Number(row.RED),
      
        glucose: Number(row.GLUCOSE)
    })).filter(d =>
        !isNaN(d.ir) &&
        !isNaN(d.red) &&
        !isNaN(d.glucose)
    );
}

// ✅ Train Model (ONLY FROM EXCEL)
async function trainModel() {
    try {
        console.log("📊 Loading Excel dataset...");

        const data = loadExcelData("BloodGlucoseTrainedData.xlsx");

        if (!data || data.length < 20) {
            console.log("❌ Not enough Excel data");
            return;
        }

        console.log(`✅ Loaded ${data.length} rows`);

        // 🔥 Fixed scaling (important)
        scaler = {
            irMax: 100000,
            redMax: 100000,
            glucoseMax: 300
        };

        // ✅ Feature Engineering
        const inputs = data.map(d => {
            const ratio = d.red / d.ir;
            return [
                d.ir / scaler.irMax,
                d.red / scaler.redMax,
                ratio,
                
            ];
        });

        const labels = data.map(d => [
            d.glucose / scaler.glucoseMax
        ]);

        const xs = tf.tensor2d(inputs);
        const ys = tf.tensor2d(labels);

        // 🔥 Better Neural Network
        model = tf.sequential();
        model.add(tf.layers.dense({ units: 32, inputShape: [3], activation: "relu" }));
        model.add(tf.layers.dense({ units: 16, activation: "relu" }));
        model.add(tf.layers.dense({ units: 1 }));

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: "meanSquaredError"
        });

        console.log("⚡ Training model...");

        await model.fit(xs, ys, {
            epochs: 100,
            batchSize: 16,
            shuffle: true
        });

        console.log("✅ Model trained successfully from Excel");

    } catch (err) {
        console.log("❌ Training Error:", err);
    }
}

// ✅ Predict Function
async function predict(ir, red) {
    try {
        if (!model) {
            console.log("⚡ Model not loaded, training...");
            await trainModel();
        }

        if (!model || !scaler) return null;

        const ratio = red / ir;

        const input = tf.tensor2d([[
            ir / scaler.irMax,
            red / scaler.redMax,
            ratio,
            
        ]]);

        const output = model.predict(input);
        const value = output.dataSync()[0];

        let glucose = value * scaler.glucoseMax;

        // ✅ Safety check
        if (isNaN(glucose) || !isFinite(glucose)) {
            return null;
        }

        // ✅ Clamp realistic range
        glucose = Math.max(60, Math.min(250, glucose));

        return glucose;

    } catch (err) {
        console.log("❌ Prediction Error:", err);
        return null;
    }
}

module.exports = {
    trainModel,
    predict
};