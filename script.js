// FIREBASE KONFİQURASİYASI
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

// GLOBAL DƏYİŞƏNLƏR
let activeLang = localStorage.getItem('selectedLang') || 'az';
let activeQuizData = null;
let currentStudent = null;
let qCounter = 0; 
let timeLeft = 0;
let timerInterval;

// SƏHİFƏ YÜKLƏNƏNDƏ
window.onload = () => { 
    initApp(); 
};

function initApp() {
    ["quiz-selection-area", "quiz-screen", "admin-login", "admin-panel", "result-screen"]
    .forEach(id => document.getElementById(id).classList.add('hidden'));
}

// MÜƏLLİMƏ GİRİŞİ (Xüsusi Tarixi Sitatlarla)
function checkAdmin() {
    const p = document.getElementById('admin-password').value;
    if(p === "nermine2026" || p === "xedice2026") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        
        const quotes = [
            "Nərminə müəllimə, xoş gördük!"
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        alert(randomQuote);
        
        loadResults(); loadAllQuizzes(); loadStudentList();
    } else { 
        alert("Parol yanlışdır!"); 
    }
}

// ŞAGİRD GİRİŞİ
function loginStudent() {
    const user = document.getElementById('student-username').value.trim();
    const pass = document.getElementById('student-pass').value.trim();
    database.ref('students').once('value').then(snap => {
        let found = false;
        snap.forEach(c => {
            const d = c.val();
            if(d.name === user && d.password === pass) { found = true; currentStudent = d; }
        });
        if(found) {
            document.getElementById('student-login-area').classList.add('hidden');
            document.getElementById('quiz-selection-area').classList.remove('hidden');
            document.getElementById('welcome-student').innerText = "Xoş gəldin, " + currentStudent.name;
            loadAvailableQuizzes();
        } else { alert("Giriş məlumatları yanlışdır!"); }
    });
}

function loadAvailableQuizzes() {
    const sel = document.getElementById('active-quizzes-select');
    database.ref('quizzes').on('value', snap => {
        sel.innerHTML = `<option value="">-- Sınaq seçin --</option>`;
        snap.forEach(c => { 
            if(c.val().status === "active") sel.innerHTML += `<option value="${c.key}">${c.val().title}</option>`; 
        });
    });
}

function startQuiz() {
    const id = document.getElementById('active-quizzes-select').value;
    if(!id) return;
    database.ref('quizzes/' + id).once('value', snap => {
        activeQuizData = snap.val();
        timeLeft = activeQuizData.sure * 60;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.remove('hidden');
        document.getElementById('current-quiz-title').innerText = activeQuizData.title;
        renderQuestions();
        timerInterval = setInterval(updateTimer, 1000);
    });
}

function updateTimer() {
    let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
    document.getElementById('timer').innerText = `Qalan Vaxt: ${m}:${s < 10 ? '0' : ''}${s}`;
    if(timeLeft-- <= 0) finishQuiz();
}

function renderQuestions() {
    const div = document.getElementById('dynamic-questions'); div.innerHTML = "";
    activeQuizData.questions.forEach((q, i) => {
        let opts = q.variantlar.map(v => `<label style="display:block;margin:8px 0;cursor:pointer;"><input type="radio" name="q${i}" value="${v}"> ${v}</label>`).join("");
        div.innerHTML += `<div class="question"><p><strong>${i+1}. ${q.sual} (${q.bal} Bal)</strong></p>${opts}</div>`;
    });
}

// İMTAHANI BİTİRMƏ VƏ BAL HESABLAMA
function finishQuiz() {
    clearInterval(timerInterval);
    let totalScore = 0, maxPossible = 0, details = [];
    activeQuizData.questions.forEach((q, i) => {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        const userVal = sel ? sel.value : "Cavab verilməyib";
        const isCorrect = userVal === q.dogru;
        
        const qBal = parseInt(q.bal) || 0;
        maxPossible += qBal;
        if(isCorrect) totalScore += qBal;

        details.push({ sual: q.sual, user: userVal, correct: q.dogru, point: isCorrect ? qBal : 0 });
    });

    database.ref('imtahan_neticeleri').push({ 
        adSoyad: currentStudent.name, 
        toplanan: totalScore, 
        maks: maxPossible, 
        detal: details,
        tarix: new Date().toLocaleString()
    });

    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = `Nəticə: ${totalScore} / ${maxPossible} Bal`;
}

// ADMİN PANEL: SUAL YARATMA (Dinamik Variantlar)
function addNewQuestionRow() {
    qCounter++;
    const container = document.getElementById('question-inputs');
    const div = document.createElement('div');
    div.className = "q-editor-card";
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <strong>Sual ${qCounter}</strong>
            <input type="number" class="q-bal" placeholder="Bal" style="width:60px;" value="5">
        </div>
        <input type="text" class="q-txt" placeholder="Sualı daxil edin" style="margin-bottom:10px;">
        <div id="opts-${qCounter}" class="opts-list">
            <div style="display:flex; gap:10px; margin-bottom:5px;">
                <input type="radio" name="correct_${qCounter}" value="0" checked>
                <input type="text" class="opt-txt" placeholder="Variant 1">
            </div>
        </div>
        <button onclick="addOpt(${qCounter})" style="width:auto; padding:5px 10px; background:#27ae60; font-size:12px;">+ Variant əlavə et</button>
    `;
    container.appendChild(div);
}

function addOpt(id) {
    const cont = document.getElementById(`opts-${id}`);
    const idx = cont.children.length;
    const div = document.createElement('div');
    div.style = "display:flex; gap:10px; margin-bottom:5px;";
    div.innerHTML = `
        <input type="radio" name="correct_${id}" value="${idx}">
        <input type="text" class="opt-txt" placeholder="Variant ${idx+1}">
        <button onclick="this.parentElement.remove()" style="width:auto; background:red; padding:2px 7px;">x</button>
    `;
    cont.appendChild(div);
}

function saveNewQuiz() {
    const title = document.getElementById('new-quiz-name').value;
    const sure = document.getElementById('new-quiz-time').value;
    let questions = [];
    document.querySelectorAll('.q-editor-card').forEach(card => {
        const txt = card.querySelector('.q-txt').value;
        const bal = card.querySelector('.q-bal').value;
        const rows = card.querySelectorAll('.opt-txt');
        const correctIdx = card.querySelector('input[type="radio"]:checked').value;
        
        let variants = [], correctVal = "";
        rows.forEach((r, i) => { 
            variants.push(r.value);
            if(i == correctIdx) correctVal = r.value;
        });
        questions.push({ sual: txt, dogru: correctVal, variantlar: variants, bal: bal });
    });
    database.ref('quizzes').push({ title, sure, questions, status: "inactive" }).then(() => location.reload());
}

// ADMİN PANEL: NƏTİCƏLƏR VƏ DETALLAR
function loadResults() {
    database.ref('imtahan_neticeleri').on('value', snap => {
        const body = document.getElementById('results-body'); body.innerHTML = "";
        snap.forEach(c => {
            const v = c.val();
            body.innerHTML += `<tr>
                <td>${v.adSoyad}</td>
                <td>${v.toplanan}</td>
                <td>${v.maks}</td>
                <td><button onclick="showResDetail('${c.key}')" style="width:auto; padding:5px 10px; background:#d4a373; color:white;">Bax</button></td>
            </tr>`;
        });
    });
}

function showResDetail(key) {
    database.ref('imtahan_neticeleri/'+key).once('value').then(snap => {
        const v = snap.val();
        let msg = `${v.adSoyad} üçün detallar:\n\n`;
        v.detal.forEach((d, i) => {
            msg += `${i+1}. ${d.sual}\n   Şagird: ${d.user}\n   Düzgün: ${d.correct}\n   Bal: ${d.point}\n\n`;
        });
        alert(msg);
    });
}

// DİGƏR FUNKSİYALAR
function openTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}

function loadAllQuizzes() {
    const list = document.getElementById('all-quizzes-list');
    database.ref('quizzes').on('value', snap => {
        list.innerHTML = "";
        snap.forEach(c => {
            const q = c.val();
            list.innerHTML += `<div class="quiz-card"><span>${q.title}</span>
                <div><button onclick="toggleQ('${c.key}','${q.status}')" style="width:auto; padding:5px;">${q.status==='active'?'Deaktiv':'Aktiv'}</button>
                <button onclick="delQ('${c.key}')" class="btn-delete" style="width:auto; padding:5px;">Sil</button></div></div>`;
        });
    });
}
function toggleQ(id, s) { database.ref(`quizzes/${id}/status`).set(s==='active'?'inactive':'active'); }
function delQ(id) { if(confirm("Sınağı silmək istəyirsiniz?")) database.ref(`quizzes/${id}`).remove(); }

function addNewStudent() {
    const n = document.getElementById('new-student-name').value;
    const p = document.getElementById('new-student-pass').value;
    if(n && p) database.ref('students').push({ name: n, password: p }).then(() => { 
        alert("Şagird əlavə edildi!");
        document.getElementById('new-student-name').value = ""; 
        document.getElementById('new-student-pass').value = ""; 
    });
}

function loadStudentList() {
    const div = document.getElementById('student-list-display');
    database.ref('students').on('value', snap => {
        div.innerHTML = "";
        snap.forEach(c => { div.innerHTML += `<div class="quiz-card"><span>${c.val().name}</span><button onclick="delS('${c.key}')" class="btn-delete" style="width:auto; padding:5px;">Sil</button></div>`; });
    });
}
function delS(id) { if(confirm("Şagirdi silmək istəyirsiniz?")) database.ref(`students/${id}`).remove(); }
function clearAllResults() { if(confirm("Bütün nəticələr silinsin?")) database.ref('imtahan_neticeleri').remove(); }
function showLogin() { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); }
function hideLogin() { document.getElementById('admin-login').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }
function logoutAdmin() { location.reload(); }
function changeLang(l) { activeLang = l; localStorage.setItem('selectedLang', l); location.reload(); }
