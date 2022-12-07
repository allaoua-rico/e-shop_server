const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyJWT,
} = require("../controllers/authController");
const router = express.Router();
const { upload } = require("../backLib/middlewares");
const { updateMe, deleteMe } = require("../controllers/userController");

router.post("/signup", signup);
router.post("/login", login);

router.post(
  "/forgotPassword",
  upload.fields([]),
  mongoSanitize(),
  xss(),
  forgotPassword
);
router.patch(
  "/resetPassword/:token",
  upload.fields([]),
  mongoSanitize(),
  xss(),
  resetPassword
);

router.patch("/updateMyPassword", verifyJWT, updatePassword);

router.patch("/updateMe", verifyJWT, updateMe);
router.delete("/deleteMe", verifyJWT, deleteMe);

module.exports = router;
