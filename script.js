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

const translations = {
    az: {
        siteTitle: "Əmirbəyova Nərminə",
        welcomeMsg: "Şagird adı və parolu ilə giriş edin",
        namePlaceholder: "İstifadəçi adınız",
        passPlaceholder: "Parolunuzu daxil edin",
        loginBtn: "Giriş et",
        teacherLogin: "Müəllim Girişi",
        selectQuiz: "Sizin üçün aktiv olan sınağı seçin:",
        startBtn: "Sınağa Başla",
        timer: "Qalan Vaxt: ",
        finishBtn: "Sınağı Bitir",
        adminLogin: "Müəllim Girişi",
        adminBack: "Geri",
        tabResults: "Nəticələr",
        tabQuizzes: "Sınaqlar",
        tabStudents: "Şagirdlər",
        resultsTitle: "Şagird Nəticələri",
        clearBtn: "Təmizlə",
        quizTitlePlace: "Sınaq Başlığı",
        quizTimePlace: "Müddət (dəqiqə)",
        addQ: "+ Yeni Sual",
        saveQuiz: "Sınağı Arxivə Yaz",
        archiveTitle: "Sınaq Arxivi",
        addStudent: "Yeni Şagird Əlavə Et",
        studentNamePlace: "Ad Soyad",
        studentPassPlace: "Parol",
        saveStudent: "Şagirdi Yadda Saxla",
        studentListTitle: "Şagird Siyahısı",
        logout: "Çıxış",
        quizFinished: "Sınaq Bitdi!",
        closeBtn: "Bağla",
        footer: "Layihə rəhbəri: ",
        alertPass: "Məlumatlar yanlışdır!",
        confirmClear: "Nəticələr silinsin?",
        confirmDelete: "Sınaq silinsin?",
        active: "Aktiv",
        deactive: "Deaktiv"
    },
    ru: {
        siteTitle: "Амирбекова Нармина",
        welcomeMsg: "Войдите по имени и паролю",
        namePlaceholder: "Имя пользователя",
        passPlaceholder: "Введите пароль",
        loginBtn: "Войти",
        teacherLogin: "Вход для учителя",
        selectQuiz: "Выберите активный тест:",
        startBtn: "Начать тест",
        timer: "Оставшееся время: ",
        finishBtn: "Завершить тест",
        adminLogin: "Вход для администратора",
        adminBack: "Назад",
        tabResults: "Результаты",
        tabQuizzes: "Тесты",
        tabStudents: "Ученики",
        resultsTitle: "Результаты учеников",
        clearBtn: "Очистить",
        quizTitlePlace: "Заголовок теста",
        quizTimePlace: "Время (минуты)",
        addQ: "+ Новый вопрос",
        saveQuiz: "Сохранить тест",
        archiveTitle: "Архив тестов",
        addStudent: "Добавить ученика",
        studentNamePlace: "Имя Фамилия",
        studentPassPlace: "Пароль",
        saveStudent: "Сохранить ученика",
        studentListTitle: "Список учеников",
        logout: "Выход",
        quizFinished: "Тест завершен!",
        closeBtn: "Закрыть",
        footer: "Руководитель проекта: ",
        alertPass: "Данные неверны!",
        confirmClear: "Удалить результаты?",
        confirmDelete: "Удалить тест?",
        active: "Активен",
        deactive: "Деактивен"
    }
};

let activeLang = localStorage.getItem('selectedLang') || 'az';
let activeQuizData = null;
let currentStudent = null;
let qCounter = 0; // Dinamik sual ID-si üçün
let timeLeft = 0;
let timerInterval;

window.onload = () => { changeLang(activeLang); initApp(); };

function initApp() {
    ["quiz-selection-area", "quiz-screen", "admin-login", "admin-panel", "result-screen"]
    .forEach(id => document.getElementById(id).classList.add('hidden'));
}

function changeLang(lang) {
    activeLang = lang;
    localStorage.setItem('selectedLang', lang);
    const t = translations[lang];
    document.getElementById('site-title').innerText = t.siteTitle;
    document.getElementById('msg-welcome').innerText = t.welcomeMsg;
    document.querySelectorAll('input').forEach(inp => {
        if(inp.id === "student-username") inp.placeholder = t.namePlaceholder;
        if(inp.id === "student-pass" || inp.id === "admin-password") inp.placeholder = t.passPlaceholder;
    });
    document.getElementById('btn-login').innerText = t.loginBtn;
    document.getElementById('btn-teacher-login').innerText = t.teacherLogin;
    document.getElementById('msg-select-quiz').innerText = t.selectQuiz;
    document.getElementById('btn-start-quiz').innerText = t.startBtn;
    document.getElementById('btn-finish-quiz').innerText = t.finishBtn;
    document.getElementById('admin-login-title').innerText = t.adminLogin;
    document.getElementById('btn-admin-enter').innerText = t.loginBtn;
    document.getElementById('btn-back').innerText = t.adminBack;
    document.getElementById('tab-results').innerText = t.tabResults;
    document.getElementById('tab-quizzes').innerText = t.tabQuizzes;
    document.getElementById('tab-students').innerText = t.tabStudents;
    document.getElementById('title-results').innerText = t.resultsTitle;
    document.getElementById('btn-clear-results').innerText = t.clearBtn;
    document.getElementById('new-quiz-name').placeholder = t.quizTitlePlace;
    document.getElementById('new-quiz-time').placeholder = t.quizTimePlace;
    document.getElementById('btn-add-q').innerText = t.addQ;
    document.getElementById('btn-save-quiz').innerText = t.saveQuiz;
    document.getElementById('title-archive').innerText = t.archiveTitle;
    document.getElementById('title-add-student').innerText = t.addStudent;
    document.getElementById('new-student-name').placeholder = t.studentNamePlace;
    document.getElementById('new-student-pass').placeholder = t.studentPassPlace;
    document.getElementById('btn-save-student').innerText = t.saveStudent;
    document.getElementById('title-student-list').innerText = t.studentListTitle;
    document.getElementById('btn-logout').innerText = t.logout;
    document.getElementById('msg-quiz-finished').innerText = t.quizFinished;
    document.getElementById('btn-close').innerText = t.closeBtn;
    document.getElementById('footer-text').innerHTML = `${t.footer} <span>Xədicə Abbaszadə</span>`;
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
            document.getElementById('welcome-student').innerText = (activeLang === 'az' ? 'Xoş gəldin, ' : 'Добро пожаловать, ') + currentStudent.name;
            loadAvailableQuizzes();
        } else { alert(translations[activeLang].alertPass); }
    });
}

function loadAvailableQuizzes() {
    const sel = document.getElementById('active-quizzes-select');
    database.ref('quizzes').on('value', snap => {
        sel.innerHTML = `<option value="">-- ${activeLang === 'az' ? 'Seçin' : 'Выбор'} --</option>`;
        snap.forEach(c => { if(c.val().status === "active") sel.innerHTML += `<option value="${c.key}">${c.val().title}</option>`; });
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
        timerInterval = setInterval(() => {
            let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
            document.getElementById('timer').innerText = translations[activeLang].timer + `${m}:${s<10?'0':''}${s}`;
            if(timeLeft-- <= 0) finishQuiz();
        }, 1000);
    });
}

function renderQuestions() {
    const div = document.getElementById('dynamic-questions'); div.innerHTML = "";
    activeQuizData.questions.forEach((q, i) => {
        let opts = q.variantlar.map(v => `<label style="display:block;margin:8px 0;"><input type="radio" name="q${i}" value="${v}"> ${v}</label>`).join("");
        div.innerHTML += `<div class="question"><p><strong>${i+1}. ${q.sual} (${q.bal} Bal)</strong></p>${opts}</div>`;
    });
}

function finishQuiz() {
    clearInterval(timerInterval);
    let score = 0, max = 0, details = [];
    activeQuizData.questions.forEach((q, i) => {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        const userVal = sel ? sel.value : "Bosh";
        const isCorrect = userVal === q.dogru;
        max += parseInt(q.bal);
        if(isCorrect) score += parseInt(q.bal);
        details.push({ sual: q.sual, user: userVal, correct: q.dogru, point: isCorrect ? q.bal : 0 });
    });
    database.ref('imtahan_neticeleri').push({ adSoyad: currentStudent.name, toplanan: score, maks: max, detal: details });
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = `Nəticə: ${score} / ${max} Bal`;
}

// ADMİN PANEL
function checkAdmin() {
    const p = document.getElementById('admin-password').value;
    if(p === "nermine2025" || p === "xedice2026") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        loadResults(); loadAllQuizzes(); loadStudentList();
    } else { alert("Yanlış parol!"); }
}

function addNewQuestionRow() {
    qCounter++;
    const container = document.getElementById('question-inputs');
    const div = document.createElement('div');
    div.className = "q-editor-card";
    div.style = "background:#f9f9f9; padding:15px; border-radius:10px; margin-bottom:15px; border:1px solid #ddd;";
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <strong>Sual ${qCounter}</strong>
            <input type="number" class="q-bal" placeholder="Bal" style="width:60px; margin:0;" value="5">
        </div>
        <input type="text" class="q-txt" placeholder="Sualı yazın" style="margin-bottom:10px;">
        <div id="opts-${qCounter}" class="opts-list">
            <div style="display:flex; gap:10px; margin-bottom:5px;">
                <input type="radio" name="correct_${qCounter}" value="0" checked>
                <input type="text" class="opt-txt" placeholder="Variant 1">
            </div>
        </div>
        <button onclick="addOpt(${qCounter})" style="width:auto; padding:5px 10px; background:#27ae60; font-size:12px;">+ Variant</button>
    `;
    container.appendChild(div);
}

function addOpt(id) {
    const cont = document.getElementById(`opts-${id}`);
    const idx = cont.children.length;
    const div = document.createElement('div');
    div.style = "display:flex; gap:10px; margin-bottom:5px;";
    div.innerHTML = `<input type="radio" name="correct_${id}" value="${idx}"><input type="text" class="opt-txt" placeholder="Variant ${idx+1}">`;
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

function loadResults() {
    database.ref('imtahan_neticeleri').on('value', snap => {
        const body = document.getElementById('results-body'); body.innerHTML = "";
        snap.forEach(c => {
            const v = c.val();
            body.innerHTML += `<tr>
                <td>${v.adSoyad}</td>
                <td>${v.toplanan}</td>
                <td>${v.maks}</td>
                <td><button onclick="showResDetail('${c.key}')" style="width:auto; padding:5px; background:orange;">Bax</button></td>
            </tr>`;
        });
    });
}

function showResDetail(key) {
    database.ref('imtahan_neticeleri/'+key).once('value').then(snap => {
        const v = snap.val();
        let msg = `${v.adSoyad} üçün detallar:\n\n`;
        v.detal.forEach((d, i) => {
            msg += `${i+1}. ${d.sual}\n   Cavab: ${d.user}\n   Düzgün: ${d.correct}\n   Bal: ${d.point}\n\n`;
        });
        alert(msg);
    });
}

// DİGƏR FUNKSİYALAR (Siyahılar)
function loadAllQuizzes() {
    const list = document.getElementById('all-quizzes-list');
    database.ref('quizzes').on('value', snap => {
        list.innerHTML = "";
        snap.forEach(c => {
            const q = c.val();
            list.innerHTML += `<div class="quiz-card"><span>${q.title}</span>
                <div><button onclick="toggleQ('${c.key}','${q.status}')">${q.status==='active'?'Deaktiv':'Aktiv'}</button>
                <button onclick="delQ('${c.key}')" class="btn-delete">Sil</button></div></div>`;
        });
    });
}
function toggleQ(id, s) { database.ref(`quizzes/${id}/status`).set(s==='active'?'inactive':'active'); }
function delQ(id) { if(confirm("Silinsin?")) database.ref(`quizzes/${id}`).remove(); }
function addNewStudent() {
    const n = document.getElementById('new-student-name').value;
    const p = document.getElementById('new-student-pass').value;
    if(n && p) database.ref('students').push({ name: n, password: p }).then(() => { 
        document.getElementById('new-student-name').value = ""; 
        document.getElementById('new-student-pass').value = ""; 
    });
}
function loadStudentList() {
    const div = document.getElementById('student-list-display');
    database.ref('students').on('value', snap => {
        div.innerHTML = "";
        snap.forEach(c => { div.innerHTML += `<div class="quiz-card"><span>${c.val().name}</span><button onclick="delS('${c.key}')" class="btn-delete">Sil</button></div>`; });
    });
}
function delS(id) { if(confirm("Silinsin?")) database.ref(`students/${id}`).remove(); }
function openTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}
function clearAllResults() { if(confirm("Təmizlənsin?")) database.ref('imtahan_neticeleri').remove(); }
function showLogin() { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); }
function hideLogin() { document.getElementById('admin-login').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }
function logoutAdmin() { location.reload(); }
