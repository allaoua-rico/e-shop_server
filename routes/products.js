const express = require("express");
const { search, upload } = require("../backLib/middlewares");
const {
  getAllProducts,
  addProduct,
  updateProduct,
  removeProduct,
} = require("../controllers/productsController");
const { verifyJWT, restrictTo } = require("../controllers/authController");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const router = express.Router();

router
  .get("/", search, getAllProducts)
  .post(
    "/",
    verifyJWT,
    restrictTo("admin"),
    upload.array("images"),
    /* req.body is only availble after upload(multer) middleware,
    so data sanitization is only possilble here*/
    mongoSanitize(),
    xss(),
    addProduct
  )
  .put(
    "/",
    verifyJWT,
    restrictTo("admin"),
    upload.array("images"),
    mongoSanitize(),
    xss(),
    updateProduct
  )
  .delete(
    "/",
    verifyJWT,
    restrictTo("admin"),
    upload.fields([]),
    mongoSanitize(),
    xss(),
    removeProduct
  );

module.exports = router;
