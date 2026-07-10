/*
============================================================================
    AUTH.JS - ĐĂNG NHẬP DISCORD
============================================================================
    Xử lý Discord OAuth2, lưu user info vào localStorage,
    kiểm tra trạng thái đăng nhập và hiển thị UI.
============================================================================
*/

const DISCORD_SCOPE = 'identify';

// Check if user is logged in
function isLoggedIn() {
    const user = localStorage.getItem('ke_user');
    return user !== null;
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('ke_user');
    return user ? JSON.parse(user) : null;
}

// Discord OAuth2 Login
function loginWithDiscord() {
    const clientId = CONFIG.DISCORD_CLIENT_ID;
    const redirectUri = encodeURIComponent(CONFIG.DISCORD_REDIRECT_URL);
    const scope = DISCORD_SCOPE;
    const responseType = 'token';
    const state = generateState();

    localStorage.setItem('ke_auth_state', state);

    const authUrl = `https://discord.com/oauth2/authorize` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        `&response_type=${responseType}` +
        `&scope=${scope}` +
        `&state=${state}`;

    window.location.href = authUrl;
}

// Generate random state
function generateState() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let state = '';
    for (let i = 0; i < 32; i++) {
        state += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return state;
}

// Handle Discord OAuth2 callback
function handleAuthCallback() {
    const hash = window.location.hash;

    if (!hash) return false;

    if (hash.includes('access_token') || hash.includes('error')) {
        const params = new URLSearchParams(hash.substring(1));

        if (params.get('error')) {
            showToast('Đăng nhập thất bại: ' + params.get('error_description'), 'error');
            window.history.replaceState(null, '', window.location.pathname);
            return false;
        }

        const accessToken = params.get('access_token');
        const state = params.get('state');

        const savedState = localStorage.getItem('ke_auth_state');
        if (state !== savedState) {
            showToast('Lỗi bảo mật: State không khớp', 'error');
            window.history.replaceState(null, '', window.location.pathname);
            return false;
        }

        if (accessToken) {
            fetchDiscordUser(accessToken);
        }

        window.history.replaceState(null, '', window.location.pathname);
        return true;
    }

    return false;
}

// Fetch Discord user info
async function fetchDiscordUser(accessToken) {
    try {
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể lấy thông tin Discord');
        }

        const user = await response.json();

        const userData = {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            globalName: user.global_name,
            avatar: user.avatar,
            avatarUrl: user.avatar
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
                : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`,
            loginTime: Date.now()
        };

        localStorage.setItem('ke_user', JSON.stringify(userData));
        localStorage.removeItem('ke_auth_state');

        showToast(`Xin chào, ${user.globalName || user.username}!`, 'success');
        updateUI();

    } catch (error) {
        console.error('Auth error:', error);
        showToast('Đăng nhập thất bại, vui lòng thử lại', 'error');
    }
}

// Logout
function logout() {
    localStorage.removeItem('ke_user');
    localStorage.removeItem('ke_auth_state');
    showToast('Đã đăng xuất', 'info');
    updateUI();
    navigateTo('home');
}

// Update UI based on auth state
function updateUI() {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const adminLink = document.getElementById('admin-link');
    const user = getCurrentUser();

    if (user) {
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        document.getElementById('user-avatar').src = user.avatarUrl;
        document.getElementById('user-name').textContent = user.globalName || user.username;

        if (isAdmin(user.id)) {
            adminLink.style.display = 'flex';
        } else {
            adminLink.style.display = 'none';
        }
    } else {
        loginBtn.style.display = 'flex';
        userInfo.style.display = 'none';
        adminLink.style.display = 'none';
    }
}
