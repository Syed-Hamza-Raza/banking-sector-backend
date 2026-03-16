const userModel = require("../models/user.model")
const emailService = require("../services/email.service")
const jwt = require("jsonwebtoken")

async function userRegisterController(req, res) {
    const { email, password, name } = req.body

    const isExists = await userModel.findOne({
        email: email
    });

    if (isExists) {
        return res.status(401).json({
            message: "User already exist with email",
            status: false
        })
    }

    const user = await userModel.create({
        email, password, name
    })

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
    res.cookie("token", token)
    res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    });

    await emailService.sendRegisterEmail(email, name)
}

async function userLoginController(req, res) {
    const { email, password } = req.body

    const user = await userModel.findOne({
        email: email
    }).select("+password")

    if (!user) {
        return res.status(401).json({ message: "User not found", status: false })
    }

    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
        return res.status(401).json({ message: "Password incorrect", status: false })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
    res.cookie("token", token)
    res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    });
}

const userLogoutController = async (req, res) => {
    try {
        res.cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true,
        });

        res.status(200).json({
            status: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Logout failed",
            error: error.message
        });
    }
};

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
}