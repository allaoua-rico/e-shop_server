const mongoose= require('mongoose');

const categorySchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
  },
  { collection: 'productscategories' }
  );
  //for express
module.exports =mongoose.models.ProductCategory || mongoose.model('ProductCategory', categorySchema,'productscategories');