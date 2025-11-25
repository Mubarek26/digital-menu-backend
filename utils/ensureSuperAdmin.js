const User = require('../models/UserModel');

async function ensureSuperAdmin() {
  try {
    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;
    const phoneNumber = process.env.PHONE_NUMBER;

    if (!email || !password || !phoneNumber) {
      console.warn('Super admin env vars missing; skipping seed.');
      return;
    }

    const existing = await User.findOne({ role: 'superadmin' });
    if (existing) {
      console.log('Super admin already exists.');
      return;
    }

    await User.create({
      name: 'Super Admin',
      email,
      password,
      passwordConfirm: password,
      phoneNumber: phoneNumber || '',
      role: 'superadmin',
      active: true,
    });

    console.log('Super admin created.');
  } catch (err) {
    console.error('Failed to ensure super admin:', err);
  }
}

module.exports = ensureSuperAdmin;
module.exports.ensureSuperAdmin = ensureSuperAdmin;