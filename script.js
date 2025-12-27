const firebaseConfig = {
  apiKey: "AIzaSyDulTEwR08ErC3J9uvjDHGJ1wxqTy91x1I",
  authDomain: "tarix-sinaq-db.firebaseapp.com",
  databaseURL: "https://tarix-sinaq-db-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tarix-sinaq-db",
  storageBucket: "tarix-sinaq-db.firebasestorage.app",
  messagingSenderId: "233204280838",
  appId: "1:233204280838:web:7d00c9800170a13ca45d87"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let activeQuizData = null;
let currentStudent = null;
let currentQuestionsCount = 0;
let timeLeft = 900;
let timerInterval;

// SƏHİFƏ YÜKLƏNƏNDƏ
window.onload = function() {
    // Şagird hələ giriş etməyib, gözləyirik.
};

// --- ŞAGİRD PAROL GİRİŞİ ---
function loginStudent() {
    const pass = document.getElementById('student-pass').value.trim();
    if (!pass) { alert("Parol daxil edin!"); return; }

    database.ref('students').once('value', (snapshot) => {
        let found = false;
        snapshot.forEach((child) => {
            if (child.val().password === pass) {
                currentStudent = { id: child.key, ...child.val() };
                found = true;
            }
        });

        if (found) {
            document.getElementById('student-login-area').classList.add('hidden');
            document.getElementById('quiz-selection-area').classList.remove('hidden');
            document.getElementById('welcome-student').innerText = `Xoş gəldin, ${currentStudent.name}!`;
            loadAvailableQuizzes();
        } else {
            alert("Parol yanlışdır!");
        }
    });
}

// ŞAGİRD ÜÇÜN TESTLƏRİ YÜKLƏ (BİTMİŞLƏRİ GİZLƏ)
function loadAvailableQuizzes() {
    const select = document.getElementById('active-quizzes-select');
    const finishedQuizzes = currentStudent.finishedQuizzes || {};

    database.ref('quizzes').on('value', (snap) => {
        select.innerHTML = '<option value="">-- Sınaq seçin --</option>';
        let count = 0;
        snap.forEach((child) => {
            const quiz = child.val();
            if (quiz.status === "active" && !finishedQuizzes[child.key]) {
                select.innerHTML += `<option value="${child.key}">${quiz.title}</option>`;
                count++;
            }
        });
        if (count === 0) select.innerHTML = '<option value="">Sizin üçün aktiv sınaq yoxdur.</option>';
    });
}

// SINAĞA BAŞLA
function startQuiz() {
    const quizId = document.getElementById('active-quizzes-select').value;
    if (!quizId) { alert("Sınaq seçin!"); return; }

    database.ref('quizzes/' + quizId).once('value', (snap) => {
        activeQuizData = snap.val();
        localStorage.setItem('selectedQuizId', quizId);
        
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.remove('hidden');
        document.getElementById('current-quiz-title').innerText = activeQuizData.title;
        
        renderQuestions();
        timerInterval = setInterval(updateTimer, 1000);
    });
}

function renderQuestions() {
    const qContainer = document.getElementById('dynamic-questions');
    qContainer.innerHTML = "";
    activeQuizData.questions.forEach((q, index) => {
        let optionsHtml = q.variantlar.map(v => `
            <label><input type="radio" name="q${index}" value="${v === q.dogru ? 1 : 0}" data-text="${v}"> ${v}</label>
        `).join("");
        qContainer.innerHTML += `<div class="question"><p>${index+1}. ${q.sual}</p><div class="options">${optionsHtml}</div></div>`;
    });
}

function updateTimer() {
    let min = Math.floor(timeLeft / 60); let sec = timeLeft % 60;
    document.getElementById('timer').innerText = `Qalan Vaxt: ${min}:${sec < 10 ? '0' : ''}${sec}`;
    if (timeLeft-- <= 0) finishQuiz();
}

function finishQuiz() {
    clearInterval(timerInterval);
    let correctCount = 0;
    const questions = activeQuizData.questions;
    const quizId = localStorage.getItem('selectedQuizId');

    questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        if (selected && parseInt(selected.value) === 1) correctCount++;
    });

    // 1. Nəticəni yaz
    database.ref('imtahan_neticeleri').push({
        adSoyad: currentStudent.name,
        duz: correctCount,
        sehv: questions.length - correctCount,
        tarix: new Date().toLocaleString(),
        sinaqAdi: activeQuizData.title
    });

    // 2. Şagirdin testi bitirdiyini qeyd et
    database.ref(`students/${currentStudent.id}/finishedQuizzes/${quizId}`).set(true).then(() => {
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('result-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = `${correctCount} Düz, ${questions.length - correctCount} Səhv.`;
    });
}

// --- ADMİN PANEL FUNKSİYALARI ---
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    event.currentTarget.classList.add('active');
    if(tabId === 'editor-tab') loadAllQuizzes();
    if(tabId === 'students-tab') loadStudentList();
}

function addNewStudent() {
    const name = document.getElementById('new-student-name').value;
    const pass = document.getElementById('new-student-pass').value;
    if(name && pass) {
        database.ref('students').push({ name, password: pass, finishedQuizzes: {} })
        .then(() => { alert("Şagird əlavə olundu!"); loadStudentList(); });
    }
}

function loadStudentList() {
    const display = document.getElementById('student-list-display');
    database.ref('students').on('value', snap => {
        display.innerHTML = "";
        snap.forEach(child => {
            const s = child.val();
            display.innerHTML += `<div class="quiz-card"><span>${s.name} (Parol: ${s.password})</span></div>`;
        });
    });
}

// (Digər sınaq hazırlama və admin giriş funksiyaları əvvəlki kimi qalır)
function checkAdmin() {
    if (document.getElementById('admin-password').value === "nermine2025") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        loadResults();
    } else { alert("Yanlış!"); }
}

function addNewQuestionRow() {
    currentQuestionsCount++;
    const container = document.getElementById('question-inputs');
    const div = document.createElement('div');
    div.className = 'q-row';
    const radioName = `correct_${currentQuestionsCount}`;
    div.innerHTML = `
        <input type="text" class="q-text" placeholder="Sual">
        <div style="display:flex; gap:10px;"><input type="radio" name="${radioName}" value="A" checked><input type="text" class="opt-a" placeholder="A variantı"></div>
        <div style="display:flex; gap:10px;"><input type="radio" name="${radioName}" value="B"><input type="text" class="opt-b" placeholder="B variantı"></div>
        <div style="display:flex; gap:10px;"><input type="radio" name="${radioName}" value="C"><input type="text" class="opt-c" placeholder="C variantı"></div>
    `;
    container.appendChild(div);
}

function saveNewQuiz() {
    const title = document.getElementById('new-quiz-name').value;
    const qRows = document.querySelectorAll('.q-row');
    let questions = [];
    qRows.forEach((row, i) => {
        const sel = row.querySelector(`input[name="correct_${i+1}"]:checked`).value;
        const a = row.querySelector('.opt-a').value;
        const b = row.querySelector('.opt-b').value;
        const c = row.querySelector('.opt-c').value;
        questions.push({
            sual: row.querySelector('.q-text').value,
            dogru: (sel==="A"?a:sel==="B"?b:c),
            variantlar: [a, b, c].sort(() => Math.random() - 0.5)
        });
    });
    database.ref('quizzes').push({ title, questions, status: "inactive" }).then(() => alert("Yadda saxlanıldı!"));
}

function loadAllQuizzes() {
    const list = document.getElementById('all-quizzes-list');
    database.ref('quizzes').on('value', snap => {
        list.innerHTML = "";
        snap.forEach(child => {
            const q = child.val();
            list.innerHTML += `<div class="quiz-card"><span>${q.title}</span><button onclick="toggleStatus('${child.key}','${q.status}')">${q.status==="active"?'Deaktiv':'Aktiv'}</button></div>`;
        });
    });
}
function toggleStatus(id, s) { database.ref(`quizzes/${id}/status`).set(s==="active"?"inactive":"active"); }
function loadResults() {
    database.ref('imtahan_neticeleri').on('value', s => {
        const b = document.getElementById('results-body'); b.innerHTML = "";
        s.forEach(c => { const v = c.val(); b.innerHTML += `<tr><td>${v.adSoyad}</td><td>${v.duz}</td><td>${v.sehv}</td><td>${v.tarix}</td></tr>`; });
    });
}
function clearAllResults() { database.ref('imtahan_neticeleri').set(null); }
function showLogin() { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); }
function hideLogin() { document.getElementById('admin-login').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }
function logoutAdmin() { location.reload(); }
