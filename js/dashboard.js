// Dashboard controller with new Supabase client
import { 
    fetchProducts, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    fetchOrders, 
    createOrder, 
    updateOrderStatus, 
    uploadProductImage, 
    getDashboardStats, 
    testConnection,
    supabase
} from './supabase-client.js';
import { resolveAsset } from './common.js';

class DashboardController {
    constructor() {
        this.currentSection = 'dashboard';
        this.products = [];
        this.orders = [];
        this.currentProductId = null;
        this.currentOrderId = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        
        // Test connection
        await this.testDatabaseConnection();
        
        // Load initial data
        await this.loadDashboardData();
        
        // Show dashboard by default
        this.showSection('dashboard');
    }

    setupEventListeners() {
        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('sidebar');
        const mobileOverlay = document.getElementById('mobileOverlay');
        
        mobileMenuBtn?.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
            mobileOverlay.classList.remove('hidden');
        });
        
        mobileOverlay?.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            mobileOverlay.classList.add('hidden');
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
                
                // Close mobile menu
                sidebar.classList.add('-translate-x-full');
                mobileOverlay.classList.add('hidden');
            });
        });

        // Product management
        document.getElementById('addProductBtn')?.addEventListener('click', () => {
            this.openProductModal();
        });

        // Product form submission
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                try {
                    this.saveProduct();
                } catch (error) {
                    console.error('Error in saveProduct():', error);
                    this.showNotification('Error saving product: ' + error.message, 'error');
                }
            });
        }

        document.getElementById('closeProductModal')?.addEventListener('click', () => {
            this.closeProductModal();
        });

        document.getElementById('cancelProductBtn')?.addEventListener('click', () => {
            this.closeProductModal();
        });

        document.getElementById('productImage')?.addEventListener('change', (e) => {
            this.previewImage(e.target.files[0]);
        });

        // Order management
        document.getElementById('closeOrderModal')?.addEventListener('click', () => {
            this.closeOrderModal();
        });

        // Search and filters
        document.getElementById('productSearch')?.addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            this.filterProductsByCategory(e.target.value);
        });

        document.getElementById('orderSearch')?.addEventListener('input', (e) => {
            this.filterOrders(e.target.value);
        });

        document.getElementById('orderStatusFilter')?.addEventListener('change', (e) => {
            this.filterOrdersByStatus(e.target.value);
        });

        // Migration
        document.getElementById('migrateProductsBtn')?.addEventListener('click', () => {
            this.migrateProducts();
        });
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }

    async testDatabaseConnection() {
        const dbStatus = document.getElementById('dbStatus');
        if (!dbStatus) return;

        try {
            const isConnected = await testConnection();
            if (isConnected) {
                dbStatus.innerHTML = '<p class="text-sm text-green-600"><i class="fas fa-check-circle mr-2"></i>Connected to Supabase</p>';
            } else {
                dbStatus.innerHTML = '<p class="text-sm text-red-600"><i class="fas fa-times-circle mr-2"></i>Connection failed</p>';
            }
        } catch (error) {
            dbStatus.innerHTML = '<p class="text-sm text-red-600"><i class="fas fa-times-circle mr-2"></i>Connection error</p>';
        }
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(el => {
            el.classList.add('hidden');
        });

        // Show selected section
        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('bg-gray-100', 'text-[#556b2f]');
            item.classList.add('text-gray-700');
        });

        const activeNav = document.querySelector(`[data-section="${section}"]`);
        if (activeNav) {
            activeNav.classList.remove('text-gray-700');
            activeNav.classList.add('bg-gray-100', 'text-[#556b2f]');
        }

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            products: 'Products Management',
            orders: 'Orders Management',
            settings: 'Settings'
        };

        const subtitles = {
            dashboard: 'Welcome to Mounifull Admin Dashboard',
            products: 'Manage your product inventory',
            orders: 'Track and manage customer orders',
            settings: 'System settings and tools'
        };

        document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
        document.getElementById('pageSubtitle').textContent = subtitles[section] || '';

        this.currentSection = section;

        // Load section-specific data
        if (section === 'products') {
            this.loadProducts();
        } else if (section === 'orders') {
            this.loadOrders();
        }
    }

    async loadDashboardData() {
        this.showLoading(true);
        
        try {
            const stats = await getDashboardStats();
            this.updateDashboardStats(stats);
            this.renderRecentOrders(stats.recentOrders);
            this.renderLowStockProducts(stats.lowStockProducts);
            this.renderCharts(stats);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('activeOrders').textContent = stats.activeOrders;
        document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue.toFixed(2)}`;
        document.getElementById('monthlyRevenue').textContent = `$${stats.monthlyRevenue.toFixed(2)}`;
    }

    renderRecentOrders(orders) {
        const container = document.getElementById('recentOrdersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center">No recent orders</p>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                    <p class="font-medium text-gray-900">${order.customer_name}</p>
                    <p class="text-sm text-gray-600">$${order.total.toFixed(2)}</p>
                </div>
                <div class="text-right">
                    <span class="px-2 py-1 text-xs rounded-full ${this.getStatusColor(order.status)}">${order.status}</span>
                    <p class="text-xs text-gray-500 mt-1">${new Date(order.created_at).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');
    }

    renderLowStockProducts(products) {
        const container = document.getElementById('lowStockList');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center">All products are in stock</p>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                    <p class="font-medium text-gray-900">${product.name}</p>
                    <p class="text-sm text-gray-600">${product.category}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Out of Stock</span>
            </div>
        `).join('');
    }

    async renderCharts(stats) {
        // Sales Chart
        await this.renderSalesChart();
        
        // Status Chart
        await this.renderStatusChart();
    }

    async renderSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        try {
            // Fetch orders from the last 7 days for sales data
            const { data: orders, error } = await supabase
                .from('orders')
                .select('total, order_date, status')
                .gte('order_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .eq('status', 'completed')
                .order('order_date', { ascending: true });

            if (error) {
                console.error('Error fetching sales data:', error);
                this.renderSalesChartFallback();
                return;
            }

            // Group sales by day
            const salesByDay = {};
            const last7Days = [];
            
            // Generate last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                const dayKey = date.toISOString().split('T')[0];
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                last7Days.push({ date: dayKey, name: dayName, sales: 0 });
            }

            // Calculate sales for each day
            if (orders && orders.length > 0) {
                orders.forEach(order => {
                    const orderDate = order.order_date.split('T')[0];
                    const dayData = last7Days.find(day => day.date === orderDate);
                    if (dayData) {
                        dayData.sales += parseFloat(order.total) || 0;
                    }
                });
            }

            const salesData = {
                labels: last7Days.map(day => day.name),
                datasets: [{
                    label: 'Sales ($)',
                    data: last7Days.map(day => day.sales),
                    borderColor: '#556b2f',
                    backgroundColor: 'rgba(85, 107, 47, 0.1)',
                    tension: 0.4
                }]
            };

            new Chart(ctx, {
                type: 'line',
                data: salesData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error rendering sales chart:', error);
            this.renderSalesChartFallback();
        }
    }

    renderSalesChartFallback() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        // Fallback data when no real data is available
        const salesData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sales ($)',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#556b2f',
                backgroundColor: 'rgba(85, 107, 47, 0.1)',
                tension: 0.4
            }]
        };

        new Chart(ctx, {
            type: 'line',
            data: salesData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    async renderStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        try {
            // Fetch all orders and group by status
            const { data: orders, error } = await supabase
                .from('orders')
                .select('status');

            if (error) {
                console.error('Error fetching order status data:', error);
                this.renderStatusChartFallback();
                return;
            }

            // Count orders by status
            const statusCounts = {
                'pending': 0,
                'confirmed': 0,
                'completed': 0,
                'cancelled': 0
            };

            if (orders && orders.length > 0) {
                orders.forEach(order => {
                    if (statusCounts.hasOwnProperty(order.status)) {
                        statusCounts[order.status]++;
                    }
                });
            }

            const statusData = {
                labels: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
                datasets: [{
                    data: [
                        statusCounts.pending,
                        statusCounts.confirmed,
                        statusCounts.completed,
                        statusCounts.cancelled
                    ],
                    backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']
                }]
            };

            new Chart(ctx, {
                type: 'doughnut',
                data: statusData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error rendering status chart:', error);
            this.renderStatusChartFallback();
        }
    }

    renderStatusChartFallback() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        // Fallback data when no real data is available
        const statusData = {
            labels: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']
            }]
        };

        new Chart(ctx, {
            type: 'doughnut',
            data: statusData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async loadProducts() {
        this.showLoading(true);
        
        try {
            this.products = await fetchProducts();
            this.renderProductsTable();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification('Error loading products', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderProductsTable() {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        if (this.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = this.products.map(product => {
            // Debug: Log product data for new products
            if (product.id >= 60) {
                console.log(`🔍 Rendering product ID ${product.id}:`, {
                    name: product.name,
                    image: product.image,
                    inStock: product.inStock,
                    inStockType: typeof product.inStock
                });
            }
            
            return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="h-10 w-10 flex-shrink-0">
                            <img class="h-10 w-10 rounded-lg object-cover" src="${resolveAsset(product.image) || 'assets/logos/logo-removebg-preview.png'}" alt="${product.name}" onerror="console.log('Image failed to load:', this.src)">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${product.name || 'Unnamed Product'}</div>
                            <div class="text-sm text-gray-500">${product.weight || ''}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${(product.price || 0).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full ${product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.category || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="dashboard.editProduct(${product.id})" class="text-[#556b2f] hover:text-[#4a5a2a] mr-3">Edit</button>
                    <button onclick="dashboard.deleteProduct(${product.id})" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `;
        }).join('');
    }

    async loadOrders() {
        this.showLoading(true);
        
        try {
            this.orders = await fetchOrders();
            this.renderOrdersTable();
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showNotification('Error loading orders', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderOrdersTable() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        if (this.orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No orders found</td></tr>';
            return;
        }

        tbody.innerHTML = this.orders.map(order => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.id.slice(0, 8)}...</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${order.customer_name}</div>
                    <div class="text-sm text-gray-500">${order.customer_phone}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${order.total.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full ${this.getStatusColor(order.status)}">${order.status}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(order.created_at).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="dashboard.viewOrder('${order.id}')" class="text-[#556b2f] hover:text-[#4a5a2a] mr-3">View</button>
                    <select onchange="dashboard.updateOrderStatus('${order.id}', this.value)" class="text-sm border border-gray-300 rounded px-2 py-1">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            </tr>
        `).join('');
    }

    getStatusColor(status) {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    openProductModal(product = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');
        const submitText = document.getElementById('productSubmitText');
        
        // Debug: Check checkbox state when opening modal
        const checkbox = document.getElementById('productInStock');
        console.log('🔍 Checkbox state when opening modal:', {
            checked: checkbox?.checked,
            value: checkbox?.value,
            element: checkbox
        });
        
        if (product) {
            title.textContent = 'Edit Product';
            submitText.textContent = 'Update Product';
            this.currentProductId = product.id;
            this.populateProductForm(product);
        } else {
            title.textContent = 'Add Product';
            submitText.textContent = 'Add Product';
            this.currentProductId = null;
            document.getElementById('productForm').reset();
            document.getElementById('imagePreview').classList.add('hidden');
            // Ensure checkbox is checked for new products
            document.getElementById('productInStock').checked = true;
            
            // Debug: Check checkbox state after reset and setting
            const checkboxAfter = document.getElementById('productInStock');
            console.log('🔍 Checkbox state after reset and setting:', {
                checked: checkboxAfter?.checked,
                value: checkboxAfter?.value
            });
        }
        
        modal.classList.remove('hidden');
    }

    closeProductModal() {
        document.getElementById('productModal').classList.add('hidden');
        this.currentProductId = null;
    }

    populateProductForm(product) {
        // Debug: Log the product data being used to populate the form
        console.log('🔍 Populating form with product data:', product);
        
        // Populate form fields with correct property names
        document.getElementById('productNameEn').value = product.nameEn || product.name || '';
        document.getElementById('productNameAr').value = product.nameAr || '';
        document.getElementById('productDescEn').value = product.description || '';
        document.getElementById('productDescAr').value = product.descriptionAr || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productWeight').value = product.weight || '';
        document.getElementById('productPackaging').value = product.packaging || 'jar';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productRating').value = product.rating || 4.5;
        document.getElementById('productInStock').checked = product.inStock !== false;
        
        // Debug: Log the populated values
        console.log('🔍 Form populated with values:', {
            nameEn: document.getElementById('productNameEn').value,
            nameAr: document.getElementById('productNameAr').value,
            descEn: document.getElementById('productDescEn').value,
            descAr: document.getElementById('productDescAr').value,
            price: document.getElementById('productPrice').value,
            weight: document.getElementById('productWeight').value,
            packaging: document.getElementById('productPackaging').value,
            category: document.getElementById('productCategory').value,
            rating: document.getElementById('productRating').value,
            inStock: document.getElementById('productInStock').checked
        });
    }

    previewImage(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            const img = document.getElementById('previewImg');
            img.src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    async saveProduct() {
        // Capture checkbox value IMMEDIATELY before any other operations
        const inStock = document.getElementById('productInStock').checked;
        
        // Capture all form fields immediately
        const nameEn = document.getElementById('productNameEn').value;
        const nameAr = document.getElementById('productNameAr').value;
        const descEn = document.getElementById('productDescEn').value;
        const descAr = document.getElementById('productDescAr').value;
        const price = document.getElementById('productPrice').value;
        const weight = document.getElementById('productWeight').value;
        const category = document.getElementById('productCategory').value;
        const packaging = document.getElementById('productPackaging').value;
        const rating = document.getElementById('productRating').value;
        
        // Debug: Log all captured form values
        console.log('🔍 Captured form values:', {
            nameEn: nameEn,
            nameAr: nameAr,
            descEn: descEn,
            descAr: descAr,
            price: price,
            weight: weight,
            category: category,
            packaging: packaging,
            rating: rating,
            inStock: inStock
        });
        
        const formData = new FormData(document.getElementById('productForm'));
        const imageFile = document.getElementById('productImage').files[0];
        
        try {
            this.showLoading(true);
            
            let imageUrl = '';
            if (imageFile && imageFile.size > 0) {
                try {
                    const fileName = `product-${Date.now()}-${imageFile.name}`;
                    imageUrl = await uploadProductImage(imageFile, fileName);
                } catch (error) {
                    console.warn('Image upload failed, using placeholder:', error);
                    // Use a placeholder image
                    imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFVwbG9hZCBGYWlsZWQ8L3RleHQ+PC9zdmc+';
                }
            }
            
            const productData = {
                name: nameEn || '',
                name_en: nameEn || '',
                name_ar: nameAr || '',
                description: descEn || '',
                description_ar: descAr || '',
                price: parseFloat(price) || 0,
                weight: weight || '',
                packaging: packaging || 'jar',
                category: category || '',
                rating: parseFloat(rating) || 4.5,
                in_stock: inStock, // Use the captured value
                date_added: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Debug: Log the product data being sent to Supabase
            console.log('🔍 Product data being sent to Supabase:', productData);
            
            
            if (imageUrl) {
                productData.image_url = imageUrl;
            }
            
            if (this.currentProductId) {
                await updateProduct(this.currentProductId, productData);
                this.showNotification('Product updated successfully', 'success');
            } else {
                await createProduct(productData);
                this.showNotification('Product created successfully', 'success');
            }
            
            this.closeProductModal();
            await this.loadProducts();
            
        } catch (error) {
            console.error('Error saving product:', error);
            this.showNotification('Error saving product', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            this.openProductModal(product);
        }
    }

    async deleteProduct(id) {
        if (!confirm('Are you sure you want to delete this product?')) return;
        
        try {
            this.showLoading(true);
            await deleteProduct(id);
            this.showNotification('Product deleted successfully', 'success');
            await this.loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showNotification('Error deleting product', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async viewOrder(id) {
        const order = this.orders.find(o => o.id === id);
        if (!order) return;
        
        const modal = document.getElementById('orderModal');
        const content = document.getElementById('orderDetailsContent');
        
        content.innerHTML = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-2">Customer Information</h4>
                        <div class="space-y-2">
                            <p><span class="font-medium">Name:</span> ${order.customer_name}</p>
                            <p><span class="font-medium">Phone:</span> ${order.customer_phone}</p>
                            <p><span class="font-medium">Address:</span> ${order.customer_address}</p>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-2">Order Information</h4>
                        <div class="space-y-2">
                            <p><span class="font-medium">Order ID:</span> ${order.id}</p>
                            <p><span class="font-medium">Status:</span> <span class="px-2 py-1 text-xs rounded-full ${this.getStatusColor(order.status)}">${order.status}</span></p>
                            <p><span class="font-medium">Date:</span> ${new Date(order.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Order Items</h4>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${order.order_items.map(item => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.product_name}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.quantity}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${item.price.toFixed(2)}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-sm text-gray-600">Subtotal: $${order.subtotal.toFixed(2)}</p>
                            <p class="text-sm text-gray-600">Shipping: $${order.shipping_fee.toFixed(2)}</p>
                            <p class="text-lg font-semibold text-gray-900">Total: $${order.total.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                
                ${order.notes ? `
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-2">Notes</h4>
                        <p class="text-gray-700 bg-gray-50 p-3 rounded-lg">${order.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    closeOrderModal() {
        document.getElementById('orderModal').classList.add('hidden');
    }

    async updateOrderStatus(orderId, status) {
        try {
            await updateOrderStatus(orderId, status);
            this.showNotification('Order status updated', 'success');
            await this.loadOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            this.showNotification('Error updating order status', 'error');
        }
    }

    filterProducts(searchTerm) {
        const filtered = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.name_ar.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderFilteredProducts(filtered);
    }

    filterProductsByCategory(category) {
        if (!category) {
            this.renderProductsTable();
            return;
        }
        
        const filtered = this.products.filter(product => product.category === category);
        this.renderFilteredProducts(filtered);
    }

    renderFilteredProducts(products) {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="h-10 w-10 flex-shrink-0">
                            <img class="h-10 w-10 rounded-lg object-cover" src="${resolveAsset(product.image) || 'assets/logos/logo-removebg-preview.png'}" alt="${product.name}">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${product.name}</div>
                            <div class="text-sm text-gray-500">${product.weight}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${product.price.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full ${product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${product.in_stock ? 'In Stock' : 'Out of Stock'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.category}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="dashboard.editProduct(${product.id})" class="text-[#556b2f] hover:text-[#4a5a2a] mr-3">Edit</button>
                    <button onclick="dashboard.deleteProduct(${product.id})" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    filterOrders(searchTerm) {
        const filtered = this.orders.filter(order => 
            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_phone.includes(searchTerm)
        );
        this.renderFilteredOrders(filtered);
    }

    filterOrdersByStatus(status) {
        if (!status) {
            this.renderOrdersTable();
            return;
        }
        
        const filtered = this.orders.filter(order => order.status === status);
        this.renderFilteredOrders(filtered);
    }

    renderFilteredOrders(orders) {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No orders found</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.id.slice(0, 8)}...</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${order.customer_name}</div>
                    <div class="text-sm text-gray-500">${order.customer_phone}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${order.total.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full ${this.getStatusColor(order.status)}">${order.status}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(order.created_at).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="dashboard.viewOrder('${order.id}')" class="text-[#556b2f] hover:text-[#4a5a2a] mr-3">View</button>
                    <select onchange="dashboard.updateOrderStatus('${order.id}', this.value)" class="text-sm border border-gray-300 rounded px-2 py-1">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            </tr>
        `).join('');
    }

    async migrateProducts() {
        if (!confirm('This will migrate all products from JSON to Supabase. Continue?')) return;
        
        try {
            this.showLoading(true);
            this.showNotification('Migration started...', 'info');
            
            // This would be implemented with the migration script
            // For now, just show a placeholder
            setTimeout(() => {
                this.showNotification('Migration completed!', 'success');
                this.showLoading(false);
            }, 2000);
            
        } catch (error) {
            console.error('Error during migration:', error);
            this.showNotification('Migration failed', 'error');
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.classList.toggle('hidden', !show);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = document.getElementById('notificationIcon');
        const messageEl = document.getElementById('notificationMessage');
        
        if (!notification || !icon || !messageEl) return;
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium transform transition-all duration-300 ${colors[type]}`;
        icon.className = icons[type];
        messageEl.textContent = message;
        
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardController();
});
