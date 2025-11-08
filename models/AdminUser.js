const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Admin user must have a username'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Admin user must have a password'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false, // Exclude password from query results by default
    },
    email: {
        type: String,
        required: [true, 'Admin user must have an email'],
        unique: true,
    },
    role: {
        type: String,
        enum: ['admin', 'superadmin'],
        default: 'admin',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },


})

const AdminUser = mongoose.model('AdminUser', adminUserSchema);
module.exports = AdminUser;