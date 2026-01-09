// ==========================================
// 1. KONFIGURASI & STATE AWAL
// ==========================================
let currentUser = localStorage.getItem('currentUser');
let schedules = JSON.parse(localStorage.getItem('schedules')) || [];
let userDatabase = JSON.parse(localStorage.getItem('userDatabase')) || {};

// Cek apakah user sudah login saat aplikasi dibuka
if (currentUser) {
    showDashboard();
}

// ==========================================
// 2. SISTEM AUTENTIKASI (LOGIN/REGISTER)
// ==========================================

// Pindah antara Login dan Register
function toggleAuth(view) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (view === 'register') {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    } else {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    }
}

// Proses Register
function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-user').value.trim();
    const password = document.getElementById('reg-pass').value;

    if (!username || !password) return showToast('Isi semua kolom!', 'error');

    if (userDatabase[username]) {
        showToast('Username sudah dipakai!', 'error');
        return;
    }

    // Simpan ke database lokal
    userDatabase[username] = password;
    localStorage.setItem('userDatabase', JSON.stringify(userDatabase));

    showToast('Akun berhasil dibuat! Silakan login.', 'success');
    toggleAuth('login');
    
    // Reset form register
    e.target.reset();
}

// Proses Login
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-user').value.trim();
    const password = document.getElementById('login-pass').value;

    if (!userDatabase[username]) {
        showToast('Akun belum terdaftar! Klik Daftar.', 'error');
        return;
    }

    if (userDatabase[username] === password) {
        localStorage.setItem('currentUser', username);
        currentUser = username;
        showDashboard();
        showToast(`Selamat datang, ${username}!`, 'success');
    } else {
        showToast('Password salah!', 'error');
    }
}

// Proses Logout
function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

// Menampilkan Dashboard
function showDashboard() {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('user-display').innerText = `Halo, ${currentUser}`;
    renderSchedule();
    updateClock();
}

// ==========================================
// 3. MANAJEMEN JADWAL (CRUD)
// ==========================================

function addClass(e) {
    e.preventDefault();
    const newClass = {
        id: Date.now(),
        name: document.getElementById('class-name').value,
        room: document.getElementById('class-room').value,
        day: document.getElementById('class-day').value,
        time: document.getElementById('class-time').value,
        user: currentUser // Penting: Menandai pemilik jadwal
    };

    schedules.push(newClass);
    saveData();
    renderSchedule();
    e.target.reset();
    showToast('Jadwal berhasil ditambahkan!', 'success');
}

function deleteClass(id) {
    if(confirm('Yakin ingin menghapus jadwal ini?')) {
        schedules = schedules.filter(s => s.id !== id);
        saveData();
        renderSchedule();
        showToast('Jadwal dihapus.', 'info');
    }
}

function saveData() {
    localStorage.setItem('schedules', JSON.stringify(schedules));
}

function renderSchedule() {
    const container = document.getElementById('schedule-list');
    container.innerHTML = '';

    // Filter jadwal user aktif
    const mySchedules = schedules.filter(s => s.user === currentUser);

    // Sorting: Senin -> Minggu, Pagi -> Sore
    const daysOrder = { "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jumat": 5, "Sabtu": 6, "Minggu": 7 };
    mySchedules.sort((a, b) => {
        if (daysOrder[a.day] !== daysOrder[b.day]) return daysOrder[a.day] - daysOrder[b.day];
        return a.time.localeCompare(b.time);
    });

    if (mySchedules.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 mt-10">
                <i class="fas fa-clipboard-list text-4xl mb-3"></i>
                <p>Belum ada jadwal. Yuk tambah jadwal!</p>
            </div>`;
        return;
    }

    mySchedules.forEach(item => {
        const card = document.createElement('div');
        card.className = "bg-gray-50 hover:bg-white border border-gray-200 p-4 rounded-xl flex justify-between items-center transition shadow-sm hover:shadow-md mb-3";
        card.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                    ${item.day.substring(0, 3)}
                </div>
                <div>
                    <h4 class="font-bold text-gray-800 text-lg">${item.name}</h4>
                    <div class="text-sm text-gray-500 flex gap-3 mt-1">
                        <span><i class="far fa-clock mr-1"></i>${item.time} WIB</span>
                        <span><i class="fas fa-map-marker-alt mr-1"></i>${item.room}</span>
                    </div>
                </div>
            </div>
            <button onclick="deleteClass(${item.id})" class="text-gray-400 hover:text-red-500 transition p-2 bg-white rounded-full shadow-sm border border-gray-100">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(card);
    });
}

// ==========================================
// 4. JAM & NOTIFIKASI
// ==========================================

let lastNotifiedTime = "";

function updateClock() {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    // Update Tampilan Jam
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('clock-display').innerText = timeString;
    
    // Update Tampilan Tanggal
    const dateString = `${days[now.getDay()]}, ${now.getDate()} ${now.toLocaleDateString('id-ID', { month: 'long' })}`;
    document.getElementById('date-display').innerText = dateString;

    if(currentUser) {
        checkScheduleNotification(now, days[now.getDay()]);
    }
}

// Jalankan fungsi updateClock setiap 1 detik
setInterval(updateClock, 1000);

function checkScheduleNotification(now, currentDay) {
    // Ambil jam sekarang format HH:MM
    const currentTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
    
    if (currentTime === lastNotifiedTime) return; // Mencegah spam notif di menit yang sama

    const mySchedules = schedules.filter(s => s.user === currentUser);
    
    mySchedules.forEach(item => {
        if (item.day === currentDay && item.time === currentTime) {
            sendNotification(`🔔 Waktunya Kuliah!`, `${item.name} di Ruang ${item.room}`);
            lastNotifiedTime = currentTime;
        }
    });
}

function requestNotification() {
    if (!("Notification" in window)) {
        alert("Browser tidak mendukung notifikasi.");
    } else {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                const btn = document.getElementById('notif-btn');
                btn.innerText = "Notifikasi Aktif";
                btn.className = "text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold";
                showToast('Notifikasi berhasil diaktifkan!', 'success');
            }
        });
    }
}

function sendNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { 
            body: body,
            icon: "https://cdn-icons-png.flaticon.com/512/2991/2991195.png"
        });
    } else {
        showToast(`${title}: ${body}`, 'info');
    }
}

// ==========================================
// 5. UTILITY: TOAST (POPUP PESAN)
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let bgClass = 'bg-indigo-600';
    if(type === 'success') bgClass = 'bg-green-500';
    if(type === 'error') bgClass = 'bg-red-500';
    
    toast.className = `${bgClass} text-white px-6 py-3 rounded-lg shadow-lg mb-3 flex items-center gap-3 fade-in transform transition-all duration-300`;
    toast.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    // Hapus otomatis setelah 3 detik
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}