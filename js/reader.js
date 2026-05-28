// Kode ini diletakkan di js/reader.js

// Mengambil variabel parameter dari URL browser
const urlParams = new URLSearchParams(window.location.search);
const mangaSlug = urlParams.get("manga");
let currentCh = parseInt(urlParams.get("ch")) || 1;

let maxChapter = 999; // Default batas atas sebelum divalidasi oleh daftar-komik.json

async function inisialisasiReader() {
  if (!mangaSlug) {
    document.getElementById("chapter-images-container").innerHTML =
      "<p>Komik tidak ditemukan.</p>";
    return;
  }

  try {
    // Ambil data batasan chapter dari file index utama untuk navigasi yang valid
    const resIndex = await fetch("../data/daftar-komik.json");
    if (resIndex.ok) {
      const daftar = await resIndex.json();
      const detailManga = daftar.find((item) => item.slug === mangaSlug);
      if (detailManga) {
        document.getElementById("manga-title").innerText = detailManga.judul;
        maxChapter = detailManga.chapter_terakhir;
      }
    }

    await muatHalamanChapter(mangaSlug, currentCh);
    simpanKeRiwayatBaca(mangaSlug, currentCh);
  } catch (err) {
    console.error("Gagal menginisialisasi halaman baca:", err);
  }
}

// Mengambil file JSON pecahan khusus sesuai Chapter yang diminta
async function muatHalamanChapter(slug, chapter) {
  const container = document.getElementById("chapter-images-container");
  document.getElementById("current-chapter-text").innerText =
    `Chapter ${chapter}`;
  container.innerHTML = "<p>⏳ Sedang memuat halaman komik...</p>";

  // Atur visibilitas tombol navigasi
  aturTombolNavigasi();

  try {
    // Fetch static API URL hasil pecahan dari GitHub/Vercel
    const response = await fetch(`../data/manga/${slug}/ch${chapter}.json`);

    if (!response.ok) {
      throw new Error(
        "Berkas chapter belum tersedia atau belum selesai di-build.",
      );
    }

    const dataContent = await response.json();
    container.innerHTML = ""; // Bersihkan loading text

    // Render susunan gambar ke bawah secara berurutan
    dataContent.images.forEach((imgUrl, indeks) => {
      const imageElement = document.createElement("img");
      imageElement.src = imgUrl;
      imageElement.alt = `Halaman ${indeks + 1}`;
      imageElement.className = "comic-page";
      imageElement.loading = "lazy"; // Optimasi kecepatan memuat browser
      container.appendChild(imageElement);
    });
  } catch (error) {
    container.innerHTML = `
            <div class="error-box">
                <p>⚠️ Gagal memuat Chapter ${chapter}.</p>
                <small>Detail: ${error.message}</small>
            </div>
        `;
  }
}

function aturTombolNavigasi() {
  const prevBtns = [
    document.getElementById("prev-ch-btn"),
    document.getElementById("prev-ch-btn-bottom"),
  ];
  const nextBtns = [
    document.getElementById("next-ch-btn"),
    document.getElementById("next-ch-btn-bottom"),
  ];

  // Jika chapter 1, matikan tombol back
  prevBtns.forEach((btn) => (btn.disabled = currentCh <= 1));
  // Jika sudah mencapai batas chapter terakhir, matikan tombol next
  nextBtns.forEach((btn) => (btn.disabled = currentCh >= maxChapter));
}

function pindahChapter(arah) {
  currentCh += arah;
  // Update parameter URL tanpa memuat ulang seluruh halaman website (Efisiensi Tinggi)
  const newUrl =
    window.location.protocol +
    "//" +
    window.location.host +
    window.location.pathname +
    `?manga=${mangaSlug}&ch=${currentCh}`;
  window.history.pushState({ path: newUrl }, "", newUrl);

  muatHalamanChapter(mangaSlug, currentCh);
  simpanKeRiwayatBaca(mangaSlug, currentCh);
  window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll otomatis ke atas halaman
}

// Fungsi mencatat riwayat bacaan ke localStorage milik user pengunjung
function simpanKeRiwayatBaca(slug, chapter) {
  let riwayat = JSON.parse(localStorage.getItem("user_history")) || [];
  const judulKomik = document.getElementById("manga-title").innerText || slug;

  const stringData = `${judulKomik} - Chapter ${chapter} (Dibaca pada: ${new Date().toLocaleDateString("id-ID")})`;

  // Hapus riwayat lama untuk komik yang sama agar tidak duplikat menumpuk
  riwayat = riwayat.filter((item) => !item.startsWith(judulKomik));

  // Taruh riwayat bacaan terbaru di paling atas array
  riwayat.unshift(stringData);

  // Batasi penyimpanan riwayat maksimal 10 data saja agar memori localStorage tetap hemat
  if (riwayat.length > 10) riwayat.pop();

  localStorage.setItem("user_history", JSON.stringify(riwayat));
}

// Tambahkan baris pengecekan tema ini di awal file JS halaman publik
if (localStorage.getItem("user_tema") === "dark") {
  document.body.classList.add("dark-theme");
}

window.onload = inisialisasiReader;
