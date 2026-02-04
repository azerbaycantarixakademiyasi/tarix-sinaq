// 1. Firebase Konfiqurasiyası
const firebaseConfig = {
    apiKey: "AIzaSyDulTEwR08ErC3J9uvjDHGJ1wxqTy91x1I",
    authDomain: "tarix-sinaq-db.firebaseapp.com",
    databaseURL: "https://tarix-sinaq-db-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tarix-sinaq-db",
    storageBucket: "tarix-sinaq-db.firebasestorage.app",
    messagingSenderId: "233204280838",
    appId: "1:233204280838:web:7d00c9800170a13ca45d87"
};

// Firebase-i başlat
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// 2. Dil Tərcümələri
const t = {
    az: { title: "Nərminə Əmirbəyovanın sınaq portalı", welcome: "Xoş gəldin", wait: "Giriş gözlənilir...", wrong: "Məlumatlar səhvdir!" },
    ru: { title: "Экзаменационный портал Нармины Амирбековой", welcome: "Добро пожаловать", wait: "Ожидание входа...", wrong: "Неверные данные!" }
};

let currentLang = localStorage.getItem('lang') || 'az';

window.onload = () => {
    applyLanguage(currentLang);
    checkSession();
};

window.changeLang = (lang) => {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyLanguage(lang);
};

function applyLanguage(lang) {
    document.getElementById('h1-title').innerText = t[lang].title;
    document.getElementById('p-status').innerText = t[lang].wait;
}

// 3. Giriş-Çıxış Funksiyaları
window.loginStudent = () => {
    const user = document.getElementById('student-username').value;
    const pass = document.getElementById('student-pass').value;
    
    database.ref('students').once('value').then(snap => {
        let found = null;
        snap.forEach(c => {
            if(c.val().name === user && c.val().password === pass) found = c.val();
        });
        if(found) {
            localStorage.setItem('currentUser', JSON.stringify(found));
            showQuizArea(found);
        } else { alert(t[currentLang].wrong); }
    });
};

window.showAdminLogin = () => {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-login').classList.remove('hidden');
};

window.hideAdminLogin = () => {
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
};

window.checkAdmin = () => {
    const pass = document.getElementById('admin-password').value;
    if(pass === "12345") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
    } else { alert("Səhv şifrə!"); }
};

function showQuizArea(user) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('quiz-selection-area').classList.remove('hidden');
    document.getElementById('welcome-msg').innerText = `${t[currentLang].welcome}, ${user.name}`;
}

function checkSession() {
    const user = localStorage.getItem('currentUser');
    if(user) showQuizArea(JSON.parse(user));
}

window.logout = () => {
    localStorage.removeItem('currentUser');
    location.reload();
};
