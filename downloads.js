/*
============================================================================
    DOWNLOADS.JS - FREE DOWNLOAD & THƯ VIỆN
============================================================================
    Hiển thị danh sách download, tìm kiếm, lọc,
    và chức năng upload qua Admin Panel.
    Dùng GitHub API để tránh CORS.
============================================================================
*/

let currentDownloadFilter = 'all';

function getDownloads() {
    const downloads = localStorage.getItem('ke_downloads');
    if (downloads) return JSON.parse(downloads);
    return CONFIG.DEFAULT_DOWNLOADS || [];
}

function saveDownloads(downloads) {
    localStorage.setItem('ke_downloads', JSON.stringify(downloads));
}

function renderDownloads() {
    const grid = document.getElementById('downloads-grid');
    if (!grid) return;

    let downloads = getDownloads();

    if (currentDownloadFilter !== 'all') {
        downloads = downloads.filter(d => d.type === currentDownloadFilter);
    }

    const searchVal = document.getElementById('download-search')?.value?.toLowerCase() || '';
    if (searchVal) {
        downloads = downloads.filter(d =>
            d.name.toLowerCase().includes(searchVal) ||
            d.description.toLowerCase().includes(searchVal) ||
            d.type.toLowerCase().includes(searchVal)
        );
    }

    grid.innerHTML = '';

    if (downloads.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-folder-open"></i>
                <p>Không tìm thấy download nào</p>
            </div>
        `;
        return;
    }

    downloads.forEach(dl => {
        const card = document.createElement('div');
        card.className = 'download-card';

        const typeLabels = { 'schem': '.schem', 'schematic': '.schematic', 'litematic': '.litematic' };
        const typeClass = typeLabels[dl.type] || dl.type;

        card.innerHTML = `
            <div class="download-preview">
                ${dl.image ?
                    `<img src="${dl.image}" alt="${dl.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=&quot;fas fa-cube placeholder-icon&quot;></i>'">` :
                    `<i class="fas fa-cube placeholder-icon"></i>`
                }
            </div>
            <div class="download-info">
                <h3 class="download-name">${dl.name}</h3>
                <div class="download-meta">
                    <span class="download-type">${typeClass}</span>
                    <span><i class="fas fa-code-branch"></i> ${dl.version || 'N/A'}</span>
                    <span><i class="fas fa-hdd"></i> ${dl.size || 'N/A'}</span>
                </div>
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">${dl.description || ''}</p>
                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">
                    <i class="fas fa-calendar"></i> ${dl.date || ''}
                </div>
                <a href="${dl.link}" class="btn-download" target="_blank" rel="noopener">
                    <i class="fas fa-download"></i> Download
                </a>
            </div>
        `;

        grid.appendChild(card);
    });
}

function setDownloadFilter(filter) {
    currentDownloadFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });
    renderDownloads();
}

function filterDownloads() {
    renderDownloads();
}

// ===== ADMIN DOWNLOAD FUNCTIONS =====

function renderAdminDownloads() {
    const list = document.getElementById('admin-downloads-list');
    if (!list) return;

    const downloads = getDownloads();
    list.innerHTML = '';

    if (downloads.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>Chưa có download nào</p></div>';
        return;
    }

    downloads.forEach(dl => {
        const item = document.createElement('div');
        item.className = 'admin-download-item';

        const typeLabels = { 'schem': '.schem', 'schematic': '.schematic', 'litematic': '.litematic' };

        item.innerHTML = `
            <div class="admin-download-info">
                ${dl.image ?
                    `<img src="${dl.image}" alt="${dl.name}" onerror="this.style.display='none'; this.parentElement.querySelector('.placeholder-icon').style.display='flex'">` :
                    ''
                }
                <div class="placeholder-icon" style="${dl.image ? 'display:none' : ''}">
                    <i class="fas fa-cube"></i>
                </div>
                <div>
                    <strong>${dl.name}</strong>
                    <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">${typeLabels[dl.type] || dl.type} | ${dl.version || 'N/A'}</span>
                </div>
            </div>
            <button class="btn-delete" onclick="deleteDownload('${dl.id}')">
                <i class="fas fa-trash"></i> Xóa
            </button>
        `;

        list.appendChild(item);
    });
}

function addDownload() {
    const name = document.getElementById('dl-name').value.trim();
    const description = document.getElementById('dl-description').value.trim();
    const type = document.getElementById('dl-type').value;
    const version = document.getElementById('dl-version').value.trim();
    const size = document.getElementById('dl-size').value.trim();
    const link = document.getElementById('dl-link').value.trim();
    const image = document.getElementById('dl-image').value.trim();

    if (!name) { showToast('Vui lòng nhập tên download', 'error'); return; }
    if (!link) { showToast('Vui lòng nhập link tải', 'error'); return; }

    const downloads = getDownloads();
    downloads.push({
        id: 'dl-' + Date.now(),
        name, description, type, version, size,
        date: new Date().toISOString().split('T')[0],
        image, link
    });

    saveDownloads(downloads);
    syncDownloadsToGitHub(downloads);

    document.getElementById('dl-name').value = '';
    document.getElementById('dl-description').value = '';
    document.getElementById('dl-version').value = '';
    document.getElementById('dl-size').value = '';
    document.getElementById('dl-link').value = '';
    document.getElementById('dl-image').value = '';

    showToast('Đã thêm download mới!', 'success');
    renderAdminDownloads();
    renderDownloads();
}

function deleteDownload(id) {
    let downloads = getDownloads();
    downloads = downloads.filter(d => d.id !== id);
    saveDownloads(downloads);
    syncDownloadsToGitHub(downloads);
    showToast('Đã xóa download', 'info');
    renderAdminDownloads();
    renderDownloads();
}

async function syncDownloadsToGitHub(downloads) {
    const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_BRANCH, GITHUB_TOKEN } = CONFIG;
    if (!GITHUB_USERNAME || !GITHUB_REPO || GITHUB_USERNAME === 'YOUR_GITHUB_USERNAME') return;

    try {
        let sha = null;
        try {
            const checkRes = await fetch(
                `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/data/downloads.json?ref=${GITHUB_BRANCH}`,
                { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } }
            );
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                sha = checkData.sha;
            }
        } catch (e) {}

        const content = btoa(JSON.stringify(downloads, null, 2));
        const payload = {
            message: `Update downloads.json - ${new Date().toISOString()}`,
            content: content,
            branch: GITHUB_BRANCH
        };
        if (sha) payload.sha = sha;

        await fetch(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/data/downloads.json`,
            {
                method: 'PUT',
                headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );
    } catch (error) {
        console.error('GitHub sync error:', error);
    }
}

// PULL downloads từ GitHub API (không bị CORS)
async function syncDownloadsFromGitHub() {
    const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_BRANCH, GITHUB_TOKEN } = CONFIG;
    if (!GITHUB_USERNAME || !GITHUB_REPO || GITHUB_USERNAME === 'YOUR_GITHUB_USERNAME') return;

    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/data/downloads.json?ref=${GITHUB_BRANCH}`,
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
        const githubDownloads = JSON.parse(content);
        saveDownloads(githubDownloads);
    } catch (error) {
        console.error('GitHub sync error:', error);
    }
}
