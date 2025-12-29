const categoryController = require("../controllers/categoryController");
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
router
    .route('/')
    .post(authController.protect, categoryController.createCategory);
    
router
    .route('/')
    .get(authController.protect, categoryController.getAllCategories);
router
    .route('/:id')
    .patch(authController.protect, categoryController.updateCategory)
    .delete(authController.protect, categoryController.deleteCategory);
module.exports = router;
