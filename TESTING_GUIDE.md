# 📋 PANDUAN TESTING - SCHEDULER CALENDAR APP

## 🎯 Fitur yang Sudah Ada

Aplikasi Anda sudah memiliki:
1. ✅ **CRUD** (Create, Read, Update, Delete) untuk Events
2. ✅ **Notifikasi** (disimpan ke Firestore)
3. ✅ **Toast Messages** (popup notifikasi di layar)
4. ✅ **Autentikasi** (Login/Signup)

---

## 🧪 CARA TESTING LENGKAP

### 1️⃣ **CREATE (Membuat Event Baru)**

**Langkah-langkah:**
1. Buka aplikasi di browser (gunakan Live Server)
2. Login dengan akun Anda
3. Di halaman `monthly_view.html`, klik tombol **"+ New Event"**
4. Isi form:
   - **Event Title**: Contoh: "Meeting dengan Client"
   - **Description**: Contoh: "Diskusi project baru"
   - **Start Date & Time**: Pilih tanggal dan waktu mulai
   - **End Date & Time**: Pilih tanggal dan waktu selesai
   - **Location**: Contoh: "Ruang Meeting A"
5. Klik tombol **"Create Event"**

**Yang Harus Terjadi:**
- ✅ Muncul **toast notification** "Event created" (pojok layar)
- ✅ Redirect otomatis ke `monthly_view.html`
- ✅ Event muncul di kalender pada tanggal yang dipilih
- ✅ **Notifikasi tersimpan di Firestore** (collection: `notifications`)

**Cara Cek Notifikasi di Firebase:**
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Klik **Firestore Database**
4. Lihat collection **"notifications"**
5. Akan ada record baru dengan:
   - `type: "create"`
   - `eventId: "xxx"`
   - `title: "Meeting dengan Client"`
   - `userId: "xxx"`
   - `timestamp: [waktu sekarang]`

---

### 2️⃣ **READ (Melihat Event)**

**Langkah-langkah:**
1. Di `monthly_view.html`, lihat event yang sudah dibuat
2. Event akan muncul sebagai **kotak kecil** di tanggal yang sesuai
3. Coba juga buka:
   - **Weekly View** (`weekly_view.html`) - lihat event per minggu
   - **Daily View** (`daily_view.html`) - lihat event per hari

**Yang Harus Terjadi:**
- ✅ Event muncul di semua view (Monthly, Weekly, Daily)
- ✅ Klik event akan membuka halaman edit

---

### 3️⃣ **UPDATE (Edit Event)**

**Langkah-langkah:**
1. Di kalender, **klik pada event** yang ingin diedit
2. Akan redirect ke `edit_event.html?id=xxx`
3. Form akan otomatis terisi dengan data event
4. Ubah beberapa field, contoh:
   - Ganti **Title** menjadi "Meeting dengan Client - UPDATED"
   - Ganti **Location** menjadi "Ruang Meeting B"
5. Klik tombol **"Update Event"**

**Yang Harus Terjadi:**
- ✅ Redirect ke `monthly_view.html`
- ✅ Event di kalender sudah berubah sesuai edit
- ✅ Data di Firestore terupdate

**CATATAN:** Saat ini **tidak ada toast notification** untuk update. Jika Anda ingin menambahkannya, saya bisa bantu!

---

### 4️⃣ **DELETE (Hapus Event)**

**Langkah-langkah:**
1. Klik event di kalender
2. Di halaman `edit_event.html`, klik tombol **"Delete Event"**
3. Akan muncul **konfirmasi popup**: "Delete this event?"
4. Klik **OK** untuk konfirmasi

**Yang Harus Terjadi:**
- ✅ Event hilang dari kalender
- ✅ Redirect ke `monthly_view.html`
- ✅ Data terhapus dari Firestore

**CATATAN:** Saat ini **tidak ada toast notification** untuk delete. Jika Anda ingin menambahkannya, saya bisa bantu!

---

## 🔔 TESTING NOTIFIKASI

### Notifikasi Saat Ini:
Aplikasi Anda **hanya menyimpan notifikasi ke Firestore** saat **CREATE event**.

**Cara Cek:**
1. Buat event baru (ikuti langkah CREATE di atas)
2. Buka Firebase Console → Firestore Database
3. Lihat collection **"notifications"**
4. Akan ada record baru setiap kali Anda create event

### Notifikasi yang Belum Ada:
- ❌ Notifikasi untuk **UPDATE** event
- ❌ Notifikasi untuk **DELETE** event
- ❌ Tampilan daftar notifikasi di UI (halaman khusus notifikasi)

---

## 🎨 TESTING TOAST MESSAGES

**Toast** adalah popup kecil yang muncul di layar untuk memberi feedback.

**Cara Test:**
1. Create event baru
2. Perhatikan **pojok kanan bawah layar**
3. Akan muncul kotak hijau dengan teks **"Event created"**
4. Toast akan hilang otomatis setelah 3 detik

**Lokasi Kode Toast:**
- File: `js/app.js` (baris 12-18)
- Function: `showToast(message, type = "success")`

---

## 🚀 CARA MENJALANKAN APLIKASI

### Opsi 1: Live Server (Recommended)
1. Install extension **Live Server** di VS Code
2. Klik kanan pada `index.html` atau `login.html`
3. Pilih **"Open with Live Server"**
4. Browser akan otomatis terbuka

### Opsi 2: Manual
1. Buka file `login.html` langsung di browser
2. **CATATAN:** Beberapa fitur mungkin tidak jalan karena CORS policy

---

## 📊 CHECKLIST TESTING

Gunakan checklist ini untuk memastikan semua fitur berfungsi:

### Authentication
- [ ] Signup akun baru berhasil
- [ ] Login dengan akun yang sudah ada berhasil
- [ ] Logout berhasil dan redirect ke login page

### CRUD Operations
- [ ] **CREATE**: Buat event baru → muncul di kalender
- [ ] **READ**: Event muncul di Monthly/Weekly/Daily view
- [ ] **UPDATE**: Edit event → perubahan tersimpan
- [ ] **DELETE**: Hapus event → event hilang dari kalender

### Notifications
- [ ] Notifikasi CREATE tersimpan di Firestore
- [ ] Toast "Event created" muncul saat create event

### UI/UX
- [ ] Navigasi antar halaman (Monthly/Weekly/Daily) berfungsi
- [ ] Form validation berfungsi (required fields)
- [ ] Responsive design (coba resize browser)

---

## 🐛 TROUBLESHOOTING

### Problem: Event tidak muncul di kalender
**Solusi:**
1. Cek console browser (F12) untuk error
2. Pastikan sudah login
3. Cek Firebase Firestore apakah data tersimpan
4. Pastikan `userId` di event sama dengan user yang login

### Problem: Toast tidak muncul
**Solusi:**
1. Cek file `css/style.css` apakah ada style untuk `.toast`
2. Buka console browser, cek error JavaScript

### Problem: Notifikasi tidak tersimpan di Firestore
**Solusi:**
1. Cek Firebase Console → Firestore Rules
2. Pastikan rules mengizinkan write untuk collection `notifications`
3. Cek console browser untuk error

---

## 💡 SARAN IMPROVEMENT

Jika Anda ingin menambahkan fitur:

1. **Toast untuk UPDATE & DELETE**
   - Tambahkan `showToast()` di function update dan delete

2. **Notifikasi untuk UPDATE & DELETE**
   - Tambahkan `addNotificationRecord()` di function update dan delete

3. **Halaman Daftar Notifikasi**
   - Buat halaman baru untuk menampilkan semua notifikasi
   - Tampilkan dalam format list dengan waktu

4. **Real-time Notifications**
   - Gunakan Firebase Cloud Messaging (FCM)
   - Kirim push notification ke browser

---

## 📞 BANTUAN

Jika ada yang tidak jelas atau butuh bantuan:
1. Cek console browser (F12) untuk error messages
2. Cek Firebase Console untuk data di Firestore
3. Tanyakan kepada saya dengan detail error yang muncul

---

**Selamat Testing! 🎉**
