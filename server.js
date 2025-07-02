const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Finance API is running');
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});

mongoose.connect('mongodb://localhost:27017/finance-manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('🟢 Connected to MongoDB');
}).catch((err) => {
  console.error('🔴 MongoDB connection error:', err);
});
