const supabase = require('../config/db');

// Teacher Route: Upload or Update Student Results
const uploadResult = async (req, res) => {
  try {
    const { student_id, subject, test_score, exam_score, term, session } = req.body;

    if (!student_id || !subject || !term || !session) {
      return res.status(400).json({ error: "Student ID, subject, term, and session are required." });
    }

    const { data, error } = await supabase
      .from('results')
      .insert([{ student_id, subject, test_score, exam_score, term, session }])
      .select();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Result recorded successfully!", result: data });
  } catch (err) {
    res.status(500).json({ error: "Server error saving result." });
  }
};

// Student/Teacher Route: View Results for a Student
const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;

    // If logged in as student, ensure they can only view their own results
    if (req.user.role === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!student || student.id !== studentId) {
        return res.status(403).json({ error: "Unauthorized access to these results." });
      }
    }

    const { data: results, error } = await supabase
      .from('results')
      .select('*')
      .eq('student_id', studentId);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ results });
  } catch (err) {
    res.status(500).json({ error: "Server error fetching academic results." });
  }
};

module.exports = { uploadResult, getStudentResults };

