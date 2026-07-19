# 🧠 Inventory Intelligence SaaS - Project Memory

## 🎯 الهيكل الأساسي (Foundation)
- **المشروع**: Inventory Intelligence SaaS
- **الهدف**: تحويل التطبيق المكتبي إلى منصة SaaS متعددة المستأجرين تعمل على الويب.
- **الواجهة**: React 19 + Vite (Vanilla CSS: Charcoal `#14110F`, Amber `#E08A2E`, Green `#3FA66B`)
- **الخلفية**: FastAPI (Python)
- **قاعدة البيانات**: PostgreSQL (Supabase) + RLS + Supabase Auth.
- **التصميم**: معتمد على توجيهات `ui-ux-pro-max` - خطوط هندسية، مساحات واضحة، Glassmorphism مخفف.

## 🚧 الأخطاء السابقة (Lessons Learned من النسخة المكتبية)
يجب ألا تتكرر هذه الأخطاء أبداً في هذه النسخة:
1. **BOM Corruption**: دائماً اقرأ الـ CSV بـ `encoding='utf-8-sig'` لكي لا يضيع اسم العمود الأول.
2. **Hardcoded Columns**: يمنع منعاً باتاً كتابة `Units Ordered` أو `(Child) ASIN` في الكود. كل شيء يمر عبر `column_mapping_templates`.
3. **Duplicate ASINs**: دائماً قم بعمل Aggregation (جمع الوحدات والمبالغ) في بايثون للمنتجات المكررة قبل الإدخال في قاعدة البيانات لتجنب `UNIQUE constraint failed`.
4. **Anchor Filter**: الـ Sales تُعالج أولاً، ثم الـ Pricing، ثم الـ Inventory، لأن الأخيرين يعتمدان على وجود הـ ASIN في المبيعات.
5. **Missing Prices**: غياب ملف الأسعار هو الآن **حالة طبيعية**، يجب معالجة `null` في السعر أو `capital_exposure`. لا تضرب `error` إذا غاب السعر.
6. **Data Isolation (RLS)**: يجب تفعيل الـ Row Level Security على جميع جداول `PostgreSQL` من اللحظة الأولى.
7. **Scraping**: لا تضع أي سكرابر `Playwright` على السيرفر الخلفي أبداً.

## 📝 سجل الجلسات (Session Log)

### Session 1 - Foundation & Scaffold
- إنشاء المجلد الأساسي `inventory-intelligence-saas`.
- جاري تهيئة الواجهة والخلفية.
