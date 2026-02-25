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

window.login = function() {
    const u = document.getElementById('std-user').value;
    const p = document.getElementById('std-pass').value;

    db.ref('students').once('value').then(snap => {
        let user = null;
        snap.forEach(c => {
            if(c.val().name === u && c.val().password === p) user = c.val();
        });

        if(user) {
            localStorage.setItem('student', JSON.stringify(user));
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('cabinet-screen').classList.remove('hidden');
            
            // Xəta burda idi, elementin mövcudluğunu yoxlayırıq
            const nameEl = document.getElementById('user-name-display');
            if(nameEl) nameEl.innerText = "Xoş gəldin, " + user.name;
            
            showTab('exams');
        } else alert("Məlumatlar yanlışdır!");
    });
};

window.showTab = function(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');

    if(id === 'exams') loadExams();
    if(id === 'library') loadMats();
    if(id === 'results') loadRes();
};

function loadExams() {
    db.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            if(c.val().active) {
                h += `<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
                    <span>${c.val().title}</span>
                    <button onclick="startQuiz('${c.key}')" style="width:80px; margin:0;">Başla</button>
                </div>`;
            }
        });
        document.getElementById('list-exams').innerHTML = h || "Aktiv sınaq yoxdur.";
    });
}

window.startQuiz = function(id) {
    db.ref('quizzes/'+id).once('value').then(snap => {
        const q = snap.val();
        document.getElementById('cabinet-screen').classList.add('hidden');
        const screen = document.getElementById('quiz-screen');
        screen.classList.remove('hidden');
        let html = `<h2>${q.title}</h2><hr>`;
        q.questions.forEach((s, i) => {
            html += `<div style="text-align:left; margin-bottom:20px; background:#f9f9f9; padding:10px; border-radius:8px;">
                <p><b>${i+1}. ${s.text}</b></p>
                ${s.img ? `<img src="${s.img}" style="max-width:100%;">` : ''}
                ${Object.entries(s.variants).map(([k,v]) => `<label style="display:block;"><input type="radio" name="q${i}" value="${k}"> ${k}) ${v}</label>`).join('')}
            </div>`;
        });
        html += `<button onclick="finishQuiz('${id}')">Bitir</button>`;
        screen.innerHTML = html;
    });
};

window.finishQuiz = function(id) {
    db.ref('quizzes/'+id).once('value').then(snap => {
        const q = snap.val();
        let cor = 0, wrg = 0, earned = 0, max = 0;
        q.questions.forEach((s, i) => {
            const sel = document.querySelector(`input[name="q${i}"]:checked`);
            const p = Number(s.point); max += p;
            if(sel && sel.value === s.correct) { cor++; earned += p; }
            else if(sel) { wrg++; }
        });
        const penalty = (wrg / 4) * (max / q.questions.length);
        const final = Math.max(0, earned - penalty).toFixed(2);
        const user = JSON.parse(localStorage.getItem('student'));
        db.ref('results').push({ studentName: user.name, quizTitle: q.title, score: final, correct: cor, wrong: wrg, date: new Date().toLocaleString() })
        .then(() => { alert("Bitdi! Bal: " + final); location.reload(); });
    });
};

function loadMats() {
    db.ref('materials').on('value', snap => {
        let h = "";
        snap.forEach(c => { h += `<div style="padding:10px; border-bottom:1px solid #eee;">${c.val().title} <a href="${c.val().link}" target="_blank" style="float:right;">Aç</a></div>`; });
        document.getElementById('list-mats').innerHTML = h || "Material yoxdur.";
    });
}

function loadRes() {
    const user = JSON.parse(localStorage.getItem('student'));
    db.ref('results').on('value', snap => {
        let h = "<table><tr><th>Sınaq</th><th>Bal</th><th>D/S</th></tr>";
        snap.forEach(c => { if(c.val().studentName === user.name) h += `<tr><td>${c.val().quizTitle}</td><td>${c.val().score}</td><td>${c.val().correct}/${c.val().wrong}</td></tr>`; });
        document.getElementById('list-results').innerHTML = h + "</table>";
    });
}

window.logout = () => { localStorage.removeItem('student'); location.reload(); };
