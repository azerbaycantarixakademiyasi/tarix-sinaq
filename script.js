const translations = {
    az: {
        title: "Nərminə Əmirbəyovanın sınaq portalı",
        waiting: "Giriş gözlənilir...",
        userPlace: "İstifadəçi adınız",
        passPlace: "Parolunuzu daxil edin",
        loginBtn: "Giriş et",
        adminBtn: "Müəllim Girişi",
        welcome: "Xoş gəldin",
        selectQuiz: "-- Sınaq seçin --",
        startBtn: "Sınağa Başla",
        logout: "Çıxış",
        adminTitle: "Müəllim Girişi",
        adminPass: "Admin Parolu",
        adminEnter: "Daxil ol",
        back: "Geri",
        resTitle: "Şagird Nəticələri",
        clear: "Təmizlə"
    },
    ru: {
        title: "Экзаменационный портал Нармины Амирбековой",
        waiting: "Ожидание входа...",
        userPlace: "Имя пользователя",
        passPlace: "Введите пароль",
        loginBtn: "Войти",
        adminBtn: "Вход для учителя",
        welcome: "Добро пожаловать",
        selectQuiz: "-- Выберите тест --",
        startBtn: "Начать тест",
        logout: "Выход",
        adminTitle: "Вход для учителя",
        adminPass: "Пароль админа",
        adminEnter: "Войти",
        back: "Назад",
        resTitle: "Результаты учеников",
        clear: "Очистить"
    }
};

// Firebase konfiqurasiyanı bura yapışdır
const firebaseConfig = { /* Sənin köhnə config kodun */ };
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let currentLang = localStorage.getItem('lang') || 'az';

window.onload = () => {
    applyLanguage(currentLang);
    checkSession();
};

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyLanguage(lang);
}

function applyLanguage(lang) {
    const t = translations[lang];
    document.querySelector('h1').innerText = t.title;
    document.getElementById('status-text').innerText = t.waiting;
    document.getElementById('student-username').placeholder = t.userPlace;
    document.getElementById('student-pass').placeholder = t.passPlace;
    document.getElementById('btn-login').innerText = t.loginBtn;
    document.getElementById('btn-admin-view').innerText = t.adminBtn;
    document.getElementById('admin-login-title').innerText = t.adminTitle;
    document.getElementById('admin-password').placeholder = t.adminPass;
    document.getElementById('btn-admin-enter').innerText = t.adminEnter;
    document.getElementById('btn-back').innerText = t.back;
    document.getElementById('opt-select-quiz').innerText = t.selectQuiz;
    document.getElementById('btn-start').innerText = t.startBtn;
    document.getElementById('res-title').innerText = t.resTitle;
    document.getElementById('btn-clear').innerText = t.clear;
    document.querySelectorAll('.secondary-btn, .btn-logout').forEach(b => b.innerText = t.logout);
}

function checkSession() {
    const user = localStorage.getItem('currentUser');
    if(user) showQuizArea(JSON.parse(user));
}

function loginStudent() {
    const user = document.getElementById('student-username').value;
    const pass = document.getElementById('student-pass').value;
    database.ref('students').once('value').then(snap => {
        let found = null;
        snap.forEach(c => { if(c.val().name === user && c.val().password === pass) found = c.val(); });
        if(found) {
            localStorage.setItem('currentUser', JSON.stringify(found));
            showQuizArea(found);
        } else { alert("Xəta / Ошибка"); }
    });
}

function showQuizArea(user) {
    document.getElementById('student-login-area').classList.add('hidden');
    document.getElementById('quiz-selection-area').classList.remove('hidden');
    document.getElementById('welcome-student').innerText = `${translations[currentLang].welcome}, ${user.name}`;
}

function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

function showAdminLogin() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-login').classList.remove('hidden');
}

function hideLogin() {
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}
