-- ============================================================
-- schema.sql — ระบบสำรวจครุภัณฑ์โรงเรียน (Supabase)
-- รันใน Supabase SQL Editor ก่อนใช้งานระบบ
-- ============================================================

-- 1. ห้องเรียน/ห้องต่างๆ
CREATE TABLE IF NOT EXISTS rooms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL,
  name        text NOT NULL,
  building    text,
  floor       text,
  description text,
  created_at  timestamptz DEFAULT now()
);

-- 2. ครุภัณฑ์
CREATE TABLE IF NOT EXISTS assets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  asset_number text,
  room_id      uuid REFERENCES rooms(id) ON DELETE SET NULL,
  category     text,
  condition    text DEFAULT 'ใช้งานได้' CHECK (condition IN ('ใช้งานได้','ต้องซ่อม','ชำรุด')),
  qty          integer DEFAULT 1,
  unit_price   numeric DEFAULT 0,
  year         integer,
  image_url    text,
  note         text,
  surveyed     boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- 3. โปรไฟล์ผู้ใช้ (role)
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  role         text DEFAULT 'viewer' CHECK (role IN ('admin','staff','viewer')),
  created_at   timestamptz DEFAULT now()
);

-- ── Row Level Security ──────────────────────────────────

ALTER TABLE rooms   ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ดูได้ทุกคนที่ login
CREATE POLICY "read rooms"   ON rooms   FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read assets"  ON assets  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- แก้ไข/ลบ/เพิ่ม เฉพาะ admin และ staff
CREATE POLICY "write rooms" ON rooms FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

CREATE POLICY "write assets" ON assets FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

-- สร้าง/แก้ไข profile ของตัวเอง
CREATE POLICY "upsert own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- ── ฟังก์ชัน updated_at อัตโนมัติ ─────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assets_updated
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ข้อมูลตัวอย่าง (optional) ──────────────────────────
/*
INSERT INTO rooms (code, name, building, floor) VALUES
  ('A101', 'ห้องเรียน ป.1/1', 'อาคาร A', '1'),
  ('A102', 'ห้องเรียน ป.1/2', 'อาคาร A', '1'),
  ('LAB1', 'ห้องคอมพิวเตอร์', 'อาคาร B', '2'),
  ('LIB',  'ห้องสมุด',        'อาคาร C', '1');

INSERT INTO assets (name, asset_number, room_id, category, condition, qty, unit_price, year, surveyed)
SELECT 'โต๊ะนักเรียน', '001/2567', id, 'เฟอร์นิเจอร์', 'ใช้งานได้', 30, 1200, 2567, true FROM rooms WHERE code='A101';
*/
