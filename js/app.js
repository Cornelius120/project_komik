// Kode ini diletakkan di js/app.js

if (localStorage.getItem("user_tema") === "dark") {
  document.body.classList.add("dark-theme");
}

async function inisialisasiHalamanUtama() {
  // Jalankan pemuatan komik dan berita secara bersamaan
  await muatDaftarKomik();
  await muatDaftarBerita();
}

async function muatDaftarKomik() {
  const container = document.getElementById("comic-list");
  try {
    const response = await fetch("data/daftar-komik.json");
    if (!response.ok) return;
    const data = await response.json();

    if (data.length === 0) {
      container.innerHTML = "<p>Belum ada komik yang tersedia.</p>";
      return;
    }

    container.innerHTML = "";
    data.forEach((komik) => {
      container.innerHTML += `
                <div class="comic-card" style="border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: #fff;">
                    <img src="${komik.cover}" alt="${komik.judul}" style="width:100%; max-width:200px; border-radius:3px;">
                    <h3>${komik.judul}</h3>
                    <p>Chapter Terakhir: Ch ${komik.chapter_terakhir}</p>
                    <a href="komik/index.html?manga=${komik.slug}&ch=${komik.chapter_terakhir}">Baca Ch ${komik.chapter_terakhir}</a>
                </div>
            `;
    });
  } catch (error) {
    console.error("Gagal memuat daftar komik:", error);
  }
}

async function muatDaftarBerita() {
  const container = document.getElementById("news-list");
  try {
    const response = await fetch("data/daftar-berita.json");
    if (!response.ok) return;
    const data = await response.json();

    if (data.length === 0) {
      container.innerHTML = "<p>Belum ada berita terbaru.</p>";
      return;
    }

    container.innerHTML = "";
    data.forEach((berita) => {
      container.innerHTML += `
                <div class="news-card" style="display: flex; gap: 15px; background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #ddd;">
                    <img src="${berita.thumbnail}" alt="${berita.judul}" style="width: 120px; height: 90px; object-fit: cover; border-radius: 5px;">
                    <div>
                        <small style="color: #888;">📅 ${berita.tanggal}</small>
                        <h3 style="margin: 5px 0;"><a href="berita/index.html?post=${berita.slug}" style="text-decoration: none; color: #333;">${berita.judul}</a></h3>
                        <p style="margin: 0; color: #666; font-size: 0.95rem;">${berita.ringkasan}</p>
                    </div>
                </div>
            `;
    });
  } catch (error) {
    console.error("Gagal memuat daftar berita:", error);
  }
}

// Jalankan fungsi inisialisasi saat web dibuka
window.onload = inisialisasiHalamanUtama;
