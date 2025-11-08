const mongoose = require('mongoose');
// const catchAsync = require('../utils/catchAsync');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Menu item must have a name'],
        // unique: true
    },
    description: {
        type: String,
        required: [true, 'Menu item must have a description']
    },
    price: {
        type: Number,
        required: [true, 'Menu item must have a price'],
        min: [0, 'Price must be a positive number']
    },
    category: {
        type: String,
        required: [true, 'Menu item must have a category'],
        //  enum: ['Starter', 'Main Course', 'Dessert', 'Drink', 'Appetizer'],
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    image: {
        type: String,
        default: 'default.jpg',

    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'Menu item must belong to a restaurant']
    }
    
})

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
module.exports = MenuItem;