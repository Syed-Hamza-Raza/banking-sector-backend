const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const mongoose = require("mongoose");
const emailService = require("../services/email.service")

async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, itempotencyKey } = req.body
    if (!fromAccount || !toAccount || !amount || !itempotencyKey) {
        return res.status(400).json({
            message: "Missing Values",
            status: false
        })
    }

    const fromUserAccount = await accountModel.findOne({ _id: fromAccount })
    const toUserAccount = await accountModel.findOne({ _id: toAccount })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount",
            status: false
        })
    }

    const isTransactionAlreadyExist = await transactionModel.findOne({
        itempotencyKey: itempotencyKey
    })

    if (isTransactionAlreadyExist) {
        if (isTransactionAlreadyExist.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExist
            });
        }

        if (isTransactionAlreadyExist.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is processing",
                transaction: isTransactionAlreadyExist
            });
        }

        if (isTransactionAlreadyExist.status === "FAILED") {
            return res.status(200).json({
                message: "Transaction has failed, please retry!",
                transaction: isTransactionAlreadyExist
            });
        }

        if (isTransactionAlreadyExist.status === "REVERSED") {
            return res.status(200).json({
                message: "Transaction has reversed, please retry!",
                transaction: isTransactionAlreadyExist
            });
        }
    }

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount !== "ACTIVE") {
        return res.status(400).json({
            message: "Account is not active.",
            status: false
        })
    }

    const balance = await fromUserAccount.getBalance();

    if (balance < amount) {
        return res.status(400).json({
            message: "Insufficient balance.",
            status: false
        })
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        itempotencyKey,
        status: "PENDING"
    }, { session })

    await ledgerModel.create({
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }, { session });

    await ledgerModel.create({
        account: fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }, { session });

    transaction.status = "COMPLETED";
    await transaction.save({ session })

    await session.commitTransaction();
    session.endSession();

    const updatedFromBalance = await fromUserAccount.getBalance();
    const updatedToBalance = await toUserAccount.getBalance();

    await emailService.sendTransactionEmail({
        email: req.user.email,
        userName: req.user.name,
        amount,
        type: "DEBIT",
        balance: updatedFromBalance,
        transactionId: transaction._id
    });

    await emailService.sendTransactionEmail({
        email: toUserAccount.email,
        userName: toUserAccount.name,
        amount,
        type: "CREDIT",
        balance: updatedToBalance,
        transactionId: transaction._id
    });

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction,
        status: true
    })
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, itempotencyKey } = req.body;

    if (!toAccount || !amount || !itempotencyKey) {
        return res.status(400).json({
            status: false,
            message: "toAccount, amount and itempotencyKey are required"
        });
    }

    if (amount <= 0) {
        return res.status(400).json({
            status: false,
            message: "Amount must be greater than zero"
        });
    }

    try {
        const existingTransaction = await transactionModel.findOne({
            itempotencyKey
        });

        if (existingTransaction) {
            return res.status(200).json({
                status: true,
                message: "Transaction already processed",
                transaction: existingTransaction
            });
        }

        const toUserAccount = await accountModel.findById(toAccount);

        if (!toUserAccount) {
            return res.status(404).json({
                status: false,
                message: "Receiver account does not exist"
            });
        }

        const fromUserAccount = await accountModel.findOne({
            user: req.user._id
        });

        if (!fromUserAccount) {
            return res.status(404).json({
                status: false,
                message: "System user account not found"
            });
        }

        const session = await mongoose.startSession();

        let transaction;

        try {
            session.startTransaction();
            
            transaction = await transactionModel.create([{
                fromAccount: fromUserAccount._id,
                toAccount: toUserAccount._id,
                amount,
                itempotencyKey,
                status: "PENDING"
            }], { session });

            const transactionId = transaction[0]._id;

            await ledgerModel.create([{
                account: fromUserAccount._id,
                amount: amount,
                transaction: transactionId,
                type: "DEBIT"
            }], { session });

            await ledgerModel.create([{
                account: toUserAccount._id,
                amount: amount,
                transaction: transactionId,
                type: "CREDIT"
            }], { session });

            await transactionModel.updateOne(
                { _id: transactionId },
                { status: "COMPLETED" },
                { session }
            );

            await session.commitTransaction();

            return res.status(201).json({
                status: true,
                message: "Initial fund transaction completed successfully",
                transaction: transaction[0]
            });

        } catch (error) {

            await session.abortTransaction();

            return res.status(500).json({
                status: false,
                message: "Transaction failed",
                error: error.message
            });

        } finally {
            session.endSession();
        }

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Server error",
            error: error.message
        });
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}
