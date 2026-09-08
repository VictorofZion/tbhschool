const normalizeClassLevel = (raw) => {
  if (!raw) return '';
  const clean = raw.toString().replace(/\s+/g, '').toUpperCase();

  const map = {
    'JS1': 'JSS 1', 'JSS1': 'JSS 1',
    'JS2': 'JSS 2', 'JSS2': 'JSS 2',
    'JS3': 'JSS 3', 'JSS3': 'JSS 3',
    'SS1': 'SSS 1', 'SSS1': 'SSS 1',
    'SS2': 'SSS 2', 'SSS2': 'SSS 2',
    'SS3': 'SSS 3', 'SSS3': 'SSS 3'
  };

  return map[clean] || raw.trim();
};

module.exports = { normalizeClassLevel };