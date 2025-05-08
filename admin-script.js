// ==========================================
// Firebase Configuration
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAfazLVw4dXG1RcJlPlBbI8lKGw3GEndG8",
    authDomain: "absensi-apk.firebaseapp.com",
    databaseURL: "https://absensi-apk-default-rtdb.firebaseio.com",
    projectId: "absensi-apk",
    storageBucket: "absensi-apk.firebaseestorage.app",
    messagingSenderId: "869097014745",
    appId: "1:869097014745:web:b14d4302fae7f29e5885c8",
    measurementId: "G-91PKC52TMJ"
};

// ==========================================
// Global Variables
// ==========================================
let firebaseApp = null;
let database = null;
let allUsers = [];
let allAttendance = [];
let attendanceChart = null;

// Default admin credentials
const DEFAULT_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

// ==========================================
// Initialize App
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    initializeFirebase();
    
    // Check login state
    checkLoginState();
    
    // Initialize login form
    initLoginForm();
    
    // Initialize logout button
    document.getElementById('logout-button').addEventListener('click', logout);
    
    // Initialize sidebar navigation
    initSidebar();
    
    // Initialize tabs in Reports section
    initReportTabs();
    
    // Initialize modals
    initModals();
    
    // Initialize search functionality
    initSearch();
    
    // Initialize settings form
    initSettingsForm();
    
    // Initialize admin settings form
    initAdminSettingsForm();
    
    // Display Firebase config
    document.getElementById('firebase-config').textContent = JSON.stringify(firebaseConfig, null, 2);
    
    // Set default date values for report forms
    setDefaultDates();
});

// ==========================================
// Login/Authentication Functions
// ==========================================
function checkLoginState() {
    // Check if user is logged in (from localStorage)
    const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
    
    if (isLoggedIn) {
        showAdminPanel();
    } else {
        showLoginForm();
    }
}

function initLoginForm() {
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Get stored credentials or use default
        const storedCredentials = JSON.parse(localStorage.getItem('admin_credentials')) || DEFAULT_CREDENTIALS;
        
        if (username === storedCredentials.username && password === storedCredentials.password) {
            // Login successful
            localStorage.setItem('admin_logged_in', 'true');
            showAdminPanel();
        } else {
            // Login failed
            const errorMessage = document.getElementById('login-error');
            errorMessage.textContent = 'Username atau password salah!';
            errorMessage.style.display = 'block';
        }
    });
}

function showLoginForm() {
    document.getElementById('login-section').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    
    // Initialize scanner if we're on the scan tab
    if (document.getElementById('scan') && document.getElementById('scan').classList.contains('active')) {
        initScanner();
    }
}

function logout() {
    localStorage.removeItem('admin_logged_in');
    showLoginForm();
}

function initAdminSettingsForm() {
    document.getElementById('admin-settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newUsername = document.getElementById('new-username').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (newPassword !== confirmPassword) {
            alert('Password dan konfirmasi password tidak cocok!');
            return;
        }
        
        if (newUsername && newPassword) {
            // Save new credentials
            const newCredentials = {
                username: newUsername,
                password: newPassword
            };
            
            localStorage.setItem('admin_credentials', JSON.stringify(newCredentials));
            alert('Credentials admin berhasil diubah!');
            
            // Clear form
            this.reset();
        } else {
            alert('Username dan password tidak boleh kosong!');
        }
    });
}

// ==========================================
// Initialize Firebase
// ==========================================
function initializeFirebase() {
    try {
        // Initialize Firebase
        firebaseApp = firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        
        // Fetch data
        fetchAllData();
        
        // Setup real-time listeners
        setupRealtimeListeners();
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        alert('Error connecting to Firebase: ' + error.message);
    }
}

// ==========================================
// Sidebar Navigation
// ==========================================
function initSidebar() {
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    const contentSections = document.querySelectorAll('.content-section');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to current link
            this.classList.add('active');
            
            // Hide all content sections
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Show selected content section
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// ==========================================
// Initialize Tabs in Reports
// ==========================================
function initReportTabs() {
    const reportTabs = document.querySelectorAll('.tabs .tab');
    const reportContents = document.querySelectorAll('.tab-content');
    
    reportTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            reportTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to current tab
            this.classList.add('active');
            
            // Hide all tab contents
            reportContents.forEach(content => content.classList.remove('active'));
            
            // Show selected tab content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Initialize report forms
    initReportForms();
}

// ==========================================
// Initialize Modals
// ==========================================
function initModals() {
    // Close modals when clicking close button or outside modal
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.modal-close, #close-modal, #close-attendance-modal');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modals.forEach(modal => modal.classList.remove('active'));
        });
    });
    
    // Close modal when clicking outside
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                modals.forEach(m => m.classList.remove('active'));
            }
        });
    });
    
    // Download barcode button
    document.getElementById('download-barcode').addEventListener('click', downloadBarcode);
    
    // Show user barcode from attendance detail
    document.getElementById('show-user-barcode').addEventListener('click', function() {
        const userId = document.getElementById('attendance-user-id').textContent;
        const user = allUsers.find(u => u.id === userId);
        
        if (user) {
            showBarcodeModal(user);
            // Hide attendance modal
            document.getElementById('attendance-detail-modal').classList.remove('active');
        } else {
            alert('User not found!');
        }
    });
}

// ==========================================
// Initialize Search
// ==========================================
function initSearch() {
    // Search functionality for users
    document.getElementById('user-search-btn').addEventListener('click', function() {
        const searchTerm = document.getElementById('user-search').value.toLowerCase();
        
        if (!searchTerm) {
            updateUsersTable(allUsers);
            return;
        }
        
        const filteredUsers = allUsers.filter(user => {
            return (
                user.id.toLowerCase().includes(searchTerm) ||
                user.nama.toLowerCase().includes(searchTerm) ||
                user.jurusan.toLowerCase().includes(searchTerm) ||
                user.kampus.toLowerCase().includes(searchTerm)
            );
        });
        
        updateUsersTable(filteredUsers);
    });
    
    // Search functionality for attendance
    document.getElementById('attendance-search-btn').addEventListener('click', function() {
        const searchTerm = document.getElementById('attendance-search').value.toLowerCase();
        
        if (!searchTerm) {
            updateAttendanceTable(allAttendance);
            return;
        }
        
        const filteredAttendance = allAttendance.filter(record => {
            return (
                record.userId.toLowerCase().includes(searchTerm) ||
                record.nama.toLowerCase().includes(searchTerm) ||
                record.jurusan.toLowerCase().includes(searchTerm) ||
                record.kampus.toLowerCase().includes(searchTerm)
            );
        });
        
        updateAttendanceTable(filteredAttendance);
    });
}

// ==========================================
// Initialize Settings Form
// ==========================================
function initSettingsForm() {
    document.getElementById('settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const appName = document.getElementById('app-name').value;
        const adminEmail = document.getElementById('admin-email').value;
        const themeColor = document.getElementById('theme-color').value;
        
        // Save settings (in a real app, you'd save to Firebase or localStorage)
        const settings = {
            appName,
            adminEmail,
            themeColor
        };
        
        localStorage.setItem('app_settings', JSON.stringify(settings));
        alert('Pengaturan berhasil disimpan!');
    });
    
    // Load saved settings if available
    const savedSettings = JSON.parse(localStorage.getItem('app_settings'));
    if (savedSettings) {
        document.getElementById('app-name').value = savedSettings.appName || 'Sistem Absensi Barcode';
        document.getElementById('admin-email').value = savedSettings.adminEmail || 'admin@example.com';
        document.getElementById('theme-color').value = savedSettings.themeColor || 'green';
    }
}

// ==========================================
// Set Default Dates for Report Forms
// ==========================================
function setDefaultDates() {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Set default date for daily report
    document.getElementById('daily-date').value = todayString;
    
    // Set default dates for weekly report
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const oneWeekAgoString = oneWeekAgo.toISOString().split('T')[0];
    
    document.getElementById('weekly-start-date').value = oneWeekAgoString;
    document.getElementById('weekly-end-date').value = todayString;
    
    // Set default date for monthly report
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('monthly-month').value = currentMonth;
    
    // Set default dates for custom report
    document.getElementById('custom-start-date').value = oneWeekAgoString;
    document.getElementById('custom-end-date').value = todayString;
}

// ==========================================
// Fetch All Data
// ==========================================
function fetchAllData() {
    fetchUsers();
    fetchAttendance();
}

function fetchUsers() {
    database.ref('users').once('value')
        .then(snapshot => {
            const data = snapshot.val() || {};
            
            // Convert to array
            allUsers = Object.values(data);
            
            // Sort by createdAt (newest first)
            allUsers.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            // Update dashboard stats
            updateDashboardStats();
            
            // Update users table
            updateUsersTable(allUsers);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
}

function fetchAttendance() {
    database.ref('attendance').once('value')
        .then(snapshot => {
            const data = snapshot.val() || {};
            
            // Convert to array
            allAttendance = Object.values(data);
            
            // Sort by timestamp (newest first)
            allAttendance.sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            
            // Update dashboard stats
            updateDashboardStats();
            
            // Update attendance table
            updateAttendanceTable(allAttendance);
            
            // Update recent activities
            updateRecentActivities();
            
            // Update attendance chart
            updateAttendanceChart();
        })
        .catch(error => {
            console.error('Error fetching attendance:', error);
        });
}

// ==========================================
// Setup Realtime Listeners
// ==========================================
function setupRealtimeListeners() {
    // Listen for new users
    database.ref('users').on('child_added', () => {
        fetchUsers();
    });
    
    // Listen for updated users
    database.ref('users').on('child_changed', () => {
        fetchUsers();
    });
    
    // Listen for deleted users
    database.ref('users').on('child_removed', () => {
        fetchUsers();
    });
    
    // Listen for new attendance
    database.ref('attendance').on('child_added', () => {
        fetchAttendance();
    });
    
    // Listen for updated attendance
    database.ref('attendance').on('child_changed', () => {
        fetchAttendance();
    });
    
    // Listen for deleted attendance
    database.ref('attendance').on('child_removed', () => {
        fetchAttendance();
    });
}

// ==========================================
// Update Dashboard Stats
// ==========================================
function updateDashboardStats() {
    // Update total users
    document.getElementById('total-users').textContent = allUsers.length;
    
    // Update total attendance
    document.getElementById('total-attendance').textContent = allAttendance.length;
    
    // Update today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = allAttendance.filter(a => {
        return a.timestamp.split('T')[0] === today;
    });
    document.getElementById('today-attendance').textContent = todayAttendance.length;
    
    // Update active users (users who have attendance in the last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const activeUserIds = new Set();
    allAttendance.forEach(a => {
        if (new Date(a.timestamp) >= lastWeek) {
            activeUserIds.add(a.userId);
        }
    });
    
    document.getElementById('active-users').textContent = activeUserIds.size;
}

// ==========================================
// Update Attendance Chart
// ==========================================
function updateAttendanceChart() {
    // Get attendance for the last 7 days
    const dates = [];
    const counts = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        dates.push(formatDate(dateString, { day: '2-digit', month: 'short' }));
        
        const count = allAttendance.filter(a => {
            return a.timestamp.split('T')[0] === dateString;
        }).length;
        
        counts.push(count);
    }
    
    // Destroy existing chart if it exists
    if (attendanceChart) {
        attendanceChart.destroy();
    }
    
    // Create chart
    const ctx = document.getElementById('attendance-chart').getContext('2d');
    attendanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Jumlah Absensi',
                data: counts,
                backgroundColor: '#43a047',
                borderColor: '#1b5e20',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// ==========================================
// Update Recent Activities
// ==========================================
function updateRecentActivities() {
    const recentActivities = allAttendance.slice(0, 5); // Get 5 most recent attendance
    
    const tableBody = document.querySelector('#recent-activities tbody');
    tableBody.innerHTML = '';
    
    if (recentActivities.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">Tidak ada aktivitas terbaru.</td></tr>';
        return;
    }
    
    recentActivities.forEach(activity => {
        const row = document.createElement('tr');
        
        const idCell = document.createElement('td');
        idCell.textContent = activity.userId;
        row.appendChild(idCell);
        
        const nameCell = document.createElement('td');
        nameCell.textContent = activity.nama;
        row.appendChild(nameCell);
        
        const majorCell = document.createElement('td');
        majorCell.textContent = activity.jurusan;
        row.appendChild(majorCell);
        
        const campusCell = document.createElement('td');
        campusCell.textContent = activity.kampus;
        row.appendChild(campusCell);
        
        const timeCell = document.createElement('td');
        timeCell.textContent = formatDateTime(activity.timestamp);
        row.appendChild(timeCell);
        
        const typeCell = document.createElement('td');
        typeCell.innerHTML = '<span class="badge badge-success">Absensi</span>';
        row.appendChild(typeCell);
        
        tableBody.appendChild(row);
    });
}

// ==========================================
// Update Users Table
// ==========================================
function updateUsersTable(users, page = 1) {
    const tableBody = document.querySelector('#users-table tbody');
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">Tidak ada data pengguna.</td></tr>';
        document.getElementById('users-pagination').innerHTML = '';
        return;
    }
    
    // Pagination
    const itemsPerPage = 10;
    const totalPages = Math.ceil(users.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, users.length);
    const currentPageData = users.slice(startIndex, endIndex);
    
    // Populate table
    currentPageData.forEach(user => {
        const row = document.createElement('tr');
        
        const idCell = document.createElement('td');
        idCell.textContent = user.id;
        row.appendChild(idCell);
        
        const nameCell = document.createElement('td');
        nameCell.textContent = user.nama;
        row.appendChild(nameCell);
        
        const majorCell = document.createElement('td');
        majorCell.textContent = user.jurusan;
        row.appendChild(majorCell);
        
        const campusCell = document.createElement('td');
        campusCell.textContent = user.kampus;
        row.appendChild(campusCell);
        
        const timeCell = document.createElement('td');
        timeCell.textContent = formatDateTime(user.createdAt);
        row.appendChild(timeCell);
        
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <div class="action-buttons">
                <button class="btn btn-sm view-barcode" data-id="${user.id}">Lihat Barcode</button>
            </div>
        `;
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners for view barcode buttons
    document.querySelectorAll('.view-barcode').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            const user = allUsers.find(u => u.id === userId);
            
            if (user) {
                showBarcodeModal(user);
            }
        });
    });
    
    // Update pagination
    updatePagination('users-pagination', page, totalPages, (newPage) => {
        updateUsersTable(users, newPage);
    });
}

// ==========================================
// Update Attendance Table
// ==========================================
function updateAttendanceTable(attendance, page = 1) {
    const tableBody = document.querySelector('#attendance-table tbody');
    tableBody.innerHTML = '';
    
    if (attendance.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">Tidak ada data absensi.</td></tr>';
        document.getElementById('attendance-pagination').innerHTML = '';
        return;
    }
    
    // Pagination
    const itemsPerPage = 10;
    const totalPages = Math.ceil(attendance.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, attendance.length);
    const currentPageData = attendance.slice(startIndex, endIndex);
    
    // Populate table
    currentPageData.forEach(record => {
        const row = document.createElement('tr');
        
        const idCell = document.createElement('td');
        idCell.textContent = record.userId;
        row.appendChild(idCell);
        
        const nameCell = document.createElement('td');
        nameCell.textContent = record.nama;
        row.appendChild(nameCell);
        
        const majorCell = document.createElement('td');
        majorCell.textContent = record.jurusan;
        row.appendChild(majorCell);
        
        const campusCell = document.createElement('td');
        campusCell.textContent = record.kampus;
        row.appendChild(campusCell);
        
        const timeCell = document.createElement('td');
        timeCell.textContent = formatDateTime(record.timestamp);
        row.appendChild(timeCell);
        
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <div class="action-buttons">
                <button class="btn btn-sm view-attendance" data-id="${record.id}">Lihat Detail</button>
            </div>
        `;
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners for view attendance buttons
    document.querySelectorAll('.view-attendance').forEach(button => {
        button.addEventListener('click', function() {
            const attendanceId = this.getAttribute('data-id');
            const record = allAttendance.find(a => a.id === attendanceId);
            
            if (record) {
                showAttendanceDetailModal(record);
            }
        });
    });
    
    // Update pagination
    updatePagination('attendance-pagination', page, totalPages, (newPage) => {
        updateAttendanceTable(attendance, newPage);
    });
}

// ==========================================
// Update Pagination
// ==========================================
function updatePagination(elementId, currentPage, totalPages, callback) {
    const paginationElement = document.getElementById(elementId);
    paginationElement.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            callback(currentPage - 1);
        }
    });
    paginationElement.appendChild(prevButton);
    
    // Page buttons
    const maxButtons = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage);
        pageButton.addEventListener('click', () => {
            callback(i);
        });
        paginationElement.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            callback(currentPage + 1);
        }
    });
    paginationElement.appendChild(nextButton);
}

// ==========================================
// Show Barcode Modal
// ==========================================
function showBarcodeModal(user) {
    // Set user details
    document.getElementById('user-id').textContent = user.id;
    document.getElementById('user-name').textContent = user.nama;
    document.getElementById('user-jurusan').textContent = user.jurusan;
    document.getElementById('user-kampus').textContent = user.kampus;
    document.getElementById('user-created').textContent = formatDateTime(user.createdAt);
    
    // Generate barcode
    generateBarcode(user);
    
    // Show modal
    document.getElementById('barcode-modal').classList.add('active');
}

// ==========================================
// Show Attendance Detail Modal
// ==========================================
function showAttendanceDetailModal(record) {
    // Set attendance details
    document.getElementById('attendance-id').textContent = record.id;
    document.getElementById('attendance-user-id').textContent = record.userId;
    document.getElementById('attendance-name').textContent = record.nama;
    document.getElementById('attendance-jurusan').textContent = record.jurusan;
    document.getElementById('attendance-kampus').textContent = record.kampus;
    document.getElementById('attendance-time').textContent = formatDateTime(record.timestamp);
    
    // Show modal
    document.getElementById('attendance-detail-modal').classList.add('active');
}

// ==========================================
// Generate Barcode
// ==========================================
function generateBarcode(user) {
    const barcodeContainer = document.getElementById('user-barcode');
    barcodeContainer.innerHTML = '';
    
    const qr = qrcode(0, 'L');
    qr.addData(JSON.stringify(user));
    qr.make();
    
    const qrImage = qr.createImgTag(5);
    barcodeContainer.innerHTML = qrImage;
}

// ==========================================
// Download Barcode
// ==========================================
function downloadBarcode() {
    const qrImage = document.querySelector('#user-barcode img');
    if (!qrImage) return;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = qrImage.width;
    canvas.height = qrImage.height;
    
    const image = new Image();
    image.onload = function() {
        context.drawImage(image, 0, 0);
        
        const link = document.createElement('a');
        link.download = 'barcode_' + document.getElementById('user-id').textContent + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
    image.src = qrImage.src;
}

// ==========================================
// Initialize Report Forms
// ==========================================
function initReportForms() {
    // Daily report form
    document.getElementById('daily-report-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const date = document.getElementById('daily-date').value;
        generateReport('daily', { date });
    });
    
    // Weekly report form
    document.getElementById('weekly-report-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const startDate = document.getElementById('weekly-start-date').value;
        const endDate = document.getElementById('weekly-end-date').value;
        generateReport('weekly', { startDate, endDate });
    });
    
    // Monthly report form
    document.getElementById('monthly-report-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const month = document.getElementById('monthly-month').value;
        generateReport('monthly', { month });
    });
    
    // Custom report form
    document.getElementById('custom-report-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const startDate = document.getElementById('custom-start-date').value;
        const endDate = document.getElementById('custom-end-date').value;
        const jurusan = document.getElementById('custom-jurusan').value;
        const kampus = document.getElementById('custom-kampus').value;
        generateReport('custom', { startDate, endDate, jurusan, kampus });
    });
}

// ==========================================
// Generate Report
// ==========================================
function generateReport(type, params) {
    let filteredAttendance = [...allAttendance];
    let title = '';
    let subtitle = '';
    
    switch (type) {
        case 'daily':
            title = 'Laporan Harian';
            subtitle = `Tanggal: ${formatDate(params.date)}`;
            
            filteredAttendance = filteredAttendance.filter(a => {
                return a.timestamp.split('T')[0] === params.date;
            });
            break;
            
        case 'weekly':
            title = 'Laporan Mingguan';
            subtitle = `Periode: ${formatDate(params.startDate)} - ${formatDate(params.endDate)}`;
            
            filteredAttendance = filteredAttendance.filter(a => {
                const date = a.timestamp.split('T')[0];
                return date >= params.startDate && date <= params.endDate;
            });
            break;
            
        case 'monthly':
            const [year, month] = params.month.split('-');
            title = 'Laporan Bulanan';
            subtitle = `Bulan: ${getMonthName(parseInt(month))} ${year}`;
            
            filteredAttendance = filteredAttendance.filter(a => {
                const date = new Date(a.timestamp);
                return date.getFullYear() === parseInt(year) && date.getMonth() === parseInt(month) - 1;
            });
            break;
            
        case 'custom':
            title = 'Laporan Kustom';
            subtitle = `Periode: ${formatDate(params.startDate)} - ${formatDate(params.endDate)}`;
            
            if (params.jurusan) {
                subtitle += ` | Jurusan: ${params.jurusan}`;
            }
            
            if (params.kampus) {
                subtitle += ` | Kampus: ${params.kampus}`;
            }
            
            filteredAttendance = filteredAttendance.filter(a => {
                const date = a.timestamp.split('T')[0];
                let match = date >= params.startDate && date <= params.endDate;
                
                if (match && params.jurusan) {
                    match = a.jurusan.toLowerCase().includes(params.jurusan.toLowerCase());
                }
                
                if (match && params.kampus) {
                    match = a.kampus.toLowerCase().includes(params.kampus.toLowerCase());
                }
                
                return match;
            });
            break;
    }
    
    // Group by jurusan
    const jurusanGroups = {};
    filteredAttendance.forEach(a => {
        if (!jurusanGroups[a.jurusan]) {
            jurusanGroups[a.jurusan] = [];
        }
        
        jurusanGroups[a.jurusan].push(a);
    });
    
    // Group by kampus
    const kampusGroups = {};
    filteredAttendance.forEach(a => {
        if (!kampusGroups[a.kampus]) {
            kampusGroups[a.kampus] = [];
        }
        
        kampusGroups[a.kampus].push(a);
    });
    
    // Create report HTML
    let reportHTML = `
        <h2>${title}</h2>
        <p>${subtitle}</p>
        <p>Total Absensi: ${filteredAttendance.length}</p>
        
        <h3>Absensi per Jurusan</h3>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Jurusan</th>
                        <th>Jumlah Absensi</th>
                        <th>Persentase</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (Object.keys(jurusanGroups).length === 0) {
        reportHTML += '<tr><td colspan="3">Tidak ada data.</td></tr>';
    } else {
        Object.keys(jurusanGroups).forEach(jurusan => {
            const count = jurusanGroups[jurusan].length;
            const percentage = ((count / filteredAttendance.length) * 100).toFixed(2);
            
            reportHTML += `
                <tr>
                    <td>${jurusan}</td>
                    <td>${count}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        });
    }
    
    reportHTML += `
                </tbody>
            </table>
        </div>
        
        <h3>Absensi per Kampus</h3>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Kampus</th>
                        <th>Jumlah Absensi</th>
                        <th>Persentase</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (Object.keys(kampusGroups).length === 0) {
        reportHTML += '<tr><td colspan="3">Tidak ada data.</td></tr>';
    } else {
        Object.keys(kampusGroups).forEach(kampus => {
            const count = kampusGroups[kampus].length;
            const percentage = ((count / filteredAttendance.length) * 100).toFixed(2);
            
            reportHTML += `
                <tr>
                    <td>${kampus}</td>
                    <td>${count}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        });
    }
    
    reportHTML += `
                </tbody>
            </table>
        </div>
        
        <h3>Detail Absensi</h3>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nama</th>
                        <th>Jurusan</th>
                        <th>Kampus</th>
                        <th>Waktu Absensi</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (filteredAttendance.length === 0) {
        reportHTML += '<tr><td colspan="5">Tidak ada data.</td></tr>';
    } else {
        filteredAttendance.forEach(a => {
            reportHTML += `
                <tr>
                    <td>${a.userId}</td>
                    <td>${a.nama}</td>
                    <td>${a.jurusan}</td>
                    <td>${a.kampus}</td>
                    <td>${formatDateTime(a.timestamp)}</td>
                </tr>
            `;
        });
    }
    
    reportHTML += `
                </tbody>
            </table>
        </div>
        
        <button class="btn" id="export-report" style="margin-top: 1rem;">Export to PDF</button>
    `;
    
    // Update report result
    document.getElementById('report-result').innerHTML = reportHTML;
    
    // Add event listener for export button
    document.getElementById('export-report').addEventListener('click', function() {
        alert('Fitur export to PDF akan diimplementasikan nanti.');
    });
}

// ==========================================
// Utility Functions
// ==========================================
function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatDate(dateString, options = {}) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...options
    });
}

function getMonthName(month) {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    return months[month - 1];
}