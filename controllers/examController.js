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

// Fetch Available Assessments for a Class Level & Resolve Completion Status
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

    const studentDbId = student ? student.id : null;

    // Check completion using both user_id and student_id to match legacy and new records
    let queryFilter = `student_id.eq.${userId}`;
    if (studentDbId) {
      queryFilter += `,student_id.eq.${studentDbId}`;
    }

    const { data: submissions, error: subError } = await supabase
      .from('exam_submissions')
      .select('exam_id')
      .or(queryFilter);

    if (subError) {
      console.error("Error checking completion submissions:", subError);
    }

    const completedExamIds = (submissions || []).map(s => s.exam_id);

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

// Submit Exam Answers, Record Submission & Sync Scaled Score
const submitExam = async (req, res) => {
  const { exam_id, answers } = req.body;
  const userId = req.user.id;

  try {
    // 1. Resolve student profile
    const { data: student } = await supabase
      .from('students')
      .select('id, fee_status')
      .eq('user_id', userId)
      .maybeSingle();

    const student_id = student ? student.id : userId;

    // 2. Fetch assessment details
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select('id, type, subject, title')
      .eq('id', exam_id)
      .maybeSingle();

    if (examErr || !exam) {
      return res.status(404).json({ error: 'Assessment record not found.' });
    }

    // 3. Verify fee status for terminal exams
    if (exam.type === 'exam' && (!student || student.fee_status !== 'PAID')) {
      return res.status(403).json({ error: 'Cannot submit terminal examination without verified fee payment.' });
    }

    // 4. Fetch questions and grade choices
    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('id, correct_option')
      .eq('exam_id', exam_id);

    if (qErr) return res.status(400).json({ error: qErr.message });

    const totalQuestions = (questions || []).length;
    if (totalQuestions === 0) {
      return res.status(400).json({ error: 'This assessment contains no questions.' });
    }

    let rawScore = 0;
    const answerKey = {};
    (questions || []).forEach(q => { answerKey[q.id] = q.correct_option; });

    (answers || []).forEach(a => {
      if (answerKey[a.question_id] && answerKey[a.question_id] === a.selected_option) {
        rawScore += 1;
      }
    });

    // 5. Calculate scaled score (40m for test, 60m for exam)
    const weightLimit = exam.type === 'test' ? 40 : 60;
    const scaledScore = Math.round(((rawScore / totalQuestions) * weightLimit) * 10) / 10;

    // 6. Explicitly record submission in exam_submissions
  // 6. Explicitly record submission in exam_submissions
    const { error: subInsertErr } = await supabase
      .from('exam_submissions')
      .insert([{
        exam_id,
        student_id,
        score: rawScore,
        correct_count: rawScore,
        max_score: totalQuestions,
        total_questions: totalQuestions
      }]);

    if (subInsertErr) {
      console.error("Failed to insert exam submission:", subInsertErr);
      return res.status(400).json({ error: `Submission failed: ${subInsertErr.message}` });
    }
    // 7. Sync scaled score into academic results record
    const { data: existingResult } = await supabase
      .from('results')
      .select('id, test_score, exam_score')
      .eq('student_id', student_id)
      .eq('subject', exam.subject)
      .maybeSingle();

    if (existingResult) {
      const updatePayload = {};
      if (exam.type === 'test') {
        updatePayload.test_score = scaledScore;
      } else {
        updatePayload.exam_score = scaledScore;
      }

      const { error: resUpdateErr } = await supabase
        .from('results')
        .update(updatePayload)
        .eq('id', existingResult.id);

      if (resUpdateErr) console.error("Result update error:", resUpdateErr);
    } else {
      const { error: resInsertErr } = await supabase
        .from('results')
        .insert([{
          student_id,
          subject: exam.subject,
          test_score: exam.type === 'test' ? scaledScore : 0,
          exam_score: exam.type === 'exam' ? scaledScore : 0,
          term: '1st Term',
          session: '2026/2027'
        }]);

      if (resInsertErr) console.error("Result insert error:", resInsertErr);
    }

    return res.status(200).json({ 
      success: true, 
      score: scaledScore, 
      maxScore: weightLimit,
      rawScore,
      totalQuestions 
    });

  } catch (err) {
    console.error("Submission error:", err);
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