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
let currentUser = null;
let firebaseApp = null;
let database = null;
let qrScanner = null;
let scannerOptions = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
};

// ==========================================
// Initialize App
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    initializeMobileMenu();
    
    // Initialize Firebase
    initializeFirebase(firebaseConfig);
    
    // Initialize tabs
    initializeTabs();
    
    // Initialize subtabs
    initializeSubtabs();
    
    // Set up screen orientation change event
    window.addEventListener('resize', handleScreenResize);
    
    // Handle device orientation change
    if (window.screen && window.screen.orientation) {
        window.screen.orientation.addEventListener('change', handleOrientationChange);
    } else if (window.orientation !== undefined) {
        window.addEventListener('orientationchange', handleOrientationChange);
    }
    
    // Initial screen size check
    adjustForScreenSize();
});

// ==========================================
// Responsive Helpers
// ==========================================
function initializeMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('menu-active');
            this.textContent = mainNav.classList.contains('menu-active') ? '✕' : '☰';
        });
    }
    
    // Close menu when clicking anywhere else
    document.addEventListener('click', function(event) {
        if (mainNav.classList.contains('menu-active') && !mainNav.contains(event.target) && event.target !== menuToggle) {
            mainNav.classList.remove('menu-active');
            menuToggle.textContent = '☰';
        }
    });
    
    // Close menu when clicking on a nav link
    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                mainNav.classList.remove('menu-active');
                menuToggle.textContent = '☰';
            }
        });
    });
}

function handleScreenResize() {
    // Reset mobile menu on resize
    const mainNav = document.getElementById('mainNav');
    const menuToggle = document.getElementById('menuToggle');
    
    if (window.innerWidth > 768 && mainNav.classList.contains('menu-active')) {
        mainNav.classList.remove('menu-active');
        if (menuToggle) menuToggle.textContent = '☰';
    }
    
    // Adjust scanner size
    if (qrScanner) {
        adjustScannerSize();
    }
    
    // Adjust for screen size
    adjustForScreenSize();
}

function handleOrientationChange() {
    // Give time for the orientation to complete
    setTimeout(() => {
        adjustScannerSize();
        adjustForScreenSize();
    }, 100);
}

function adjustForScreenSize() {
    // Adjust tab scrolling if needed
    const tabContainer = document.querySelector('.tabs');
    if (tabContainer) {
        if (tabContainer.scrollWidth > tabContainer.clientWidth) {
            tabContainer.style.paddingBottom = '5px'; // Add space for scrollbar
        } else {
            tabContainer.style.paddingBottom = '0';
        }
    }
    
    // Adjust table container if needed
    const tableContainers = document.querySelectorAll('.table-container');
    tableContainers.forEach(container => {
        const table = container.querySelector('table');
        if (table && table.offsetWidth > container.clientWidth) {
            container.style.boxShadow = '0 3px 5px rgba(0,0,0,0.1)';
            container.style.borderRadius = '4px';
        } else {
            container.style.boxShadow = 'none';
        }
    });
}

function adjustScannerSize() {
    if (!qrScanner) return;
    
    const reader = document.getElementById('reader');
    if (!reader) return;
    
    // Get container width
    const containerWidth = reader.parentElement.clientWidth - 32; // Account for padding
    
    // Set qrbox dimensions based on screen size
    if (window.innerWidth <= 480) {
        // Small mobile devices
        scannerOptions.qrbox = { width: Math.min(250, containerWidth - 20), height: Math.min(250, containerWidth - 20) };
    } else if (window.innerWidth <= 768) {
        // Tablets and larger mobile devices
        scannerOptions.qrbox = { width: Math.min(300, containerWidth - 40), height: Math.min(300, containerWidth - 40) };
    } else {
        // Desktop and larger screens
        scannerOptions.qrbox = { width: Math.min(350, containerWidth - 60), height: Math.min(350, containerWidth - 60) };
    }
    
    // Stop and restart scanner with new dimensions
    if (qrScanner._isScanning) {
        qrScanner.stop().then(() => {
            startScanner();
        }).catch(error => {
            console.error('Failed to restart scanner:', error);
        });
    }
}

// ==========================================
// Firebase Initialization
// ==========================================
function initializeFirebase(config) {
    try {
        // Initialize Firebase
        firebaseApp = firebase.initializeApp(config);
        database = firebase.database();
        
        // Update status
        document.getElementById('firebaseStatus').innerHTML = `
            <span class="badge badge-success">Connected</span> 
            Firebase Realtime Database terhubung!
        `;
        
        // Load data
        fetchAttendanceData();
        fetchUsersData();
        
        // Setup event listeners
        setupEventListeners();
        
        // If we're on the scan tab, initialize scanner
        if (document.getElementById('scan').classList.contains('active')) {
            initScanner();
        }
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        
        document.getElementById('firebaseStatus').innerHTML = `
            <span class="badge badge-error">Error</span> 
            Terjadi kesalahan saat menghubungkan ke Firebase: ${error.message}
        `;
    }
}

// ==========================================
// UI Initialization & Navigation
// ==========================================
function initializeTabs() {
    document.querySelectorAll('.tab[data-tab], .tab-link[data-tab]').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default action for links
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab
            document.querySelectorAll('.tab[data-tab]').forEach(t => {
                t.classList.remove('active');
            });
            document.querySelectorAll('.tab[data-tab="' + tabId + '"]').forEach(t => {
                t.classList.add('active');
            });
            
            // Update active tab link
            document.querySelectorAll('.tab-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelectorAll('.tab-link[data-tab="' + tabId + '"]').forEach(link => {
                link.classList.add('active');
            });
            
            // Update active content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
            
            // Initialize scanner if scan tab is active
            if (tabId === 'scan' && database) {
                initScanner();
            }
            
            // Stop scanner if moving away from scan tab
            if (tabId !== 'scan' && qrScanner && qrScanner._isScanning) {
                qrScanner.stop().catch(err => console.error('Error stopping scanner:', err));
            }
            
            // Scroll tab into view in tab bar
            const tabElement = document.querySelector(`.tabs .tab[data-tab="${tabId}"]`);
            if (tabElement) {
                const tabsContainer = document.querySelector('.tabs');
                const tabRect = tabElement.getBoundingClientRect();
                const containerRect = tabsContainer.getBoundingClientRect();
                
                if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
                    tabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }
        });
    });
}

function initializeSubtabs() {
    document.querySelectorAll('.tab[data-subtab]').forEach(tab => {
        tab.addEventListener('click', function() {
            const subtabId = this.getAttribute('data-subtab');
            
            // Update active subtab
            document.querySelectorAll('.tab[data-subtab]').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.subtab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(subtabId + '-data').classList.add('active');
        });
    });
}

// ==========================================
// Event Listeners Setup
// ==========================================
function setupEventListeners() {
    // Register new user
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }
    
    // Confirm attendance
    const confirmBtn = document.getElementById('confirmAttendance');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleAttendanceConfirmation);
    }
    
    // Download barcode
    const downloadBtn = document.getElementById('downloadBarcode');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleBarcodeDownload);
    }
    
    // Refresh database
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleDataRefresh);
    }
    
    // Search and filter
    const searchInput = document.getElementById('searchAttendance');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        
        // Add clear button functionality
        const clearBtn = document.getElementById('clearSearch');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearSearch);
        }
    }
    
    // Add touch feedback to all buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// ==========================================
// Scanner Functions
// ==========================================
function initScanner() {
    const readerElement = document.getElementById('reader');
    
    if (!readerElement || readerElement.innerHTML !== '') {
        return;
    }
    
    // Clear any previous HTML
    readerElement.innerHTML = '';
    
    // Create new scanner instance
    const html5QrCode = new Html5Qrcode("reader");
    qrScanner = html5QrCode;
    
    // Set up scanner configuration
    adjustScannerSize();
    
    // Start scanner
    startScanner();
}

function startScanner() {
    if (!qrScanner) return;
    
    // Add UI enhancements first
    const readerElement = document.getElementById('reader');
    if (readerElement) {
        // Add camera permission UI
        if (!qrScanner._isScanning) {
            const permissionOverlay = document.createElement('div');
            permissionOverlay.id = 'permission-overlay';
            permissionOverlay.style.position = 'absolute';
            permissionOverlay.style.top = '0';
            permissionOverlay.style.left = '0';
            permissionOverlay.style.width = '100%';
            permissionOverlay.style.height = '100%';
            permissionOverlay.style.display = 'flex';
            permissionOverlay.style.flexDirection = 'column';
            permissionOverlay.style.alignItems = 'center';
            permissionOverlay.style.justifyContent = 'center';
            permissionOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
            permissionOverlay.style.borderRadius = 'var(--card-border-radius)';
            permissionOverlay.style.zIndex = '10';
            permissionOverlay.style.color = 'white';
            permissionOverlay.style.padding = '1rem';
            permissionOverlay.style.textAlign = 'center';
            
            permissionOverlay.innerHTML = `
                <p style="margin-bottom: 1rem">Untuk menggunakan scanner, izinkan akses ke kamera Anda</p>
                <button id="camera-permission-btn" style="background-color: var(--primary-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Izinkan Kamera</button>
            `;
            
            readerElement.style.position = 'relative';
            readerElement.style.minHeight = '200px';
            readerElement.appendChild(permissionOverlay);
            
            // Add permission button click handler
            document.getElementById('camera-permission-btn').addEventListener('click', function() {
                permissionOverlay.remove();
                startQRScanner();
            });
        } else {
            startQRScanner();
        }
    }
}

function startQRScanner() {
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        // Handle on success
        qrScanner.stop().catch(err => console.error('Error stopping scanner after successful scan:', err));
        handleSuccessfulScan(decodedText);
    };
    
    // Determine facing mode based on device
    const facingMode = isMobileDevice() ? "environment" : "user";
    
    // Start scanner with optimal configuration
    qrScanner.start(
        { facingMode: facingMode }, 
        scannerOptions, 
        qrCodeSuccessCallback,
        handleScanError
    ).catch(err => {
        console.error('Error starting scanner:', err);
        displayScannerError(err);
    });
}

function handleSuccessfulScan(decodedText) {
    try {
        const userData = JSON.parse(decodedText);
        currentUser = userData;
        
        // Play success sound
        playSound('success');
        
        // Animate success
        const barcodeResult = document.getElementById('barcodeResult');
        barcodeResult.style.animation = 'pulse 0.5s';
        
        // Display scanned data
        document.getElementById('scannedData').textContent = `ID: ${userData.id}`;
        document.getElementById('userData').textContent = `${userData.nama} - ${userData.jurusan} - ${userData.kampus}`;
        barcodeResult.style.display = 'block';
        
        // Scroll to result area
        setTimeout(() => {
            barcodeResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    } catch (e) {
        // Play error sound
        playSound('error');
        
        showMessage('error', 'Barcode tidak valid! Pastikan menggunakan barcode yang benar.');
        
        // Restart scanner after delay
        setTimeout(() => {
            initScanner();
        }, 2000);
    }
}

function handleScanError(error) {
    console.warn('QR code scanning error:', error);
    // Don't show errors for common issues like no QR code found
    if (error !== 'No QR code found') {
        displayScannerError(error);
    }
}

function displayScannerError(error) {
    const readerElement = document.getElementById('reader');
    if (!readerElement) return;
    
    // Cleanup any previous error messages
    const existingError = readerElement.querySelector('.scanner-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'scanner-error';
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.padding = '1rem';
    errorDiv.style.backgroundColor = '#c62828';
    errorDiv.style.color = 'white';
    errorDiv.style.borderRadius = 'var(--card-border-radius) var(--card-border-radius) 0 0';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.zIndex = '5';
    
    // Determine error message
    let errorMessage = 'Terjadi kesalahan pada scanner.';
    
    if (error.toString().includes('Permission')) {
        errorMessage = 'Akses kamera ditolak. Mohon izinkan akses kamera di pengaturan browser Anda.';
    } else if (error.toString().includes('not found') || error.toString().includes('tidak ditemukan')) {
        errorMessage = 'Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera.';
    } else if (error.toString().includes('insecure context')) {
        errorMessage = 'Scanner memerlukan koneksi HTTPS yang aman.';
    }
    
    errorDiv.textContent = errorMessage;
    
    // Add retry button
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Coba Lagi';
    retryButton.style.marginTop = '0.5rem';
    retryButton.style.padding = '0.25rem 0.5rem';
    retryButton.style.backgroundColor = 'white';
    retryButton.style.color = '#c62828';
    retryButton.style.border = 'none';
    retryButton.style.borderRadius = '4px';
    retryButton.style.cursor = 'pointer';
    
    retryButton.addEventListener('click', function() {
        errorDiv.remove();
        initScanner();
    });
    
    errorDiv.appendChild(document.createElement('br'));
    errorDiv.appendChild(retryButton);
    
    // Add to DOM
    readerElement.style.position = 'relative';
    readerElement.appendChild(errorDiv);
}

// ==========================================
// QR Code Functions
// ==========================================
function generateQRCode(data) {
    document.getElementById('qrcode').innerHTML = '';
    
    try {
        const qr = qrcode(0, 'L');
        qr.addData(JSON.stringify(data));
        qr.make();
        
        // Create container for QR with padding
        const qrContainer = document.createElement('div');
        qrContainer.style.backgroundColor = 'white';
        qrContainer.style.padding = '1rem';
        qrContainer.style.borderRadius = '8px';
        qrContainer.style.display = 'inline-block';
        qrContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        
        // Add QR image
        const qrImage = qr.createImgTag(5);
        qrContainer.innerHTML = qrImage;
        
        // Add user data below QR
        const userInfoDiv = document.createElement('div');
        userInfoDiv.style.marginTop = '0.5rem';
        userInfoDiv.style.textAlign = 'center';
        userInfoDiv.style.fontSize = '0.8rem';
        userInfoDiv.style.color = '#666';
        userInfoDiv.innerHTML = `<strong>${data.nama}</strong><br>${data.jurusan} - ${data.kampus}`;
        
        qrContainer.appendChild(userInfoDiv);
        
        // Add to DOM
        document.getElementById('qrcode').appendChild(qrContainer);
        document.getElementById('downloadBarcode').style.display = 'block';
        
        // Scroll to QR Code
        qrContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Animate
        qrContainer.style.animation = 'fadeIn 0.5s';
        
        // Play success sound
        playSound('success');
    } catch (error) {
        console.error('Error generating QR code:', error);
        document.getElementById('qrcode').innerHTML = '<div class="error-message">Error generating QR code</div>';
    }
}

// ==========================================
// Data Fetching Functions
// ==========================================
function fetchAttendanceData() {
    if (!database) return;
    
    showLoadingState('attendanceTable');
    
    database.ref('attendance').once('value')
        .then(snapshot => {
            const data = snapshot.val() || {};
            
            // Convert to array and sort by timestamp (newest first)
            const attendanceArray = Object.values(data).sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            
            updateAttendanceTable(attendanceArray);
            hideLoadingState('attendanceTable');
        })
        .catch(error => {
            console.error('Error fetching attendance data:', error);
            document.querySelector('#attendanceTable tbody').innerHTML = 
                `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
            hideLoadingState('attendanceTable');
        });
    
    // Set up real-time listener
    database.ref('attendance').on('child_added', () => {
        fetchAttendanceData();
    });
}

function fetchUsersData() {
    if (!database) return;
    
    showLoadingState('usersTable');
    
    database.ref('users').once('value')
        .then(snapshot => {
            const data = snapshot.val() || {};
            
            // Convert to array and sort by createdAt (newest first)
            const usersArray = Object.values(data).sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            updateUsersTable(usersArray);
            hideLoadingState('usersTable');
        })
        .catch(error => {
            console.error('Error fetching users data:', error);
            document.querySelector('#usersTable tbody').innerHTML = 
                `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
            hideLoadingState('usersTable');
        });
    
    // Set up real-time listener
    database.ref('users').on('child_added', () => {
        fetchUsersData();
    });
}

function showLoadingState(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem;">
                    <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid rgba(0,0,0,0.1); border-radius: 50%; border-top-color: var(--primary-color); animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 0.5rem;">Memuat data...</p>
                </td>
            </tr>
        `;
    }
}

function hideLoadingState(tableId) {
    // This is handled by the update functions
}

// ==========================================
// Event Handlers
// ==========================================
function handleRegistration(e) {
    e.preventDefault();
    
    if (!database) {
        showMessage('error', 'Firebase belum terhubung! Silakan setup Firebase terlebih dahulu.');
        return;
    }
    
    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<span class="loading" style="width: 16px; height: 16px; margin-right: 8px;"></span> Mendaftar...';
    submitButton.disabled = true;
    
    const newUser = {
        id: generateUniqueId(),
        nama: document.getElementById('nama').value,
        jurusan: document.getElementById('jurusan').value,
        kampus: document.getElementById('kampus').value,
        createdAt: new Date().toISOString()
    };
    
    // Validate form inputs
    if (!newUser.nama.trim() || !newUser.jurusan.trim() || !newUser.kampus.trim()) {
        showMessage('error', 'Semua kolom harus diisi!');
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        return;
    }
    
    // Save to Firebase
    database.ref('users/' + newUser.id).set(newUser)
        .then(() => {
            // Generate QR code
            generateQRCode(newUser);
            
            // Show success message
            showMessage('success', 'Pendaftaran berhasil! Barcode telah dibuat.');
            
            // Reset form
            this.reset();
            
            // Refresh user data
            fetchUsersData();
            
            // Reset button
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        })
        .catch(error => {
            console.error('Error registering user:', error);
            showMessage('error', `Terjadi kesalahan: ${error.message}`);
            
            // Reset button
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        });
}

function handleAttendanceConfirmation() {
    if (!currentUser) {
        showMessage('error', 'Tidak ada data pengguna! Silakan scan barcode terlebih dahulu.');
        return;
    }
    
    if (!database) {
        showMessage('error', 'Firebase belum terhubung! Silakan setup Firebase terlebih dahulu.');
        return;
    }
    
    // Show loading state
    const button = document.getElementById('confirmAttendance');
    const originalText = button.textContent;
    button.innerHTML = '<span class="loading" style="width: 16px; height: 16px; margin-right: 8px;"></span> Menyimpan...';
    button.disabled = true;
    
    const attendanceId = 'attendance_' + Date.now();
    const attendanceRecord = {
        id: attendanceId,
        userId: currentUser.id,
        nama: currentUser.nama,
        jurusan: currentUser.jurusan,
        kampus: currentUser.kampus,
        timestamp: new Date().toISOString()
    };
    
    // Save to Firebase
    database.ref('attendance/' + attendanceId).set(attendanceRecord)
        .then(() => {
            // Play success sound
            playSound('success');
            
            // Show success message and reset
            showMessage('success', 'Absensi berhasil dicatat!');
            document.getElementById('barcodeResult').style.display = 'none';
            
            // Reset button
            button.innerHTML = originalText;
            button.disabled = false;
            
            // Reinitialize scanner after delay
            setTimeout(() => {
                initScanner();
            }, 1500);
            
            // Refresh attendance data
            fetchAttendanceData();
        })
        .catch(error => {
            console.error('Error recording attendance:', error);
            showMessage('error', `Terjadi kesalahan: ${error.message}`);
            
            // Reset button
            button.innerHTML = originalText;
            button.disabled = false;
        });
}

function handleBarcodeDownload() {
    const qrImage = document.querySelector('#qrcode img');
    if (!qrImage) {
        showMessage('error', 'Tidak ada barcode untuk diunduh.');
        return;
    }
    
    // Show loading state
    const button = document.getElementById('downloadBarcode');
    const originalText = button.textContent;
    button.innerHTML = '<span class="loading" style="width: 16px; height: 16px; margin-right: 8px;"></span> Menyiapkan...';
    button.disabled = true;
    
    try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Get the container div that holds both the QR code and user info
        const qrContainer = qrImage.closest('div');
        
        if (qrContainer) {
            // Set canvas dimensions to match the container
            const containerWidth = qrContainer.offsetWidth;
            const containerHeight = qrContainer.offsetHeight;
            canvas.width = containerWidth;
            canvas.height = containerHeight;
            
            // Create a new image with white background first
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Use html2canvas-like approach, first render the QR code
            const qrRenderComplete = new Promise((resolve) => {
                const image = new Image();
                image.crossOrigin = 'Anonymous';
                image.onload = function() {
                    // Draw the QR code image
                    context.drawImage(image, (containerWidth - image.width) / 2, 10, image.width, image.height);
                    resolve();
                };
                image.onerror = function() {
                    console.error('Error loading QR image');
                    resolve(); // Resolve anyway to continue with text
                };
                image.src = qrImage.src;
            });
            
            qrRenderComplete.then(() => {
                // Now add the text from the user info div if present
                const userInfoDiv = qrContainer.querySelector('div');
                if (userInfoDiv) {
                    context.font = 'bold 14px Arial';
                    context.textAlign = 'center';
                    context.fillStyle = '#000';
                    context.fillText(userInfoDiv.querySelector('strong').textContent, containerWidth / 2, qrImage.height + 30);
                    
                    context.font = '12px Arial';
                    context.fillStyle = '#666';
                    const infoText = userInfoDiv.textContent.replace(userInfoDiv.querySelector('strong').textContent, '').trim();
                    context.fillText(infoText, containerWidth / 2, qrImage.height + 50);
                }
                
                // Convert to image and trigger download
                try {
                    const dataUrl = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const filename = `barcode_${timestamp}.png`;
                    link.download = filename;
                    link.href = dataUrl;
                    link.click();
                    
                    // Reset button after successful download
                    button.innerHTML = originalText;
                    button.disabled = false;
                    
                    // Play success sound
                    playSound('success');
                } catch (err) {
                    console.error('Error creating download:', err);
                    showMessage('error', 'Gagal membuat file download. Coba lagi.');
                    button.innerHTML = originalText;
                    button.disabled = false;
                }
            });
        } else {
            throw new Error('QR Container not found');
        }
    } catch (error) {
        console.error('Error preparing download:', error);
        showMessage('error', `Terjadi kesalahan: ${error.message}`);
        button.innerHTML = originalText;
        button.disabled = false;
    }
}