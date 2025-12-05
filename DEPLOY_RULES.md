# Cara Deploy Firestore Rules ke Firebase

## Metode 1: Melalui Firebase Console (Paling Mudah)

1. **Buka Firebase Console:**
   - Pergi ke: https://console.firebase.google.com/
   - Pilih project Anda

2. **Navigasi ke Firestore Rules:**
   - Klik menu **"Firestore Database"** di sidebar kiri
   - Klik tab **"Rules"** di bagian atas

3. **Copy & Paste Rules:**
   - Buka file `firestore.rules` di project Anda
   - Copy semua isinya
   - Paste ke editor di Firebase Console
   - Klik tombol **"Publish"**

4. **Verifikasi:**
   - Setelah publish, coba akses aplikasi Anda
   - Test apakah data sudah bisa dibaca

---

## Metode 2: Menggunakan Firebase CLI

### Prasyarat:
```bash
# Install Firebase CLI (jika belum)
npm install -g firebase-tools

# Login ke Firebase
firebase login
```

### Langkah Deploy:

1. **Inisialisasi Firebase (jika belum):**
   ```bash
   firebase init firestore
   ```
   - Pilih project Anda
   - Gunakan `firestore.rules` sebagai rules file

2. **Deploy Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Verifikasi:**
   ```bash
   firebase firestore:rules:list
   ```

---

## ⚠️ Troubleshooting

### Jika masih tidak bisa view setelah deploy:

1. **Clear Cache Browser:**
   - Tekan `Ctrl + Shift + Delete`
   - Hapus cache dan cookies
   - Refresh halaman

2. **Periksa Console Browser:**
   - Tekan `F12` untuk buka Developer Tools
   - Lihat tab "Console" untuk error messages
   - Cari error yang berkaitan dengan "permission denied"

3. **Periksa Network Tab:**
   - Di Developer Tools, buka tab "Network"
   - Refresh halaman
   - Lihat request ke Firestore
   - Periksa response untuk error details

4. **Verifikasi User Authentication:**
   - Pastikan user sudah login dengan benar
   - Cek `currentUser` di console: `console.log(auth.currentUser)`

---

## 🔍 Testing Rules

Setelah deploy, test dengan scenario berikut:

### Test 1: Guest Access (Tidak Login)
- Buka aplikasi dalam mode incognito
- Coba akses halaman yang menampilkan events
- **Expected:** Bisa melihat events (read access)
- **Expected:** Tidak bisa create/update/delete

### Test 2: Authenticated User
- Login dengan akun Anda
- Coba create event baru
- **Expected:** Berhasil create event
- **Expected:** Bisa update/delete event milik sendiri
- **Expected:** Tidak bisa update/delete event user lain

### Test 3: Notifications
- Login dengan akun Anda
- Create/update/delete event
- **Expected:** Notification tercatat di Firestore
- **Expected:** Hanya bisa lihat notification milik sendiri

---

## 📝 Catatan Penting

- **Rules berlaku real-time** setelah di-publish
- **Tidak perlu restart aplikasi** setelah deploy rules
- **Backup rules lama** sebelum deploy rules baru
- **Test di development environment** sebelum deploy ke production
