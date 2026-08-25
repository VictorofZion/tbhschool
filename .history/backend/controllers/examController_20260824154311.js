const supabase = require('../config/db');

// 1. Teacher/Admin: Create a new CBT Assessment (Test or Exam)
const createExam = async (req, res) => {
  try {
    const { title, subject, class_level, duration_minutes, type } = req.body;

    if (!title || !subject || !class_level || !duration_minutes) {
      return res.status(400).json({ error: "Title, subject, class level, and duration are required." });
    }

    const assessmentType = type === 'test' ? 'test' : 'exam';

    const { data: exam, error } = await supabase
      .from('exams')
      .insert([{ title, subject, class_level, duration_minutes, type: assessmentType }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: `${assessmentType.toUpperCase()} created successfully!`, exam });
  } catch (err) {
    res.status(500).json({ error: "Server error creating CBT assessment." });
  }
};

// 2. Teacher/Admin: Add questions to an assessment
const addQuestions = async (req, res) => {
  try {
    const { exam_id, questions } = req.body;

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

// 3. Student: Get active assessments for their class level
const getExamsByClass = async (req, res) => {
  try {
    const { classLevel } = req.params;

    const { data: exams, error } = await supabase
      .from('exams')
      .select('id, title, subject, class_level, duration_minutes, type, created_at')
      .eq('class_level', classLevel);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ exams });
  } catch (err) {
    res.status(500).json({ error: "Server error fetching assessments." });
  }
};

// 4. Student: Fetch assessment questions (without answers)
const getExamQuestions = async (req, res) => {
  try {
    const { examId } = req.params;

    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d')
      .eq('exam_id', examId);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ questions });
  } catch (err) {
    res.status(500).json({ error: "Server error fetching assessment questions." });
  }
};

// 5. Student: Submit CBT Answers, Auto-Grade, & Automatically Record on Dashboard Results
const submitExam = async (req, res) => {
  try {
    const { exam_id, student_id, answers } = req.body;

    if (!exam_id || !student_id || !answers) {
      return res.status(400).json({ error: "Exam ID, Student ID, and answers map are required." });
    }

    // Fetch assessment type and metadata
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select('subject, title, type')
      .eq('id', exam_id)
      .single();

    if (examErr || !exam) return res.status(400).json({ error: "Assessment details not found." });

    // Fetch master questions
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, correct_option')
      .eq('exam_id', exam_id);

    if (error || !questions) return res.status(400).json({ error: "Assessment questions not found." });

    // Grade test
    let rawScore = 0;
    const total_questions = questions.length;

    questions.forEach(q => {
      if (answers[q.id] && answers[q.id].toUpperCase() === q.correct_option) {
        rawScore += 1;
      }
    });

    const isTest = exam.type === 'test';
    const maxMarks = isTest ? 40 : 60;
    const scaledScore = total_questions > 0 ? ((rawScore / total_questions) * maxMarks).toFixed(2) : 0;

    // Save attempt log
    await supabase
      .from('student_exam_attempts')
      .insert([{ exam_id, student_id, score: rawScore, total_questions }]);

    // Check if an existing result record exists for this student and subject
    const { data: existingResult } = await supabase
      .from('results')
      .select('id, test_score, exam_score')
      .eq('student_id', student_id)
      .eq('subject', exam.subject)
      .single();

    if (existingResult) {
      // Update existing subject entry
      const updatePayload = isTest ? { test_score: scaledScore } : { exam_score: scaledScore };
      await supabase
        .from('results')
        .update(updatePayload)
        .eq('id', existingResult.id);
    } else {
      // Insert new result entry
      const insertPayload = {
        student_id,
        subject: exam.subject,
        test_score: isTest ? scaledScore : 0,
        exam_score: isTest ? 0 : scaledScore,
        term: '1st Term',
        session: '2026/2027'
      };
      await supabase.from('results').insert([insertPayload]);
    }

    res.status(200).json({
      message: `${isTest ? 'CBT Test' : 'CBT Exam'} submitted and auto-recorded on dashboard!`,
      result: {
        score: rawScore,
        total_questions,
        scaledScore: `${scaledScore}/${maxMarks}`,
        percentage: ((rawScore / total_questions) * 100).toFixed(2) + "%"
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error submitting CBT assessment." });
  }
};

module.exports = {
  createExam,
  addQuestions,
  getExamsByClass,
  getExamQuestions,
  submitExam
};