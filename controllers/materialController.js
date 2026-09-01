const supabase = require('../config/db');

// Upload Learning Material or Note
const uploadMaterial = async (req, res) => {
  const { title, subject, class_level, material_type, description, due_date, file_name, file_data } = req.body;

  if (!title || !subject || !class_level || !file_name || !file_data) {
    return res.status(400).json({ error: 'Title, subject, class level, and file attachment are required.' });
  }

  try {
    const { data: material, error } = await supabase
      .from('materials')
      .insert([{ title, subject, class_level, material_type: material_type || 'note', description, due_date, file_name, file_data }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ success: true, material });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to upload class material.' });
  }
};

// Fetch Learning Materials by Class
const getMaterialsByClass = async (req, res) => {
  const { classLevel } = req.params;
  const { type } = req.query;

  try {
    let query = supabase.from('materials').select('*').eq('class_level', classLevel);
    if (type) query = query.eq('material_type', type);

    const { data: materials, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, materials });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch learning materials.' });
  }
};

module.exports = {
  uploadMaterial,
  getMaterialsByClass
};