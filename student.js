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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
let examTimer; 

// Şagird Girişi
window.login = function() {
    const u = document.getElementById('std-user').value.trim();
    const p = document.getElementById('std-pass').value.trim();
    
    db.ref('students').once('value', snap => {
        let user = null;
        snap.forEach(c => { if(c.val().name === u && c.val().password === p) user = c.val(); });
        
        if(user) {
            localStorage.setItem('student', JSON.stringify(user));
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('cabinet-screen').classList.remove('hidden');
            document.getElementById('display-name').innerText = user.name;
            document.getElementById('display-pass').innerText = user.password;
            goBack();
        } else {
            alert("İstifadəçi adı və ya şifrə yanlışdır!");
        }
    });
};

// Menyu Naviqasiyası 
window.showTab = function(id) {
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('tab-container').classList.remove('hidden');
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    
    document.getElementById(id).classList.remove('hidden');
    if(id === 'exams') loadExams();
    if(id === 'library') loadMats();
    if(id === 'results') loadRes();
};

window.goBack = () => {
    document.getElementById('main-dashboard').classList.remove('hidden');
    document.getElementById('tab-container').classList.add('hidden');
};

// Sınaqların Yüklənməsi
function loadExams() {
    db.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            if(c.val().active) {
                h += `<div class="question-box" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="startQuiz('${c.key}')">
                    <span><b>${c.val().title}</b> (${c.val().time} dəq)</span>
                    <button style="width:70px; margin:0; padding:5px;">Başla</button>
                </div>`;
            }
        });
        document.getElementById('list-exams').innerHTML = h || "Hazırda aktiv sınaq yoxdur.";
    });
}

window.startQuiz = function(id) {
    db.ref('quizzes/'+id).once('value', snap => {
        const q = snap.val();
        let timeLeft = (q.time || 90) * 60; 
        
        document.getElementById('cabinet-screen').classList.add('hidden');
        const s = document.getElementById('quiz-screen');
        s.classList.remove('hidden');

        let html = `
            <div id="timer-box">Qalan vaxt: <span id="clock">--:--</span></div>
            <h2 style="color:#1a4e8a">${q.title}</h2><hr>`;

        q.questions.forEach((qs, i) => {
            html += `<div class="question-box">
                <p><b>${i+1}. ${qs.text}</b></p>
                ${qs.variants ? Object.entries(qs.variants).map(([k,v]) => 
                    `<label style="display:block; margin:5px 0;"><input type="radio" name="q${i}" value="${k}"> ${k}) ${v}</label>`).join('') : 
                    `<input type="text" id="ans${i}" placeholder="Cavabı yazın..." style="width:90%;">`}
            </div>`;
        });
        
        html += `<button onclick="finishQuiz('${id}')" style="background:#27ae60; margin-top:20px;">İmtahanı Bitir</button>`;
        s.innerHTML = html;
        examTimer = setInterval(() => {
            let m = Math.floor(timeLeft / 60);
            let sc = timeLeft % 60;
            document.getElementById('clock').innerText = `${m}:${sc < 10 ? '0' : ''}${sc}`;
            if (timeLeft-- <= 0) {
                clearInterval(examTimer);
                alert("Vaxt bitdi!");
                finishQuiz(id, true);
            }
        }, 1000);
        window.scrollTo(0,0);
    });
};

// 4 Səhv 1 Düz Hesablaması
window.finishQuiz = function(id, auto = false) {
    if(!auto && !confirm("İmtahanı bitirmək istəyirsiniz?")) return;
    clearInterval(examTimer);

    db.ref('quizzes/'+id).once('value', snap => {
        const q = snap.val();
        let correctCount = 0;
        let wrongCount = 0;

        q.questions.forEach((qs, i) => {
            const sel = document.querySelector(`input[name="q${i}"]:checked`);
            const txt = document.getElementById(`ans${i}`);
            let uAns = sel ? sel.value : (txt ? txt.value.toUpperCase().trim() : "");

            if (uAns !== "") {
                if (uAns == qs.correct) {
                    correctCount++;
                } else {
                    if (i < 22) wrongCount++; 
                }
            }
        });
        let net = correctCount - (wrongCount / 4);
        let finalScore = (net * (100 / q.questions.length)).toFixed(2);
        if (finalScore < 0) finalScore = 0;

        const user = JSON.parse(localStorage.getItem('student'));
        db.ref('results').push({
            studentName: user.name,
            quizTitle: q.title,
            score: finalScore,
            date: new Date().toLocaleString()
        }).then(() => {
            alert("İmtahan bitdi! Balınız: " + finalScore);
            location.reload();
        });
    });
};

// Kitabxana (PDF Endirmə)
function loadMats() {
    db.ref('materials').on('value', snap => {
        let h = "<h3>Tədris Materialları</h3>";
        snap.forEach(c => {
            const m = c.val();
            h += `<div class="question-box" style="display:flex; justify-content:space-between; align-items:center;">
                <span><b>${m.title}</b></span>
                <a href="${m.link}" target="_blank" download style="background:#1a4e8a; color:white; padding:5px 15px; border-radius:5px; text-decoration:none; font-size:12px;">Endir / Bax</a>
            </div>`;
        });
        document.getElementById('list-mats').innerHTML = h || "Material yoxdur.";
    });
}

// Nəticələrin Görünməsi
function loadRes() {
    const user = JSON.parse(localStorage.getItem('student'));
    db.ref('results').on('value', snap => {
        let h = "<table><tr><th>Sınaq</th><th>Bal</th><th>Tarix</th></tr>";
        let count = 0;
        snap.forEach(c => {
            const r = c.val();
            if(r.studentName === user.name) {
                h += `<tr><td>${r.quizTitle}</td><td><b>${r.score}</b></td><td><small>${r.date}</small></td></tr>`;
                count++;
            }
        });
        document.getElementById('list-results').innerHTML = count > 0 ? h + "</table>" : "Hələ nəticəniz yoxdur.";
    });
}

window.logout = () => { localStorage.removeItem('student'); location.reload(); };
