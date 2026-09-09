const supabase = require('../config/db');

// Create Exam Shell (Teachers & Admins)
const createExam = async (req, res) => {
  const { title, subject, class_level, duration_minutes, type } = req.body;

  try {
    const { data: exam, error } = await supabase
      .from('exams')
      .insert([{ 
        title, 
        subject, 
        class_level, 
        duration_minutes: parseInt(duration_minutes, 10), 
        type 
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ success: true, exam });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create assessment.' });
  }
};

// Add Question Items to Assessment
const addQuestions = async (req, res) => {
  const { exam_id, questions } = req.body;

  try {
    const formattedQuestions = (questions || []).map(q => ({
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
      .insert(formattedQuestions)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ success: true, questions: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add questions.' });
  }
};

// Fetch Available Assessments for a Class Level
const getExamsByClass = async (req, res) => {
  const { classLevel } = req.params;
  const userId = req.user.id;

  try {
    const { data: exams, error } = await supabase
      .from('exams')
      .select('*')
      .eq('class_level', classLevel);

    if (error) return res.status(400).json({ error: error.message });

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let completedExamIds = [];
    if (student) {
      const { data: submissions } = await supabase
        .from('exam_submissions')
        .select('exam_id')
        .eq('student_id', student.id);

      completedExamIds = (submissions || []).map(s => s.exam_id);
    }

    const examsWithStatus = (exams || []).map(e => ({
      ...e,
      is_completed: completedExamIds.includes(e.id)
    }));

    return res.status(200).json({ success: true, exams: examsWithStatus });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch class assessments.' });
  }
};

// Get Assessment Questions (Student Fee Guard Enforcement)
const getExamQuestions = async (req, res) => {
  const { examId } = req.params;
  const userId = req.user.id;

  try {
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select('id, type, title')
      .eq('id', examId)
      .maybeSingle();

    if (examErr || !exam) {
      return res.status(404).json({ error: 'Assessment record not found.' });
    }

    if (req.user.role === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('fee_status')
        .eq('user_id', userId)
        .maybeSingle();

      const isUnpaid = !student || student.fee_status !== 'PAID';

      if (exam.type === 'exam' && isUnpaid) {
        return res.status(403).json({
          error: 'Access Restricted: You must clear your school fee payment to sit for terminal examinations.'
        });
      }
    }

    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d')
      .eq('exam_id', examId);

    if (qErr) return res.status(400).json({ error: qErr.message });
    return res.status(200).json({ success: true, questions: questions || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch examination questions.' });
  }
};

// Submit Exam Answers & Evaluate Score
const submitExam = async (req, res) => {
  const { exam_id, student_id, answers } = req.body;

  try {
    const { data: exam } = await supabase
      .from('exams')
      .select('type')
      .eq('id', exam_id)
      .maybeSingle();

    if (exam && exam.type === 'exam') {
      const { data: student } = await supabase
        .from('students')
        .select('fee_status')
        .eq('id', student_id)
        .maybeSingle();

      if (!student || student.fee_status !== 'PAID') {
        return res.status(403).json({ error: 'Cannot submit terminal examination without verified fee payment.' });
      }
    }

    const { data: questions } = await supabase
      .from('questions')
      .select('id, correct_option')
      .eq('exam_id', exam_id);

    let score = 0;
    const answerKey = {};
    (questions || []).forEach(q => { answerKey[q.id] = q.correct_option; });

    (answers || []).forEach(a => {
      if (answerKey[a.question_id] && answerKey[a.question_id] === a.selected_option) {
        score += 1;
      }
    });

    const maxScore = (questions || []).length;

    await supabase.from('exam_submissions').insert([{
      exam_id,
      student_id,
      score,
      max_score: maxScore
    }]);

    return res.status(200).json({ success: true, score, maxScore });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process exam evaluation.' });
  }
};

module.exports = {
  createExam,
  addQuestions,
  getExamsByClass,
  getExamQuestions,
  submitExam
};