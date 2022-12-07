const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "a title is required"] },
    price: { type: Number, required: [true, "a price is required"] },
    discountPrice: Number,
    imagesArray: [String],
    desc: String,
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductCategory",
      required:[true,'a category is required']
    },
    brand: String,
  },
  { collection: "products" }
);
module.exports =
  mongoose.models?.Product || mongoose.model("Product", productSchema);
