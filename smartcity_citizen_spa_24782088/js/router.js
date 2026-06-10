/**
 * router.js — Sistem Hash-Based Routing SPA
 *
 * Menangkap perubahan URL hash (misal: #login, #dashboard)
 * dan me-render konten yang sesuai ke dalam #app-content.
 * Implementasi routing tanpa library eksternal (Vanilla JS).
 */

const routes = {
    '#login':     getLoginView,
    '#dashboard': getDashboardView,
};

function handleRouting() {
    const hash = window.location.hash || '#login'; // Default ke login
    const appContent = document.getElementById('app-content');

    // Update navbar sesuai status login
    renderNavMenu();

    // Guard: jika bukan login dan belum punya token, paksa ke login
    if (hash !== '#login' && !isLoggedIn()) {
        window.location.hash = '#login';
        return;
    }

    // Guard: jika sudah login dan mencoba buka #login, langsung ke dashboard
    if (hash === '#login' && isLoggedIn()) {
        window.location.hash = '#dashboard';
        return;
    }

    // Cari view yang sesuai dengan hash
    const viewFn = routes[hash];

    if (viewFn) {
        appContent.innerHTML = viewFn();
    } else {
        appContent.innerHTML = getNotFoundView();
    }

    // Setup form login setelah HTML-nya di-render
    if (hash === '#login' && typeof setupLoginForm === 'function') {
        setupLoginForm();
    }

    if (hash === '#dashboard' && typeof initDashboard === 'function') {
        initDashboard();
    }

    // Scroll ke atas saat pindah halaman
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', handleRouting);
