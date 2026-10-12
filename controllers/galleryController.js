const supabase = require('../config/db');

// Fetch gallery images (supports section filtering and fetching all items)
const getGalleryImages = async (req, res) => {
  const { section } = req.query;

  try {
    let query = supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });

    if (section && section !== 'all') {
      query = query.eq('activity_section', section);
    }

    const { data: images, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, images: images || [] });
  } catch (err) {
    console.error("Gallery fetch error:", err);
    return res.status(500).json({ error: 'Failed to retrieve gallery images.' });
  }
};

// Upload new gallery photo metadata (for Teachers/Admins)
const addGalleryImage = async (req, res) => {
  const { title, activity_section, image_url } = req.body;

  if (!title || !activity_section || !image_url) {
    return res.status(400).json({ error: 'Title, activity section, and image URL are required.' });
  }

  try {
    const { data: image, error } = await supabase
      .from('gallery')
      .insert([{ title, activity_section, image_url }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ success: true, image });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save gallery photo record.' });
  }
};

module.exports = {
  getGalleryImages,
  addGalleryImage
};
