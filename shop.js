/*
============================================================================
    SHOP.JS - SHOP & ĐẶT HÀNG
============================================================================
    Hiển thị sản phẩm, xử lý nút BUY, popup đặt hàng,
    gửi order qua Discord Webhook + PUSH lên GitHub.
    Dùng GitHub API với token, không dùng raw.githubusercontent.com.
============================================================================
*/

// Render shop products
function renderShop() {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    grid.innerHTML = '';

    CONFIG.PRODUCTS.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=&quot;${product.icon || 'fas fa-cube'}&quot; class=&quot;placeholder-icon&quot;></i>'">` :
                    `<i class="${product.icon || 'fas fa-cube'} placeholder-icon"></i>`
                }
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-prices">
                    <div class="price-box">
                        <div class="price-label">Giá Bán</div>
                        <div class="price-value">${formatPrice(product.priceSell)}</div>
                    </div>
                    <div class="price-box">
                        <div class="price-label">Giá Thu</div>
                        <div class="price-value">${formatPrice(product.priceBuy)}</div>
                    </div>
                </div>
                <button class="btn-buy" onclick="openOrderModal('${product.id}')">
                    <i class="fas fa-shopping-cart"></i> BUY
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

let currentOrderProduct = null;

// Open order modal
function openOrderModal(productId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Vui lòng đăng nhập Discord trước', 'error');
        return;
    }

    const product = CONFIG.PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    currentOrderProduct = product;

    const modal = document.getElementById('order-modal');
    const infoDiv = document.getElementById('order-product-info');

    if (product.image) {
        infoDiv.innerHTML = `
            <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=&quot;placeholder-icon&quot;><i class=&quot;${product.icon || 'fas fa-cube'}&quot;></i></div><div><h3 style=&quot;color:var(--gold-light)&quot;>${product.name}</h3><p class=&quot;order-price&quot;>${formatPrice(product.priceSell)}</p></div>'">
            <div>
                <h3 style="color: var(--gold-light);">${product.name}</h3>
                <p class="order-price">${formatPrice(product.priceSell)}</p>
            </div>
        `;
    } else {
        infoDiv.innerHTML = `
            <div class="placeholder-icon"><i class="${product.icon || 'fas fa-cube'}"></i></div>
            <div>
                <h3 style="color: var(--gold-light);">${product.name}</h3>
                <p class="order-price">${formatPrice(product.priceSell)}</p>
            </div>
        `;
    }

    document.getElementById('order-ign').value = '';
    document.getElementById('order-server').value = 'kingmc.vn';
    document.getElementById('order-quantity').value = 1;
    document.getElementById('order-notes').value = '';

    updateOrderTotal();
    modal.classList.add('active');
}

// Close order modal
function closeOrderModal() {
    document.getElementById('order-modal').classList.remove('active');
    currentOrderProduct = null;
}

// Update order total price
function updateOrderTotal() {
    if (!currentOrderProduct) return;
    const quantity = parseInt(document.getElementById('order-quantity').value) || 1;
    const total = currentOrderProduct.priceSell * quantity;
    document.getElementById('order-total-price').textContent = formatPrice(total);
}

document.addEventListener('DOMContentLoaded', () => {
    const qtyInput = document.getElementById('order-quantity');
    if (qtyInput) {
        qtyInput.addEventListener('input', updateOrderTotal);
    }
});

// Generate Order ID
function generateOrderId() {
    const prefix = '#KE';
    const num = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return prefix + num;
}

// Get orders from localStorage
function getOrders() {
    const orders = localStorage.getItem('ke_orders');
    return orders ? JSON.parse(orders) : [];
}

// Save orders to localStorage
function saveOrders(orders) {
    localStorage.setItem('ke_orders', JSON.stringify(orders));
}

// Submit order - đẩy lên GitHub
async function submitOrder() {
    const user = getCurrentUser();
    if (!user || !currentOrderProduct) return;

    const ign = document.getElementById('order-ign').value.trim();
    const server = document.getElementById('order-server').value.trim();
    const quantity = parseInt(document.getElementById('order-quantity').value) || 1;
    const notes = document.getElementById('order-notes').value.trim();

    if (!ign) {
        showToast('Vui lòng nhập IGN Minecraft', 'error');
        return;
    }
    if (!server) {
        showToast('Vui lòng nhập Server', 'error');
        return;
    }

    const orderId = generateOrderId();
    const totalPrice = currentOrderProduct.priceSell * quantity;
    const now = new Date();

    const order = {
        id: orderId,
        productId: currentOrderProduct.id,
        productName: currentOrderProduct.name,
        ign: ign,
        server: server,
        quantity: quantity,
        price: totalPrice,
        notes: notes,
        status: 'pending',
        discordId: user.id,
        discordUsername: user.globalName || user.username,
        discordAvatar: user.avatarUrl,
        createdAt: now.toISOString(),
        createdAtFormatted: now.toLocaleString('vi-VN')
    };

    // Gửi Discord Webhook TRƯỚC (nhanh hơn)
    sendDiscordWebhook(order);

    // PUSH lên GitHub
    showToast('Đang xử lý đơn hàng...', 'info');

    try {
        const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_BRANCH, GITHUB_TOKEN } = CONFIG;

        if (!GITHUB_USERNAME || !GITHUB_REPO || !GITHUB_TOKEN || 
            GITHUB_USERNAME === 'YOUR_GITHUB_USERNAME' || 
            GITHUB_REPO === 'YOUR_REPO_NAME' || 
            GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN') {
            // Fallback: lưu LocalStorage
            const orders = getOrders();
            orders.push(order);
            saveOrders(orders);
            closeOrderModal();
            showToast(`Đặt hàng thành công! Order ID: ${orderId} (lưu cục bộ)`, 'success');
            setTimeout(() => navigateTo('orders'), 1000);
            return;
        }

        // Lấy orders hiện có từ GitHub
        let existingOrders = [];
        let sha = null;

        const checkRes = await fetch(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/data/orders.json?ref=${GITHUB_BRANCH}`,
            { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } }
        );
        if (checkRes.ok) {
            const checkData = await checkRes.json();
            sha = checkData.sha;
            existingOrders = JSON.parse(atob(checkData.content));
        } else if (checkRes.status === 404) {
            // File chưa tồn tại, bắt đầu từ empty
        } else if (checkRes.status === 401) {
            showToast('Token GitHub không hợp lệ! Kiểm tra lại config.js', 'error');
            return;
        }

        // Thêm đơn mới
        existingOrders.push(order);

        // Upload lên GitHub
        const content = btoa(JSON.stringify(existingOrders, null, 2));
        const payload = {
            message: `New Order: ${orderId} - ${order.productName} by ${order.discordUsername}`,
            content: content,
            branch: GITHUB_BRANCH
        };
        if (sha) payload.sha = sha;

        const pushRes = await fetch(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/data/orders.json`,
            {
                method: 'PUT',
                headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );

        if (pushRes.ok) {
            saveOrders(existingOrders);
            showToast(`Đặt hàng thành công! Order ID: ${orderId}`, 'success');
            closeOrderModal();
            setTimeout(() => navigateTo('orders'), 1000);
        } else {
            const errData = await pushRes.json().catch(() => ({}));
            console.error('Push error:', pushRes.status, errData);
            if (pushRes.status === 401) {
                showToast('Token GitHub không hợp lệ!', 'error');
            }
            // Fallback LocalStorage
            const orders = getOrders();
            orders.push(order);
            saveOrders(orders);
            closeOrderModal();
            showToast(`Đã đặt hàng (lưu cục bộ). Lỗi GitHub: ${pushRes.status}`, 'error');
            setTimeout(() => navigateTo('orders'), 1000);
        }
    } catch (error) {
        console.error('GitHub push error:', error);
        const orders = getOrders();
        orders.push(order);
        saveOrders(orders);
        closeOrderModal();
        showToast(`Đã đặt hàng (lưu cục bộ). Lỗi kết nối GitHub.`, 'error');
        setTimeout(() => navigateTo('orders'), 1000);
    }
}

// Send Discord Webhook
async function sendDiscordWebhook(order) {
    const webhookUrl = CONFIG.DISCORD_WEBHOOK_URL;

    if (!webhookUrl || webhookUrl === 'YOUR_DISCORD_WEBHOOK_URL') {
        return;
    }

    const embed = {
        title: '👑 Đơn Hàng Mới - King Experience',
        description: `**Server:** kingmc.vn`,
        color: 0xFFD700,
        fields: [
            {
                name: '👤 Người Mua',
                value: `**Discord:** <@${order.discordId}> (${order.discordUsername})\n**Discord ID:** \`${order.discordId}\``,
                inline: false
            },
            {
                name: '🎮 Minecraft',
                value: `**IGN:** \`${order.ign}\`\n**Server:** \`${order.server}\``,
                inline: false
            },
            {
                name: '📦 Sản Phẩm',
                value: `**${order.productName}**\nSố lượng: ${order.quantity}`,
                inline: true
            },
            {
                name: '💰 Giá',
                value: `${formatPrice(order.price)}`,
                inline: true
            },
            {
                name: '🕐 Thời Gian',
                value: order.createdAtFormatted,
                inline: false
            },
            {
                name: '📋 Order ID',
                value: `\`${order.id}\``,
                inline: false
            }
        ],
        timestamp: order.createdAt,
        footer: {
            text: 'King Experience | kingmc.vn',
            icon_url: 'https://img.icons8.com/fluency/48/crown.png'
        },
        thumbnail: {
            url: order.discordAvatar
        }
    };

    if (order.notes) {
        embed.fields.splice(5, 0, {
            name: '📝 Ghi Chú',
            value: order.notes,
            inline: false
        });
    }

    const payload = {
        username: 'King Experience Shop',
        avatar_url: 'https://img.icons8.com/fluency/48/crown.png',
        embeds: [embed]
    };

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error('Webhook error:', error);
    }
}
