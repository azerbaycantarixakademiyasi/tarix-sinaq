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
        thStudent: "Şagird",
        thCorrect: "Düz",
        thWrong: "Səhv",
        thDate: "Tarix",
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
        alertPass: "İstifadəçi adı və ya parol yanlışdır!",
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
        thStudent: "Ученик",
        thCorrect: "Верно",
        thWrong: "Неверно",
        thDate: "Дата",
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
        alertPass: "Имя пользователя или пароль неверны!",
        confirmClear: "Удалить результаты?",
        confirmDelete: "Удалить тест?",
        active: "Активен",
        deactive: "Деактивен"
    }
};

let activeLang = localStorage.getItem('selectedLang') || 'az';
let activeQuizData = null;
let currentStudent = null;
let currentQuestionsCount = 0;
let timeLeft = 0;
let timerInterval;

window.onload = function() {
    changeLang(activeLang);
    initApp();
};

function initApp() {
    document.getElementById('quiz-selection-area').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('admin-panel').classList.add('hidden');
    document.getElementById('result-screen').classList.add('hidden');
}

function changeLang(lang) {
    activeLang = lang;
    localStorage.setItem('selectedLang', lang);
    const t = translations[lang];
    
    document.getElementById('site-title').innerText = t.siteTitle;
    document.getElementById('msg-welcome').innerText = t.welcomeMsg;
    document.getElementById('student-username').placeholder = t.namePlaceholder;
    document.getElementById('student-pass').placeholder = t.passPlaceholder;
    document.getElementById('btn-login').innerText = t.loginBtn;
    document.getElementById('btn-teacher-login').innerText = t.teacherLogin;
    document.getElementById('msg-select-quiz').innerText = t.selectQuiz;
    document.getElementById('btn-start-quiz').innerText = t.startBtn;
    document.getElementById('btn-finish-quiz').innerText = t.finishBtn;
    document.getElementById('admin-login-title').innerText = t.adminLogin;
    document.getElementById('admin-password').placeholder = t.passPlaceholder;
    document.getElementById('btn-admin-enter').innerText = t.loginBtn;
    document.getElementById('btn-back').innerText = t.adminBack;
    document.getElementById('tab-results').innerText = t.tabResults;
    document.getElementById('tab-quizzes').innerText = t.tabQuizzes;
    document.getElementById('tab-students').innerText = t.tabStudents;
    document.getElementById('title-results').innerText = t.resultsTitle;
    document.getElementById('btn-clear-results').innerText = t.clearBtn;
    document.getElementById('th-student').innerText = t.thStudent;
    document.getElementById('th-correct').innerText = t.thCorrect;
    document.getElementById('th-wrong').innerText = t.thWrong;
    document.getElementById('th-date').innerText = t.thDate;
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

// ŞAGİRD GİRİŞİ (AD + PAROL)
function loginStudent() {
    const inputName = document.getElementById('student-username').value.trim();
    const inputPass = document.getElementById('student-pass').value.trim();

    database.ref('students').once('value').then((snapshot) => {
        let found = false;
        snapshot.forEach((child) => {
            const data = child.val();
            if (data.name === inputName && data.password === inputPass) {
                currentStudent = { id: child.key, ...data };
                found = true;
            }
        });

        if (found) {
            document.getElementById('student-login-area').classList.add('hidden');
            document.getElementById('quiz-selection-area').classList.remove('hidden');
            document.getElementById('welcome-student').innerText = (activeLang === 'az' ? 'Xoş gəldin, ' : 'Добро пожаловать, ') + currentStudent.name;
            loadAvailableQuizzes();
        } else { 
            alert(translations[activeLang].alertPass); 
        }
    });
}

function loadAvailableQuizzes() {
    const select = document.getElementById('active-quizzes-select');
    database.ref('quizzes').on('value', (snap) => {
        select.innerHTML = `<option value="">-- ${activeLang === 'az' ? 'Sınaq seçin' : 'Выберите тест'} --</option>`;
        snap.forEach((child) => {
            const q = child.val();
            if (q.status === "active") {
                select.innerHTML += `<option value="${child.key}">${q.title} (${q.sure} min)</option>`;
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
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.remove('hidden');
        document.getElementById('current-quiz-title').innerText = activeQuizData.title;
        renderQuestions();
        timerInterval = setInterval(updateTimer, 1000);
    });
}

function updateTimer() {
    let min = Math.floor(timeLeft / 60);
    let sec = timeLeft % 60;
    document.getElementById('timer').innerText = translations[activeLang].timer + `${min}:${sec < 10 ? '0' : ''}${sec}`;
    if (timeLeft-- <= 0) finishQuiz();
}

function renderQuestions() {
    const container = document.getElementById('dynamic-questions');
    container.innerHTML = "";
    activeQuizData.questions.forEach((q, i) => {
        let opts = q.variantlar.map(v => `<label style="display:block; margin:8px 0; cursor:pointer;"><input type="radio" name="q${i}" value="${v === q.dogru ? 1 : 0}"> ${v}</label>`).join("");
        container.innerHTML += `<div class="question" style="background:#f9f9f9; padding:15px; border-radius:10px; margin-bottom:15px;">
            <p><strong>${i+1}. ${q.sual}</strong></p>${opts}</div>`;
    });
}

function finishQuiz() {
    clearInterval(timerInterval);
    let correct = 0;
    activeQuizData.questions.forEach((q, i) => {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        if (sel && parseInt(sel.value) === 1) correct++;
    });

    database.ref('imtahan_neticeleri').push({ 
        adSoyad: currentStudent.name, 
        duz: correct, 
        sehv: activeQuizData.questions.length - correct, 
        sinaqAdi: activeQuizData.title, 
        tarix: new Date().toLocaleString() 
    });

    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = `${correct} / ${activeQuizData.questions.length}`;
}

// ADMİN FUNKSİYALARI
function checkAdmin() {
    if (document.getElementById('admin-password').value === "nermine2025") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        loadResults();
        loadAllQuizzes();
        loadStudentList();
    } else { 
        alert(translations[activeLang].alertPass); 
    }
}

function openTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}

function addNewQuestionRow() {
    currentQuestionsCount++;
    const div = document.createElement('div');
    div.className = 'q-row';
    div.style.marginBottom = "15px";
    div.innerHTML = `<input type="text" class="q-text" placeholder="Sual"><br>
        <input type="radio" name="c${currentQuestionsCount}" value="A" checked> <input type="text" class="opt-a" placeholder="A variantı"><br>
        <input type="radio" name="c${currentQuestionsCount}" value="B"> <input type="text" class="opt-b" placeholder="B variantı"><br>
        <input type="radio" name="c${currentQuestionsCount}" value="C"> <input type="text" class="opt-c" placeholder="C variantı">`;
    document.getElementById('question-inputs').appendChild(div);
}

function saveNewQuiz() {
    const title = document.getElementById('new-quiz-name').value;
    const sure = document.getElementById('new-quiz-time').value;
    let questions = [];
    document.querySelectorAll('.q-row').forEach((row) => {
        const a = row.querySelector('.opt-a').value;
        const b = row.querySelector('.opt-b').value;
        const c = row.querySelector('.opt-c').value;
        const selValue = row.querySelector(`input[type="radio"]:checked`).value;
        
        let correctValue = (selValue === "A" ? a : selValue === "B" ? b : c);

        questions.push({ 
            sual: row.querySelector('.q-text').value, 
            dogru: correctValue, 
            variantlar: [a, b, c] 
        });
    });
    database.ref('quizzes').push({ title, sure, questions, status: "inactive" }).then(() => { 
        alert("Sınaq yadda saxlanıldı!"); 
        location.reload(); 
    });
}

function loadAllQuizzes() {
    const list = document.getElementById('all-quizzes-list');
    database.ref('quizzes').on('value', snap => {
        list.innerHTML = "";
        snap.forEach(child => {
            const q = child.val();
            const active = q.status === "active";
            list.innerHTML += `<div class="quiz-card">
                <span>${q.title}</span>
                <div>
                    <button onclick="toggleStatus('${child.key}','${q.status}')" class="${active?'btn-status-active':'btn-status-inactive'}">
                        ${active ? translations[activeLang].deactive : translations[activeLang].active}
                    </button>
                    <button onclick="deleteQuiz('${child.key}')" class="btn-delete">Sil</button>
                </div>
            </div>`;
        });
    });
}

function toggleStatus(id, s) { database.ref(`quizzes/${id}/status`).set(s==="active"?"inactive":"active"); }
function deleteQuiz(id) { if(confirm(translations[activeLang].confirmDelete)) database.ref(`quizzes/${id}`).remove(); }

function addNewStudent() {
    const name = document.getElementById('new-student-name').value.trim();
    const pass = document.getElementById('new-student-pass').value.trim();
    if(name && pass) {
        database.ref('students').push({ name, password: pass }).then(() => {
            alert("Şagird əlavə edildi!");
            document.getElementById('new-student-name').value = "";
            document.getElementById('new-student-pass').value = "";
        });
    }
}

function loadStudentList() {
    const div = document.getElementById('student-list-display');
    database.ref('students').on('value', snap => {
        div.innerHTML = "";
        snap.forEach(c => { 
            div.innerHTML += `<div class="quiz-card">
                <span>${c.val().name} (Parol: ${c.val().password})</span>
                <button onclick="deleteStudent('${c.key}')" class="btn-delete" style="width:auto; padding:5px 10px;">Sil</button>
            </div>`; 
        });
    });
}

function deleteStudent(id) { if(confirm("Şagirdi silmək istəyirsiniz?")) database.ref(`students/${id}`).remove(); }

function loadResults() {
    database.ref('imtahan_neticeleri').on('value', snap => {
        const b = document.getElementById('results-body'); b.innerHTML = "";
        snap.forEach(c => { 
            const v = c.val(); 
            b.innerHTML += `<tr><td>${v.adSoyad}</td><td>${v.duz}</td><td>${v.sehv}</td><td><small>${v.tarix}</small></td></tr>`; 
        });
    });
}

function clearAllResults() { if(confirm(translations[activeLang].confirmClear)) database.ref('imtahan_neticeleri').set(null); }
function showLogin() { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); }
function hideLogin() { document.getElementById('admin-login').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }
function logoutAdmin() { location.reload(); }
