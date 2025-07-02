const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: String,
  password: String, // TODO: hash
});

module.exports = mongoose.model('User', UserSchema);
