// ==========================================
// 1. KONFIGURASI & STATE AWAL
// ==========================================
let currentUser = localStorage.getItem('currentUser');
let schedules = JSON.parse(localStorage.getItem('schedules')) || [];
let userDatabase = JSON.parse(localStorage.getItem('userDatabase')) || {};

if (currentUser) {
    showDashboard();
}

// ==========================================
// 2. SISTEM AUTENTIKASI
// ==========================================
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

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-user').value.trim();
    const password = document.getElementById('reg-pass').value;

    if (!username || !password) return showToast('Isi semua kolom!', 'error');
    if (userDatabase[username]) return showToast('Username sudah dipakai!', 'error');

    userDatabase[username] = password;
    localStorage.setItem('userDatabase', JSON.stringify(userDatabase));

    showToast('Akun berhasil dibuat! Silakan login.', 'success');
    toggleAuth('login');
    e.target.reset();
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-user').value.trim();
    const password = document.getElementById('login-pass').value;

    if (!userDatabase[username]) return showToast('Akun belum terdaftar! Klik Daftar.', 'error');

    if (userDatabase[username] === password) {
        localStorage.setItem('currentUser', username);
        currentUser = username;
        showDashboard();
        showToast(`Selamat datang, ${username}!`, 'success');
    } else {
        showToast('Password salah!', 'error');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

function showDashboard() {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
    
    document.getElementById('user-display').innerText = `Halo, ${currentUser}`;
    
    const bannerHeading = document.getElementById('welcome-heading');
    if (bannerHeading) bannerHeading.innerText = `Halo, ${currentUser}!`;

    renderSchedule();
    updateClock();
}

// ==========================================
// 3. MANAJEMEN JADWAL (CRUD)
// ==========================================

function addClass(e) {
    e.preventDefault();
    
    const startTime = document.getElementById('class-start-time').value;
    const endTime = document.getElementById('class-end-time').value;

    // Validasi: Jam Selesai tidak boleh lebih kecil dari Jam Masuk
    if (endTime <= startTime) {
        return showToast('Jam Selesai harus lebih akhir dari Jam Masuk!', 'error');
    }

    const newClass = {
        id: Date.now(),
        name: document.getElementById('class-name').value,
        lecturer: document.getElementById('class-lecturer').value,
        room: document.getElementById('class-room').value,
        day: document.getElementById('class-day').value,
        semester: document.getElementById('class-semester').value, // Simpan Semester
        startTime: startTime, // Simpan Waktu Masuk
        endTime: endTime,     // Simpan Waktu Selesai
        notes: document.getElementById('class-notes').value,
        user: currentUser 
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

    const mySchedules = schedules.filter(s => s.user === currentUser);

    const daysOrder = { "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jumat": 5, "Sabtu": 6, "Minggu": 7 };
    
    // Urutkan berdasarkan Hari, lalu berdasarkan Jam Masuk
    mySchedules.sort((a, b) => {
        if (daysOrder[a.day] !== daysOrder[b.day]) return daysOrder[a.day] - daysOrder[b.day];
        return a.startTime.localeCompare(b.startTime);
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
        const notesHtml = item.notes 
            ? `<div class="mt-3 text-xs bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-200">
                 <i class="fas fa-sticky-note mr-1"></i> <b>Catatan:</b> ${item.notes}
               </div>` 
            : '';

        const lecturerHtml = item.lecturer 
            ? `<div class="text-sm text-gray-600 mb-1"><i class="fas fa-chalkboard-teacher mr-1 text-indigo-400"></i> ${item.lecturer}</div>`
            : '';

        const card = document.createElement('div');
        card.className = "bg-gray-50 hover:bg-white border border-gray-200 p-4 rounded-xl flex justify-between items-start transition shadow-sm hover:shadow-md mb-3";
        
        // TAMPILAN KARTU (Semester & Range Waktu)
        card.innerHTML = `
            <div class="flex items-start gap-4 w-full">
                <div class="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg mt-1">
                    ${item.day.substring(0, 3)}
                </div>
                <div class="w-full">
                    <div class="flex justify-between items-start">
                        <h4 class="font-bold text-gray-800 text-lg leading-tight">${item.name}</h4>
                        <span class="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">
                            Sem. ${item.semester}
                        </span>
                    </div>
                    
                    ${lecturerHtml}

                    <div class="text-sm text-gray-500 flex flex-wrap gap-3 mt-1 items-center">
                        <span class="bg-white border border-gray-300 px-2 py-0.5 rounded text-xs font-semibold text-gray-700 shadow-sm">
                            <i class="far fa-clock mr-1 text-indigo-500"></i>${item.startTime} - ${item.endTime}
                        </span>
                        <span><i class="fas fa-map-marker-alt mr-1"></i>${item.room}</span>
                    </div>

                    ${notesHtml}
                </div>
            </div>
            <button onclick="deleteClass(${item.id})" class="text-gray-400 hover:text-red-500 transition p-2 ml-2">
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
    
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('clock-display').innerText = timeString;
    
    const dateString = `${days[now.getDay()]}, ${now.getDate()} ${now.toLocaleDateString('id-ID', { month: 'long' })}`;
    document.getElementById('date-display').innerText = dateString;

    if(currentUser) checkScheduleNotification(now, days[now.getDay()]);
}

setInterval(updateClock, 1000);

function checkScheduleNotification(now, currentDay) {
    const currentTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
    if (currentTime === lastNotifiedTime) return; 

    const mySchedules = schedules.filter(s => s.user === currentUser);
    
    mySchedules.forEach(item => {
        // Notifikasi berbunyi saat JAM MASUK (startTime)
        if (item.day === currentDay && item.startTime === currentTime) {
            sendNotification(`🔔 Masuk Kuliah!`, `${item.name} dimulai pukul ${item.startTime}`);
            lastNotifiedTime = currentTime;
        }
    });
}

function requestNotification() {
    if (!("Notification" in window)) return alert("Browser tidak support notifikasi.");
    Notification.requestPermission().then(permission => {
        if (permission === "granted") showToast('Notifikasi Aktif!', 'success');
    });
}

function sendNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body: body, icon: "https://cdn-icons-png.flaticon.com/512/2991/2991195.png" });
    } else {
        showToast(`${title}: ${body}`, 'info');
    }
}

// ==========================================
// 5. UTILITY: TOAST
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let bgClass = type === 'success' ? 'bg-green-500' : (type === 'error' ? 'bg-red-500' : 'bg-indigo-600');
    
    toast.className = `${bgClass} text-white px-6 py-3 rounded-lg shadow-lg mb-3 flex items-center gap-3 fade-in`;
    toast.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => { toast.remove() }, 3000);
}
