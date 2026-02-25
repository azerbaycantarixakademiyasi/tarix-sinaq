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

window.onload = () => {
    const user = localStorage.getItem('currentUser');
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('cabinet-area').style.display = 'block';
        document.getElementById('welcome-msg').innerText = "Xoş gəldin, " + JSON.parse(user).name;
        showCabinetTab('exams-tab');
    }
};

window.loginStudent = () => {
    const u = document.getElementById('student-username').value;
    const p = document.getElementById('student-pass').value;
    
    if(!u || !p) return alert("Xanaları doldurun!");

    database.ref('students').once('value').then(snap => {
        let found = null;
        snap.forEach(c => {
            if (c.val().name === u && c.val().password === p) found = c.val();
        });
        
        if (found) {
            localStorage.setItem('currentUser', JSON.stringify(found));
            location.reload();
        } else {
            alert("İstifadəçi adı və ya parol səhvdir!");
        }
    });
};

window.showCabinetTab = (tabId) => {
    document.querySelectorAll('.cabinet-content').forEach(el => el.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    
    if (tabId === 'exams-tab') loadExams();
    if (tabId === 'library-tab') loadLibrary();
    if (tabId === 'results-tab') loadMyResults();
};

function loadExams() {
    database.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const q = c.val();
            if (q.active) {
                h += `<div class="exam-item" style="border:1px solid #ddd; padding:15px; margin-bottom:10px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
                    <span><b>${q.title}</b> (${q.time} dəqiqə)</span>
                    <button onclick="startQuiz('${c.key}')" style="width:auto; background:#27ae60;">Başla</button>
                </div>`;
            }
        });
        document.getElementById('active-exams-list').innerHTML = h || "Hazırda aktiv imtahan yoxdur.";
    });
}

window.startQuiz = (qId) => {
    database.ref('quizzes/' + qId).once('value').then(snap => {
        const quiz = snap.val();
        document.getElementById('cabinet-area').style.display = 'none';
        const qArea = document.getElementById('quiz-area');
        qArea.style.display = 'block';
        
        let html = `<h2>${quiz.title}</h2><div id="timer" style="color:red; font-weight:bold; font-size:20px;">Vaxt: ${quiz.time}:00</div><hr>`;
        quiz.questions.forEach((q, idx) => {
            html += `<div class="question-box" style="text-align:left; margin-bottom:30px; padding:15px; background:#f9f9f9; border-radius:10px;">
                <p><strong>${idx+1}. ${q.text} (${q.point} bal)</strong></p>
                ${q.img ? `<img src="${q.img}" style="max-width:100%; border-radius:10px; margin:10px 0;">` : ''}
                <div style="margin-top:10px;">
                    ${Object.entries(q.variants).map(([k, v]) => `
                        <label style="display:block; margin:8px 0; cursor:pointer;">
                            <input type="radio" name="q${idx}" value="${k}"> <b>${k})</b> ${v}
                        </label>
                    `).join('')}
                </div>
            </div>`;
        });
        html += `<button onclick="finishQuiz('${qId}')" style="background:#2ecc71; width:100%; padding:15px; font-size:18px;">İmtahanı Bitir</button>`;
        qArea.innerHTML = html;
        
        let sec = quiz.time * 60;
        timerInterval = setInterval(() => {
            let m = Math.floor(sec / 60); let s = sec % 60;
            document.getElementById('timer').innerText = `Vaxt: ${m}:${s < 10 ? '0'+s : s}`;
            if (sec <= 0) { clearInterval(timerInterval); finishQuiz(qId); }
            sec--;
        }, 1000);
    });
};

window.finishQuiz = (qId) => {
    clearInterval(timerInterval);
    database.ref('quizzes/' + qId).once('value').then(snap => {
        const quiz = snap.val();
        let correctCount = 0, wrongCount = 0, earnedPoints = 0, maxPoints = 0;

        quiz.questions.forEach((q, idx) => {
            const sel = document.querySelector(`input[name="q${idx}"]:checked`);
            const ans = sel ? sel.value : null;
            const p = Number(q.point);
            maxPoints += p;
            if (ans === q.correct) { correctCount++; earnedPoints += p; }
            else if (ans !== null) { wrongCount++; }
        });

        const penalty = (wrongCount / 4) * (maxPoints / quiz.questions.length);
        const finalScore = Math.max(0, earnedPoints - penalty).toFixed(2);

        const user = JSON.parse(localStorage.getItem('currentUser'));
        database.ref('results').push({
            studentName: user.name,
            quizTitle: quiz.title,
            score: finalScore,
            maxScore: maxPoints,
            correct: correctCount,
            wrong: wrongCount,
            date: new Date().toLocaleString('az-AZ')
        }).then(() => {
            alert("İmtahan başa çatdı! Balınız: " + finalScore);
            location.reload();
        });
    });
};

function loadLibrary() {
    database.ref('materials').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const m = c.val();
            h += `<div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
                <span><b>[${m.type.toUpperCase()}]</b> ${m.title}</span>
                <a href="${m.link}" target="_blank" style="color:#3498db; font-weight:bold;">Aç</a>
            </div>`;
        });
        document.getElementById('materials-list').innerHTML = h || "Material yoxdur.";
    });
}

function loadMyResults() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    database.ref('results').on('value', snap => {
        let h = "<table style='width:100%; border-collapse:collapse;'><tr><th>Sınaq</th><th>Bal</th><th>D/S</th></tr>";
        snap.forEach(c => {
            const r = c.val();
            if (r.studentName === user.name) {
                h += `<tr style='border-bottom:1px solid #eee; text-align:center;'>
                    <td style='padding:10px;'>${r.quizTitle}</td>
                    <td><b>${r.score}</b></td>
                    <td>${r.correct}/${r.wrong}</td>
                </tr>`;
            }
        });
        document.getElementById('my-results-list').innerHTML = h + "</table>";
    });
}

window.logout = () => { localStorage.removeItem('currentUser'); location.reload(); };
