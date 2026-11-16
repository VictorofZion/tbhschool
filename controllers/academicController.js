

const supabase = require('../config/db');

// Fetch student roster for Admin & Teacher dropdowns (safe join without strict FK name dependency)
// Fetch student roster for Admin & Teacher dropdowns
const getStudentsList = async (req, res) => {
  try {
    // 1. Fetch all users with role = 'student' directly from users table
    const { data: studentUsers, error: userErr } = await supabase
      .from('users')
      .select('id, full_name, email, avatar_url')
      .eq('role', 'student')
      .order('full_name', { ascending: true });

    if (userErr) return res.status(400).json({ error: userErr.message });

    // 2. Fetch matching rows from students table
    const { data: studentProfiles, error: studentErr } = await supabase
      .from('students')
      .select('id, user_id, reg_number, serial_number, class_level, fee_status');

    if (studentErr) {
      console.error('Warning fetching students table:', studentErr.message);
    }

    const profileByUserId = {};
    (studentProfiles || []).forEach(p => {
      if (p.user_id) profileByUserId[p.user_id] = p;
    });

    // 3. Merge user records with student profiles (auto-healing missing student rows)
    const formattedStudents = [];
    for (const u of studentUsers || []) {
      let profile = profileByUserId[u.id];

      if (!profile) {
        const { data: createdProfile } = await supabase
          .from('students')
          .insert([{
            user_id: u.id,
            reg_number: `TBH/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
            serial_number: `SN-${Math.floor(100000 + Math.random() * 900000)}`,
            class_level: 'JSS 1',
            fee_status: 'UNPAID'
          }])
          .select('id, user_id, reg_number, serial_number, class_level, fee_status')
          .maybeSingle();

        profile = createdProfile || { id: u.id, user_id: u.id, reg_number: 'N/A', class_level: 'Unassigned' };
      }

      formattedStudents.push({
        id: profile.id,
        user_id: u.id,
        full_name: u.full_name || 'Unnamed Student',
        email: u.email,
        reg_number: profile.reg_number || '',
        serial_number: profile.serial_number || '',
        class_level: profile.class_level || '',
        fee_status: profile.fee_status || 'UNPAID',
        users: {
          id: u.id,
          full_name: u.full_name || 'Unnamed Student',
          email: u.email,
          avatar_url: u.avatar_url
        }
      });
    }

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