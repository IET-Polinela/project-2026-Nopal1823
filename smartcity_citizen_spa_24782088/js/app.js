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

// =============================================
// LOAD & RENDER DASHBOARD DATA
// =============================================
async function loadDashboardData(tab = currentTab, page = currentPage) {
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
        const s         = getStatusBadge(r.status);
        const isDraft   = r.status === 'DRAFT';
        const editBtn   = (isDraft && r.is_owner)
            ? `<button class="btn btn-sm btn-outline-warning fw-bold"
                       onclick="editDraft(${r.id})">
                   <i class="bi bi-pencil me-1"></i>Edit
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
                    ${editBtn}
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
