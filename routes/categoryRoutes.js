const categoryController = require("../controllers/categoryController");
const express = require("express");
const router = express.Router();
router
    .route('/')
    .post(categoryController.createCategory);
    
router
    .route('/')
    .get(categoryController.getAllCategories);
router
    .route('/:id')
    .patch(categoryController.updateCategory)
    .delete(categoryController.deleteCategory);
module.exports = router;
