const supabase = require('../config/db');

// Get questions for a specific assessment
const getExamQuestions = async (req, res) => {
  const { examId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Fetch target assessment details
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select('id, type, title')
      .eq('id', examId)
      .maybeSingle();

    if (examErr || !exam) {
      return res.status(404).json({ error: 'Assessment record not found.' });
    }

    // 2. Enforce fee restriction for terminal examinations
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

    // 3. Retrieve assessment questions
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

// Submit completed assessment answers
const submitExam = async (req, res) => {
  const { exam_id, student_id, answers } = req.body;

  try {
    // Check fee status on submission as a secondary guardrail
    const { data: exam } = await supabase
      .from('exams')
      .select('type')
      .eq('id', exam_id)
      .single();

    if (exam && exam.type === 'exam') {
      const { data: student } = await supabase
        .from('students')
        .select('fee_status')
        .eq('id', student_id)
        .single();

      if (!student || student.fee_status !== 'PAID') {
        return res.status(403).json({ error: 'Cannot submit terminal examination without verified fee payment.' });
      }
    }

    // Process evaluation logic...
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

module.exports = { getExamQuestions, submitExam };