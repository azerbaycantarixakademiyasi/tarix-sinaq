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
const storage = firebase.storage();

window.admLogin = function() {
    const p = document.getElementById('adm-pass').value;
    if (p === "12345") {
        document.getElementById('admin-login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        document.body.classList.add('after-login');
    } else {
        alert("Admin şifrəsi yanlışdır!");
    }
};

window.admTab = function(id) {
    document.getElementById('admin-dashboard-grid').classList.add('hidden');
    document.getElementById('adm-tab-container').classList.remove('hidden');
    document.querySelectorAll('.adm-content').forEach(t => t.classList.add('hidden'));
    
    document.getElementById(id).classList.remove('hidden');

    if (id === 'std-sec') loadAdminStudents();
    if (id === 'quiz-sec') loadAdminQuizzes();
    if (id === 'res-sec') loadAdminResults();
    if (id === 'mat-sec') loadAdminMaterials();
};

window.admGoBack = function() {
    document.getElementById('admin-dashboard-grid').classList.remove('hidden');
    document.getElementById('adm-tab-container').classList.add('hidden');
};

window.addS = function() {
    const n = document.getElementById('n-s-n').value.trim();
    const p = document.getElementById('n-s-p').value.trim();
    if (n && p) {
        db.ref('students').push({ name: n, password: p }).then(() => {
            document.getElementById('n-s-n').value = "";
            document.getElementById('n-s-p').value = "";
            alert("Şagird əlavə edildi!");
        });
    }
};

function loadAdminStudents() {
    db.ref('students').on('value', snap => {
        let h = "<table><tr><th>Ad Soyad</th><th>Şifrə</th><th>Sil</th></tr>";
        snap.forEach(c => {
            h += `<tr><td>${c.val().name}</td><td>${c.val().password}</td><td><button onclick="delS('${c.key}')" style="background:red; width:auto; padding:5px;">Sil</button></td></tr>`;
        });
        document.getElementById('adm-std-list').innerHTML = h + "</table>";
    });
}
window.delS = (id) => { if(confirm("Şagird silinsin?")) db.ref('students/'+id).remove(); };
window.openNewQuizForm = function() {
    let h = `
        <div class="question-box">
            <h3>Yeni 30 Suallıq DİM Sınağı</h3>
            <input id="q-title" placeholder="Sınağın Adı">
            <input id="q-time" type="number" placeholder="Vaxt (dəqiqə)">
            <div id="dim-questions-container" style="max-height:400px; overflow-y:auto; margin:15px 0; border:1px solid #ddd; padding:10px;">
                <p>Əvvəlcə sahələri yaradın ↓</p>
            </div>
            <button onclick="generateDIMFields()" style="background:#3498db;">Sual Sahələrini Aç (1-30)</button>
            <button onclick="saveDIMQuiz()" style="background:green; margin-top:10px;">Sınağı Bazaya Yüklə</button>
        </div>
    `;
    document.getElementById('adm-quiz-list').innerHTML = h;
};

window.generateDIMFields = function() {
    let container = document.getElementById('dim-questions-container');
    container.innerHTML = "";
    for(let i=1; i<=30; i++) {
        container.innerHTML += `
            <div style="margin-bottom:15px; padding:10px; border-bottom:1px solid #eee;">
                <b>Sual ${i}</b>
                <input id="q-txt-${i}" placeholder="Sualın mətni">
                ${i <= 22 ? `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px;">
                    <input id="vA-${i}" placeholder="A"> <input id="vB-${i}" placeholder="B">
                    <input id="vC-${i}" placeholder="C"> <input id="vD-${i}" placeholder="D">
                </div>` : ""}
                <input id="q-cor-${i}" placeholder="Düzgün Cavab (Məs: A)">
            </div>`;
    }
};

window.saveDIMQuiz = function() {
    const title = document.getElementById('q-title').value;
    const time = document.getElementById('q-time').value;
    if(!title || !time) return alert("Başlıq və vaxt mütləqdir!");
    
    let questions = [];
    for(let i=1; i<=30; i++) {
        let qData = {
            text: document.getElementById(`q-txt-${i}`).value,
            correct: document.getElementById(`q-cor-${i}`).value.toUpperCase().trim()
        };
        if(i <= 22) {
            qData.variants = {
                A: document.getElementById(`vA-${i}`).value,
                B: document.getElementById(`vB-${i}`).value,
                C: document.getElementById(`vC-${i}`).value,
                D: document.getElementById(`vD-${i}`).value
            };
        }
        questions.push(qData);
    }
    db.ref('quizzes').push({ title: title, time: time, active: false, questions: questions })
    .then(() => { alert("Sınaq bazaya yazıldı!"); window.admTab('quiz-sec'); });
};

window.uploadMaterial = function() {
    const title = document.getElementById('m-t').value;
    const file = document.getElementById('m-file').files[0];
    const link = document.getElementById('m-l').value;
    const btn = document.getElementById('upload-btn');

    if (!title) return alert("Materiala ad verin!");
    btn.innerText = "Yüklənir...";

    if (file) {
        const storageRef = storage.ref('materials/' + file.name);
        storageRef.put(file).then(snap => snap.ref.getDownloadURL()).then(url => {
            db.ref('materials').push({ title: title, link: url });
            alert("PDF uğurla yükləndi!");
            location.reload();
        }).catch(err => {
            alert("Xəta: " + err.message);
            btn.innerText = "Yadda Saxla";
        });
    } else if (link) {
        db.ref('materials').push({ title: title, link: link });
        alert("Link əlavə edildi!");
        location.reload();
    }
};

function loadAdminQuizzes() {
    db.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const q = c.val();
            h += `<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                <span>${q.title}</span>
                <button onclick="togQ('${c.key}',${q.active})" style="width:auto; background:${q.active?'green':'gray'}">
                    ${q.active?'Aktiv':'Deaktiv'}
                </button>
            </div>`;
        });
        document.getElementById('adm-quiz-list').innerHTML = h;
    });
}
window.togQ = (id, s) => db.ref('quizzes/'+id).update({ active: !s });

function loadAdminResults() {
    db.ref('results').on('value', snap => {
        let h = "<table><tr><th>Şagird</th><th>Sınaq</th><th>Bal (Net)</th></tr>";
        snap.forEach(c => {
            h += `<tr><td>${c.val().studentName}</td><td>${c.val().quizTitle}</td><td><b>${c.val().score}</b></td></tr>`;
        });
        document.getElementById('adm-res-list').innerHTML = h + "</table>";
    });
}

function loadAdminMaterials() {
    db.ref('materials').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            h += `<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
                <span>${c.val().title}</span>
                <button onclick="delMat('${c.key}')" style="background:red; width:auto;">Sil</button>
            </div>`;
        });
        document.getElementById('adm-mat-list').innerHTML = h;
    });
}
window.delMat = (id) => { if(confirm("Material silinsin?")) db.ref('materials/'+id).remove(); };
