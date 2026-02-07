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

window.loginStudent = () => {
    const u = document.getElementById('student-username').value;
    const p = document.getElementById('student-pass').value;
    database.ref('students').once('value').then(snap => {
        let found = null;
        snap.forEach(c => { if(c.val().name === u && c.val().password === p) found = c.val(); });
        if(found) { localStorage.setItem('currentUser', JSON.stringify(found)); location.reload(); }
        else alert("Məlumatlar səhvdir!");
    });
};

window.onload = () => {
    const user = localStorage.getItem('currentUser');
    if(user) {
        const u = JSON.parse(user);
        document.getElementById('student-login-area').classList.add('hidden');
        document.getElementById('quiz-selection-area').classList.remove('hidden');
        document.getElementById('welcome-msg').innerText = "Xoş gəldin, " + u.name;
        database.ref('quizzes').on('value', snap => {
            const sel = document.getElementById('quiz-select');
            sel.innerHTML = '<option value="">-- Sınaq seçin --</option>';
            snap.forEach(c => {
                let opt = document.createElement('option');
                opt.value = c.key; opt.innerText = c.val().title; sel.appendChild(opt);
            });
        });
    }
};

window.startQuiz = () => {
    const quizId = document.getElementById('quiz-select').value;
    if (!quizId) return alert("Sınaq seçin!");

    database.ref('quizzes/' + quizId).once('value').then(snap => {
        const quiz = snap.val();
        let quizHtml = `<h2>${quiz.title}</h2><div id="timer" style="color:red; font-weight:bold; margin-bottom:10px;">Qalan vaxt: ${quiz.time}:00</div><hr>`;
        
        quiz.questions.forEach((q, idx) => {
            quizHtml += `
                <div class="question-box" style="text-align:left; border-bottom:1px solid #eee; padding-bottom:15px;">
                    <p><strong>${idx + 1}. ${q.text}</strong></p>
                    ${q.img ? `<img src="${q.img}" style="max-width:100%; border-radius:8px; margin:10px 0; display:block;">` : ''}
                    <div class="variants-list">
                        ${Object.entries(q.variants).map(([k, v]) => `
                            <label style="display:block; margin:5px 0; cursor:pointer;">
                                <input type="radio" name="q${idx}" value="${k}"> ${k}) ${v}
                            </label>
                        `).join('')}
                    </div>
                </div>`;
        });

        quizHtml += `<button onclick="finishQuiz('${quizId}')" style="background:#27ae60; margin-top:20px;">İmtahanı Bitir</button>`;
        document.getElementById('quiz-selection-area').innerHTML = quizHtml;
        startTimer(quiz.time, quizId);
    });
};

function startTimer(min, qId) {
    let sec = min * 60;
    timerInterval = setInterval(() => {
        let m = Math.floor(sec / 60);
        let s = sec % 60;
        document.getElementById('timer').innerText = `Qalan vaxt: ${m}:${s < 10 ? '0'+s : s}`;
        if (sec <= 0) { clearInterval(timerInterval); finishQuiz(qId); }
        sec--;
    }, 1000);
}

window.finishQuiz = (qId) => {
    clearInterval(timerInterval);
    database.ref('quizzes/' + qId).once('value').then(snap => {
        const quiz = snap.val();
        let correctCount = 0;
        let answers = [];
        const user = JSON.parse(localStorage.getItem('currentUser'));

        let reportHtml = `<h2>İmtahan Nəticəsi</h2><hr>`;

        quiz.questions.forEach((q, idx) => {
            const sel = document.querySelector(`input[name="q${idx}"]:checked`);
            const ans = sel ? sel.value : "Yoxdur";
            const isOk = ans === q.correct;
            if (isOk) correctCount++;
            
            answers.push({ qText: q.text, studentAns: ans, correctAns: q.correct });

            reportHtml += `
                <div style="padding:15px; margin-bottom:10px; border-radius:10px; text-align:left; background:${isOk ? '#eaffea' : '#ffeaea'}; border:1px solid ${isOk ? '#27ae60' : '#c0392b'};">
                    <p><strong>${idx+1}. ${q.text}</strong></p>
                    <p style="font-size:14px;">Sizin cavab: <b>${ans}</b> | Düzgün: <b>${q.correct}</b> ${isOk ? '✅' : '❌'}</p>
                </div>`;
        });

        const score = Math.round((correctCount / quiz.questions.length) * 100);
        reportHtml = `<h3 style="color:#1a4e8a;">Ümumi Balınız: ${score}%</h3>` + reportHtml;
        reportHtml += `<button onclick="location.reload()" style="background:#3498db; margin-top:20px;">Ana Səhifəyə Qayıt</button>`;

        database.ref('results').push({
            studentName: user.name,
            quizTitle: quiz.title,
            score: score,
            answers: answers,
            date: new Date().toLocaleString()
        }).then(() => {
            document.getElementById('quiz-selection-area').innerHTML = reportHtml;
            window.scrollTo(0,0);
        });
    });
};

window.logout = () => { localStorage.removeItem('currentUser'); location.reload(); };
