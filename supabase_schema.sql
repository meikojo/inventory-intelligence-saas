-- 1. جدول المستخدمين (نعتمد على auth.users الخاص بـ Supabase، وهذا الجدول للبيانات الإضافية)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'free',
    role VARCHAR(50) DEFAULT 'user',
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

-- إدخال القيم الأساسية لأنواع الملفات
INSERT INTO public.file_types (code) VALUES 
('sales'), ('inventory'), ('pricing')
ON CONFLICT (code) DO NOTHING;

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

-- 5. جدول إعدادات النظام (للإضافة المتصفح الديناميكية)
CREATE TABLE IF NOT EXISTS public.system_config (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- إدخال أوامر السحب الافتراضية
INSERT INTO public.system_config (key, value) VALUES (
    'amazon_scraping_rules',
    '{"version": 1, "business_reports_url": "https://sellercentral.amazon.com/business-reports", "selectors": {"date_range": "#date-range-picker", "download_btn": "#download-csv-btn", "table": "#report-table"}}'
) ON CONFLICT (key) DO NOTHING;


-- تفعيل مستوى الحماية (Row Level Security)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.column_mapping_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- حماية جدول المتاجر
DROP POLICY IF EXISTS "Users can view their own stores" ON public.stores;
CREATE POLICY "Users can view their own stores" ON public.stores FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own stores" ON public.stores;
CREATE POLICY "Users can insert their own stores" ON public.stores FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own stores" ON public.stores;
CREATE POLICY "Users can update their own stores" ON public.stores FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own stores" ON public.stores;
CREATE POLICY "Users can delete their own stores" ON public.stores FOR DELETE USING (auth.uid() = user_id);

-- حماية جدول المستخدمين
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users AS u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- حماية جدول إعدادات النظام
DROP POLICY IF EXISTS "Anyone can read system config" ON public.system_config;
CREATE POLICY "Anyone can read system config" ON public.system_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can update system config" ON public.system_config;
CREATE POLICY "Only admins can update system config" ON public.system_config FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- بناء Trigger لإنشاء مستخدم جديد تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- اجعل أول مستخدم يسجل هو الأدمن، والبقية مستخدمين عاديين
  IF NOT EXISTS (SELECT 1 FROM public.users) THEN
      INSERT INTO public.users (id, email, role) VALUES (new.id, new.email, 'admin');
  ELSE
      INSERT INTO public.users (id, email, role) VALUES (new.id, new.email, 'user');
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
