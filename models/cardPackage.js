import mongoose from "mongoose";
import normalize from "normalize-mongoose";

const packageSchema = new mongoose.Schema({
    packageName: {
        type:String,    
    },
    amount: {
        type: Number
    }
});

packageSchema.plugin(normalize);

const TheamPackage = mongoose.model("theamPackage",packageSchema);

export default TheamPackage;