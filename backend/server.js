const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/examdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected');

  // Remove legacy examCode unique index if it still exists,
  // because the current flow uses groupId for grouping and doesn't require examCode.
  try {
    const examCollection = mongoose.connection.collection('exams');
    const indexes = await examCollection.indexes();
    if (indexes.some((index) => index.name === 'examCode_1')) {
      console.log('Dropping legacy examCode_1 index');
      await examCollection.dropIndex('examCode_1');
    }
  } catch (indexErr) {
    console.log('Index cleanup skipped or failed:', indexErr.message);
  }
})
.catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/educators', require('./routes/educators'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));