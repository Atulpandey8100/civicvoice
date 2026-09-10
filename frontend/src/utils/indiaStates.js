const ALIASES = {
  'andamanandnicobar': 'andamanandnicobarislands',
  'andaman and nicobar': 'andamanandnicobarislands',
  'andanandnicobar': 'andamanandnicobarislands',
  'uttaranchal': 'uttarakhand',
  'orissa': 'odisha',
  'dadra and nagar haveli and daman and diu': 'ddnhdd',
  'dadra and nagar haveli': 'ddnh',
  'daman and diu': 'dd',
  'jammu and kashmir': 'jammuandkashmir',
  'delhi': 'delhi',
  'chandigarh': 'chandigarh'
};

function normalize(name) {
  if (!name) return '';
  const key = String(name).toLowerCase().trim();
  if (ALIASES[key]) return ALIASES[key];
  return key.replace(/[^a-z]/g, '');
}

const ALIAS_MAP = {
  'andamanandnicobarislands': normalize('Andaman and Nicobar Islands'),
  'ddnhdd': normalize('Dadra and Nagar Haveli and Daman and Diu'),
  'ddnh': normalize('Dadra and Nagar Haveli'),
  'dd': normalize('Daman and Diu'),
  'jammuandkashmir': normalize('Jammu and Kashmir')
};

export function normalizeStateName(name) {
  const norm = normalize(name);
  if (ALIAS_MAP[norm]) return ALIAS_MAP[norm];
  return norm;
}
