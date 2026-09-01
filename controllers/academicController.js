const supabase = require('../config/db');

// Get Results for a Specific Student
const getResultsByStudent = async (req, res) => {
  const { studentId } = req.params;

  try {
    const { data: results, error } = await supabase
      .from('results')
      .select('*')
      .eq('student_id', studentId);

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch academic results.' });
  }
};

// Upload or Record a New Term Grade
const uploadResult = async (req, res) => {
  const { student_id, subject, test_score, exam_score, term, session } = req.body;

  if (!student_id || !subject || test_score === undefined || exam_score === undefined) {
    return res.status(400).json({ error: 'All grade details are required.' });
  }

  try {
    const { data: result, error } = await supabase
      .from('results')
      .insert([{ student_id, subject, test_score, exam_score, term, session }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record student grade.' });
  }
};

// Get All Active Students Roster for Teacher Select Dropdowns
const getStudentsList = async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('id, reg_number, serial_number, class_level, users(full_name, email)');

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, students });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch student roster.' });
  }
};

module.exports = {
  getResultsByStudent,
  uploadResult,
  getStudentsList
};