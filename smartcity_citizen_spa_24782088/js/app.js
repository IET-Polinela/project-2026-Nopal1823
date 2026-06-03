/**
 * app.js — Modul UI/konten SPA
 * Berisi template HTML string untuk setiap halaman (view).
 * Dipanggil oleh router.js saat perpindahan hash.
 */

function renderNavMenu() {
    const navMenus = document.getElementById('nav-menus');
    if (!navMenus) return;

    if (isLoggedIn()) {
        const username = localStorage.getItem('username') || 'Warga';
        navMenus.innerHTML = `
            <a class="nav-link" href="#dashboard">
                <i class="bi bi-speedometer2 me-1"></i>Dashboard
            </a>
            <span class="nav-link text-muted">
                <i class="bi bi-person-circle me-1"></i>${username}
                <span class="badge ms-1" style="background:linear-gradient(135deg,#5e72e4,#11cdef);font-size:0.68rem;border-radius:30px;padding:0.3rem 0.7rem;">Citizen</span>
            </span>
            <button class="btn btn-sm btn-danger ms-2" onclick="logout()">
                <i class="bi bi-box-arrow-right me-1"></i>Logout
            </button>
        `;
    } else {
        navMenus.innerHTML = `
            <a class="nav-link" href="#login">
                <i class="bi bi-box-arrow-in-right me-1"></i>Login
            </a>
        `;
    }
}

function getLoginView() {
    return `
        <div class="login-page">
            <div class="login-card card">
                <div class="card-header">
                    <div style="font-size:2.5rem;">🏙️</div>
                    <h4 class="text-white mb-0 mt-2 fw-bold">Metro City</h4>
                    <p class="text-white-50 mb-0 small">Masuk ke Portal Warga</p>
                </div>
                <div class="card-body p-4">
                    <form id="loginForm" novalidate>
                        <div class="mb-3">
                            <label class="form-label" for="loginUsername">
                                <i class="bi bi-person me-1"></i>Username
                            </label>
                            <input type="text" id="loginUsername" class="form-control"
                                placeholder="Masukkan username" autocomplete="username" required>
                        </div>
                        <div class="mb-4">
                            <label class="form-label" for="loginPassword">
                                <i class="bi bi-lock me-1"></i>Password
                            </label>
                            <input type="password" id="loginPassword" class="form-control"
                                placeholder="Masukkan password" autocomplete="current-password" required>
                        </div>
                        <button type="submit" class="btn-login">
                            <i class="bi bi-box-arrow-in-right me-2"></i>Login
                        </button>
                    </form>
                    <hr class="my-3">
                    <p class="text-center small mb-0" style="color:var(--text-light);">
                        <i class="bi bi-info-circle me-1"></i>
                        Gunakan akun yang terdaftar di Metro City Portal.
                    </p>
                </div>
            </div>
        </div>
    `;
}

function getDashboardView() {
    const username = localStorage.getItem('username') || 'Warga';
    const initial  = username.charAt(0).toUpperCase();
    const today    = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return `
        <div class="dashboard-layout">

            <!-- KIRI: Sidebar 25% -->
            <aside class="sidebar col-12 col-lg-3">
                <p class="sidebar-label">Menu Utama</p>

                <a class="sidebar-link active" href="#dashboard">
                    <i class="bi bi-speedometer2"></i> Beranda
                </a>
                <a class="sidebar-link" href="#dashboard">
                    <i class="bi bi-clipboard-check-fill"></i> Laporan Saya
                </a>
                <a class="sidebar-link" href="#dashboard">
                    <i class="bi bi-plus-circle-fill"></i> Buat Laporan
                </a>

                <p class="sidebar-label">Informasi</p>

                <a class="sidebar-link" href="#dashboard">
                    <i class="bi bi-megaphone-fill"></i> Pengumuman
                </a>
                <a class="sidebar-link" href="#dashboard">
                    <i class="bi bi-map-fill"></i> Peta Laporan
                </a>

                <div class="sidebar-divider"></div>

                <div class="user-badge">
                    <div class="user-avatar">${initial}</div>
                    <div class="user-info">
                        <small>Masuk sebagai</small>
                        <strong>${username}</strong>
                    </div>
                </div>

                <div class="sidebar-divider"></div>

                <a class="sidebar-link" href="#" onclick="logout(); return false;">
                    <i class="bi bi-box-arrow-right" style="color:var(--danger);"></i>
                    <span style="color:var(--danger);">Logout</span>
                </a>
            </aside>

            <!-- TENGAH: Main Content 50% -->
            <section class="main-area col-12 col-lg-6">

                <!-- Header -->
                <div class="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h5 class="page-title mb-0">Selamat Datang, ${username}!</h5>
                        <p class="mb-0" style="font-size:.83rem; color:var(--text-light); margin-top:2px;">
                            <i class="bi bi-calendar3 me-1"></i>${today}
                        </p>
                    </div>
                    <button class="btn-primary-spa">
                        <i class="bi bi-plus-circle-fill"></i>
                        <span>Laporan Baru</span>
                    </button>
                </div>

                <!-- Stat Cards -->
                <div class="row g-3 mb-4">
                    <div class="col-6 col-md-4">
                        <div class="stat-card">
                            <div class="stat-icon" style="background:rgba(94,114,228,0.12); color:var(--primary);">
                                <i class="bi bi-clipboard-check-fill"></i>
                            </div>
                            <div class="stat-value">0</div>
                            <div class="stat-label">Laporan Saya</div>
                        </div>
                    </div>
                    <div class="col-6 col-md-4">
                        <div class="stat-card">
                            <div class="stat-icon" style="background:rgba(45,206,137,0.12); color:var(--success);">
                                <i class="bi bi-check-circle-fill"></i>
                            </div>
                            <div class="stat-value">0</div>
                            <div class="stat-label">Diselesaikan</div>
                        </div>
                    </div>
                    <div class="col-6 col-md-4">
                        <div class="stat-card">
                            <div class="stat-icon" style="background:rgba(251,99,64,0.12); color:var(--warning);">
                                <i class="bi bi-hourglass-split"></i>
                            </div>
                            <div class="stat-value">0</div>
                            <div class="stat-label">Diproses</div>
                        </div>
                    </div>
                </div>

                <!-- Konten Utama -->
                <div class="section-card">
                    <div class="d-flex align-items-center gap-2 mb-3">
                        <i class="bi bi-inbox-fill" style="color:var(--primary); font-size:1.1rem;"></i>
                        <div>
                            <div class="section-title">Daftar Laporan</div>
                            <div class="section-sub">Laporan Anda akan muncul di sini</div>
                        </div>
                    </div>
                    <div class="text-center py-4" style="color:var(--text-light);">
                        <i class="bi bi-inbox" style="font-size:3rem; opacity:.3;"></i>
                        <p class="mt-2 mb-0" style="font-size:.875rem;">
                            Koneksi API untuk data laporan akan diimplementasikan pada Lab 12.
                        </p>
                    </div>
                </div>

            </section>

            <!-- KANAN: Right Panel 25% -->
            <aside class="right-panel col-12 col-lg-3 d-none d-lg-block">

                <!-- Pengumuman -->
                <div class="section-card mb-3">
                    <div class="d-flex align-items-center gap-2 mb-3">
                        <i class="bi bi-megaphone-fill" style="color:var(--primary);"></i>
                        <h6 class="section-title mb-0">Pengumuman</h6>
                    </div>

                    <div class="ann-item">
                        <div class="ann-title">
                            <i class="bi bi-info-circle-fill me-1" style="color:var(--primary);"></i>
                            Sistem Pemeliharaan
                        </div>
                        <div class="ann-time"><i class="bi bi-clock me-1"></i>1 jam yang lalu</div>
                    </div>
                    <div class="ann-item">
                        <div class="ann-title">
                            <i class="bi bi-patch-check-fill me-1" style="color:var(--success);"></i>
                            Fitur Baru Tersedia
                        </div>
                        <div class="ann-time"><i class="bi bi-clock me-1"></i>Kemarin</div>
                    </div>
                    <div class="ann-item">
                        <div class="ann-title">
                            <i class="bi bi-exclamation-triangle-fill me-1" style="color:var(--warning);"></i>
                            Laporan Infrastruktur
                        </div>
                        <div class="ann-time"><i class="bi bi-clock me-1"></i>2 hari lalu</div>
                    </div>
                </div>

                <!-- Aksi Cepat -->
                <div class="section-card">
                    <h6 class="section-title mb-3">
                        <i class="bi bi-lightning-fill me-1" style="color:var(--warning);"></i>
                        Aksi Cepat
                    </h6>
                    <div class="d-grid gap-2">
                        <button class="btn btn-sm fw-bold text-start rounded-3"
                            style="background:linear-gradient(135deg,rgba(94,114,228,0.1),rgba(17,205,239,0.05)); color:var(--primary); border:1.5px solid rgba(94,114,228,0.2);">
                            <i class="bi bi-plus-circle me-2"></i>Buat Laporan
                        </button>
                        <button class="btn btn-sm fw-bold text-start rounded-3"
                            style="background:#f7fafc; color:var(--text); border:1.5px solid var(--light);">
                            <i class="bi bi-list-ul me-2"></i>Semua Laporan
                        </button>
                        <button class="btn btn-sm fw-bold text-start rounded-3"
                            style="background:#f7fafc; color:var(--text); border:1.5px solid var(--light);">
                            <i class="bi bi-person-gear me-2"></i>Profil Saya
                        </button>
                    </div>
                </div>

            </aside>

        </div>
    `;
}

function getNotFoundView() {
    return `
        <div class="login-page" style="background:linear-gradient(135deg,#5e72e4 0%,#11cdef 100%);">
            <div class="text-center" style="color:#fff;">
                <i class="bi bi-exclamation-triangle-fill" style="font-size:4rem; opacity:0.85;"></i>
                <h3 class="mt-3 fw-bold text-white">Halaman Tidak Ditemukan</h3>
                <p style="color:rgba(255,255,255,0.75);">Rute yang Anda tuju tidak tersedia.</p>
                <a href="#login" class="btn-login" style="display:inline-flex;align-items:center;gap:8px;width:auto;padding:0.75rem 1.5rem;text-decoration:none;">
                    <i class="bi bi-house-fill"></i> Kembali ke Beranda
                </a>
            </div>
        </div>
    `;
}
