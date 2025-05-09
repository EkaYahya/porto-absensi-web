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
    try {
        console.log("Initializing app...");
        
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
        
        // Jika berada di tab scan, inisialisasi scanner
        if (document.getElementById('scan') && document.getElementById('scan').classList.contains('active')) {
            console.log("Tab scan aktif, inisialisasi scanner...");
            setTimeout(() => {
                initScanner();
            }, 1000); // Delay inisialisasi scanner untuk memastikan DOM sudah siap
        }
        
        console.log("App initialized successfully");
    } catch (error) {
        console.error('Error initializing app:', error);
        showErrorMessage('Terjadi kesalahan saat inisialisasi aplikasi: ' + error.message);
    }
});

// Fungsi untuk menampilkan error di UI
function showErrorMessage(message) {
    console.error("Error message:", message);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.display = 'block';
    errorDiv.style.padding = '10px';
    errorDiv.style.margin = '10px 0';
    errorDiv.style.backgroundColor = '#f8d7da';
    errorDiv.style.color = '#721c24';
    errorDiv.style.borderRadius = '4px';
    errorDiv.style.border = '1px solid #f5c6cb';
    errorDiv.textContent = message;
    
    // Cari tempat untuk menampilkan error
    const container = document.querySelector('.container');
    if (container) {
        container.prepend(errorDiv);
    } else {
        document.body.prepend(errorDiv);
    }
}

// ==========================================
// Responsive Helpers
// ==========================================
function initializeMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('menu-active');
            this.textContent = mainNav.classList.contains('menu-active') ? '✕' : '☰';
        });
        
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
}

function handleScreenResize() {
    // Reset mobile menu on resize
    const mainNav = document.getElementById('mainNav');
    const menuToggle = document.getElementById('menuToggle');
    
    if (window.innerWidth > 768 && mainNav && mainNav.classList.contains('menu-active')) {
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
    if (qrScanner && qrScanner._isScanning) {
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
        console.log("Initializing Firebase...");
        
        // Initialize Firebase
        firebaseApp = firebase.initializeApp(config);
        database = firebase.database();
        
        console.log("Firebase initialized successfully");
        
        // Update status
        const firebaseStatus = document.getElementById('firebaseStatus');
        if (firebaseStatus) {
            firebaseStatus.innerHTML = `
                <span class="badge badge-success">Connected</span> 
                Firebase Realtime Database terhubung!
            `;
        }
        
        // Load data
        fetchAttendanceData();
        fetchUsersData();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        
        const firebaseStatus = document.getElementById('firebaseStatus');
        if (firebaseStatus) {
            firebaseStatus.innerHTML = `
                <span class="badge badge-error">Error</span> 
                Terjadi kesalahan saat menghubungkan ke Firebase: ${error.message}
            `;
        }
    }
}

// ==========================================
// UI Initialization & Navigation
// ==========================================
function initializeTabs() {
    document.querySelectorAll('.tab[data-tab], .tab-link[data-tab]').forEach(tab => {
        tab.addEventListener('click', function(e) {
            if (e && e.preventDefault) e.preventDefault(); // Prevent default action for links
            const tabId = this.getAttribute('data-tab');
            console.log("Switching to tab:", tabId);
            
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
            
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
                
                // Initialize scanner if scan tab is active
                if (tabId === 'scan' && database) {
                    console.log("Tab scan active, initializing scanner...");
                    // Bersihkan area scanner sebelum inisialisasi baru
                    const readerElement = document.getElementById('reader');
                    if (readerElement) {
                        readerElement.innerHTML = '';
                    }
                    
                    // Jadwalkan inisialisasi scanner setelah DOM dirender
                    setTimeout(() => {
                        initScanner();
                    }, 500);
                }
                
                // Stop scanner if moving away from scan tab
                if (tabId !== 'scan' && qrScanner && qrScanner._isScanning) {
                    console.log("Stopping scanner as we're leaving scan tab");
                    qrScanner.stop().catch(err => console.error('Error stopping scanner:', err));
                }
            }
            
            // Scroll tab into view in tab bar
            const tabElement = document.querySelector(`.tabs .tab[data-tab="${tabId}"]`);
            if (tabElement) {
                const tabsContainer = document.querySelector('.tabs');
                if (tabsContainer) {
                    const tabRect = tabElement.getBoundingClientRect();
                    const containerRect = tabsContainer.getBoundingClientRect();
                    
                    if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
                        tabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
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
            
            const subtabContent = document.getElementById(subtabId + '-data');
            if (subtabContent) {
                subtabContent.classList.add('active');
            }
        });
    });
}

// ==========================================
// Event Listeners Setup
// ==========================================
function setupEventListeners() {
    try {
        console.log("Setting up event listeners...");
        
        // Register new user
        const registrationForm = document.getElementById('registrationForm');
        if (registrationForm) {
            registrationForm.addEventListener('submit', handleRegistration);
            console.log("Registration form listener set up");
        }
        
        // Confirm attendance
        const confirmBtn = document.getElementById('confirmAttendance');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', handleAttendanceConfirmation);
            console.log("Attendance confirmation listener set up");
        }
        
        // Download barcode
        const downloadBtn = document.getElementById('downloadBarcode');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', handleBarcodeDownload);
            console.log("Download barcode listener set up");
        }
        
        // Refresh database
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', handleDataRefresh);
            console.log("Refresh data listener set up");
        }
        
        // Search and filter
        const searchInput = document.getElementById('searchAttendance');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
            console.log("Search listener set up");
            
            // Add clear button functionality
            const clearBtn = document.getElementById('clearSearch');
            if (clearBtn) {
                clearBtn.addEventListener('click', clearSearch);
                console.log("Clear search listener set up");
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
        
        console.log("All event listeners set up successfully");
    } catch (error) {
        console.error('Error setting up event listeners:', error);
        showErrorMessage('Terjadi kesalahan saat setup event listeners: ' + error.message);
    }
}

// ==========================================
// Scanner Functions
// ==========================================
function initScanner() {
    console.log("Initializing scanner...");
    
    const readerElement = document.getElementById('reader');
    if (!readerElement) {
        console.error("Reader element not found");
        return;
    }
    
    try {
        // Clear any previous HTML
        readerElement.innerHTML = '';
        
        // Create scanner UI first
        const scannerUI = document.createElement('div');
        scannerUI.className = 'scanner-ui';
        scannerUI.style.position = 'relative';
        scannerUI.style.minHeight = '250px';
        scannerUI.style.backgroundColor = '#f8f9fa';
        scannerUI.style.border = '1px solid #ddd';
        scannerUI.style.borderRadius = '8px';
        scannerUI.style.display = 'flex';
        scannerUI.style.alignItems = 'center';
        scannerUI.style.justifyContent = 'center';
        scannerUI.style.flexDirection = 'column';
        scannerUI.style.padding = '20px';
        scannerUI.style.marginBottom = '20px';
        
        // Add camera access button
        const cameraButton = document.createElement('button');
        cameraButton.textContent = 'Izinkan Akses Kamera';
        cameraButton.className = 'camera-button';
        cameraButton.style.marginBottom = '10px';
        
        const cameraText = document.createElement('p');
        cameraText.textContent = 'Klik tombol di atas untuk mengaktifkan scanner barcode';
        cameraText.style.fontSize = '0.9rem';
        cameraText.style.color = '#666';
        cameraText.style.textAlign = 'center';
        
        scannerUI.appendChild(cameraButton);
        scannerUI.appendChild(cameraText);
        
        // Replace reader content with our UI
        readerElement.appendChild(scannerUI);
        
        // Listener for camera button
        cameraButton.addEventListener('click', function() {
            startQRScanner(readerElement);
        });
        
        console.log("Scanner UI initialized, waiting for user to grant camera access");
    } catch (error) {
        console.error('Error initializing scanner:', error);
        if (readerElement) {
            readerElement.innerHTML = `
                <div class="error-message" style="padding: 15px; background-color: #f8d7da; color: #721c24; border-radius: 4px; border: 1px solid #f5c6cb;">
                    Terjadi kesalahan inisialisasi scanner: ${error.message}
                </div>
            `;
        }
    }
}

function startQRScanner(readerElement) {
    console.log("Starting QR Scanner...");
    
    try {
        // Clear previous content
        readerElement.innerHTML = '';
        
        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.style.textAlign = 'center';
        loadingIndicator.style.padding = '20px';
        loadingIndicator.innerHTML = `
            <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid rgba(0,0,0,0.1); border-radius: 50%; border-top-color: var(--primary-color, #1b5e20); animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 10px;">Memulai kamera...</p>
        `;
        readerElement.appendChild(loadingIndicator);
        
        // Create new scanner instance
        const html5QrCode = new Html5Qrcode("reader");
        qrScanner = html5QrCode;
        
        // Camera initialization
        Html5Qrcode.getCameras()
            .then(devices => {
                console.log("Cameras found:", devices);
                
                if (devices && devices.length > 0) {
                    // Use first camera (usually back camera on mobile)
                    const cameraId = devices[0].id;
                    
                    // Configure scanner
                    adjustScannerSize();
                    
                    // Define success callback
                    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
                        // Handle on success
                        qrScanner.stop().catch(err => console.error('Error stopping scanner after successful scan:', err));
                        handleSuccessfulScan(decodedText);
                    };
                    
                    // Determine preferred camera
                    const facingMode = isMobileDevice() ? "environment" : "user";
                    
                    // Start scanner with configuration
                    const config = {
                        fps: 10,
                        qrbox: scannerOptions.qrbox,
                        aspectRatio: 1.0
                    };
                    
                    const cameraScanConfig = {
                        facingMode: facingMode
                    };
                    
                    // Start the scanner
                    html5QrCode.start(
                        cameraScanConfig, 
                        config, 
                        qrCodeSuccessCallback,
                        handleScanError
                    ).then(() => {
                        console.log("QR Code scanning started successfully");
                    }).catch(err => {
                        console.error('Error starting scanner:', err);
                        displayScannerError(err, readerElement);
                    });
                } else {
                    throw new Error("Tidak ada kamera yang terdeteksi pada perangkat ini");
                }
            })
            .catch(err => {
                console.error("Error getting cameras:", err);
                displayScannerError(err, readerElement);
            });
    } catch (error) {
        console.error('Error in startQRScanner:', error);
        displayScannerError(error, readerElement);
    }
}

function handleSuccessfulScan(decodedText) {
    console.log("Successful scan:", decodedText);
    
    try {
        const userData = JSON.parse(decodedText);
        currentUser = userData;
        
        // Play success sound
        playSound('success');
        
        // Animate success
        const barcodeResult = document.getElementById('barcodeResult');
        if (barcodeResult) {
            barcodeResult.style.animation = 'pulse 0.5s';
            
            // Display scanned data
            const scannedDataElement = document.getElementById('scannedData');
            const userDataElement = document.getElementById('userData');
            
            if (scannedDataElement) {
                scannedDataElement.textContent = `ID: ${userData.id}`;
            }
            
            if (userDataElement) {
                userDataElement.textContent = `${userData.nama} - ${userData.jurusan} - ${userData.kampus}`;
            }
            
            barcodeResult.style.display = 'block';
            
            // Scroll to result area
            setTimeout(() => {
                barcodeResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    } catch (e) {
        console.error("Error processing scan result:", e);
        
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
    // Ignore no QR code found errors as they happen continuously during scanning
    if (error === 'No QR code found') {
        return;
    }
    
    console.warn('QR code scanning error:', error);
    displayScannerError(error);
}

function displayScannerError(error, readerElement) {
    if (!readerElement) {
        readerElement = document.getElementById('reader');
    }
    
    if (!readerElement) return;
    
    // Cleanup any previous error messages
    const existingError = readerElement.querySelector('.scanner-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Stop the scanner if it's running
    if (qrScanner && qrScanner._isScanning) {
        qrScanner.stop().catch(err => console.error('Error stopping scanner:', err));
    }
    
    // Clear the reader
    readerElement.innerHTML = '';
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'scanner-error';
    errorDiv.style.padding = '15px';
    errorDiv.style.backgroundColor = '#f8d7da';
    errorDiv.style.color = '#721c24';
    errorDiv.style.borderRadius = '8px';
    errorDiv.style.border = '1px solid #f5c6cb';
    errorDiv.style.marginBottom = '15px';
    errorDiv.style.textAlign = 'center';
    
    // Determine error message
    let errorMessage = 'Terjadi kesalahan pada scanner.';
    let errorDetails = '';
    
    if (error.toString().includes('Permission')) {
        errorMessage = 'Akses kamera ditolak oleh browser.';
        errorDetails = 'Mohon izinkan akses kamera di pengaturan browser Anda.';
    } else if (error.toString().includes('not found') || error.toString().includes('tidak ditemukan')) {
        errorMessage = 'Kamera tidak ditemukan.';
        errorDetails = 'Pastikan perangkat Anda memiliki kamera yang berfungsi.';
    } else if (error.toString().includes('insecure context')) {
        errorMessage = 'Halaman web ini tidak aman (HTTP).';
        errorDetails = 'Scanner memerlukan koneksi HTTPS yang aman untuk mengakses kamera.';
    } else if (error.toString().includes('NotReadableError')) {
        errorMessage = 'Kamera sedang digunakan oleh aplikasi lain.';
        errorDetails = 'Tutup aplikasi lain yang mungkin menggunakan kamera, atau coba gunakan browser yang berbeda.';
    }
    
    errorDiv.innerHTML = `
        <h4 style="margin-top: 0; margin-bottom: 10px;">${errorMessage}</h4>
        <p style="margin-bottom: 15px;">${errorDetails}</p>
    `;
    
    // Add retry button
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Coba Lagi';
    retryButton.style.backgroundColor = '#28a745';
    retryButton.style.color = 'white';
    retryButton.style.border = 'none';
    retryButton.style.padding = '8px 16px';
    retryButton.style.borderRadius = '4px';
    retryButton.style.cursor = 'pointer';
    
    retryButton.addEventListener('click', function() {
        initScanner();
    });
    
    errorDiv.appendChild(retryButton);
    
    // Add to DOM
    readerElement.appendChild(errorDiv);
}

// ==========================================
// QR Code Functions
// ==========================================
function generateQRCode(data) {
    console.log("Generating QR code for:", data.nama);
    
    const qrcodeElement = document.getElementById('qrcode');
    if (!qrcodeElement) return;
    
    qrcodeElement.innerHTML = '';
    
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
        qrcodeElement.appendChild(qrContainer);
        
        const downloadButton = document.getElementById('downloadBarcode');
        if (downloadButton) {
            downloadButton.style.display = 'block';
        }
        
        // Scroll to QR Code
        qrContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Animate
        qrContainer.style.animation = 'fadeIn 0.5s';
        
        // Play success sound
        playSound('success');
    } catch (error) {
        console.error('Error generating QR code:', error);
        qrcodeElement.innerHTML = '<div class="error-message">Error generating QR code</div>';
    }
}

// ==========================================
// Data Fetching Functions
// ==========================================
function fetchAttendanceData() {
    if (!database) return;
    
    showLoadingState('attendanceTable');
    
    try {
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
                const tableBody = document.querySelector('#attendanceTable tbody');
                if (tableBody) {
                    tableBody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
                }
                hideLoadingState('attendanceTable');
            });
        
        // Set up real-time listener
        database.ref('attendance').on('child_added', () => {
            fetchAttendanceData();
        });
    } catch (error) {
        console.error('Error in fetchAttendanceData:', error);
        hideLoadingState('attendanceTable');
    }
}

function fetchUsersData() {
    if (!database) return;
    
    showLoadingState('usersTable');
    
    try {
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
                const tableBody = document.querySelector('#usersTable tbody');
                if (tableBody) {
                    tableBody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
                }
                hideLoadingState('usersTable');
            });
        
        // Set up real-time listener
        database.ref('users').on('child_added', () => {
            fetchUsersData();
        });
    } catch (error) {
        console.error('Error in fetchUsersData:', error);
        hideLoadingState('usersTable');
    }
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
    if (!submitButton) return;
    
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<span class="loading" style="width: 16px; height: 16px; margin-right: 8px;"></span> Mendaftar...';
    submitButton.disabled = true;
    
    const namaElement = document.getElementById('nama');
    const jurusanElement = document.getElementById('jurusan');
    const kampusElement = document.getElementById('kampus');
    
    if (!namaElement || !jurusanElement || !kampusElement) {
        showMessage('error', 'Form tidak lengkap!');
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        return;
    }
    
    const newUser = {
        id: generateUniqueId(),
        nama: namaElement.value,
        jurusan: jurusanElement.value,
        kampus: kampusElement.value,
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
    if (!button) return;
    
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
            
            const barcodeResult = document.getElementById('barcodeResult');
            if (barcodeResult) {
                barcodeResult.style.display = 'none';
            }
            
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
    if (!button) return;
    
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
                    
                    const strongElement = userInfoDiv.querySelector('strong');
                    if (strongElement) {
                        context.fillText(strongElement.textContent, containerWidth / 2, qrImage.height + 30);
                    }
                    
                    context.font = '12px Arial';
                    context.fillStyle = '#666';
                    
                    if (strongElement) {
                        const infoText = userInfoDiv.textContent.replace(strongElement.textContent, '').trim();
                        context.fillText(infoText, containerWidth / 2, qrImage.height + 50);
                    } else {
                        context.fillText(userInfoDiv.textContent, containerWidth / 2, qrImage.height + 50);
                    }
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

function handleDataRefresh() {
    if (!database) {
        showMessage('error', 'Firebase belum terhubung! Silakan setup Firebase terlebih dahulu.');
        return;
    }
    
    // Show refresh animation
    const button = document.getElementById('refreshData');
    if (!button) return;
    
    const originalText = button.textContent;
    button.innerHTML = '<span class="loading" style="width: 16px; height: 16px; margin-right: 8px;"></span> Memperbarui...';
    button.disabled = true;
    
    // Fetch data
    fetchAttendanceData();
    fetchUsersData();
    
    // Reset button after delay
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
        showMessage('success', 'Data berhasil diperbarui');
    }, 1000);
}

function handleSearch() {
    const searchTerm = this.value.toLowerCase();
    filterTableData(searchTerm);
}

function clearSearch() {
    const searchInput = document.getElementById('searchAttendance');
    if (searchInput) {
        searchInput.value = '';
        filterTableData('');
        searchInput.focus();
    }
}

// ==========================================
// Utility Functions
// ==========================================
function generateUniqueId() {
    return 'user_' + Date.now() + Math.floor(Math.random() * 1000);
}

function formatDate(isoString) {
    try {
        const date = new Date(isoString);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (e) {
        console.error('Error formatting date:', e);
        return isoString || 'Tanggal tidak valid';
    }
}

function showMessage(type, message, duration = 3000) {
    // Clear any existing messages
    document.querySelectorAll('.success-message, .error-message, .info-message').forEach(msg => {
        msg.style.display = 'none';
    });
    
    // Determine which message element to use
    let messageElement;
    
    if (type === 'success') {
        if (document.querySelector('.tab-content.active') === document.getElementById('scan')) {
            messageElement = document.getElementById('attendanceSuccess');
        } else if (document.querySelector('.tab-content.active') === document.getElementById('register')) {
            messageElement = document.getElementById('registrationSuccess');
        }
    } else if (type === 'error') {
        if (document.querySelector('.tab-content.active') === document.getElementById('scan')) {
            messageElement = document.getElementById('attendanceError');
        } else if (document.querySelector('.tab-content.active') === document.getElementById('register')) {
            messageElement = document.getElementById('registrationError');
        }
    }
    
    // If no specific message element found, create a temporary one
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.className = type + '-message';
        messageElement.style.position = 'fixed';
        messageElement.style.bottom = '20px';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translateX(-50%)';
        messageElement.style.zIndex = '1000';
        messageElement.style.minWidth = '300px';
        messageElement.style.maxWidth = '90%';
        messageElement.style.padding = '1rem';
        messageElement.style.borderRadius = '4px';
        messageElement.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
        messageElement.style.animation = 'fadeIn 0.3s';
        
        document.body.appendChild(messageElement);
    }
    
    // Set message and show
    messageElement.textContent = message;
    messageElement.style.display = 'block';
    
    // Hide after duration
    setTimeout(() => {
        messageElement.style.animation = 'fadeOut 0.3s';
        setTimeout(() => {
            messageElement.style.display = 'none';
            // Remove temporary message from DOM
            if (!messageElement.id) {
                messageElement.remove();
            }
        }, 300);
    }, duration);
    
    // Play appropriate sound
    playSound(type);
}

function playSound(type) {
    // Create audio element if browser supports it
    if (typeof Audio !== 'undefined') {
        let sound;
        
        if (type === 'success') {
            sound = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADYgD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAZYAAAAAAAAAABSAJAJAQgAAgAAAA2L2YLgXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=');
        } else if (type === 'error') {
            sound = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADYgD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAZYAAAAAAAAAABSAJAJAQgAAgAAAA2L2YLgXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=');
        }
        
        if (sound) {
            sound.volume = 0.4;
            sound.play().catch(e => {
                console.warn('Could not play sound:', e);
            });
        }
    }
}

function isMobileDevice() {
    // Comprehensive check for mobile devices
    return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /Macintosh/i.test(navigator.userAgent)) ||
        window.matchMedia("(max-width: 768px)").matches
    );
}

// ==========================================
// Table Update Functions
// ==========================================
function updateAttendanceTable(data, page = 1) {
    const tableBody = document.querySelector('#attendanceTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data absensi.</td></tr>';
        
        const paginationElement = document.getElementById('attendancePagination');
        if (paginationElement) {
            paginationElement.innerHTML = '';
        }
        return;
    }
    
    // Pagination
    const itemsPerPage = isMobileDevice() ? 5 : 10;
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, data.length);
    const currentPageData = data.slice(startIndex, endIndex);
    
    // Populate table
    currentPageData.forEach((record, index) => {
        const row = document.createElement('tr');
        
        // Apply highlight to newly added row
        if (index === 0 && page === 1) {
            row.classList.add('highlight-row');
            row.style.animation = 'pulse 2s';
            row.style.backgroundColor = '#e8f5e9';
        }
        
        const idCell = document.createElement('td');
        idCell.textContent = record.userId || '-';
        row.appendChild(idCell);
        
        const nameCell = document.createElement('td');
        nameCell.textContent = record.nama || '-';
        row.appendChild(nameCell);
        
        const majorCell = document.createElement('td');
        majorCell.textContent = record.jurusan || '-';
        row.appendChild(majorCell);
        
        const campusCell = document.createElement('td');
        campusCell.textContent = record.kampus || '-';
        row.appendChild(campusCell);
        
        const timeCell = document.createElement('td');
        timeCell.textContent = formatDate(record.timestamp);
        row.appendChild(timeCell);
        
        tableBody.appendChild(row);
    });
    
    // Update pagination
    updatePagination('attendancePagination', page, totalPages, (newPage) => {
        updateAttendanceTable(data, newPage);
    });
}

function updateUsersTable(data, page = 1) {
    const tableBody = document.querySelector('#usersTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data pengguna.</td></tr>';
        
        const paginationElement = document.getElementById('usersPagination');
        if (paginationElement) {
            paginationElement.innerHTML = '';
        }
        return;
    }
    
    // Pagination
    const itemsPerPage = isMobileDevice() ? 5 : 10;
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, data.length);
    const currentPageData = data.slice(startIndex, endIndex);
    
    // Populate table
    currentPageData.forEach((user, index) => {
        const row = document.createElement('tr');
        
        // Apply highlight to newly added row
        if (index === 0 && page === 1) {
            row.classList.add('highlight-row');
            row.style.animation = 'pulse 2s';
            row.style.backgroundColor = '#e8f5e9';
        }
        
        const idCell = document.createElement('td');
        idCell.textContent = user.id || '-';
        row.appendChild(idCell);
        
        const nameCell = document.createElement('td');
        nameCell.textContent = user.nama || '-';
        row.appendChild(nameCell);
        
        const majorCell = document.createElement('td');
        majorCell.textContent = user.jurusan || '-';
        row.appendChild(majorCell);
        
        const campusCell = document.createElement('td');
        campusCell.textContent = user.kampus || '-';
        row.appendChild(campusCell);
        
        const timeCell = document.createElement('td');
        timeCell.textContent = formatDate(user.createdAt);
        row.appendChild(timeCell);
        
        tableBody.appendChild(row);
    });
    
    // Update pagination
    updatePagination('usersPagination', page, totalPages, (newPage) => {
        updateUsersTable(data, newPage);
    });
}

function updatePagination(elementId, currentPage, totalPages, callback) {
    const paginationElement = document.getElementById(elementId);
    if (!paginationElement) return;
    
    paginationElement.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.disabled = currentPage === 1;
    prevButton.setAttribute('aria-label', 'Previous page');
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            callback(currentPage - 1);
        }
    });
    paginationElement.appendChild(prevButton);
    
    // Page buttons
    const maxButtonsDesktop = 5;
    const maxButtonsMobile = 3;
    const maxButtons = isMobileDevice() ? maxButtonsMobile : maxButtonsDesktop;
    
    let startPage, endPage;
    
    if (totalPages <= maxButtons) {
        // Show all pages
        startPage = 1;
        endPage = totalPages;
    } else {
        // Calculate start and end pages for pagination window
        const halfMax = Math.floor(maxButtons / 2);
        
        if (currentPage <= halfMax + 1) {
            // Near the start
            startPage = 1;
            endPage = maxButtons;
        } else if (currentPage >= totalPages - halfMax) {
            // Near the end
            startPage = totalPages - maxButtons + 1;
            endPage = totalPages;
        } else {
            // Middle
            startPage = currentPage - halfMax;
            endPage = currentPage + halfMax;
        }
    }
    
    // First page button (if not in range)
    if (startPage > 1) {
        const firstButton = document.createElement('button');
        firstButton.textContent = '1';
        firstButton.addEventListener('click', () => {
            callback(1);
        });
        paginationElement.appendChild(firstButton);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.innerHTML = '&hellip;';
            ellipsis.style.margin = '0 5px';
            paginationElement.appendChild(ellipsis);
        }
    }
    
    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage);
        pageButton.setAttribute('aria-label', `Page ${i}`);
        if (i === currentPage) {
            pageButton.setAttribute('aria-current', 'page');
        }
        pageButton.addEventListener('click', () => {
            callback(i);
        });
        paginationElement.appendChild(pageButton);
    }
    
    // Last page button (if not in range)
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.innerHTML = '&hellip;';
            ellipsis.style.margin = '0 5px';
            paginationElement.appendChild(ellipsis);
        }
        
        const lastButton = document.createElement('button');
        lastButton.textContent = totalPages;
        lastButton.addEventListener('click', () => {
            callback(totalPages);
        });
        paginationElement.appendChild(lastButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.disabled = currentPage === totalPages;
    nextButton.setAttribute('aria-label', 'Next page');
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            callback(currentPage + 1);
        }
    });
    paginationElement.appendChild(nextButton);
}

// ==========================================
// Search and Filter Functions
// ==========================================
function filterTableData(searchTerm) {
    const activeSubtab = document.querySelector('.tab[data-subtab].active');
    if (!activeSubtab) return;
    
    const subtabId = activeSubtab.getAttribute('data-subtab');
    
    if (subtabId === 'attendance') {
        if (!database) return;
        
        database.ref('attendance').once('value')
            .then(snapshot => {
                const data = snapshot.val() || {};
                
                // Convert to array
                let attendanceArray = Object.values(data);
                
                // Filter by search term
                if (searchTerm) {
                    attendanceArray = attendanceArray.filter(record => {
                        return (
                            (record.nama && record.nama.toLowerCase().includes(searchTerm)) ||
                            (record.jurusan && record.jurusan.toLowerCase().includes(searchTerm)) ||
                            (record.kampus && record.kampus.toLowerCase().includes(searchTerm)) ||
                            (record.userId && record.userId.toLowerCase().includes(searchTerm))
                        );
                    });
                }
                
                // Sort by timestamp (newest first)
                attendanceArray.sort((a, b) => {
                    return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
                });
                
                updateAttendanceTable(attendanceArray);
            })
            .catch(error => {
                console.error('Error filtering attendance data:', error);
                showMessage('error', `Terjadi kesalahan saat memfilter data: ${error.message}`);
            });
    } else if (subtabId === 'users') {
        if (!database) return;
        
        database.ref('users').once('value')
            .then(snapshot => {
                const data = snapshot.val() || {};
                
                // Convert to array
                let usersArray = Object.values(data);
                
                // Filter by search term
                if (searchTerm) {
                    usersArray = usersArray.filter(user => {
                        return (
                            (user.nama && user.nama.toLowerCase().includes(searchTerm)) ||
                            (user.jurusan && user.jurusan.toLowerCase().includes(searchTerm)) ||
                            (user.kampus && user.kampus.toLowerCase().includes(searchTerm)) ||
                            (user.id && user.id.toLowerCase().includes(searchTerm))
                        );
                    });
                }
                
                // Sort by createdAt (newest first)
                usersArray.sort((a, b) => {
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                });
                
                updateUsersTable(usersArray);
            })
            .catch(error => {
                console.error('Error filtering user data:', error);
                showMessage('error', `Terjadi kesalahan saat memfilter data: ${error.message}`);
            });
    }
}

// Add keyframe animations for fadeOut if not present
(function addKeyframes() {
    if (!document.getElementById('dynamic-animations')) {
        const style = document.createElement('style');
        style.id = 'dynamic-animations';
        style.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(10px); }
            }
            
            @keyframes highlightRow {
                0% { background-color: rgba(67, 160, 71, 0.3); }
                100% { background-color: transparent; }
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
})();

// ==========================================
// Perbaikan Scanner untuk Akses Kamera
// ==========================================

// Fungsi khusus untuk memperbaiki masalah akses kamera
function fixCameraAccess() {
    console.log("Memperbaiki akses kamera...");
    
    // 1. Hapus scanner yang ada jika ada
    if (qrScanner && qrScanner._isScanning) {
        qrScanner.stop().catch(err => console.error('Error stopping scanner:', err));
        qrScanner = null;
    }
    
    // 2. Bersihkan elemen reader
    const readerElement = document.getElementById('reader');
    if (!readerElement) {
        console.error("Reader element not found");
        return;
    }
    
    readerElement.innerHTML = '';
    
    // 3. Buat UI baru untuk scanner dengan tombol izin
    const scannerContainer = document.createElement('div');
    scannerContainer.className = 'scanner-container';
    scannerContainer.style.position = 'relative';
    scannerContainer.style.minHeight = '300px';
    scannerContainer.style.border = '1px solid #ddd';
    scannerContainer.style.borderRadius = '8px';
    scannerContainer.style.backgroundColor = '#f8f9fa';
    scannerContainer.style.display = 'flex';
    scannerContainer.style.flexDirection = 'column';
    scannerContainer.style.alignItems = 'center';
    scannerContainer.style.justifyContent = 'center';
    scannerContainer.style.padding = '20px';
    scannerContainer.style.textAlign = 'center';
    
    // 4. Tambahkan tombol untuk memulai kamera
    const cameraButton = document.createElement('button');
    cameraButton.id = 'start-camera';
    cameraButton.textContent = 'Mulai Kamera';
    cameraButton.style.marginBottom = '10px';
    cameraButton.style.padding = '12px 20px';
    cameraButton.style.fontSize = '16px';
    cameraButton.style.backgroundColor = '#1b5e20';
    cameraButton.style.color = 'white';
    cameraButton.style.border = 'none';
    cameraButton.style.borderRadius = '4px';
    cameraButton.style.cursor = 'pointer';
    
    // 5. Tambahkan instruksi
    const instructionText = document.createElement('p');
    instructionText.textContent = 'Klik tombol di atas untuk mengaktifkan kamera dan mulai scan barcode';
    instructionText.style.color = '#666';
    instructionText.style.fontSize = '14px';
    
    // 6. Tambahkan ikon kamera
    const cameraIcon = document.createElement('div');
    cameraIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#1b5e20" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
        </svg>
    `;
    cameraIcon.style.marginBottom = '15px';
    
    // 7. Tambahkan ke DOM
    scannerContainer.appendChild(cameraIcon);
    scannerContainer.appendChild(cameraButton);
    scannerContainer.appendChild(instructionText);
    
    readerElement.appendChild(scannerContainer);
    
    // 8. Event listener untuk tombol kamera
    cameraButton.addEventListener('click', function() {
        startCameraWithPermissionRequest();
    });
    
    console.log("UI untuk akses kamera telah diperbaiki");
}

// Fungsi untuk memulai kamera dengan permintaan izin yang lebih baik
function startCameraWithPermissionRequest() {
    console.log("Memulai kamera dengan permintaan izin...");
    
    const readerElement = document.getElementById('reader');
    if (!readerElement) return;
    
    // Tampilkan loading indicator
    readerElement.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center;">
            <div style="width: 40px; height: 40px; border: 4px solid rgba(0,0,0,0.1); border-radius: 50%; border-top-color: #1b5e20; animation: spin 1s linear infinite; margin-bottom: 15px;"></div>
            <p>Meminta akses kamera...</p>
            <p style="font-size: 12px; color: #666; margin-top: 5px;">Mohon izinkan akses ke kamera saat browser meminta izin</p>
        </div>
    `;
    
    // Periksa dukungan kamera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        displayScannerError(new Error("Browser Anda tidak mendukung akses kamera. Coba gunakan browser lain seperti Chrome atau Firefox terbaru."));
        return;
    }
    
    // Minta izin kamera dengan cara yang berbeda
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function(stream) {
            // Izin diberikan, matikan stream karena html5-qrcode akan memintanya lagi
            stream.getTracks().forEach(track => track.stop());
            
            // Buat scanner QR baru
            initQRScanner();
        })
        .catch(function(error) {
            console.error("Error accessing camera:", error);
            
            let errorMessage = "Terjadi kesalahan saat mengakses kamera.";
            let errorDetail = "";
            
            if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                errorMessage = "Akses kamera ditolak.";
                errorDetail = "Silakan izinkan akses kamera di pengaturan browser Anda dan coba lagi.";
            } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                errorMessage = "Kamera tidak ditemukan.";
                errorDetail = "Pastikan perangkat Anda memiliki kamera yang berfungsi.";
            } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
                errorMessage = "Kamera tidak dapat diakses.";
                errorDetail = "Kamera mungkin sedang digunakan oleh aplikasi lain. Tutup aplikasi lain yang mungkin menggunakan kamera.";
            } else if (error.name === "OverconstrainedError") {
                errorMessage = "Kamera tidak mendukung resolusi yang diminta.";
                errorDetail = "Coba gunakan pengaturan kamera yang berbeda.";
            } else if (error.name === "SecurityError" || error.name === "TypeError") {
                errorMessage = "Akses kamera diblokir oleh kebijakan keamanan.";
                errorDetail = "Halaman ini memerlukan koneksi HTTPS untuk mengakses kamera.";
            }
            
            displayCustomScannerError(errorMessage, errorDetail);
        });
}

// Fungsi untuk menginisialisasi scanner QR baru
function initQRScanner() {
    const readerElement = document.getElementById('reader');
    if (!readerElement) return;
    
    // Bersihkan
    readerElement.innerHTML = '';
    
    try {
        // Buat instance scanner baru
        const html5QrCode = new Html5Qrcode("reader");
        qrScanner = html5QrCode;
        
        // Set up scanner configuration
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };
        
        // Define success callback
        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            // Handle on success
            console.log("QR Code detected:", decodedText);
            qrScanner.stop().catch(err => console.error('Error stopping scanner after successful scan:', err));
            handleSuccessfulScan(decodedText);
        };
        
        // Determine preferred camera
        const facingMode = isMobileDevice() ? "environment" : "user";
        
        // Start scanner
        html5QrCode.start(
            { facingMode: facingMode },
            config,
            qrCodeSuccessCallback,
            (errorMessage) => {
                // Ignore "No QR code found" errors
                if (errorMessage !== 'No QR code found') {
                    console.warn("QR Scan Error:", errorMessage);
                }
            }
        ).then(() => {
            console.log("Scanner started successfully");
            
            // Tambahkan overlay dan petunjuk
            addScannerOverlay(readerElement);
        }).catch(err => {
            console.error('Error starting scanner:', err);
            displayCustomScannerError("Gagal memulai scanner", err.toString());
        });
    } catch (error) {
        console.error("Error initializing QR scanner:", error);
        displayCustomScannerError("Gagal menginisialisasi scanner", error.toString());
    }
}

// Fungsi untuk menampilkan petunjuk visual pada scanner
function addScannerOverlay(readerElement) {
    // Cari elemen video yang dibuat oleh html5-qrcode
    const videoElement = readerElement.querySelector('video');
    
    if (videoElement) {
        // Buat overlay container
        const overlayContainer = document.createElement('div');
        overlayContainer.style.position = 'absolute';
        overlayContainer.style.top = '0';
        overlayContainer.style.left = '0';
        overlayContainer.style.width = '100%';
        overlayContainer.style.height = '100%';
        overlayContainer.style.pointerEvents = 'none';
        overlayContainer.style.zIndex = '2';
        overlayContainer.style.display = 'flex';
        overlayContainer.style.flexDirection = 'column';
        overlayContainer.style.alignItems = 'center';
        overlayContainer.style.justifyContent = 'center';
        
        // Buat target frame
        const targetFrame = document.createElement('div');
        targetFrame.style.width = '200px';
        targetFrame.style.height = '200px';
        targetFrame.style.border = '2px solid #43a047';
        targetFrame.style.borderRadius = '20px';
        targetFrame.style.position = 'relative';
        
        // Tambahkan sudut ke target frame
        const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        corners.forEach(corner => {
            const cornerElement = document.createElement('div');
            cornerElement.style.position = 'absolute';
            cornerElement.style.width = '20px';
            cornerElement.style.height = '20px';
            cornerElement.style.border = '4px solid #43a047';
            
            if (corner === 'top-left') {
                cornerElement.style.top = '-2px';
                cornerElement.style.left = '-2px';
                cornerElement.style.borderRight = 'none';
                cornerElement.style.borderBottom = 'none';
                cornerElement.style.borderTopLeftRadius = '10px';
            } else if (corner === 'top-right') {
                cornerElement.style.top = '-2px';
                cornerElement.style.right = '-2px';
                cornerElement.style.borderLeft = 'none';
                cornerElement.style.borderBottom = 'none';
                cornerElement.style.borderTopRightRadius = '10px';
            } else if (corner === 'bottom-left') {
                cornerElement.style.bottom = '-2px';
                cornerElement.style.left = '-2px';
                cornerElement.style.borderRight = 'none';
                cornerElement.style.borderTop = 'none';
                cornerElement.style.borderBottomLeftRadius = '10px';
            } else if (corner === 'bottom-right') {
                cornerElement.style.bottom = '-2px';
                cornerElement.style.right = '-2px';
                cornerElement.style.borderLeft = 'none';
                cornerElement.style.borderTop = 'none';
                cornerElement.style.borderBottomRightRadius = '10px';
            }
            
            targetFrame.appendChild(cornerElement);
        });
        
        // Tambahkan petunjuk teks
        const instructionText = document.createElement('div');
        instructionText.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        instructionText.style.color = 'white';
        instructionText.style.padding = '8px 12px';
        instructionText.style.borderRadius = '4px';
        instructionText.style.marginTop = '20px';
        instructionText.style.fontSize = '14px';
        instructionText.style.textAlign = 'center';
        instructionText.style.maxWidth = '80%';
        instructionText.textContent = 'Arahkan kamera ke barcode';
        
        // Tambahkan elemen ke overlay
        overlayContainer.appendChild(targetFrame);
        overlayContainer.appendChild(instructionText);
        
        // Cari parent dari video element
        const videoParent = videoElement.parentElement;
        if (videoParent) {
            videoParent.style.position = 'relative';
            videoParent.appendChild(overlayContainer);
        }
    }
}

// Fungsi untuk menampilkan error scanner yang lebih informatif
function displayCustomScannerError(title, detail) {
    const readerElement = document.getElementById('reader');
    if (!readerElement) return;
    
    // Bersihkan elemen reader
    readerElement.innerHTML = '';
    
    // Buat container error
    const errorContainer = document.createElement('div');
    errorContainer.className = 'scanner-error-container';
    errorContainer.style.padding = '20px';
    errorContainer.style.backgroundColor = '#f8d7da';
    errorContainer.style.color = '#721c24';
    errorContainer.style.borderRadius = '8px';
    errorContainer.style.border = '1px solid #f5c6cb';
    errorContainer.style.textAlign = 'center';
    errorContainer.style.marginBottom = '20px';
    
    // Buat ikon error
    const errorIcon = document.createElement('div');
    errorIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#721c24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
    `;
    errorIcon.style.marginBottom = '15px';
    
    // Buat judul error
    const errorTitle = document.createElement('h3');
    errorTitle.textContent = title;
    errorTitle.style.margin = '0 0 10px 0';
    
    // Buat detail error
    const errorDetail = document.createElement('p');
    errorDetail.textContent = detail;
    errorDetail.style.margin = '0 0 15px 0';
    
    // Buat tombol retry
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Coba Lagi';
    retryButton.style.backgroundColor = '#28a745';
    retryButton.style.color = 'white';
    retryButton.style.border = 'none';
    retryButton.style.padding = '10px 15px';
    retryButton.style.borderRadius = '4px';
    retryButton.style.cursor = 'pointer';
    
    // Tambahkan event listener untuk tombol retry
    retryButton.addEventListener('click', function() {
        fixCameraAccess();
    });
    
    // Tambahkan semua elemen ke container
    errorContainer.appendChild(errorIcon);
    errorContainer.appendChild(errorTitle);
    errorContainer.appendChild(errorDetail);
    errorContainer.appendChild(retryButton);
    
    // Tambahkan container ke elemen reader
    readerElement.appendChild(errorContainer);
}

// Inisialisasi perbaikan kamera saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Cek jika tab scan aktif
    const scanTab = document.getElementById('scan');
    if (scanTab && scanTab.classList.contains('active')) {
        // Tunda inisialisasi sedikit untuk memastikan DOM sudah siap
        setTimeout(() => {
            fixCameraAccess();
        }, 1000);
    }
    
    // Tambahkan listener untuk tab scan
    const scanTabButton = document.querySelector('[data-tab="scan"]');
    if (scanTabButton) {
        scanTabButton.addEventListener('click', function() {
            // Tunda inisialisasi sedikit untuk memastikan DOM sudah siap
            setTimeout(() => {
                fixCameraAccess();
            }, 500);
        });
    }
});