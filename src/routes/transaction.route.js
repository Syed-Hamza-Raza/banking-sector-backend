const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const router = express.Router();
const transactionController = require("../controllers/transaction.controller")

router.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)
router.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = router