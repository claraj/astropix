var express = require('express');
var router = express.Router();

/* GET favorites listing. */
router.get('/', function(req, res, next) {
  res.send('Todo');
});

module.exports = router;
