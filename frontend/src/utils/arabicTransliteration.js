const ARABIC_REGEX = /[\u0600-\u06FF]/;
const LATIN_REGEX = /[A-Za-z]/;
const LTR_ISOLATE = '\u2066';
const RTL_ISOLATE = '\u2067';
const PDI = '\u2069';

const WORD_DICTIONARY = {
  droppin: 'دروبين',
  egypt: 'مصر',
  cairo: 'القاهرة',
  giza: 'الجيزة',
  alexandria: 'الإسكندرية',
  maadi: 'المعادي',
  nasr: 'نصر',
  heliopolis: 'مصر الجديدة',
  dokki: 'الدقي',
  mohandessin: 'المهندسين',
  zamalek: 'الزمالك',
  faisal: 'فيصل',
  haram: 'الهرم',
  october: 'أكتوبر',
  street: 'شارع',
  st: 'شارع',
  road: 'طريق',
  rd: 'طريق',
  avenue: 'أفينيو',
  ave: 'أفينيو',
  square: 'ميدان',
  district: 'حي',
  block: 'بلوك',
  building: 'عمارة',
  bldg: 'عمارة',
  floor: 'دور',
  apartment: 'شقة',
  apt: 'شقة',
  villa: 'فيلا',
  compound: 'كمبوند',
  tower: 'برج',
  city: 'مدينة',
  town: 'مدينة',
  area: 'منطقة',
  zone: 'منطقة',
  lane: 'حارة',
  alley: 'زقاق',
  no: 'رقم',
  number: 'رقم',
  near: 'بجوار',
  beside: 'بجوار',
  behind: 'خلف',
  infrontof: 'أمام',
  ring: 'دائري',
  bridge: 'كوبري',
  station: 'محطة',
  mall: 'مول',
  gate: 'بوابة',
  entrance: 'مدخل',
  unit: 'وحدة',
  office: 'مكتب',
  warehouse: 'مخزن',
  store: 'متجر',
  house: 'منزل',
  governorate: 'محافظة',
  phone: 'هاتف',
  el: 'ال',
  mohamed: 'محمد',
  mohammad: 'محمد',
  muhammad: 'محمد',
  ahmed: 'أحمد',
  mahmoud: 'محمود',
  mostafa: 'مصطفى',
  mustafa: 'مصطفى',
  hassan: 'حسن',
  hussein: 'حسين',
  ali: 'علي',
  amr: 'عمرو',
  omar: 'عمر',
  youssef: 'يوسف',
  yusuf: 'يوسف',
  yassin: 'ياسين',
  khaled: 'خالد',
  khalid: 'خالد',
  ibrahim: 'إبراهيم',
  islam: 'إسلام',
  sara: 'سارة',
  sarah: 'سارة',
  fatma: 'فاطمة',
  fatima: 'فاطمة',
  noor: 'نور',
  nour: 'نور',
  aya: 'آية',
  hoda: 'هدى',
  huda: 'هدى',
  salma: 'سلمى',
  mona: 'منى',
  nada: 'ندى',
  reem: 'ريم',
  rahma: 'رحمة'
  ,
  abdullah: 'عبدالله',
  abdallah: 'عبدالله',
  tarek: 'طارق',
  tamer: 'تامر',
  mansoura: 'المنصورة',
  mansura: 'المنصورة'
};

const PHRASE_DICTIONARY = {
  'new cairo': 'القاهرة الجديدة',
  'nasr city': 'مدينة نصر',
  '6th october': 'السادس من أكتوبر',
  'kafr el sheikh': 'كفر الشيخ',
  'port said': 'بورسعيد',
  'north coast': 'الساحل الشمالي',
  'el mansoura': 'المنصورة',
  'al mansoura': 'المنصورة',
  'el-mansoura': 'المنصورة',
  'al-mansoura': 'المنصورة',
  'el mansura': 'المنصورة',
  'al mansura': 'المنصورة',
  'el-mansura': 'المنصورة',
  'al-mansura': 'المنصورة',
  'el maadi': 'المعادي',
  'al maadi': 'المعادي',
  'el dokki': 'الدقي',
  'al dokki': 'الدقي',
  'el mohandessin': 'المهندسين',
  'al mohandessin': 'المهندسين'
};

const WORD_TRANSLATIONS = {
  street: 'شارع',
  st: 'شارع',
  road: 'طريق',
  rd: 'طريق',
  avenue: 'جادة',
  ave: 'جادة',
  square: 'ميدان',
  district: 'حي',
  block: 'بلوك',
  building: 'مبنى',
  bldg: 'مبنى',
  floor: 'دور',
  apartment: 'شقة',
  apt: 'شقة',
  villa: 'فيلا',
  compound: 'كمبوند',
  tower: 'برج',
  city: 'مدينة',
  governorate: 'محافظة',
  area: 'منطقة',
  zone: 'منطقة',
  lane: 'حارة',
  alley: 'زقاق',
  near: 'بجوار',
  beside: 'بجوار',
  behind: 'خلف',
  gate: 'بوابة',
  entrance: 'مدخل',
  house: 'منزل',
  office: 'مكتب',
  warehouse: 'مخزن',
  station: 'محطة',
  mall: 'مول',
  no: 'رقم',
  number: 'رقم',
  phone: 'هاتف'
};

const normalizeLatin = (value) => (
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u2013|\u2014/g, '-')
);

export const hasArabicText = (input) => ARABIC_REGEX.test(String(input || ''));

export const toArabicName = (input) => {
  if (input == null) return '-';
  const raw = normalizeLatin(input).trim();
  if (!raw) return '-';
  if (hasArabicText(raw)) return raw;

  let working = raw;
  for (const [enPhrase, arPhrase] of Object.entries(PHRASE_DICTIONARY)) {
    const re = new RegExp(`\\b${enPhrase.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    working = working.replace(re, arPhrase);
  }

  return working
    .split(/\s+/)
    .map((word) => translateOrTransliterateToken(word))
    .join(' ')
    .replace(/\s+,/g, ',')
    .replace(/\s+\./g, '.')
    .replace(/,/g, '،')
    .trim();
};

export const formatEnglishWithArabic = (input) => {
  if (input == null) return '-';
  const raw = normalizeLatin(input).trim();
  if (!raw) return '-';
  if (hasArabicText(raw)) return raw;
  if (!LATIN_REGEX.test(raw)) return raw;

  const ar = toArabicName(raw);
  // Isolate each language direction so mixed AWB lines do not visually scramble.
  return `${LTR_ISOLATE}${raw}${PDI} | ${RTL_ISOLATE}${ar}${PDI}`;
};

export const formatEnglishWithArabicSmart = async (input) => {
  if (input == null) return '-';
  const raw = normalizeLatin(input).trim();
  if (!raw) return '-';
  if (hasArabicText(raw)) return raw;
  if (!LATIN_REGEX.test(raw)) return raw;

  // Legacy behavior: local transliteration only (no external AI translation call).
  const ar = toArabicName(raw);
  return `${LTR_ISOLATE}${raw}${PDI} | ${RTL_ISOLATE}${ar}${PDI}`;
};

const transliterateWord = (word, dictionary) => {
  if (!word) return word;
  const lower = word.toLowerCase();
  if (dictionary[lower]) return dictionary[lower];
  if (lower.startsWith('el-') && lower.length > 3) {
    return 'ال' + transliterateWord(lower.slice(3), dictionary);
  }
  if (lower.startsWith('el') && lower.length > 2) {
    return 'ال' + transliterateWord(lower.slice(2), dictionary);
  }
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

const translateOrTransliterateToken = (token) => {
  if (!token) return token;
  if (hasArabicText(token)) return token;

  // Keep punctuation around a core latin token (e.g. "Building," -> "مبنى،").
  const match = token.match(/^([^A-Za-z0-9]*)([A-Za-z][A-Za-z0-9'-]*)([^A-Za-z0-9]*)$/);
  if (!match) {
    return token;
  }

  const [, prefix, core, suffix] = match;
  const normalizedCore = core.toLowerCase();
  const translated = WORD_TRANSLATIONS[normalizedCore];
  const converted = translated || transliterateWord(core, WORD_DICTIONARY);

  return `${prefix}${converted}${suffix}`;
};