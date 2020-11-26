const express = require('express');
const router = require('express-promise-router')();
const categoryController = require('../controllers/categories');


router.route('/getCategory')
  .get(categoryController.getCategory);

router.route('/postCategory')
  .post(categoryController.postCategory);

module.exports = router;