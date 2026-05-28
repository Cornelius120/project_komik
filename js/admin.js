// Kode ini diletakkan di js/admin.js

// KELOLA CONFIG REPO DI SINI
const GH_USER = "USERNAME_GITHUB_KAMU";
const GH_REPO = "NAMA_REPO_GITHUB_KAMU";

function loginAdmin() {
  const token = document.getElementById("gh-token").value;
  if (token) {
    localStorage.setItem("admin_token", token);
    checkAuth();
  } else {
    alert("Token wajib diisi!");
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

// Fungsi AJAX mengunggah gambar tunggal ke ImgBB
async function uploadKeImgBB(file, apiKey) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Gagal mengunggah gambar ke ImgBB");
  const data = await response.json();
  return data.data.url;
}

// Helper untuk mengambil berkas dari GitHub (mendapatkan konten & SHA)
async function fetchFromGitHub(path, token) {
  const url = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/${path}`;
  const response = await fetch(url, {
    headers: { Authorization: `token ${token}` },
  });
  if (response.status === 404) return null; // Berkas belum ada
  if (!response.ok)
    throw new Error(`Gagal mengambil berkas ${path} dari GitHub`);
  return await response.json();
}

// Helper untuk mengirim/memperbarui berkas di GitHub
async function pushToGitHub(path, contentObj, sha, commitMessage, token) {
  const url = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/${path}`;
  const contentBase64 = btoa(
    unescape(encodeURIComponent(JSON.stringify(contentObj, null, 2))),
  );

  const bodyData = {
    message: commitMessage,
    content: contentBase64,
  };
  if (sha) bodyData.sha = sha; // Menyertakan SHA jika memperbarui berkas lama

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyData),
  });

  if (!response.ok) throw new Error(`Gagal menyimpan berkas ${path} ke GitHub`);
  return await response.json();
}

// Fungsi Eksekusi Utama Rilis Komik & Pemecahan JSON
async function handleProsesRilis() {
  const token = localStorage.getItem("admin_token");
  const judul = document.getElementById("komik-title").value.trim();
  const slug = document.getElementById("komik-slug").value.trim();
  const imgbbKey = document.getElementById("imgbb-key").value.trim();
  const coverFile = document.getElementById("komik-cover").files[0];
  const chNumber = parseInt(document.getElementById("chapter-number").value);
  const chapterFiles = document.getElementById("chapter-images").files;
  const log = document.getElementById("status-log");
  const progressDiv = document.getElementById("progress-container");

  if (!judul || !slug || !imgbbKey || !chNumber || chapterFiles.length === 0) {
    alert("Mohon lengkapi seluruh data utama dan gambar chapter!");
    return;
  }

  progressDiv.style.display = "block";

  try {
    let coverUrl = "";

    // 1. Upload Cover jika diunggah (untuk komik baru)
    if (coverFile) {
      log.innerText = "⏳ Sedang mengunggah gambar cover ke ImgBB...";
      coverUrl = await uploadKeImgBB(coverFile, imgbbKey);
    }

    // 2. Upload Seluruh Gambar Isi Chapter secara Bergantian (AJAX)
    log.innerText = `⏳ Mengunggah 0/${chapterFiles.length} Gambar Chapter ke ImgBB...`;
    let isiHalamanUrls = [];
    for (let i = 0; i < chapterFiles.length; i++) {
      log.innerText = `⏳ Mengunggah Gambar Ke-${i + 1}/${chapterFiles.length} ke ImgBB...`;
      const urlImg = await uploadKeImgBB(chapterFiles[i], imgbbKey);
      isiHalamanUrls.push(urlImg);
    }

    // 3. Simpan File JSON Chapter Spesifik (Pecahan: /data/manga/slug/chX.json)
    const chapterPath = `data/manga/${slug}/ch${chNumber}.json`;
    log.innerText = `⏳ Memeriksa riwayat berkas chapter di GitHub (${chapterPath})...`;

    const existingChapterFile = await fetchFromGitHub(chapterPath, token);
    let chapterSha = existingChapterFile ? existingChapterFile.sha : null;

    const chapterDataContent = {
      chapter: chNumber,
      images: isiHalamanUrls,
      diupdateAt: new Date().toISOString(),
    };

    log.innerText = `⏳ Mengirim file pecahan chapter ke GitHub...`;
    await pushToGitHub(
      chapterPath,
      chapterDataContent,
      chapterSha,
      `Rilis ${judul} Ch ${chNumber}`,
      token,
    );

    // 4. Update File Indeks Utama (data/daftar-komik.json)
    const indexPath = "data/daftar-komik.json";
    log.innerText = "⏳ Sinkronisasi data utama daftar-komik.json...";

    const existingIndexFile = await fetchFromGitHub(indexPath, token);
    let indexSha = null;
    let daftarKomikData = [];

    if (existingIndexFile) {
      indexSha = existingIndexFile.sha;
      daftarKomikData = JSON.parse(atob(existingIndexFile.content));
    }

    // Cek apakah komik ini sudah terdaftar di index utama
    const komikIndex = daftarKomikData.findIndex((item) => item.slug === slug);

    if (komikIndex !== -1) {
      // Jika sudah ada, perbarui informasi chapter terakhirnya
      if (chNumber > daftarKomikData[komikIndex].chapter_terakhir) {
        daftarKomikData[komikIndex].chapter_terakhir = chNumber;
      }
      if (coverUrl) {
        daftarKomikData[komikIndex].cover = coverUrl; // Update cover jika ada file baru
      }
      daftarKomikData[komikIndex].diupdateAt = new Date().toISOString();
    } else {
      // Jika komik baru, tambahkan objek baru ke array
      const komikBaru = {
        id: Date.now(),
        judul: judul,
        slug: slug,
        cover: coverUrl || "https://via.placeholder.com/200x300?text=No+Cover",
        chapter_terakhir: chNumber,
        diupdateAt: new Date().toISOString(),
      };
      daftarKomikData.push(komikBaru);
    }

    log.innerText = "⏳ Menyimpan pembaruan indeks utama ke GitHub...";
    await pushToGitHub(
      indexPath,
      daftarKomikData,
      indexSha,
      `Update indeks komik: ${judul} Ch ${chNumber}`,
      token,
    );

    log.innerText =
      "🎉 Sukses! Data berhasil dipush. Vercel/Netlify akan otomatis memperbarui situs dalam 1-2 menit.";
    alert(`Chapter ${chNumber} berhasil dirilis!`);

    // Reset Form kontainer chapter setelah sukses
    document.getElementById("chapter-number").value = "";
    document.getElementById("chapter-images").value = "";
  } catch (error) {
    log.innerText = `❌ Terjadi Kesalahan: ${error.message}`;
    console.error(error);
  }
}

window.onload = checkAuth;
