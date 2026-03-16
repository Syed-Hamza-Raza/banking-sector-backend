const express = require('express')
const authRouter = require("./routes/auth.route")
const accountRouter = require("./routes/account.route")
const transactionRouter = require("./routes/transaction.route")
const cookieParser = require("cookie-parser")
const app = express()

app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRouter)
app.use("/api/account", accountRouter)
app.use("/api/transactions", transactionRouter)

module.exports = app