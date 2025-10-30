export const toArabicName = (input) => {
  if (input == null) return '-';
  const raw = String(input).trim();
  if (!raw) return '-';
  if (/[ء-ي]/.test(raw)) return raw;

  const dictionary = {
    'droppin': 'دروبين',
    'egypt': 'مصر',
    'alexandria': 'الإسكندرية',
    'mohamed': 'محمد',
    'mohammad': 'محمد',
    'muhammad': 'محمد',
    'ahmed': 'أحمد',
    'mahmoud': 'محمود',
    'mostafa': 'مصطفى',
    'mustafa': 'مصطفى',
    'hassan': 'حسن',
    'hussein': 'حسين',
    'ali': 'علي',
    'omar': 'عمر',
    'youssef': 'يوسف',
    'yusuf': 'يوسف',
    'yassin': 'ياسين',
    'khaled': 'خالد',
    'khalid': 'خالد',
    'ibrahim': 'إبراهيم',
    'islam': 'إسلام',
    'sara': 'سارة',
    'sarah': 'سارة',
    'fatma': 'فاطمة',
    'fatima': 'فاطمة',
    'noor': 'نور',
    'nour': 'نور',
    'aya': 'آية',
    'hoda': 'هدى',
    'huda': 'هدى',
    'salma': 'سلمى',
    'mona': 'منى',
    'nada': 'ندى',
    'reem': 'ريم',
    'rahma': 'رحمة'
  };

  const lower = raw.toLowerCase();
  if (dictionary[lower]) return dictionary[lower];

  return raw.split(/\s+/).map((word) => transliterateWord(word, dictionary)).join(' ');
};

const transliterateWord = (word, dictionary) => {
  if (!word) return word;
  const lower = word.toLowerCase();
  if (dictionary[lower]) return dictionary[lower];
  if (lower.startsWith('al') && lower.length > 2) {
    return 'ال' + transliterateWord(lower.slice(2), dictionary);
  }
  let out = '';
  for (let i = 0; i < lower.length; ) {
    const two = lower.slice(i, i + 2);
    if (two === 'sh') { out += 'ش'; i += 2; continue; }
    if (two === 'ch') { out += 'تش'; i += 2; continue; }
    if (two === 'th') { out += 'ث'; i += 2; continue; }
    if (two === 'kh') { out += 'خ'; i += 2; continue; }
    if (two === 'gh') { out += 'غ'; i += 2; continue; }
    if (two === 'ph') { out += 'ف'; i += 2; continue; }
    if (two === 'oo') { out += 'و'; i += 2; continue; }
    if (two === 'ee') { out += 'ي'; i += 2; continue; }
    if (two === 'ea') { out += 'ي'; i += 2; continue; }
    if (two === 'ie') { out += 'ي'; i += 2; continue; }
    if (two === 'ai' || two === 'ay') { out += 'اي'; i += 2; continue; }
    if (two === 'ou' || two === 'ow') { out += 'و'; i += 2; continue; }

    const ch = lower[i];
    const originalCh = word[i];
    if (!/[a-z]/.test(ch)) { out += originalCh; i += 1; continue; }

    const map = {
      a: 'ا', b: 'ب', c: 'ك', d: 'د', e: 'ي', f: 'ف', g: 'ج', h: 'ه', i: 'ي', j: 'ج', k: 'ك', l: 'ل', m: 'م', n: 'ن', o: 'و', p: 'ب', q: 'ق', r: 'ر', s: 'س', t: 'ت', u: 'و', v: 'ف', w: 'و', x: 'كس', y: 'ي', z: 'ز'
    };
    out += map[ch] || originalCh;
    i += 1;
  }
  return out;
}; 