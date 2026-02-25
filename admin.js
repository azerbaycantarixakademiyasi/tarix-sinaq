// Firebase Config 
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();
let quizQuestions = [];

window.checkAdmin = () => {
    const pass = document.getElementById('admin-password').value;
    if (pass === "12345") {
        document.getElementById('admin-login-screen').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        showTab('results-sec');
    } else {
        alert("Şifrə yanlışdır!");
    }
};

window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(d => d.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    if (tabId === 'results-sec') loadAdminResults();
    if (tabId === 'quizzes-sec') loadAdminQuizzes();
    if (tabId === 'materials-sec') loadAdminMaterials();
};

function loadAdminQuizzes() {
    database.ref('quizzes').on('value', snap => {
        let h = "<h3>Sınaqlar</h3><table><tr><th>Ad</th><th>Status</th><th>Sil</th></tr>";
        snap.forEach(c => {
            const q = c.val();
            h += `<tr>
                <td>${q.title}</td>
                <td><button onclick="toggleQuiz('${c.key}', ${q.active})" style="background:${q.active?'#27ae60':'#7f8c8d'};">${q.active?'Aktiv':'Deaktiv'}</button></td>
                <td><button onclick="deleteQuiz('${c.key}')" style="background:red;">Sil</button></td>
            </tr>`;
        });
        document.getElementById('admin-quizzes-display').innerHTML = h + "</table><button onclick='openNewQuizForm()'>+ Yeni Sınaq Yarat</button>";
    });
}

window.toggleQuiz = (id, status) => {
    database.ref('quizzes/' + id).update({ active: !status });
};

window.deleteQuiz = (id) => {
    if (confirm("Bu sınağı silmək istəyirsiniz?")) database.ref('quizzes/' + id).remove();
};

function loadAdminResults() {
    database.ref('results').on('value', snap => {
        let h = "<table><tr><th>Şagird</th><th>Bal</th><th>D/S</th><th>X</th></tr>";
        snap.forEach(c => {
            const r = c.val();
            h += `<tr>
                <td>${r.studentName}</td>
                <td><b>${r.score}</b></td>
                <td>${r.correct}/${r.wrong}</td>
                <td><button onclick="deleteResult('${c.key}')" style="background:red; width:auto;">Sil</button></td>
            </tr>`;
        });
        document.getElementById('admin-results-display').innerHTML = h + "</table>";
    });
}

window.deleteResult = (id) => {
    if (confirm("Nəticə silinsin?")) database.ref('results/' + id).remove();
};

window.saveMaterial = () => {
    const title = document.getElementById('mat-title').value;
    const link = document.getElementById('mat-link').value;
    if (title && link) {
        database.ref('materials').push({ title, link, type: 'link' }).then(() => {
            alert("Əlavə edildi!");
            document.getElementById('mat-title').value = "";
            document.getElementById('mat-link').value = "";
        });
    }
};

function loadAdminMaterials() {
    database.ref('materials').on('value', snap => {
        let h = "<table><tr><th>Başlıq</th><th>Sil</th></tr>";
        snap.forEach(c => {
            h += `<tr><td>${c.val().title}</td><td><button onclick="deleteMaterial('${c.key}')" style="background:red;">Sil</button></td></tr>`;
        });
        document.getElementById('admin-materials-list').innerHTML = h + "</table>";
    });
}

window.deleteMaterial = (id) => database.ref('materials/' + id).remove();

window.openNewQuizForm = () => {
    document.getElementById('admin-quizzes-display').innerHTML = `
        <h3>Yeni Sınaq</h3>
        <input type="text" id="quiz-title" placeholder="Sınaq Başlığı">
        <input type="number" id="quiz-time" placeholder="Müddət (dəq)">
        <div id="questions-area"></div>
        <button onclick="addQuestionField()">+ Sual Əlavə Et</button>
        <button onclick="saveQuiz()" style="background:green;">Sınağı Tamamla və Yadda Saxla</button>
        <button onclick="loadAdminQuizzes()">Ləğv Et</button>
    `;
    quizQuestions = [];
};

window.addQuestionField = () => {
    const idx = quizQuestions.length + 1;
    const div = document.createElement('div');
    div.style.border = "1px solid #ccc";
    div.style.padding = "10px";
    div.style.margin = "10px 0";
    div.innerHTML = `
        <b>Sual ${idx}</b>
        <input type="text" placeholder="Sual mətni" id="q-text-${idx}">
        <input type="number" placeholder="Bal" id="q-point-${idx}">
        <input type="text" placeholder="Şəkil URL (yoxdursa boş qoy)" id="q-img-${idx}">
        <div id="vars-${idx}"></div>
        <button onclick="addVar(${idx})">+ Variant Əlavə Et</button>
        <input type="text" placeholder="Düzgün cavab (Məs: A)" id="q-corr-${idx}">
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
    let data = { title, time, active: false, questions: [] };
    
    quizQuestions.forEach(q => {
        let qObj = {
            text: document.getElementById(`q-text-${q.id}`).value,
            point: document.getElementById(`q-point-${q.id}`).value,
            img: document.getElementById(`q-img-${q.id}`).value,
            correct: document.getElementById(`q-corr-${q.id}`).value.toUpperCase(),
            variants: {}
        };
        q.vars.forEach(v => {
            qObj.variants[v] = document.getElementById(`q-${q.id}-v-${v}`).value;
        });
        data.questions.push(qObj);
    });
    
    database.ref('quizzes').push(data).then(() => {
        alert("Sınaq yaradıldı! Onu aktiv etməyi unutmayın.");
        loadAdminQuizzes();
    });
};

window.logout = () => { location.href = "index.html"; };
