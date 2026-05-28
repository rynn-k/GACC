![Banner](https://napkinsdev.s3.us-east-1.amazonaws.com/next-s3-uploads/5ae6434d-bbdb-452d-b473-6157d132c24b/1779983553820.png)

# Gibran Anime Character Classification

Web aplikasi untuk mengklasifikasikan gambar karakter anime menggunakan model machine learning (ONNX) dan memberikan reaksi video berdasarkan hasil klasifikasi.

## Fitur
- Klasifikasi karakter anime dari gambar yang diunggah.
- Analisis tag gambar untuk menentukan kategori karakter (tier).
- Menampilkan reaksi video berdasarkan hasil klasifikasi.

## Persyaratan
- Node.js 18+

## Instalasi dan Menjalankan
```bash
# 1. Clone repositori
git clone https://github.com/rynn-k/GACC
cd GACC

# 2. Instal dependensi
npm install

# 3. Download model
npm run setup
## Menjalankan
```bash
node index.js
```
Server akan berjalan di `http://localhost:3000`.

## Struktur Proyek
- `/models`: Berisi `model.onnx` dan `selected_tags.csv` untuk logika klasifikasi.
- `/videos`: Berisi file video reaksi (`.mp4`) yang dimainkan berdasarkan hasil deteksi.
- `/views`: Berisi template frontend `index.ejs`.
- `index.js`: Server Express, logika pemrosesan gambar, dan inferensi model.

## Cara Kerja
1. Pengguna mengunggah gambar melalui antarmuka web.
2. Server memproses gambar menggunakan `sharp` untuk mengubah ukuran dan format.
3. Aplikasi menggunakan model machine learning: **[wd-swinv2-tagger-v3](https://huggingface.co/SmilingWolf/wd-swinv2-tagger-v3)** sebagai model dasar untuk inferensi.
4. Model ONNX (`model.onnx`) melakukan inferensi untuk mendapatkan skor tag karakter.
5. Kode mengklasifikasikan karakter ke dalam salah satu kategori berdasarkan tag yang terdeteksi.
6. Server mengirimkan hasil nama karakter, tag yang relevan, dan video reaksi ke frontend.

## Informasi Teknis
- **Model Dasar:** [wd-swinv2-tagger-v3](https://huggingface.co/SmilingWolf/wd-swinv2-tagger-v3)
- **Runtime:** ONNX Runtime Node.js
- **Framework:** Express.js, EJS
- **Pengolahan Gambar:** Sharp Library

---

## Lisensi
[MIT](LICENSE)
