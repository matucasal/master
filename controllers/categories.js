const Category = require('../models/category');

module.exports = {

    getCategory: async (req, res, next) => {
        
        res.status(200).json( "Category" );
    },

    postCategory: async (req, res, next) => {

        let category = new Category({
            "categoryName": req.body.categoryName
        })

        category.save(function (err) {
            if (err) {
                return next(err);
            }
            res.status(200).json(req.body);
        })
        
        
    }

}