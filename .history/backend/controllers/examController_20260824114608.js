const supabase = require('../config/db');

// 1. Teacher/Admin: Create a new exam shell
const createExam = async (req, res) => {
  try {
    const { title, subject, class_level, duration_minutes } = req.body;

    if (!title || !subject || !class_level || !duration_minutes) {
      return res.status(400).json({ error: "All exam metadata fields are required." });
    }

    const { data: exam, error } = await supabase
      .from('exams')
      .insert([{ title, subject, class_level, duration_minutes }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Exam created successfully!", exam });
  } catch (err) {
    res.status(500).json({ error: "Server error creating exam." });
  }
};

// 2. Teacher/Admin: Add questions to an exam
const addQuestions = async (req, res) => {
  try {
    const { exam_id, questions } = req.body; // Array of question objects

    if (!exam_id || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Exam ID and a list of questions are required." });
    }

    const formattedQuestions = questions.map(q => ({
      exam_id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option.toUpperCase()
    }));

    const { data, error } = await supabase
      .from('questions')
      .insert(formattedQuestions)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Questions added successfully!", questions: data });
  } catch (err) {
    res.status(500).json({ error: "Server error adding questions." });
  }
};

// 3. Student: Get active exams for their class level
const getExamsByClass = async (req, res) => {
  try {
    const { classLevel } = req.params;

    const { data: exams, error } = await supabase
      .from('exams')
      .select('id, title, subject, class_level, duration_minutes, created_at')
      .eq('class_level', classLevel);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ exams });
  } catch (err) {
    res.status(500).json({ error: "Server error fetching exams." });
  }
};

// 4. Student: Get exam questions (without answers)
const getExamQuestions = async (req, res) => {
  try {
    const { examId } = req.params;

    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d') // Omit correct_option to prevent cheating
      .eq('exam_id', examId);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ questions });
  } catch (err) {
    res.status(500).json({ error: "Server error fetching exam questions." });
  }
};

// 5. Student: Submit CBT Exam Answers & Auto-Grade
const submitExam = async (req, res) => {
  try {
    const { exam_id, student_id, answers } = req.body; // answers = { "question_id": "A", ... }

    if (!exam_id || !student_id || !answers) {
      return res.status(400).json({ error: "Exam ID, Student ID, and answers map are required." });
    }

    // Fetch master questions with correct options
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, correct_option')
      .eq('exam_id', exam_id);

    if (error || !questions) return res.status(400).json({ error: "Exam questions not found." });

    // Calculate score
    let score = 0;
    const total_questions = questions.length;

    questions.forEach(q => {
      if (answers[q.id] && answers[q.id].toUpperCase() === q.correct_option) {
        score += 1;
      }
    });

    // Save attempt record
    const { data: attempt, error: attemptError } = await supabase
      .from('student_exam_attempts')
      .insert([{ exam_id, student_id, score, total_questions }])
      .select()
      .single();

    if (attemptError) return res.status(400).json({ error: attemptError.message });

    res.status(200).json({
      message: "Exam submitted and graded successfully!",
      result: {
        score,
        total_questions,
        percentage: ((score / total_questions) * 100).toFixed(2) + "%"
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error submitting exam." });
  }
};

module.exports = { createExam, addQuestions, getExamsByClass, getExamQuestions, submitExam };