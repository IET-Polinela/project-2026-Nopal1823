/**
 * app.js — Modul UI/konten SPA
 * Berisi template HTML string untuk setiap halaman (view).
 * Dipanggil oleh router.js saat perpindahan hash.
 */

// =============================================
// VARIABEL GLOBAL & STATE
// =============================================
let currentTab  = 'my_reports';
let currentPage = 1;
let editingReportId = null;
let isLoading = false;

// =============================================
// LOAD & RENDER DASHBOARD DATA
// =============================================
async function loadDashboardData(tab = currentTab, page = currentPage) {
    if (isLoading) return;
    isLoading = true;

    currentTab  = tab;
    currentPage = page;

    const response = await requestAPI(`/api/report/?tab=${tab}&page=${page}`, 'GET');

    if (response.ok && response.status === 200) {
        // INSTRUKSI 1: Ekstraksi Data Paginasi
        const allReports  = response.data.results ?? [];
        const totalCount  = response.data.count   ?? 0;
        const totalPages  = Math.ceil(totalCount / 10);

        // INSTRUKSI 2: Pembaruan UI
        renderList(allReports, tab);
        renderPagination(totalPages, page, tab);
        loadSummaryStats();
    } else {
        const listContainer = document.getElementById('listContainer');
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="col-12 text-center text-muted p-5">
                    <i class="bi bi-exclamation-triangle fs-1"></i>
                    <p>Gagal memuat data laporan.</p>
                </div>`;
        }
    }

    const paginationContainer = document.getElementById('paginationContainer');
    if (paginationContainer && !response.ok) paginationContainer.innerHTML = '';

    isLoading = false;
}

function getStatusBadge(status) {
    const map = {
        'DRAFT':    { color: 'secondary', label: 'Draft',    progress: 10 },
        'REPORTED': { color: 'primary',   label: 'Diajukan', progress: 35 },
        'VERIFIED': { color: 'info',      label: 'Ditinjau', progress: 60 },
        'IN_PROGRESS':{ color: 'warning',  label: 'Diproses', progress: 80 },
        'RESOLVED':     { color: 'success',   label: 'Selesai',  progress: 100 },
    };
    return map[status] ?? { color: 'dark', label: status, progress: 0 };
}

function renderList(reports, tab) {
    const container = document.getElementById('listContainer');
    if (!container) return;

    if (reports.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center text-muted p-5">
                <i class="bi bi-inbox" style="font-size:3rem; opacity:.3;"></i>
                <p class="mt-2">Belum ada laporan di sini.</p>
            </div>`;
        return;
    }

    container.innerHTML = reports.map(r => {
        const s       = getStatusBadge(r.status);
        const isDraft = r.status === 'DRAFT';
        const isAdmin = localStorage.getItem('is_staff') === 'true';

        const editBtn = (isDraft && r.is_owner)
            ? `<button class="btn btn-sm btn-outline-warning fw-bold"
                       onclick="editDraft(${r.id})">
                   <i class="bi bi-pencil me-1"></i>Edit
               </button>`
            : '';

        const adminBtn = isAdmin && r.status !== 'RESOLVED'
            ? `<button class="btn btn-sm btn-outline-primary fw-bold ms-1"
                       onclick="updateStatusAdmin(${r.id}, '${r.status}')">
                   <i class="bi bi-shield-check me-1"></i>Update Status
               </button>`
            : '';

        return `
        <div class="col-12">
            <div class="card p-3 mb-2">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span class="badge bg-${s.color} badge-status">${s.label}</span>
                        <strong class="ms-2">${r.title}</strong>
                    </div>
                    <div>${editBtn}${adminBtn}</div>
                </div>
                <p class="mb-1 small text-muted">${r.description}</p>
                <p class="mb-2 small">
                    <i class="bi bi-geo-alt me-1"></i>${r.location} &bull;
                    <i class="bi bi-person me-1"></i>${r.reporter} &bull;
                    <i class="bi bi-clock me-1"></i>${new Date(r.updated_at).toLocaleDateString('id-ID')}
                </p>
                <!-- Progress Bar -->
                <div class="progress" style="height:8px; border-radius:10px;">
                    <div class="progress-bar bg-${s.color}" role="progressbar"
                         style="width:${s.progress}%"
                         aria-valuenow="${s.progress}" aria-valuemin="0" aria-valuemax="100">
                    </div>
                </div>
                <small class="text-muted">${s.progress}% selesai</small>
            </div>
        </div>`;
    }).join('');
}

function renderPagination(totalPages, currentPage, tab) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    if (totalPages < 1) { container.innerHTML = ''; return; }

    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end   = Math.min(totalPages, currentPage + delta);

    let buttons = '';

    // Tombol Previous
    buttons += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="loadDashboardData('${tab}', ${currentPage - 1})">&laquo; Prev</button>
        </li>`;

    // Halaman pertama + ellipsis
    if (start > 1) {
        buttons += `<li class="page-item"><button class="page-link" onclick="loadDashboardData('${tab}', 1)">1</button></li>`;
        if (start > 2) buttons += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
    }

    // Halaman tengah (maks 5 di sekitar aktif)
    for (let i = start; i <= end; i++) {
        buttons += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" onclick="loadDashboardData('${tab}', ${i})">${i}</button>
            </li>`;
    }

    // Halaman terakhir + ellipsis
    if (end < totalPages) {
        if (end < totalPages - 1) buttons += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
        buttons += `<li class="page-item"><button class="page-link" onclick="loadDashboardData('${tab}', ${totalPages})">${totalPages}</button></li>`;
    }

    // Tombol Next
    buttons += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="loadDashboardData('${tab}', ${currentPage + 1})">Next &raquo;</button>
        </li>`;

    container.innerHTML = `
        <nav><ul class="pagination pagination-sm justify-content-center flex-wrap">${buttons}</ul></nav>`;
}

// =============================================
// REKAP STATUS DI SIDEBAR
// =============================================
async function loadSummaryStats() {
    const response = await requestAPI('/api/report/?tab=my_reports&page_size=1000', 'GET');
    if (!response.ok) return;

    const all      = response.data.results ?? [];
    const draft    = all.filter(r => r.status === 'DRAFT').length;
    const diajukan = all.filter(r => r.status === 'REPORTED').length;
    const diproses = all.filter(r => r.status === 'IN_PROGRESS' || r.status === 'VERIFIED').length;
    const selesai  = all.filter(r => r.status === 'RESOLVED').length;
    const total    = all.length;

    // Rekap sidebar (kiri)
    const elSidebarTotal    = document.getElementById('sidebarTotal');
    const elSidebarDraft    = document.getElementById('sidebarDraft');
    const elSidebarDiajukan = document.getElementById('sidebarDiajukan');
    const elSidebarDiproses = document.getElementById('sidebarDiproses');
    const elSidebarSelesai  = document.getElementById('sidebarSelesai');
    if (elSidebarTotal)    elSidebarTotal.textContent    = total;
    if (elSidebarDraft)    elSidebarDraft.textContent    = draft;
    if (elSidebarDiajukan) elSidebarDiajukan.textContent = diajukan;
    if (elSidebarDiproses) elSidebarDiproses.textContent = diproses;
    if (elSidebarSelesai)  elSidebarSelesai.textContent  = selesai;
}

// =============================================
// EDIT DRAFT & SUBMIT MODAL
// =============================================
async function editDraft(id) {
    const response = await requestAPI(`/api/report/${id}/`, 'GET');
    if (!response.ok) return;

    const r = response.data;
    document.getElementById('inputTitle').value       = r.title       ?? '';
    document.getElementById('inputCategory').value    = r.category    ?? '';
    document.getElementById('inputDescription').value = r.description ?? '';
    document.getElementById('inputLocation').value    = r.location    ?? '';

    // Ubah judul modal
    document.getElementById('reportModalLabel').innerHTML =
        '<i class="bi bi-pencil-square me-2"></i>Edit Draft Laporan';

    editingReportId = id;

    // Tampilkan modal
    const modal = new bootstrap.Modal(document.getElementById('reportModal'));
    modal.show();
}

async function submitReport(status) {
    const title       = document.getElementById('inputTitle').value.trim();
    const category    = document.getElementById('inputCategory').value;
    const description = document.getElementById('inputDescription').value.trim();
    const location    = document.getElementById('inputLocation').value.trim();

    if (!title || !description || !location) {
        alert('Judul, deskripsi, dan lokasi wajib diisi!');
        return;
    }

    const payload = { title, category, description, location, status };
    const isEdit  = editingReportId !== null;
    const method  = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit
        ? `/api/report/${editingReportId}/`
        : `/api/report/`;

    // Tambahkan ini sementara untuk debug

    const response = await requestAPI(endpoint, method, payload);


    if (response.status === 201 || response.status === 200) {
        bootstrap.Modal.getInstance(document.getElementById('reportModal')).hide();
        alert('Laporan berhasil disimpan sebagai ' + status + '!');
        document.getElementById('reportForm').reset();
        document.getElementById('reportModalLabel').innerHTML =
            '<i class="bi bi-pencil-square me-2"></i>Buat Laporan Baru';
        editingReportId = null;
        loadDashboardData();
    } else {
        alert('Gagal menyimpan laporan. Coba lagi.');
    }
}

function renderNavMenu() {
    const navMenus = document.getElementById('nav-menus');
    if (!navMenus) return;

    if (isLoggedIn()) {
        const username = localStorage.getItem('username') || 'Warga';
        const isAdmin  = localStorage.getItem('is_staff') === 'true';
        const roleLabel = isAdmin ? 'Admin' : 'Citizen';
        const roleColor = isAdmin
            ? 'background:linear-gradient(135deg,#f5365c,#fb6340);'
            : 'background:linear-gradient(135deg,#5e72e4,#11cdef);';

        navMenus.innerHTML = `
            <a class="nav-link" href="#dashboard">
                <i class="bi bi-speedometer2 me-1"></i>Dashboard
            </a>
            <span class="nav-link text-muted">
                <i class="bi bi-person-circle me-1"></i>${username}
                <span class="badge ms-1" style="${roleColor}font-size:0.68rem;border-radius:30px;padding:0.3rem 0.7rem;">${roleLabel}</span>
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
                        Belum punya akun?
                        <a href="#register" style="color:var(--primary);font-weight:600;">Daftar di sini</a>
                    </p>
                </div>
            </div>
        </div>
    `;
}

function getRegisterView() {
    return `
        <div class="login-page">
            <div class="login-card card">
                <div class="card-header">
                    <div style="font-size:2.5rem;">📝</div>
                    <h4 class="text-white mb-0 mt-2 fw-bold">Daftar Akun</h4>
                    <p class="text-white-50 mb-0 small">Bergabung dengan Portal Warga Metro City</p>
                </div>
                <div class="card-body p-4">
                    <div id="registerAlert"></div>
                    <div class="mb-3">
                        <label class="form-label" for="regUsername">
                            <i class="bi bi-person me-1"></i>Username
                        </label>
                        <input type="text" id="regUsername" class="form-control"
                            placeholder="Buat username unik" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label" for="regEmail">
                            <i class="bi bi-envelope me-1"></i>Email
                        </label>
                        <input type="email" id="regEmail" class="form-control"
                            placeholder="Masukkan email (opsional)">
                    </div>
                    <div class="mb-3">
                        <label class="form-label" for="regPassword">
                            <i class="bi bi-lock me-1"></i>Password
                        </label>
                        <input type="password" id="regPassword" class="form-control"
                            placeholder="Buat password" required>
                    </div>
                    <div class="mb-4">
                        <label class="form-label" for="regPassword2">
                            <i class="bi bi-lock-fill me-1"></i>Konfirmasi Password
                        </label>
                        <input type="password" id="regPassword2" class="form-control"
                            placeholder="Ulangi password" required>
                    </div>
                    <button type="button" id="btnRegister" class="btn-login">
                        <i class="bi bi-person-plus-fill me-2"></i>Daftar Sekarang
                    </button>
                    <hr class="my-3">
                    <p class="text-center small mb-0" style="color:var(--text-light);">
                        Sudah punya akun?
                        <a href="#login" style="color:var(--primary);font-weight:600;">Login di sini</a>
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

                <!-- Rekap Status -->
                <p class="sidebar-label">Rekap Status</p>
                <div style="padding: 0 6px;">

                    <div class="d-flex justify-content-between align-items-center py-2"
                         style="border-bottom:1px solid var(--light);">
                        <span style="font-size:0.82rem;font-weight:600;color:var(--text-light);">
                            <i class="bi bi-clipboard-check-fill me-2" style="color:var(--primary);"></i>Total
                        </span>
                        <span id="sidebarTotal" style="font-size:0.85rem;font-weight:800;color:var(--primary);">0</span>
                    </div>

                    <div class="d-flex justify-content-between align-items-center py-2"
                         style="border-bottom:1px solid var(--light);">
                        <span style="font-size:0.82rem;font-weight:600;color:var(--text-light);">
                            <i class="bi bi-pencil-square me-2" style="color:#6c757d;"></i>Draft
                        </span>
                        <span id="sidebarDraft" style="font-size:0.85rem;font-weight:800;color:#6c757d;">0</span>
                    </div>

                    <div class="d-flex justify-content-between align-items-center py-2"
                         style="border-bottom:1px solid var(--light);">
                        <span style="font-size:0.82rem;font-weight:600;color:var(--text-light);">
                            <i class="bi bi-send-fill me-2" style="color:#5e72e4;"></i>Diajukan
                        </span>
                        <span id="sidebarDiajukan" style="font-size:0.85rem;font-weight:800;color:#5e72e4;">0</span>
                    </div>

                    <div class="d-flex justify-content-between align-items-center py-2"
                         style="border-bottom:1px solid var(--light);">
                        <span style="font-size:0.82rem;font-weight:600;color:var(--text-light);">
                            <i class="bi bi-hourglass-split me-2" style="color:var(--warning);"></i>Diproses
                        </span>
                        <span id="sidebarDiproses" style="font-size:0.85rem;font-weight:800;color:var(--warning);">0</span>
                    </div>

                    <div class="d-flex justify-content-between align-items-center py-2">
                        <span style="font-size:0.82rem;font-weight:600;color:var(--text-light);">
                            <i class="bi bi-check-circle-fill me-2" style="color:var(--success);"></i>Selesai
                        </span>
                        <span id="sidebarSelesai" style="font-size:0.85rem;font-weight:800;color:var(--success);">0</span>
                    </div>

                </div>

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
                    <button class="btn-primary-spa" data-bs-toggle="modal" data-bs-target="#reportModal">
                        <i class="bi bi-plus-circle-fill"></i>
                        <span>Laporan Baru</span>
                    </button>
                </div>

                <!-- Konten Utama -->
                <div class="section-card">
                    <!-- Tab Navigation -->
                    <ul class="nav nav-tabs mb-3" id="reportTabs">
                        <li class="nav-item">
                            <button class="nav-link active" id="tabMyReports"
                                    onclick="switchTab('my_reports')">
                                <i class="bi bi-person-fill me-1"></i>Laporan Saya
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" id="tabFeed"
                                    onclick="switchTab('feed')">
                                <i class="bi bi-people-fill me-1"></i>Feed Kota
                            </button>
                        </li>
                    </ul>

                    <!-- List Container -->
                    <div class="row" id="listContainer">
                        <div class="col-12 text-center text-muted p-5">
                            <i class="bi bi-arrow-clockwise" style="font-size:2rem; opacity:.4;"></i>
                            <p class="mt-2">Memuat data...</p>
                        </div>
                    </div>

                    <!-- Pagination Container -->
                    <div id="paginationContainer" class="mt-3"></div>
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

// =============================================
// SWITCH TAB
// =============================================
function switchTab(tab) {
    // Update style tab aktif
    document.getElementById('tabMyReports').classList.toggle('active', tab === 'my_reports');
    document.getElementById('tabFeed').classList.toggle('active', tab === 'feed');

    // Load data tab yang dipilih dari halaman 1
    loadDashboardData(tab, 1);
}

// =============================================
// INISIALISASI DASHBOARD
// =============================================
function initDashboard() {
    // Pasang event listener tombol Simpan Draft & Ajukan di modal
    const btnDraft  = document.getElementById('btnDraft');
    const btnSubmit = document.getElementById('btnSubmit');

    if (btnDraft)  btnDraft.addEventListener('click',  () => submitReport('DRAFT'));
    if (btnSubmit) btnSubmit.addEventListener('click',  () => submitReport('REPORTED'));

    // Reset state modal setiap kali ditutup
    document.getElementById('reportModal')?.addEventListener('hidden.bs.modal', () => {
        document.getElementById('reportForm').reset();
        document.getElementById('reportModalLabel').innerHTML =
            '<i class="bi bi-pencil-square me-2"></i>Buat Laporan Baru';
        editingReportId = null;
    });

    // Load data awal tab my_reports
    loadDashboardData('my_reports', 1);
}

// =============================================
// REGISTER
// =============================================
function setupRegisterForm() {
    const btn = document.getElementById('btnRegister');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const username  = document.getElementById('regUsername').value.trim();
        const email     = document.getElementById('regEmail').value.trim();
        const password  = document.getElementById('regPassword').value;
        const password2 = document.getElementById('regPassword2').value;
        const alertBox  = document.getElementById('registerAlert');

        alertBox.innerHTML = '';

        if (!username || !password || !password2) {
            alertBox.innerHTML = `<div class="alert alert-danger py-2 small">Username dan password wajib diisi.</div>`;
            return;
        }
        if (password !== password2) {
            alertBox.innerHTML = `<div class="alert alert-danger py-2 small">Password tidak cocok.</div>`;
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Mendaftar...`;

        const payload = { username, password, password2 };
        if (email) payload.email = email;

        const result = await requestAPI('/api/auth/register/', 'POST', payload);

        if (result.status === 201 || result.status === 200) {
            alertBox.innerHTML = `<div class="alert alert-success py-2 small">
                <i class="bi bi-check-circle-fill me-1"></i>
                Akun berhasil dibuat! Mengarahkan ke halaman login...
            </div>`;
            setTimeout(() => { window.location.hash = '#login'; }, 1500);
        } else {
            const errors = result.data;
            let msg = 'Registrasi gagal. ';
            if (errors?.username)  msg += errors.username.join(' ');
            if (errors?.password)  msg += errors.password.join(' ');
            if (errors?.password2) msg += errors.password2.join(' ');
            if (errors?.detail)    msg += errors.detail;
            alertBox.innerHTML = `<div class="alert alert-danger py-2 small">${msg}</div>`;
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-person-plus-fill me-2"></i>Daftar Sekarang`;
        }
    });
}

// =============================================
// ADMIN: UPDATE STATUS LAPORAN (bertahap, 1 langkah maju)
// =============================================
async function updateStatusAdmin(id, currentStatus) {
    const statusFlow = ['DRAFT', 'REPORTED', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED'];
    const statusLabel = {
        'DRAFT': 'Draft', 'REPORTED': 'Diajukan', 'VERIFIED': 'Ditinjau',
        'IN_PROGRESS': 'Diproses', 'RESOLVED': 'Selesai'
    };
    const statusColor = {
        'DRAFT': 'secondary', 'REPORTED': 'primary', 'VERIFIED': 'info',
        'IN_PROGRESS': 'warning', 'RESOLVED': 'success'
    };

    const currentIdx = statusFlow.indexOf(currentStatus);

    // Sudah tahap akhir, tidak ada langkah selanjutnya
    if (currentIdx === -1 || currentIdx >= statusFlow.length - 1) {
        alert('Laporan ini sudah pada tahap akhir (Selesai).');
        return;
    }

    const nextStatus = statusFlow[currentIdx + 1];

    // Inject modal konfirmasi sementara
    let tempModal = document.getElementById('adminStatusModal');
    if (!tempModal) {
        tempModal = document.createElement('div');
        tempModal.id = 'adminStatusModal';
        document.body.appendChild(tempModal);
    }

    tempModal.innerHTML = `
        <div class="modal fade" id="adminStatusModalInner" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title fw-bold">
                            <i class="bi bi-shield-check me-2"></i>Update Status (Admin)
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <p class="text-muted small mb-3">Laporan ID: <strong>#${id}</strong></p>
                        <p class="text-muted small mb-1">Status saat ini:</p>
                        <span class="badge bg-${statusColor[currentStatus]} mb-3" style="font-size:0.85rem;">${statusLabel[currentStatus]}</span>
                        <div class="text-center my-2">
                            <i class="bi bi-arrow-down-circle-fill text-primary" style="font-size:1.5rem;"></i>
                        </div>
                        <p class="text-muted small mb-1">Akan dinaikkan ke tahap berikutnya:</p>
                        <span class="badge bg-${statusColor[nextStatus]}" style="font-size:0.9rem;">${statusLabel[nextStatus]}</span>
                        <p class="text-muted small mt-3 mb-0">
                            <i class="bi bi-info-circle me-1"></i>
                            Status hanya bisa dinaikkan satu tahap setiap kali, sesuai alur proses laporan.
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-primary fw-bold" id="btnConfirmStatus">
                            <i class="bi bi-check-lg me-1"></i>Naikkan ke "${statusLabel[nextStatus]}"
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

    const modalEl = new bootstrap.Modal(document.getElementById('adminStatusModalInner'));
    modalEl.show();

    document.getElementById('btnConfirmStatus').onclick = async () => {
        const response = await requestAPI(`/api/report/${id}/`, 'PATCH', { status: nextStatus });

        if (response.status === 200) {
            modalEl.hide();
            loadDashboardData();
        } else {
            alert('Gagal update status. ' + JSON.stringify(response.data));
        }
    };
}
