export const FLUTTER_CODE_SNIPPET = `// ============================================================================
// تطبيق الرياضيات - الصف الثامن (المنهاج السوري) - الدرس الأول
// تقليب صفحات أفقي واقعي ثلاثي الأبعاد مثل كتاب مدرسي حقيقي (Book Page Flip Effect)
// واجهة متكاملة تعمل 100% دون إنترنت (Offline Mode) باستخدام PageView و Transform
// ============================================================================

import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_tts/flutter_tts.dart'; // حزمة النطق الصوتي Offline

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SyrianMathLessonApp());
}

class SyrianMathLessonApp extends StatelessWidget {
  const SyrianMathLessonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'رياضيات الصف الثامن - منهاج سوريا',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Cairo',
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F766E), // لون بترولي مدرسي وقور
          primary: const Color(0xFF0F766E),
          secondary: const Color(0xFFF59E0B),
          surface: const Color(0xFFF8FAFC),
        ),
      ),
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl, // اتجاه القراءة العربي
          child: child!,
        );
      },
      home: const LessonHomeScreen(),
    );
  }
}

// ----------------------------------------------------------------------------
// الشاشة الرئيسية للدرس
// ----------------------------------------------------------------------------
class LessonHomeScreen extends StatefulWidget {
  const LessonHomeScreen({super.key});

  @override
  State<LessonHomeScreen> createState() => _LessonHomeScreenState();
}

class _LessonHomeScreenState extends State<LessonHomeScreen> {
  int _selectedTab = 0; // 0: اقرأ الدرس (تقليب صفحات)، 1: السبورة التفاعلية
  String _activeLessonId = 'u1-l1';
  String _activeLessonTitle = 'الدرس 1: جمع وطرح الأعداد العادية';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      // الفهرس الجانبي (Sidebar Navigation Drawer)
      drawer: SyrianCurriculumDrawer(
        currentLessonId: _activeLessonId,
        onSelectLesson: (id, title) {
          setState(() {
            _activeLessonId = id;
            _activeLessonTitle = title;
            if (id == 'u1-l1') {
              _selectedTab = 0;
            }
          });
        },
      ),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F766E),
        elevation: 0,
        centerTitle: false,
        // زر القائمة لفتح الفهرس الجانبي
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu_rounded, color: Colors.amberAccent, size: 28),
            tooltip: 'فهرس الوحدات والدروس',
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'الرياضيات | الجبر - الصف الثامن',
              style: TextStyle(fontSize: 13, color: Colors.amberAccent, fontWeight: FontWeight.bold),
            ),
            Text(
              _activeLessonTitle,
              style: const TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.emerald.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.emeraldAccent),
            ),
            child: const Row(
              children: [
                Icon(Icons.wifi_off, size: 15, color: Colors.emeraldAccent),
                SizedBox(width: 4),
                Text('أوفلاين', style: TextStyle(color: Colors.white, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // شريط الأزرار التفاعلية البارز (الزران المطلوبان)
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            decoration: const BoxDecoration(
              color: Color(0xFF0F766E),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
            ),
            child: Row(
              children: [
                // زر "اقرأ الدرس" (مع تقليب الصفحات ككتاب مدرسي)
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _selectedTab == 0 ? Colors.amber : Colors.white,
                      foregroundColor: _selectedTab == 0 ? Colors.black87 : const Color(0xFF0F766E),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: _selectedTab == 0 ? 4 : 1,
                    ),
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      setState(() => _selectedTab = 0);
                    },
                    icon: const Icon(Icons.auto_stories_rounded, size: 20),
                    label: const Text(
                      'اقرأ الدرس 📖',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // زر "استمع للشرح الصوتي" (السبورة التفاعلية)
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _selectedTab == 1 ? const Color(0xFF1E293B) : Colors.white,
                      foregroundColor: _selectedTab == 1 ? Colors.white : const Color(0xFF0F766E),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: _selectedTab == 1 ? 4 : 1,
                    ),
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      setState(() => _selectedTab = 1);
                    },
                    icon: const Icon(Icons.record_voice_over_rounded, size: 20),
                    label: const Text(
                      'السبورة التفاعلية 🎙️',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // المحتوى التفاعلي المتغير
          Expanded(
            child: _selectedTab == 0
                ? const BookPageView() // ودجت تقليب صفحات الكتاب المدرسي الأفقية
                : const InteractiveBoardWidget(),
          ),
        ],
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// ودجت تقليب صفحات الكتاب المدرسي الأفقية (Book Page Flip Effect)
// تستخدم PageView مع تأثير ثنائي/ثلاثي الأبعاد ومؤشر صفحات وتأثير ورق الكتاب
// ----------------------------------------------------------------------------
class BookPageView extends StatefulWidget {
  const BookPageView({super.key});

  @override
  State<BookPageView> createState() => _BookPageViewState();
}

class _BookPageViewState extends State<BookPageView> {
  final PageController _pageController = PageController();
  final FlutterTts _bookTts = FlutterTts();
  bool _isSpeakingPage = false;
  double _currentPage = 0.0;
  final int _totalPages = 3;

  // نصوص الشرح الصوتي الكامل لكل صفحة من صفحات الكتاب
  final Map<int, String> _pageScripts = {
    0: 'مرحباً بكم يا أبطال الصف الثامن. سنشرح الآن كامل محتويات الصفحة الخامسة من كتاب الجبر. نبدأ بالنشاط الاستكشافي للجمع والطرح في الأعداد العادية. أولاً: المقامات المتساوية، مثل ناقص تسعة على سبعة زائد خمسة على سبعة، نحتفظ بالمقام سبعة ونجمع البسطين لنحصل على ناقص أربعة على سبعة. ثانياً: أحد المقامين مضاعف للآخر، لحساب نصف زائد خمسة أثمان نوحد المقامات بضرب النصف بالعدد أربعة ليصبح أربعة أثمان، فيكون المجموع تسعة أثمان. ثالثاً: المقامات مختلفة، لحساب ناقص نصف زائد خمسة أثلاث، أصغر مضاعف مشترك للمقامين اثنين وثلاثة هو ستة، فيصبح ناقص ثلاثة أسداس زائد عشرة أسداس، والناتج سبعة أسداس.',
    1: 'أهلاً بكم في شرح كامل الصفحة السادسة. تتضمن هذه الصفحة قاعدتين أساسيتين واكتساب معارف. الخاصة الأولى: لجمع أو طرح كسور ذات مقامات متساوية نجمع أو نطرح البسوط ونحتفظ بالمقام المشترك. والخاصة الثانية: إذا كانت المقامات مختلفة نوحد مقاماتها أولاً بالبحث عن أصغر مضاعف مشترك مثل خمسة أسداس زائد ثلاثة أرباع يساوي تسعة عشر على اثني عشر. وفي سلسلة العمليات A نوحد مقامات الكسور الثلاثة على أربعة وعشرين فنحصل على واحد وعشرين على أربعة وعشرين، ونختصر بالقسمة على ثلاثة لنصل للناتج سبعة على ثمانية.',
    2: 'أهلاً بكم في شرح كامل الصفحة السابعة. تتضمن هذه الصفحة تمارين تحقق من فهمك وتدرب والمسألة الحياتية. في مسألة عصير زينة: خلطت ثلاثة أخماس ليتر تفاح مع ستة أخماس ليتر عنب، مجموعهما تسعة أخماس ليتر. وسعة الوعاء ليتران أي عشرة أخماس ليتر، وبطرح تسعة أخماس من عشرة أخماس نجد أن زينة تحتاج لإضافة خمس ليتر من عصير الموز لملء الوعاء.',
  };

  @override
  void initState() {
    super.initState();
    _bookTts.setLanguage('ar');
    _bookTts.setSpeechRate(0.45);
    _bookTts.setCompletionHandler(() {
      setState(() => _isSpeakingPage = false);
    });

    _pageController.addListener(() {
      setState(() {
        _currentPage = _pageController.page ?? 0.0;
      });
    });
  }

  @override
  void dispose() {
    _bookTts.stop();
    _pageController.dispose();
    super.dispose();
  }

  void _speakCurrentFullPage() async {
    HapticFeedback.lightImpact();
    if (_isSpeakingPage) {
      await _bookTts.stop();
      setState(() => _isSpeakingPage = false);
    } else {
      final int pageIdx = _currentPage.round();
      final script = _pageScripts[pageIdx] ?? '';
      setState(() => _isSpeakingPage = true);
      await _bookTts.speak(script);
    }
  }

  void _flipToNext() {
    _bookTts.stop();
    setState(() => _isSpeakingPage = false);
    HapticFeedback.selectionClick();
    if (_currentPage.round() < _totalPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  void _flipToPrev() {
    _bookTts.stop();
    setState(() => _isSpeakingPage = false);
    HapticFeedback.selectionClick();
    if (_currentPage.round() > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // شريط أعلى الكتاب: تلميح السحب ورقم الصفحة
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.swipe_rounded, size: 16, color: Color(0xFF0F766E)),
                  const SizedBox(width: 4),
                  Text(
                    'اسحب أفقياً لتقليب الصفحات',
                    style: TextStyle(fontSize: 11, color: Colors.teal.shade800, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              Row(
                children: [
                  // زر الاستماع لشرح كامل الصفحة بالصوت
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isSpeakingPage ? Colors.red : Colors.amber.shade400,
                      foregroundColor: _isSpeakingPage ? Colors.white : Colors.black87,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 1,
                    ),
                    onPressed: _speakCurrentFullPage,
                    icon: Icon(_isSpeakingPage ? Icons.stop_rounded : Icons.volume_up_rounded, size: 16),
                    label: Text(
                      _isSpeakingPage ? 'إيقاف الصوت' : 'شرح كامل الصفحة 🔊',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade100,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.amber.shade400),
                    ),
                    child: Text(
                      'ص \${5 + _currentPage.round()}',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF78350F)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // منطقة الكتاب والصفحات مع تأثير Flip
        Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFDF8), // لون ورق الكتاب الطبيعي
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.12),
                  blurRadius: 18,
                  spreadRadius: 2,
                  offset: const Offset(0, 8),
                ),
              ],
              border: Border.all(color: const Color(0xFFE2D9C8), width: 1.5),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Stack(
                children: [
                  // محاذاة كعب الكتاب وتأثير الظل الداخلي للكتاب
                  Positioned(
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 14,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.black.withOpacity(0.15),
                            Colors.transparent,
                          ],
                          begin: Alignment.centerRight,
                          end: Alignment.centerLeft,
                        ),
                      ),
                    ),
                  ),

                  // PageView الأفقي مع تأثير تحويل الصفحات ثلاثي الأبعاد
                  PageView.builder(
                    controller: _pageController,
                    physics: const BouncingScrollPhysics(),
                    itemCount: _totalPages,
                    itemBuilder: (context, index) {
                      // حساب زاوية دوران الصفحة لتأثير 3D Page Flip
                      final double delta = index - _currentPage;
                      final double angle = delta * 0.45; // زاوية الالتفاف

                      return Transform(
                        transform: Matrix4.identity()
                          ..setEntry(3, 2, 0.001) // منظور العمق ثلاثي الأبعاد
                          ..rotateY(-angle),
                        alignment: delta > 0 ? Alignment.centerRight : Alignment.centerLeft,
                        child: _buildBookPage(index),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),

        // شريط التنقل السفلي بين الصفحات (أزرار التقليب + مؤشرات الصفحات)
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // زر الصفحة السابقة
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _currentPage.round() > 0 ? Colors.white : Colors.grey.shade200,
                  foregroundColor: const Color(0xFF0F766E),
                  elevation: 1,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                ),
                onPressed: _currentPage.round() > 0 ? _flipToPrev : null,
                icon: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                label: const Text('الصفحة السابقة', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              ),

              // مؤشر النقاط للصفحات
              Row(
                children: List.generate(_totalPages, (index) {
                  final bool isSelected = _currentPage.round() == index;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: isSelected ? 22 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF0F766E) : Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  );
                }),
              ),

              // زر الصفحة التالية
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _currentPage.round() < _totalPages - 1 ? const Color(0xFF0F766E) : Colors.grey.shade200,
                  foregroundColor: _currentPage.round() < _totalPages - 1 ? Colors.white : Colors.grey.shade500,
                  elevation: 1,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                ),
                onPressed: _currentPage.round() < _totalPages - 1 ? _flipToNext : null,
                label: const Text('الصفحة التالية', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 14),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // بناء كل صفحة من صفحات كتاب الرياضيات المدرسي
  Widget _buildBookPage(int pageIndex) {
    if (pageIndex == 0) {
      return _buildPage5Content();
    } else if (pageIndex == 1) {
      return _buildPage6Content();
    } else {
      return _buildPage7Content();
    }
  }

  // صفحة 5: النشاط الاستكشافي وخاصة 1
  Widget _buildPage5Content() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildPageHeader('صفحة 5 من الكتاب المدرسي', 'النشاط الاستكشافي: الجمع والطرح'),
        const SizedBox(height: 12),
        const Text(
          '🎯 تمديد القواعد التي عُرضت في الصف السابع لتشمل الأعداد العادية (الكسور الموجبة والسالبة):',
          style: TextStyle(fontSize: 13, height: 1.6, color: Colors.black87),
        ),
        const SizedBox(height: 14),
        _buildSectionBox(
          title: '1. المقامات متساوية',
          color: Colors.blue.shade700,
          content: 'قام الطالبان باسم وهاشم بجمع الكسرين (-9/7) و (5/7):\\n'
                   '• حل هاشم: (-9)/7 + 5/7 = (-9 + 5)/7 = -4/7\\n'
                   '• كلاهما صحيح: نحتفظ بالمقام المشترك ونجمع البسطين جبرياً.',
        ),
        const SizedBox(height: 12),
        _buildSectionBox(
          title: '2. أحد المقامات مضاعف للآخر',
          color: Colors.amber.shade800,
          content: 'احسب: 1/2 + 5/8\\n'
                   '• نضرب حدي الكسر الأول بالعدد 4 ليصبح مقامه 8:\\n'
                   '  1/2 = 4/8\\n'
                   '• الجمع: 4/8 + 5/8 = 9/8',
        ),
        const SizedBox(height: 12),
        _buildSectionBox(
          title: '3. كيفما كانت المقامات (مقامات مختلفة)',
          color: Colors.teal.shade800,
          content: 'احسب: -1/2 + 5/3\\n'
                   '• مضاعفات 2: {2, 4, 6, 8, ...}\\n'
                   '• مضاعفات 3: {3, 6, 9, ...}\\n'
                   '• أصغر مضاعف مشترك هو 6 -> -3/6 + 10/6 = 7/6',
        ),
      ],
    );
  }

  // صفحة 6: القواعد والخواص وسلسلة العمليات
  Widget _buildPage6Content() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildPageHeader('صفحة 6 من الكتاب المدرسي', 'القواعد والخواص الأساسية'),
        const SizedBox(height: 12),
        _buildRuleBanner(
          'خاصة 1 (المقامات المتساوية)',
          'لجمع أو طرح كسور ذات مقامات متساوية، نجمع أو نطرح بسوط هذه الكسور ونحتفظ بالمقام المشترك:\\n'
          'a/b + c/b = (a + c)/b\\n'
          'مثال: (-7/3) + (0.5/3) = (-7 + 0.5)/3 = -6.5/3',
          Colors.green.shade800,
        ),
        const SizedBox(height: 14),
        _buildRuleBanner(
          'خاصة 2 (المقامات المختلفة)',
          'نوحد المقامات بالبحث عن أصغر مضاعف مشترك للمقامات، ثم نجري العمليات وفق الخاصة 1:\\n'
          '5/6 + 3/4 = 10/12 + 9/12 = 19/12',
          Colors.indigo.shade800,
        ),
        const SizedBox(height: 14),
        _buildSectionBox(
          title: 'اكتساب معارف: سلسلة عمليات الجمع والطرح',
          color: Colors.purple.shade700,
          content: 'احسب: A = 5/3 - 7/6 + 3/8\\n'
                   '• أصغر مضاعف مشترك لـ (3, 6, 8) هو 24:\\n'
                   '  A = 40/24 - 28/24 + 9/24\\n'
                   '  A = (40 - 28 + 9) / 24 = 21/24\\n'
                   '• نختصر بالقسمة على 3: A = 7/8 ✅',
        ),
      ],
    );
  }

  // صفحة 7: تحقق من فهمك والمسألة الحياتية
  Widget _buildPage7Content() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildPageHeader('صفحة 7 من الكتاب المدرسي', 'تحقق من فهمك وتدرب'),
        const SizedBox(height: 12),
        _buildSectionBox(
          title: 'تحقق من فهمك (تمرين 1 و 2)',
          color: Colors.blue.shade800,
          content: '• 5/9 + 1/3 = 5/9 + 3/9 = 8/9\\n'
                   '• (-7/5) + (-3/5) = (-7 - 3)/5 = -10/5 = -2\\n'
                   '• 4/7 - 0.1/7 = 3.9/7\\n'
                   '• 13/(-6) + (-5/6) = -18/6 = -3',
        ),
        const SizedBox(height: 14),
        _buildSectionBox(
          title: 'تدرب (تمرين 1): إكمال الفراغ',
          color: Colors.orange.shade800,
          content: '• 5/8 - 1/6 = 15/24 - 4/24 = 11/24\\n'
                   '• 5/3 - 7/4 = 20/12 - 21/12 = -1/12',
        ),
        const SizedBox(height: 14),
        _buildSectionBox(
          title: '🥤 المسألة الحياتية: عصير زينة',
          color: Colors.purple.shade800,
          content: 'خلطت زينة 3/5 ليتر تفاح مع 6/5 ليتر عنب لملء وعاء سعته ليتران. كم ليتراً من عصير الموز تحتاج إضافته؟\\n\\n'
                   '1) مجموع العصير = 3/5 + 6/5 = 9/5 ليتر\\n'
                   '2) سعة الوعاء = 2 = 10/5 ليتر\\n'
                   '3) عصير الموز المطلوب = 10/5 - 9/5 = 1/5 ليتر 🍌',
        ),
      ],
    );
  }

  Widget _buildPageHeader(String pageNum, String title) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: const Color(0xFF0F766E).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(pageNum, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
        ),
      ],
    );
  }

  Widget _buildSectionBox({required String title, required String content, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 13)),
          const Divider(height: 12),
          Text(content, style: const TextStyle(fontSize: 12, height: 1.6, color: Colors.black87)),
        ],
      ),
    );
  }

  Widget _buildRuleBanner(String title, String ruleText, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.bookmark_rounded, size: 16, color: color),
              const SizedBox(width: 4),
              Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 6),
          Text(ruleText, style: const TextStyle(fontSize: 12, height: 1.6, color: Colors.black87)),
        ],
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// ودجت (2): السبورة التفاعلية مع الشرح الصوتي المدمج أوفلاين
// ----------------------------------------------------------------------------
class InteractiveBoardWidget extends StatefulWidget {
  const InteractiveBoardWidget({super.key});

  @override
  State<InteractiveBoardWidget> createState() => _InteractiveBoardWidgetState();
}

class _InteractiveBoardWidgetState extends State<InteractiveBoardWidget> {
  final FlutterTts _tts = FlutterTts();
  bool _isPlaying = false;
  int _selectedPageIndex = 0; // 0 = ص 5, 1 = ص 6, 2 = ص 7

  // بيانات السبورة والشرح الصوتي الكامل لكل صفحة
  final List<Map<String, dynamic>> _boardPages = [
    {
      'pageNum': 5,
      'title': 'السبورة: شرح كامل الصفحة (5) - النشاط الاستكشافي',
      'fullSpoken': 'مرحباً بكم على السبورة التفاعلية لشرح كامل الصفحة الخامسة من كتاب الجبر. موضوعنا هو الجمع والطرح في الأعداد العادية. الحالة الأولى: المقامات متساوية، مثل ناقص تسعة على سبعة زائد خمسة على سبعة، نحتفظ بالمقام سبعة ونجمع البسطين جبرياً فيكون الناتج ناقص أربعة على سبعة. الحالة الثانية: أحد المقامين مضاعف للآخر، لحساب نصف زائد خمسة أثمان، نضرب النصف في أربعة ليصبح أربعة أثمان، والمجموع تسعة أثمان. الحالة الثالثة: المقامات مختلفة تماماً، لحساب ناقص نصف زائد خمسة أثلاث، المضاعف المشترك الأصغر لاثنين وثلاثة هو ستة، فيصبح الناتج سبعة على ستة.',
      'lines': [
        '🏫 سبورة الرياضيات - شرح كامل الصفحة (5)',
        '---------------------------------------',
        '1️⃣ المقامات متساوية:',
        '   (-9/7) + (5/7) = (-9 + 5)/7 = -4/7 ✅',
        '---------------------------------------',
        '2️⃣ أحد المقامات مضاعف للآخر:',
        '   1/2 + 5/8 = 4/8 + 5/8 = 9/8 ✅',
        '---------------------------------------',
        '3️⃣ المقامات مختلفة تماماً:',
        '   -1/2 + 5/3 = -3/6 + 10/6 = 7/6 ✅',
      ],
    },
    {
      'pageNum': 6,
      'title': 'السبورة: شرح كامل الصفحة (6) - القواعد وسلسلة العمليات',
      'fullSpoken': 'أهلاً بكم في شرح كامل الصفحة السادسة على السبورة. الخاصة الأولى: لجمع أو طرح كسور ذات مقامات متساوية نجمع أو نطرح البسوط ونحتفظ بالمقام المشترك، مثل ناقص سبعة على ثلاثة زائد نصف على ثلاثة يساوي ناقص ستة ونصف على ثلاثة. الخاصة الثانية: لجمع أو طرح كسور ذات مقامات مختلفة نوحد المقامات أولاً بالمضاعف المشترك الأصغر، مثل خمسة أسداس زائد ثلاثة أرباع يساوي تسعة عشر على اثني عشر. وفي سلسلة العمليات A: خمسة على ثلاثة ناقص سبعة على ستة زائد ثلاثة على ثمانية، نوحد على أربعة وعشرين فنحصل على واحد وعشرين على أربعة وعشرين، ونختصر بالقسمة على ثلاثة إلى سبعة على ثمانية.',
      'lines': [
        '🏫 سبورة الرياضيات - شرح كامل الصفحة (6)',
        '---------------------------------------',
        '📌 [خاصّة 1] المقامات متساوية:',
        '   a/b + c/b = (a + c) / b',
        '   (-7)/3 + 0.5/3 = -6.5/3',
        '---------------------------------------',
        '📌 [خاصّة 2] المقامات مختلفة:',
        '   5/6 + 3/4 = 10/12 + 9/12 = 19/12 ✅',
        '---------------------------------------',
        '📌 [اكتساب معارف] سلسلة العمليات A:',
        '   A = 5/3 - 7/6 + 3/8',
        '   المقام المشترك لـ (3, 6, 8) هو 24:',
        '   A = 40/24 - 28/24 + 9/24 = 21/24',
        '   نختصر بالقسمة على 3: A = 7/8 ✅',
      ],
    },
    {
      'pageNum': 7,
      'title': 'السبورة: شرح كامل الصفحة (7) - التمارين ومسألة العصير',
      'fullSpoken': 'مرحباً بكم في شرح كامل الصفحة السابعة على السبورة. في تحقق من فهمك: خمسة أتساع زائد ثلث يساوي ثمانية أتساع. وناقص سبعة أخماس زائد ناقص ثلاثة أخماس يساوي ناقص اثنين. وفي تدرب: خمسة أثمان ناقص سدس نوحد على أربعة وعشرين فنحصل على أحد عشر على أربعة وعشرين. ومسألة عصير زينة: خلطت ثلاثة أخماس ليتر تفاح مع ستة أخماس ليتر عنب، مجموعهما تسعة أخماس ليتر، وبطرحها من سعة الوعاء ليتران أي عشرة أخماس، نجد أن زينة تحتاج لإضافة خمس ليتر من عصير الموز لملء الوعاء.',
      'lines': [
        '🏫 سبورة الرياضيات - شرح كامل الصفحة (7)',
        '---------------------------------------',
        '1️⃣ تحقق من فهمك:',
        '   • 5/9 + 1/3 = 5/9 + 3/9 = 8/9 ✅',
        '   • (-7/5) + (-3/5) = -10/5 = -2 ✅',
        '---------------------------------------',
        '2️⃣ تدرب (المقام المشترك 24):',
        '   • 5/8 - 1/6 = 15/24 - 4/24 = 11/24 ✅',
        '---------------------------------------',
        '3️⃣ مسألة عصير زينة:',
        '   • مجموع التفاح والعنب = 3/5 + 6/5 = 9/5 L',
        '   • سعة الوعاء = 2 L = 10/5 L',
        '   • عصير الموز المطلوب = 10/5 - 9/5 = 1/5 ليتر 🍌 ✅',
      ],
    },
  ];

  @override
  void initState() {
    super.initState();
    _initTts();
  }

  void _initTts() async {
    await _tts.setLanguage('ar');
    await _tts.setPitch(1.0);
    await _tts.setSpeechRate(0.45);
    _tts.setCompletionHandler(() {
      setState(() => _isPlaying = false);
    });
  }

  void _speakCurrentPageFull() async {
    HapticFeedback.lightImpact();
    if (_isPlaying) {
      await _tts.stop();
      setState(() => _isPlaying = false);
    } else {
      final page = _boardPages[_selectedPageIndex];
      setState(() => _isPlaying = true);
      await _tts.speak(page['fullSpoken']);
    }
  }

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final page = _boardPages[_selectedPageIndex];

    return Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          // شريط اختيار الصفحة على السبورة
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'اختر صفحة السبورة:',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F766E)),
              ),
              Row(
                children: List.generate(_boardPages.length, (idx) {
                  final bool isSelected = _selectedPageIndex == idx;
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: ChoiceChip(
                      label: Text('ص \${_boardPages[idx]['pageNum']}'),
                      selected: isSelected,
                      selectedColor: Colors.amber.shade400,
                      onSelected: (selected) {
                        _tts.stop();
                        setState(() {
                          _isPlaying = false;
                          _selectedPageIndex = idx;
                        });
                      },
                    ),
                  );
                }),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // لوح السبورة
          Expanded(
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF142620), // لون السبورة الخضراء
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF5A361C), width: 8), // إطار خشب
                boxShadow: const [
                  BoxShadow(color: Colors.black45, blurRadius: 14, offset: Offset(0, 6)),
                ],
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          page['title'],
                          style: const TextStyle(color: Colors.amberAccent, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                        if (_isPlaying)
                          const Text(
                            '🎙️ يتحدث الآن...',
                            style: TextStyle(color: Colors.redAccent, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                      ],
                    ),
                    const Divider(color: Colors.white24, height: 16),
                    ...((page['lines'] as List<String>).map((line) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2.5),
                          child: Text(
                            line,
                            style: TextStyle(
                              color: line.contains('✅')
                                  ? Colors.greenAccent
                                  : line.startsWith('1️⃣') || line.startsWith('2️⃣') || line.startsWith('3️⃣') || line.startsWith('📌')
                                      ? Colors.amber.shade200
                                      : Colors.white,
                              fontSize: 13.5,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ))),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // زر شرح كامل الصفحة بالصوت على السبورة
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: _isPlaying ? Colors.red.shade600 : const Color(0xFF0F766E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 3,
              ),
              onPressed: _speakCurrentPageFull,
              icon: Icon(_isPlaying ? Icons.stop_circle_rounded : Icons.record_voice_over_rounded),
              label: Text(
                _isPlaying ? 'إيقاف القراءة ⏹️' : 'زر القراءة: استمع لشرح كامل الصفحة (\${page[\'pageNum\']}) بالصوت 🎙️',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// الفهرس الجانبي (Sidebar Navigation Drawer) لمنهاج الرياضيات السوري
// ============================================================================
class SyrianCurriculumDrawer extends StatelessWidget {
  final String currentLessonId;
  final Function(String id, String title) onSelectLesson;

  const SyrianCurriculumDrawer({
    super.key,
    required this.currentLessonId,
    required this.onSelectLesson,
  });

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: const Color(0xFF0F172A), // Dark Theme Slate-900
      child: Column(
        children: [
          // رأس الفهرس مع شعار المنهاج السوري
          DrawerHeader(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF0F766E), Color(0xFF042F2E)],
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.amberAccent.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.amberAccent, width: 2),
                  ),
                  child: const Icon(Icons.menu_book_rounded, color: Colors.amberAccent, size: 28),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'فهرس منهاج الجبر',
                        style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'الصف الثامن - المنهاج السوري 🇸🇾',
                        style: TextStyle(color: Colors.amberAccent, fontSize: 12),
                      ),
                      Text(
                        'Offline Ready 100%',
                        style: TextStyle(color: Colors.greenAccent, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // قائمة الوحدات والدروس المنسدلة (ExpansionTiles)
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              children: [
                // الوحدة الأولى: الأعداد العادية
                _buildUnitTile(
                  context,
                  title: 'الوحدة 1: الأعداد العادية والعمليات عليها',
                  subtitle: 'الفصل الأول • ص 3 - 24',
                  icon: '🔢',
                  initiallyExpanded: true,
                  lessons: [
                    _LessonItem('u1-launch', 'انطلاقة نشطة: تذكير بمكتسبات الصف السابع', 'ص 3 - 4'),
                    _LessonItem('u1-l1', 'الدرس 1: الجمع والطرح', 'ص 5 - 7', isSpecial: true),
                    _LessonItem('u1-l2', 'الدرس 2: الضرب ومقلوب عدد عادي', 'ص 8 - 11'),
                    _LessonItem('u1-l3', 'الدرس 3: القسمة والكسور المركبة', 'ص 12 - 16'),
                    _LessonItem('u1-rev', 'تدريبات ومسائل الوحدة الأولى', 'ص 17 - 24'),
                  ],
                ),

                // الوحدة الثانية: قوى الأعداد العادية
                _buildUnitTile(
                  context,
                  title: 'الوحدة 2: قوى الأعداد العادية',
                  subtitle: 'الفصل الأول • ص 25 - 45',
                  icon: '⚡',
                  initiallyExpanded: false,
                  lessons: [
                    _LessonItem('u2-launch', 'انطلاقة نشطة: مفهوم القوة والأس', 'ص 25'),
                    _LessonItem('u2-l1', 'الدرس 1: قوى العدد 10 والكتابة العلمية', 'ص 26 - 28'),
                    _LessonItem('u2-l2', 'الدرس 2: قواعد على قوى العدد 10', 'ص 29 - 31'),
                    _LessonItem('u2-l3', 'الدرس 3: قوى صحيحة لعدد نسبي', 'ص 32 - 34'),
                    _LessonItem('u2-l4', 'الدرس 4: الجذور التربيعية وخواصها', 'ص 35 - 37'),
                    _LessonItem('u2-rev', 'تدريبات ومسائل الوحدة الثانية', 'ص 38 - 45'),
                  ],
                ),

                // الوحدة الثالثة: الحساب بالرموز
                _buildUnitTile(
                  context,
                  title: 'الوحدة 3: الحساب بالرموز',
                  subtitle: 'الفصل الأول • ص 46 - 66',
                  icon: '📐',
                  initiallyExpanded: false,
                  lessons: [
                    _LessonItem('u3-launch', 'انطلاقة نشطة: التعبير بالرموز الجبرية', 'ص 46'),
                    _LessonItem('u3-l1', 'الدرس 1: نظير المجموع ونظير الفرق', 'ص 47 - 49'),
                    _LessonItem('u3-l2', 'الدرس 2: حذف الأقواس', 'ص 50 - 51'),
                    _LessonItem('u3-l3', 'الدرس 3: اختزال عبارة رمزية', 'ص 52 - 53'),
                    _LessonItem('u3-l4', 'الدرس 4: نشر (a + b)(c + d)', 'ص 54 - 57'),
                    _LessonItem('u3-l5', 'الدرس 5: اختبار مساواة رمزية', 'ص 58 - 60'),
                    _LessonItem('u3-rev', 'تدريبات ومسائل الوحدة الثالثة', 'ص 61 - 66'),
                  ],
                ),

                // الوحدة الرابعة: معادلات من الدرجة الأولى
                _buildUnitTile(
                  context,
                  title: 'الوحدة 4: معادلات من الدرجة الأولى',
                  subtitle: 'الفصل الثاني • ص 67 - 83',
                  icon: '⚖️',
                  initiallyExpanded: false,
                  lessons: [
                    _LessonItem('u4-launch', 'انطلاقة نشطة: مفهوم التوازن والميزان', 'ص 67'),
                    _LessonItem('u4-l1', 'الدرس 1: مساواة وعمليات', 'ص 68 - 71'),
                    _LessonItem('u4-l2', 'الدرس 2: حل معادلة', 'ص 72 - 74'),
                    _LessonItem('u4-l3', 'الدرس 3: اصطناع معادلة', 'ص 75 - 77'),
                    _LessonItem('u4-rev', 'تدريبات ومسائل الوحدة الرابعة', 'ص 78 - 83'),
                  ],
                ),

                // الوحدة الخامسة: النسبة والتناسب
                _buildUnitTile(
                  context,
                  title: 'الوحدة 5: النسبة والتناسب',
                  subtitle: 'الفصل الثاني • ص 84 - 104',
                  icon: '📊',
                  initiallyExpanded: false,
                  lessons: [
                    _LessonItem('u5-launch', 'انطلاقة نشطة: مفهوم النسبة وجدول التناسب', 'ص 84'),
                    _LessonItem('u5-l1', 'الدرس 1: التناسب والتمثيل البياني', 'ص 85 - 89'),
                    _LessonItem('u5-l2', 'الدرس 2: السرعة الوسطى والتحويل بين الوحدات', 'ص 90 - 94'),
                    _LessonItem('u5-l3', 'الدرس 3: النسبة المئوية وتطبيقاتها الحياتية', 'ص 95 - 96'),
                    _LessonItem('u5-rev', 'تدريبات ومسائل الوحدة الخامسة', 'ص 97 - 104'),
                  ],
                ),

                // الوحدة السادسة: الإحصاء
                _buildUnitTile(
                  context,
                  title: 'الوحدة 6: الإحصاء',
                  subtitle: 'الفصل الثاني • ص 105 - 124',
                  icon: '📈',
                  initiallyExpanded: false,
                  lessons: [
                    _LessonItem('u6-launch', 'انطلاقة نشطة: جمع البيانات والمدى', 'ص 105'),
                    _LessonItem('u6-l1', 'الدرس 1: الجدول التكراري وجدول الفئات', 'ص 106 - 108'),
                    _LessonItem('u6-l2', 'الدرس 2: التكرار المتجمع (التراكمي)', 'ص 109 - 110'),
                    _LessonItem('u6-l3', 'الدرس 3: تمثيل بيانات إحصائية والمدرجات', 'ص 111 - 113'),
                    _LessonItem('u6-l4', 'الدرس 4: المتوسط الحسابي ومقاييس النزعة', 'ص 114 - 118'),
                    _LessonItem('u6-rev', 'تدريبات ومسائل الوحدة السادسة', 'ص 119 - 124'),
                  ],
                ),
              ],
            ),
          ),

          // تذييل الفهرس
          Container(
            padding: const EdgeInsets.all(12),
            color: const Color(0xFF020617),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.verified_rounded, color: Colors.greenAccent, size: 16),
                    SizedBox(width: 6),
                    Text(
                      'وزارة التربية والتعليم السورية',
                      style: TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                  ],
                ),
                Text(
                  '2025 - 2026',
                  style: TextStyle(color: Colors.amberAccent, fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUnitTile(
    BuildContext context, {
    required String title,
    required String subtitle,
    required String icon,
    required bool initiallyExpanded,
    required List<_LessonItem> lessons,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: ExpansionTile(
        initiallyExpanded: initiallyExpanded,
        leading: Text(icon, style: const TextStyle(fontSize: 20)),
        title: Text(
          title,
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: Colors.tealAccent, fontSize: 10),
        ),
        iconColor: Colors.amberAccent,
        collapsedIconColor: Colors.white70,
        children: lessons.map((lesson) {
          final isCurrent = lesson.id == currentLessonId;
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: isCurrent ? const Color(0xFF0F766E).withOpacity(0.4) : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
              border: isCurrent ? Border.all(color: Colors.amberAccent, width: 1.5) : null,
            ),
            child: ListTile(
              dense: true,
              leading: Icon(
                isCurrent ? Icons.star_rounded : Icons.play_circle_outline_rounded,
                color: isCurrent ? Colors.amberAccent : Colors.white60,
                size: 20,
              ),
              title: Text(
                lesson.title,
                style: TextStyle(
                  color: isCurrent ? Colors.amberAccent : Colors.white,
                  fontSize: 12,
                  fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                ),
              ),
              trailing: Text(
                lesson.pages,
                style: const TextStyle(color: Colors.white54, fontSize: 11),
              ),
              onTap: () {
                Navigator.of(context).pop(); // إغلاق الفهرس الجانبي
                onSelectLesson(lesson.id, lesson.title);
              },
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _LessonItem {
  final String id;
  final String title;
  final String pages;
  final bool isSpecial;
  _LessonItem(this.id, this.title, this.pages, {this.isSpecial = false});
}
`;


