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
let quizQuestions = [];

function loadQuizzes() {
    database.ref('quizzes').on('value', snap => {
        const select = document.getElementById('quiz-select');
        if(!select) return;
        select.innerHTML = '<option value="">-- Sınaq seçin --</option>';
        snap.forEach(child => {
            const q = child.val();
            const opt = document.createElement('option');
            opt.value = child.key;
            opt.innerText = q.title;
            select.appendChild(opt);
        });
    });
}

// ADMİN PANEL FUNKSİYALARI
window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(d => d.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    if (tabId === 'students-section') loadStudents();
    if (tabId === 'results-section') loadResults();
};

window.addQuestionField = () => {
    const qIdx = quizQuestions.length + 1;
    const div = document.createElement('div');
    div.className = "question-box";
    div.innerHTML = `
        <strong>Sual ${qIdx}:</strong>
        <input type="text" placeholder="Sualın mətni" id="q-text-${qIdx}">
        <div id="vars-${qIdx}"></div>
        <button onclick="addVar(${qIdx})" style="width:auto; font-size:11px; background:#54a0ff;">+ Variant</button>
        <input type="text" placeholder="Düzgün hərf (Məs: A)" id="q-correct-${qIdx}" style="margin-top:10px; border-color:green;">
    `;
    document.getElementById('questions-area').appendChild(div);
    quizQuestions.push({ id: qIdx, vars: [] });
};

window.addVar = (qId) => {
    const q = quizQuestions.find(x => x.id === qId);
    const char = String.fromCharCode(65 + q.vars.length);
    const inp = document.createElement('input');
    inp.placeholder = `Variant ${char}`;
    inp.id = `q-${qId}-v-${char}`;
    document.getElementById(`vars-${qId}`).appendChild(inp);
    q.vars.push(char);
};

window.saveQuiz = () => {
    const title = document.getElementById('quiz-title').value;
    const time = document.getElementById('quiz-time').value;
    let data = { title, time, questions: [] };
    quizQuestions.forEach(q => {
        let qObj = { text: document.getElementById(`q-text-${q.id}`).value, correct: document.getElementById(`q-correct-${q.id}`).value, variants: {} };
        q.vars.forEach(v => { qObj.variants[v] = document.getElementById(`q-${q.id}-v-${v}`).value; });
        data.questions.push(qObj);
    });
    database.ref('quizzes').push(data).then(() => { alert("Sınaq yaradıldı!"); location.reload(); });
};

// GİRİŞ
window.loginStudent = () => {
    const u = document.getElementById('student-username').value;
    const p = document.getElementById('student-pass').value;
    database.ref('students').once('value').then(snap => {
        let user = null;
        snap.forEach(c => { if(c.val().name === u && c.val().password === p) user = c.val(); });
        if(user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            showQuizArea(user);
        } else alert("Səhv məlumat!");
    });
};

function showQuizArea(user) {
    document.getElementById('login-screen').children[0].classList.add('hidden');
    document.getElementById('student-login-area').classList.add('hidden');
    document.getElementById('quiz-selection-area').classList.remove('hidden');
    document.getElementById('welcome-msg').innerText = "Xoş gəldin, " + user.name;
    loadQuizzes(); 
}

window.checkAdmin = () => {
    if(document.getElementById('admin-password').value === "12345") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        window.showTab('results-section');
    } else alert("Səhv şifrə!");
};

window.showAdminLogin = () => { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); };
window.hideAdminLogin = () => { document.getElementById('admin-login').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); };
window.logout = () => { localStorage.removeItem('currentUser'); location.reload(); };

// ŞAGİRD VƏ NƏTİCƏ YÜKLƏMƏ
function loadStudents() {
    database.ref('students').on('value', snap => {
        let h = `<table><tr><th>Ad</th><th>Parol</th></tr>`;
        snap.forEach(c => { h += `<tr><td>${c.val().name}</td><td>${c.val().password}</td></tr>`; });
        document.getElementById('students-list').innerHTML = h + `</table>`;
    });
}

function loadResults() {
    database.ref('results').on('value', snap => {
        let h = `<table><tr><th>Şagird</th><th>Bal</th><th>Bax</th></tr>`;
        snap.forEach(c => {
            const r = c.val();
            h += `<tr><td>${r.studentName}</td><td>${r.score}%</td><td><button onclick="viewDetail('${c.key}')" style="padding:2px 5px; width:auto;">👁</button></td></tr>`;
        });
        document.getElementById('results-display').innerHTML = h + `</table>`;
    });
}

window.addStudent = () => {
    const n = document.getElementById('new-std-name').value;
    const p = document.getElementById('new-std-pass').value;
    if(n && p) database.ref('students').push({name: n, password: p}).then(() => alert("Əlavə olundu!"));
};

// MODAL FUNKSİYALARI
window.viewDetail = (id) => {
    database.ref('results/' + id).once('value', snap => {
        const r = snap.val();
        let c = `<strong>${r.quizTitle}</strong><hr>`;
        r.answers.forEach((a, i) => {
            const isOk = a.studentAns === a.correctAns;
            c += `<p style="color:${isOk?'green':'red'}">${i+1}. ${a.qText}<br>Cavab: ${a.studentAns} | Düz: ${a.correctAns}</p>`;
        });
        document.getElementById('modal-content').innerHTML = c;
        document.getElementById('details-modal').classList.remove('hidden');
    });
};
window.closeModal = () => document.getElementById('details-modal').classList.add('hidden');
