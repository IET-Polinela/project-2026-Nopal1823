/**
 * router.js — Sistem Hash-Based Routing SPA
 *
 * Menangkap perubahan URL hash (misal: #login, #dashboard)
 * dan me-render konten yang sesuai ke dalam #app-content.
 * Implementasi routing tanpa library eksternal (Vanilla JS).
 */

const routes = {
    '#login':     getLoginView,
    '#register':  getRegisterView,
    '#dashboard': getDashboardView,
};

function handleRouting() {
    const hash = window.location.hash || '#login';
    const appContent = document.getElementById('app-content');

    renderNavMenu();

    // Guard: jika bukan login/register dan belum punya token, paksa ke login
    if (hash !== '#login' && hash !== '#register' && !isLoggedIn()) {
        window.location.hash = '#login';
        return;
    }

    // Guard: jika sudah login dan mencoba buka #login atau #register, langsung ke dashboard
    if ((hash === '#login' || hash === '#register') && isLoggedIn()) {
        window.location.hash = '#dashboard';
        return;
    }

    const viewFn = routes[hash];

    if (viewFn) {
        appContent.innerHTML = viewFn();
    } else {
        appContent.innerHTML = getNotFoundView();
    }

    if (hash === '#login' && typeof setupLoginForm === 'function') {
        setupLoginForm();
    }

    if (hash === '#register' && typeof setupRegisterForm === 'function') {
        setupRegisterForm();
    }

    if (hash === '#dashboard' && typeof initDashboard === 'function') {
        requestAnimationFrame(() => initDashboard());
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', handleRouting);
