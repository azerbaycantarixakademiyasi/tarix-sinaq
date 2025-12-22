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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let activeQuizData = null;
let currentQuestionsCount = 0;
let timeLeft = localStorage.getItem('timeLeft') ? parseInt(localStorage.getItem('timeLeft')) : 900;
let timerInterval;

// SƏHİFƏ YÜKLƏNƏNDƏ
window.onload = function() {
    // 1. Aktiv sınağı müəyyən et və yüklə
    database.ref('active_quiz_id').on('value', (snap) => {
        const activeId = snap.val();
        if (activeId) {
            database.ref('quizzes/' + activeId).once('value', (qSnap) => {
                activeQuizData = qSnap.val();
                document.getElementById('current-quiz-title').innerText = activeQuizData.title;
            });
        } else {
            document.getElementById('current-quiz-title').innerText = "Hazırda aktiv sınaq yoxdur.";
        }
    });

    // 2. Şagirdin yarımçıq sınağı varsa bərpa et
    const savedName = localStorage.getItem('studentName');
    const isQuizRunning = localStorage.getItem('isQuizRunning');
    if (isQuizRunning === "true" && savedName) {
        document.getElementById('student-name').value = savedName;
        resumeQuiz();
    }
};

// --- MÜƏLLİM PANELİ (TABLAR) ---
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    event.currentTarget.classList.add('active');
    
    if(tabId === 'editor-tab') loadAllQuizzes();
    if(tabId === 'results-tab') loadResults();
}

// YENİ SUAL XANASI ƏLAVƏ ET
function addNewQuestionRow() {
    currentQuestionsCount++;
    const container = document.getElementById('question-inputs');
    const div = document.createElement('div');
    div.className = 'q-row';
    div.style = "background:#f9f9f9; padding:15px; border-radius:10px; margin-bottom:10px; border:1px solid #ddd;";
    div.innerHTML = `
        <strong>Sual ${currentQuestionsCount}</strong>
        <input type="text" class="q-text" placeholder="Sualı yazın" style="width:100%; margin:5px 0; padding:8px;">
        <input type="text" class="opt-a" placeholder="Düzgün cavab" style="width:100%; margin:5px 0; padding:8px; border:1px solid green;">
        <input type="text" class="opt-b" placeholder="Səhv variant 1" style="width:100%; margin:5px 0; padding:8px;">
        <input type="text" class="opt-c" placeholder="Səhv variant 2" style="width:100%; margin:5px 0; padding:8px;">
    `;
    container.appendChild(div);
}

// YENİ SINAĞI YADDA SAXLA
function saveNewQuiz() {
    const title = document.getElementById('new-quiz-name').value.trim();
    if (!title) { alert("Sınağa ad verin!"); return; }

    const qRows = document.querySelectorAll('.q-row');
    let questions = [];

    qRows.forEach(row => {
        const sual = row.querySelector('.q-text').value;
        const dogru = row.querySelector('.opt-a').value;
        const b = row.querySelector('.opt-b').value;
        const c = row.querySelector('.opt-c').value;

        if(sual && dogru) {
            questions.push({
                sual: sual,
                dogru: dogru,
                variantlar: [dogru, b, c].sort(() => Math.random() - 0.5)
            });
        }
    });

    if(questions.length === 0) { alert("Ən azı bir sual daxil edin!"); return; }

    database.ref('quizzes').push({ title, questions }).then(() => {
        alert("Sınaq uğurla yaradıldı!");
        document.getElementById('question-inputs').innerHTML = "";
        document.getElementById('new-quiz-name').value = "";
        currentQuestionsCount = 0;
        loadAllQuizzes();
    });
}

// BÜTÜN SINAQLARI GÖSTƏR VƏ AKTİV ET
function loadAllQuizzes() {
    const list = document.getElementById('all-quizzes-list');
    database.ref('quizzes').on('value', snap => {
        list.innerHTML = "";
        snap.forEach(child => {
            const quiz = child.val();
            list.innerHTML += `
                <div style="display:flex; justify-content:space-between; padding:10px; border:1px solid #eee; margin-bottom:5px; border-radius:8px;">
                    <span>${quiz.title} (${quiz.questions.length} sual)</span>
                    <button onclick="setActiveQuiz('${child.key}')" style="width:auto; padding:5px 10px; background:#2ecc71;">Aktiv Et</button>
                </div>`;
        });
    });
}

function setActiveQuiz(id) {
    database.ref('active_quiz_id').set(id).then(() => alert("Sınaq saytda aktiv edildi!"));
}

// --- ŞAGİRD İMTAHAN PROSESİ ---
function startQuiz() {
    if(!activeQuizData) { alert("Müəllimə hələ sınağı aktiv etməyib!"); return; }
    const name = document.getElementById('student-name').value.trim();
    if (name.length < 5) { alert("Ad və Soyad daxil edin!"); return; }

    localStorage.setItem('studentName', name);
    localStorage.setItem('isQuizRunning', "true");
    
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    
    renderQuestions();
    timerInterval = setInterval(updateTimer, 1000);
}

function renderQuestions() {
    const qContainer = document.getElementById('dynamic-questions');
    qContainer.innerHTML = "";
    activeQuizData.questions.forEach((q, index) => {
        let optionsHtml = q.variantlar.map(v => `
            <label style="display:block; padding:10px; border:1px solid #eee; margin:5px 0; border-radius:8px; cursor:pointer;">
                <input type="radio" name="q${index}" value="${v === q.dogru ? 1 : 0}" data-text="${v}"> ${v}
            </label>
        `).join("");
        
        qContainer.innerHTML += `
            <div class="question" style="margin-bottom:20px; padding:15px; background:#fdfdfd; border-radius:10px; border:1px solid #eee;">
                <p><strong>${index + 1}. ${q.sual}</strong></p>
                <div class="options">${optionsHtml}</div>
            </div>`;
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
    let correctCount = 0;
    let studentAnswers = [];
    const questions = activeQuizData.questions;

    questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        let isCorrect = selected ? (parseInt(selected.value) === 1) : false;
        if (isCorrect) correctCount++;

        studentAnswers.push({
            sual: q.sual,
            cavab: selected ? selected.getAttribute('data-text') : "Boş",
            dogrudurmu: isCorrect
        });
    });

    const name = localStorage.getItem('studentName');
    database.ref('imtahan_neticeleri').push({
        adSoyad: name,
        duz: correctCount,
        sehv: questions.length - correctCount,
        tarix: new Date().toLocaleString(),
        detallar: studentAnswers,
        sinaqAdi: activeQuizData.title
    }).then(() => {
        localStorage.clear();
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('result-screen').classList.remove('hidden');
        document.getElementById('final-score').innerHTML = `Nəticə: ${correctCount} Düz, ${questions.length - correctCount} Səhv`;
    });
}

// --- ADMİN GİRİŞ VƏ NƏTİCƏLƏR ---
function checkAdmin() {
    if (document.getElementById('admin-password').value === "nermine2025") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        loadResults();
    } else { alert("Yanlış parol!"); }
}

function loadResults() {
    const tbody = document.getElementById('results-body');
    database.ref('imtahan_neticeleri').on('value', (snapshot) => {
        tbody.innerHTML = "";
        snapshot.forEach((child) => {
            const val = child.val();
            tbody.innerHTML += `<tr>
                <td onclick="showDetails('${child.key}')" style="cursor:pointer"><strong>${val.adSoyad}</strong><br><small>${val.sinaqAdi || ''}</small></td>
                <td style="color:green">${val.duz}</td>
                <td style="color:red">${val.sehv}</td>
                <td><button onclick="deleteResult('${child.key}')" style="width:auto; background:red; padding:2px 8px;">X</button></td>
            </tr>`;
        });
    });
}

function showDetails(key) {
    database.ref('imtahan_neticeleri/' + key).once('value', (snapshot) => {
        const data = snapshot.val();
        document.getElementById('student-details').classList.remove('hidden');
        document.getElementById('detail-name').innerText = data.adSoyad;
        let html = "";
        data.detallar.forEach(d => {
            html += `<p style="color:${d.dogrudurmu?'green':'red'}">${d.dogrudurmu?'✅':'❌'} ${d.sual}: ${d.cavab}</p>`;
        });
        document.getElementById('detail-list').innerHTML = html;
    });
}

function clearAllResults() { if (confirm("Hamısını silmək?")) database.ref('imtahan_neticeleri').set(null); }
function deleteResult(key) { if (confirm("Silinsin?")) database.ref('imtahan_neticeleri/' + key).set(null); }
function showLogin() { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); }
function hideLogin() { document.getElementById('admin-login').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }
function logoutAdmin() { location.reload(); }
