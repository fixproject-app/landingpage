-- SALIN SELURUH ISI FILE INI KE MENU "SQL EDITOR" DI SUPABASE ANDA LALU KLIK "RUN"
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  role text NOT NULL CHECK (role IN ('owner', 'admin')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_owner() RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner' AND is_active = true);
$$;

CREATE OR REPLACE FUNCTION public.is_staff() RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true);
$$;

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  tagline text,
  description text,
  price numeric NOT NULL DEFAULT 0,
  discount_price numeric NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  sort_order int NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path text NOT NULL,
  headline text,
  sort_order int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  value_label text NOT NULL,
  deadline timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rating smallint NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  short_text text NOT NULL,
  full_text text NOT NULL,
  screenshot_path text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand_name text NOT NULL DEFAULT 'DIGIPRO',
  logo_path text,
  whatsapp_number text NOT NULL DEFAULT '6281234567890',
  payment_methods jsonb NOT NULL DEFAULT '[]'::jsonb,
  privacy_policy_text text NOT NULL DEFAULT 'Data Anda aman bersama kami.',
  footer_text text NOT NULL DEFAULT '© 2026 DIGIPRO Indonesia.'
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text UNIQUE NOT NULL DEFAULT ('ORD-' || upper(substring(md5(random()::text) from 1 for 6))),
  buyer_name text NOT NULL,
  buyer_whatsapp text NOT NULL,
  buyer_email text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text,
  price_paid numeric NOT NULL,
  payment_status text NOT NULL DEFAULT 'menunggu' CHECK (payment_status IN ('menunggu', 'bukti_diunggah', 'lunas', 'ditolak')),
  payment_proof_path text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.page_views (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visited_at timestamptz NOT NULL DEFAULT now(),
  session_id text NOT NULL,
  source text
);

CREATE OR REPLACE FUNCTION public.submit_payment_proof(p_order_code text, p_proof_path text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order record;
BEGIN
  SELECT id, order_code INTO v_order FROM public.orders WHERE upper(order_code) = upper(trim(p_order_code));
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Kode order tidak ditemukan.'); END IF;
  UPDATE public.orders SET payment_status = 'bukti_diunggah', payment_proof_path = p_proof_path WHERE id = v_order.id;
  RETURN jsonb_build_object('success', true, 'order_code', v_order.order_code);
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_read" ON public.products FOR SELECT USING (is_active = true OR public.is_staff());
CREATE POLICY "products_write" ON public.products FOR ALL USING (public.is_owner());
CREATE POLICY "hero_read" ON public.hero_slides FOR SELECT USING (is_active = true OR public.is_staff());
CREATE POLICY "hero_write" ON public.hero_slides FOR ALL USING (public.is_owner());
CREATE POLICY "bonuses_read" ON public.bonuses FOR SELECT USING (is_active = true OR public.is_staff());
CREATE POLICY "bonuses_write" ON public.bonuses FOR ALL USING (public.is_owner());
CREATE POLICY "testi_read" ON public.testimonials FOR SELECT USING (is_active = true OR public.is_staff());
CREATE POLICY "testi_write" ON public.testimonials FOR ALL USING (public.is_owner());
CREATE POLICY "faqs_read" ON public.faqs FOR SELECT USING (is_active = true OR public.is_staff());
CREATE POLICY "faqs_write" ON public.faqs FOR ALL USING (public.is_owner());
CREATE POLICY "settings_read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "settings_write" ON public.site_settings FOR ALL USING (public.is_owner());

CREATE POLICY "orders_anon_insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_staff_select" ON public.orders FOR SELECT USING (public.is_staff());
CREATE POLICY "orders_staff_update" ON public.orders FOR UPDATE USING (public.is_staff());
CREATE POLICY "orders_owner_delete" ON public.orders FOR DELETE USING (public.is_owner());
CREATE POLICY "views_anon_insert" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "views_staff_select" ON public.page_views FOR SELECT USING (public.is_staff());

INSERT INTO storage.buckets (id, name, public) VALUES ('public-assets', 'public-assets', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false) ON CONFLICT DO NOTHING;

CREATE POLICY "public_assets_read" ON storage.objects FOR SELECT USING (bucket_id = 'public-assets');
CREATE POLICY "payment_proofs_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');
CREATE POLICY "payment_proofs_staff_read" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs' AND public.is_staff());

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
