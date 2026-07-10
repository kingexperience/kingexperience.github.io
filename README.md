# King Experience - Cửa Hàng Vật Phẩm Minecraft

Website bán vật phẩm Minecraft chuyên nghiệp cho server **kingmc.vn**. Giao diện Gold Premium, hoạt động 100% miễn phí trên GitHub Pages.

---

## Kiến trúc & Công nghệ

Website được xây dựng hoàn toàn bằng HTML, CSS và JavaScript (Vanilla JS), không cần backend, database hay server trả phí.

| Công nghệ | Chi tiết |
|-----------|----------|
| Giao diện | Gold Theme, Glassmorphism, Responsive (Mobile & Desktop) |
| Đăng nhập | Discord OAuth2 (Client-side flow) |
| Database | LocalStorage + GitHub API (sync dữ liệu) |
| Đơn hàng | Gửi về Discord Webhook, đồng bộ trạng thái qua GitHub |
| Deploy | GitHub Pages (miễn phí hoàn toàn) |

---

## Hướng dẫn cài đặt chi tiết (9 bước)

### Bước 1: Tạo Discord Application (Lấy Client ID)

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Nhấn nút **New Application** (góc trên bên phải), đặt tên là "King Experience"
3. Chọn tab **OAuth2** bên trái, nhấn **General**
4. Tại mục **Redirects**, nhấn **Add Redirect**
5. Nhập URL GitHub Pages (ví dụ: `https://yourusername.github.io/king-experience/`)
   - *Chú ý: Nếu chưa có URL này, cứ tạm để trống, quay lại sửa sau Bước 5*
6. Lấy **Client ID** (dãy số dài ở đầu trang). Copy lại.

### Bước 2: Tạo Discord Webhook (Để nhận đơn hàng)

1. Mở Discord, vào **server của bạn**
2. Chọn **kênh (channel)** muốn nhận thông báo đơn hàng
3. Nhấn biểu tượng ⚙️ (**Edit Channel**)
4. Chọn tab **Integrations**
5. Nhấn **Create Webhook**
6. Đặt tên (ví dụ: "King Experience Orders")
7. Nhấn **Copy Webhook URL**. Copy lại.

### Bước 3: Tạo GitHub Repository

1. Truy cập [GitHub](https://github.com) và đăng nhập
2. Nhấn **New** (góc trên bên phải)
3. Repository name: `king-experience`
4. Chọn **Public**
5. Nhấn **Create repository**

### Bước 4: Lấy GitHub Personal Access Token

1. Vào [GitHub Settings > Developer settings > Personal access tokens > Classic](https://github.com/settings/tokens)
2. Nhấn **Generate new token (classic)**
3. Note: "King Experience"
4. Expiration: **No expiration**
5. Scopes: Chọn **`repo`**
6. Nhấn **Generate token**
7. **Copy và lưu token ngay** (GitHub chỉ hiện 1 lần!)

### Bước 5: Lấy Discord ID của Admin

1. Mở Discord > **User Settings** > **Advanced**
2. Bật **Developer Mode**
3. Chuột phải vào tên bạn bất kỳ đâu
4. Chọn **Copy User ID**
5. Copy lại Discord ID này

### Bước 6: Chỉnh sửa file `config.js`

Mở file `config.js` và điền thông tin:

```javascript
DISCORD_CLIENT_ID: 'DÃY_SỐ_CLIENT_ID_CỦA_BẠN',
DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/...',
DISCORD_ADMIN_IDS: 'DISCORD_ID_CỦA_BẠN',
DISCORD_REDIRECT_URL: 'https://yourusername.github.io/king-experience/',
GITHUB_USERNAME: 'yourusername',
GITHUB_REPO: 'king-experience',
GITHUB_TOKEN: 'ghp_...',
```

### Bước 7: Upload Source Code lên GitHub

**Cách 1: Upload thủ công (dễ nhất)**
1. Truy cập repository `king-experience` trên GitHub
2. Nhấn **Add file** > **Upload files**
3. Kéo thả **tất cả file** vào
4. Nhấn **Commit changes**

### Bước 8: Bật GitHub Pages

1. Trong repository, chọn tab **Settings**
2. Chọn **Pages** ở menu bên trái
3. Tại mục **Build and deployment**:
   - Source: chọn **Deploy from a branch**
   - Branch: chọn `main`
   - Folder: chọn `/ (root)`
4. Nhấn **Save**
5. Đợi 1-2 phút, GitHub sẽ cung cấp URL (ví dụ: `https://yourusername.github.io/king-experience/`)
6. **Quay lại Bước 1**, cập nhật **Redirects** bằng đúng URL này

### Bước 9: Hoàn thành!

Mở đường link GitHub Pages lên trình duyệt. Website đã hoạt động!

**Quy trình hoạt động:**
1. Khách đăng nhập Discord > Mua hàng
2. Đơn hàng gửi về **Discord Webhook** (kênh Discord của bạn)
3. Bạn vào trang **Admin** trên website (sau khi đăng nhập)
4. Nhấn **Duyệt** hoặc **Từ chối**
5. Trạng thái được sync lên GitHub
6. Khách nhấn **Làm mới trạng thái** trên trang Đơn Hàng sẽ thấy kết quả

---

## Cấu trúc thư mục

| File | Chức năng |
|------|-----------|
| `index.html` | Giao diện chính |
| `style.css` | Toàn bộ CSS (Gold Theme, Glassmorphism) |
| `config.js` | **Chỉ file này cần sửa** (Discord, GitHub, sản phẩm) |
| `auth.js` | Đăng nhập Discord OAuth2 |
| `shop.js` | Shop + Đặt hàng + Gửi Webhook |
| `orders.js` | Đơn hàng + Theo dõi trạng thái |
| `downloads.js` | Thư viện Download miễn phí |
| `admin.js` | Admin Dashboard + Duyệt đơn + Sync GitHub |
| `script.js` | Navigation + Hiệu ứng |
| `404.html` | Xử lý lỗi (cần cho GitHub Pages) |
