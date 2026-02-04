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

// 1. ÜMUMİ FUNKSİYALAR
window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(d => d.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    if (tabId === 'students-section') loadStudents();
    if (tabId === 'results-section') loadResults();
    if (tabId === 'quizzes-section') loadAdminQuizzes();
};

// 2. SINAQ YARATMA (ADMİN)
window.addQuestionField = () => {
    const qIdx = quizQuestions.length + 1;
    const div = document.createElement('div');
    div.className = "question-box";
    div.innerHTML = `
        <strong>Sual ${qIdx}:</strong>
        <input type="text" placeholder="Sualı yazın" id="q-text-${qIdx}">
        <div id="vars-${qIdx}"></div>
        <button onclick="addVar(${qIdx})" style="width:auto; font-size:11px; background:#54a0ff;">+ Variant Əlavə Et</button>
        <input type="text" placeholder="Düzgün variantın hərfi (A, B...)" id="q-correct-${qIdx}" style="margin-top:10px; border-color:green;">
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
    if(!title || quizQuestions.length === 0) return alert("Məlumatları doldurun!");

    let data = { title, time, questions: [] };
    quizQuestions.forEach(q => {
        let qObj = { text: document.getElementById(`q-text-${q.id}`).value, correct: document.getElementById(`q-correct-${q.id}`).value, variants: {} };
        q.vars.forEach(v => { qObj.variants[v] = document.getElementById(`q-${q.id}-v-${v}`).value; });
        data.questions.push(qObj);
    });

    database.ref('quizzes').push(data).then(() => { alert("Sınaq Arxivə Yazıldı!"); location.reload(); });
};

// 3. ARXİVİ GÖRMƏK (ADMİN)
function loadAdminQuizzes() {
    database.ref('quizzes').on('value', snap => {
        let h = `<table><tr><th>Sınaq Adı</th><th>Sil</th></tr>`;
        snap.forEach(c => {
            h += `<tr><td>${c.val().title}</td><td><button onclick="deleteQuiz('${c.key}')" style="background:red; width:auto; padding:2px 8px;">Sil</button></td></tr>`;
        });
        document.getElementById('admin-quizzes-list').innerHTML = h + `</table>`;
    });
}
window.deleteQuiz = (id) => { if(confirm("Silinsin?")) database.ref('quizzes/' + id).remove(); };

// 4. ŞAGİRD VƏ NƏTİCƏ İDARƏETMƏSİ
function loadStudents() {
    database.ref('students').on('value', snap => {
        let h = `<table><tr><th>Ad Soyad</th><th>Parol</th><th>Sil</th></tr>`;
        snap.forEach(c => {
            h += `<tr><td>${c.val().name}</td><td>${c.val().password}</td><td><button onclick="deleteStudent('${c.key}')" style="background:red; width:auto;">X</button></td></tr>`;
        });
        document.getElementById('students-list').innerHTML = h + `</table>`;
    });
}

function loadResults() {
    database.ref('results').on('value', snap => {
        let h = `<table><tr><th>Şagird</th><th>Bal</th><th>Bax</th></tr>`;
        snap.forEach(c => {
            const r = c.val();
            h += `<tr><td>${r.studentName}</td><td>${r.score}%</td><td><button onclick="viewDetail('${c.key}')" style="width:auto; padding:2px 10px;">Bax</button></td></tr>`;
        });
        document.getElementById('results-display').innerHTML = h + `</table>`;
    });
}

// 5. DETALLI BAXIŞ (BAX DÜYMƏSİ)
window.viewDetail = (id) => {
    database.ref('results/' + id).once('value', snap => {
        const r = snap.val();
        let c = `<strong>Şagird:</strong> ${r.studentName}<br><strong>Sınaq:</strong> ${r.quizTitle}<hr>`;
        r.answers.forEach((a, i) => {
            const isOk = a.studentAns === a.correctAns;
            c += `<p style="color:${isOk?'green':'red'}">Sual ${i+1}: ${a.qText}<br>Cavab: ${a.studentAns} | Düz: ${a.correctAns} ${isOk?'✅':'❌'}</p>`;
        });
        document.getElementById('modal-content').innerHTML = c;
        document.getElementById('details-modal').classList.remove('hidden');
    });
};
window.closeModal = () => document.getElementById('details-modal').classList.add('hidden');

// 6. GİRİŞ VƏ SESSİYA
window.loginStudent = () => {
    const u = document.getElementById('student-username').value;
    const p = document.getElementById('student-pass').value;
    database.ref('students').once('value').then(snap => {
        let found = null;
        snap.forEach(c => { if(c.val().name === u && c.val().password === p) found = c.val(); });
        if(found) {
            localStorage.setItem('currentUser', JSON.stringify(found));
            location.reload(); 
        } else alert("Məlumatlar səhvdir!");
    });
};

window.onload = () => {
    const user = localStorage.getItem('currentUser');
    if(user) {
        const u = JSON.parse(user);
        document.getElementById('student-login-area').classList.add('hidden');
        document.getElementById('quiz-selection-area').classList.remove('hidden');
        document.getElementById('welcome-msg').innerText = "Xoş gəldin, " + u.name;
        // Şagird üçün sınaqları yüklə
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

window.checkAdmin = () => {
    if(document.getElementById('admin-password').value === "12345") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        window.showTab('results-section');
    } else alert("Şifrə səhvdir!");
};

window.addStudent = () => {
    const name = document.getElementById('new-std-name').value;
    const pass = document.getElementById('new-std-pass').value;
    if(name && pass) database.ref('students').push({name, password: pass}).then(() => { alert("Şagird əlavə olundu!"); location.reload(); });
};

window.showAdminLogin = () => { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); };
window.hideAdminLogin = () => { document.getElementById('admin-login').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); };
window.logout = () => { localStorage.removeItem('currentUser'); location.reload(); };
window.deleteStudent = (id) => { if(confirm("Silinsin?")) database.ref('students/' + id).remove(); };
