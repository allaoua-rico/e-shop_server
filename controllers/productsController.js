const Product = require("../models/product");
const ProductCategory = require("../models/category");
const path = require("path");
const DatauriParser = require("datauri/parser");
const cloudinary2 = require("cloudinary");

// this is a cutumised cloudinary in folder cloudinary
const cloudinary = require("../backLib/cloudinary.js");
const catchAsync = require("../backLib/catchAsync");

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const { page, sort, cat } = req.query;
  const viewLimit = req.query.viewLimit;
  let catId;

  if (cat) {
    catId = await ProductCategory.findOne({ name: cat }, { _id: 1 })
      .lean()
      .catch((err) => console.log(err));
  }
  const query = catId ? { category_id: catId } : {};
  let querySort;

  if (sort === "recent") querySort = { _id: -1 };
  if (sort === "price") querySort = { price: -1 };
  if (sort === "alphabetical") querySort = { title: 1 };

  const results = await Product.find(query)
    .lean()
    .sort(querySort)
    .skip(page)
    .limit(viewLimit);

  res.json(results);
});
exports.addProduct = catchAsync(async (req, res, next) => {
  //on the guide he imported datauti, he should have imported datauriParser, read the doc
  const dUri = new DatauriParser();
  
  // transform the buffer to a string
  const dataUri = (file) =>
    dUri.format(path.extname(file.originalname).toString(), file.buffer);

  const imgUrlArray = [];
  
  for (var i = 0; i < req.files.length; i++) {
    imgUrlArray.push(dataUri(req.files[i]).content);
  }

  const uploader = async (path) => await cloudinary.uploads(path, `e-shop`);
  let newArray = [];
  for (const path of imgUrlArray) {
    const newPath = await uploader(path);
    newArray.push(newPath.url);
  }
  //search for category or add the one provided
  let catId;
  let instance;
  //check if category is defined
  let str = req.body.category;
  console.log(str.replace(/\s/g, "").length);
  if (str.replace(/\s/g, "").length) {
    instance = await ProductCategory.findOne(
      { name: req.body.category },
      { _id: 1 }
    )
      .lean()
      .catch((err) => console.log(err));
    if (instance !== null) {
      catId = instance._id;
    }
    if (instance === null) {
      const newCategory = new ProductCategory({
        name: req.body.category,
      });
      instance = await newCategory.save();
      catId = instance._id;
    }
  } else {
    catId = undefined;
  }
  const product = new Product({
    title: req.body.title,
    price: req.body.price,
    imagesArray: newArray,
    desc: req.body.desc,
    category_id: catId,
    brand: req.body.brand,
  });
  const { _id } = await product.save();
  
  _id && res.json({ msg: "Product Added successfully", _id });
});
exports.updateProduct = catchAsync(async (req, res, next) => {
  //on the guide he imported datauti, he should have imported datauriParser, read the doc
  const dUri = new DatauriParser();

  // transform the buffer to a string
  const dataUri = (file) =>
    dUri.format(path.extname(file.originalname).toString(), file.buffer);

  const imgUrlArray = [];

  for (var i = 0; i < req.files.length; i++) {
    imgUrlArray.push(dataUri(req.files[i]).content);
  }
  const { _id, imagesArray } = await Product.findOne({ _id: req.body.id })
    .lean()
    .exec();
  const uploader = async (path) => await cloudinary.uploads(path, `e-shop`);
  let newArray = [];
  imagesArray.map((image) => {
    const url = image.split("e-shop/")[1].split(".")[0];
    console.log(url);
    cloudinary2.api.delete_resources_by_prefix(`e-shop/${url}`);
  });
  //
  for (const path of imgUrlArray) {
    const newPath = await uploader(path);
    newArray.push(newPath.url);
  }
  //search for category or add the one provided
  let catId;
  let instance;
  //check if category is defined
  let str = req.body.category;

  if (str.replace(/\s/g, "").length) {
    instance = await ProductCategory.findOne(
      { name: req.body.category },
      { _id: 1 }
    )
      .lean()
      .catch((err) => console.log(err));
    if (instance !== null) {
      catId = instance._id;
    }
    if (instance === null) {
      const newCategory = new ProductCategory({
        name: req.body.category,
      });
      instance = await newCategory.save();
      catId = instance._id;
    }
  } else {
    catId = undefined;
  }

  await Product.updateOne(
    { _id: req.body.id },
    {
      $set: {
        title: req.body.title,
        price: req.body.price,
        imagesArray: newArray,
        desc: req.body.desc,
        category_id: catId,
        brand: req.body.brand,
      },
    }
  );
  res.json({ _id });
});
exports.removeProduct = catchAsync(async (req, res, next) => {
  const { imagesArray } = await Product.findOne({ _id: req.body.product_id })
    .lean()
    .exec();
  imagesArray.map((image) => {
    const url = image.split("e-shop/")[1].split(".")[0];
    console.log(url);
    cloudinary2.api.delete_resources_by_prefix(`e-shop/${url}`);
  });
  await Product.deleteOne({ _id: req.body.product_id });
  res.json("Product deleted");
});
