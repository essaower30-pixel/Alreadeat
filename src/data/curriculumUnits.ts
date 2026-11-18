// ============================================================================
// فهرس منهاج الجبر - الصف الثامن الأساسي (الجمهورية العربية السورية)
// مطابق 100% لكتاب الطالب الصادر عن وزارة التربية (الوحدات الست والصفحات 1 - 124)
// ============================================================================

import { SYRIAN_GEOMETRY_UNITS } from './geometryUnits';

export type CurriculumSubject = string;

export interface BookConfig {
  id: string;
  title: string;
  shortTitle: string;
  subjectLabel: string;
  cardBadge: string;
  termSummary: string;
  description: string;
  coverImage: string;
  scanBaseDir: string;
  totalPages: number;
  lessonIdPrefix: string;
  defaultLessonId: string;
  returnToFirstLabel: string;
  accentTheme: 'amber' | 'teal' | 'sky' | 'emerald' | 'purple' | 'rose';
  units: CurriculumUnit[];
}

export interface CurriculumLesson {
  id: string;
  subject?: CurriculumSubject;
  unitId: string;
  unitNumber: number;
  lessonNumber: number;
  title: string;
  subtitle: string;
  pages: string;
  startPage: number;
  endPage: number;
  badge: string;
  isCurrent?: boolean;
  summary: string;
  keyRule: string;
  ruleEquation: string;
  exampleProblem: string;
  exampleSolution: string;
  spokenOverview: string;
}

export interface CurriculumUnit {
  id: string;
  subject?: CurriculumSubject;
  number: number;
  title: string;
  term: 'الفصل الأول' | 'الفصل الثاني';
  icon: string;
  accentColor: string;
  description: string;
  pagesSpan: string;
  startPage: number;
  endPage: number;
  lessons: CurriculumLesson[];
}

export const SYRIAN_ALGEBRA_UNITS: CurriculumUnit[] = [
  // ==========================================================================
  // الوحدة الأولى: الأعداد العادية والعمليات عليها (ص 3 - 24)
  // ==========================================================================
  {
    id: 'unit-1',
    number: 1,
    title: 'الوحدة الأولى: الأعداد العادية والعمليات عليها',
    term: 'الفصل الأول',
    icon: '🔢',
    accentColor: 'emerald',
    description: 'دراسة مجموعة الأعداد العادية Q وخصائص جمع وطرح وضرب وقسمة الكسور والعمليات المركبة.',
    pagesSpan: 'صفحة 3 - 24',
    startPage: 3,
    endPage: 24,
    lessons: [
      {
        id: 'u1-launch',
        unitId: 'unit-1',
        unitNumber: 1,
        lessonNumber: 0,
        title: 'انطلاقة نشطة: تذكير بمكتسبات الصف السابع',
        subtitle: 'الكسور المتكافئة، توحيد المقامات، وقاعدة الجداء التقاطعي',
        pages: 'ص 3 - 4',
        startPage: 3,
        endPage: 4,
        badge: 'تهيئة ومراجعة 🚀',
        summary: 'اختبار تشخيصي ومراجعة لتبسيط واختصار الكسور والتأكد من تساوي كسرين بالجداء التقاطعي.',
        keyRule: 'لا تتغير قيمة الكسر إذا ضربنا أو قسمنا كلاً من بسطه ومقامه بعدد مغاير للصفر.',
        ruleEquation: 'a/b = (a × c) / (b × c) | a × d = b × c',
        exampleProblem: 'بسط الكسر: 42 / (-210) واختبر تساوي الكسرين 15/62 و 1534/8821',
        exampleSolution: '42 / (-210) = 1 / (-5) = -1/5 بالقسمة على 42',
        spokenOverview: 'انطلاقة نشطة لمراجعة المكتسبات السابقة في الكسور العادية والجداء التقاطعي وتبسيط الكسور قبل البدء بالعمليات.'
      },
      {
        id: 'u1-l1',
        unitId: 'unit-1',
        unitNumber: 1,
        lessonNumber: 1,
        title: 'الدرس 1: الجمع والطرح',
        subtitle: 'المقامات المتساوية، المضاعف المشترك، والمقامات المختلفة تماماً',
        pages: 'ص 5 - 7',
        startPage: 5,
        endPage: 7,
        badge: 'مكتمل بالصوت التفاعلي ⭐',
        isCurrent: true,
        summary: 'تمديد قواعد جمع وطرح الكسور للأعداد العادية ذات الإشارة، وحساب سلسلة عمليات ومسائل حياتية.',
        keyRule: 'لجمع أو طرح كسرين نوحد المقامين بالمضاعف المشترك الأصغر ثم نجمع أو نطرح البسطين ونحتفظ بالمقام المشترك.',
        ruleEquation: 'a/b + c/b = (a + c) / b | a/b - c/b = (a - c) / b',
        exampleProblem: 'احسب: (-9/7) + (5/7) و 5/8 - 1/6 ومسألة عصير زينة (2 ليتر)',
        exampleSolution: 'المقامات متساوية: (-9 + 5) / 7 = -4/7 . توحيد 8 و 6 على 24، فيكون 15/24 - 4/24 = 11/24',
        spokenOverview: 'الدرس الأول من الوحدة الأولى: جمع وطرح الأعداد العادية مع حالات المقامات المتساوية والمختلفة وتطبيق مسألة عصير زينة.'
      },
      {
        id: 'u1-l2',
        unitId: 'unit-1',
        unitNumber: 1,
        lessonNumber: 2,
        title: 'الدرس 2: الضرب',
        subtitle: 'جداء كسرين عاديين، قواعد الإشارات، ومقلوب عدد عادي',
        pages: 'ص 8 - 11',
        startPage: 8,
        endPage: 11,
        badge: 'درس منهجي 📘',
        summary: 'جداء كسرين عاديين هو كسر بسطه جداء البسطين ومقامه جداء المقامين، مع الاختصار قبل الضرب.',
        keyRule: 'لضرب كسرين نضرب البسط في البسط والمقام في المقام. ومقلوب a/b هو b/a حيث a, b ≠ 0.',
        ruleEquation: '(a/b) × (c/d) = (a × c) / (b × d) | (a/b) × (b/a) = 1',
        exampleProblem: 'احسب بأبسط صيغة: (-3/4) × (8/9) وما مقلوب -5/7؟',
        exampleSolution: 'نختصر 3 مع 9 و 8 مع 4: (-1 × 2) / (1 × 3) = -2/3 | مقلوب -5/7 هو -7/5',
        spokenOverview: 'الدرس الثاني: ضرب الأعداد العادية ومقلوب عدد عادي واختصار العوامل المشتركة لحساب الناتج بدقة.'
      },
      {
        id: 'u1-l3',
        unitId: 'unit-1',
        unitNumber: 1,
        lessonNumber: 3,
        title: 'الدرس 3: القسمة',
        subtitle: 'قسمة الأعداد العادية، الكسور المركبة، وأولويات العمليات',
        pages: 'ص 12 - 16',
        startPage: 12,
        endPage: 16,
        badge: 'درس منهجي 📘',
        summary: 'لقسمة عدد عادي على كسر غير معدوم نضرب بالمقلوب، والكسر المركب يحسب بقسمة البسط على المقام.',
        keyRule: 'قسمة كسر على آخر: (a/b) ÷ (c/d) = (a/b) × (d/c). وترتيب العمليات: الأقواس أولاً ثم الضرب والقسمة ثم الجمع والطرح.',
        ruleEquation: '(a/b) ÷ (c/d) = (a/b) × (d/c) = (a × d) / (b × c)',
        exampleProblem: 'احسب: (5/6) ÷ (10/9) واحسب المقدار: A = 1/2 + 3/4 ÷ 3/2',
        exampleSolution: '(5/6) × (9/10) = 45/60 = 3/4 | الأولوية للقسمة: 3/4 × 2/3 = 1/2 ➔ 1/2 + 1/2 = 1',
        spokenOverview: 'الدرس الثالث: قسمة الأعداد العادية والتعامل مع الكسور المركبة وتطبيق أولويات العمليات الحسابية.'
      },
      {
        id: 'u1-rev',
        unitId: 'unit-1',
        unitNumber: 1,
        lessonNumber: 4,
        title: 'تدريبات ومسائل الوحدة الأولى',
        subtitle: 'تمارين مكثفة وشاملة ومسائل هندسية وحياتية مركبة',
        pages: 'ص 17 - 24',
        startPage: 17,
        endPage: 24,
        badge: 'تدريبات وامتحانات 📝',
        summary: 'بنك شامل لتدريبات الكتاب ومسائله، يغطي العمليات الأربع مع حساب سلاسل معقدة واختصار النواتج.',
        keyRule: 'الدمج بين العمليات الأربع مع التقيد الدقيق بقواعد الإشارات وأولويات الحساب.',
        ruleEquation: 'E = [(-2/3) + (5/6)] × [3/4 - (-1/2)] ÷ (5/8)',
        exampleProblem: 'احسب المقدار E بأبسط صورة ممكنة.',
        exampleSolution: 'داخل القوس الأول: 1/6 ، داخل القوس الثاني: 5/4 ➔ (1/6 × 5/4) ÷ 5/8 = 5/24 × 8/5 = 1/3',
        spokenOverview: 'تدريبات ومسائل شاملة من صفحة 17 حتى 24 لتثبيت كفايات الوحدة الأولى كاملة.'
      }
    ]
  },

  // ==========================================================================
  // الوحدة الثانية: قوى الأعداد العادية (ص 25 - 45)
  // ==========================================================================
  {
    id: 'unit-2',
    number: 2,
    title: 'الوحدة الثانية: قوى الأعداد العادية',
    term: 'الفصل الأول',
    icon: '⚡',
    accentColor: 'amber',
    description: 'قوى العدد 10، الكتابة العلمية، قواعد العمليات على القوى، وقوى الأعداد النسبية والجذور التربيعية.',
    pagesSpan: 'صفحة 25 - 45',
    startPage: 25,
    endPage: 45,
    lessons: [
      {
        id: 'u2-launch',
        unitId: 'unit-2',
        unitNumber: 2,
        lessonNumber: 0,
        title: 'انطلاقة نشطة: تذكير بمفهوم القوة والمربع',
        subtitle: 'مفهوم الأس وتكرار الضرب ومربعات ومكعبات الأعداد',
        pages: 'ص 25',
        startPage: 25,
        endPage: 25,
        badge: 'تهيئة ومراجعة 🚀',
        summary: 'استذكار مفهوم القوة والأس للأساسات البسيطة تمهيداً لقوى العدد 10 والأسس السالبة.',
        keyRule: 'a مرفوع للأس n يعني ضرب a بنفسه n مرة.',
        ruleEquation: 'a^n = a × a × ... × a',
        exampleProblem: 'احسب: 2^4 و (-3)^3',
        exampleSolution: '2^4 = 16 | (-3)^3 = -27',
        spokenOverview: 'انطلاقة نشطة للوحدة الثانية تستذكر مفهوم القوة والأس وتأثير الإشارة السالبة.'
      },
      {
        id: 'u2-l1',
        unitId: 'unit-2',
        unitNumber: 2,
        lessonNumber: 1,
        title: 'الدرس 1: قوى العدد 10',
        subtitle: 'الأسس الموجبة والسالبة والكتابة العلمية للأعداد',
        pages: 'ص 26 - 28',
        startPage: 26,
        endPage: 28,
        badge: 'درس منهجي 📘',
        summary: 'تعريف 10^n و 10^(-n)، والعد بالأصفار، وكتابة الأعداد بالصيغة العشرية والصيغة العلمية a × 10^n.',
        keyRule: '10^n يساوي 1 متبوعاً بـ n صفراً، و 10^(-n) يساوي 0.00...1 بحيث يكون n رقماً بعد الفاصلة.',
        ruleEquation: '10^n = 100...0 | 10^(-n) = 1 / 10^n = 0.00...1',
        exampleProblem: 'اكتب بالصيغة العلمية: 3500000 و 0.00042',
        exampleSolution: '3500000 = 3.5 × 10^6 | 0.00042 = 4.2 × 10^(-4)',
        spokenOverview: 'الدرس الأول من الوحدة الثانية: قوى العدد 10 والأسس الموجبة والسالبة والترميز العلمي.'
      },
      {
        id: 'u2-l2',
        unitId: 'unit-2',
        unitNumber: 2,
        lessonNumber: 2,
        title: 'الدرس 2: قواعد على قوى العدد 10',
        subtitle: 'ضرب وقسمة ورفع قوى العدد 10',
        pages: 'ص 29 - 31',
        startPage: 29,
        endPage: 31,
        badge: 'قاعدة جوهرية ⚡',
        summary: 'خواص العمليات على قوى العدد 10: جمع الأسس في الضرب، طرحها في القسمة، وضربها في قوة القوة.',
        keyRule: '10^m × 10^n = 10^(m+n) | 10^m / 10^n = 10^(m-n) | (10^m)^n = 10^(m×n).',
        ruleEquation: '10^m × 10^n = 10^(m+n) | (10^m) / (10^n) = 10^(m-n)',
        exampleProblem: 'احسب: (10^5 × 10^(-2)) / (10^7) و (10^3)^(-2)',
        exampleSolution: '10^(5-2) / 10^7 = 10^3 / 10^7 = 10^(-4) | (10^3)^(-2) = 10^(-6)',
        spokenOverview: 'الدرس الثاني: قواعد قوى العدد 10 في الضرب والقسمة ورفع القوة مع أمثلة تدريبية.'
      },
      {
        id: 'u2-l3',
        unitId: 'unit-2',
        unitNumber: 2,
        lessonNumber: 3,
        title: 'الدرس 3: قوى صحيحة لعدد نسبي (عادي)',
        subtitle: 'قوة كسر، الأسس الصحيحة السالبة، وخواص الأساس المشترك',
        pages: 'ص 32 - 34',
        startPage: 32,
        endPage: 34,
        badge: 'درس منهجي 📘',
        summary: 'تمديد خواص القوى للأعداد العادية: (a/b)^n = a^n / b^n و (a/b)^(-n) = (b/a)^n.',
        keyRule: 'قوة كسر تساوي قوة البسط مقسومة على قوة المقام، والأس السالب يقلب الكسر.',
        ruleEquation: '(a/b)^n = (a^n) / (b^n) | (a/b)^(-n) = (b/a)^n',
        exampleProblem: 'احسب: (2/3)^3 و (-1/2)^(-4)',
        exampleSolution: '(2/3)^3 = 8/27 | (-1/2)^(-4) = (-2/1)^4 = (-2)^4 = 16',
        spokenOverview: 'الدرس الثالث: قوى الأعداد العادية وتوزيع الأس على البسط والمقام والتعامل مع الأسس السالبة.'
      },
      {
        id: 'u2-l4',
        unitId: 'unit-2',
        unitNumber: 2,
        lessonNumber: 4,
        title: 'الدرس 4: الجذور التربيعية وخواصها',
        subtitle: 'تعريف الجذر التربيعي، جذر الجداء، وجذر الكسر',
        pages: 'ص 35 - 37',
        startPage: 35,
        endPage: 37,
        badge: 'قاعدة جوهرية ⚡',
        summary: 'الجذر التربيعي لعدد موجب a هو العدد الموجب الذي مربعه a، وجذر الجداء يساوي جداء الجذور.',
        keyRule: '√(a × b) = √a × √b و √(a / b) = √a / √b بشرط a, b موجبان تماماً.',
        ruleEquation: '√(a × b) = √a × √b | √(a/b) = (√a) / (√b)',
        exampleProblem: 'احسب: √36 و √(16/25) وبسط: √72',
        exampleSolution: '√36 = 6 | √(16/25) = 4/5 | √72 = √(36 × 2) = 6√2',
        spokenOverview: 'الدرس الرابع: الجذور التربيعية وخواصها الحسابية في التبسيط وإيجاد القيم المضبوطة.'
      },
      {
        id: 'u2-rev',
        unitId: 'unit-2',
        unitNumber: 2,
        lessonNumber: 5,
        title: 'تدريبات ومسائل الوحدة الثانية',
        subtitle: 'شامل لقوى العدد 10 والقوى الصحيحة والجذور والترميز العلمي',
        pages: 'ص 38 - 45',
        startPage: 38,
        endPage: 45,
        badge: 'تدريبات وامتحانات 📝',
        summary: 'مسائل امتحانية وتطبيقات فيزيائية وفلكية على المسافات الكبيرة والأبعاد الذرية باستخدام القوى.',
        keyRule: 'الربط بين القوى والجذور واستخدام الآلة الحاسبة للتحقق من التقريب.',
        ruleEquation: 'K = (3.2 × 10^4 × 5 × 10^(-7)) / (4 × 10^(-2))',
        exampleProblem: 'احسب K واكتب الناتج بالصيغة العلمية.',
        exampleSolution: '(3.2 × 5 / 4) × 10^(4 - 7 - (-2)) = 4 × 10^(-1) = 0.4',
        spokenOverview: 'تدريبات ومسائل الوحدة الثانية الشاملة من صفحة 38 إلى صفحة 45.'
      }
    ]
  },

  // ==========================================================================
  // الوحدة الثالثة: الحساب بالرموز (ص 46 - 66)
  // ==========================================================================
  {
    id: 'unit-3',
    number: 3,
    title: 'الوحدة الثالثة: الحساب بالرموز',
    term: 'الفصل الأول',
    icon: '📐',
    accentColor: 'indigo',
    description: 'نظير المجموع والفرق، حذف الأقواس، اختزال العبارات الرمزية، نشر المقادير، واختبار صحة المساواة.',
    pagesSpan: 'صفحة 46 - 66',
    startPage: 46,
    endPage: 66,
    lessons: [
      {
        id: 'u3-launch',
        unitId: 'unit-3',
        unitNumber: 3,
        lessonNumber: 0,
        title: 'انطلاقة نشطة: التعبير بالرموز الجبرية',
        subtitle: 'المتغيرات والمجاهيل، حساب قيمة عبارة جبرية لعدد معطى',
        pages: 'ص 46',
        startPage: 46,
        endPage: 46,
        badge: 'تهيئة ومراجعة 🚀',
        summary: 'تمهيد للحساب بالرموز واستعمال الحروف كمتغيرات للتعبير عن كميات عامة.',
        keyRule: 'الرمز يعبر عن عدد مجهول أو متغير، وحساب قيمة العبارة يتم بالتعويض العددي.',
        ruleEquation: 'E(x) = 3x - 5 | E(2) = 3(2) - 5 = 1',
        exampleProblem: 'احسب قيمة العبارة 2a + 3b عندما a = 4 و b = -1',
        exampleSolution: '2(4) + 3(-1) = 8 - 3 = 5',
        spokenOverview: 'انطلاقة نشطة للوحدة الثالثة في الحساب بالرموز والتعويض الجبري.'
      },
      {
        id: 'u3-l1',
        unitId: 'unit-3',
        unitNumber: 3,
        lessonNumber: 1,
        title: 'الدرس 1: نظير المجموع ونظير الفرق',
        subtitle: 'تمثيل النظير على مستقيم الأعداد وقواعد الإشارات السالبة',
        pages: 'ص 47 - 49',
        startPage: 47,
        endPage: 49,
        badge: 'درس منهجي 📘',
        summary: 'نظير مجموع حدين هو مجموع نظيريهما: -(a + b) = -a - b، ونظير الفرق هو -(a - b) = -a + b.',
        keyRule: '-(a + b) = -a - b و -(a - b) = -a + b = b - a.',
        ruleEquation: '-(a + b) = -a - b | -(a - b) = -a + b',
        exampleProblem: 'اكتب نظير العبارة: (3x - 7) ونظير: (-2x + 5)',
        exampleSolution: '-(3x - 7) = -3x + 7 | -(-2x + 5) = 2x - 5',
        spokenOverview: 'الدرس الأول من الوحدة الثالثة: نظير المجموع ونظير الفرق وكيفية إدخال إشارة الناقص على القوس.'
      },
      {
        id: 'u3-l2',
        unitId: 'unit-3',
        unitNumber: 3,
        lessonNumber: 2,
        title: 'الدرس 2: حذف الأقواس',
        subtitle: 'الأقواس المسبوقة بإشارة (+) والأقواس المسبوقة بإشارة (-)',
        pages: 'ص 50 - 51',
        startPage: 50,
        endPage: 51,
        badge: 'قاعدة جوهرية ⚡',
        summary: 'عند حذف قوس مسبوق بإشارة زائد تبقى الحدود كما هي، وعند حذف قوس مسبوق بإشارة ناقص نعكس إشارة كل حد بداخله.',
        keyRule: '+(a - b + c) = a - b + c بينما -(a - b + c) = -a + b - c.',
        ruleEquation: 'A = 5x - (2x - 3) = 5x - 2x + 3 = 3x + 3',
        exampleProblem: 'احذف الأقواس وبسط: B = 7 - (3x - 4) + (2x - 1)',
        exampleSolution: 'B = 7 - 3x + 4 + 2x - 1 = -x + 10',
        spokenOverview: 'الدرس الثاني: قواعد حذف الأقواس المسبوقة بإشارة موجب أو سالب بدقة.'
      },
      {
        id: 'u3-l3',
        unitId: 'unit-3',
        unitNumber: 3,
        lessonNumber: 3,
        title: 'الدرس 3: اختزال عبارة رمزية',
        subtitle: 'تجميع الحدود المتشابهة وترتيب العبارة الجبرية تنازلياً',
        pages: 'ص 52 - 53',
        startPage: 52,
        endPage: 53,
        badge: 'درس منهجي 📘',
        summary: 'اختزال العبارة الجبرية يعني جمع الحدود المتشابهة (التي تملك نفس المتغير ونفس الأس) معاً.',
        keyRule: 'نجمع المعاملات العددية للحدود التي لها القسم الحرفي نفسه.',
        ruleEquation: 'ax + bx = (a + b)x | ax^2 + bx^2 = (a + b)x^2',
        exampleProblem: 'اختزل: C = 4x^2 - 3x + 7 - 2x^2 + 5x - 9',
        exampleSolution: 'C = (4 - 2)x^2 + (-3 + 5)x + (7 - 9) = 2x^2 + 2x - 2',
        spokenOverview: 'الدرس الثالث: اختزال العبارات الرمزية وتجميع الحدود المتشابهة وترتيبها.'
      },
      {
        id: 'u3-l4',
        unitId: 'unit-3',
        unitNumber: 4,
        lessonNumber: 4,
        title: 'الدرس 4: نشر (a + b)(c + d)',
        subtitle: 'توزيع الضرب على الجمع ونشر جداء حدانيتين وتطبيقاته الهندسية',
        pages: 'ص 54 - 57',
        startPage: 54,
        endPage: 57,
        badge: 'درس منهجي 📘',
        summary: 'نشر الجداء كحساب مجموع مساحات أربعة مستطيلات: (a + b)(c + d) = ac + ad + bc + bd.',
        keyRule: 'كل حد من القوس الأول يضرب في كل حد من القوس الثاني مع مراعاة الإشارات.',
        ruleEquation: '(a + b)(c + d) = ac + ad + bc + bd',
        exampleProblem: 'انشر واختزل: D = (2x + 3)(x - 4)',
        exampleSolution: 'D = 2x(x) + 2x(-4) + 3(x) + 3(-4) = 2x^2 - 8x + 3x - 12 = 2x^2 - 5x - 12',
        spokenOverview: 'الدرس الرابع: نشر جداء قوسين وتطبيقاته في الهندسة وحساب المساحات.'
      },
      {
        id: 'u3-l5',
        unitId: 'unit-3',
        unitNumber: 3,
        lessonNumber: 5,
        title: 'الدرس 5: اختبار مساواة رمزية',
        subtitle: 'التحقق من صحة متساوية من أجل قيم معينة للمتغيرات',
        pages: 'ص 58 - 60',
        startPage: 58,
        endPage: 60,
        badge: 'مهارة تفكير 💡',
        summary: 'اختبار صحة مساواة لحساب الطرف الأيمن على حدة والطرف الأيسر على حدة والمقارنة بينهما.',
        keyRule: 'المساواة تكون صحيحة إذا أعطى التعويض في كلا الطرفين نفس الناتج العددي.',
        ruleEquation: 'LHS = RHS ➔ المساواة محققة',
        exampleProblem: 'هل المساواة 3x + 2 = 5x - 4 صحيحة من أجل x = 3؟',
        exampleSolution: 'الطرف الأيسر: 3(3) + 2 = 11 | الطرف الأيمن: 5(3) - 4 = 11. الناتجان متساويان، فالمساواة صحيحة.',
        spokenOverview: 'الدرس الخامس: اختبار المساواة الرمزية والتحقق العددي من صحة العبارات الجبرية.'
      },
      {
        id: 'u3-rev',
        unitId: 'unit-3',
        unitNumber: 3,
        lessonNumber: 6,
        title: 'تدريبات ومسائل الوحدة الثالثة',
        subtitle: 'مسائل شاملة في النشر والاختزال وحساب المساحات المحيطات',
        pages: 'ص 61 - 66',
        startPage: 61,
        endPage: 66,
        badge: 'تدريبات وامتحانات 📝',
        summary: 'تدريبات مكثفة على النشر وحذف الأقواس وتطبيقات هندسية متقدمة في الحساب الحرفي.',
        keyRule: 'التطبيق المتسلسل لقواعد حذف الأقواس والنشر والاختزال بدقة متناهية.',
        ruleEquation: 'M = (3x - 2)^2 - (2x + 1)(3x - 2)',
        exampleProblem: 'انشر واختزل العبارة M.',
        exampleSolution: 'M = (9x^2 - 12x + 4) - (6x^2 - 4x + 3x - 2) = 3x^2 - 11x + 6',
        spokenOverview: 'تدريبات ومسائل الوحدة الثالثة الشاملة من صفحة 61 حتى 66.'
      }
    ]
  },

  // ==========================================================================
  // الوحدة الرابعة: معادلات من الدرجة الأولى (ص 67 - 83)
  // ==========================================================================
  {
    id: 'unit-4',
    number: 4,
    title: 'الوحدة الرابعة: معادلات من الدرجة الأولى',
    term: 'الفصل الثاني',
    icon: '⚖️',
    accentColor: 'purple',
    description: 'مفهوم المساواة والميزان، حل معادلات الدرجة الأولى بمجهول واحد، واصطناع وحل المسائل اللفظية.',
    pagesSpan: 'صفحة 67 - 83',
    startPage: 67,
    endPage: 83,
    lessons: [
      {
        id: 'u4-launch',
        unitId: 'unit-4',
        unitNumber: 4,
        lessonNumber: 0,
        title: 'انطلاقة نشطة: مفهوم التوازن والميزان',
        subtitle: 'الميزان ذو الكفتين في حالة توازن والتعبير عنه بمساواة',
        pages: 'ص 67',
        startPage: 67,
        endPage: 67,
        badge: 'تهيئة ومراجعة 🚀',
        summary: 'مفهوم التوازن الفيزيائي وكيفية ترجمته رياضياً إلى مساواة بين كفتي الميزان.',
        keyRule: 'توازن الكفتين يعبر عن تساوي المقدارين.',
        ruleEquation: 'الكفة اليمنى = الكفة اليسرى',
        exampleProblem: 'ميزان في إحدى كفتيه ثقلان كل منهما x وفي الأخرى 10 kg، ما قيمة x؟',
        exampleSolution: '2x = 10 ➔ x = 5 kg',
        spokenOverview: 'انطلاقة نشطة للوحدة الرابعة تركز على مفهوم التوازن والمساواة.'
      },
      {
        id: 'u4-l1',
        unitId: 'unit-4',
        unitNumber: 4,
        lessonNumber: 1,
        title: 'الدرس 1: مساواة وعمليات',
        subtitle: 'قواعد الجمع والطرح والضرب والقسمة على طرفي المساواة',
        pages: 'ص 68 - 71',
        startPage: 68,
        endPage: 71,
        badge: 'قاعدة جوهرية ⚡',
        summary: 'إذا أضفنا أو طرحنا نفس العدد من طرفي مساواة تبقى صحيحة، وكذلك إذا ضربنا أو قسمنا بعدد غير معدوم.',
        keyRule: 'إذا كان a = b فإن: a + c = b + c و a × c = b × c (c ≠ 0).',
        ruleEquation: 'a = b ➔ a + c = b + c | a = b ➔ a × c = b × c',
        exampleProblem: 'إذا كان x - 4 = 7، كيف نحصل على قيمة x باستخدام الخواص؟',
        exampleSolution: 'نضيف 4 للطرفين: x - 4 + 4 = 7 + 4 ➔ x = 11',
        spokenOverview: 'الدرس الأول من الوحدة الرابعة: خواص المساواة والعمليات الأربع المسموحة على طرفيها.'
      },
      {
        id: 'u4-l2',
        unitId: 'unit-4',
        unitNumber: 4,
        lessonNumber: 2,
        title: 'الدرس 2: حل معادلة',
        subtitle: 'عزل المجهول x ونقل الحدود وتغيير الإشارات',
        pages: 'ص 72 - 74',
        startPage: 72,
        endPage: 74,
        badge: 'درس منهجي 📘',
        summary: 'حل المعادلة ax + b = c بنقل الثابت b إلى الطرف الآخر وقسمة الطرفين على معامل المجهول a.',
        keyRule: 'كل حد ينتقل من طرف لآخر في المعادلة تتغير إشارته، والحل النهائي x = (c - b) / a.',
        ruleEquation: 'ax + b = c ➔ ax = c - b ➔ x = (c - b) / a',
        exampleProblem: 'حل المعادلة: 5x - 7 = 2x + 8',
        exampleSolution: '5x - 2x = 8 + 7 ➔ 3x = 15 ➔ x = 5',
        spokenOverview: 'الدرس الثاني: حل معادلات الدرجة الأولى بمجهول واحد وقواعد عزل المجهول.'
      },
      {
        id: 'u4-l3',
        unitId: 'unit-4',
        unitNumber: 4,
        lessonNumber: 3,
        title: 'الدرس 3: اصطناع معادلة',
        subtitle: 'ترجمة المسائل اللفظية إلى معادلات رياضية وحلها وتفسير الحل',
        pages: 'ص 75 - 77',
        startPage: 75,
        endPage: 77,
        badge: 'مهارة تطبيقية 💡',
        summary: 'خطوات حل المسألة: اختيار المجهول المناسب، صياغة المعادلة، حلها رياضياً، والتحقق من واقعية الناتج.',
        keyRule: 'ترجمة الكلمات: ضعف (2x)، ثلاثة أمثال (3x)، أزيد بـ 5 (x + 5)، عددان متتاليان (x و x + 1).',
        ruleEquation: 'x + (x + 1) + (x + 2) = 45 ➔ 3x = 42 ➔ x = 14',
        exampleProblem: 'أوجد ثلاثة أعداد طبيعية متتالية مجموعها 45.',
        exampleSolution: 'نفرض العدد الأصغر x: 3x + 3 = 45 ➔ 3x = 42 ➔ x = 14. الأعداد هي 14 و 15 و 16',
        spokenOverview: 'الدرس الثالث: اصطناع المعادلات ونمذجة المسائل الواقعية والتأكد من مطابقة الحل للشروط.'
      },
      {
        id: 'u4-rev',
        unitId: 'unit-4',
        unitNumber: 4,
        lessonNumber: 4,
        title: 'تدريبات ومسائل الوحدة الرابعة',
        subtitle: 'مسائل معادلات متنوعة وتطبيقات هندسية وفيزيائية',
        pages: 'ص 78 - 83',
        startPage: 78,
        endPage: 83,
        badge: 'تدريبات وامتحانات 📝',
        summary: 'تمارين مكثفة لحل معادلات تحتوي كسوراً وأقواساً ومسائل هندسية في المساحات والأطوال.',
        keyRule: 'التخلص من المقامات في المعادلة بالضرب في المضاعف المشترك الأصغر لجميع المقامات.',
        ruleEquation: '(x + 1)/2 - (x - 2)/3 = 5/6',
        exampleProblem: 'حل المعادلة السابقة بالتخلص من المقامات.',
        exampleSolution: 'نضرب الطرفين بـ 6: 3(x + 1) - 2(x - 2) = 5 ➔ 3x + 3 - 2x + 4 = 5 ➔ x + 7 = 5 ➔ x = -2',
        spokenOverview: 'تدريبات ومسائل الوحدة الرابعة الشاملة من صفحة 78 حتى 83.'
      }
    ]
  },

  // ==========================================================================
  // الوحدة الخامسة: النسبة والتناسب (ص 84 - 104)
  // ==========================================================================
  {
    id: 'unit-5',
    number: 5,
    title: 'الوحدة الخامسة: النسبة والتناسب',
    term: 'الفصل الثاني',
    icon: '📊',
    accentColor: 'rose',
    description: 'التناسب والتمثيل البياني، السرعة الوسطى وتحويل الوحدات، والنسبة المئوية وتطبيقاتها الحياتية.',
    pagesSpan: 'صفحة 84 - 104',
    startPage: 84,
    endPage: 104,
    lessons: [
      {
        id: 'u5-launch',
        unitId: 'unit-5',
        unitNumber: 5,
        lessonNumber: 0,
        title: 'انطلاقة نشطة: مفهوم النسبة وجدول التناسب',
        subtitle: 'مقارنة الكميات بالنسبة والتحقق من جداول التناسب',
        pages: 'ص 84',
        startPage: 84,
        endPage: 84,
        badge: 'تهيئة ومراجعة 🚀',
        summary: 'تذكير بمفهوم النسبة a/b ومعامل التناسب والتأكد من انتظام القيم في الجداول.',
        keyRule: 'الجدول يكون جدول تناسب إذا كان حاصل قسمة كل عدد من السطر الثاني على مقابله ثابتاً.',
        ruleEquation: 'y / x = k (معامل التناسب)',
        exampleProblem: 'هل الجدول التالي يمثل وضعية تناسب: x: [2, 4, 6] و y: [6, 12, 18]؟',
        exampleSolution: '6/2 = 3 ، 12/4 = 3 ، 18/6 = 3. النسب متساوية والمعامل k = 3 فالجدول يمثل تناسباً.',
        spokenOverview: 'انطلاقة نشطة للوحدة الخامسة في النسبة والتناسب وجداول التناسب.'
      },
      {
        id: 'u5-l1',
        unitId: 'unit-5',
        unitNumber: 5,
        lessonNumber: 1,
        title: 'الدرس 1: التناسب والتمثيل البياني',
        subtitle: 'معامل التناسب، الرابع المتناسب، والمستقيم المار بالمبدأ',
        pages: 'ص 85 - 89',
        startPage: 85,
        endPage: 89,
        badge: 'درس منهجي 📘',
        summary: 'التمثيل البياني للتناسب هو مستقيم يمر بمبدأ الإحداثيات (0, 0)، والرابع المتناسب يحسب بالجداء التقاطعي.',
        keyRule: 'الوضعية التناسبية تمثل بيانياً بنقاط متسامتة على مستقيم يمر بمبدأ المعلم O.',
        ruleEquation: 'a/b = c/d ➔ a × d = b × c ➔ d = (b × c) / a',
        exampleProblem: 'إذا كان ثمن 4 كتب 6000 ليرة، فما ثمن 7 كتب من نفس النوع؟',
        exampleSolution: 'معامل التناسب = 6000 / 4 = 1500 ليرة للكتاب. ثمن 7 كتب = 7 × 1500 = 10500 ليرة.',
        spokenOverview: 'الدرس الأول من الوحدة الخامسة: التناسب والتمثيل البياني وحساب الرابع المتناسب.'
      },
      {
        id: 'u5-l2',
        unitId: 'unit-5',
        unitNumber: 5,
        lessonNumber: 2,
        title: 'الدرس 2: السرعة الوسطى',
        subtitle: 'حساب السرعة، المسافة، الزمن، والتحويل بين km/h و m/s',
        pages: 'ص 90 - 94',
        startPage: 90,
        endPage: 94,
        badge: 'تطبيق فيزيائي 🚗',
        summary: 'السرعة الوسطى هي حاصل قسمة المسافة المقطوعة على الزمن المستغرق: v = d / t.',
        keyRule: 'v = d / t و d = v × t و t = d / v. للتحويل من km/h إلى m/s نقسم على 3.6.',
        ruleEquation: 'v = d / t | 1 km/h = (1000 m) / (3600 s) = (1 / 3.6) m/s',
        exampleProblem: 'قطعت سيارة مسافة 180 km في زمن 2.5 ساعة. ما سرعتها الوسطى بوحدة km/h ثم m/s؟',
        exampleSolution: 'v = 180 / 2.5 = 72 km/h. وبالمتر في الثانية: 72 ÷ 3.6 = 20 m/s.',
        spokenOverview: 'الدرس الثاني: السرعة الوسطى وقوانين المسافة والزمن والتحويل بين الوحدات الدولية.'
      },
      {
        id: 'u5-l3',
        unitId: 'unit-5',
        unitNumber: 5,
        lessonNumber: 3,
        title: 'الدرس 3: النسبة المئوية',
        subtitle: 'حساب النسب المئوية، التخفيضات التجارية، والزيادات المالية',
        pages: 'ص 95 - 96',
        startPage: 95,
        endPage: 96,
        badge: 'تطبيق عملي 💰',
        summary: 'تطبيقات النسبة المئوية في الاقتصاد: حساب التخفيض والسعر النهائي بعد الحسم أو الزيادة.',
        keyRule: 'مقدار التخفيض = السعر الأصلي × (النسبة / 100). السعر بعد التخفيض = الأصلي - التخفيض.',
        ruleEquation: 'Discount = Price × (P / 100) | Final = Price × (1 - P / 100)',
        exampleProblem: 'معطف سعره 50000 ليرة، خُفض بنسبة 20%. ما سعره الجديد؟',
        exampleSolution: 'التخفيض = 50000 × 0.20 = 10000 ليرة. السعر الجديد = 50000 - 10000 = 40000 ليرة.',
        spokenOverview: 'الدرس الثالث: النسبة المئوية وتطبيقات التخفيض والربح والزيادة المئوية.'
      },
      {
        id: 'u5-rev',
        unitId: 'unit-5',
        unitNumber: 5,
        lessonNumber: 4,
        title: 'تدريبات ومسائل الوحدة الخامسة',
        subtitle: 'مسائل التناسب والسرعة والنسب المئوية المركبة',
        pages: 'ص 97 - 104',
        startPage: 97,
        endPage: 104,
        badge: 'تدريبات وامتحانات 📝',
        summary: 'مسائل حركة قطارات وسيارتين باتجاهين متعاكسين وتطبيقات المقاييس والخرائط الجغرافية.',
        keyRule: 'مقياس الرسم = المسافة على الخريطة / المسافة الحقيقية في الواقع (بنفس واحدة القياس).',
        ruleEquation: 'Scale = Map Distance / Real Distance',
        exampleProblem: 'مسافة بين مدينتين 150 km، كم سنتيمتراً تمثلها على خارطة بمقياس 1/1000000؟',
        exampleSolution: '150 km = 15000000 cm. على الخريطة = 15000000 × (1 / 1000000) = 15 cm.',
        spokenOverview: 'تدريبات ومسائل الوحدة الخامسة الشاملة من صفحة 97 حتى 104.'
      }
    ]
  },

  // ==========================================================================
  // الوحدة السادسة: الإحصاء (ص 105 - 124)
  // ==========================================================================
  {
    id: 'unit-6',
    number: 6,
    title: 'الوحدة السادسة: الإحصاء',
    term: 'الفصل الثاني',
    icon: '📈',
    accentColor: 'teal',
    description: 'الجداول التكرارية، التكرار المتجمع، تمثيل البيانات بالمخططات، والمتوسط الحسابي ومقاييس النزعة.',
    pagesSpan: 'صفحة 105 - 124',
    startPage: 105,
    endPage: 124,
    lessons: [
      {
        id: 'u6-launch',
        unitId: 'unit-6',
        unitNumber: 6,
        lessonNumber: 0,
        title: 'انطلاقة نشطة: جمع البيانات الإحصائية',
        subtitle: 'المفردات الإحصائية، المدى، والتكرار البسيط',
        pages: 'ص 105',
        startPage: 105,
        endPage: 105,
        badge: 'تهيئة ومراجعة 🚀',
        summary: 'مراجعة أساليب جمع البيانات وتنظيمها وترتيبها تصاعدياً لحساب المدى.',
        keyRule: 'المدى هو الفرق بين أكبر مفردة وأصغر مفردة في العينة الإحصائية.',
        ruleEquation: 'المدى = أكبر قيمة - أصغر قيمة',
        exampleProblem: 'احسب مدى البيانات: [12, 18, 9, 25, 14, 20]',
        exampleSolution: 'الترتيب: 9, 12, 14, 18, 20, 25. المدى = 25 - 9 = 16.',
        spokenOverview: 'انطلاقة نشطة للوحدة السادسة في الإحصاء وتنظيم المفردات وحساب المدى.'
      },
      {
        id: 'u6-l1',
        unitId: 'unit-6',
        unitNumber: 6,
        lessonNumber: 1,
        title: 'الدرس 1: الجدول التكراري وجدول الفئات',
        subtitle: 'تفريغ البيانات في فئات، مركز الفئة، وطول الفئة',
        pages: 'ص 106 - 108',
        startPage: 106,
        endPage: 108,
        badge: 'درس منهجي 📘',
        summary: 'عندما تكون البيانات كثيرة يتم تجميعها في فئات إحصائية وحساب طول كل فئة ومركزها.',
        keyRule: 'مركز الفئة [a, b[ = (a + b) / 2 ، وطول الفئة = b - a.',
        ruleEquation: 'مركز الفئة = (الحد الأدنى + الحد الأعلى) / 2',
        exampleProblem: 'ما هو مركز وطول الفئة [12, 16[؟',
        exampleSolution: 'المركز = (12 + 16) / 2 = 14 | الطول = 16 - 12 = 4.',
        spokenOverview: 'الدرس الأول من الوحدة السادسة: الجداول التكرارية وجداول الفئات ومراكز الفئات.'
      },
      {
        id: 'u6-l2',
        unitId: 'unit-6',
        unitNumber: 6,
        lessonNumber: 2,
        title: 'الدرس 2: التكرار المتجمع (التراكمي)',
        subtitle: 'التكرار المتجمع الصاعد والتواتر التراكمي بالنسبة المئوية',
        pages: 'ص 109 - 110',
        startPage: 109,
        endPage: 110,
        badge: 'قاعدة جوهرية ⚡',
        summary: 'التكرار المتجمع الصاعد لقيمة هو مجموع تكرارات هذه القيمة وجميع القيم التي تسبقها.',
        keyRule: 'التكرار التراكمي الأخير يساوي دائماً حجم العينة الكلي N.',
        ruleEquation: 'التكرار المتجمع = مجموع تكرارات الفئات السابقة حتى الفئة الحالية',
        exampleProblem: 'عينة تكراراتها: 4, 7, 5, 4. ما جدول التكرار المتجمع الصاعد؟',
        exampleSolution: 'التكرارات التراكمية هي: 4 ، 11 ، 16 ، 20 (حيث 20 هو المجموع الكلي).',
        spokenOverview: 'الدرس الثاني: التكرار المتجمع الصاعد والتواترات التراكمية في التحليل الإحصائي.'
      },
      {
        id: 'u6-l3',
        unitId: 'unit-6',
        unitNumber: 6,
        lessonNumber: 3,
        title: 'الدرس 3: تمثيل بيانات إحصائية',
        subtitle: 'المخطط الشريطي، المدرج التكراري، المضلع التكراري، والقطاع الدائري',
        pages: 'ص 111 - 113',
        startPage: 111,
        endPage: 113,
        badge: 'درس منهجي 📘',
        summary: 'تمثيل البيانات بالرسوم البيانية وتوزيع زوايا القطاعات الدائرية بما يتناسب مع التكرارات.',
        keyRule: 'زاوية القطاع الدائري = (تكرار الفئة / المجموع الكلي N) × 360°.',
        ruleEquation: 'Angle = (Frequency / N) × 360°',
        exampleProblem: 'فئة تكرارها 15 من عينة حجمها 60 شخصاً. ما قياس زاوية قطاعها الدائري؟',
        exampleSolution: 'الزاوية = (15 / 60) × 360° = (1 / 4) × 360° = 90° (زاوية قائمة).',
        spokenOverview: 'الدرس الثالث: التمثيل البياني للإحصاء بالمدرجات والأعمدة والقطاعات الدائرية.'
      },
      {
        id: 'u6-l4',
        unitId: 'unit-6',
        unitNumber: 6,
        lessonNumber: 4,
        title: 'الدرس 4: المتوسط الحسابي',
        subtitle: 'المتوسط البسيط، المتوسط المرجح بالتكرارات، وحساب متوسط الفئات',
        pages: 'ص 114 - 118',
        startPage: 114,
        endPage: 118,
        badge: 'قاعدة جوهرية ⚡',
        summary: 'المتوسط الحسابي x̄ هو مجموع جداءات كل قيمة في تكرارها مقسوماً على مجموع التكرارات.',
        keyRule: 'x̄ = (x1·f1 + x2·f2 + ... + xk·fk) / N. وفي الفئات نستبدل xi بمركز الفئة.',
        ruleEquation: 'x̄ = Σ(xi × fi) / N',
        exampleProblem: 'احسب المتوسط الحسابي للدرجات: 10 (تكرار 2)، 15 (تكرار 5)، 20 (تكرار 3).',
        exampleSolution: 'x̄ = (10×2 + 15×5 + 20×3) / (2 + 5 + 3) = (20 + 75 + 60) / 10 = 155 / 10 = 15.5',
        spokenOverview: 'الدرس الرابع: المتوسط الحسابي البسيط والمرجح بالتكرارات وحساب متوسط الفئات الإحصائية.'
      },
      {
        id: 'u6-rev',
        unitId: 'unit-6',
        unitNumber: 6,
        lessonNumber: 5,
        title: 'تدريبات ومسائل الوحدة السادسة',
        subtitle: 'مسائل إحصائية شاملة ومقارنة عينات ومشاريع بحثية',
        pages: 'ص 119 - 124',
        startPage: 119,
        endPage: 124,
        badge: 'تدريبات وامتحانات 📝',
        summary: 'مسائل شاملة تجمع بين الجداول التكرارية والمخططات البيانية وحساب المتوسط والوسيط والمدى.',
        keyRule: 'التحليل المتكامل للظواهر الإحصائية واستخراج المؤشرات العددية والبيانية بدقة.',
        ruleEquation: 'تحليل إحصائي شامل للعينات والمجتمعات',
        exampleProblem: 'دراسة توزيع رواتب 100 موظف، حساب المتوسط الحسابي والقطاع الدائري لأصحاب الرواتب العليا.',
        exampleSolution: 'حساب مراكز الفئات وجداءات التكرار وتحديد فئة الرواتب الأكثر شيوعاً.',
        spokenOverview: 'تدريبات ومسائل الوحدة السادسة من صفحة 119 حتى صفحة 124 خاتمة كتاب الجبر السوري.'
      }
    ]
  }
];

export { SYRIAN_GEOMETRY_UNITS };

// ============================================================================
// سجل الكتب المدرسية الموحّد (BOOKS_CATALOG)
// لإضافة أي كتاب جديد للصف الثامن مستقبلاً: أضف عنصراً واحداً هنا مع وحداته ومجلد صفحاته المصورة،
// وسيرث تلقائياً الفهرس الرئيسي، شريط التنقل، قارئ كتاب الوزارة المكبّر والمصوّر، السبورة، والعمل أوفلاين.
// ============================================================================
export const BOOKS_CATALOG: BookConfig[] = [
  {
    id: 'algebra',
    title: 'الرياضيات — الجبر',
    shortTitle: 'الجبر',
    subjectLabel: 'الجبر',
    cardBadge: 'الكتاب الأول · الفصلان الأول والثاني',
    termSummary: 'الفصلان الأول والثاني',
    description:
      'الأعداد العادية والعمليات عليها، قوى الأعداد العادية والجذور، الحساب بالرموز، معادلات الدرجة الأولى، النسبة والتناسب، وتنظيم المعطيات والإحصاء.',
    coverImage: '/textbook_pages/page_001.jpg',
    scanBaseDir: '/textbook_pages',
    totalPages: 124,
    lessonIdPrefix: 'u',
    defaultLessonId: 'u1-l1',
    returnToFirstLabel: 'العودة للدرس 1 (جمع وطرح الأعداد العادية)',
    accentTheme: 'amber',
    units: SYRIAN_ALGEBRA_UNITS,
  },
  {
    id: 'geometry',
    title: 'الرياضيات — الهندسة',
    shortTitle: 'الهندسة',
    subjectLabel: 'الهندسة',
    cardBadge: 'الكتاب الثاني · الفصلان الأول والثاني',
    termSummary: 'الفصلان الأول والثاني',
    description:
      'متوازيات الأضلاع والانسحاب وتطابق المثلثات، منتصفات الأضلاع وتساوي ثلاث نسب، المستقيمات المميزة، المثلث القائم وفيثاغورث والدائرة، والهرم والمخروط الدوراني.',
    coverImage: '/geometry_pages/page_001.jpg',
    scanBaseDir: '/geometry_pages',
    totalPages: 116,
    lessonIdPrefix: 'g-',
    defaultLessonId: 'g-u1-l1',
    returnToFirstLabel: 'العودة للدرس 1 (الانسحاب وخواصه)',
    accentTheme: 'teal',
    units: SYRIAN_GEOMETRY_UNITS,
  },
];

export const ALL_CURRICULUM_UNITS: CurriculumUnit[] = BOOKS_CATALOG.flatMap((book) => book.units);

export const getBookById = (bookId: string): BookConfig =>
  BOOKS_CATALOG.find((book) => book.id === bookId) || BOOKS_CATALOG[0];

export const getBookForLesson = (lessonId: string): BookConfig => {
  const byOwnership = BOOKS_CATALOG.find((book) =>
    book.units.some((unit) => unit.lessons.some((lesson) => lesson.id === lessonId))
  );
  if (byOwnership) return byOwnership;

  const byPrefix = BOOKS_CATALOG.find((book) =>
    book.lessonIdPrefix !== 'u' && lessonId.startsWith(book.lessonIdPrefix)
  );
  if (byPrefix) return byPrefix;

  return BOOKS_CATALOG[0];
};

export const getLessonSubject = (lessonId: string): CurriculumSubject =>
  getBookForLesson(lessonId).id;

export const getTextbookScanUrl = (lessonId: string, pageNumber: number): string => {
  const book = getBookForLesson(lessonId);
  const clamped = Math.min(book.totalPages, Math.max(1, Math.round(pageNumber || 1)));
  return `${book.scanBaseDir}/page_${String(clamped).padStart(3, '0')}.jpg`;
};

// Helper to look up any lesson by ID across all registered books in BOOKS_CATALOG
export const getCurriculumLessonById = (id: string): CurriculumLesson | undefined => {
  for (const unit of ALL_CURRICULUM_UNITS) {
    const found = unit.lessons.find(l => l.id === id);
    if (found) return found;
  }
  return undefined;
};
