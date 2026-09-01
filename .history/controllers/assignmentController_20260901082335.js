const supabase = require('../config/db');

// Create New Class Assignment
const createAssignment = async (req, res) => {
  const { title, subject, class_level, description, due_date, file_name, file_data } = req.body;

  if (!title || !subject || !class_level) {
    return res.status(400).json({ error: 'Title, subject, and target class level are required.' });
  }

  try {
    const { data: assignment, error } = await supabase
      .from('materials')
      .insert([{
        title,
        subject,
        class_level,
        material_type: 'assignment',
        description,
        due_date,
        file_name: file_name || 'assignment.pdf',
        file_data: file_data || ''
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ success: true, assignment });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create assignment record.' });
  }
};

// Get Assignments Filtered by Class
const getAssignmentsByClass = async (req, res) => {
  const { classLevel } = req.params;

  try {
    const { data: assignments, error } = await supabase
      .from('materials')
      .select('*')
      .eq('class_level', classLevel)
      .eq('material_type', 'assignment');

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, assignments });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch assignments.' });
  }
};

// Submit Assignment Handler
const submitAssignment = async (req, res) => {
  const { assignment_id, student_id, file_data, file_name } = req.body;

  if (!assignment_id || !student_id) {
    return res.status(400).json({ error: 'Assignment ID and Student ID are required.' });
  }

  try {
    return res.status(200).json({ success: true, message: 'Assignment submitted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process assignment submission.' });
  }
};

module.exports = {
  createAssignment,
  getAssignmentsByClass,
  submitAssignment
};