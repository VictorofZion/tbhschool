// Student: Submit CBT Exam Answers, Auto-Grade, & Automatically Record on Dashboard Results
const submitExam = async (req, res) => {
  try {
    const { exam_id, student_id, answers } = req.body;

    if (!exam_id || !student_id || !answers) {
      return res.status(400).json({ error: "Exam ID, Student ID, and answers map are required." });
    }

    // 1. Fetch exam metadata (subject & title)
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select('subject, title')
      .eq('id', exam_id)
      .single();

    if (examErr || !exam) return res.status(400).json({ error: "Exam details not found." });

    // 2. Fetch master questions with correct answers
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, correct_option')
      .eq('exam_id', exam_id);

    if (error || !questions) return res.status(400).json({ error: "Exam questions not found." });

    // 3. Auto-grade test
    let score = 0;
    const total_questions = questions.length;

    questions.forEach(q => {
      if (answers[q.id] && answers[q.id].toUpperCase() === q.correct_option) {
        score += 1;
      }
    });

    // Calculate score scaled out of 60 for term result standard
    const scaledExamScore = total_questions > 0 ? ((score / total_questions) * 60).toFixed(2) : 0;

    // 4. Save attempt record in CBT history
    const { error: attemptError } = await supabase
      .from('student_exam_attempts')
      .insert([{ exam_id, student_id, score, total_questions }]);

    if (attemptError) return res.status(400).json({ error: attemptError.message });

    // 5. AUTOMATICALLY RECORD RESULT ON STUDENT DASHBOARD
    await supabase
      .from('results')
      .insert([{
        student_id,
        subject: exam.subject,
        test_score: 0,
        exam_score: scaledExamScore,
        term: '1st Term',
        session: '2026/2027'
      }]);

    res.status(200).json({
      message: "Exam submitted and automatically recorded on your student results dashboard!",
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