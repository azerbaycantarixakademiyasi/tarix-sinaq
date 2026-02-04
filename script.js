// 1. FİREBASE KONFİQURASİYASI (Buranı öz məlumatlarınla yoxla)
const firebaseConfig = {
    apiKey: "AIzaSyDulTEwR08ErC3J9uvjDHGJ1wxqTy91x1I",
    authDomain: "tarix-sinaq-db.firebaseapp.com",
    databaseURL: "https://tarix-sinaq-db-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tarix-sinaq-db",
    storageBucket: "tarix-sinaq-db.firebasestorage.app",
    messagingSenderId: "233204280838",
    appId: "1:233204280838:web:7d00c9800170a13ca45d87"
};

// Firebase-i başladırıq
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

let questions = []; // Yeni sınaq yaradarkən sualları toplamaq üçün

// 2. SƏHİFƏ YÜKLƏNƏNDƏ SESSİYA YOXIANIŞI
window.onload = () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        showQuizArea(JSON.parse(savedUser));
    }
};

// 3. GİRİŞ VƏ PANEL KEÇİD FUNKSİYALARI
window.loginStudent = () => {
    const user = document.getElementById('student-username').value.trim();
    const pass = document.getElementById('student-pass').value.trim();
    
    database.ref('students').once('value').then(snap => {
        let found = null;
        snap.forEach(c => {
            if (c.val().name === user && c.val().password === pass) found = c.val();
        });
        if (found) {
            localStorage.setItem('currentUser', JSON.stringify(found));
            showQuizArea(found);
        } else {
            alert("İstifadəçi adı və ya parol yanlışdır!");
        }
    });
};

window.checkAdmin = () => {
    const pass = document.getElementById('admin-password').value;
    if (pass === "12345") { // Admin şifrəsi
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        window.showTab('results-section');
    } else {
        alert("Admin şifrəsi yanlışdır!");
    }
};

window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(div => div.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
};

// 4. SINAQ YARATMA (ADMIN)
window.addQuestionField = () => {
    const qIndex = questions.length + 1;
    const qDiv = document.createElement('div');
    qDiv.className = "question-box";
    qDiv.style = "border:1px dashed #1a4e8a; padding:10px; margin-top:10px; border-radius:8px;";
    qDiv.innerHTML = `
        <label>Sual ${qIndex}:</label>
        <input type="text" placeholder="Sualı yazın" id="q-text-${qIndex}">
        <input type="text" placeholder="Düzgün cavab" id="q-ans-${qIndex}">
    `;
    document.getElementById('questions-area').appendChild(qDiv);
    questions.push(qIndex);
};

window.saveQuiz = () => {
    const title = document.getElementById('quiz-title').value;
    const time = document.getElementById('quiz-time').value;
    
    if (!title || questions.length === 0) {
        alert("Zəhmət olmasa başlıq və sualları daxil edin!");
        return;
    }

    let quizData = { title: title, time: time, questions: [] };
    questions.forEach(idx => {
        quizData.questions.push({
            q: document.getElementById(`q-text-${idx}`).value,
            a: document.getElementById(`q-ans-${idx}`).value
        });
    });

    database.ref('quizzes').push(quizData).then(() => {
        alert("Sınaq uğurla bazaya əlavə edildi!");
        location.reload();
    });
};

// 5. ŞAGİRD ƏLAVƏ ETMƏ (ADMIN)
window.addStudent = () => {
    const name = document.getElementById('new-std-name').value.trim();
    const pass = document.getElementById('new-std-pass').value.trim();

    if (name && pass) {
        database.ref('students').push({ name: name, password: pass }).then(() => {
            alert("Şagird siyahıya əlavə olundu!");
            document.getElementById('new-std-name').value = "";
            document.getElementById('new-std-pass').value = "";
        });
    } else {
        alert("Ad və parol boş ola bilməz!");
    }
};

// 6. KÖMƏKÇİ FUNKSİYALAR
function showQuizArea(user) {
    document.getElementById('login-screen').classList.add('hidden'); // Giriş ekranını gizlət
    document.getElementById('quiz-selection-area').classList.remove('hidden');
    document.getElementById('welcome-msg').innerText = "Xoş gəldin, " + user.name;
}

window.showAdminLogin = () => {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-login').classList.remove('hidden');
};

window.hideAdminLogin = () => {
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
};

window.logout = () => {
    localStorage.removeItem('currentUser');
    location.reload();
};
