// Kode ini diletakkan di js/app.js

// Fungsi untuk mengambil data daftar komik dari file JSON statis
async function muatDaftarKomik() {
  const container = document.getElementById("comic-list");
  try {
    // Mengambil file json yang di-host di Vercel/Netlify secara statis
    const response = await fetch("data/daftar-komik.json");
    const data = await response.json();

    if (data.length === 0) {
      container.innerHTML = "<p>Belum ada komik yang tersedia.</p>";
      return;
    }

    container.innerHTML = "";
    data.forEach((komik) => {
      container.innerHTML += `
                <div class="comic-card">
                    <img src="${komik.cover}" alt="${komik.judul}" style="width:100%; max-width:200px;">
                    <h3>${komik.judul}</h3>
                    <p>Chapter Terakhir: Ch ${komik.chapter_terakhir}</p>
                    <a href="komik/index.html?manga=${komik.slug}&ch=1">Baca Sekarang</a>
                </div>
            `;
    });
  } catch (error) {
    console.error("Gagal memuat daftar komik:", error);
    container.innerHTML = "<p>Gagal memuat data komik.</p>";
  }
}

// Jalankan fungsi saat halaman dibuka
window.onload = muatDaftarKomik;
