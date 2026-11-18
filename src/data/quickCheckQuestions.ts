export interface QuickCheckQuestion {
  question: string;
  formula?: string;
  acceptedAnswers: string[];
  numericValue?: number;
  hint: string;
  correctExplanation: string;
  displayAnswer: string;
}

/**
 * Converts Arabic-Indic digits and Arabic punctuation to standard math tokens
 */
export function normalizeMathInput(raw: string): string {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  let out = raw.trim();
  for (let i = 0; i < 10; i++) {
    out = out.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  out = out
    .replace(/−|–|—/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/،/g, '.')
    .replace(/٫/g, '.')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/س/g, 'x')
    .replace(/\s+/g, '')
    .toLowerCase();
  return out;
}

/**
 * Parses a simple fraction like "a/b" or decimal number into a float, or null if symbolic
 */
export function tryParseRational(expr: string): number | null {
  const norm = normalizeMathInput(expr);
  if (/^[+-]?\d+(\.\d+)?$/.test(norm)) {
    return parseFloat(norm);
  }
  const fracMatch = norm.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    if (den !== 0) return num / den;
  }
  return null;
}

export function verifyQuickCheckAnswer(userInput: string, q: QuickCheckQuestion): boolean {
  const normUser = normalizeMathInput(userInput);
  if (!normUser) return false;

  // 1. Direct normalized string match against accepted answers
  for (const ans of q.acceptedAnswers) {
    if (normUser === normalizeMathInput(ans)) {
      return true;
    }
  }

  // 2. Numeric / rational equivalence (e.g., 8/9 or equivalent unsimplified form if exact match on value)
  if (q.numericValue !== undefined) {
    const userVal = tryParseRational(normUser);
    if (userVal !== null && Math.abs(userVal - q.numericValue) < 1e-6) {
      return true;
    }
  }

  return false;
}

export const QUICK_CHECK_QUESTIONS: Record<string, QuickCheckQuestion> = {
  // الوحدة الأولى
  'u1-launch': {
    question: 'بسّط الكسر التالي إلى أبسط صيغة ممكنة:',
    formula: '18 / 24',
    acceptedAnswers: ['3/4'],
    numericValue: 0.75,
    hint: 'اقسم كلاً من البسط والمقام على القاسم المشترك الأكبر (6).',
    correctExplanation: '18 ÷ 6 = 3 و 24 ÷ 6 = 4، إذن أبسط صيغة هي 3/4.',
    displayAnswer: '3/4'
  },
  'u1-l1': {
    question: 'احسب ناتج جمع الكسرين التاليين بأبسط صيغة:',
    formula: '5/9 + 1/3',
    acceptedAnswers: ['8/9'],
    numericValue: 8 / 9,
    hint: 'المقام 9 مضاعف للعدد 3؛ اضرب بسط ومقام الكسر 1/3 بالعدد 3 ليصبح 3/9 ثم اجمع.',
    correctExplanation: '5/9 + 3/9 = (5 + 3) / 9 = 8/9.',
    displayAnswer: '8/9'
  },
  'u1-l2': {
    question: 'احسب جداء الكسرين التاليين بأبسط صيغة:',
    formula: '(-3/4) × (8/9)',
    acceptedAnswers: ['-2/3', '(-2)/3'],
    numericValue: -2 / 3,
    hint: 'اضرب البسط في البسط والمقام في المقام، أو اختصر 3 مع 9 و 8 مع 4 قبل الضرب.',
    correctExplanation: '(-3 × 8) / (4 × 9) = -24/36 = -2/3.',
    displayAnswer: '-2/3'
  },
  'u1-l3': {
    question: 'احسب ناتج قسمة الكسرين التاليين بأبسط صيغة:',
    formula: '(5/6) ÷ (10/9)',
    acceptedAnswers: ['3/4'],
    numericValue: 0.75,
    hint: 'حوّل القسمة إلى ضرب في مقلوب الكسر الثاني: (5/6) × (9/10).',
    correctExplanation: '(5/6) × (9/10) = 45/60 = 3/4.',
    displayAnswer: '3/4'
  },
  'u1-rev': {
    question: 'احسب قيمة العبارة التالية بأبسط صيغة:',
    formula: '1/2 + 3/4 - 1/4',
    acceptedAnswers: ['1', '2/2', '4/4'],
    numericValue: 1,
    hint: 'اجمع الكسرين ذوي المقام 4 أولاً: 3/4 - 1/4 = 2/4 = 1/2، ثم اجمع مع 1/2.',
    correctExplanation: '3/4 - 1/4 = 2/4 = 1/2، ثم 1/2 + 1/2 = 1.',
    displayAnswer: '1'
  },

  // الوحدة الثانية
  'u2-launch': {
    question: 'احسب قيمة القوة التالية:',
    formula: '(-3)^3',
    acceptedAnswers: ['-27'],
    numericValue: -27,
    hint: 'اضرب (-3) بنفسها 3 مرات: (-3) × (-3) × (-3).',
    correctExplanation: '(-3) × (-3) = +9، ثم 9 × (-3) = -27.',
    displayAnswer: '-27'
  },
  'u2-l1': {
    question: 'ما قيمة القوة 10^(-3) بالصيغة العشرية؟',
    formula: '10^(-3)',
    acceptedAnswers: ['0.001', '1/1000'],
    numericValue: 0.001,
    hint: 'الأس السالب (-3) يعني ثلاثة أرقام بعد الفاصلة العشرية (1 على 1000).',
    correctExplanation: '10^(-3) = 1 / 1000 = 0.001.',
    displayAnswer: '0.001'
  },
  'u2-l2': {
    question: 'بسّط الناتج على شكل قوة للعدد 10 (مثال: 10^4):',
    formula: '10^5 × 10^(-2)',
    acceptedAnswers: ['10^3', '1000'],
    numericValue: 1000,
    hint: 'عند ضرب قوى للأساس نفسه نجمع الأسس: 5 + (-2).',
    correctExplanation: '10^(5 + (-2)) = 10^3 = 1000.',
    displayAnswer: '10^3 (أو 1000)'
  },
  'u2-l3': {
    question: 'احسب قيمة الكسر المرفوع للقوة:',
    formula: '(2/3)^3',
    acceptedAnswers: ['8/27'],
    numericValue: 8 / 27,
    hint: 'وزّع الأس 3 على كل من البسط والمقام: 2^3 على 3^3.',
    correctExplanation: '2^3 = 8 و 3^3 = 27، فالناتج 8/27.',
    displayAnswer: '8/27'
  },
  'u2-l4': {
    question: 'احسب قيمة الجذر التربيعي للكسر التالي:',
    formula: '√(16/25)',
    acceptedAnswers: ['4/5', '0.8'],
    numericValue: 0.8,
    hint: 'خذ الجذر التربيعي للبسط √16 والجذر التربيعي للمقام √25.',
    correctExplanation: '√16 = 4 و √25 = 5، إذن الناتج 4/5.',
    displayAnswer: '4/5'
  },
  'u2-rev': {
    question: 'احسب قيمة المقدار التالي واكتبه كعدد عشري:',
    formula: '(3.2 × 10^4 × 5 × 10^(-7)) / (4 × 10^(-2))',
    acceptedAnswers: ['0.4', '4*10^-1', '4/10', '2/5'],
    numericValue: 0.4,
    hint: 'احسب المعامل (3.2 × 5 ÷ 4 = 4) ثم احسب أس العدد 10: 4 - 7 - (-2) = -1.',
    correctExplanation: '4 × 10^(-1) = 0.4.',
    displayAnswer: '0.4'
  },

  // الوحدة الثالثة
  'u3-launch': {
    question: 'احسب قيمة العبارة 2a + 3b عندما a = 4 و b = -1:',
    formula: '2(4) + 3(-1)',
    acceptedAnswers: ['5'],
    numericValue: 5,
    hint: 'عوض a بالعدد 4 و b بالعدد (-1) ثم نفّذ الضرب قبل الجمع.',
    correctExplanation: '2 × 4 + 3 × (-1) = 8 - 3 = 5.',
    displayAnswer: '5'
  },
  'u3-l1': {
    question: 'اكتب نظير العبارة (3x - 7) بعد إزالة الأقواس:',
    formula: '-(3x - 7)',
    acceptedAnswers: ['-3x+7', '7-3x'],
    hint: 'عند إدخال إشارة الناقص (-) على القوس نعكس إشارة كل حد بداخله.',
    correctExplanation: '-(3x - 7) = -3x + 7.',
    displayAnswer: '-3x + 7'
  },
  'u3-l2': {
    question: 'احذف الأقواس واختزل العبارة التالية:',
    formula: '5x - (2x - 3)',
    acceptedAnswers: ['3x+3', '3+3x'],
    hint: 'القوس مسبوق بإشارة (-)، فتصبح العبارة: 5x - 2x + 3.',
    correctExplanation: '5x - 2x + 3 = 3x + 3.',
    displayAnswer: '3x + 3'
  },
  'u3-l3': {
    question: 'اختزل العبارة الجبرية بتجميع الحدود المتشابهة:',
    formula: '4x - 7 + 2x + 3',
    acceptedAnswers: ['6x-4', '-4+6x'],
    hint: 'اجمع حدود x معاً (4x + 2x) والأعداد الثابتة معاً (-7 + 3).',
    correctExplanation: '(4 + 2)x + (-7 + 3) = 6x - 4.',
    displayAnswer: '6x - 4'
  },
  'u3-l4': {
    question: 'انشر واختزل الجداء التالي:',
    formula: '(x + 2)(x + 3)',
    acceptedAnswers: ['x^2+5x+6'],
    hint: 'اضرب كل حد من القوس الأول بكل حد من القوس الثاني: x^2 + 3x + 2x + 6.',
    correctExplanation: 'x^2 + 3x + 2x + 6 = x^2 + 5x + 6.',
    displayAnswer: 'x^2 + 5x + 6'
  },
  'u3-l5': {
    question: 'هل المساواة 3x + 2 = 5x - 4 صحيحة عندما x = 3؟ (اكتب نعم أو لا)',
    formula: '3(3) + 2 = 5(3) - 4',
    acceptedAnswers: ['نعم', 'صحيحة', 'صح', 'yes', 'true'],
    hint: 'احسب الطرف الأيسر: 3×3 + 2، ثم الطرف الأيمن: 5×3 - 4 وقارن بينهما.',
    correctExplanation: 'الطرف الأيسر = 11 والطرف الأيمن = 11، الناتجان متساويان إذن نعم المساواة صحيحة.',
    displayAnswer: 'نعم'
  },
  'u3-rev': {
    question: 'انشر واختزل: 3(x - 2) + 2(x + 5)',
    formula: '3(x - 2) + 2(x + 5)',
    acceptedAnswers: ['5x+4', '4+5x'],
    hint: 'انشر القوسين أولاً: 3x - 6 + 2x + 10 ثم اجمع الحدود المتشابهة.',
    correctExplanation: '3x - 6 + 2x + 10 = 5x + 4.',
    displayAnswer: '5x + 4'
  },

  // الوحدة الرابعة
  'u4-launch': {
    question: 'ميزان متوازن في كفته الأولى ثقلان كل منهما x وفي الأخرى 10 kg. ما قيمة x؟',
    formula: '2x = 10',
    acceptedAnswers: ['5', 'x=5'],
    numericValue: 5,
    hint: 'اقسم الطرفين على 2 لإيجاد قيمة x الواحدة.',
    correctExplanation: '2x = 10 ➔ x = 10 ÷ 2 = 5.',
    displayAnswer: '5'
  },
  'u4-l1': {
    question: 'أوجد قيمة x في المعادلة التالية:',
    formula: 'x - 4 = 7',
    acceptedAnswers: ['11', 'x=11'],
    numericValue: 11,
    hint: 'أضف العدد 4 إلى طرفي المساواة لعزل x.',
    correctExplanation: 'x = 7 + 4 = 11.',
    displayAnswer: '11'
  },
  'u4-l2': {
    question: 'حل المعادلة التالية وأوجد قيمة x:',
    formula: '5x - 7 = 2x + 8',
    acceptedAnswers: ['5', 'x=5'],
    numericValue: 5,
    hint: 'انقل المجاهيل لطرف والأعداد لطرف: 5x - 2x = 8 + 7.',
    correctExplanation: '3x = 15 ➔ x = 15 ÷ 3 = 5.',
    displayAnswer: '5'
  },
  'u4-l3': {
    question: 'عددان مجموعهما 20 والفرق بينهما 4. ما قيمة العدد الأصغر x؟ (المعادلة: x + (x + 4) = 20)',
    formula: '2x + 4 = 20',
    acceptedAnswers: ['8', 'x=8'],
    numericValue: 8,
    hint: 'اطرح 4 من 20 ثم اقسم الناتج على 2.',
    correctExplanation: '2x = 16 ➔ x = 8 (والعددان هما 8 و 12).',
    displayAnswer: '8'
  },
  'u4-rev': {
    question: 'حل المعادلة التالية وأوجد قيمة x:',
    formula: '3x + 6 = 0',
    acceptedAnswers: ['-2', 'x=-2'],
    numericValue: -2,
    hint: 'انقل 6 للطرف الآخر بعكس الإشارة ثم اقسم على 3.',
    correctExplanation: '3x = -6 ➔ x = -2.',
    displayAnswer: '-2'
  },

  // الوحدة الخامسة
  'u5-launch': {
    question: 'في جدول تناسب: إذا كان y = 18 عندما x = 6، فما قيمة معامل التناسب k = y/x؟',
    formula: 'k = 18 / 6',
    acceptedAnswers: ['3', 'k=3'],
    numericValue: 3,
    hint: 'اقسم قيمة y على قيمة x المقابلة لها.',
    correctExplanation: '18 ÷ 6 = 3، إذن معامل التناسب k = 3.',
    displayAnswer: '3'
  },
  'u5-l1': {
    question: 'إذا كان ثمن 4 كتب 6000 ليرة، فما ثمن 7 كتب من نفس النوع؟',
    formula: '(6000 / 4) × 7',
    acceptedAnswers: ['10500'],
    numericValue: 10500,
    hint: 'احسب أولاً ثمن الكتاب الواحد (6000 ÷ 4 = 1500) ثم اضرب في 7.',
    correctExplanation: '1500 × 7 = 10500 ليرة.',
    displayAnswer: '10500'
  },
  'u5-l2': {
    question: 'قطعت سيارة مسافة 180 km في زمن 2.5 ساعة. ما سرعتها الوسطى بـ km/h؟',
    formula: 'v = 180 / 2.5',
    acceptedAnswers: ['72'],
    numericValue: 72,
    hint: 'السرعة تساوي المسافة مقسومة على الزمن: v = d ÷ t.',
    correctExplanation: '180 ÷ 2.5 = 72 km/h.',
    displayAnswer: '72'
  },
  'u5-l3': {
    question: 'معطف سعره 50000 ليرة، خُفّض بنسبة 20%. ما سعره الجديد بعد التخفيض؟',
    formula: '50000 - (50000 × 20/100)',
    acceptedAnswers: ['40000'],
    numericValue: 40000,
    hint: 'احسب قيمة التخفيض (50000 × 0.20 = 10000) ثم اطرحها من السعر الأصلي.',
    correctExplanation: '50000 - 10000 = 40000 ليرة.',
    displayAnswer: '40000'
  },
  'u5-rev': {
    question: 'مسافة حقيقية 150 km، كم سنتيمتراً تمثلها على خريطة بمقياس 1 / 1000000؟',
    formula: '15000000 × (1 / 1000000)',
    acceptedAnswers: ['15'],
    numericValue: 15,
    hint: 'حوّل 150 km إلى سنتيمترات (15000000 cm) ثم اقسم على مليون.',
    correctExplanation: '15000000 ÷ 1000000 = 15 cm.',
    displayAnswer: '15'
  },

  // الوحدة السادسة
  'u6-launch': {
    question: 'احسب المدى للبيانات التالية: [12, 18, 9, 25, 14, 20]',
    formula: 'المدى = أكبر قيمة - أصغر قيمة',
    acceptedAnswers: ['16'],
    numericValue: 16,
    hint: 'حدد أكبر عدد (25) وأصغر عدد (9) واحسب الفرق بينهما.',
    correctExplanation: 'المدى = 25 - 9 = 16.',
    displayAnswer: '16'
  },
  'u6-l1': {
    question: 'ما هو مركز الفئة [12 , 16[؟',
    formula: '(12 + 16) / 2',
    acceptedAnswers: ['14'],
    numericValue: 14,
    hint: 'مركز الفئة يساوي مجموع حدي الفئة مقسوماً على 2.',
    correctExplanation: '(12 + 16) ÷ 2 = 28 ÷ 2 = 14.',
    displayAnswer: '14'
  },
  'u6-l2': {
    question: 'إذا كانت التكرارات لأربع فئات هي: 4 ، 7 ، 5 ، 4. فما التكرار المتجمع الصاعد للفئة الثالثة؟',
    formula: '4 + 7 + 5',
    acceptedAnswers: ['16'],
    numericValue: 16,
    hint: 'التكرار المتجمع الصاعد للفئة الثالثة يساوي مجموع تكراراتها الثلاث الأولى.',
    correctExplanation: '4 + 7 + 5 = 16.',
    displayAnswer: '16'
  },
  'u6-l3': {
    question: 'فئة تكرارها 15 من عينة حجمها 60. ما قياس زاوية قطاعها الدائري بالدرجات؟',
    formula: '(15 / 60) × 360',
    acceptedAnswers: ['90', '90°'],
    numericValue: 90,
    hint: 'اضرب نسبة الفئة (15 ÷ 60 = 1/4) في 360 درجة.',
    correctExplanation: '(1/4) × 360 = 90 درجة.',
    displayAnswer: '90°'
  },
  'u6-l4': {
    question: 'احسب المتوسط الحسابي للأعداد: 10 ، 15 ، 20',
    formula: '(10 + 15 + 20) / 3',
    acceptedAnswers: ['15'],
    numericValue: 15,
    hint: 'اجمع القيم الثلاث ثم اقسم المجموع على عددها (3).',
    correctExplanation: '45 ÷ 3 = 15.',
    displayAnswer: '15'
  },
  'u6-rev': {
    question: 'فئة مركزها 15 وتكرارها 4، وفئة أخرى مركزها 25 وتكرارها 6. ما المتوسط الحسابي المرجح؟',
    formula: '(15×4 + 25×6) / (4 + 6)',
    acceptedAnswers: ['21'],
    numericValue: 21,
    hint: 'احسب (60 + 150) ثم اقسم على مجموع التكرارات (10).',
    correctExplanation: '210 ÷ 10 = 21.',
    displayAnswer: '21'
  },

  // ============================================================================
  // كتاب الهندسة (الوحدات 1 - 5)
  // ============================================================================
  'g-u1-launch': {
    question: 'في متوازي الأضلاع ABCD، إذا كان طول الضلع AB = 7 cm، فما طول الضلع المقابل DC بالسنتيمتر؟',
    formula: 'AB = DC',
    acceptedAnswers: ['7', '7cm'],
    numericValue: 7,
    hint: 'في متوازي الأضلاع كل ضلعين متقابلين متساويان في الطول.',
    correctExplanation: 'بما أن الضلعين المتقابلين في متوازي الأضلاع متساويان فإن DC = 7 cm.',
    displayAnswer: '7'
  },
  'g-u1-l1': {
    question: 'مربع ضلعه 5 cm نُقل بانسحاب مسافة 9 cm. ما مساحة المربع الصورة بالسنتيمتر المربع؟',
    formula: "S' = S = 5 × 5",
    acceptedAnswers: ['25', '25cm2'],
    numericValue: 25,
    hint: 'الانسحاب يحفظ الأطوال والمساحات؛ احسب مساحة المربع الأصلي.',
    correctExplanation: 'الانسحاب يحفظ المساحة: 5 × 5 = 25 cm².',
    displayAnswer: '25'
  },
  'g-u1-l2': {
    question: "إذا كانت النقطة M' صورة M بالانسحاب الذي ينقل A إلى B، وكان AB = 6.5 cm، فما طول القطعة [MM']؟",
    formula: "MM' = AB",
    acceptedAnswers: ['6.5', '13/2'],
    numericValue: 6.5,
    hint: "في متوازي الأضلاع ABM'M الضلعان المتقابلان [AB] و [MM'] متساويان.",
    correctExplanation: "MM' = AB = 6.5 cm.",
    displayAnswer: '6.5'
  },
  'g-u1-l3': {
    question: 'دائرة نصف قطرها R = 4.5 cm نُقلت بانسحاب مسافة 12 cm. ما نصف قطر الدائرة الصورة؟',
    formula: "R' = R",
    acceptedAnswers: ['4.5', '9/2'],
    numericValue: 4.5,
    hint: 'صورة دائرة بالانسحاب هي دائرة لها نصف القطر نفسه.',
    correctExplanation: "الانسحاب يحفظ نصف القطر: R' = 4.5 cm.",
    displayAnswer: '4.5'
  },
  'g-u1-l4': {
    question: 'المثلثان ABC و DEF طبوقان، إذا كان AB = 8 cm و BC = 6 cm ومحيط ABC = 21 cm، فما طول DF؟',
    formula: 'DF = AC = 21 - (8 + 6)',
    acceptedAnswers: ['7', '7cm'],
    numericValue: 7,
    hint: 'احسب الضلع الثالث AC أولاً من محيط المثلث، ثم طبق تساوي الأضلاع المتقابلة في التطابق.',
    correctExplanation: 'AC = 21 - 14 = 7 cm، وبسبب التطابق DF = AC = 7 cm.',
    displayAnswer: '7'
  },
  'g-u1-rev': {
    question: 'مثلث قائم ضلعاه القائمان 3 cm و 4 cm نُقل بانسحاب 15 cm. ما محيط المثلث الصورة إذا كان وتره 5 cm؟',
    formula: "المحيط' = 3 + 4 + 5",
    acceptedAnswers: ['12', '12cm'],
    numericValue: 12,
    hint: 'الانسحاب يحفظ الأطوال وبالتالي يحفظ المحيط.',
    correctExplanation: '3 + 4 + 5 = 12 cm.',
    displayAnswer: '12'
  },

  'g-u2-launch': {
    question: 'إذا كانت النقطة M منتصف القطعة [AB] حيث AB = 14 cm، فما طول AM؟',
    formula: 'AM = AB / 2',
    acceptedAnswers: ['7', '7cm'],
    numericValue: 7,
    hint: 'المنتصف يقسم القطعة المستقيمة إلى قسمين متساويين.',
    correctExplanation: 'AM = 14 / 2 = 7 cm.',
    displayAnswer: '7'
  },
  'g-u2-l1': {
    question: 'في المثلث ABC، M منتصف [AB] و N منتصف [AC]. إذا كان طول BC = 18 cm، فما طول MN؟',
    formula: 'MN = (1 / 2) × 18',
    acceptedAnswers: ['9', '9cm'],
    numericValue: 9,
    hint: 'القطعة الواصلة بين منتصفي ضلعين تساوي نصف الضلع الثالث.',
    correctExplanation: 'MN = 18 / 2 = 9 cm.',
    displayAnswer: '9'
  },
  'g-u2-l2': {
    question: 'في المثلث ABC، M منتصف [AB] والمستقيم المار من M والموازي لـ (BC) يقطع [AC] في N. إذا كان AN = 5.5 cm، فما طول AC؟',
    formula: 'AC = 2 × AN',
    acceptedAnswers: ['11', '11cm'],
    numericValue: 11,
    hint: 'المستقيم المار بمنتصف ضلع والموازي لثانٍ يمر بمنتصف الضلع الثالث (أي N منتصف AC).',
    correctExplanation: 'N منتصف [AC]، إذن AC = 2 × 5.5 = 11 cm.',
    displayAnswer: '11'
  },
  'g-u2-l3': {
    question: 'في المثلث ABC حيث (MN) // (BC)، إذا كان AM = 3 و AB = 9 و AC = 12، فاحسب AN.',
    formula: '3 / 9 = AN / 12',
    acceptedAnswers: ['4', '4cm'],
    numericValue: 4,
    hint: 'بسّط النسبة 3/9 إلى 1/3 ثم اضرب 12 × (1/3).',
    correctExplanation: 'AN = (3 × 12) / 9 = 36 / 9 = 4.',
    displayAnswer: '4'
  },
  'g-u2-l4': {
    question: 'في المثلث ABC حيث (MN) // (BC)، إذا كان AM = 4 و AB = 10 و BC = 25، فاحسب طول MN.',
    formula: '4 / 10 = MN / 25',
    acceptedAnswers: ['10', '10cm'],
    numericValue: 10,
    hint: 'استعمل الجداء التقاطعي: MN = (4 × 25) ÷ 10.',
    correctExplanation: 'MN = 100 / 10 = 10.',
    displayAnswer: '10'
  },
  'g-u2-rev': {
    question: 'مثلث محيطه 32 cm، وصلنا بين منتصفات أضلاعه الثلاثة. ما محيط المثلث الصغير الناتج؟',
    formula: 'محيط الصغير = (1 / 2) × 32',
    acceptedAnswers: ['16', '16cm'],
    numericValue: 16,
    hint: 'كل ضلع في المثلث الصغير يساوي نصف الضلع المقابل له في المثلث الكبير.',
    correctExplanation: 'محيط مثلث المنتصفات = (1/2) × 32 = 16 cm.',
    displayAnswer: '16'
  },

  'g-u3-launch': {
    question: 'ما عدد المتوسطات التي يمكن رسمها داخل أي مثلث؟',
    formula: 'لكل رأس في المثلث متوسط واحد',
    acceptedAnswers: ['3'],
    numericValue: 3,
    hint: 'في المثلث ثلاثة رؤوس وثلاثة أضلاع.',
    correctExplanation: 'في كل مثلث 3 متوسطات تتلاقى في نقطة واحدة G.',
    displayAnswer: '3'
  },
  'g-u3-l1': {
    question: 'النقطة O مركز الدائرة المارة برؤوس المثلث ABC. إذا كان OA = 5 cm و OB + OC يساوي كم؟',
    formula: 'OA = OB = OC = 5',
    acceptedAnswers: ['10', '10cm'],
    numericValue: 10,
    hint: 'مركز الدائرة المارة بالرؤوس يبعد المسافة نفسها عن الرؤوس الثلاثة (OB = OC = OA).',
    correctExplanation: 'OB = 5 و OC = 5، فيكون المجموع OB + OC = 10.',
    displayAnswer: '10'
  },
  'g-u3-l2': {
    question: 'في المثلث ABC، الارتفاع AH عمودي على BC طوله 6 cm وطول القاعدة BC = 10 cm. احسب مساحة المثلث.',
    formula: 'S = (BC × AH) / 2',
    acceptedAnswers: ['30', '30cm2'],
    numericValue: 30,
    hint: 'مساحة المثلث تساوي نصف جداء القاعدة في الارتفاع المتعلق بها.',
    correctExplanation: 'S = (10 × 6) / 2 = 60 / 2 = 30 cm².',
    displayAnswer: '30'
  },
  'g-u3-l3': {
    question: "في المثلث ABC، طول المتوسط AA' = 12 cm و G مركز ثقل المثلث. احسب طول AG.",
    formula: "AG = (2 / 3) × 12",
    acceptedAnswers: ['8', '8cm'],
    numericValue: 8,
    hint: 'مركز الثقل يبعد عن الرأس ثلثي طول المتوسط.',
    correctExplanation: 'AG = (2 × 12) / 3 = 24 / 3 = 8 cm.',
    displayAnswer: '8'
  },
  'g-u3-l4': {
    question: 'I نقطة تلاقي منصفات زوايا المثلث ABC. إذا كان بعدها عن الضلع AB يساوي 3.5 cm، فما طول قطر الدائرة الماسة لأضلاعه داخلاً؟',
    formula: 'القطر = 2 × r',
    acceptedAnswers: ['7', '7cm'],
    numericValue: 7,
    hint: 'بُعد نقطة تلاقي المنصفات عن الأضلاع يساوي نصف قطر الدائرة الماسة داخلاً r.',
    correctExplanation: 'نصف القطر r = 3.5 cm، إذن القطر = 2 × 3.5 = 7 cm.',
    displayAnswer: '7'
  },
  'g-u3-rev': {
    question: "G مركز ثقل المثلث ABC، إذا كان طول الجزء القريب من الضلع GA' = 4 cm، فما طول المتوسط AA' كاملاً؟",
    formula: "AA' = 3 × GA'",
    acceptedAnswers: ['12', '12cm'],
    numericValue: 12,
    hint: "الجزء GA' هو ثلث المتوسط، إذن المتوسط الكامل يساوي 3 أضعاف GA'.",
    correctExplanation: "AA' = 3 × 4 = 12 cm.",
    displayAnswer: '12'
  },

  'g-u4-launch': {
    question: 'مستطيل طول كل من قطريه 16 cm. ما طول نصف القطر؟',
    formula: '16 / 2',
    acceptedAnswers: ['8', '8cm'],
    numericValue: 8,
    hint: 'قطرا المستطيل متساويان ومتناصفان.',
    correctExplanation: 'نصف القطر = 16 / 2 = 8 cm.',
    displayAnswer: '8'
  },
  'g-u4-l1': {
    question: 'مثلث ABC قائم الزاوية في A طول وتره BC = 10 cm. ما طول المتوسط المتعلق بالوتر [AO]؟',
    formula: 'AO = (1 / 2) × BC',
    acceptedAnswers: ['5', '5cm'],
    numericValue: 5,
    hint: 'في المثلث القائم، طول المتوسط المتعلق بالوتر يساوي نصف طول الوتر.',
    correctExplanation: 'AO = 10 / 2 = 5 cm.',
    displayAnswer: '5'
  },
  'g-u4-l2': {
    question: 'ABC مثلث قائم الزاوية في A فيه AB = 6 cm و AC = 8 cm. احسب طول الوتر BC.',
    formula: 'BC = √(6^2 + 8^2)',
    acceptedAnswers: ['10', '10cm'],
    numericValue: 10,
    hint: 'احسب 36 + 64 ثم خذ الجذر التربيعي للنتيجة.',
    correctExplanation: 'BC² = 36 + 64 = 100 ⇐ BC = √100 = 10 cm.',
    displayAnswer: '10'
  },
  'g-u4-l3': {
    question: 'بُعد نقطة A عن مستقيم (d) هو AH = 9 cm، و M نقطة على (d) حيث AM = 15 cm. احسب طول المسافة HM.',
    formula: 'HM = √(15^2 - 9^2)',
    acceptedAnswers: ['12', '12cm'],
    numericValue: 12,
    hint: 'المثلث AHM قائم في H؛ اطرح 9² من 15² ثم خذ الجذر.',
    correctExplanation: 'HM² = 225 - 81 = 144 ⇐ HM = √144 = 12 cm.',
    displayAnswer: '12'
  },
  'g-u4-l4': {
    question: 'دائرة مركزها O ونصف قطرها 5 cm، و M نقطة خارجها حيث OM = 13 cm. إذا مسّ (MT) الدائرة في T، احسب MT.',
    formula: 'MT = √(13^2 - 5^2)',
    acceptedAnswers: ['12', '12cm'],
    numericValue: 12,
    hint: 'المماس عمودي على نصف القطر في T؛ إذن المثلث OTM قائم في T.',
    correctExplanation: 'MT² = 169 - 25 = 144 ⇐ MT = 12 cm.',
    displayAnswer: '12'
  },
  'g-u4-rev': {
    question: 'مثلث أطوال أضلاعه 9 و 12 و x. ما قيمة x ليكون المثلث قائم الزاوية ووتره x؟',
    formula: 'x = √(9^2 + 12^2)',
    acceptedAnswers: ['15'],
    numericValue: 15,
    hint: 'احسب 81 + 144 ثم خذ الجذر التربيعي.',
    correctExplanation: '81 + 144 = 225 ⇐ x = √225 = 15.',
    displayAnswer: '15'
  },

  'g-u5-launch': {
    question: 'مكعب طول حرفه 4 cm. ما حجمه بالسنتيمتر المكعب؟',
    formula: 'V = 4^3 = 4 × 4 × 4',
    acceptedAnswers: ['64', '64cm3'],
    numericValue: 64,
    hint: 'حجم المكعب يساوي الضلع × الضلع × الضلع.',
    correctExplanation: '4 × 4 × 4 = 64 cm³.',
    displayAnswer: '64'
  },
  'g-u5-l1': {
    question: 'هرم منتظم قاعدته مربع. كم عدد الرؤوس الكلي لهذا الهرم (بما فيها رأس الهرم)؟',
    formula: '4 + 1',
    acceptedAnswers: ['5'],
    numericValue: 5,
    hint: 'أضف رأس الهرم إلى رؤوس القاعدة المربعة الأربعة.',
    correctExplanation: 'للهرم الرباعي 4 رؤوس في القاعدة + 1 في القمة = 5 رؤوس.',
    displayAnswer: '5'
  },
  'g-u5-l2': {
    question: 'هرم مساحة قاعدته S = 18 cm² وارتفاعه h = 5 cm. احسب حجمه V.',
    formula: 'V = (1 / 3) × 18 × 5',
    acceptedAnswers: ['30', '30cm3'],
    numericValue: 30,
    hint: 'اقسم 18 على 3 أولاً ثم اضرب في 5.',
    correctExplanation: 'V = (1/3) × 18 × 5 = 6 × 5 = 30 cm³.',
    displayAnswer: '30'
  },
  'g-u5-l3': {
    question: 'مخروط دوراني نصف قطر قاعدته r = 3 cm وطول مولّده L = 9 cm. ما قياس زاوية القطاع الدائري في شبكته (بالدرجات)؟',
    formula: 'θ = (360 × 3) / 9',
    acceptedAnswers: ['120', '120°'],
    numericValue: 120,
    hint: 'اضرب 360 × 3 ثم اقسم الناتج على 9.',
    correctExplanation: 'θ = (360 × 3) / 9 = 1080 / 9 = 120°.',
    displayAnswer: '120°'
  },
  'g-u5-l4': {
    question: 'مخروط دوراني ارتفاعه h = 6 cm ونصف قطر قاعدته r = 5 cm. ما معامل π في الحجم (أي العدد المضروب بـ π)؟',
    formula: '(1 / 3) × 5^2 × 6',
    acceptedAnswers: ['50', '50π'],
    numericValue: 50,
    hint: 'احسب (1 / 3) × 25 × 6.',
    correctExplanation: 'V = (1 / 3) × 25 × 6 × π = 25 × 2 π = 50 π cm³.',
    displayAnswer: '50'
  },
  'g-u5-rev': {
    question: 'هرم حجمه V = 40 cm³ وارتفاعه h = 6 cm. ما مساحة قاعدته S بالسنتيمتر المربع؟',
    formula: 'S = (3 × 40) / 6',
    acceptedAnswers: ['20', '20cm2'],
    numericValue: 20,
    hint: 'اضرب الحجم في 3 ثم اقسم على الارتفاع 6.',
    correctExplanation: 'S = (3 × 40) / 6 = 120 / 6 = 20 cm².',
    displayAnswer: '20'
  }
};

export function getQuickCheckForLesson(lessonId: string): QuickCheckQuestion {
  return QUICK_CHECK_QUESTIONS[lessonId] || QUICK_CHECK_QUESTIONS['u1-l1'];
}
