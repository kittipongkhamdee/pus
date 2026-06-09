// app.js — ระบบสำรวจครุภัณฑ์โรงเรียน
import CONFIG from './config.js'
import supabase from './supabase.js'

// ── State ──────────────────────────────────────────────
let rooms = []
let assets = []
let currentUser = null
let userRole = null
let charts = {}
let editingAssetId = null
let editingRoomId = null

// ── Utilities ──────────────────────────────────────────
const $ = id => document.getElementById(id)
const toast = (msg, type = 'info') => {
  const el = document.createElement('div')
  el.className = `toast toast-${type}`
  el.textContent = msg
  $('toast-container').appendChild(el)
  setTimeout(() => el.remove(), 3500)
}
const fmt = n => (n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const condClass = c => c === 'ใช้งานได้' ? 'condition-good' : c === 'ต้องซ่อม' ? 'condition-repair' : 'condition-broken'
const getCategories = () => [...new Set(assets.map(a => a.category).filter(Boolean))].sort()
const canEdit = () => userRole === 'admin' || userRole === 'staff'

// ── Navigation ─────────────────────────────────────────
function navigate(page) {
  document.querySelectorAll('#app > main .page').forEach(p => p.classList.add('hidden'))
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
  $(`page-${page}`)?.classList.remove('hidden')
  document.querySelector(`[data-nav="${page}"]`)?.classList.add('active')
  if (page === 'dashboard') renderDashboard()
  if (page === 'assets') renderAssets()
  if (page === 'rooms') renderRooms()
  if (page === 'report') renderReport()
}

// ── Profile & role ─────────────────────────────────────
async function loadProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (data) {
    userRole = data.role || 'viewer'
    $('user-name').textContent = data.display_name || currentUser.email
    $('user-role').textContent = CONFIG.ROLES[(data.role || '').toUpperCase()] || data.role || '—'
  } else {
    await supabase.from('profiles').insert({ id: userId, display_name: currentUser.email, role: 'viewer' })
    userRole = 'viewer'
    $('user-name').textContent = currentUser.email
    $('user-role').textContent = CONFIG.ROLES.VIEWER
  }
  document.querySelectorAll('.staff-only').forEach(el => {
    el.style.display = canEdit() ? '' : 'none'
  })
}

// ── Data loading ───────────────────────────────────────
async function loadRooms() {
  const { data, error } = await supabase.from('rooms').select('*').order('code')
  if (!error) rooms = data || []
  populateRoomSelects()
}

async function loadAssets() {
  const { data, error } = await supabase.from('assets').select('*').order('name')
  if (!error) assets = data || []
  populateCategorySelects()
}

function populateRoomSelects() {
  const opts = rooms.map(r => `<option value="${r.id}">${r.code} — ${r.name}</option>`).join('')
  document.querySelectorAll('.select-room').forEach(sel => {
    const cur = sel.value
    sel.innerHTML = `<option value="">ทุกห้อง</option>` + opts
    if (cur) sel.value = cur
  })
  const ar = $('asset-room')
  if (ar) ar.innerHTML = `<option value="">-- เลือกห้อง --</option>` + opts
}

function populateCategorySelects() {
  const cats = getCategories()
  const opts = cats.map(c => `<option value="${c}">${c}</option>`).join('')
  document.querySelectorAll('.select-category').forEach(sel => {
    const cur = sel.value
    sel.innerHTML = `<option value="">ทุกประเภท</option>` + opts
    if (cur) sel.value = cur
  })
  const ac = $('asset-category')
  if (ac) ac.innerHTML = `<option value="">-- เลือกประเภท --</option>` + opts
}

// ── Dashboard ──────────────────────────────────────────
function renderDashboard() {
  const qtyTotal = assets.reduce((s, a) => s + (a.qty || 0), 0)
  const valTotal = assets.reduce((s, a) => s + ((a.qty || 0) * (a.unit_price || 0)), 0)
  const good = assets.filter(a => a.condition === 'ใช้งานได้').length
  const repair = assets.filter(a => a.condition === 'ต้องซ่อม').length
  const broken = assets.filter(a => a.condition === 'ชำรุด').length
  const unsurveyed = assets.filter(a => !a.surveyed).length

  $('dash-rooms').textContent = rooms.length
  $('dash-items').textContent = assets.length
  $('dash-qty').textContent = qtyTotal.toLocaleString('th-TH')
  $('dash-value').textContent = '฿' + fmt(valTotal)
  $('dash-good').textContent = good
  $('dash-repair').textContent = repair
  $('dash-broken').textContent = broken
  $('dash-unsurveyed').textContent = unsurveyed

  renderCharts(good, repair, broken)
}

function renderCharts(good, repair, broken) {
  if (typeof Chart === 'undefined') return

  if (charts.condition) charts.condition.destroy()
  charts.condition = new Chart($('chart-condition'), {
    type: 'doughnut',
    data: {
      labels: ['ใช้งานได้', 'ต้องซ่อม', 'ชำรุด'],
      datasets: [{ data: [good, repair, broken], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'], borderWidth: 2 }],
    },
    options: { plugins: { legend: { position: 'bottom' } }, cutout: '60%' },
  })

  const cats = getCategories()
  const catCounts = cats.map(c => assets.filter(a => a.category === c).length)
  if (charts.category) charts.category.destroy()
  charts.category = new Chart($('chart-category'), {
    type: 'bar',
    data: {
      labels: cats.length ? cats : ['ยังไม่มีข้อมูล'],
      datasets: [{ label: 'จำนวนรายการ', data: cats.length ? catCounts : [0], backgroundColor: '#4f46e5', borderRadius: 6 }],
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
  })
}

// ── Assets ─────────────────────────────────────────────
function getFiltered() {
  const search = $('filter-search')?.value.toLowerCase() || ''
  const room = $('filter-room')?.value || ''
  const cat = $('filter-category')?.value || ''
  const cond = $('filter-condition')?.value || ''
  return assets.filter(a => {
    if (search && !a.name?.toLowerCase().includes(search)) return false
    if (room && a.room_id !== room) return false
    if (cat && a.category !== cat) return false
    if (cond && a.condition !== cond) return false
    return true
  })
}

function renderAssets() {
  const list = getFiltered()
  const tbody = $('assets-tbody')
  if (!tbody) return
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:40px;color:#94a3b8;">ไม่พบข้อมูล</td></tr>'
    return
  }
  tbody.innerHTML = list.map(a => {
    const room = rooms.find(r => r.id === a.room_id)
    const total = (a.qty || 0) * (a.unit_price || 0)
    const edit = canEdit() ? `<button class="btn-icon" onclick="window._editAsset('${a.id}')">✏️</button>` : ''
    const del = canEdit() ? `<button class="btn-icon btn-delete" onclick="window._delAsset('${a.id}')">🗑️</button>` : ''
    return `<tr>
      <td>${a.name}</td>
      <td style="color:#94a3b8;font-size:13px;">${a.asset_number || '—'}</td>
      <td>${room ? `${room.code} ${room.name}` : '—'}</td>
      <td>${a.category || '—'}</td>
      <td class="text-right">${(a.qty || 0).toLocaleString('th-TH')}</td>
      <td class="text-right">฿${fmt(total)}</td>
      <td><span class="condition-badge ${condClass(a.condition)}">${a.condition || '—'}</span></td>
      <td>${edit}${del}</td>
    </tr>`
  }).join('')
}

// ── Rooms ──────────────────────────────────────────────
function renderRooms() {
  const tbody = $('rooms-tbody')
  if (!tbody) return
  if (!rooms.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:40px;color:#94a3b8;">ไม่พบข้อมูล</td></tr>'
    return
  }
  tbody.innerHTML = rooms.map(r => {
    const edit = canEdit() ? `<button class="btn-icon" onclick="window._editRoom('${r.id}')">✏️</button>` : ''
    const del = canEdit() ? `<button class="btn-icon btn-delete" onclick="window._delRoom('${r.id}')">🗑️</button>` : ''
    return `<tr>
      <td><strong>${r.code}</strong></td>
      <td>${r.name}</td>
      <td>${r.building || '—'}</td>
      <td>${r.floor || '—'}</td>
      <td style="color:#64748b;font-size:13px;">${r.description || '—'}</td>
      <td>${edit}${del}</td>
    </tr>`
  }).join('')
}

// ── Report ──────────────────────────────────────────────
function renderReport() {
  const roomTbody = $('report-room-tbody')
  if (roomTbody) {
    const rows = rooms.map(r => {
      const ra = assets.filter(a => a.room_id === r.id)
      const qty = ra.reduce((s, a) => s + (a.qty || 0), 0)
      const val = ra.reduce((s, a) => s + ((a.qty || 0) * (a.unit_price || 0)), 0)
      const badges = CONFIG.CONDITIONS.map(c => {
        const n = ra.filter(a => a.condition === c.value).length
        return n ? `<span class="condition-badge ${condClass(c.value)}">${c.value} ${n}</span>` : ''
      }).filter(Boolean).join(' ')
      return `<tr>
        <td><strong>${r.code}</strong> ${r.name}</td>
        <td class="text-right">${ra.length}</td>
        <td class="text-right">${qty.toLocaleString('th-TH')}</td>
        <td class="text-right">฿${fmt(val)}</td>
        <td>${badges || '—'}</td>
      </tr>`
    })
    roomTbody.innerHTML = rows.join('') || '<tr><td colspan="5" class="text-center" style="padding:30px;color:#94a3b8;">ไม่มีข้อมูล</td></tr>'
  }

  const catTbody = $('report-cat-tbody')
  if (catTbody) {
    const cats = getCategories()
    const rows = cats.map(c => {
      const ca = assets.filter(a => a.category === c)
      const qty = ca.reduce((s, a) => s + (a.qty || 0), 0)
      const val = ca.reduce((s, a) => s + ((a.qty || 0) * (a.unit_price || 0)), 0)
      return `<tr>
        <td>${c}</td>
        <td class="text-right">${ca.length}</td>
        <td class="text-right">${qty.toLocaleString('th-TH')}</td>
        <td class="text-right">฿${fmt(val)}</td>
      </tr>`
    })
    catTbody.innerHTML = rows.join('') || '<tr><td colspan="4" class="text-center" style="padding:30px;color:#94a3b8;">ไม่มีข้อมูล</td></tr>'
  }
}

// ── Modal helpers ──────────────────────────────────────
const openModal = id => $(id).classList.remove('hidden')
const closeModal = id => $(id).classList.add('hidden')

function openAddAsset() {
  editingAssetId = null
  $('asset-form-title').textContent = 'เพิ่มครุภัณฑ์ใหม่'
  $('form-asset').reset()
  $('asset-total-display').textContent = '฿0.00'
  $('asset-image-url').value = ''
  openModal('modal-asset')
}

window._editAsset = function(id) {
  const a = assets.find(x => x.id === id)
  if (!a) return
  editingAssetId = id
  $('asset-form-title').textContent = 'แก้ไขครุภัณฑ์'
  $('asset-name').value = a.name || ''
  $('asset-room').value = a.room_id || ''
  $('asset-category').value = a.category || ''
  $('asset-number').value = a.asset_number || ''
  $('asset-condition').value = a.condition || 'ใช้งานได้'
  $('asset-qty').value = a.qty || 1
  $('asset-unit-price').value = a.unit_price || 0
  $('asset-year').value = a.year || ''
  $('asset-note').value = a.note || ''
  $('asset-image-url').value = a.image_url || ''
  updateTotal()
  openModal('modal-asset')
}

window._editRoom = function(id) {
  const r = rooms.find(x => x.id === id)
  if (!r) return
  editingRoomId = id
  $('room-code').value = r.code || ''
  $('room-floor').value = r.floor || ''
  $('room-name-input').value = r.name || ''
  $('room-building').value = r.building || ''
  $('room-desc').value = r.description || ''
  document.querySelector('#modal-room .modal-title').textContent = 'แก้ไขห้อง'
  openModal('modal-room')
}

window._delAsset = async function(id) {
  if (!confirm('ลบครุภัณฑ์นี้ใช่หรือไม่?')) return
  const { error } = await supabase.from('assets').delete().eq('id', id)
  if (error) { toast('เกิดข้อผิดพลาด: ' + error.message, 'error'); return }
  toast('ลบสำเร็จ', 'success')
  assets = assets.filter(a => a.id !== id)
  renderAssets()
}

window._delRoom = async function(id) {
  if (!confirm('ลบห้องนี้ใช่หรือไม่?')) return
  const { error } = await supabase.from('rooms').delete().eq('id', id)
  if (error) { toast('เกิดข้อผิดพลาด: ' + error.message, 'error'); return }
  toast('ลบสำเร็จ', 'success')
  rooms = rooms.filter(r => r.id !== id)
  populateRoomSelects()
  renderRooms()
}

function updateTotal() {
  const qty = parseFloat($('asset-qty').value) || 0
  const price = parseFloat($('asset-unit-price').value) || 0
  $('asset-total-display').textContent = '฿' + fmt(qty * price)
}

// ── Image upload (compress → Google Drive) ─────────────
async function compressAndUpload(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const maxW = 800
        const scale = img.width > maxW ? maxW / img.width : 1
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(async blob => {
          if (!blob) return resolve('')
          const form = new FormData()
          form.append('file', blob, file.name)
          try {
            const res = await fetch(CONFIG.GOOGLE_SCRIPT_URL, { method: 'POST', body: form })
            const json = await res.json()
            resolve(json.url || json.fileUrl || '')
          } catch { resolve('') }
        }, 'image/jpeg', CONFIG.IMAGE_QUALITY)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// ── CRUD ───────────────────────────────────────────────
async function saveAsset(e) {
  e.preventDefault()
  let imageUrl = $('asset-image-url').value || ''
  const fileInput = $('asset-image-file')
  if (fileInput.files.length) {
    toast('กำลังอัปโหลดรูปภาพ...', 'info')
    imageUrl = await compressAndUpload(fileInput.files[0])
  }

  const payload = {
    name: $('asset-name').value.trim(),
    room_id: $('asset-room').value || null,
    category: $('asset-category').value || null,
    asset_number: $('asset-number').value.trim() || null,
    condition: $('asset-condition').value,
    qty: parseInt($('asset-qty').value) || 1,
    unit_price: parseFloat($('asset-unit-price').value) || 0,
    year: parseInt($('asset-year').value) || null,
    note: $('asset-note').value.trim() || null,
    image_url: imageUrl || null,
    surveyed: true,
    updated_at: new Date().toISOString(),
  }

  let error
  if (editingAssetId) {
    ;({ error } = await supabase.from('assets').update(payload).eq('id', editingAssetId))
  } else {
    ;({ error } = await supabase.from('assets').insert(payload))
  }
  if (error) { toast('เกิดข้อผิดพลาด: ' + error.message, 'error'); return }

  toast(editingAssetId ? 'แก้ไขสำเร็จ' : 'เพิ่มครุภัณฑ์สำเร็จ', 'success')
  closeModal('modal-asset')
  await loadAssets()
  renderAssets()
}

async function saveRoom(e) {
  e.preventDefault()
  const payload = {
    code: $('room-code').value.trim(),
    name: $('room-name-input').value.trim(),
    building: $('room-building').value.trim() || null,
    floor: $('room-floor').value.trim() || null,
    description: $('room-desc').value.trim() || null,
  }

  let error
  if (editingRoomId) {
    ;({ error } = await supabase.from('rooms').update(payload).eq('id', editingRoomId))
  } else {
    ;({ error } = await supabase.from('rooms').insert(payload))
  }
  if (error) { toast('เกิดข้อผิดพลาด: ' + error.message, 'error'); return }

  toast(editingRoomId ? 'แก้ไขห้องสำเร็จ' : 'เพิ่มห้องสำเร็จ', 'success')
  closeModal('modal-room')
  editingRoomId = null
  document.querySelector('#modal-room .modal-title').textContent = 'เพิ่มห้องใหม่'
  await loadRooms()
  renderRooms()
}

// ── Export ─────────────────────────────────────────────
function toRow(a) {
  const room = rooms.find(r => r.id === a.room_id)
  return {
    'ชื่อครุภัณฑ์': a.name,
    'เลขครุภัณฑ์': a.asset_number || '',
    'ห้อง': room ? `${room.code} ${room.name}` : '',
    'ประเภท': a.category || '',
    'จำนวน': a.qty || 0,
    'ราคาต่อหน่วย': a.unit_price || 0,
    'มูลค่ารวม': (a.qty || 0) * (a.unit_price || 0),
    'สภาพ': a.condition || '',
    'ปีที่ได้รับ': a.year || '',
    'หมายเหตุ': a.note || '',
  }
}

function exportExcel() {
  if (typeof XLSX === 'undefined') { toast('ไม่พบไลบรารี SheetJS', 'error'); return }
  const ws = XLSX.utils.json_to_sheet(getFiltered().map(toRow))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'ครุภัณฑ์')
  XLSX.writeFile(wb, `ครุภัณฑ์_${CONFIG.SCHOOL_NAME}.xlsx`)
}

function exportCSV() {
  const rows = getFiltered().map(a => {
    const r = toRow(a)
    return Object.values(r).map(v => `"${v}"`).join(',')
  })
  const csv = [Object.keys(toRow(assets[0] || {})).join(','), ...rows].join('\n')
  download('﻿' + csv, 'ครุภัณฑ์.csv', 'text/csv;charset=utf-8;')
}

function exportJSON() {
  download(JSON.stringify(getFiltered().map(toRow), null, 2), 'ครุภัณฑ์.json', 'application/json')
}

function download(content, filename, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Event listeners ────────────────────────────────────
function setupEvents() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.nav))
  })

  // Login form
  $('form-login').addEventListener('submit', async e => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({
      email: $('input-email').value.trim(),
      password: $('input-password').value,
    })
    if (error) toast('เข้าสู่ระบบไม่สำเร็จ: ' + error.message, 'error')
  })

  // Logout
  $('btn-logout').addEventListener('click', async () => {
    await supabase.auth.signOut()
    toast('ออกจากระบบสำเร็จ', 'info')
    currentUser = null; userRole = null
  })

  // Modal close
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal))
  })
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id) })
  })

  // Add asset button
  $('btn-add-asset')?.addEventListener('click', openAddAsset)

  // Forms
  $('form-asset').addEventListener('submit', saveAsset)
  $('form-room').addEventListener('submit', saveRoom)

  // Total auto-calc
  $('asset-qty').addEventListener('input', updateTotal)
  $('asset-unit-price').addEventListener('input', updateTotal)

  // Filters
  ;['filter-search', 'filter-room', 'filter-category', 'filter-condition'].forEach(id => {
    $(id)?.addEventListener('input', renderAssets)
    $(id)?.addEventListener('change', renderAssets)
  })

  // Export
  $('btn-export-excel')?.addEventListener('click', exportExcel)
  $('btn-export-csv')?.addEventListener('click', exportCSV)
  $('btn-export-json')?.addEventListener('click', exportJSON)
  $('btn-export-pdf')?.addEventListener('click', () => window.print())
}

// ── Boot ───────────────────────────────────────────────
async function initApp(user) {
  currentUser = user
  await loadProfile(user.id)
  await Promise.all([loadRooms(), loadAssets()])
  setupEvents()
  navigate('dashboard')
}

supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user && !currentUser) {
    await initApp(session.user)
  }
})
