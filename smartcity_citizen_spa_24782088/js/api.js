/**
 * api.js — Modul komunikasi ke backend Django REST API
 * Membungkus fetch() dan secara otomatis menyisipkan
 * JWT access_token dari localStorage ke setiap request.
 */

const BASE_URL = 'http://103.151.63.88:8006/';

async function requestAPI(endpoint, method = 'GET', bodyData = null) {
    const headers = {
        'Content-Type': 'application/json',
    };

    // Ambil access_token dari localStorage dan sisipkan ke Authorization header
    const token = localStorage.getItem('access_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method: method,
        headers: headers,
    };

    if (bodyData && method !== 'GET') {
        options.body = JSON.stringify(bodyData);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);

        let data = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        }

        return {
            ok: response.ok,
            status: response.status,
            data: data,
        };
    } catch (error) {
        console.error('[requestAPI] Network error:', error);
        return {
            ok: false,
            status: 0,
            data: { detail: 'Tidak dapat terhubung ke server. Pastikan backend berjalan.' },
        };
    }
}
