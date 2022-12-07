const express = require('express');
const router  = express.Router();
const bodyParser = require('body-parser');
const request = require('request');

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

router.post('/',jsonParser, (req,res) =>{
    // console.log(req.body.url)
    // res.redirect(req.body.url)
    //request images and send them to front-end
    request({
        url: req.body.url,
        encoding: null
      }, 
      (err, resp, buffer) => {
        if (!err && resp.statusCode === 200){
        const contentType=resp.caseless.dict['content-type'] 
        // console.log(contentType)
          res.set("Content-Type", contentType);
          res.send(resp.body);
        }
      });
})

module.exports = router;