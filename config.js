// =====================================================
// config.js — ตั้งค่าระบบ
// แก้ไขค่า YOUR_... ให้ตรงกับโปรเจคของคุณ
// =====================================================

const CONFIG = {
  // --- Supabase ---
  SUPABASE_URL:     'https://YOUR_PROJECT_ID.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',

  // --- Google Apps Script (สำหรับอัปโหลดรูป) ---
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',

  // --- ชื่อโรงเรียน (แสดงในหัวรายงาน) ---
  SCHOOL_NAME: 'โรงเรียนของฉัน',
  SCHOOL_ADDRESS: 'ที่อยู่โรงเรียน',

  // --- ขนาดรูปภาพสูงสุด (KB) ก่อน compress ---
  MAX_IMAGE_SIZE_KB: 500,
  IMAGE_QUALITY: 0.7,

  // --- สถานะครุภัณฑ์ ---
  CONDITIONS: [
    { value: 'ใช้งานได้',  label: 'ใช้งานได้',  color: '#22c55e' },
    { value: 'ต้องซ่อม',   label: 'ต้องซ่อม',   color: '#f59e0b' },
    { value: 'ชำรุด',      label: 'ชำรุด',      color: '#ef4444' },
  ],

  // --- บทบาทผู้ใช้ ---
  ROLES: {
    ADMIN:  'ผู้ดูแลระบบ',
    STAFF:  'เจ้าหน้าที่',
    VIEWER: 'ผู้ดูข้อมูล',
  },
};

export default CONFIG;
