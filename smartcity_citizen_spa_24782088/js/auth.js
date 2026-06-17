/**
 * auth.js — Modul autentikasi SPA
 * Menangani proses login: mengirim kredensial ke /api/token/,
 * menyimpan token ke localStorage, dan redirect ke dashboard.
 */

function isLoggedIn() {
    return !!localStorage.getItem('access_token');
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('is_staff');
    showAlert('Anda telah keluar dari portal.', 'warning');
    window.location.hash = '#login';
}

function showAlert(message, type = 'success') {
    const container = document.getElementById('alert-container');
    if (!container) return;

    const icons = {
        success: 'bi-check-circle-fill',
        danger:  'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
    };

    const el = document.createElement('div');
    el.className = `spa-alert alert alert-${type} d-flex align-items-center gap-2 mb-2`;
    el.innerHTML = `<i class="bi ${icons[type] || icons.success}"></i><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

function setupLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async function (event) {
        // Wajib: mencegah halaman reload (yang membocorkan password ke URL)
        event.preventDefault();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        const btn = form.querySelector('button[type="submit"]');
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Memproses...`;

        // Kirim payload username dan password ke endpoint /api/token/ menggunakan requestAPI
        const result = await requestAPI('/api/token/', 'POST', {
            username: username,
            password: password,
        });

        if (result.ok && result.status === 200) {
            // Simpan access dan refresh token ke dalam localStorage
            localStorage.setItem('access_token', result.data.access);
            localStorage.setItem('refresh_token', result.data.refresh);
            localStorage.setItem('username', username);

            // Ambil info is_staff dari endpoint /api/auth/me/ atau decode token
            // Untuk simplisitas, cek via endpoint profile
            const profileResult = await requestAPI('/api/auth/me/', 'GET');
            if (profileResult.ok) {
                localStorage.setItem('is_staff', profileResult.data.is_staff ? 'true' : 'false');
            }

            showAlert(`Selamat datang, ${username}! Login berhasil.`, 'success');

            // Ubah rute ke dashboard
            setTimeout(() => { window.location.hash = '#dashboard'; }, 600);

        } else {
            const msg = result.data?.detail || 'Username atau password salah.';
            showAlert(msg, 'danger');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    });
}
