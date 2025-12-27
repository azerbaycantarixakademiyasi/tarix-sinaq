// Firebase Konfiqurasiyası
const firebaseConfig = {
  apiKey: "AIzaSyDulTEwR08ErC3J9uvjDHGJ1wxqTy91x1I",
  authDomain: "tarix-sinaq-db.firebaseapp.com",
  databaseURL: "https://tarix-sinaq-db-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tarix-sinaq-db",
  storageBucket: "tarix-sinaq-db.firebasestorage.app",
  messagingSenderId: "233204280838",
  appId: "1:233204280838:web:7d00c9800170a13ca45d87"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

let activeQuizData = null;
let currentStudent = null;
let currentQuestionsCount = 0;
let timeLeft = 900;
let timerInterval;

// --- SƏHİFƏ YÜKLƏNƏNDƏ BƏRPA MƏNTİQİ ---
window.onload = function() {
    const isQuizRunning = localStorage.getItem('isQuizRunning');
    const savedStudent = localStorage.getItem('currentStudent');
    const savedQuizId = localStorage.getItem('selectedQuizId');

    if (isQuizRunning === "true" && savedStudent && savedQuizId) {
        currentStudent = JSON.parse(savedStudent);
        const savedTime = localStorage.getItem('timeLeft');
        if (savedTime) timeLeft = parseInt(savedTime);

        database.ref('quizzes/' + savedQuizId).once('value', (snap) => {
            activeQuizData = snap.val();
            if (activeQuizData) {
                resumeQuiz();
            } else {
                localStorage.clear();
            }
        });
    }
};

function resumeQuiz() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    document.getElementById('current-quiz-title').innerText = "Davam edir: " + activeQuizData.title;
    renderQuestions();
    timerInterval = setInterval(updateTimer, 1000);
}

// --- ŞAGİRD GİRİŞİ ---
function loginStudent() {
    const passInput = document.getElementById('student-pass').value.trim();
    if (!passInput) { alert("Parolu daxil edin!"); return; }

    database.ref('students').once('value').then((snapshot) => {
        let found = false;
        snapshot.forEach((child) => {
            const studentData = child.val();
            if (studentData.password === passInput) {
                currentStudent = { id: child.key, ...studentData };
                found = true;
            }
        });

        if (found) {
            document.getElementById('student-login-area').classList.add('hidden');
            document.getElementById('quiz-selection-area').classList.remove('hidden');
            document.getElementById('welcome-student').innerText = `Xoş gəldin, ${currentStudent.name}!`;
            loadAvailableQuizzes();
        } else {
            alert("Sistemdə belə bir parol tapılmadı!");
        }
    });
}

function loadAvailableQuizzes() {
    const select = document.getElementById('active-quizzes-select');
    database.ref('quizzes').on('value', (snap) => {
        select.innerHTML = '<option value="">-- Sınaq seçin --</option>';
        let count = 0;
        const finishedQuizzes = currentStudent.finishedQuizzes || {};

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

// --- SINAQ PROSESİ ---
function startQuiz() {
    const quizId = document.getElementById('active-quizzes-select').value;
    if (!quizId) { alert("Sınaq seçin!"); return; }

    database.ref('quizzes/' + quizId).once('value', (snap) => {
        activeQuizData = snap.val();
        
        // Yaddaşda saxla (Səhifə yenilənməsinə qarşı)
        localStorage.setItem('selectedQuizId', quizId);
        localStorage.setItem('isQuizRunning', "true");
        localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
        localStorage.setItem('timeLeft', timeLeft);

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
            <label style="display:block; margin:10px 0; cursor:pointer; padding:10px; border:1px solid #eee; border-radius:8px;">
                <input type="radio" name="q${index}" value="${v === q.dogru ? 1 : 0}" data-text="${v}"> ${v}
            </label>
        `).join("");
        qContainer.innerHTML += `
            <div class="question" style="background:#fff; padding:15px; border-radius:10px; margin-bottom:15px; border:1px solid #ddd;">
                <p><strong>${index+1}. ${q.sual}</strong></p>
                <div class="options">${optionsHtml}</div>
            </div>`;
    });
}

function updateTimer() {
    let min = Math.floor(timeLeft / 60);
    let sec = timeLeft % 60;
    document.getElementById('timer').innerText = `Qalan Vaxt: ${min}:${sec < 10 ? '0' : ''}${sec}`;
    
    localStorage.setItem('timeLeft', timeLeft); // Vaxtı hər saniyə yaddaşda yenilə

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

    database.ref('imtahan_neticeleri').push({
        adSoyad: currentStudent.name,
        duz: correctCount,
        sehv: questions.length - correctCount,
        tarix: new Date().toLocaleString(),
        sinaqAdi: activeQuizData.title
    });

    database.ref(`students/${currentStudent.id}/finishedQuizzes/${quizId}`).set(true).then(() => {
        // Sınaq bitdi, yaddaşı təmizlə
        localStorage.clear();
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('result-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = `Nəticəniz: ${correctCount} Düz, ${questions.length - correctCount} Səhv.`;
    });
}

// --- MÜƏLLİM PANELİ ---
function checkAdmin() {
    if (document.getElementById('admin-password').value === "nermine2025") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        loadResults();
    } else { alert("Yanlış parol!"); }
}

function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    event.currentTarget.classList.add('active');
    if(tabId === 'editor-tab') loadAllQuizzes();
    if(tabId === 'students-tab') loadStudentList();
}

function addNewStudent() {
    const name = document.getElementById('new-student-name').value.trim();
    const pass = document.getElementById('new-student-pass').value.trim();
    if(name && pass) {
        database.ref('students').push({ name: name, password: pass, finishedQuizzes: {} })
        .then(() => { 
            alert("Şagird əlavə olundu!"); 
            document.getElementById('new-student-name').value = "";
            document.getElementById('new-student-pass').value = "";
            loadStudentList(); 
        });
    }
}

function loadStudentList() {
    const display = document.getElementById('student-list-display');
    database.ref('students').on('value', snap => {
        display.innerHTML = "";
        snap.forEach(child => {
            const s = child.val();
            display.innerHTML += `<div class="quiz-card" style="padding:10px; border:1px solid #eee; margin-bottom:5px;">
                <span>${s.name} (Parol: <strong>${s.password}</strong>)</span>
            </div>`;
        });
    });
}

function loadAllQuizzes() {
    const list = document.getElementById('all-quizzes-list');
    database.ref('quizzes').on('value', snap => {
        list.innerHTML = "";
        snap.forEach(child => {
            const q = child.val();
            const qId = child.key;
            list.innerHTML += `
                <div class="quiz-card" style="display:flex; justify-content:space-between; padding:10px; background:#fff; margin-bottom:10px; border-radius:8px;">
                    <span>${q.title} (${q.status})</span>
                    <div>
                        <button onclick="toggleStatus('${qId}','${q.status}')" style="width:auto; padding:5px; background:#2ecc71;">Aktiv/Deaktiv</button>
                        <button onclick="deleteQuiz('${qId}')" style="width:auto; padding:5px; background:red;">Sil</button>
                    </div>
                </div>`;
        });
    });
}

function deleteQuiz(id) {
    if(confirm("Silinsin?")) database.ref(`quizzes/${id}`).remove();
}

function toggleStatus(id, current) {
    database.ref(`quizzes/${id}/status`).set(current === "active" ? "inactive" : "active");
}

function addNewQuestionRow() {
    currentQuestionsCount++;
    const container = document.getElementById('question-inputs');
    const div = document.createElement('div');
    div.className = 'q-row';
    const radioName = `correct_${currentQuestionsCount}`;
    div.innerHTML = `
        <input type="text" class="q-text" placeholder="Sual" style="width:100%; margin-bottom:5px;">
        <div style="display:flex; gap:10px;"><input type="radio" name="${radioName}" value="A" checked><input type="text" class="opt-a" placeholder="A variantı" style="flex:1;"></div>
        <div style="display:flex; gap:10px;"><input type="radio" name="${radioName}" value="B"><input type="text" class="opt-b" placeholder="B variantı" style="flex:1;"></div>
        <div style="display:flex; gap:10px;"><input type="radio" name="${radioName}" value="C"><input type="text" class="opt-c" placeholder="C variantı" style="flex:1;"></div>
    `;
    container.appendChild(div);
}

function saveNewQuiz() {
    const title = document.getElementById('new-quiz-name').value.trim();
    if (!title) { alert("Ad ver!"); return; }
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
    database.ref('quizzes').push({ title, questions, status: "inactive" }).then(() => {
        alert("Yaratıldı!");
        document.getElementById('question-inputs').innerHTML = "";
    });
}

function loadResults() {
    const b = document.getElementById('results-body');
    database.ref('imtahan_neticeleri').on('value', s => {
        b.innerHTML = "";
        s.forEach(c => { 
            const v = c.val(); 
            b.innerHTML += `<tr><td>${v.adSoyad}</td><td>${v.duz}</td><td>${v.sehv}</td><td><small>${v.tarix}</small></td></tr>`; 
        });
    });
}

function clearAllResults() { if(confirm("Silinsin?")) database.ref('imtahan_neticeleri').set(null); }
function showLogin() { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); }
function hideLogin() { document.getElementById('admin-login').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }
function logoutAdmin() { location.reload(); }
