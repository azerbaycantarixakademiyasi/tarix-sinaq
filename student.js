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
let examInterval; 

window.login = function() {
    const u = document.getElementById('std-user').value.trim();
    const p = document.getElementById('std-pass').value.trim();
    
    if(!u || !p) return alert("Bütün xanaları doldurun!");

    db.ref('students').orderByChild('name').equalTo(u).once('value', snap => {
        let user = null;
        snap.forEach(c => { if(c.val().password === p) user = c.val(); });
        
        if(user) {
            localStorage.setItem('student', JSON.stringify(user));
            location.reload(); 
        } else alert("İstifadəçi adı və ya şifrə yanlışdır!");
    });
};

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

function loadExams() {
    db.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const q = c.val();
            if(q.active) {
                h += `
                <div class="question-box" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="startQuiz('${c.key}')">
                    <span><b>${q.title}</b> (${q.time} dəq)</span>
                    <button style="width:100px; margin:0; padding:8px;">Başla 🚀</button>
                </div>`;
            }
        });
        document.getElementById('list-exams').innerHTML = h || "<p>Hazırda aktiv sınaq yoxdur.</p>";
    });
}
window.startQuiz = function(id) {
    db.ref('quizzes/'+id).once('value', snap => {
        const q = snap.val();
        
        const endTime = Date.now() + (q.time * 60 * 1000);
        localStorage.setItem('currentExamEnd', endTime);
        localStorage.setItem('currentExamId', id);

        renderQuizInterface(q, id);
    });
};

function renderQuizInterface(q, id) {
    document.getElementById('cabinet-screen').classList.add('hidden');
    const s = document.getElementById('quiz-screen');
    s.classList.remove('hidden');
    window.scrollTo(0,0);

    let html = `<div id="timer-box">⏳ <span id="clock">--:--</span></div>
                <h2 style="color:#1a4e8a; text-align:center;">${q.title}</h2><hr>`;

    q.questions.forEach((qs, i) => {
        html += `
        <div class="question-box">
            <p><b>${i+1}. ${qs.text}</b></p>
            ${qs.image ? `<img src="${qs.image}" style="max-width:100%; border-radius:10px; margin:10px 0;">` : ''}
            <div class="options">
                ${qs.variants ? Object.entries(qs.variants).map(([k,v]) => 
                    `<label style="display:block; padding:8px; cursor:pointer;">
                        <input type="radio" name="q${i}" value="${k}"> <b>${k})</b> ${v}
                    </label>`).join('') : 
                    `<input type="text" id="ans${i}" placeholder="Cavabınızı yazın..." style="width:100%; border-bottom:2px solid #1a4e8a;">`}
            </div>
        </div>`;
    });

    html += `<button onclick="finishQuiz('${id}')" style="background:#27ae60; margin:30px 0;">İmtahanı Bitir ✅</button>`;
    s.innerHTML = html;
    if(examInterval) clearInterval(examInterval);
    examInterval = setInterval(() => {
        const now = Date.now();
        const diff = localStorage.getItem('currentExamEnd') - now;

        if (diff <= 0) {
            clearInterval(examInterval);
            finishQuiz(id, true);
        } else {
            let m = Math.floor(diff / 60000);
            let sc = Math.floor((diff % 60000) / 1000);
            document.getElementById('clock').innerText = `${m}:${sc < 10 ? '0' : ''}${sc}`;
        }
    }, 1000);
}

window.finishQuiz = function(id, auto = false) {
    if(!auto && !confirm("İmtahanı bitirmək istədiyinizdən əminsiniz?")) return;
    
    clearInterval(examInterval);
    localStorage.removeItem('currentExamEnd');
    localStorage.removeItem('currentExamId');

    db.ref('quizzes/'+id).once('value', snap => {
        const q = snap.val();
        let correct = 0, wrong = 0;

        q.questions.forEach((qs, i) => {
            const sel = document.querySelector(`input[name="q${i}"]:checked`);
            const txt = document.getElementById(`ans${i}`);
            let uAns = sel ? sel.value : (txt ? txt.value.toUpperCase().trim() : "");

            if(uAns !== "") {
                if (uAns == qs.correct) {
                    correct++;
                } else {
                    if (i < 22) wrong++; 
                }
            }
        });

        const netScore = correct - (wrong / 4);
        let finalPercent = (netScore * (100 / q.questions.length)).toFixed(2);
        if (finalPercent < 0) finalPercent = 0;

        const user = JSON.parse(localStorage.getItem('student'));
        db.ref('results').push({
            studentName: user.name,
            quizTitle: q.title,
            score: finalPercent,
            details: `${correct} Düz, ${wrong} Səhv`,
            date: new Date().toLocaleString()
        }).then(() => {
            alert(`İmtahan bitdi!\nNəticə: ${finalPercent} bal\n(${correct} Düz, ${wrong} Səhv)`);
            location.reload();
        });
    });
};

// 6. MATERİALLAR VƏ NƏTİCƏLƏR
function loadMats() {
    db.ref('materials').on('value', snap => {
        let h = "<h3>Kitabxana</h3>";
        snap.forEach(c => {
            const m = c.val();
            h += `<div class="question-box" style="display:flex; justify-content:space-between; align-items:center;">
                    <span><b>${m.title}</b></span>
                    <a href="${m.link}" target="_blank" class="download-btn" style="background: #1a4e8a; color: white; padding: 8px 15px; border-radius: 8px; text-decoration: none;">Bax / Endir</a>
                  </div>`;
        });
        document.getElementById('list-mats').innerHTML = h || "<p>Material yoxdur.</p>";
    });
}

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
        document.getElementById('list-results').innerHTML = count > 0 ? h + "</table>" : "<p>Hələ nəticəniz yoxdur.</p>";
    });
}

window.logout = () => { localStorage.clear(); location.reload(); };

window.onload = () => {
    const ongoingId = localStorage.getItem('currentExamId');
    const endTime = localStorage.getItem('currentExamEnd');
    if(ongoingId && endTime > Date.now()) {
        startQuiz(ongoingId);
    }
};
