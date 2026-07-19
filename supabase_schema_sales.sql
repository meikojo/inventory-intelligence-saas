
-- 6. جدول المبيعات (Sales Data) لتخزين البيانات المستخرجة والجاهزة للتحليل
CREATE TABLE IF NOT EXISTS public.sales_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sku VARCHAR(100) NOT NULL,
    units INT DEFAULT 0,
    amount DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sales_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sales data" ON public.sales_data;
CREATE POLICY "Users can view their own sales data" ON public.sales_data FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own sales data" ON public.sales_data;
CREATE POLICY "Users can insert their own sales data" ON public.sales_data FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
);
