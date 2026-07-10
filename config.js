/*
============================================================================
    KING EXPERIENCE - CẤU HÌNH
============================================================================
    Hãy điền thông tin của bạn vào bên dưới.
    Chỉ cần thay đổi các giá trị trong phần CONFIG là đủ.
============================================================================
*/

const CONFIG = {

    // ============================
    // DISCORD
    // ============================

    // Discord Client ID - lấy từ Discord Developer Portal
    // Hướng dẫn: Vào https://discord.com/developers/applications
    // Tạo Application mới > OAuth2 > General > Copy Client ID
    DISCORD_CLIENT_ID: '1524836930489942036',

    // Discord Webhook URL - dùng để gửi đơn hàng về kênh Discord của bạn
    // Hướng dẫn: Vào Discord server > Edit Channel > Integrations > Create Webhook > Copy URL
    // Ví dụ: https://discord.com/api/webhooks/123456789/abcdef
    DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/1524833794434138143/znJ8FwzfjiYvjv2RDV7kvJWVO4-pfRgUlgdZfxeQE3jjzKQAjceW6aelrx01Hg9tJlQs',

    // Discord Admin ID - ID của admin để hiện panel Admin
    // Để lấy Discord ID: Discord > Settings > Advanced > Developer Mode
    // Sau đó chuột phải vào tên bạn > Copy User ID
    // Có thể thêm nhiều admin, cách nhau bằng dấu phẩy
    // Ví dụ: '123456789012345678,987654321098765432'
    DISCORD_ADMIN_IDS: '1002090491287978085',

    // Redirect URL - URL của GitHub Pages của bạn
    // Ví dụ: https://yourusername.github.io/king-experience/
    DISCORD_REDIRECT_URL: 'https://kingexperience.github.io/',

    // ============================
    // GITHUB REPOSITORY (dùng để lưu orders/downloads)
    // ============================

    // GitHub Username (tên đăng nhập GitHub của bạn)
    GITHUB_USERNAME: 'kingexperience',

    // GitHub Repository Name (tên repo, phải là public)
    GITHUB_REPO: 'kingexperience.github.io',

    // GitHub Personal Access Token (classic, scope: repo)
    // Hướng dẫn: https://github.com/settings/tokens > Generate new token (classic)
    // Chọn scope "repo", no expiration
    GITHUB_TOKEN: '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',

    // GitHub Branch (thường là main hoặc master)
    GITHUB_BRANCH: 'main',

    // ============================
    // CURRENCY
    // ============================

    CURRENCY_SYMBOL: '$',
    CURRENCY_NAME: 'Dollar',

    // ============================
    // SHOP PRODUCTS
    // ============================

    PRODUCTS: [
        {
            id: 'skeleton-spawner',
            name: 'Skeleton Spawner',
            description: 'Spawner Skeleton chất lượng cao trên kingmc.vn. Giúp bạn farm XP và箭 tự động. Hiệu suất tối ưu trên mọi server.',
            priceSell: 20000000,
            priceBuy: 17000000,
            image: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/3/34/Skeleton_Spawner_JE5_BE2.png',
            icon: 'fas fa-skull',
            badge: 'Hot'
        },
        {
            id: 'creeper-spawner',
            name: 'Creeper Spawner',
            description: 'Spawner Creeper hiệu suất cao trên kingmc.vn. Phù hợp farm TNT tự động với hiệu suất tối ưu.',
            priceSell: 20000000,
            priceBuy: 17000000,
            image: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/a/a0/Creeper_Spawner_JE5_BE2.png',
            icon: 'fas fa-bomb',
            badge: 'Hot'
        }
    ],

    // ============================
    // DOWNLOADS
    // ============================
    DEFAULT_DOWNLOADS: [
        {
            id: 'dl-1',
            name: 'Nhà Hiện Đại Đẹp',
            description: 'Ngôi nhà hiện đại với thiết kế đẹp mắt, phù hợp cho survival trên kingmc.vn',
            type: 'litematic',
            version: '1.20.4',
            size: '1.2 MB',
            date: '2026-07-01',
            image: 'https://picsum.photos/400/300?random=1',
            link: 'https://example.com/download1'
        },
        {
            id: 'dl-2',
            name: 'Farm Tự Động Tối Ưu',
            description: 'Farm tự động cho mọi loại crop, thiết kế compact cho kingmc.vn',
            type: 'schem',
            version: '1.20.4',
            size: '850 KB',
            date: '2026-07-05',
            image: 'https://picsum.photos/400/300?random=2',
            link: 'https://example.com/download2'
        },
        {
            id: 'dl-3',
            name: 'Lâu Đài Medieval',
            description: 'Lâu đài thời trung cổ hoành tráng với tường thành cho kingmc.vn',
            type: 'schematic',
            version: '1.20.1',
            size: '3.5 MB',
            date: '2026-06-28',
            image: 'https://picsum.photos/400/300?random=3',
            link: 'https://example.com/download3'
        }
    ]
};

/* ===== HÃY KHÔNG SỬA DƯỚI DÒNG NÀY ===== */

// Format currency
function formatPrice(amount) {
    return amount.toLocaleString('vi-VN') + CONFIG.CURRENCY_SYMBOL;
}

// Get admin IDs as array
function getAdminIds() {
    return CONFIG.DISCORD_ADMIN_IDS.split(',').map(id => id.trim()).filter(id => id);
}

// Check if user is admin
function isAdmin(discordId) {
    return getAdminIds().includes(discordId);
}
