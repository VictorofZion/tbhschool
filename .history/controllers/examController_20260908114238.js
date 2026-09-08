const supabase = require('../config/db');
const { normalizeClassLevel } = require('../utils/formatters');

// 1. Create CBT Exam/Test Shell
const createExam = async (req, res) => {
  const { title, subject, class_level, duration_minutes, type } = req.body;

  if (!title || !subject || !class_level) {
    return res.status(400).json({ error: 'Title, subject, and class level are required.' });
  }

  try {
    const normalizedClass = normalizeClassLevel(class_level);
    const { data: exam, error } = await supabase
      .from('exams')
      .insert([{ title, subject, class_level: normalizedClass, duration_minutes, type: type || 'test' }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ success: true, exam });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create exam shell.' });
  }
};

// 2. Add Questions to an Existing Exam
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

// 3. Get Available Exams for a Specific Class Level
const getExamsByClass = async (req, res) => {
  const { classLevel } = req.params;
  const studentId = req.user?.student_id || req.user?.id;

  try {
    const targetClass = normalizeClassLevel(classLevel);
    const { data: exams, error } = await supabase
      .from('exams')
      .select('*')
      .eq('class_level', targetClass);

    if (error) return res.status(400).json({ error: error.message });

    // Fetch existing submissions for this student
    const { data: submissions } = await supabase
      .from('exam_submissions')
      .select('exam_id')
      .eq('student_id', studentId);

    const completedExamIds = new Set((submissions || []).map(s => s.exam_id));

    const enrichedExams = (exams || []).map(e => ({
      ...e,
      is_completed: completedExamIds.has(e.id)
    }));

    return res.status(200).json({ success: true, exams: enrichedExams });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch class examinations.' });
  }
};

// 4. Get Questions for a Specific Exam ID
const getExamQuestions = async (req, res) => {
  const { examId } = req.params;

  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d')
      .eq('exam_id', examId);

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, questions });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch exam questions.' });
  }
};

// 5. Auto-Grade & Submit Exam
const submitExam = async (req, res) => {
  const { exam_id, student_id, answers } = req.body;

  if (!exam_id || !student_id || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Exam ID, Student ID, and answers array are required.' });
  }

  try {
    const { data: existingSubmission } = await supabase
      .from('exam_submissions')
      .select('id')
      .eq('exam_id', exam_id)
      .eq('student_id', student_id)
      .maybeSingle();

    if (existingSubmission) {
      return res.status(400).json({ error: 'You have already completed this assessment. Only one attempt is allowed.' });
    }

    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select('*')
      .eq('id', exam_id)
      .single();

    if (examErr || !exam) return res.status(404).json({ error: 'Exam configuration not found.' });

    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('id, correct_option')
      .eq('exam_id', exam_id);

    if (qErr || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'No questions registered for this exam.' });
    }

    let correctCount = 0;
    const answerMap = new Map(answers.map(a => [String(a.question_id), String(a.selected_option).trim().toUpperCase()]));

    questions.forEach(q => {
      const selected = answerMap.get(String(q.id));
      if (selected && selected === String(q.correct_option).trim().toUpperCase()) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length;
    const maxScore = exam.type === 'test' ? 40 : 60;
    const finalScore = parseFloat(((correctCount / totalQuestions) * maxScore).toFixed(1));

    const { error: subErr } = await supabase
      .from('exam_submissions')
      .insert([{
        exam_id,
        student_id,
        score: finalScore,
        total_questions: totalQuestions,
        correct_count: correctCount
      }]);

    if (subErr) return res.status(400).json({ error: subErr.message });

    await supabase.from('results').insert([{
      student_id,
      subject: exam.subject,
      test_score: exam.type === 'test' ? finalScore : 0,
      exam_score: exam.type === 'exam' ? finalScore : 0,
      term: '1st Term',
      session: '2026/2027'
    }]);

    return res.status(200).json({
      success: true,
      message: 'Assessment graded and recorded successfully.',
      score: finalScore,
      maxScore
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process assessment submission.' });
  }
};

module.exports = {
  createExam,
  addQuestions,
  getExamsByClass,
  getExamQuestions,
  submitExam
};