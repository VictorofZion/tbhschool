

const supabase = require('../config/db');

// Fetch student roster for Admin & Teacher dropdowns (safe join without strict FK name dependency)
const getStudentsList = async (req, res) => {
  try {
    const { data: students, error: studentErr } = await supabase
      .from('students')
      .select('id, user_id, reg_number, serial_number, class_level, fee_status')
      .order('class_level', { ascending: true });

    if (studentErr) return res.status(400).json({ error: studentErr.message });

    const userIds = (students || []).map(s => s.user_id).filter(Boolean);
    let usersMap = {};

    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      (usersData || []).forEach(u => {
        usersMap[u.id] = u;
      });
    }

    const formattedStudents = (students || []).map(s => ({
      ...s,
      full_name: usersMap[s.user_id]?.full_name || 'Unnamed Student',
      users: usersMap[s.user_id] || { full_name: 'Unnamed Student' }
    }));

    return res.status(200).json({ success: true, students: formattedStudents });
  } catch (err) {
    console.error('Error fetching student roster:', err);
    return res.status(500).json({ error: 'Failed to fetch student roster.' });
  }
};

    const formattedStudents = (students || []).map(s => ({
      ...s,
      full_name: usersMap[s.user_id]?.full_name || s.full_name || 'Unnamed Student',
      users: usersMap[s.user_id] || null
    }));

    return res.status(200).json({ success: true, students: formattedStudents });
  } catch (err) {
    console.error('Error fetching student roster:', err);
    return res.status(500).json({ error: 'Failed to fetch student roster.' });
  }
};

// Fetch results for a specific student ID or logged-in student
const getResultsByStudent = async (req, res) => {
  const targetId = req.params.studentId || req.query.studentId || req.user?.id;

  if (!targetId) {
    return res.status(400).json({ error: 'Student ID is required.' });
  }

  try {
    const { data: student } = await supabase
      .from('students')
      .select('id, user_id')
      .or(`id.eq.${targetId},user_id.eq.${targetId}`)
      .maybeSingle();

    const candidateIds = [targetId];
    if (student) {
      if (student.id) candidateIds.push(student.id);
      if (student.user_id) candidateIds.push(student.user_id);
    }

    const { data: results, error } = await supabase
      .from('results')
      .select('*')
      .in('student_id', candidateIds)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, results: results || [] });
  } catch (err) {
    console.error('Error fetching student results:', err);
    return res.status(500).json({ error: 'Failed to fetch academic results.' });
  }
};

// Fetch all results (for Admin / Teacher result management view)
const getAllResults = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from('results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, results: results || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch results.' });
  }
};

// Upload or Update student grade record
const uploadResult = async (req, res) => {
  const { student_id, subject, test1_score, test2_score, test_score, exam_score, term, session } = req.body;

  try {
    const targetTerm = term || '1st Term';
    const targetSession = session || '2026/2027';
    const parsedTest1 = parseFloat(test1_score !== undefined ? test1_score : (test_score || 0)) || 0;
    const parsedTest2 = parseFloat(test2_score) || 0;
    const parsedExam = parseFloat(exam_score) || 0;

    const { data: existing } = await supabase
      .from('results')
      .select('id')
      .eq('student_id', student_id)
      .eq('subject', subject)
      .eq('term', targetTerm)
      .eq('session', targetSession)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from('results')
        .update({
          test1_score: parsedTest1,
          test2_score: parsedTest2,
          test_score: parsedTest1,
          exam_score: parsedExam
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
          term: targetTerm,
          session: targetSession
        }])
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ success: true, result: inserted });
    }
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to upload student grade.' });
  }
};

const updateResultScore = async (req, res) => {
  const { resultId } = req.params;
  const { test1_score, test2_score, exam_score } = req.body;

  try {
    const parsedTest1 = parseFloat(test1_score) || 0;
    const parsedTest2 = parseFloat(test2_score) || 0;
    const parsedExam = parseFloat(exam_score) || 0;

    const { data: updated, error } = await supabase
      .from('results')
      .update({
        test1_score: parsedTest1,
        test2_score: parsedTest2,
        test_score: parsedTest1,
        exam_score: parsedExam
      })
      .eq('id', resultId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true, result: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update result entry.' });
  }
};

const deleteResultScore = async (req, res) => {
  const { resultId } = req.params;

  try {
    const { error } = await supabase
      .from('results')
      .delete()
      .eq('id', resultId);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true, message: 'Result record deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete result record.' });
  }
};

module.exports = {
  getStudentsList,
  getResultsByStudent,
  getAllResults,
  uploadResult,
  updateResultScore,
  deleteResultScore
};