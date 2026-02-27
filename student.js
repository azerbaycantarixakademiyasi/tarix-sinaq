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
        } else alert("Səhv məlumat!");
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
            if(c.val().active) h += `<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                <span>${c.val().title}</span><button onclick="startQuiz('${c.key}')" style="width:70px;">Başla</button></div>`;
        });
        document.getElementById('list-exams').innerHTML = h || "Sınaq yoxdur.";
    });
}

window.startQuiz = function(id) {
    db.ref('quizzes/'+id).once('value', snap => {
        const q = snap.val();
        document.getElementById('cabinet-screen').classList.add('hidden');
        const s = document.getElementById('quiz-screen');
        s.classList.remove('hidden');
        let html = `<h2>${q.title}</h2><hr>`;
        q.questions.forEach((qs, i) => {
            html += `<div class="question-box">
                <p><b>${i+1}. ${qs.text}</b></p>
                ${qs.variants ? Object.entries(qs.variants).map(([k,v]) => 
                    `<label style="display:block;"><input type="radio" name="q${i}" value="${k}"> ${k}) ${v}</label>`).join('') : 
                    `<input type="text" id="ans${i}" placeholder="Cavabı yazın..." style="width:80%;">`}
            </div>`;
        });
        html += `<button onclick="finishQuiz('${id}')">Bitir</button>`;
        s.innerHTML = html;
    });
};

window.finishQuiz = function(id) {
    db.ref('quizzes/'+id).once('value', snap => {
        const q = snap.val();
        let cor = 0;
        q.questions.forEach((qs, i) => {
            const sel = document.querySelector(`input[name="q${i}"]:checked`);
            const txt = document.getElementById(`ans${i}`);
            let userAns = sel ? sel.value : (txt ? txt.value.toUpperCase().trim() : "");
            if(userAns == qs.correct) cor++;
        });
        const user = JSON.parse(localStorage.getItem('student'));
        db.ref('results').push({ studentName: user.name, quizTitle: q.title, score: cor, date: new Date().toLocaleString() })
        .then(() => { alert("İmtahan bitdi. Düzgün cavab sayı: " + cor); location.reload(); });
    });
};

function loadMats() {
    db.ref('materials').on('value', snap => {
        let h = "";
        snap.forEach(c => { h += `<div style="padding:10px; border-bottom:1px solid #eee;">${c.val().title} <a href="${c.val().link}" target="_blank">Aç</a></div>`; });
        document.getElementById('list-mats').innerHTML = h || "Material yoxdur.";
    });
}

function loadRes() {
    const user = JSON.parse(localStorage.getItem('student'));
    db.ref('results').on('value', snap => {
        let h = "<table><tr><th>Sınaq</th><th>Düz</th></tr>";
        snap.forEach(c => { if(c.val().studentName === user.name) h += `<tr><td>${c.val().quizTitle}</td><td>${c.val().score}</td></tr>`; });
        document.getElementById('list-results').innerHTML = h + "</table>";
    });
}

window.logout = () => { localStorage.removeItem('student'); location.reload(); };
