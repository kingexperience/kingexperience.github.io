/*
============================================================================
    ADMIN.JS - ADMIN DASHBOARD
============================================================================
    PULL orders từ GitHub API.
    Sau khi duyệt/từ chối, PUSH lại lên GitHub.
    Tất cả máy đều đồng bộ cùng dữ liệu.
============================================================================
*/

// Render admin dashboard stats
async function renderAdminStats() {
    await syncOrdersFromGitHub();

    const orders = getOrders();
    document.getElementById('admin-total-orders').textContent = orders.length;
    document.getElementById('admin-pending-orders').textContent = orders.filter(o => o.status === 'pending').length;
    document.getElementById('admin-approved-orders').textContent = orders.filter(o => o.status === 'approved').length;
    document.getElementById('admin-rejected-orders').textContent = orders.filter(o => o.status === 'rejected').length;
}

// Render admin orders list
async function renderAdminOrders() {
    await syncOrdersFromGitHub();

    const list = document.getElementById('admin-orders-list');
    if (!list) return;

    const orders = getOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (orders.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>Chưa có đơn hàng nào</p>
            </div>
        `;
        return;
    }

    list.innerHTML = '';

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'admin-order-card';

        const statusClass = `status-${order.status}`;
        const statusText = {
            'pending': 'Đang chờ duyệt',
            'approved': 'Đã duyệt',
            'rejected': 'Bị từ chối'
        }[order.status] || order.status;

        card.innerHTML = `
            <div class="admin-order-header">
                <div class="order-id">
                    ${order.id}
                    <button class="copy-btn" onclick="copyText('${order.id}')" title="Copy Order ID">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="admin-order-details">
                <div class="order-detail-item">
                    <span class="order-detail-label">Discord</span>
                    <span class="order-detail-value">
                        ${order.discordUsername}
                        <button class="copy-btn" onclick="copyText('${order.discordId}')" title="Copy Discord ID" style="display:inline-flex;">
                            <i class="fas fa-copy"></i>
                        </button>
                    </span>
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
                    <span class="order-detail-label">Sản phẩm</span>
                    <span class="order-detail-value">${order.productName}</span>
                </div>
                <div class="order-detail-item">
                    <span class="order-detail-label">Số lượng</span>
                    <span class="order-detail-value">${order.quantity}</span>
                </div>
                <div class="order-detail-item">
                    <span class="order-detail-label">Giá</span>
                    <span class="order-detail-value">${formatPrice(order.price)}</span>
                </div>
                <div class="order-detail-item">
                    <span class="order-detail-label">Thời gian</span>
                    <span class="order-detail-value">${order.createdAtFormatted}</span>
                </div>
            </div>
            ${order.notes ? `
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
                <strong>Ghi chú:</strong> ${order.notes}
            </div>` : ''}
            <div class="admin-order-actions">
                ${order.status === 'pending' ? `
                    <button class="btn-approve" onclick="approveOrder('${order.id}')">
                        <i class="fas fa-check"></i> Duyệt
                    </button>
                    <button class="btn-reject" onclick="rejectOrder('${order.id}')">
                        <i class="fas fa-times"></i> Từ chối
                    </button>
                ` : `
                    <button class="btn-refresh" onclick="resetOrderStatus('${order.id}')">
                        <i class="fas fa-undo"></i> Reset về Pending
                    </button>
                `}
                <button class="btn-delete" onclick="deleteOrder('${order.id}')" style="margin-left: auto;">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </div>
        `;

        list.appendChild(card);
    });
}

// Approve order
async function approveOrder(orderId) {
    await syncOrdersFromGitHub();
    await updateOrderStatus(orderId, 'approved');
    await pushOrdersToGitHub();

    renderAdminOrders();
    renderAdminStats();
    showToast(`Đã duyệt đơn ${orderId}`, 'success');
}

// Reject order
async function rejectOrder(orderId) {
    await syncOrdersFromGitHub();
    await updateOrderStatus(orderId, 'rejected');
    await pushOrdersToGitHub();

    renderAdminOrders();
    renderAdminStats();
    showToast(`Đã từ chối đơn ${orderId}`, 'info');
}

// Reset order status
async function resetOrderStatus(orderId) {
    await syncOrdersFromGitHub();
    await updateOrderStatus(orderId, 'pending');
    await pushOrdersToGitHub();

    renderAdminOrders();
    renderAdminStats();
    showToast(`Đã reset đơn ${orderId}`, 'info');
}

// Delete order
async function deleteOrder(orderId) {
    if (!confirm(`Bạn có chắc muốn xóa đơn ${orderId}?`)) return;

    await syncOrdersFromGitHub();

    let orders = getOrders();
    orders = orders.filter(o => o.id !== orderId);
    saveOrders(orders);

    await pushOrdersToGitHub();

    renderAdminOrders();
    renderAdminStats();
    showToast(`Đã xóa đơn ${orderId}`, 'info');
}

// Update order status in localStorage
async function updateOrderStatus(orderId, newStatus) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        saveOrders(orders);
    }
}

// Switch admin tabs
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });

    document.getElementById('admin-dashboard').style.display = tab === 'dashboard' ? 'block' : 'none';
    document.getElementById('admin-orders').style.display = tab === 'orders' ? 'block' : 'none';
    document.getElementById('admin-downloads').style.display = tab === 'downloads' ? 'block' : 'none';

    if (tab === 'dashboard') renderAdminStats();
    if (tab === 'orders') renderAdminOrders();
    if (tab === 'downloads') renderAdminDownloads();
}

// PUSH toàn bộ orders lên GitHub
async function pushOrdersToGitHub() {
    const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_BRANCH, GITHUB_TOKEN } = CONFIG;

    if (!GITHUB_USERNAME || !GITHUB_REPO || GITHUB_USERNAME === 'YOUR_GITHUB_USERNAME') {
        return;
    }

    try {
        const orders = getOrders();

        let sha = null;
        try {
            const checkRes = await fetch(
                `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/data/orders.json?ref=${GITHUB_BRANCH}`,
                { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } }
            );
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                sha = checkData.sha;
            }
        } catch (e) {}

        const content = btoa(JSON.stringify(orders, null, 2));
        const payload = {
            message: `Update orders.json - ${new Date().toISOString()}`,
            content: content,
            branch: GITHUB_BRANCH
        };
        if (sha) payload.sha = sha;

        const res = await fetch(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/data/orders.json`,
            {
                method: 'PUT',
                headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.error('Push failed:', res.status, errData);
            if (res.status === 401) {
                showToast('Token GitHub không hợp lệ! Kiểm tra config.js', 'error');
            }
        }
    } catch (error) {
        console.error('GitHub push error:', error);
        showToast('Lỗi đồng bộ với GitHub', 'error');
    }
}

// PULL orders từ GitHub API (không bị CORS)
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
        saveOrders(githubOrders);
    } catch (error) {
        console.error('GitHub sync error:', error);
    }
}

// Auto-refresh admin page every 15 seconds
function startAdminAutoRefresh() {
    setInterval(() => {
        if (isLoggedIn() && isAdmin(getCurrentUser()?.id) && document.getElementById('page-admin')?.classList.contains('active')) {
            renderAdminOrders();
            renderAdminStats();
        }
    }, 15000);
}
