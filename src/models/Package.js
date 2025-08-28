const mongoose = require('mongoose');
const packageSchema = new mongoose.Schema(
    {
      title: {type:String, required:true},
      description: {type:String, required:true},
      price: {type:Number, required:true},
      duration: {type:Number, required:true},
      category: {type:String, required:true},
      status: {type:String, required:true, enum: ['active', 'inactive'], default: 'active'},
    },
{timestamps: true},
)
module.exports = mongoose.model("Package", packageSchema);