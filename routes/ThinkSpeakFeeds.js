const express = require("express");
const router = express.Router();
const Glucose = require("../models/Glucose");
const { predict } = require("../ai/model"); //only this

router.post("/blood-glucose", async (req, res) => {
    try {
        const { feeds } = req.body;

        if (!feeds || feeds.length === 0) {
            return res.json({ success: false, message: "No data" });
        }

        console.log("feeds", feeds)

        const existingEntries = await Glucose.find({}, { entry_id: 1 });
        const existingIds = new Set(existingEntries.map(e => e.entry_id));

        let newDataList = [];
        let latestGlucose = null;

        for (let feed of feeds) {
            const entry_id = feed.entry_id;

            if (existingIds.has(entry_id)) continue;

            const ir = Number(feed.field1);
            const red = Number(feed.field2);

            if (!ir || !red || ir === 0 || red === 0) continue;

            //ML prediction (auto train inside)
            const glucose = await predict(ir, red);
           

            latestGlucose = glucose; // ✅ store latest
            console.log("glucose", glucose)

            let status = "Normal";
            if (glucose < 70) status = "Low";
            else if (glucose > 180) status = "High";

            newDataList.push({
                entry_id,
                ir,
                red,
                glucose,
                status
            });
        }

        if (newDataList.length > 0) {
            await Glucose.insertMany(newDataList);
        }

        res.json({
            success: true,
            message: `${newDataList.length} records saved(ML)`,
            glucose:latestGlucose
        });

    } 
    catch (err) {
    console.log("Error:", err);
    res.json({ success: false });
}
});

module.exports = router;