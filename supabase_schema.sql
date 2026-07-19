-- 1. جدول المستخدمين (نعتمد على auth.users الخاص بـ Supabase، وهذا الجدول للبيانات الإضافية)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. جدول المتاجر (Stores) بديل الـ Account الثابت
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    store_name VARCHAR(100) NOT NULL,
    marketplace VARCHAR(50) DEFAULT 'amazon.eg',
    currency VARCHAR(10) DEFAULT 'EGP',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, store_name)
);

-- 3. أنواع الملفات والحقول المطلوبة (القيم الثابتة للنظام)
CREATE TABLE IF NOT EXISTS public.file_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL   -- 'sales' | 'inventory' | 'pricing'
);

INSERT INTO public.file_types (code) VALUES ('sales'), ('inventory'), ('pricing') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.required_fields (
    id SERIAL PRIMARY KEY,
    file_type_id INT REFERENCES public.file_types(id),
    field_key VARCHAR(50) NOT NULL,
    display_label_ar VARCHAR(100),
    display_label_en VARCHAR(100),
    is_required BOOLEAN DEFAULT true
);

-- إدراج الحقول المطلوبة الأساسية
INSERT INTO public.required_fields (file_type_id, field_key, display_label_ar, display_label_en, is_required)
VALUES 
(1, 'asin', 'الرقم التعريفي (ASIN)', 'ASIN', true),
(1, 'units_ordered', 'الوحدات المطلوبة', 'Units Ordered', true),
(1, 'revenue', 'الإيرادات', 'Revenue', true),
(2, 'asin', 'الرقم التعريفي (ASIN)', 'ASIN', true),
(2, 'available', 'الكمية المتاحة', 'Available Quantity', true),
(3, 'master_code', 'كود التجميع', 'Master Code', true),
(3, 'min_price', 'الحد الأدنى للسعر', 'Min Price', false),
(3, 'cost', 'التكلفة', 'Cost', false)
ON CONFLICT DO NOTHING;

-- 4. قوالب ربط الأعمدة
CREATE TABLE IF NOT EXISTS public.column_mapping_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    file_type_id INT REFERENCES public.file_types(id),
    template_name VARCHAR(100) DEFAULT 'Default',
    mapping JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (store_id, file_type_id, template_name)
);

-- 5. إعدادات المتجر (Store Settings)
CREATE TABLE IF NOT EXISTS public.store_settings (
    store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    config JSONB NOT NULL DEFAULT '{}'
);

-- 6. أمان مستوى الصف (Row Level Security - RLS)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.column_mapping_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- سياسة: المستخدم يرى ويعدل متاجره فقط
CREATE POLICY "Users can manage their own stores" 
ON public.stores 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their store mappings" 
ON public.column_mapping_templates 
FOR ALL USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their store settings" 
ON public.store_settings 
FOR ALL USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
);
