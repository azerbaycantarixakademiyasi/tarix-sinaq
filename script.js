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
let timeLeft = 0;
let timerInterval;

// SƏHİFƏ YÜKLƏNƏNDƏ BƏRPA ET
window.onload = function() {
    const isRunning = localStorage.getItem('isQuizRunning');
    const savedStud = localStorage.getItem('currentStudent');
    const savedQId = localStorage.getItem('selectedQuizId');

    if (isRunning === "true" && savedStud && savedQId) {
        currentStudent = JSON.parse(savedStud);
        timeLeft = parseInt(localStorage.getItem('timeLeft'));
        database.ref('quizzes/' + savedQId).once('value', (snap) => {
            activeQuizData = snap.val();
            resumeQuiz();
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

// ŞAGİRD GİRİŞİ
function loginStudent() {
    const pass = document.getElementById('student-pass').value.trim();
    database.ref('students').once('value').then((snapshot) => {
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
        } else { alert("Yanlış parol!"); }
    });
}

function loadAvailableQuizzes() {
    const select = document.getElementById('active-quizzes-select');
    database.ref('quizzes').on('value', (snap) => {
        select.innerHTML = '<option value="">-- Sınaq seçin --</option>';
        const finished = currentStudent.finishedQuizzes || {};
        snap.forEach((child) => {
            const q = child.val();
            if (q.status === "active" && !finished[child.key]) {
                select.innerHTML += `<option value="${child.key}">${q.title} (${q.sure} dəq)</option>`;
            }
        });
    });
}

function startQuiz() {
    const qId = document.getElementById('active-quizzes-select').value;
    if (!qId) return;
    database.ref('quizzes/' + qId).once('value', (snap) => {
        activeQuizData = snap.val();
        timeLeft = activeQuizData.sure * 60;
        localStorage.setItem('selectedQuizId', qId);
        localStorage.setItem('isQuizRunning', "true");
        localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
        localStorage.setItem('timeLeft', timeLeft);
        resumeQuiz();
    });
}

function renderQuestions() {
    const container = document.getElementById('dynamic-questions');
    container.innerHTML = "";
    activeQuizData.questions.forEach((q, i) => {
        let opts = q.variantlar.map(v => `<label style="display:block; margin:5px 0;"><input type="radio" name="q${i}" value="${v === q.dogru ? 1 : 0}"> ${v}</label>`).join("");
        container.innerHTML += `<div class="question"><p><strong>${i+1}. ${q.sual}</strong></p>${opts}</div>`;
    });
}

function updateTimer() {
    let min = Math.floor(timeLeft / 60);
    let sec = timeLeft % 60;
    document.getElementById('timer').innerText = `Qalan Vaxt: ${min}:${sec < 10 ? '0' : ''}${sec}`;
    localStorage.setItem('timeLeft', timeLeft);
    if (timeLeft-- <= 0) finishQuiz();
}

function finishQuiz() {
    clearInterval(timerInterval);
    let correct = 0;
    activeQuizData.questions.forEach((q, i) => {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        if (sel && parseInt(sel.value) === 1) correct++;
    });
    const qId = localStorage.getItem('selectedQuizId');
    database.ref('imtahan_neticeleri').push({ adSoyad: currentStudent.name, duz: correct, sehv: activeQuizData.questions.length - correct, sinaqAdi: activeQuizData.title, tarix: new Date().toLocaleString() });
    database.ref(`students/${currentStudent.id}/finishedQuizzes/${qId}`).set(true).then(() => {
        localStorage.clear();
        location.reload();
    });
}

// ADMIN FUNKSİYALARI
function checkAdmin() {
    if (document.getElementById('admin-password').value === "nermine2025") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        loadResults();
    } else { alert("Səhv!"); }
}

function openTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.remove('hidden');
    event.currentTarget.classList.add('active');
    if(id==='editor-tab') loadAllQuizzes();
    if(id==='students-tab') loadStudentList();
}

function addNewQuestionRow() {
    currentQuestionsCount++;
    const div = document.createElement('div');
    div.className = 'q-row';
    div.innerHTML = `<input type="text" class="q-text" placeholder="Sual"><br>
        <input type="radio" name="c${currentQuestionsCount}" value="A" checked> <input type="text" class="opt-a" placeholder="A"><br>
        <input type="radio" name="c${currentQuestionsCount}" value="B"> <input type="text" class="opt-b" placeholder="B"><br>
        <input type="radio" name="c${currentQuestionsCount}" value="C"> <input type="text" class="opt-c" placeholder="C">`;
    document.getElementById('question-inputs').appendChild(div);
}

function saveNewQuiz() {
    const title = document.getElementById('new-quiz-name').value;
    const sure = document.getElementById('new-quiz-time').value;
    let questions = [];
    document.querySelectorAll('.q-row').forEach((row, i) => {
        const sel = row.querySelector(`input[type="radio"]:checked`).value;
        const a = row.querySelector('.opt-a').value;
        const b = row.querySelector('.opt-b').value;
        const c = row.querySelector('.opt-c').value;
        questions.push({ sual: row.querySelector('.q-text').value, dogru: (sel==="A"?a:sel==="B"?b:c), variantlar: [a,b,c].sort(()=>Math.random()-0.5) });
    });
    database.ref('quizzes').push({ title, sure, questions, status: "inactive" }).then(() => { alert("Yadda saxlanıldı!"); location.reload(); });
}

function loadAllQuizzes() {
    const list = document.getElementById('all-quizzes-list');
    database.ref('quizzes').on('value', snap => {
        list.innerHTML = "";
        snap.forEach(child => {
            const q = child.val();
            const active = q.status === "active";
            list.innerHTML += `<div class="quiz-card"><span>${q.title}</span><div>
                <button onclick="toggleStatus('${child.key}','${q.status}')" class="${active?'btn-status-active':'btn-status-inactive'}">${active?'Deaktiv':'Aktiv'}</button>
                <button onclick="deleteQuiz('${child.key}')" class="btn-delete">Sil</button>
            </div></div>`;
        });
    });
}

function toggleStatus(id, s) { database.ref(`quizzes/${id}/status`).set(s==="active"?"inactive":"active"); }
function deleteQuiz(id) { if(confirm("Silinsin?")) database.ref(`quizzes/${id}`).remove(); }
function addNewStudent() {
    const name = document.getElementById('new-student-name').value;
    const pass = document.getElementById('new-student-pass').value;
    database.ref('students').push({ name, password: pass }).then(() => alert("Əlavə edildi!"));
}
function loadStudentList() {
    const div = document.getElementById('student-list-display');
    database.ref('students').on('value', snap => {
        div.innerHTML = "";
        snap.forEach(c => { div.innerHTML += `<div class="quiz-card"><span>${c.val().name} (P: ${c.val().password})</span></div>`; });
    });
}
function loadResults() {
    database.ref('imtahan_neticeleri').on('value', snap => {
        const b = document.getElementById('results-body'); b.innerHTML = "";
        snap.forEach(c => { const v = c.val(); b.innerHTML += `<tr><td>${v.adSoyad}</td><td>${v.duz}</td><td>${v.sehv}</td><td><small>${v.tarix}</small></td></tr>`; });
    });
}
function clearAllResults() { if(confirm("Nəticələr silinsin?")) database.ref('imtahan_neticeleri').set(null); }
function showLogin() { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); }
function hideLogin() { document.getElementById('admin-login').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }
function logoutAdmin() { location.reload(); }
