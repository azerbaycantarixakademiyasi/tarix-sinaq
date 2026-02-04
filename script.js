// 1. FİREBASE KONFİQURASİYASI
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

// 2. ADMİN PANEL FUNKSİYALARI
window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(d => d.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    if (tabId === 'students-section') loadStudents();
    if (tabId === 'results-section') loadResults();
};

// Çoxvariantlı Sual Əlavə Etmə
window.addQuestionField = () => {
    const qIdx = quizQuestions.length + 1;
    const qBox = document.createElement('div');
    qBox.className = "question-box";
    qBox.innerHTML = `
        <strong>Sual ${qIdx}:</strong>
        <input type="text" placeholder="Sualın mətni" id="q-text-${qIdx}">
        <div id="vars-area-${qIdx}"></div>
        <button class="variant-add-btn" onclick="addVariant(${qIdx})">+ Variant Əlavə Et</button>
        <input type="text" placeholder="Düzgün variant (Məs: A)" id="q-correct-${qIdx}" style="border-color:green; margin-top:10px;">
    `;
    document.getElementById('questions-area').appendChild(qBox);
    quizQuestions.push({ id: qIdx, variants: [] });
};

window.addVariant = (qId) => {
    const qObj = quizQuestions.find(q => q.id === qId);
    const vChar = String.fromCharCode(65 + qObj.variants.length); 
    const vInput = document.createElement('input');
    vInput.placeholder = `Variant ${vChar}`;
    vInput.id = `q-${qId}-var-${vChar}`;
    document.getElementById(`vars-area-${qId}`).appendChild(vInput);
    qObj.variants.push(vChar);
};

window.saveQuiz = () => {
    const title = document.getElementById('quiz-title').value;
    const time = document.getElementById('quiz-time').value;
    let data = { title, time, questions: [] };

    quizQuestions.forEach(q => {
        let qData = { text: document.getElementById(`q-text-${q.id}`).value, correct: document.getElementById(`q-correct-${q.id}`).value, variants: {} };
        q.variants.forEach(v => { qData.variants[v] = document.getElementById(`q-${q.id}-var-${v}`).value; });
        data.questions.push(qData);
    });

    database.ref('quizzes').push(data).then(() => { alert("Sınaq Yaradıldı!"); location.reload(); });
};

// 3. NƏTİCƏLƏR VƏ "BAX" FUNKSİYASI
function loadResults() {
    database.ref('results').on('value', snap => {
        let html = `<table><tr><th>Şagird</th><th>Bal</th><th>Əməliyyat</th></tr>`;
        snap.forEach(c => {
            const r = c.val();
            html += `<tr><td>${r.studentName}</td><td>${r.score}%</td>
            <td><button onclick="viewResultDetail('${c.key}')" style="width:auto; padding:3px 10px;">Bax</button></td></tr>`;
        });
        document.getElementById('results-display').innerHTML = html + `</table>`;
    });
}

window.viewResultDetail = (id) => {
    database.ref('results/' + id).once('value', snap => {
        const r = snap.val();
        let content = `<strong>Sınaq:</strong> ${r.quizTitle}<br><hr>`;
        r.answers.forEach((a, i) => {
            const isCorrect = a.studentAns === a.correctAns;
            content += `<p style="color:${isCorrect ? 'green':'red'}">${i+1}. ${a.qText}<br>
            Sizin: ${a.studentAns} | Düz: ${a.correctAns} ${isCorrect ? '✅':'❌'}</p>`;
        });
        document.getElementById('modal-content').innerHTML = content;
        document.getElementById('details-modal').classList.remove('hidden');
    });
};

window.closeModal = () => document.getElementById('details-modal').classList.add('hidden');

// 4. ŞAGİRD İDARƏETMƏSİ
window.addStudent = () => {
    const name = document.getElementById('new-std-name').value;
    const pass = document.getElementById('new-std-pass').value;
    if(name && pass) database.ref('students').push({name, password: pass}).then(() => alert("Əlavə olundu!"));
};

function loadStudents() {
    database.ref('students').on('value', snap => {
        let html = `<table><tr><th>Ad</th><th>Parol</th><th>Sil</th></tr>`;
        snap.forEach(c => {
            html += `<tr><td>${c.val().name}</td><td>${c.val().password}</td>
            <td><button onclick="deleteStudent('${c.key}')" style="background:red; width:auto;">X</button></td></tr>`;
        });
        document.getElementById('students-list').innerHTML = html + `</table>`;
    });
}

window.deleteStudent = (id) => { if(confirm("Silinsin?")) database.ref('students/' + id).remove(); };

// GİRİŞ VƏ LOGOUT
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

// Şagird Girişi
window.loginStudent = () => {
    const u = document.getElementById('student-username').value;
    const p = document.getElementById('student-pass').value;
    database.ref('students').once('value').then(snap => {
        let found = null;
        snap.forEach(c => { if(c.val().name === u && c.val().password === p) found = c.val(); });
        if(found) {
            document.getElementById('student-login-area').classList.add('hidden');
            document.getElementById('quiz-selection-area').classList.remove('hidden');
            document.getElementById('welcome-msg').innerText = "Xoş gəldin, " + found.name;
        } else alert("Səhv!");
    });
};
