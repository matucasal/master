const express = require('express');
const router = require('express-promise-router')();
const QuestionController = require('../controllers/questions');

router.route('/postQuestion')
  .post(QuestionController.postQuestion);

module.exports = router;

