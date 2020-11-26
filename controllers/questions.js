const Question_arte = require('../models/question_arte');
const Question_ciencia = require('../models/question_ciencia');
const Question_deportes = require('../models/question_deportes');
const Question_entretenimiento = require('../models/question_entretenimiento');
const Question_geografia = require('../models/question_geografia');
const Question_historia = require('../models/question_historia');

module.exports = {
  postQuestion: async (req, res, next) => {
    var { level, sublevel, question, option_1, option_2, option_3, answer_ok } = req.body;
    switch (req.body.category) {
      case 'Arte':
        let arte = new Question_arte({
          "level": level,
          "sublevel": sublevel,
          "question": question,
          "option_1": option_1,
          "option_2": option_2,
          "option_3": option_3,
          "answer_ok": answer_ok
         })
        arte.save().then(item => {
          res.send("item saved to database");
          })
          .catch(err => {
          res.status(400).send("unable to save to database");
          });
      break;
      case 'Ciencia':
        let ciencia = new Question_ciencia({
          "level": level,
          "sublevel": sublevel,
          "question": question,
          "option_1": option_1,
          "option_2": option_2,
          "option_3": option_3,
          "answer_ok": answer_ok
        })
        ciencia.save().then(item => {
          res.send("item saved to database");
          })
          .catch(err => {
          res.status(400).send("unable to save to database");
          });
      break;
      case 'Deportes':
        let deportes = new Question_deportes({
          "level": level,
          "sublevel": sublevel,
          "question": question,
          "option_1": option_1,
          "option_2": option_2,
          "option_3": option_3,
          "answer_ok": answer_ok
        })
        deportes.save().then(item => {
          res.send("item saved to database");
          })
          .catch(err => {
          res.status(400).send("unable to save to database");
          });
      break; 
      case 'Entretenimiento':
        let entretenimiento = new Question_entretenimiento({
          "level": level,
          "sublevel": sublevel,
          "question": question,
          "option_1": option_1,
          "option_2": option_2,
          "option_3": option_3,
          "answer_ok": answer_ok
        })
        entretenimiento.save().then(item => {
          res.send("item saved to database");
          })
          .catch(err => {
          res.status(400).send("unable to save to database");
          });
      break; 
      case 'Geografia':
        let geografia = new Question_geografia({
          "level": level,
          "sublevel": sublevel,
          "question": question,
          "option_1": option_1,
          "option_2": option_2,
          "option_3": option_3,
          "answer_ok": answer_ok
        })
        geografia.save().then(item => {
          res.send("item saved to database");
          })
          .catch(err => {
          res.status(400).send("unable to save to database");
          });
      break; 
      case 'Historia':
        let historia = new Question_historia({
          "level": level,
          "sublevel": sublevel,
          "question": question,
          "option_1": option_1,
          "option_2": option_2,
          "option_3": option_3,
          "answer_ok": answer_ok
        })
        historia.save().then(item => {
          res.send("item saved to database");
          })
          .catch(err => {
          res.status(400).send("unable to save to database");
          });
      break;  
        
      default:
      break;
    }
  },
  /**
 * Function to get random question
 * @param category
 * @param level
 *  */
getQuestion(category, level, callback){
  switch (category) {
      case "Arte":
          Question_arte.aggregate().sample(1).exec(function (err, result){
              callback(result[0]);
          })
          break;
      case "Ciencia":
          Question_ciencia.aggregate().sample(1).exec( function (err, result){
              callback(result[0]);
          })
          break;
      case "Deportes":
          Question_deportes.aggregate().sample(1).exec( function (err, result){
              callback(result[0]);
          })
          break;
      case "Entretenimiento":
          Question_entretenimiento.aggregate().sample(1).exec( function (err, result){
              callback(result[0]);
          })
          break;
      case "Geografia":
          Question_geografia.aggregate().sample(1).exec( function (err, result){
              console.log("Geografia")
              callback(result[0]);
          })
          break;
      case "Historia":
          Question_historia.aggregate().sample(1).exec( function (err, result){
              callback(result[0]);
          })
          break;                
      default:
          break;
  }
}
}