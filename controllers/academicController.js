const supabase = require('../config/db');

// Fetch student roster for teacher drop-downs
const getStudentsList = async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('id, reg_number, serial_number, class_level, user_id, users!user_id(full_name, email, avatar_url)');

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, students: students || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch student roster.' });
  }
};

// Fetch results for a student (resolves both students.id and users.id)
// Fetch results for a student (resolves both students.id and users.id)
const getResultsByStudent = async (req, res) => {
  const { studentId } = req.params;

  try {
    // 1. Gather all possible IDs linked to this student
    const { data: student } = await supabase
      .from('students')
      .select('id, user_id')
      .or(`id.eq.${studentId},user_id.eq.${studentId}`)
      .maybeSingle();

    const candidateIds = [studentId];
    if (student) {
      if (student.id) candidateIds.push(student.id);
      if (student.user_id) candidateIds.push(student.user_id);
    }

    // 2. Query results matching any candidate ID
    const { data: results, error } = await supabase
      .from('results')
      .select('*')
      .in('student_id', candidateIds);

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, results: results || [] });
  } catch (err) {
    console.error("Error fetching student results:", err);
    return res.status(500).json({ error: 'Failed to fetch academic results.' });
  }
};
// Upload or Update student grade record
const uploadResult = async (req, res) => {
  const { 
    student_id, 
    subject, 
    test1_score, 
    test2_score, 
    test_score, 
    exam_score, 
    term, 
    session 
  } = req.body;

  try {
    const parsedTest1 = parseFloat(test1_score !== undefined ? test1_score : (test_score || 0)) || 0;
    const parsedTest2 = parseFloat(test2_score) || 0;
    const parsedExam = parseFloat(exam_score) || 0;

    // Check if result record already exists for this student and subject
    const { data: existing } = await supabase
      .from('results')
      .select('id')
      .eq('student_id', student_id)
      .eq('subject', subject)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from('results')
        .update({
          test1_score: parsedTest1,
          test2_score: parsedTest2,
          test_score: parsedTest1,
          exam_score: parsedExam,
          term: term || '1st Term',
          session: session || '2026/2027'
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true, result: updated });
    } else {
      const { data: inserted, error } = await supabase
        .from('results')
        .insert([{
          student_id,
          subject,
          test1_score: parsedTest1,
          test2_score: parsedTest2,
          test_score: parsedTest1,
          exam_score: parsedExam,
          term: term || '1st Term',
          session: session || '2026/2027'
        }])
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ success: true, result: inserted });
    }
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: 'Failed to upload student grade.' });
  }
};

module.exports = {
  getStudentsList,
  getResultsByStudent,
  uploadResult
};
