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
        enum: ['success', 'failure'],
    },
    gateway: {
        type: String,
        required: true,
        enum: ['zrinpal', 'other'],
    },
    paymentDate: {
        type: Date,
        default: Date.now,
    }


},
{timestamps: true}
)
module.exports = mongoose.model("Transaction", transactionSchema);