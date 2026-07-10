/*
============================================================================
    ORDERS.JS - ĐƠN HÀNG & THEO DÕI TRẠNG THÁI
============================================================================
    PULL orders từ GitHub API (không dùng raw content để tránh CORS).
    Hiển thị đơn của user hiện tại.
    Auto-refresh 15s để bắt cập nhật từ admin.
============================================================================
*/

// Render user's orders - PULL từ GitHub API
async function renderOrders() {
    const user = getCurrentUser();
    const list = document.getElementById('orders-list');
    const empty = document.getElementById('orders-empty');

    // Luôn sync từ GitHub trước
    await syncOrdersFromGitHub();

    if (!user) {
        if (list) list.innerHTML = '';
        if (empty) {
            empty.innerHTML = `
                <i class="fas fa-lock"></i>
                <p>Vui lòng đăng nhập để xem đơn hàng</p>
            `;
            empty.style.display = 'block';
        }
        return;
    }

    const orders = getOrders().filter(o => o.discordId === user.id);

    if (orders.length === 0) {
        if (list) list.innerHTML = '';
        if (empty) {
            empty.innerHTML = `
                <i class="fas fa-box-open"></i>
                <p>Bạn chưa có đơn hàng nào</p>
            `;
            empty.style.display = 'block';
        }
        return;
    }

    if (empty) empty.style.display = 'none';

    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    list.innerHTML = '';

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';

        const statusClass = `status-${order.status}`;
        const statusText = {
            'pending': 'Đang chờ duyệt',
            'approved': 'Đã duyệt',
            'rejected': 'Bị từ chối'
        }[order.status] || order.status;

        card.innerHTML = `
            <div class="order-header">
                <div class="order-id">
                    ${order.id}
                    <button class="copy-btn" onclick="copyText('${order.id}')" title="Copy Order ID">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="order-details">
                <div class="order-detail-item">
                    <span class="order-detail-label">Sản phẩm</span>
                    <span class="order-detail-value">${order.productName}</span>
                </div>
                <div class="order-detail-item">
                    <span class="order-detail-label">Số lượng</span>
                    <span class="order-detail-value">${order.quantity}</span>
                </div>
                <div class="order-detail-item">
                    <span class="order-detail-label">IGN</span>
                    <span class="order-detail-value">
                        ${order.ign}
                        <button class="copy-btn" onclick="copyText('${order.ign}')" title="Copy IGN" style="display:inline-flex;">
                            <i class="fas fa-copy"></i>
                        </button>
                    </span>
                </div>
                <div class="order-detail-item">
                    <span class="order-detail-label">Server</span>
                    <span class="order-detail-value">${order.server}</span>
                </div>
                <div class="order-detail-item">
                    <span class="order-detail-label">Giá</span>
                    <span class="order-detail-value">${formatPrice(order.price)}</span>
                </div>
                <div class="order-detail-item">
                    <span class="order-detail-label">Ngày tạo</span>
                    <span class="order-detail-value">${order.createdAtFormatted}</span>
                </div>
            </div>
            ${order.notes ? `
            <div class="order-detail-item" style="margin-top: 8px;">
                <span class="order-detail-label">Ghi chú</span>
                <span class="order-detail-value">${order.notes}</span>
            </div>` : ''}
            <div class="order-actions">
                <button class="btn-refresh" onclick="refreshOrderStatus('${order.id}')">
                    <i class="fas fa-sync-alt"></i> Làm mới trạng thái
                </button>
            </div>
        `;

        list.appendChild(card);
    });
}

// Refresh order status - sync from GitHub
async function refreshOrderStatus(orderId) {
    showToast('Đang kiểm tra trạng thái...', 'info');

    try {
        await syncOrdersFromGitHub();
        renderOrders();
        showToast('Trạng thái đã được cập nhật!', 'success');
    } catch (error) {
        console.error('Sync error:', error);
        showToast('Không thể kết nối GitHub', 'error');
    }
}

// Copy text to clipboard
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`Đã copy: ${text}`, 'success');
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(`Đã copy: ${text}`, 'success');
    });
}

// Sync orders from GitHub - dùng API (không bị CORS)
async function syncOrdersFromGitHub() {
    const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_BRANCH, GITHUB_TOKEN } = CONFIG;

    if (!GITHUB_USERNAME || !GITHUB_REPO || GITHUB_USERNAME === 'YOUR_GITHUB_USERNAME') {
        return;
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/data/orders.json?ref=${GITHUB_BRANCH}`,
            {
                headers: { 'Authorization': `token ${GITHUB_TOKEN}` },
                cache: 'no-store'
            }
        );

        if (!response.ok) {
            if (response.status === 404) return; // File chưa có
            console.warn('GitHub sync failed:', response.status);
            return;
        }

        const data = await response.json();
        const content = atob(data.content);
        const githubOrders = JSON.parse(content);

        // Ghi đè LocalStorage bằng dữ liệu từ GitHub
        saveOrders(githubOrders);
    } catch (error) {
        console.error('GitHub sync error:', error);
    }
}

// Auto refresh orders every 15 seconds
function startAutoRefresh() {
    setInterval(() => {
        if (isLoggedIn() && document.getElementById('page-orders')?.classList.contains('active')) {
            syncOrdersFromGitHub().then(() => renderOrders());
        }
    }, 15000);
}
