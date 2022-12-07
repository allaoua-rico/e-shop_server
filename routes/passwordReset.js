const  User  = require("../models/user");
const Token = require("../models/token");
const sendEmail = require("../backLib/sendEmail");
const crypto = require("crypto");
// const Joi = require("joi");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const bcrypt =require( "bcrypt");

//multer memory config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/", upload.fields([]), async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user)
            return res.status(400).json({msg:"user with given email doesn't exist"});

        let token = await Token.findOne({ userId: user._id });
        if (!token) {

            token = await new Token({
                userId: user._id,
                token: crypto.randomBytes(32).toString("hex"),
            }).save();
        }

        const link = `${process.env.BASE_URL}/passwordReset?id=${user._id}&t=${token.token}`;
        await sendEmail(user.email, "Password reset", link);

        res.json({msg:"password reset link sent to your email account"});
    } catch (error) {
        res.send("An error occured");
        console.log(error);
    }
});

router.post("/:userId/:token", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(400).send("Invalid link or expired.");
        const token = await Token.findOne({
            userId: user._id,
            token: req.params.token,
        });
        if (!token) return res.status(400).send("Invalid link or expired.");

        const saltRounds = 10;
        const hash = bcrypt.hashSync(req.body.password, saltRounds);
        user.password = hash;

        await user.save();
        await token.delete();
        res.json({msg:"password reset sucessfully."});
    } catch (error) {
        res.send("An error occured");
        console.log(error);
    }
});

module.exports = router;