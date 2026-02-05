const API_URL = 'https://api.escuelajs.co/api/v1/products';

// Dữ liệu bạn vừa gửi
const customData = [
    {"id":817,"title":"hoanganh","slug":"hoanganh","price":123,"description":"alo em à","category":{"id":1,"name":"Clothes"},"images":["https://placehold.co/600x400"]},
    {"id":818,"title":"Tạo bài mới nè TV","slug":"tao-bai-moi-ne-tv","price":200000000,"description":"ok nhá","category":{"id":1,"name":"Clothes"},"images":["https://noithatbinhminh.com.vn/wp-content/uploads/2022/08/anh-dep-44.jpg.webp"]},
    {"id":819,"title":"1","slug":"1","price":1,"description":"San Pham","category":{"id":1,"name":"Clothes"},"images":["https://placehold.co/400"]},
    {"id":820,"title":"2","slug":"2","price":2,"description":"San Pham","category":{"id":1,"name":"Clothes"},"images":["https://placehold.co/400"]},
    {"id":821,"title":"aaaaaaaaaa","slug":"aaaaaaaaaa","price":1000,"description":"cccc","category":{"id":2,"name":"Electronics"},"images":["https://thuthuatphanmem.vn/uploads/2018/09/11/hinh-anh-dep-62_044135376.jpg"]}
];

let products = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortOrder = { field: 'id', asc: false };

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('pageSize').addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
    });
    document.getElementById('createForm').addEventListener('submit', createProduct);
    // Thêm sự kiện sắp xếp cho các cột
    document.querySelector('th[onclick*="sortData(\'title\')"]').addEventListener('click', () => sortData('title'));
    document.querySelector('th[onclick*="sortData(\'price\')"]').addEventListener('click', () => sortData('price'));
    document.querySelector('th[onclick*="sortData(\'id\')"]').addEventListener('click', () => sortData('id'));
    updateSortIcons();
    // Sự kiện mở modal tạo sản phẩm
    document.getElementById('openCreateModal').addEventListener('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('createModal'));
        modal.show();
    });
});

async function fetchData() {
    try {
        const tbody = document.getElementById('productTableBody');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-5">Đang tải dữ liệu...</td></tr>';

        const res = await fetch(API_URL);
        const apiData = await res.json();
        
        // GỘP DỮ LIỆU: Ưu tiên dữ liệu của bạn + dữ liệu từ API
        // Loại bỏ trùng lặp ID nếu có
        const combined = [...customData, ...apiData];
        const uniqueProducts = Array.from(new Map(combined.map(item => [item.id, item])).values());

        // Sắp xếp ID giảm dần để các bài mới (821, 820...) hiện lên đầu
        products = uniqueProducts.sort((a, b) => b.id - a.id);
        filteredProducts = [...products];
        
        renderTable();
    } catch (err) {
        console.error("Lỗi:", err);
        // Nếu API lỗi, vẫn hiện dữ liệu của bạn
        products = customData;
        filteredProducts = [...products];
        renderTable();
    }
}

function renderTable() {
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = filteredProducts.slice(start, end);

    paginatedItems.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'product-row';
        row.onclick = () => showDetail(item.id);
        // Hiển thị description khi hover
        row.title = item.description || '';
        // Làm sạch link ảnh
        let imgUrl = 'https://via.placeholder.com/150';
        if (item.images && item.images[0]) {
            imgUrl = item.images[0].replace(/[\[\]"\\]/g, "");
            if (imgUrl.includes("bing.com")) imgUrl = "https://via.placeholder.com/150?text=Bing+Img";
        }
        row.innerHTML = `
            <td><span class="badge bg-light text-dark border badge-id">${item.id}</span></td>
            <td><img src="${imgUrl}" class="img-thumbnail-custom" onerror="this.src='https://via.placeholder.com/60'"></td>
            <td class="fw-bold">${item.title}</td>
            <td class="text-success fw-bold">$${item.price.toLocaleString()}</td>
            <td><span class="badge bg-info text-dark">${item.category?.name || 'N/A'}</span></td>
        `;
        tbody.appendChild(row);
    });
    renderPagination();
}

function sortData(field) {
    if (sortOrder.field === field) {
        sortOrder.asc = !sortOrder.asc;
    } else {
        sortOrder.field = field;
        sortOrder.asc = true;
    }
    filteredProducts.sort((a, b) => {
        let aValue = a[field];
        let bValue = b[field];
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        if (aValue < bValue) return sortOrder.asc ? -1 : 1;
        if (aValue > bValue) return sortOrder.asc ? 1 : -1;
        return 0;
    });
    currentPage = 1;
    renderTable();
    updateSortIcons();
}

function updateSortIcons() {
    // Xóa icon cũ
    document.querySelectorAll('th[data-sortable]').forEach(th => {
        th.innerHTML = th.dataset.label;
    });
    // Thêm icon cho cột đang sort
    let icon = sortOrder.asc ? ' <span style="font-size:1em">▲</span>' : ' <span style="font-size:1em">▼</span>';
    if (sortOrder.field === 'title') {
        let th = document.querySelector('th[onclick*="sortData(\'title\')"]');
        th.innerHTML = th.dataset.label + icon;
    } else if (sortOrder.field === 'price') {
        let th = document.querySelector('th[onclick*="sortData(\'price\')"]');
        th.innerHTML = th.dataset.label + icon;
    } else if (sortOrder.field === 'id') {
        let th = document.querySelector('th[onclick*="sortData(\'id\')"]');
        th.innerHTML = th.dataset.label + icon;
    }
}

// --- Hàm tạo sản phẩm mới qua API ---
async function createProduct(e) {
    e.preventDefault();
    const title = document.getElementById('c-title').value.trim();
    const price = parseFloat(document.getElementById('c-price').value);
    const categoryId = parseInt(document.getElementById('c-catId').value);
    const images = [document.getElementById('c-img').value.trim() || 'https://via.placeholder.com/400'];
    const description = document.getElementById('c-desc').value.trim();

    const body = {
        title,
        price,
        description,
        categoryId,
        images
    };
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Tạo sản phẩm thất bại');
        // Đóng modal, làm mới bảng
        bootstrap.Modal.getInstance(document.getElementById('createModal')).hide();
        fetchData();
    } catch (err) {
        alert('Lỗi tạo sản phẩm: ' + err.message);
    }
}

// --- Export dữ liệu view hiện tại ra CSV ---
function exportCSV() {
    // Lấy dữ liệu trang hiện tại
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = filteredProducts.slice(start, end);
    if (!paginatedItems.length) return alert('Không có dữ liệu để xuất!');
    // Tạo header
    const header = ['ID', 'Tên sản phẩm', 'Giá', 'Danh mục', 'Mô tả', 'Ảnh'];
    const rows = paginatedItems.map(item => [
        item.id,
        '"' + (item.title || '').replace(/"/g, '""') + '"',
        item.price,
        '"' + (item.category?.name || '') + '"',
        '"' + (item.description || '').replace(/"/g, '""') + '"',
        '"' + (item.images && item.images[0] ? item.images[0] : '') + '"'
    ]);
    let csv = header.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    // Tạo file và tải về
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'products_page' + currentPage + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// --- GIỮ NGUYÊN CÁC HÀM CÒN LẠI (handleSearch, renderPagination, showDetail, v.v...) ---
function handleSearch(e) {
    const text = e.target.value.toLowerCase();
    filteredProducts = products.filter(p => p.title.toLowerCase().includes(text));
    currentPage = 1;
    renderTable();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const container = document.getElementById('pagination');
    container.innerHTML = '';
    if (totalPages <= 1) return;
    for(let i = 1; i <= Math.min(totalPages, 10); i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.onclick = (e) => { e.preventDefault(); currentPage = i; renderTable(); };
        container.appendChild(li);
    }
}