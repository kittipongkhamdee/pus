// =====================================================
// config.js — ตั้งค่าระบบ
// แก้ไขค่า YOUR_... ให้ตรงกับโปรเจคของคุณ
// =====================================================

const CONFIG = {
  // --- Supabase ---
  SUPABASE_URL:     'https://nftfddlozdbnbllfbcpn.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mdGZkZGxvemRibmJsbGZiY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5ODI5MTIsImV4cCI6MjA5NjU1ODkxMn0.h7plcIp1Pe4kl-4tWkPfEeAAlD8_vNyoh32kNd05vwM',

  // --- Google Apps Script (สำหรับอัปโหลดรูป) ---
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwGpzY93Wfp5HmxM6ubCGxtYH1mc9h1LWWbS3GBRESAvWLzvo1mOSGIduE9RAX07SVl4w/exec',

  // --- ชื่อโรงเรียน (แสดงในหัวรายงาน) ---
  SCHOOL_NAME: 'โรงเรียนตาเบาวิทยา',
  SCHOOL_ADDRESS: 'อ.ปราสาท จ.สุรินทร์',

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
