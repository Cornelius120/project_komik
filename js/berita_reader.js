// Kode ini diletakkan di js/berita-reader.js

// Ambil tema malam jika aktif
if (localStorage.getItem("user_tema") === "dark") {
  document.body.classList.add("dark-theme");
}

const urlParams = new URLSearchParams(window.location.search);
const postSlug = urlParams.get("post");

async function muatArtikelLengkap() {
  const container = document.getElementById("article-container");

  if (!postSlug) {
    container.innerHTML = "<p>❌ Artikel tidak ditemukan atau link salah.</p>";
    return;
  }

  try {
    // Fetch file JSON pecahan artikel sesuai slug yang diminta
    const response = await fetch(`../data/berita/${postSlug}.json`);

    if (!response.ok) {
      throw new Error("Gagal mengambil data artikel dari server.");
    }

    const artikel = await response.json();

    // Render isi artikel ke halaman HTML
    container.innerHTML = `
            <h1 style="font-size: 2rem; margin-bottom: 10px;">${artikel.judul}</h1>
            <small style="color: #666; display: block; margin-bottom: 20px;">📅 Diterbitkan pada: ${artikel.tanggal}</small>
            
            <img src="${artikel.thumbnail}" alt="${artikel.judul}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 25px;">
            
            <div class="article-body" style="font-size: 1.1rem; white-space: pre-line;">
                ${artikel.konten}
            </div>
            
            <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;">
            <a href="../index.html" style="display: inline-block; margin-top: 10px; text-decoration: none; color: #0076ff; font-weight: bold;">◀ Kembali ke Beranda</a>
        `;
  } catch (error) {
    container.innerHTML = `
            <p>⚠️ Gagal memuat berita.</p>
            <small style="color: red;">Detail: ${error.message}</small>
        `;
  }
}

window.onload = muatArtikelLengkap;
