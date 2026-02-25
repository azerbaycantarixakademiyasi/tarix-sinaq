const firebaseConfig = {
    apiKey: "AIzaSyDulTEwR08ErC3J9uvjDHGJ1wxqTy91x1I",
    authDomain: "tarix-sinaq-db.firebaseapp.com",
    databaseURL: "https://tarix-sinaq-db-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tarix-sinaq-db",
    storageBucket: "tarix-sinaq-db.firebasestorage.app",
    messagingSenderId: "233204280838",
    appId: "1:233204280838:web:7d00c9800170a13ca45d87"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();
let timerInterval;

// DİL LÜĞƏTİ
const translations = {
    az: { welcome: "Nərminə Əmirbəyovanın sınaq portalı", login: "Giriş et", user: "İstifadəçi adı", pass: "Parol", start: "Sınağa Başla", logout: "Çıxış", timer: "Qalan vaxt", finish: "Bitir", score: "Topladığınız bal", date: "Bitmə vaxtı", select: "-- Sınaq seçin --" },
    ru: { welcome: "Тестовый портал Нармины Амирбековой", login: "Войти", user: "Имя пользователя", pass: "Пароль", start: "Начать тест", logout: "Выйти", timer: "Оставшееся время", finish: "Завершить", score: "Ваш балл", date: "Время окончания", select: "-- Выберите тест --" }
};

let currentLang = localStorage.getItem('siteLang') || 'az';
const t = translations[currentLang];

window.changeLang = (lang) => {
    localStorage.setItem('siteLang', lang);
    location.reload();
};

window.onload = () => {
    // Dil tətbiqi
    if(document.querySelector('h1')) document.querySelector('h1').innerText = t.welcome;
    if(document.getElementById('student-username')) document.getElementById('student-username').placeholder = t.user;
    if(document.getElementById('student-pass')) document.getElementById('student-pass').placeholder = t.pass;

    const user = localStorage.getItem('currentUser');
    if(user) {
        const u = JSON.parse(user);
        document.getElementById('student-login-area').classList.add('hidden');
        document.getElementById('quiz-selection-area').classList.remove('hidden');
        document.getElementById('welcome-msg').innerText = (currentLang === 'az' ? "Xoş gəldin, " : "Добро пожаловать, ") + u.name;
        
        database.ref('quizzes').on('value', snap => {
            const sel = document.getElementById('quiz-select');
            sel.innerHTML = `<option value="">${t.select}</option>`;
            snap.forEach(c => {
                let opt = document.createElement('option');
                opt.value = c.key; opt.innerText = c.val().title; sel.appendChild(opt);
            });
        });
    }
};

window.loginStudent = () => {
    const u = document.getElementById('student-username').value;
    const p = document.getElementById('student-pass').value;
    database.ref('students').once('value').then(snap => {
        let found = null;
        snap.forEach(c => { if(c.val().name === u && c.val().password === p) found = c.val(); });
        if(found) { localStorage.setItem('currentUser', JSON.stringify(found)); location.reload(); }
        else alert(currentLang === 'az' ? "Səhv!" : "Ошибка!");
    });
};

window.startQuiz = () => {
    const quizId = document.getElementById('quiz-select').value;
    if (!quizId) return;
    database.ref('quizzes/' + quizId).once('value').then(snap => {
        const quiz = snap.val();
        let quizHtml = `<h2>${quiz.title}</h2><div id="timer" style="color:red;font-weight:bold;">${t.timer}: ${quiz.time}:00</div><hr>`;
        quiz.questions.forEach((q, idx) => {
            quizHtml += `
                <div class="question-box" style="text-align:left; border-bottom:1px solid #eee; padding-bottom:15px;">
                    <p><strong>${idx + 1}. ${q.text} (${q.point} bal)</strong></p>
                    ${q.img ? `<img src="${q.img}" style="max-width:100%; border-radius:8px; margin:10px 0;">` : ''}
                    <div class="variants-list">
                        ${Object.entries(q.variants).map(([k, v]) => `
                            <label style="display:flex; align-items:center; gap:10px; margin:8px 0; cursor:pointer;">
                                <input type="radio" name="q${idx}" value="${k}"> <span>${k}) ${v}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>`;
        });
        quizHtml += `<button onclick="finishQuiz('${quizId}')" style="background:#27ae60; margin-top:20px;">${t.finish}</button>`;
        document.getElementById('quiz-selection-area').innerHTML = quizHtml;
        startTimer(quiz.time, quizId);
    });
};

function startTimer(min, qId) {
    let sec = min * 60;
    timerInterval = setInterval(() => {
        let m = Math.floor(sec / 60); let s = sec % 60;
        document.getElementById('timer').innerText = `${t.timer}: ${m}:${s < 10 ? '0'+s : s}`;
        if (sec <= 0) { clearInterval(timerInterval); finishQuiz(qId); }
        sec--;
    }, 1000);
}

window.finishQuiz = (qId) => {
    clearInterval(timerInterval);
    database.ref('quizzes/' + qId).once('value').then(snap => {
        const quiz = snap.val();
        let studentTotal = 0; let maxTotal = 0;
        let answers = [];
        const user = JSON.parse(localStorage.getItem('currentUser'));
        let reportHtml = `<h2>${t.finish}</h2><hr>`;

        quiz.questions.forEach((q, idx) => {
            const sel = document.querySelector(`input[name="q${idx}"]:checked`);
            const ans = sel ? sel.value : "---";
            const isOk = ans === q.correct;
            const p = Number(q.point) || 0;
            maxTotal += p; if (isOk) studentTotal += p;
            answers.push({ qText: q.text, studentAns: ans, correctAns: q.correct });

            reportHtml += `
                <div style="padding:15px; margin-bottom:10px; border-radius:10px; text-align:left; background:${isOk ? '#eaffea' : '#ffeaea'}; border:1px solid ${isOk ? '#27ae60' : '#c0392b'};">
                    <p><strong>${idx+1}. ${q.text}</strong></p>
                    <p>${currentLang==='az'?'Sizin':'Ваш'}: ${ans} | ${currentLang==='az'?'Düz':'Правильно'}: ${q.correct}</p>
                </div>`;
        });

        const finishTime = new Date().toLocaleString('az-AZ');
        database.ref('results').push({ studentName: user.name, quizTitle: quiz.title, score: studentTotal, maxScore: maxTotal, date: finishTime }).then(() => {
            document.getElementById('quiz-selection-area').innerHTML = `<h3>${t.score}: ${studentTotal} / ${maxTotal}</h3><p>${t.date}: ${finishTime}</p>` + reportHtml + `<button onclick="location.reload()">${t.logout}</button>`;
            window.scrollTo(0,0);
        });
    });
};

window.logout = () => { localStorage.removeItem('currentUser'); location.reload(); };
