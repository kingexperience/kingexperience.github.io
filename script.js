/*
============================================================================
    SCRIPT.JS - MAIN APP
============================================================================
    Quản lý navigation, toast notifications,
    mobile menu, scroll effects, và khởi tạo app.
============================================================================
*/

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const target = document.getElementById(`page-${page}`);
    if (target) {
        target.classList.add('active');
    }

    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.page === page);
    });

    const footer = document.getElementById('footer');
    if (page === 'home') {
        footer.style.display = 'none';
    } else {
        footer.style.display = 'block';
    }

    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.classList.remove('active');

    window.scrollTo(0, 0);

    if (page === 'shop') renderShop();
    if (page === 'orders') renderOrders();
    if (page === 'downloads') renderDownloads();
    if (page === 'admin') {
        renderAdminStats();
        renderAdminOrders();
        renderAdminDownloads();
    }
}

function toggleNav() {
    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.classList.toggle('active');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 3500);
}

window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }
});

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');

    // Check for Discord OAuth2 callback
    handleAuthCallback();

    // Update UI
    updateUI();

    // Render initial content
    renderShop();
    renderDownloads();

    // Start auto-refresh cho orders (15s)
    startAutoRefresh();

    // Start auto-refresh cho admin (15s)
    startAdminAutoRefresh();

    // Sync từ GitHub ngay khi load
    syncOrdersFromGitHub().then(() => renderOrders());
    syncDownloadsFromGitHub().then(() => renderDownloads());

    // Hide loading
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
        }
    }, 2000);

    // Handle URL hash
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`page-${hash}`)) {
        navigateTo(hash);
    }
});
