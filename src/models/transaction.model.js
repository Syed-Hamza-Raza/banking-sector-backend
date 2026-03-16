const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transaction must be associated with a account."],
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transaction must be associated with a account."],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
            message: "Status should either be PENDING, COMPLETED, FAILED, REVERSED"
        },
        default: "PENDING"
    },
    amount: {
        type: Number,
        required: [true, "Amount is required for creating a transaction"],
        min: [1, "Transaction cannot be 0 or less than zero"]
    },
    itempotencyKey: {
        type: String,
        required: [true, "Itempotency key is required for creating a transaction"],
        index: true,
        unique: true
    }
}, {
    timestamps: true
})

const transactionModel = mongoose.model("transaction", transactionSchema)
module.exports = transactionModel