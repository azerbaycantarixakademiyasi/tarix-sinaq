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

// Kabinet tablarını dəyişmək
window.showCabinetTab = (tabId) => {
    document.querySelectorAll('.cabinet-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    if(tabId === 'exams-tab') loadExams();
    if(tabId === 'library-tab') loadLibrary();
    if(tabId === 'results-tab') loadMyResults();
};

window.onload = () => {
    const user = localStorage.getItem('currentUser');
    if(user) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('cabinet-area').classList.remove('hidden');
        document.getElementById('welcome-msg').innerText = "Xoş gəldin, " + JSON.parse(user).name;
        showCabinetTab('exams-tab');
    }
};

window.loginStudent = () => {
    const u = document.getElementById('student-username').value;
    const p = document.getElementById('student-pass').value;
    database.ref('students').once('value').then(snap => {
        let found = null;
        snap.forEach(c => { if(c.val().name === u && c.val().password === p) found = c.val(); });
        if(found) { 
            localStorage.setItem('currentUser', JSON.stringify(found)); 
            location.reload(); 
        } else alert("Giriş məlumatları səhvdir!");
    });
};

function loadExams() {
    database.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const q = c.val();
            if(q.active) {
                h += `<div class="exam-item" style="display:flex; justify-content:space-between; padding:10px; border:1px solid #ddd; margin-bottom:5px; border-radius:8px;">
                    <span><b>${q.title}</b> (${q.time} dəq)</span>
                    <button onclick="startQuiz('${c.key}')" style="width:auto; padding:5px 15px; background:#27ae60;">Başla</button>
                </div>`;
            }
        });
        document.getElementById('active-exams-list').innerHTML = h || "Hazırda aktiv imtahan yoxdur.";
    });
}

window.startQuiz = (qId) => {
    database.ref('quizzes/' + qId).once('value').then(snap => {
        const quiz = snap.val();
        document.getElementById('cabinet-area').classList.add('hidden');
        const qArea = document.getElementById('quiz-area');
        qArea.classList.remove('hidden');
        
        let html = `<h2>${quiz.title}</h2><div id="timer" style="color:red; font-weight:bold;">Vaxt: ${quiz.time}:00</div><hr>`;
        quiz.questions.forEach((q, idx) => {
            html += `<div class="question-box" style="text-align:left; margin-bottom:20px;">
                <p><strong>${idx+1}. ${q.text} (${q.point} bal)</strong></p>
                ${q.img ? `<img src="${q.img}" style="max-width:100%; border-radius:10px; margin-bottom:10px;">` : ''}
                ${Object.entries(q.variants).map(([k, v]) => `
                    <label style="display:block; margin:5px 0;"><input type="radio" name="q${idx}" value="${k}"> ${k}) ${v}</label>
                `).join('')}
            </div>`;
        });
        html += `<button onclick="finishQuiz('${qId}')" style="background:#27ae60;">İmtahanı Bitir</button>`;
        qArea.innerHTML = html;
        startTimer(quiz.time, qId);
    });
};

function startTimer(min, qId) {
    let sec = min * 60;
    timerInterval = setInterval(() => {
        let m = Math.floor(sec / 60); let s = sec % 60;
        document.getElementById('timer').innerText = `Vaxt: ${m}:${s < 10 ? '0'+s : s}`;
        if (sec <= 0) { clearInterval(timerInterval); finishQuiz(qId); }
        sec--;
    }, 1000);
}



window.finishQuiz = (qId) => {
    clearInterval(timerInterval);
    database.ref('quizzes/' + qId).once('value').then(snap => {
        const quiz = snap.val();
        let correct = 0, wrong = 0, earned = 0, max = 0;

        quiz.questions.forEach((q, idx) => {
            const sel = document.querySelector(`input[name="q${idx}"]:checked`);
            const ans = sel ? sel.value : null;
            const p = Number(q.point);
            max += p;
            if(ans === q.correct) { correct++; earned += p; }
            else if(ans !== null) { wrong++; }
        });
        const penalty = (wrong / 4) * (max / quiz.questions.length);
        const finalScore = Math.max(0, earned - penalty).toFixed(2);

        const user = JSON.parse(localStorage.getItem('currentUser'));
        database.ref('results').push({
            studentName: user.name,
            quizTitle: quiz.title,
            score: finalScore,
            maxScore: max,
            correct, wrong,
            date: new Date().toLocaleString('az-AZ')
        }).then(() => {
            alert("İmtahan bitdi! Balınız: " + finalScore);
            location.reload();
        });
    });
};

function loadLibrary() {
    database.ref('materials').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const m = c.val();
            h += `<div style="padding:10px; border-bottom:1px solid #eee;">
                <b>[${m.type.toUpperCase()}]</b> ${m.title} 
                <a href="${m.link}" target="_blank" style="float:right; color:blue;">Aç / Yüklə</a>
            </div>`;
        });
        document.getElementById('materials-list').innerHTML = h || "Hələlik material yoxdur.";
    });
}

function loadMyResults() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    database.ref('results').on('value', snap => {
        let h = "<table><tr><th>Sınaq</th><th>Bal</th><th>D/S</th></tr>";
        snap.forEach(c => {
            const r = c.val();
            if(r.studentName === user.name) {
                h += `<tr><td>${r.quizTitle}</td><td><b>${r.score}</b></td><td>${r.correct}/${r.wrong}</td></tr>`;
            }
        });
        document.getElementById('my-results-list').innerHTML = h + "</table>";
    });
}

window.logout = () => { localStorage.removeItem('currentUser'); location.reload(); };
