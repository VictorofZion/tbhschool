const supabase = require('../config/db');

// Fetch students roster for teacher grade upload dropdown
const getStudentsList = async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('id, reg_number, serial_number, class_level, user_id, users(full_name, email, avatar_url)');

    if (error) {
      console.error("Fetch students error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, students: students || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch student roster.' });
  }
};

// Get results for a specific student
const getResultsByStudent = async (req, res) => {
  const { studentId } = req.params;

  try {
    const { data: results, error } = await supabase
      .from('results')
      .select('*')
      .eq('student_id', studentId);

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, results: results || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch academic results.' });
  }
};

// Upload single student result
const uploadResult = async (req, res) => {
  const { student_id, subject, test_score, exam_score, term, session } = req.body;

  if (!student_id || !subject) {
    return res.status(400).json({ error: 'Student ID and subject are required.' });
  }

  try {
    const { data: result, error } = await supabase
      .from('results')
      .insert([{
        student_id,
        subject,
        test_score: parseFloat(test_score) || 0,
        exam_score: parseFloat(exam_score) || 0,
        term: term || '1st Term',
        session: session || '2026/2027'
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to upload student grade.' });
  }
};

module.exports = {
  getStudentsList,
  getResultsByStudent,
  uploadResult
};