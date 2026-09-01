const supabase = require('../config/db');

// Create CBT Exam/Test Shell
const createExam = async (req, res) => {
  const { title, subject, class_level, duration_minutes, type } = req.body;

  if (!title || !subject || !class_level) {
    return res.status(400).json({ error: 'Title, subject, and class level are required.' });
  }

  try {
    const { data: exam, error } = await supabase
      .from('exams')
      .insert([{ title, subject, class_level, duration_minutes, type }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ success: true, exam });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create exam shell.' });
  }
};

// Add Questions to an Existing Exam
const addQuestions = async (req, res) => {
  const { exam_id, questions } = req.body;

  if (!exam_id || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Exam ID and questions array are required.' });
  }

  try {
    const questionsToInsert = questions.map(q => ({
      exam_id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option
    }));

    const { data, error } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ success: true, questions: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to insert exam questions.' });
  }
};

// Get Available Exams for a Specific Class Level
const getExamsByClass = async (req, res) => {
  const { classLevel } = req.params;

  try {
    const { data: exams, error } = await supabase
      .from('exams')
      .select('*')
      .eq('class_level', classLevel);

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, exams });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch class examinations.' });
  }
};

// Submit Completed Exam Answers
const submitExam = async (req, res) => {
  const { exam_id, student_id, answers } = req.body;

  if (!exam_id || !student_id) {
    return res.status(400).json({ error: 'Exam ID and Student ID are required.' });
  }

  try {
    return res.status(200).json({ success: true, message: 'Assessment submitted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit examination.' });
  }
};

module.exports = {
  createExam,
  addQuestions,
  getExamsByClass,
  submitExam
};