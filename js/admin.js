// Kode ini diletakkan di js/admin.js

// Konfigurasi Repositori GitHub Kamu
const GH_USER = "Cornelius120";
const GH_REPO = "project_komik";

// Fungsi Login & Logout Admin via LocalStorage
function loginAdmin() {
  const token = document.getElementById("gh-token").value;
  if (token) {
    localStorage.setItem("admin_token", token);
    checkAuth();
  } else {
    alert("Token tidak boleh kosong!");
  }
}

function logoutAdmin() {
  localStorage.removeItem("admin_token");
  location.reload();
}

function checkAuth() {
  const token = localStorage.getItem("admin_token");
  if (token) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("dashboard-section").style.display = "block";
  }
}

// Fungsi AJAX untuk Upload Gambar ke ImgBB
async function uploadKeImgBB(file, apiKey) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Gagal upload ke ImgBB");
  const data = await response.json();
  return data.data.url; // Mengembalikan URL gambar langsung
}

// Fungsi Utama untuk Memperbarui data/komik.json di GitHub
async function handleProsesKomik() {
  const token = localStorage.getItem("admin_token");
  const judul = document.getElementById("komik-title").value;
  const slug = document.getElementById("komik-slug").value;
  const imgbbKey = document.getElementById("imgbb-key").value;
  const files = document.getElementById("chapter-images").files;
  const log = document.getElementById("status-log");

  if (!judul || !slug || !imgbbKey || files.length === 0) {
    alert("Mohon isi semua data dan pilih gambar!");
    return;
  }

  try {
    log.innerText = "Mengunggah gambar ke ImgBB...";
    let urlGambarArray = [];
    for (let file of files) {
      const url = await uploadKeImgBB(file, imgbbKey);
      urlGambarArray.push(url);
    }

    log.innerText = "Mengambil data komik lama dari GitHub...";
    const filePath = "data/komik.json";
    const urlGet = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/${filePath}`;

    // 1. Ambil file lama untuk mendapatkan SHA (Wajib di GitHub API)
    const resGet = await fetch(urlGet, {
      headers: { Authorization: `token ${token}` },
    });

    let currentData = [];
    let sha = "";

    if (resGet.ok) {
      const fileData = await resGet.json();
      sha = fileData.sha;
      // Decode base64 dari GitHub ke teks biasa, lalu parse ke JSON
      currentData = JSON.parse(atob(fileData.content));
    }

    // 2. Gabungkan data komik baru ke data lama
    const komikBaru = {
      id: Date.now(),
      judul: judul,
      slug: slug,
      images: urlGambarArray,
      diupdateAt: new Date().toISOString(),
    };
    currentData.push(komikBaru);

    log.innerText = "Menyimpan data terbaru ke GitHub...";
    // Encode kembali data JSON ke Base64
    const contentBase64 = btoa(
      unescape(encodeURIComponent(JSON.stringify(currentData, null, 2))),
    );

    // 3. Kirim data baru (PUT) ke GitHub
    const resPut = await fetch(urlGet, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Tambah komik baru: ${judul}`,
        content: contentBase64,
        sha: sha, // Masukkan SHA file lama agar tidak error conflict
      }),
    });

    if (resPut.ok) {
      log.innerText =
        "Sukses! Data tersimpan di GitHub. Vercel/Netlify sedang melakukan build ulang.";
      alert("Komik berhasil ditambahkan!");
    } else {
      throw new Error("Gagal push ke GitHub API");
    }
  } catch (error) {
    log.innerText = `Error: ${error.message}`;
    console.error(error);
  }
}

// Jalankan pengecekan login saat halaman dimuat
window.onload = checkAuth;
