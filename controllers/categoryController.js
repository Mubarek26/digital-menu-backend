const catchAsync = require("../utils/catchAsync");
const appError = require('../utils/appError');
const Category = require('../models/CategoryModel');
const menuItems = require("../models/MenuItem");
exports.createCategory = catchAsync(async (req, res, next) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return next(new appError("Name and description are required", 400));
    }

    const newCategory = await Category.create({
        name,
        description
    });

    res.status(201).json({
        status: "success",
        message: "Category created successfully",
        data: {
            category: newCategory
        }
    });
})
exports.getAllCategories = catchAsync(async (req, res, next) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: "menuitems", // must match MongoDB collection name
          localField: "name", // category name
          foreignField: "category", // field in MenuItem schema
          as: "items"
        }
      },
      {
        $addFields: {
          itemCount: { $size: "$items" } // number of items in this category
        }
      },
      {
        $project: {
          items: 0 // hide full items array, only keep count
        }
      }
    ]);

    if (!categories || categories.length === 0) {
      return next(new appError("No categories found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "All categories retrieved successfully",
      data: { categories }
    });
  } catch (error) {
    return next(new appError("Error retrieving categories", 500));
  }
});


exports.updateCategory = catchAsync(async (req, res, next) => {
    {
        const { name, description } = req.body;

        if (!name || !description) {
            return next(new appError("Name and description are required", 400));
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description },
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return next(new appError("Category not found", 404));
        }

        res.status(200).json({
            status: "success",
            message: "Category updated successfully",
            data: {
                category: updatedCategory
            }
        });
    }
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
        return next(new appError("Category not found", 404));
    }

    res.status(204).json({
        status: "success",
        message: "Category deleted successfully",
        data: null
    });
});
