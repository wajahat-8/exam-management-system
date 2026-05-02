const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, course, profilePicture } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { name, course, profilePicture }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEnrolledExams = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    const query = { $or: [{ enrolledStudents: req.user.id }] };

    if (student.course) query.$or.push({ assignedCourses: student.course });
    if (student.department) query.$or.push({ assignedDepartments: student.department });

    const exams = await Exam.find(query).populate('educator', 'name');
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.joinExam = async (req, res) => {
  const { examCode } = req.body;
  try {
    const groupId = examCode;
    const existingAssigned = await Exam.findOne({ groupId, enrolledStudents: req.user.id });
    if (existingAssigned) {
      return res.json(existingAssigned);
    }

    const exams = await Exam.find({ groupId });
    if (!exams.length) {
      return res.status(404).json({ message: 'Exam group not found with that code' });
    }

    const selected = exams[Math.floor(Math.random() * exams.length)];
    selected.enrolledStudents.push(req.user.id);
    await selected.save();
    res.json(selected);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user.id }).populate('exam', 'title scheduledDate');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getExamForTaking = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('questions');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    if (!exam.enrolledStudents.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not enrolled in this exam' });
    }
    // Check if exam is scheduled
    const now = new Date();
    const scheduled = new Date(exam.scheduledDate);
    if (now < scheduled) {
      return res.status(400).json({ message: 'Exam not yet started' });
    }
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitExam = async (req, res) => {
  const { answers } = req.body;
  try {
    const exam = await Exam.findById(req.params.id).populate('questions');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    if (!exam.enrolledStudents.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not enrolled in this exam' });
    }

    // Calculate score
    let score = 0;
    const totalQuestions = exam.questions.length;
    exam.questions.forEach(q => {
      if (answers[q._id] === q.correctAnswer) {
        score++;
      }
    });

    // Save result
    const result = new Result({
      student: req.user.id,
      exam: req.params.id,
      answers,
      score,
      totalQuestions,
      submittedAt: new Date(),
    });
    await result.save();

    res.json({ message: 'Exam submitted', score, totalQuestions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};