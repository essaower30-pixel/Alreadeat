// Audio Timeline Service for Unique Position-Based / Key-Based Highlighting
// Maps exact audio playback timeline (sentence index + intra-sentence progress ratio)
// to a SINGLE unique token key, preventing duplicate numbers across the page from highlighting together.

export type AudioTimelineContext = 'board' | 'book' | 'mobile-board' | 'mobile-book';

interface TokenTimeSlot {
  sentenceIdx: number;
  minProgress?: number; // 0.0 - 1.0 (default 0.0)
  maxProgress?: number; // 0.0 - 1.0 (default 1.0)
  tokenKey: string;
}

// -------------------------------------------------------------
// CHALKBOARD TIMELINE (BOARD_PAGES_DATA)
// -------------------------------------------------------------
const BOARD_TIMELINES: Record<number, TokenTimeSlot[]> = {
  // Page 5 (Book Page 5 - Board Page 0)
  0: [
    // Sentence 4: عندما جمع الطالبان باسم وهاشم ناقص تسعة على سبعة مع خمسة على سبعة،
    { sentenceIdx: 4, minProgress: 0.0, maxProgress: 0.52, tokenKey: 'b-p0-l3-0' }, // (-9 / 7)
    { sentenceIdx: 4, minProgress: 0.52, maxProgress: 1.0, tokenKey: 'b-p0-l3-2' },  // (5 / 7)
    // Sentence 5: احتفظا بالمقام المشترك سبعة،
    { sentenceIdx: 5, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'b-p0-l5-0-den' }, // 7 (المقام)
    // Sentence 6: وجمعا البسطين: ناقص تسعة زائد خمسة يساوي ناقص أربعة،
    { sentenceIdx: 6, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'b-p0-l5-0-num' }, // -9 + 5 (البسطين)
    // Sentence 7: فالناتج ناقص أربعة على سبعة.
    { sentenceIdx: 7, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'b-p0-l5-2' },   // -4 / 7
    // Sentence 9: لحساب نصف زائد خمسة أثمان،
    { sentenceIdx: 9, minProgress: 0.0, maxProgress: 0.52, tokenKey: 'b-p0-l8-0' }, // 1/2
    { sentenceIdx: 9, minProgress: 0.52, maxProgress: 1.0, tokenKey: 'b-p0-l8-2' },  // 5/8
    // Sentence 11: فنضرب بسط ومقام النصف في أربعة لنحصل على أربعة أثمان،
    { sentenceIdx: 11, minProgress: 0.0, maxProgress: 0.55, tokenKey: 'b-p0-l10-0' }, // (1 × 4) / (2 × 4)
    { sentenceIdx: 11, minProgress: 0.55, maxProgress: 1.0, tokenKey: 'b-p0-l10-2' },  // 4/8
    // Sentence 12: ومجموع أربعة أثمان زائد خمسة أثمان يعطينا تسعة أثمان.
    { sentenceIdx: 12, minProgress: 0.0, maxProgress: 0.38, tokenKey: 'b-p0-l11-2' },  // 4/8
    { sentenceIdx: 12, minProgress: 0.38, maxProgress: 0.68, tokenKey: 'b-p0-l11-4' }, // 5/8
    { sentenceIdx: 12, minProgress: 0.68, maxProgress: 1.0, tokenKey: 'b-p0-l11-8' },  // 9/8
    // Sentence 15: لحساب ناقص نصف زائد خمسة أثلاث،
    { sentenceIdx: 15, minProgress: 0.0, maxProgress: 0.52, tokenKey: 'b-p0-l14-0' }, // -1/2
    { sentenceIdx: 15, minProgress: 0.52, maxProgress: 1.0, tokenKey: 'b-p0-l14-2' },  // 5/3
    // Sentence 17: نضرب الكسر الأول في ثلاثة فيصبح ناقص ثلاثة على ستة،
    { sentenceIdx: 17, minProgress: 0.45, maxProgress: 1.0, tokenKey: 'b-p0-l16-4' }, // -3/6
    // Sentence 18: ونضرب الثاني في اثنين فيصبح عشرة على ستة،
    { sentenceIdx: 18, minProgress: 0.45, maxProgress: 1.0, tokenKey: 'b-p0-l16-10' }, // 10/6
    // Sentence 19: والمجموع ناقص ثلاثة زائد عشرة يعطي سبعة على ستة.
    { sentenceIdx: 19, minProgress: 0.0, maxProgress: 0.55, tokenKey: 'b-p0-l17-6' }, // (-3 + 10) / 6
    { sentenceIdx: 19, minProgress: 0.55, maxProgress: 1.0, tokenKey: 'b-p0-l17-8' },  // 7/6
  ],

  // Page 6 (Book Page 6 - Board Page 1)
  1: [
    // Sentence 2: والقانون الرياضي هو: a على b زائد c على b يساوي a زائد c الكل على b،
    { sentenceIdx: 2, minProgress: 0.35, maxProgress: 0.58, tokenKey: 'b-p1-l3-0' }, // a/b
    { sentenceIdx: 2, minProgress: 0.58, maxProgress: 0.78, tokenKey: 'b-p1-l3-2' }, // c/b
    { sentenceIdx: 2, minProgress: 0.78, maxProgress: 1.0, tokenKey: 'b-p1-l3-4' },  // (a + c) / b
    // Sentence 3: وكذلك لطرح الكسور: a على b ناقص c على b يساوي a ناقص c الكل على b.
    { sentenceIdx: 3, minProgress: 0.3, maxProgress: 0.55, tokenKey: 'b-p1-l3-6' },  // a/b
    { sentenceIdx: 3, minProgress: 0.55, maxProgress: 0.78, tokenKey: 'b-p1-l3-8' }, // c/b
    { sentenceIdx: 3, minProgress: 0.78, maxProgress: 1.0, tokenKey: 'b-p1-l3-10' }, // (a - c) / b
    // Sentence 4: مثل ناقص سبعة على ثلاثة زائد نصف على ثلاثة يساوي ناقص ستة ونصف على ثلاثة.
    { sentenceIdx: 4, minProgress: 0.0, maxProgress: 0.35, tokenKey: 'b-p1-l4-0' }, // (-7)/3
    { sentenceIdx: 4, minProgress: 0.35, maxProgress: 0.68, tokenKey: 'b-p1-l4-2' }, // 0.5/3
    { sentenceIdx: 4, minProgress: 0.68, maxProgress: 1.0, tokenKey: 'b-p1-l4-6' },  // -6.5 / 3
    // Sentence 5: ومثال آخر: خمس ناقص ثلاثة أخماس يساوي ناقص خمسان.
    { sentenceIdx: 5, minProgress: 0.0, maxProgress: 0.38, tokenKey: 'b-p1-l5-0' }, // 1/5
    { sentenceIdx: 5, minProgress: 0.38, maxProgress: 0.68, tokenKey: 'b-p1-l5-2' }, // 3/5
    { sentenceIdx: 5, minProgress: 0.68, maxProgress: 1.0, tokenKey: 'b-p1-l5-6' },  // -2/5
    // Sentence 9: مثل خمسة أسداس زائد ثلاثة أرباع،
    { sentenceIdx: 9, minProgress: 0.0, maxProgress: 0.52, tokenKey: 'b-p1-l9-0' }, // 5/6
    { sentenceIdx: 9, minProgress: 0.52, maxProgress: 1.0, tokenKey: 'b-p1-l9-2' },  // 3/4
    // Sentence 11: فيصبح الكسران عشرة على اثني عشر زائد تسعة على اثني عشر،
    { sentenceIdx: 11, minProgress: 0.0, maxProgress: 0.52, tokenKey: 'b-p1-l10-2' }, // 10/12
    { sentenceIdx: 11, minProgress: 0.52, maxProgress: 1.0, tokenKey: 'b-p1-l10-6' },  // 9/12
    // Sentence 12: ومجموعهما تسعة عشر على اثني عشر.
    { sentenceIdx: 12, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'b-p1-l11-6' },  // 19/12
    // Sentence 13: وأخيراً فقرة اكتساب المعارف لحساب سلسلة العمليات A تساوي خمسة على ثلاثة ناقص سبعة على ستة زائد ثلاثة على ثمانية.
    { sentenceIdx: 13, minProgress: 0.45, maxProgress: 0.65, tokenKey: 'b-p1-l14-2' }, // 5/3
    { sentenceIdx: 13, minProgress: 0.65, maxProgress: 0.85, tokenKey: 'b-p1-l14-4' }, // 7/6
    { sentenceIdx: 13, minProgress: 0.85, maxProgress: 1.0, tokenKey: 'b-p1-l14-6' },  // 3/8
    // Sentence 15: نوحد الكسور الثلاثة: أربعون على أربعة وعشرين ناقص ثمانية وعشرين على أربعة وعشرين زائد تسعة على أربعة وعشرين،
    { sentenceIdx: 15, minProgress: 0.25, maxProgress: 0.52, tokenKey: 'b-p1-l16-2' }, // 40/24
    { sentenceIdx: 15, minProgress: 0.52, maxProgress: 0.78, tokenKey: 'b-p1-l16-4' }, // 28/24
    { sentenceIdx: 15, minProgress: 0.78, maxProgress: 1.0, tokenKey: 'b-p1-l16-6' },  // 9/24
    // Sentence 16: فيكون الناتج واحد وعشرون على أربعة وعشرين.
    { sentenceIdx: 16, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'b-p1-l17-4' },  // 21 / 24
    // Sentence 17: ونختصر بقسمة البسط والمقام على ثلاثة فنحصل على أبسط كسر عادي وهو سبعة على ثمانية.
    { sentenceIdx: 17, minProgress: 0.0, maxProgress: 0.55, tokenKey: 'b-p1-l18-2' }, // (21 ÷ 3) / (24 ÷ 3)
    { sentenceIdx: 17, minProgress: 0.55, maxProgress: 1.0, tokenKey: 'b-p1-l18-4' },  // 7/8
  ],

  // Page 7 (Book Page 7 - Board Page 2)
  2: [
    // Sentence 1: نبدأ أولاً بفقرة تحقق من فهمك: لحساب خمسة أتساع زائد ثلث،
    { sentenceIdx: 1, minProgress: 0.5, maxProgress: 0.78, tokenKey: 'b-p2-l3-1' },  // 5/9
    { sentenceIdx: 1, minProgress: 0.78, maxProgress: 1.0, tokenKey: 'b-p2-l3-3' },  // 1/3
    // Sentence 2: نضرب الثلث في ثلاثة ليصبح ثلاثة أتساع،
    { sentenceIdx: 2, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'b-p2-l3-7' },   // 3/9
    // Sentence 3: والناتج ثمانية أتساع.
    { sentenceIdx: 3, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'b-p2-l3-9' },   // 8/9
    // Sentence 4: ولحساب ناقص سبعة أخماس زائد ناقص ثلاثة أخماس،
    { sentenceIdx: 4, minProgress: 0.35, maxProgress: 0.7, tokenKey: 'b-p2-l4-1' },  // (-7/5)
    { sentenceIdx: 4, minProgress: 0.7, maxProgress: 1.0, tokenKey: 'b-p2-l4-3' },   // (-3/5)
    // Sentence 6: نجمع ناقص سبعة مع ناقص ثلاثة فنحصل على ناقص عشرة على خمسة،
    { sentenceIdx: 6, minProgress: 0.0, maxProgress: 0.55, tokenKey: 'b-p2-l4-5' },  // (-7 - 3)/5
    { sentenceIdx: 6, minProgress: 0.55, maxProgress: 1.0, tokenKey: 'b-p2-l4-7' },  // -10/5
    // Sentence 7: أي ناقص اثنين تماماً.
    { sentenceIdx: 7, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'b-p2-l4-9' },   // -2
    // Sentence 8: التمرين الثالث: أربعة أسباع ناقص عُشر على سبعة يساوي ثلاثة فاصل تسعة على سبعة.
    { sentenceIdx: 8, minProgress: 0.25, maxProgress: 0.48, tokenKey: 'b-p2-l5-1' }, // 4/7
    { sentenceIdx: 8, minProgress: 0.48, maxProgress: 0.7, tokenKey: 'b-p2-l5-3' },  // 0.1/7
    { sentenceIdx: 8, minProgress: 0.7, maxProgress: 1.0, tokenKey: 'b-p2-l5-7' },   // 3.9/7
    // Sentence 9: التمرين الرابع: ثلاثة عشر على ناقص ستة زائد ناقص خمسة أسداس يساوي ناقص ثمانية عشر على ستة،
    { sentenceIdx: 9, minProgress: 0.25, maxProgress: 0.5, tokenKey: 'b-p2-l6-1' },  // 13/(-6)
    { sentenceIdx: 9, minProgress: 0.5, maxProgress: 0.72, tokenKey: 'b-p2-l6-3' },  // (-5/6)
    { sentenceIdx: 9, minProgress: 0.72, maxProgress: 1.0, tokenKey: 'b-p2-l6-9' },  // -18/6
    // Sentence 10: أي ناقص ثلاثة تماماً.
    { sentenceIdx: 10, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'b-p2-l6-11' }, // -3
    // Sentence 12: لحساب خمسة أثمان ناقص سدس،
    { sentenceIdx: 12, minProgress: 0.35, maxProgress: 0.7, tokenKey: 'b-p2-l9-0' }, // 5/8
    { sentenceIdx: 12, minProgress: 0.7, maxProgress: 1.0, tokenKey: 'b-p2-l9-2' },  // 1/6
    // Sentence 14: خمسة عشر على أربعة وعشرين ناقص أربعة على أربعة وعشرين يساوي أحد عشر على أربعة وعشرين.
    { sentenceIdx: 14, minProgress: 0.0, maxProgress: 0.38, tokenKey: 'b-p2-l10-1' }, // 15/24
    { sentenceIdx: 14, minProgress: 0.38, maxProgress: 0.7, tokenKey: 'b-p2-l10-3' },  // 4/24
    { sentenceIdx: 14, minProgress: 0.7, maxProgress: 1.0, tokenKey: 'b-p2-l10-5' },  // 11/24
    // Sentence 15: ولحساب خمسة على ثلاثة ناقص سبعة على أربعة،
    { sentenceIdx: 15, minProgress: 0.35, maxProgress: 0.7, tokenKey: 'b-p2-l11-0' }, // 5/3
    { sentenceIdx: 15, minProgress: 0.7, maxProgress: 1.0, tokenKey: 'b-p2-l11-2' },  // 7/4
    // Sentence 17: عشرون على اثني عشر ناقص واحد وعشرون على اثني عشر يساوي ناقص واحد على اثني عشر.
    { sentenceIdx: 17, minProgress: 0.0, maxProgress: 0.38, tokenKey: 'b-p2-l12-1' }, // 20/12
    { sentenceIdx: 17, minProgress: 0.38, maxProgress: 0.7, tokenKey: 'b-p2-l12-3' },  // 21/12
    { sentenceIdx: 17, minProgress: 0.7, maxProgress: 1.0, tokenKey: 'b-p2-l12-5' },  // -1/12
    // Sentence 19: مسألة عصير زينة: خلطت ثلاثة أخماس ليتر تفاح مع ستة أخماس ليتر عنب لملء وعاء سعته ليتران،
    { sentenceIdx: 19, minProgress: 0.25, maxProgress: 0.55, tokenKey: 'b-p2-l15-4' }, // 3/5 L
    { sentenceIdx: 19, minProgress: 0.55, maxProgress: 0.8, tokenKey: 'b-p2-l15-9' },  // 6/5 L
    { sentenceIdx: 19, minProgress: 0.8, maxProgress: 1.0, tokenKey: 'b-p2-l15-14' },  // 2 L
    // Sentence 20: كم ليتراً من عصير الموز تحتاج إضافته؟ أولاً نجمع التفاح والعنب...
    { sentenceIdx: 20, minProgress: 0.45, maxProgress: 0.65, tokenKey: 'b-p2-l16-5' }, // 3/5
    { sentenceIdx: 20, minProgress: 0.65, maxProgress: 0.82, tokenKey: 'b-p2-l16-7' }, // 6/5
    { sentenceIdx: 20, minProgress: 0.82, maxProgress: 1.0, tokenKey: 'b-p2-l16-9' },  // 9/5 L
    // Sentence 21: ثانياً سعة الوعاء ليتران أي عشرة أخماس ليتر.
    { sentenceIdx: 21, minProgress: 0.0, maxProgress: 0.55, tokenKey: 'b-p2-l17-8' }, // 2
    { sentenceIdx: 21, minProgress: 0.55, maxProgress: 1.0, tokenKey: 'b-p2-l17-10' }, // 10/5 L
    // Sentence 22: ثالثاً نطرح: عشرة أخماس ناقص تسعة أخماس يساوي خمس ليتر.
    { sentenceIdx: 22, minProgress: 0.15, maxProgress: 0.45, tokenKey: 'b-p2-l18-4' }, // 10/5
    { sentenceIdx: 22, minProgress: 0.45, maxProgress: 0.75, tokenKey: 'b-p2-l18-6' }, // 9/5
    { sentenceIdx: 22, minProgress: 0.75, maxProgress: 1.0, tokenKey: 'b-p2-l18-8' },  // 1/5 ليتر
    // Sentence 23: إذن تحتاج زينة لإضافة خمس ليتر من عصير الموز.
    { sentenceIdx: 23, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'b-p2-l18-8' },   // 1/5 ليتر
  ]
};

// -------------------------------------------------------------
// TEXTBOOK TIMELINE (PAGE_AUDIO_NARRATIONS)
// -------------------------------------------------------------
const BOOK_TIMELINES: Record<number, TokenTimeSlot[]> = {
  // Page 5 (Book Page 0)
  0: [
    // Sentence 5: حيث قام الطالبان باسم وهاشم بجمع ناقص تسعة على سبعة مع خمسة على سبعة،
    { sentenceIdx: 5, minProgress: 0.35, maxProgress: 0.7, tokenKey: 'read-p0-eq-c1-0' }, // (-9 / 7)
    { sentenceIdx: 5, minProgress: 0.7, maxProgress: 1.0, tokenKey: 'read-p0-eq-c1-2' },  // (5 / 7)
    // Sentence 6: والقاعدة هنا واضحة: نحتفظ بالمقام المشترك سبعة ونجمع البسطين: ناقص تسعة زائد خمسة يساوي ناقص أربعة،
    { sentenceIdx: 6, minProgress: 0.5, maxProgress: 1.0, tokenKey: 'read-p0-eq-c1-4' },  // (-9 + 5) / 7
    // Sentence 7: فيكون الناتج النهائي ناقص أربعة على سبعة.
    { sentenceIdx: 7, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'read-p0-eq-c1-6' },  // -4 / 7
    // Sentence 9: لحساب نصف زائد خمسة أثمان،
    { sentenceIdx: 9, minProgress: 0.2, maxProgress: 0.6, tokenKey: 'read-p0-eq-c2-0' },  // 1/2
    { sentenceIdx: 9, minProgress: 0.6, maxProgress: 1.0, tokenKey: 'read-p0-eq-c2-2' },  // 5/8
    // Sentence 11: لذا نوحد المقامات بضرب بسط ومقام النصف بالعدد أربعة ليصبح أربعة على ثمانية،
    { sentenceIdx: 11, minProgress: 0.0, maxProgress: 0.55, tokenKey: 'read-p0-eq-c2-4' }, // (1 × 4) / (2 × 4)
    { sentenceIdx: 11, minProgress: 0.55, maxProgress: 1.0, tokenKey: 'read-p0-eq-c2-8' },  // 4/8
    // Sentence 12: ثم نجمع أربعة زائد خمسة فنحصل على تسعة أثمان.
    { sentenceIdx: 12, minProgress: 0.5, maxProgress: 1.0, tokenKey: 'read-p0-eq-c2-12' }, // 9/8
    // Sentence 16: نضرب الكسر الأول في ثلاثة فيصبح ناقص ثلاثة على ستة،
    { sentenceIdx: 16, minProgress: 0.45, maxProgress: 1.0, tokenKey: 'read-p0-eq-c3-0' }, // -3/6
    // Sentence 17: ونضرب الكسر الثاني في اثنين فيصبح عشرة على ستة،
    { sentenceIdx: 17, minProgress: 0.45, maxProgress: 1.0, tokenKey: 'read-p0-eq-c3-2' }, // 10/6
    // Sentence 18: ثم نجمع: ناقص ثلاثة زائد عشرة يساوي سبعة،
    { sentenceIdx: 18, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'read-p0-eq-c3-4' },  // (-3 + 10) / 6
    // Sentence 19: فيكون الناتج سبعة على ستة.
    { sentenceIdx: 19, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'read-p0-eq-c3-6' },  // 7/6
  ],

  // Page 6 (Book Page 1) - Aligned 100% with exact normalized sentence indices (0..21)
  1: [
    // Sentence 4: والقانون الرياضي هو: a على b زائد c على b يساوي a زائد c الكل على b،
    { sentenceIdx: 4, minProgress: 0.35, maxProgress: 0.58, tokenKey: 'read-p1-rule1-def-0' }, // a/b
    { sentenceIdx: 4, minProgress: 0.58, maxProgress: 0.78, tokenKey: 'read-p1-rule1-def-2' }, // c/b
    { sentenceIdx: 4, minProgress: 0.78, maxProgress: 1.0, tokenKey: 'read-p1-rule1-def-4' },  // (a + c) / b
    // Sentence 5: وكذلك لطرح الكسور: a على b ناقص c على b يساوي a ناقص c الكل على b.
    { sentenceIdx: 5, minProgress: 0.3, maxProgress: 0.55, tokenKey: 'read-p1-rule1-def-6' },  // a/b
    { sentenceIdx: 5, minProgress: 0.55, maxProgress: 0.78, tokenKey: 'read-p1-rule1-def-8' }, // c/b
    { sentenceIdx: 5, minProgress: 0.78, maxProgress: 1.0, tokenKey: 'read-p1-rule1-def-10' }, // (a - c) / b
    // Sentence 6: فمثلاً: ناقص سبعة على ثلاثة زائد نصف على ثلاثة يساوي ناقص سبعة زائد نصف الكل على ثلاثة،
    { sentenceIdx: 6, minProgress: 0.15, maxProgress: 0.45, tokenKey: 'read-p1-rule1-ex1-0' }, // (-7)/3
    { sentenceIdx: 6, minProgress: 0.45, maxProgress: 0.75, tokenKey: 'read-p1-rule1-ex1-2' }, // 0.5/3
    { sentenceIdx: 6, minProgress: 0.75, maxProgress: 1.0, tokenKey: 'read-p1-rule1-ex1-4' },  // (-7 + 0.5) / 3
    // Sentence 7: أي ناقص ستة ونصف على ثلاثة.
    { sentenceIdx: 7, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'read-p1-rule1-ex1-6' },  // -6.5 / 3
    // Sentence 8: ومثال آخر: خمس ناقص ثلاثة أخماس يساوي ناقص خمسان.
    { sentenceIdx: 8, minProgress: 0.15, maxProgress: 0.45, tokenKey: 'read-p1-rule1-ex2-0' }, // 1/5
    { sentenceIdx: 8, minProgress: 0.45, maxProgress: 0.75, tokenKey: 'read-p1-rule1-ex2-2' }, // 3/5
    { sentenceIdx: 8, minProgress: 0.75, maxProgress: 1.0, tokenKey: 'read-p1-rule1-ex2-6' },  // -2/5
    // Sentence 12: مثل خمسة أسداس زائد ثلاثة أرباع،
    { sentenceIdx: 12, minProgress: 0.15, maxProgress: 0.55, tokenKey: 'read-p1-rule2-ex-0' }, // 5/6
    { sentenceIdx: 12, minProgress: 0.55, maxProgress: 1.0, tokenKey: 'read-p1-rule2-ex-2' },  // 3/4
    // Sentence 14: فيصبح الكسران عشرة على اثني عشر زائد تسعة على اثني عشر،
    { sentenceIdx: 14, minProgress: 0.15, maxProgress: 0.55, tokenKey: 'read-p1-rule2-ex-4' }, // 10/12
    { sentenceIdx: 14, minProgress: 0.55, maxProgress: 1.0, tokenKey: 'read-p1-rule2-ex-6' },  // 9/12
    // Sentence 15: ومجموعهما تسعة عشر على اثني عشر.
    { sentenceIdx: 15, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'read-p1-rule2-ex-10' }, // 19/12
    // Sentence 19: نوحد جميع المقامات فنحصل على أربعين ناقص ثمانية وعشرين زائد تسعة الكل على أربعة وعشرين،
    { sentenceIdx: 19, minProgress: 0.25, maxProgress: 0.52, tokenKey: 'read-p1-calcA-step1-2' }, // 40/24
    { sentenceIdx: 19, minProgress: 0.52, maxProgress: 0.78, tokenKey: 'read-p1-calcA-step1-4' }, // 28/24
    { sentenceIdx: 19, minProgress: 0.78, maxProgress: 1.0, tokenKey: 'read-p1-calcA-step1-6' },  // 9/24
    // Sentence 20: والناتج واحد وعشرون على أربعة وعشرين،
    { sentenceIdx: 20, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'read-p1-calcA-step1-8' }, // 21/24
    // Sentence 21: وعند اختصاره بالقسمة على ثلاثة نحصل على أبسط صيغة وهي سبعة على ثمانية.
    { sentenceIdx: 21, minProgress: 0.0, maxProgress: 0.55, tokenKey: 'read-p1-calcA-step2-2' }, // (21 ÷ 3) / (24 ÷ 3)
    { sentenceIdx: 21, minProgress: 0.55, maxProgress: 1.0, tokenKey: 'read-p1-calcA-step2-4' },  // 7/8
  ],

  // Page 7 (Book Page 2) - Aligned 100% with ALL Page 7 exercises (sentences 0..31)
  2: [
    // Sentence 4: التمرين الأول: خمسة أتساع زائد ثلث،
    { sentenceIdx: 4, minProgress: 0.25, maxProgress: 0.62, tokenKey: 'read-p2-check-eq1-0' }, // 5/9
    { sentenceIdx: 4, minProgress: 0.62, maxProgress: 1.0, tokenKey: 'read-p2-check-eq1-2' },  // 1/3
    // Sentence 5: نوحد المقام بضرب الثلث في ثلاثة ليصبح ثلاثة أتساع،
    { sentenceIdx: 5, minProgress: 0.4, maxProgress: 1.0, tokenKey: 'read-p2-check-eq1-6' }, // 3/9
    // Sentence 6: والناتج ثمانية أتساع.
    { sentenceIdx: 6, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'read-p2-check-eq1-8' }, // 8/9
    // Sentence 7: التمرين الثاني: ناقص سبعة أخماس زائد ناقص ثلاثة أخماس،
    { sentenceIdx: 7, minProgress: 0.25, maxProgress: 0.65, tokenKey: 'read-p2-check-eq2-0' }, // (-7)/5
    { sentenceIdx: 7, minProgress: 0.65, maxProgress: 1.0, tokenKey: 'read-p2-check-eq2-2' },  // (-3)/5
    // Sentence 9: نجمع ناقص سبعة مع ناقص ثلاثة ليكون الناتج ناقص عشرة على خمسة،
    { sentenceIdx: 9, minProgress: 0.5, maxProgress: 1.0, tokenKey: 'read-p2-check-eq2-4' },  // -10/5
    // Sentence 10: أي ناقص اثنين تماماً.
    { sentenceIdx: 10, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'read-p2-check-eq2-6' }, // -2
    // Sentence 11: التمرين الثالث: أربعة أسباع ناقص عُشر على سبعة يساوي ثلاثة فاصل تسعة على سبعة.
    { sentenceIdx: 11, minProgress: 0.2, maxProgress: 0.48, tokenKey: 'read-p2-check-eq3-0' }, // 4/7
    { sentenceIdx: 11, minProgress: 0.48, maxProgress: 0.72, tokenKey: 'read-p2-check-eq3-2' }, // 0.1/7
    { sentenceIdx: 11, minProgress: 0.72, maxProgress: 1.0, tokenKey: 'read-p2-check-eq3-4' },  // 3.9/7
    // Sentence 12: التمرين الرابع: أربعة أثلاث زائد خمسة أثلاث يساوي تسعة أثلاث،
    { sentenceIdx: 12, minProgress: 0.2, maxProgress: 0.45, tokenKey: 'read-p2-check-eq4-0' }, // 4/3
    { sentenceIdx: 12, minProgress: 0.45, maxProgress: 0.72, tokenKey: 'read-p2-check-eq4-2' }, // 5/3
    { sentenceIdx: 12, minProgress: 0.72, maxProgress: 1.0, tokenKey: 'read-p2-check-eq4-4' },  // 9/3
    // Sentence 13: أي ثلاثة تماماً.
    { sentenceIdx: 13, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'read-p2-check-eq4-6' },  // 3
    // Sentence 14: التمرين الخامس: ثلاثة عشر على ناقص ستة زائد ناقص خمسة أسداس يساوي ناقص ثمانية عشر على ستة،
    { sentenceIdx: 14, minProgress: 0.2, maxProgress: 0.45, tokenKey: 'read-p2-check-eq5-0' }, // 13/(-6)
    { sentenceIdx: 14, minProgress: 0.45, maxProgress: 0.72, tokenKey: 'read-p2-check-eq5-2' }, // (-5)/6
    { sentenceIdx: 14, minProgress: 0.72, maxProgress: 1.0, tokenKey: 'read-p2-check-eq5-4' },  // -18/6
    // Sentence 15: أي ناقص ثلاثة تماماً.
    { sentenceIdx: 15, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'read-p2-check-eq5-6' },  // -3
    // Sentence 19: خمسة عشر على أربعة وعشرين ناقص أربعة على أربعة وعشرين يساوي أحد عشر على أربعة وعشرين.
    { sentenceIdx: 19, minProgress: 0.0, maxProgress: 0.38, tokenKey: 'read-p2-prac-eq1-0' }, // 15/24
    { sentenceIdx: 19, minProgress: 0.38, maxProgress: 0.7, tokenKey: 'read-p2-prac-eq1-2' },  // 4/24
    { sentenceIdx: 19, minProgress: 0.7, maxProgress: 1.0, tokenKey: 'read-p2-prac-eq1-4' },  // 11/24
    // Sentence 22: عشرون على اثني عشر ناقص واحد وعشرون على اثني عشر يساوي ناقص واحد على اثني عشر.
    { sentenceIdx: 22, minProgress: 0.0, maxProgress: 0.38, tokenKey: 'read-p2-prac-eq2-0' }, // 20/12
    { sentenceIdx: 22, minProgress: 0.38, maxProgress: 0.7, tokenKey: 'read-p2-prac-eq2-2' },  // 21/12
    { sentenceIdx: 22, minProgress: 0.7, maxProgress: 1.0, tokenKey: 'read-p2-prac-eq2-4' },  // -1/12
    // Sentence 24: أولاً نجمع كمية العصير المخلوط: ثلاثة أخماس زائد ستة أخماس يساوي تسعة أخماس ليتر،
    { sentenceIdx: 24, minProgress: 0.25, maxProgress: 0.55, tokenKey: 'read-p2-juice-eq1-0' }, // 3/5
    { sentenceIdx: 24, minProgress: 0.55, maxProgress: 0.8, tokenKey: 'read-p2-juice-eq1-2' },  // 6/5
    { sentenceIdx: 24, minProgress: 0.8, maxProgress: 1.0, tokenKey: 'read-p2-juice-eq1-4' },   // 9/5 L
    // Sentence 27: سعة الوعاء ليتران،
    { sentenceIdx: 27, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'read-p2-juice-eq2-0' },  // 2 L
    // Sentence 28: أي عشرة أخماس ليتر.
    { sentenceIdx: 28, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'read-p2-juice-eq2-2' },  // 10/5 L
    // Sentence 30: نطرح: عشرة أخماس ناقص تسعة أخماس يساوي خمس ليتر.
    { sentenceIdx: 30, minProgress: 0.1, maxProgress: 0.45, tokenKey: 'read-p2-juice-eq3-0' }, // 10/5
    { sentenceIdx: 30, minProgress: 0.45, maxProgress: 0.75, tokenKey: 'read-p2-juice-eq3-2' }, // 9/5
    { sentenceIdx: 30, minProgress: 0.75, maxProgress: 1.0, tokenKey: 'read-p2-juice-eq3-4' },  // 1/5
    // Sentence 31: إذن تحتاج زينة لإضافة خمس ليتر من عصير الموز لملء الوعاء بالكامل.
    { sentenceIdx: 31, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'read-p2-juice-eq3-4' },  // 1/5
  ]
};

// -------------------------------------------------------------
// MOBILE CHALKBOARD TIMELINE
// -------------------------------------------------------------
const MOBILE_BOARD_TIMELINES: Record<number, TokenTimeSlot[]> = {
  // Page 5
  0: [
    { sentenceIdx: 4, minProgress: 0.0, maxProgress: 0.52, tokenKey: 'mob-b-p0-s0-0' }, // (-9 / 7)
    { sentenceIdx: 4, minProgress: 0.52, maxProgress: 1.0, tokenKey: 'mob-b-p0-s0-2' },  // (5 / 7)
    { sentenceIdx: 5, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'mob-b-p0-s0-4-den' }, // 7 (المقام)
    { sentenceIdx: 6, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'mob-b-p0-s0-4-num' }, // -9 + 5 (البسطين)
    { sentenceIdx: 7, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'mob-b-p0-s0-6' },   // -4 / 7
    { sentenceIdx: 9, minProgress: 0.0, maxProgress: 0.52, tokenKey: 'mob-b-p0-s1-0' }, // 1/2
    { sentenceIdx: 9, minProgress: 0.52, maxProgress: 1.0, tokenKey: 'mob-b-p0-s1-2' },  // 5/8
    { sentenceIdx: 11, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'mob-b-p0-s1-4' },  // 4/8
    { sentenceIdx: 12, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'mob-b-p0-s1-10' }, // 9/8
    { sentenceIdx: 15, minProgress: 0.0, maxProgress: 0.52, tokenKey: 'mob-b-p0-s2-0' }, // -1/2
    { sentenceIdx: 15, minProgress: 0.52, maxProgress: 1.0, tokenKey: 'mob-b-p0-s2-2' },  // 5/3
    { sentenceIdx: 17, minProgress: 0.45, maxProgress: 1.0, tokenKey: 'mob-b-p0-s2-4' }, // -3/6
    { sentenceIdx: 18, minProgress: 0.45, maxProgress: 1.0, tokenKey: 'mob-b-p0-s2-6' }, // 10/6
    { sentenceIdx: 19, minProgress: 0.0, maxProgress: 0.55, tokenKey: 'mob-b-p0-s2-8' }, // (-3 + 10) / 6
    { sentenceIdx: 19, minProgress: 0.55, maxProgress: 1.0, tokenKey: 'mob-b-p0-s2-10' }, // 7/6
  ],
  // Page 6
  1: [
    { sentenceIdx: 2, minProgress: 0.5, maxProgress: 1.0, tokenKey: 'mob-b-p1-rule1-4' }, // (a + c) / b
    { sentenceIdx: 4, minProgress: 0.0, maxProgress: 0.35, tokenKey: 'mob-b-p1-ex1-0' }, // (-7)/3
    { sentenceIdx: 4, minProgress: 0.35, maxProgress: 0.68, tokenKey: 'mob-b-p1-ex1-2' }, // 0.5/3
    { sentenceIdx: 4, minProgress: 0.68, maxProgress: 1.0, tokenKey: 'mob-b-p1-ex1-6' },  // -6.5 / 3
    { sentenceIdx: 5, minProgress: 0.0, maxProgress: 0.38, tokenKey: 'mob-b-p1-ex2-0' }, // 1/5
    { sentenceIdx: 5, minProgress: 0.38, maxProgress: 0.68, tokenKey: 'mob-b-p1-ex2-2' }, // 3/5
    { sentenceIdx: 5, minProgress: 0.68, maxProgress: 1.0, tokenKey: 'mob-b-p1-ex2-6' },  // -2/5
    { sentenceIdx: 11, minProgress: 0.0, maxProgress: 0.52, tokenKey: 'mob-b-p1-rule2-2' }, // 10/12
    { sentenceIdx: 11, minProgress: 0.52, maxProgress: 1.0, tokenKey: 'mob-b-p1-rule2-6' },  // 9/12
    { sentenceIdx: 12, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'mob-b-p1-rule2-10' }, // 19/12
    { sentenceIdx: 15, minProgress: 0.25, maxProgress: 0.52, tokenKey: 'mob-b-p1-calcA-1-2' }, // 40/24
    { sentenceIdx: 15, minProgress: 0.52, maxProgress: 0.78, tokenKey: 'mob-b-p1-calcA-1-4' }, // 28/24
    { sentenceIdx: 15, minProgress: 0.78, maxProgress: 1.0, tokenKey: 'mob-b-p1-calcA-1-6' },  // 9/24
    { sentenceIdx: 16, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'mob-b-p1-calcA-1-8' },  // 21/24
    { sentenceIdx: 17, minProgress: 0.0, maxProgress: 0.55, tokenKey: 'mob-b-p1-calcA-2-2' }, // (21 ÷ 3) / (24 ÷ 3)
    { sentenceIdx: 17, minProgress: 0.55, maxProgress: 1.0, tokenKey: 'mob-b-p1-calcA-2-4' },  // 7/8
  ],
  // Page 7
  2: [
    { sentenceIdx: 1, minProgress: 0.5, maxProgress: 0.78, tokenKey: 'mob-b-p2-check1-0' },  // 5/9
    { sentenceIdx: 1, minProgress: 0.78, maxProgress: 1.0, tokenKey: 'mob-b-p2-check1-2' },  // 1/3
    { sentenceIdx: 2, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'mob-b-p2-check1-6' },   // 3/9
    { sentenceIdx: 3, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'mob-b-p2-check1-8' },   // 8/9
    { sentenceIdx: 4, minProgress: 0.35, maxProgress: 0.7, tokenKey: 'mob-b-p2-check2-0' },  // (-7/5)
    { sentenceIdx: 4, minProgress: 0.7, maxProgress: 1.0, tokenKey: 'mob-b-p2-check2-2' },   // (-3/5)
    { sentenceIdx: 6, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'mob-b-p2-check2-4' },   // -10/5
    { sentenceIdx: 7, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'mob-b-p2-check2-6' },   // -2
    { sentenceIdx: 14, minProgress: 0.0, maxProgress: 0.38, tokenKey: 'mob-b-p2-prac1-4' },  // 15/24
    { sentenceIdx: 14, minProgress: 0.38, maxProgress: 0.7, tokenKey: 'mob-b-p2-prac1-6' },   // 4/24
    { sentenceIdx: 14, minProgress: 0.7, maxProgress: 1.0, tokenKey: 'mob-b-p2-prac1-8' },   // 11/24
    { sentenceIdx: 17, minProgress: 0.0, maxProgress: 0.38, tokenKey: 'mob-b-p2-prac2-4' },  // 20/12
    { sentenceIdx: 17, minProgress: 0.38, maxProgress: 0.7, tokenKey: 'mob-b-p2-prac2-6' },   // 21/12
    { sentenceIdx: 17, minProgress: 0.7, maxProgress: 1.0, tokenKey: 'mob-b-p2-prac2-8' },   // -1/12
    { sentenceIdx: 20, minProgress: 0.45, maxProgress: 0.7, tokenKey: 'mob-b-p2-juice1-0' },  // 3/5
    { sentenceIdx: 20, minProgress: 0.7, maxProgress: 0.85, tokenKey: 'mob-b-p2-juice1-2' },  // 6/5
    { sentenceIdx: 20, minProgress: 0.85, maxProgress: 1.0, tokenKey: 'mob-b-p2-juice1-4' },  // 9/5
    { sentenceIdx: 21, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'mob-b-p2-juice2-2' },   // 10/5
    { sentenceIdx: 22, minProgress: 0.15, maxProgress: 0.45, tokenKey: 'mob-b-p2-juice3-0' }, // 10/5
    { sentenceIdx: 22, minProgress: 0.45, maxProgress: 0.75, tokenKey: 'mob-b-p2-juice3-2' }, // 9/5
    { sentenceIdx: 22, minProgress: 0.75, maxProgress: 1.0, tokenKey: 'mob-b-p2-juice3-4' },  // 1/5
    { sentenceIdx: 23, minProgress: 0.0, maxProgress: 1.0, tokenKey: 'mob-b-p2-juice3-4' },   // 1/5
  ]
};

/**
 * Returns the exact unique token key being spoken right now.
 * Pure position-based lookup: 100% immune to duplicate values on the same page.
 */
export const getActiveTokenKey = (
  context: AudioTimelineContext,
  pageIndex: number,
  sentenceIndex: number,
  progressRatio: number = 0.5
): string | null => {
  if (sentenceIndex < 0) return null;

  let timeline: TokenTimeSlot[] | undefined;
  if (context === 'board') {
    timeline = BOARD_TIMELINES[pageIndex];
  } else if (context === 'mobile-board') {
    timeline = MOBILE_BOARD_TIMELINES[pageIndex];
  } else {
    // 'book' or 'mobile-book'
    timeline = BOOK_TIMELINES[pageIndex];
  }

  if (!timeline) return null;

  const match = timeline.find((slot) => {
    if (slot.sentenceIdx !== sentenceIndex) return false;
    const min = slot.minProgress ?? 0;
    const max = slot.maxProgress ?? 1;
    return progressRatio >= min && progressRatio <= max;
  });

  return match ? match.tokenKey : null;
};
