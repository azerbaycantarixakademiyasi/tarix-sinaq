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

// Müəllim Girişi
window.admLogin = function() {
    const p = document.getElementById('adm-pass').value;
    if (p === "nərminə.ə2026") { 
        document.getElementById('admin-login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        admTab('res-sec');
    } else {
        alert("Şifrə səhvdir!");
    }
};

window.admTab = function(id) {
    document.querySelectorAll('.adm-content').forEach(t => t.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');

    if (id === 'res-sec') loadAdminResults();
    if (id === 'quiz-sec') loadAdminQuizzes();
    if (id === 'mat-sec') loadAdminMaterials();
};

function loadAdminResults() {
    db.ref('results').on('value', snap => {
        let h = "<table><tr><th>Şagird</th><th>Bal</th><th>Tarix</th><th>X</th></tr>";
        snap.forEach(c => {
            const r = c.val();
            h += `<tr>
                <td>${r.studentName}</td>
                <td>${r.score}</td>
                <td>${r.date}</td>
                <td><button onclick="deleteRes('${c.key}')" style="background:red; width:auto; padding:5px;">Sil</button></td>
            </tr>`;
        });
        document.getElementById('adm-res-list').innerHTML = h + "</table>";
    });
}

window.deleteRes = (id) => { if(confirm("Silinsin?")) db.ref('results/'+id).remove(); };

function loadAdminQuizzes() {
    db.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const q = c.val();
            h += `<div style="border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:8px;">
                <b>${q.title}</b>
                <div style="margin-top:10px;">
                    <button onclick="toggleQuiz('${c.key}', ${q.active})" style="width:auto; background:${q.active?'#27ae60':'#7f8c8d'}">${q.active?'Aktiv':'Deaktiv'}</button>
                    <button onclick="deleteQuiz('${c.key}')" style="width:auto; background:red;">Sil</button>
                </div>
            </div>`;
        });
        document.getElementById('adm-quiz-list').innerHTML = h || "Sınaq yoxdur.";
    });
}

window.toggleQuiz = (id, st) => db.ref('quizzes/'+id).update({ active: !st });
window.deleteQuiz = (id) => { if(confirm("Sınaq silinsin?")) db.ref('quizzes/'+id).remove(); };

window.addM = function() {
    const t = document.getElementById('m-t').value;
    const l = document.getElementById('m-l').value;
    if(t && l) {
        db.ref('materials').push({ title: t, link: l }).then(() => {
            alert("Əlavə edildi!");
            document.getElementById('m-t').value = "";
            document.getElementById('m-l').value = "";
        });
    }
};

function loadAdminMaterials() {
    db.ref('materials').on('value', snap => {
        let h = "<table><tr><th>Başlıq</th><th>Sil</th></tr>";
        snap.forEach(c => {
            h += `<tr><td>${c.val().title}</td><td><button onclick="deleteMat('${c.key}')" style="background:red; width:auto;">Sil</button></td></tr>`;
        });
        document.getElementById('adm-mat-list').innerHTML = h + "</table>";
    });
}

window.deleteMat = (id) => db.ref('materials/'+id).remove();

let quizQuestions = []; 

window.openNewQuizForm = function() {
    quizQuestions = []; 
    const area = document.getElementById('adm-quiz-list'); 
    
    area.innerHTML = `
        <div style="background:#f4f4f4; padding:20px; border-radius:10px; border:2px solid #1a4e8a;">
            <h3>Yeni Sınaq Yarat</h3>
            <input type="text" id="q-title" placeholder="Sınağın adı (məs: 9-cu sinif Kiçik Summativ)">
            <input type="number" id="q-time" placeholder="Müddət (dəqiqə ilə)">
            <hr>
            <div id="questions-container"></div>
            <button onclick="addNewQuestionField()" style="background:#3498db;">+ Sual Əlavə Et</button>
            <button onclick="saveFullQuiz()" style="background:#27ae60; margin-top:20px;">Sınağı Bazaya Yüklə</button>
            <button onclick="loadAdminQuizzes()" style="background:#7f8c8d;">Ləğv Et</button>
        </div>
    `;
};

window.addNewQuestionField = function() {
    const qIndex = quizQuestions.length + 1;
    const qDiv = document.createElement('div');
    qDiv.className = 'question-box';
    qDiv.style = "background:white; padding:15px; margin:10px 0; border-left:5px solid #1a4e8a; text-align:left;";
    qDiv.innerHTML = `
        <b>Sual ${qIndex}</b>
        <input type="text" id="txt-${qIndex}" placeholder="Sualın mətni">
        <input type="number" id="pnt-${qIndex}" placeholder="Bal (məs: 5)">
        <input type="text" id="img-${qIndex}" placeholder="Şəkil URL (yoxdursa boş qoy)">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <input type="text" id="vA-${qIndex}" placeholder="A variantı">
            <input type="text" id="vB-${qIndex}" placeholder="B variantı">
            <input type="text" id="vC-${qIndex}" placeholder="C variantı">
            <input type="text" id="vD-${qIndex}" placeholder="D variantı">
        </div>
        <input type="text" id="cor-${qIndex}" placeholder="Düzgün variant (Məs: A)" maxlength="1" style="border:2px solid #27ae60;">
    `;
    document.getElementById('questions-container').appendChild(qDiv);
    quizQuestions.push(qIndex);
};

window.saveFullQuiz = function() {
    const title = document.getElementById('q-title').value;
    const time = document.getElementById('q-time').value;

    if (!title || !time || quizQuestions.length === 0) {
        alert("Sınaq adını, vaxtını və ən azı 1 sualı doldurun!");
        return;
    }

    let finalQuestions = [];
    
    for (let i = 1; i <= quizQuestions.length; i++) {
        const text = document.getElementById(`txt-${i}`).value;
        const point = document.getElementById(`pnt-${i}`).value;
        const correct = document.getElementById(`cor-${i}`).value.toUpperCase();
        
        if (!text || !correct) {
            alert(i + "-ci sualın məlumatları tam deyil!");
            return;
        }

        finalQuestions.push({
            text: text,
            point: point,
            img: document.getElementById(`img-${i}`).value,
            correct: correct,
            variants: {
                A: document.getElementById(`vA-${i}`).value,
                B: document.getElementById(`vB-${i}`).value,
                C: document.getElementById(`vC-${i}`).value,
                D: document.getElementById(`vD-${i}`).value
            }
        });
    }

    const quizData = {
        title: title,
        time: time,
        active: false, 
        questions: finalQuestions
    };

    db.ref('quizzes').push(quizData).then(() => {
        alert("Sınaq uğurla yaradıldı!");
        loadAdminQuizzes();
    }).catch(err => alert("Xəta baş verdi: " + err.message));
};
