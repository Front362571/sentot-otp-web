// Global variables
let numbersData = [];
let filteredNumbers = [];
let monitoringInterval = null;
let currentNumber = '';

// Load data saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    loadNumbers();
    setupAutoRefresh();
});

// Load numbers dari GitHub raw JSON
async function loadNumbers() {
    showLoading(true);
    
    try {
        // Ganti USERNAME dengan username GitHub kamu
        const response = await fetch('https://raw.githubusercontent.com/YOUR_USERNAME/sentot-otp-web/main/data/us-numbers.json?t=' + Date.now());
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        numbersData = data.numbers || [];
        filteredNumbers = numbersData;
        
        // Update UI
        updateStats(data);
        renderNumbers(numbersData);
        updateLastUpdate(data.last_updated);
        
        showToast('✅ Numbers updated successfully', 'success');
        
    } catch (error) {
        console.error('Error loading numbers:', error);
        showError('Failed to load numbers. Using demo data.');
        loadDemoData();
    } finally {
        showLoading(false);
    }
}

// Demo data jika API gagal
function loadDemoData() {
    const demoNumbers = [];
    const areaCodes = ['212', '213', '310', '312', '313', '404', '408', '415'];
    
    for (let i = 0; i < 20; i++) {
        const area = areaCodes[Math.floor(Math.random() * areaCodes.length)];
        const prefix = Math.floor(Math.random() * 900) + 100;
        const line = Math.floor(Math.random() * 9000) + 1000;
        
        demoNumbers.push({
            number: `+1${area}${prefix}${line}`,
            source: 'demo',
            timestamp: new Date().toISOString(),
            active: true
        });
    }
    
    numbersData = demoNumbers;
    filteredNumbers = demoNumbers;
    
    document.getElementById('totalNumbers').textContent = demoNumbers.length;
    document.getElementById('areaCodes').textContent = '8+';
    document.getElementById('lastUpdate').textContent = 'Demo Mode';
    
    renderNumbers(demoNumbers);
}

// Update statistik
function updateStats(data) {
    document.getElementById('totalNumbers').textContent = data.total || 0;
    
    // Hitung unique area codes
    const areaCodes = new Set();
    numbersData.forEach(num => {
        const match = num.number.match(/\+1(\d{3})/);
        if (match) areaCodes.add(match[1]);
    });
    
    document.getElementById('areaCodes').textContent = areaCodes.size || '50+';
}

// Render numbers ke grid
function renderNumbers(numbers) {
    const grid = document.getElementById('numbersGrid');
    
    if (numbers.length === 0) {
        grid.innerHTML = '<div class="loading-spinner">No numbers available</div>';
        return;
    }
    
    grid.innerHTML = numbers.map((num, index) => {
        const areaCode = num.number.match(/\+1(\d{3})/) ? num.number.match(/\+1(\d{3})/)[1] : 'XXX';
        const timeAgo = getTimeAgo(num.timestamp);
        
        return `
            <div class="number-card" data-number="${num.number}" data-area="${areaCode}">
                <div class="number-main">
                    <span class="number-value">${formatNumber(num.number)}</span>
                    <span class="source-badge">${num.source}</span>
                </div>
                <div class="number-meta">
                    <span class="area-code">📞 Area: ${areaCode}</span>
                    <span>⏱️ ${timeAgo}</span>
                </div>
                <div class="number-actions">
                    <button class="action-btn copy" onclick="copyNumber('${num.number}', event)">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="action-btn monitor" onclick="openMonitor('${num.number}', event)">
                        <i class="fas fa-eye"></i> Monitor
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Format nomor untuk tampilan
function formatNumber(number) {
    // +1234567890 -> +1 (234) 567-890
    const match = number.match(/\+1(\d{3})(\d{3})(\d{4})/);
    if (match) {
        return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
    return number;
}

// Filter numbers berdasarkan search
function filterNumbers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm === '') {
        filteredNumbers = numbersData;
    } else {
        filteredNumbers = numbersData.filter(num => 
            num.number.includes(searchTerm) || 
            num.number.toLowerCase().includes(searchTerm) ||
            (num.number.match(/\+1(\d{3})/)?.[1] || '').includes(searchTerm)
        );
    }
    
    renderNumbers(filteredNumbers);
}

// Copy number ke clipboard
function copyNumber(number, event) {
    if (event) event.stopPropagation();
    
    navigator.clipboard.writeText(number).then(() => {
        showToast('✅ Number copied to clipboard!', 'success');
    }).catch(() => {
        showToast('❌ Failed to copy', 'error');
    });
}

// Open SMS monitor modal
function openMonitor(number, event) {
    if (event) event.stopPropagation();
    
    currentNumber = number;
    document.getElementById('modalNumber').textContent = formatNumber(number);
    document.getElementById('smsModal').style.display = 'block';
    
    // Reset messages
    document.getElementById('smsMessages').innerHTML = `
        <div class="sms-placeholder">
            <i class="far fa-comment-dots"></i>
            <p>Click "Start Monitoring" to check for SMS</p>
        </div>
    `;
}

// Close modal
function closeModal() {
    document.getElementById('smsModal').style.display = 'none';
    stopMonitoring();
}

// Start monitoring SMS
function startMonitoring() {
    const messagesDiv = document.getElementById('smsMessages');
    messagesDiv.innerHTML = '<div class="sms-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Monitoring started...</p></div>';
    
    // Simulate SMS monitoring
    let counter = 0;
    monitoringInterval = setInterval(() => {
        counter++;
        
        // Dummy SMS untuk demo
        const dummyMessages = [
            'Your verification code is: 123456',
            'G-123456 is your Google verification code',
            'Your WhatsApp code: 789012',
            'Facebook: 345678 is your login code',
            'Telegram code: 901234'
        ];
        
        const msgDiv = document.createElement('div');
        msgDiv.className = 'sms-message';
        msgDiv.innerHTML = `
            <div class="sms-time">${new Date().toLocaleTimeString()}</div>
            <div class="sms-text">📨 ${dummyMessages[Math.floor(Math.random() * dummyMessages.length)]}</div>
        `;
        
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        showToast('📨 New SMS received!', 'info');
    }, 10000); // Every 10 seconds
}

// Stop monitoring
function stopMonitoring() {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        
        const messagesDiv = document.getElementById('smsMessages');
        messagesDiv.innerHTML += '<div class="sms-message" style="background: #dc3545;">🛑 Monitoring stopped</div>';
    }
}

// Refresh numbers
function refreshNumbers() {
    showToast('🔄 Refreshing numbers...', 'info');
    loadNumbers();
}

// Auto refresh every 5 minutes
function setupAutoRefresh() {
    setInterval(() => {
        loadNumbers();
    }, 300000); // 5 minutes
}

// Update last update time
function updateLastUpdate(timestamp) {
    const date = new Date(timestamp);
    document.getElementById('lastUpdate').textContent = date.toLocaleString();
}

// Get time ago string
function getTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
}

// Show loading spinner
function showLoading(show) {
    // Implement if needed
}

// Show error message
function showError(message) {
    const grid = document.getElementById('numbersGrid');
    grid.innerHTML = `<div class="loading-spinner" style="color: #dc3545;">❌ ${message}</div>`;
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('smsModal');
    if (event.target == modal) {
        closeModal();
    }
}
