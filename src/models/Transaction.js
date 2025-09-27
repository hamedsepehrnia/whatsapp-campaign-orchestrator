const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema({
    order:{
        type: mongoose.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    amount:{
        type: Number,
        required: true
    },
    status:{
        type: String,
        required: true,
        enum: ['pending', 'success', 'failure'],
    },
    gateway: {
        type: String,
        required: true,
        enum: ['zarinpal', 'mock', 'other'],
    },
    // Zarinpal specific fields
    authority: {
        type: String,
        sparse: true, // Allow multiple null values
    },
    refId: {
        type: String,
        sparse: true,
    },
    gatewayData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    paymentDate: {
        type: Date,
        default: Date.now,
    }
},
{timestamps: true}
)
module.exports = mongoose.model("Transaction", transactionSchema);