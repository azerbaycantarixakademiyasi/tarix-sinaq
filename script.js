// 1. DİL OBYEKTİ (Olduğu kimi qalır)
const translations = {
    az: { title: "Nərminə Əmirbəyovanın sınaq portalı", waiting: "Giriş gözlənilir...", userPlace: "İstifadəçi adınız", passPlace: "Parolunuzu daxil edin", loginBtn: "Giriş et", adminBtn: "Müəllim Girişi", welcome: "Xoş gəldin", selectQuiz: "-- Sınaq seçin --", startBtn: "Sınağa Başla", logout: "Çıxış", adminTitle: "Müəllim Girişi", adminPass: "Admin Parolu", adminEnter: "Daxil ol", back: "Geri", resTitle: "Şagird Nəticələri", clear: "Təmizlə", wrong: "Məlumatlar yanlışdır!" },
    ru: { title: "Экзаменационный портал Нармины Амирбековой", waiting: "Ожидание входа...", userPlace: "Имя пользователя", passPlace: "Введите пароль", loginBtn: "Войти", adminBtn: "Вход для учителя", welcome: "Добро пожаловать", selectQuiz: "-- Выберите тест --", startBtn: "Начать тест", logout: "Выход", adminTitle: "Вход для учителя", adminPass: "Пароль админа", adminEnter: "Войти", back: "Назад", resTitle: "Результаты учеников", clear: "Очистить", wrong: "Неверные данные!" }
};

// 2. FİREBASE BAŞLATMA (Xətanı bura düzəldir)
const firebaseConfig = {
    apiKey: "AIzaSyDulTEwR08ErC3J9uvjDHGJ1wxqTy91x1I",
    authDomain: "tarix-sinaq-db.firebaseapp.com",
    databaseURL: "https://tarix-sinaq-db-default-rtdb.europe-west1.firebasedatabase.app", // <--- BU SƏTİR MÜTLƏQDİR!
    projectId: "tarix-sinaq-db",
    storageBucket: "tarix-sinaq-db.firebasestorage.app",
    messagingSenderId: "233204280838",
    appId: "1:233204280838:web:7d00c9800170a13ca45d87"
};

// Firebase-i başlat və yoxla
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

let currentLang = localStorage.getItem('lang') || 'az';

// 3. ƏSAS FUNKSİYALAR (Global sahədə olmalıdırlar)
window.onload = () => {
    applyLanguage(currentLang);
    checkSession();
};

window.changeLang = function(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyLanguage(lang);
};

window.applyLanguage = function(lang) {
    const t = translations[lang];
    document.querySelector('h1').innerText = t.title;
    const statusText = document.getElementById('status-text');
    if(statusText) statusText.innerText = t.waiting;
    document.getElementById('student-username').placeholder = t.userPlace;
    document.getElementById('student-pass').placeholder = t.passPlace;
    document.getElementById('btn-login').innerText = t.loginBtn;
    document.getElementById('btn-admin-view').innerText = t.adminBtn;
    document.getElementById('admin-login-title').innerText = t.adminTitle;
    document.getElementById('admin-password').placeholder = t.adminPass;
    document.getElementById('btn-admin-enter').innerText = t.adminEnter;
    document.getElementById('btn-back').innerText = t.back;
};

// Şagird Girişi
window.loginStudent = function() {
    const user = document.getElementById('student-username').value.trim();
    const pass = document.getElementById('student-pass').value.trim();
    
    database.ref('students').once('value').then(snap => {
        let found = null;
        snap.forEach(c => {
            if(c.val().name === user && c.val().password === pass) found = c.val();
        });
        if(found) {
            localStorage.setItem('currentUser', JSON.stringify(found));
            showQuizArea(found);
        } else { alert(translations[currentLang].wrong); }
    });
};

// Admin Girişi (Console-dakı xətanı bu düzəldir)
window.checkAdmin = function() {
    const pass = document.getElementById('admin-password').value;
    if(pass === "12345") { // Buranı öz şifrən et
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
    } else {
        alert("Səhv şifrə!");
    }
};

window.showAdminLogin = function() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-login').classList.remove('hidden');
};

window.hideLogin = function() {
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
};

function showQuizArea(user) {
    document.getElementById('student-login-area').classList.add('hidden');
    document.getElementById('quiz-selection-area').classList.remove('hidden');
    document.getElementById('welcome-student').innerText = `${translations[currentLang].welcome}, ${user.name}`;
}

function checkSession() {
    const user = localStorage.getItem('currentUser');
    if(user) showQuizArea(JSON.parse(user));
}

window.logout = function() {
    localStorage.removeItem('currentUser');
    location.reload();
};
