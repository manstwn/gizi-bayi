# Product Requirements Document (PRD)

## Project Title

**Sistem Pendukung Keputusan Penentuan Status Gizi Balita Menggunakan Metode Fuzzy Mamdani di Posyandu Sari Kemuning**

## Document Status

* Version: 1.0
* Prepared for: Skripsi / Website Development
* Based on: Proposal skripsi yang membahas sistem pendukung keputusan status gizi balita berbasis metode Fuzzy Mamdani pada Posyandu Sari Kemuning fileciteturn0file0

---

## 1. Product Overview

### 1.1 Background

Masalah gizi balita masih menjadi isu penting karena berpengaruh langsung terhadap pertumbuhan fisik, perkembangan kognitif, dan daya tahan tubuh anak. Proposal skripsi yang menjadi dasar proyek ini menekankan bahwa penentuan status gizi balita selama ini masih sering dilakukan secara manual, sehingga rentan memakan waktu, tidak konsisten, dan berisiko terjadi kesalahan pencatatan. Proposal tersebut juga menegaskan bahwa sistem yang dibangun harus berbasis website, menggunakan data antropometri balita, dan mengklasifikasikan status gizi menjadi empat kategori: gizi buruk, gizi kurang, gizi baik, dan gizi lebih fileciteturn0file0.

### 1.2 Product Vision

Membangun website yang membantu kader posyandu, petugas kesehatan, dan orang tua balita untuk:

* memasukkan data antropometri balita dengan cepat,
* menghitung status gizi secara otomatis menggunakan metode Fuzzy Mamdani,
* menyimpan riwayat data balita,
* menampilkan hasil analisis yang mudah dipahami,
* menghasilkan laporan monitoring status gizi.

### 1.3 Product Goals

1. Mempercepat proses penentuan status gizi balita.
2. Mengurangi kesalahan input dan interpretasi manual.
3. Menyediakan data historis balita untuk pemantauan berkala.
4. Membantu kader posyandu dan orang tua memahami kondisi gizi balita.
5. Mendukung skripsi dengan sistem yang dapat diuji melalui black-box testing dan UAT.

### 1.4 Success Criteria

Produk dianggap berhasil apabila:

* pengguna dapat menambahkan, mencari, melihat, dan mengelola data balita dengan mudah,
* hasil klasifikasi status gizi sesuai dengan aturan yang disepakati dan standar acuan yang dipakai pada penelitian,
* sistem dapat menampilkan output secara jelas dalam bentuk status, nilai perhitungan, dan ringkasan laporan,
* hasil UAT menunjukkan tingkat kelayakan yang tinggi,
* sistem berjalan stabil di lingkungan website yang ditargetkan.

---

## 2. Problem Statement

### 2.1 Current Problems

Berdasarkan proposal, masalah utama yang ingin diselesaikan adalah:

* masih tingginya kasus gizi pada balita,
* penentuan status gizi dilakukan manual,
* data mudah tercecer atau tidak terdokumentasi dengan baik,
* belum optimalnya pemanfaatan komputasi cerdas seperti fuzzy logic untuk keputusan gizi balita fileciteturn0file0.

### 2.2 Why This Product Matters

Sistem ini penting karena mengubah proses yang sebelumnya manual menjadi sistem digital yang:

* lebih cepat,
* lebih konsisten,
* lebih mudah dipantau,
* lebih mudah direkap untuk laporan posyandu atau evaluasi skripsi.

---

## 3. Objectives and Scope

### 3.1 In Scope

Website ini mencakup:

* autentikasi pengguna,
* manajemen data balita,
* input data antropometri balita,
* proses perhitungan status gizi menggunakan Fuzzy Mamdani,
* hasil klasifikasi gizi,
* penyimpanan riwayat pemeriksaan,
* pencarian data balita,
* dashboard ringkasan,
* laporan tabel/grafik,
* ekspor laporan sederhana,
* pengelolaan data pengguna dan referensi jika diperlukan.

### 3.2 Out of Scope

Tidak termasuk dalam versi awal:

* integrasi perangkat timbang otomatis,
* integrasi aplikasi mobile native,
* perbandingan dengan metode lain selain Fuzzy Mamdani,
* diagnosa medis penyakit,
* rekomendasi obat,
* koneksi ke sistem rumah sakit atau Puskesmas lain,
* fitur AI generatif untuk konsultasi.

### 3.3 Constraints

* Sistem berbasis website.
* Data fokus pada Posyandu Sari Kemuning.
* Output status gizi dibatasi pada empat kategori.
* Metode utama adalah Fuzzy Mamdani.
* Penilaian status gizi mengacu pada standar yang digunakan dalam penelitian dan acuan kesehatan yang dipilih dalam implementasi.

---

## 4. Stakeholders

### 4.1 Primary Stakeholders

* **Kader Posyandu**: operator utama yang memasukkan data dan melihat hasil.
* **Petugas kesehatan**: pengguna yang memverifikasi hasil dan memakai laporan.
* **Orang tua balita**: penerima informasi hasil status gizi.
* **Admin sistem**: mengelola akun, data master, dan pengaturan sistem.

### 4.2 Secondary Stakeholders

* Dosen pembimbing.
* Penguji skripsi.
* Pihak posyandu atau puskesmas yang menggunakan laporan.

---

## 5. User Personas

### 5.1 Kader Posyandu

**Tujuan:** Input data balita saat penimbangan dan segera melihat hasil status gizi.
**Kebutuhan:** antarmuka sederhana, cepat, minim klik, data tersimpan otomatis.

### 5.2 Petugas Kesehatan

**Tujuan:** Memantau tren status gizi balita dan memastikan hasil pengukuran dapat dipakai untuk edukasi.
**Kebutuhan:** laporan lengkap, riwayat data, filter per periode.

### 5.3 Orang Tua Balita

**Tujuan:** Mengetahui status gizi anak dan memahami arti hasilnya.
**Kebutuhan:** tampilan yang mudah dipahami, hasil yang jelas, penjelasan kategori.

### 5.4 Admin

**Tujuan:** Mengelola sistem, akun, dan memastikan data aman.
**Kebutuhan:** kontrol akses, pengelolaan user, audit log dasar.

---

## 6. Product Principles

1. **Simple first** – tampilan harus mudah digunakan oleh pengguna non-teknis.
2. **Fast decisions** – hasil harus muncul segera setelah input lengkap.
3. **Traceable** – setiap hasil harus bisa ditelusuri ke data input yang digunakan.
4. **Safe data** – data balita harus terlindungi dengan login dan pengaturan akses.
5. **Readable output** – hasil harus ditulis dengan bahasa yang mudah dimengerti.
6. **Skripsi-ready** – sistem harus mendukung kebutuhan pengujian, dokumentasi, dan laporan penelitian.

---

## 7. User Journey

### 7.1 Journey: Kader Input Data Balita

1. Login ke sistem.
2. Buka menu data balita.
3. Pilih tambah data.
4. Isi identitas balita dan data antropometri.
5. Simpan data.
6. Sistem menghitung status gizi.
7. Hasil ditampilkan dalam halaman detail dan riwayat.

### 7.2 Journey: Petugas Melihat Laporan

1. Login.
2. Buka menu laporan.
3. Pilih rentang tanggal atau filter balita.
4. Sistem menampilkan tabel dan ringkasan grafik.
5. Petugas dapat mencetak atau menyalin hasil laporan.

### 7.3 Journey: Orang Tua Melihat Hasil

1. Login atau akses mode ringkas jika diizinkan.
2. Cari nama balita.
3. Lihat status gizi, penjelasan kategori, dan riwayat singkat.
4. Pahami tindak lanjut yang dianjurkan oleh petugas.

---

## 8. Functional Requirements

### 8.1 Authentication and Authorization

**FR-001** Sistem harus menyediakan halaman login.
**FR-002** Sistem harus memvalidasi username dan password.
**FR-003** Sistem harus membatasi akses berdasarkan role: admin, kader, petugas kesehatan.
**FR-004** Sistem harus menyediakan logout.
**FR-005** Sistem harus menolak akses ke halaman sensitif jika pengguna belum login.

### 8.2 Data Balita Management

**FR-010** Sistem harus dapat menambahkan data balita baru.
**FR-011** Sistem harus menyimpan minimal nama, jenis kelamin, tanggal lahir atau umur, berat badan, tinggi badan, tanggal pemeriksaan, dan keterangan.
**FR-012** Sistem harus menampilkan daftar balita.
**FR-013** Sistem harus menyediakan fitur edit data balita.
**FR-014** Sistem harus menyediakan fitur hapus data balita dengan konfirmasi.
**FR-015** Sistem harus menyediakan pencarian balita berdasarkan nama, nomor register, atau informasi identitas lain yang ditentukan.

### 8.3 Anthropometric Data Input

**FR-020** Sistem harus menerima input berat badan.
**FR-021** Sistem harus menerima input tinggi badan.
**FR-022** Sistem harus menerima input umur balita.
**FR-023** Sistem harus melakukan validasi nilai numerik dan rentang logis.
**FR-024** Sistem harus memberi peringatan jika data tidak lengkap atau tidak valid.

### 8.4 Fuzzy Mamdani Processing

**FR-030** Sistem harus memproses data input menggunakan metode Fuzzy Mamdani.
**FR-031** Sistem harus menjalankan proses fuzzifikasi.
**FR-032** Sistem harus menerapkan aturan IF-THEN sesuai rancangan rule base.
**FR-033** Sistem harus menjalankan inferensi fuzzy.
**FR-034** Sistem harus melakukan defuzzifikasi untuk memperoleh hasil akhir.
**FR-035** Sistem harus menghasilkan status gizi akhir dalam satu dari empat kategori.

### 8.5 Result Display

**FR-040** Sistem harus menampilkan hasil klasifikasi gizi secara jelas.
**FR-041** Sistem harus menampilkan nilai input yang digunakan.
**FR-042** Sistem harus menampilkan skor atau nilai akhir perhitungan jika diperlukan.
**FR-043** Sistem harus menampilkan interpretasi hasil yang mudah dipahami pengguna.
**FR-044** Sistem harus menyimpan hasil perhitungan ke riwayat pemeriksaan.

### 8.6 Reporting

**FR-050** Sistem harus menyediakan laporan data balita.
**FR-051** Sistem harus menyediakan laporan hasil status gizi dalam bentuk tabel.
**FR-052** Sistem harus menyediakan ringkasan jumlah balita per kategori gizi.
**FR-053** Sistem harus dapat memfilter laporan berdasarkan tanggal, bulan, atau nama balita.
**FR-054** Sistem harus dapat menampilkan grafik distribusi status gizi jika dibutuhkan.
**FR-055** Sistem harus dapat mencetak atau mengekspor laporan.

### 8.7 Master Data and Settings

**FR-060** Sistem harus menyediakan pengelolaan data pengguna.
**FR-061** Sistem harus menyediakan data referensi status gizi dan parameter fuzzy.
**FR-062** Sistem harus menyediakan pengaturan metode perhitungan yang digunakan.

### 8.8 Audit and Logging

**FR-070** Sistem harus menyimpan log aktivitas penting seperti login, tambah data, edit, hapus, dan perhitungan.
**FR-071** Sistem harus menyimpan waktu perubahan data.

---

## 9. Non-Functional Requirements

### 9.1 Usability

* Antarmuka harus sederhana.
* Bahasa yang digunakan harus mudah dipahami pengguna posyandu.
* Form input harus singkat dan jelas.
* Informasi hasil harus ditampilkan dengan label yang mudah dimengerti.

### 9.2 Performance

* Sistem harus menampilkan hasil perhitungan dalam waktu singkat setelah input lengkap.
* Sistem harus responsif pada browser modern.
* Pencarian data harus cepat untuk jumlah data skala posyandu.

### 9.3 Reliability

* Data tidak boleh hilang saat proses penyimpanan berhasil.
* Sistem harus menghindari duplikasi data yang tidak diinginkan.
* Sistem harus tetap konsisten saat digunakan oleh lebih dari satu pengguna.

### 9.4 Security

* Login wajib untuk akses data sensitif.
* Password disimpan dengan hashing.
* Akses berbasis role.
* Validasi input untuk mencegah input berbahaya.
* Session timeout dapat diterapkan.

### 9.5 Maintainability

* Kode harus modular.
* Rumus fuzzy, rule base, dan kategori harus mudah diperbarui.
* Struktur database harus mendukung pengembangan lanjutan.

### 9.6 Portability

* Sistem harus bisa dijalankan di laptop/PC posyandu atau puskesmas.
* Sistem harus kompatibel dengan browser umum seperti Chrome dan Edge.

### 9.7 Accessibility

* Teks harus cukup besar dan mudah dibaca.
* Kontras warna harus memadai.
* Label form harus jelas.

---

## 10. Business Rules

### BR-001

Setiap balita hanya boleh memiliki satu record pemeriksaan per tanggal pemeriksaan, kecuali sistem memang mendukung lebih dari satu observasi.

### BR-002

Status gizi akhir harus berada pada salah satu dari empat kategori yang ditetapkan: gizi buruk, gizi kurang, gizi baik, atau gizi lebih.

### BR-003

Data yang dipakai untuk menghitung hasil harus lengkap sebelum proses fuzzy dijalankan.

### BR-004

Hasil perhitungan harus tersimpan sebagai bagian dari riwayat balita.

### BR-005

Perhitungan harus mengikuti desain metode Fuzzy Mamdani yang dirancang dalam penelitian.

---

## 11. Functional Flow / Process Design

### 11.1 Data Entry Flow

1. User login.
2. User membuka menu data balita.
3. User mengisi data identitas dan antropometri.
4. Sistem melakukan validasi.
5. Sistem menyimpan data.
6. Sistem menghitung hasil.
7. Sistem menampilkan output.

### 11.2 Calculation Flow

1. Input diterima.
2. Sistem melakukan fuzzifikasi terhadap parameter.
3. Sistem menjalankan rule evaluation.
4. Sistem menggabungkan hasil aturan.
5. Sistem melakukan defuzzifikasi.
6. Sistem menentukan kategori final.
7. Sistem menyimpan hasil dan menampilkannya.

### 11.3 Reporting Flow

1. User membuka laporan.
2. User memilih filter.
3. Sistem menampilkan data.
4. User dapat mencetak atau mengekspor.

---

## 12. Proposed System Modules

### 12.1 Public / Limited Access Module

* Landing page / intro
* Login page
* Help page

### 12.2 Core Application Module

* Dashboard
* Data balita
* Pemeriksaan / penilaian status gizi
* Riwayat pemeriksaan
* Laporan
* Master data
* User management

### 12.3 Administration Module

* Manage roles
* Manage users
* Manage rule base
* Manage categories and references
* Audit log

---

## 13. Detailed Feature Requirements

### 13.1 Dashboard

**Purpose:** Menyajikan ringkasan cepat.

**Must show:**

* total balita terdaftar,
* total pemeriksaan,
* jumlah per kategori gizi,
* pemeriksaan terbaru,
* grafik distribusi singkat.

**Acceptance Criteria:**

* Dashboard muncul setelah login.
* Data ringkasan sesuai database.

### 13.2 Data Balita Page

**Purpose:** Mengelola identitas balita.

**Fields:**

* Nama balita
* NIK / nomor identitas jika digunakan
* Tanggal lahir / umur
* Jenis kelamin
* Alamat / dusun / RT/RW jika diperlukan
* Nama orang tua/wali
* Nomor kontak opsional

**Actions:**

* tambah,
* edit,
* hapus,
* detail,
* cari.

**Acceptance Criteria:**

* Balita dapat dicari dalam < 3 detik pada data skala posyandu.

### 13.3 Examination Page

**Purpose:** Menginput data pengukuran dan menghasilkan status gizi.

**Fields:**

* tanggal pemeriksaan,
* umur,
* berat badan,
* tinggi badan,
* catatan,
* petugas pemeriksa.

**Output:**

* hasil kategori gizi,
* nilai kalkulasi,
* keterangan hasil.

**Acceptance Criteria:**

* Hasil dapat muncul setelah data valid disimpan.

### 13.4 History Page

**Purpose:** Melihat pemeriksaan sebelumnya.

**Must show:**

* tanggal pemeriksaan,
* BB,
* TB,
* umur,
* status gizi,
* petugas.

### 13.5 Report Page

**Purpose:** Menampilkan ringkasan analitik.

**Must show:**

* tabel data,
* grafik per kategori,
* filter periode,
* opsi cetak / export.

---

## 14. Fuzzy Mamdani Requirement Specification

> Bagian ini harus disesuaikan dengan rancangan skripsi akhir dan implementasi yang dipilih.

### 14.1 Input Variables

Sistem menerima variabel input utama:

* berat badan,
* tinggi badan,
* umur.

Proposal menekankan penggunaan data antropometri tersebut sebagai dasar penentuan status gizi fileciteturn0file0.

### 14.2 Membership Functions

Sistem harus memiliki fungsi keanggotaan untuk tiap variabel input. Contoh konsep:

* BB: rendah, normal, tinggi
* TB: pendek, sedang, tinggi
* Umur: bayi, toddler, balita awal, balita akhir

Catatan: bentuk dan parameter fungsi harus mengikuti desain skripsi.

### 14.3 Rule Base

Sistem harus memiliki aturan fuzzy berbentuk IF-THEN.
Contoh pola:

* IF BB rendah AND TB pendek AND umur tertentu THEN gizi buruk
* IF BB cukup AND TB normal THEN gizi baik
* IF BB tinggi OR kondisi tertentu THEN gizi lebih

Rule base wajib ditulis eksplisit di dokumen teknis agar dapat diuji.

### 14.4 Defuzzification

Sistem harus menghasilkan nilai crisp atau output akhir untuk menentukan kategori gizi.
Metode defuzzifikasi disarankan disesuaikan dengan implementasi yang dipakai pada skripsi.

### 14.5 Output Mapping

Hasil akhir harus dipetakan ke:

* Gizi Buruk
* Gizi Kurang
* Gizi Baik
* Gizi Lebih

---

## 15. Data Requirements

### 15.1 Core Data Entities

1. **users**

   * id
   * nama
   * username
   * password_hash
   * role
   * status_aktif
   * created_at
   * updated_at

2. **balita**

   * id
   * nama
   * jenis_kelamin
   * tanggal_lahir / umur
   * nama_orang_tua
   * alamat
   * kontak
   * created_at
   * updated_at

3. **pemeriksaan_gizi**

   * id
   * balita_id
   * tanggal_pemeriksaan
   * berat_badan
   * tinggi_badan
   * umur
   * hasil_fuzzy
   * kategori_gizi
   * nilai_akhir
   * petugas_id
   * catatan
   * created_at
   * updated_at

4. **rule_base**

   * id
   * nama_rule
   * kondisi
   * output
   * aktif/tidak

5. **activity_logs**

   * id
   * user_id
   * aktivitas
   * detail
   * timestamp

### 15.2 Data Quality Rules

* BB dan TB harus numerik.
* Umur harus valid.
* Nama balita tidak boleh kosong.
* Data duplikat harus dicegah sesuai kunci yang ditetapkan.

---

## 16. UI/UX Requirements

### 16.1 General UI Style

* Clean and simple.
* Use clear labels and icons.
* Avoid too many colors.
* Status results should use visual highlighting.

### 16.2 Navigation

* Sidebar or top navigation.
* Main menus: Dashboard, Balita, Pemeriksaan, Laporan, Pengguna, Logout.

### 16.3 Form Design

* One field per row if possible for readability.
* Input validation displayed inline.
* Buttons clearly separated: Simpan, Batal, Reset.

### 16.4 Result Presentation

* Show category prominently.
* Show supporting values below.
* Use badge or card for status result.
* Include explanation text in simple language.

### 16.5 Responsive Design

* Must display properly on laptop and desktop.
* Mobile support is optional but recommended.

---

## 17. Reporting and Analytics Requirements

### Reports Needed

1. Rekap jumlah balita.
2. Rekap hasil status gizi.
3. Rekap per periode.
4. Riwayat pemeriksaan individual.
5. Distribusi kategori gizi.

### Charts Suggested

* Pie chart for category distribution.
* Bar chart for monthly count.
* Line chart for trend over time.

### Export Options

* Print view.
* PDF export if implemented.
* Excel/CSV export if implemented.

---

## 18. Testing Requirements

### 18.1 Black-box Testing

Proposal explicitly states that black-box testing will be used to verify input-process-output behavior fileciteturn0file0.

Test scenarios should cover:

* login success/failure,
* create balita,
* edit data,
* delete data,
* input invalid numeric values,
* generate fuzzy result,
* view reports,
* search data.

### 18.2 User Acceptance Test (UAT)

Proposal also states that UAT should involve health workers or cadres and evaluate usability, clarity, speed, and result suitability fileciteturn0file0.

**UAT Criteria:**

* System easy to use.
* Output easy to understand.
* Processing time acceptable.
* Result considered appropriate by users.

### 18.3 Test Acceptance Threshold

* Mean score from questionnaire ≥ 80%.
* No critical bug on core workflows.
* Output should match expected category for test cases.

---

## 19. Acceptance Criteria by Feature

### Login

* User can log in using valid credentials.
* Invalid credentials are rejected.

### Add Balita

* Data saved successfully.
* Validation prevents empty required fields.

### Fuzzy Result

* Result appears after valid input.
* Category shown clearly.

### Search

* User can find balita using keyword.

### Report

* User can see summary and table.
* Filter works correctly.

---

## 20. Risks and Mitigation

### Risk 1: Fuzzy rule ambiguity

**Mitigation:** finalize membership functions and rule base with supervisor early.

### Risk 2: User confusion with technical output

**Mitigation:** show simple interpretation text alongside the category.

### Risk 3: Data input inconsistency

**Mitigation:** use strong validation and helpful placeholders.

### Risk 4: Scope creep

**Mitigation:** keep the first version limited to the proposal scope.

### Risk 5: Data privacy issues

**Mitigation:** role-based access and secure login.

---

## 21. Milestones / Development Phases

### Phase 1: Requirement Finalization

* finalize scope,
* define data fields,
* define fuzzy variables,
* define rule base.

### Phase 2: UI/UX Design

* create wireframes,
* create page layout,
* create user flow.

### Phase 3: Backend and Database

* build authentication,
* build balita module,
* build examination module,
* build reporting.

### Phase 4: Fuzzy Engine Implementation

* implement membership functions,
* implement inference,
* implement defuzzification,
* map output categories.

### Phase 5: Testing and Revision

* black-box testing,
* UAT,
* fix bugs,
* refine UI.

### Phase 6: Final Documentation

* prepare screenshots,
* prepare testing results,
* write evaluation summary.

---

## 22. Deliverables

1. Working website application.
2. Database schema.
3. Source code.
4. Admin/user login.
5. Fuzzy Mamdani calculation module.
6. Reporting page.
7. Testing documentation.
8. UAT questionnaire result.
9. Final PRD / requirement document.

---

## 23. Definition of Done

The project is considered done when:

* core pages work end-to-end,
* fuzzy output generates correctly,
* data is stored and searchable,
* reports can be viewed,
* testing is passed,
* documentation is ready for thesis submission.

---

## 24. Suggested Additional Thesis Documentation

To support the skripsi, the following documents should also be prepared:

* flowchart sistem,
* use case diagram,
* activity diagram,
* ERD,
* database schema,
* UML class/sequence diagrams if needed,
* screenshot bukti implementasi,
* testing table,
* UAT questionnaire results,
* conclusion and suggestions.

---

## 25. Final Notes

This PRD is designed to match the proposal focus: a website-based decision support system for toddler nutrition status using Fuzzy Mamdani at Posyandu Sari Kemuning. The document should be refined again after the rule base, membership boundaries, and exact implementation stack are finalized. The proposal clearly emphasizes the need for fast, accurate, and user-friendly decision support for cadres and parents, which is the main product objective of this website fileciteturn0file0.
