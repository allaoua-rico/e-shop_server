const multer = require("multer");
const Product = require("../models/product");

const storage = multer.memoryStorage();

exports.upload = multer({ storage: storage });

exports.search = (req, res, next) => {
  if (req.query.title) {
    try {
      const input = new RegExp(req.query.title, "i");
      Product.find({ title: input }, { title: 1 }, (err, docs) => {
        if (err) return res.json({ msg: "An Error Occured" });
        res.json(docs);
      });
    } catch (error) {
      console.log(error);
    }
  } else {
    next();
  }
};

