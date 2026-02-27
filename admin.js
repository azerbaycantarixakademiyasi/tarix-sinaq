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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
let quizQuestions = [];

window.admLogin = function() {
    const passInput = document.getElementById('adm-pass');
    if (!passInput) {
        alert("Xəta: adm-pass ID-li xana tapılmadı!");
        return;
    }

    if (passInput.value === "nermine2026") {
        document.getElementById('admin-login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        window.admTab('std-sec'); 
    } else {
        alert("Admin şifrəsi yanlışdır!");
    }
};

window.admTab = function(id) {
    document.querySelectorAll('.adm-content').forEach(t => t.classList.add('hidden'));
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');

    if (id === 'std-sec') loadAdminStudents();
    if (id === 'quiz-sec') loadAdminQuizzes();
    if (id === 'res-sec') loadAdminResults();
    if (id === 'mat-sec') loadAdminMaterials();
};


window.addS = function() {
    const n = document.getElementById('n-s-n').value;
    const p = document.getElementById('n-s-p').value;
    if (n && p) {
        db.ref('students').push({ name: n, password: p }).then(() => {
            document.getElementById('n-s-n').value = "";
            document.getElementById('n-s-p').value = "";
            alert("Şagird əlavə edildi!");
        });
    } else {
        alert("Ad və şifrə yazın!");
    }
};

function loadAdminStudents() {
    db.ref('students').on('value', snap => {
        let h = "<table><tr><th>Ad Soyad</th><th>Şifrə</th><th>Sil</th></tr>";
        snap.forEach(c => {
            h += `<tr><td>${c.val().name}</td><td>${c.val().password}</td><td><button onclick="delS('${c.key}')" style="background:red; width:auto;">Sil</button></td></tr>`;
        });
        document.getElementById('adm-std-list').innerHTML = h + "</table>";
    });
}
window.delS = (id) => { if(confirm("Silinsin?")) db.ref('students/'+id).remove(); };

// Sınaq Yaradılması
window.openForm = function() {
    quizQuestions = [];
    document.getElementById('adm-quiz-list').innerHTML = `
        <div style="background:#eee; padding:15px; border-radius:10px;">
            <input id="qt" placeholder="Sınaq Başlığı">
            <input id="tm" placeholder="Vaxt (dəqiqə)">
            <div id="q-cont"></div>
            <button onclick="addQF()" style="background:#3498db;">+ Sual Əlavə Et</button>
            <button onclick="saveQ()" style="background:green;">Sınağı Yadda Saxla</button>
        </div>
    `;
};

window.addQF = function() {
    const i = quizQuestions.length + 1;
    const d = document.createElement('div');
    d.className = "question-box";
    d.innerHTML = `
        <b>Sual ${i}</b>
        <input id="t${i}" placeholder="Sual mətni">
        <input id="p${i}" placeholder="Bal">
        <input id="vA${i}" placeholder="A variantı">
        <input id="vB${i}" placeholder="B variantı">
        <input id="vC${i}" placeholder="C variantı">
        <input id="vD${i}" placeholder="D variantı">
        <input id="c${i}" placeholder="Düzgün cavab (A, B, C və ya D)">
    `;
    document.getElementById('q-cont').appendChild(d);
    quizQuestions.push(i);
};

window.saveQ = function() {
    let qs = [];
    quizQuestions.forEach(i => {
        qs.push({
            text: document.getElementById('t'+i).value,
            point: document.getElementById('p'+i).value,
            correct: document.getElementById('c'+i).value.toUpperCase(),
            variants: { 
                A: document.getElementById('vA'+i).value, 
                B: document.getElementById('vB'+i).value, 
                C: document.getElementById('vC'+i).value, 
                D: document.getElementById('vD'+i).value 
            }
        });
    });
    db.ref('quizzes').push({
        title: document.getElementById('qt').value,
        time: document.getElementById('tm').value,
        active: false,
        questions: qs
    }).then(() => {
        alert("Sınaq yaradıldı!");
        window.admTab('quiz-sec');
    });
};

function loadAdminQuizzes() {
    db.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const q = c.val();
            h += `<div style="border:1px solid #ccc; margin:10px 0; padding:10px; border-radius:8px;">
                <b>${q.title}</b>
                <button onclick="togQ('${c.key}',${q.active})" style="width:auto; margin-left:10px; background:${q.active?'#27ae60':'#7f8c8d'}">${q.active?'Aktiv':'Deaktiv'}</button>
                <button onclick="delQ('${c.key}')" style="width:auto; background:red;">Sil</button>
            </div>`;
        });
        document.getElementById('adm-quiz-list').innerHTML = h || "Sınaq yoxdur.";
    });
}
window.togQ = (id, s) => db.ref('quizzes/'+id).update({active: !s});
window.delQ = (id) => { if(confirm("Sınaq silinsin?")) db.ref('quizzes/'+id).remove(); };

function loadAdminResults() {
    db.ref('results').on('value', snap => {
        let h = "<table><tr><th>Şagird</th><th>Sınaq</th><th>Bal</th><th>Sil</th></tr>";
        snap.forEach(c => {
            const r = c.val();
            h += `<tr><td>${r.studentName}</td><td>${r.quizTitle}</td><td>${r.score}</td><td><button onclick="delR('${c.key}')" style="background:red; width:auto;">X</button></td></tr>`;
        });
        document.getElementById('adm-res-list').innerHTML = h + "</table>";
    });
}
window.delR = (id) => db.ref('results/'+id).remove();

window.addM = function() {
    const t = document.getElementById('m-t').value;
    const l = document.getElementById('m-l').value;
    if (t && l) {
        db.ref('materials').push({ title: t, link: l }).then(() => {
            document.getElementById('m-t').value = "";
            document.getElementById('m-l').value = "";
            alert("Material əlavə edildi!");
        });
    }
};

function loadAdminMaterials() {
    db.ref('materials').on('value', snap => {
        let h = "<table>";
        snap.forEach(c => {
            h += `<tr><td>${c.val().title}</td><td><button onclick="delM('${c.key}')" style="background:red; width:auto;">Sil</button></td></tr>`;
        });
        document.getElementById('adm-mat-list').innerHTML = h + "</table>";
    });
}
window.delM = (id) => db.ref('materials/'+id).remove();
