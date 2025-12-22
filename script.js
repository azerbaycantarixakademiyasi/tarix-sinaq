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
    // 1. Aktiv sınağı müəyyən et
    database.ref('active_quiz_id').on('value', (snap) => {
        const activeId = snap.val();
        if (activeId) {
            database.ref('quizzes/' + activeId).once('value', (qSnap) => {
                activeQuizData = qSnap.val();
                document.getElementById('current-quiz-title').innerText = "Aktiv: " + activeQuizData.title;
            });
        } else {
            document.getElementById('current-quiz-title').innerText = "Hazırda aktiv sınaq yoxdur.";
        }
    });

    // 2. Yarımçıq qalan sınaq qoruması
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

// YENİ SUAL SATIRI ƏLAVƏ ET (Variantı radio ilə seçmək üçün)
function addNewQuestionRow() {
    currentQuestionsCount++;
    const container = document.getElementById('question-inputs');
    const div = document.createElement('div');
    div.className = 'q-row';
    const radioName = `correct_${currentQuestionsCount}`; 
    
    div.innerHTML = `
        <strong>Sual ${currentQuestionsCount}</strong>
        <input type="text" class="q-text" placeholder="Sualı daxil edin">
        <div class="opt-input">
            <input type="radio" name="${radioName}" value="A" checked> 
            <input type="text" class="opt-a" placeholder="A variantı">
        </div>
        <div class="opt-input">
            <input type="radio" name="${radioName}" value="B"> 
            <input type="text" class="opt-b" placeholder="B variantı">
        </div>
        <div class="opt-input">
            <input type="radio" name="${radioName}" value="C"> 
            <input type="text" class="opt-c" placeholder="C variantı">
        </div>
        <p style="font-size:11px; color:#666; margin-top:5px;">* Düzgün variantı nöqtə ilə işarələyin.</p>
    `;
    container.appendChild(div);
}

// YENİ SINAĞI BAZAYA YAZ
function saveNewQuiz() {
    const title = document.getElementById('new-quiz-name').value.trim();
    if (!title) { alert("Sınağa ad verin!"); return; }

    const qRows = document.querySelectorAll('.q-row');
    let questions = [];

    qRows.forEach((row, index) => {
        const sual = row.querySelector('.q-text').value;
        const a = row.querySelector('.opt-a').value;
        const b = row.querySelector('.opt-b').value;
        const c = row.querySelector('.opt-c').value;
        
        const radioName = `correct_${index + 1}`;
        const selectedLetter = row.querySelector(`input[name="${radioName}"]:checked`).value;
        
        let dogruCavab;
        if(selectedLetter === "A") dogruCavab = a;
        else if(selectedLetter === "B") dogruCavab = b;
        else dogruCavab = c;

        if(sual && a && b && c) {
            questions.push({
                sual: sual,
                dogru: dogruCavab,
                variantlar: [a, b, c].sort(() => Math.random() - 0.5)
            });
        }
    });

    if(questions.length === 0) { alert("Xanalara məlumat daxil edin!"); return; }

    database.ref('quizzes').push({ title, questions }).then(() => {
        alert("Sınaq bazaya əlavə edildi!");
        document.getElementById('question-inputs').innerHTML = "";
        document.getElementById('new-quiz-name').value = "";
        currentQuestionsCount = 0;
        loadAllQuizzes();
    });
}

// BÜTÜN SINAQLAR VƏ AKTİVLƏŞDİRMƏ
function loadAllQuizzes() {
    const list = document.getElementById('all-quizzes-list');
    database.ref('quizzes').on('value', snap => {
        list.innerHTML = "";
        snap.forEach(child => {
            const quiz = child.val();
            list.innerHTML += `
                <div class="quiz-card">
                    <span>${quiz.title} (${quiz.questions.length} sual)</span>
                    <button onclick="setActiveQuiz('${child.key}')" style="width:auto; background:#2ecc71; padding:5px 12px;">Aktiv Et</button>
                </div>`;
        });
    });
}

function setActiveQuiz(id) {
    database.ref('active_quiz_id').set(id).then(() => alert("Sınaq artıq saytda aktivdir!"));
}

// --- ŞAGİRD TƏRƏFİ ---
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
            <label><input type="radio" name="q${index}" value="${v === q.dogru ? 1 : 0}" data-text="${v}"> ${v}</label>
        `).join("");
        
        qContainer.innerHTML += `
            <div class="question">
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
        document.getElementById('final-score').innerHTML = `Nəticəniz: ${correctCount} Düz, ${questions.length - correctCount} Səhv`;
    });
}

// --- ADMİN PANEL ---
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
                <td style="color:green">D: ${val.duz}</td>
                <td style="color:red">S: ${val.sehv}</td>
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

function clearAllResults() { if (confirm("Bütün nəticələr silinsin?")) database.ref('imtahan_neticeleri').set(null); }
function deleteResult(key) { if (confirm("Bu nəticə silinsin?")) database.ref('imtahan_neticeleri/' + key).set(null); }
function showLogin() { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); }
function hideLogin() { document.getElementById('admin-login').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }
function logoutAdmin() { location.reload(); }
function resumeQuiz() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    renderQuestions();
    timerInterval = setInterval(updateTimer, 1000);
}
