/* Firebase konfiqurasiyası student.js ilə tam eynidir */
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

window.checkAdmin = () => {
    if(document.getElementById('admin-password').value === "nermine2026") {
        document.getElementById('admin-login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        showTab('results-section');
    } else alert("Səhv şifrə!");
};

window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(d => d.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    if (tabId === 'students-section') loadStudents();
    if (tabId === 'results-section') loadResults();
    if (tabId === 'quizzes-section') loadAdminQuizzes();
};

window.addQuestionField = () => {
    const idx = quizQuestions.length + 1;
    const div = document.createElement('div');
    div.className = "question-box";
    div.innerHTML = `
        <strong>Sual ${idx}:</strong>
        <input type="text" placeholder="Sualın mətni" id="q-text-${idx}">
        <input type="text" placeholder="Şəkil URL-i (yoxdursa boş qoyun)" id="q-img-${idx}" style="font-size:11px; border-color:#3498db;">
        <div id="vars-${idx}"></div>
        <button onclick="addVar(${idx})" style="width:auto; font-size:11px; background:#54a0ff; padding:5px 10px;">+ Variant</button>
        <input type="text" placeholder="Düzgün variantın hərfi (A, B...)" id="q-corr-${idx}" style="margin-top:10px; border-color:green;">
    `;
    document.getElementById('questions-area').appendChild(div);
    quizQuestions.push({ id: idx, vars: [] });
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
    if(!title || quizQuestions.length === 0) return alert("Sual və başlıq daxil edin!");

    let data = { title, time, questions: [] };
    quizQuestions.forEach(q => {
        let qObj = { 
            text: document.getElementById(`q-text-${q.id}`).value, 
            img: document.getElementById(`q-img-${q.id}`).value,
            correct: document.getElementById(`q-corr-${q.id}`).value.toUpperCase(), 
            variants: {} 
        };
        q.vars.forEach(v => { qObj.variants[v] = document.getElementById(`q-${q.id}-v-${v}`).value; });
        data.questions.push(qObj);
    });
    database.ref('quizzes').push(data).then(() => { alert("Sınaq Arxivə Yazıldı!"); location.reload(); });
};

// Digər yükləmə (loadResults, loadStudents, deleteQuiz) funksiyaları əvvəlki admin.js ilə eynidir...
// (Vaxta qənaət üçün onları bura təkrar yazmıram, amma silməyib saxla)

function loadAdminQuizzes() {
    database.ref('quizzes').on('value', snap => {
        let h = `<table><tr><th>Sınaq Adı</th><th>Sil</th></tr>`;
        snap.forEach(c => { h += `<tr><td>${c.val().title}</td><td><button onclick="deleteQuiz('${c.key}')" style="background:red; width:auto; padding:2px 8px;">Sil</button></td></tr>`; });
        document.getElementById('admin-quizzes-list').innerHTML = h + `</table>`;
    });
}
window.deleteQuiz = (id) => { if(confirm("Silinsin?")) database.ref('quizzes/' + id).remove(); };

function loadStudents() {
    database.ref('students').on('value', snap => {
        let h = `<table><tr><th>Ad</th><th>Parol</th><th>Sil</th></tr>`;
        snap.forEach(c => { h += `<tr><td>${c.val().name}</td><td>${c.val().password}</td><td><button onclick="deleteStudent('${c.key}')" style="background:red; width:auto;">X</button></td></tr>`; });
        document.getElementById('students-list').innerHTML = h + `</table>`;
    });
}
window.deleteStudent = (id) => { if(confirm("Silinsin?")) database.ref('students/' + id).remove(); };

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

window.viewDetail = (id) => {
    database.ref('results/' + id).once('value', snap => {
        const r = snap.val();
        let c = `<strong>${r.studentName}</strong> - ${r.quizTitle}<hr>`;
        r.answers.forEach((a, i) => {
            const ok = a.studentAns === a.correctAns;
            c += `<p style="color:${ok?'green':'red'}">${i+1}. ${a.qText}<br>Cavab: ${a.studentAns} | Düz: ${a.correctAns} ${ok?'✅':'❌'}</p>`;
        });
        document.getElementById('modal-content').innerHTML = c;
        document.getElementById('details-modal').classList.remove('hidden');
    });
};
window.closeModal = () => document.getElementById('details-modal').classList.add('hidden');
window.addStudent = () => {
    const n = document.getElementById('new-std-name').value;
    const p = document.getElementById('new-std-pass').value;
    if(n && p) database.ref('students').push({name: n, password: p}).then(() => alert("Əlavə olundu!"));
};
window.logout = () => { location.href = "index.html"; };
