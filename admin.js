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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

// Admin Giriş
window.admLogin = function() {
    if (document.getElementById('adm-pass').value === "nermine2026") {
        document.getElementById('admin-login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
    } else alert("Şifrə yanlışdır!");
};

// Dashboard Naviqasiya
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

window.admGoBack = () => {
    document.getElementById('admin-dashboard-grid').classList.remove('hidden');
    document.getElementById('adm-tab-container').classList.add('hidden');
};

window.addS = function() {
    const n = document.getElementById('n-s-n').value;
    const p = document.getElementById('n-s-p').value;
    if (n && p) db.ref('students').push({ name: n, password: p }).then(() => alert("Əlavə edildi!"));
};

function loadAdminStudents() {
    db.ref('students').on('value', snap => {
        let h = "<table><tr><th>Ad</th><th>Şifrə</th><th>Sil</th></tr>";
        snap.forEach(c => {
            h += `<tr><td>${c.val().name}</td><td>${c.val().password}</td><td><button onclick="delS('${c.key}')" style="background:red">X</button></td></tr>`;
        });
        document.getElementById('adm-std-list').innerHTML = h + "</table>";
    });
}
window.delS = (id) => db.ref('students/'+id).remove();

// --- DİM Sınaq Yaradılması (30 Sual) ---
window.openNewQuizForm = () => {
    document.getElementById('adm-quiz-list').innerHTML = `
        <h3>Yeni Sınaq</h3>
        <input id="q-title" placeholder="Sınaq adı">
        <input id="q-time" type="number" placeholder="Vaxt (dəqiqə)">
        <div id="dim-cont" style="max-height:300px; overflow-y:auto; margin:10px 0;"></div>
        <button onclick="genDIM()">Sualları yarat</button>
        <button onclick="saveDIM()" style="background:green; margin-top:10px;">Bazaya yüklə</button>`;
};

window.genDIM = () => {
    let c = document.getElementById('dim-cont'); c.innerHTML = "";
    for(let i=1; i<=30; i++) {
        c.innerHTML += `<div class="question-box"><b>Sual ${i}</b><input id="q-t-${i}" placeholder="Mətn">
        ${i<=22 ? `<input id="vA-${i}" placeholder="A"><input id="vB-${i}" placeholder="B"><input id="vC-${i}" placeholder="C"><input id="vD-${i}" placeholder="D">` : ""}
        <input id="q-c-${i}" placeholder="Düzgün cavab"></div>`;
    }
};

window.saveDIM = () => {
    let qs = [];
    for(let i=1; i<=30; i++) {
        let qd = { text: document.getElementById(`q-t-${i}`).value, correct: document.getElementById(`q-c-${i}`).value.toUpperCase().trim() };
        if(i<=22) qd.variants = { A: document.getElementById(`vA-${i}`).value, B: document.getElementById(`vB-${i}`).value, C: document.getElementById(`vC-${i}`).value, D: document.getElementById(`vD-${i}`).value };
        qs.push(qd);
    }
    db.ref('quizzes').push({ title: document.getElementById('q-title').value, time: document.getElementById('q-time').value, active: false, questions: qs }).then(() => admGoBack());
};

function loadAdminQuizzes() {
    db.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            h += `<div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                <span>${c.val().title}</span>
                <button onclick="togQ('${c.key}',${c.val().active})" style="background:${c.val().active?'green':'gray'}">${c.val().active?'Aktiv':'Passiv'}</button>
            </div>`;
        });
        document.getElementById('adm-quiz-list').innerHTML = h;
    });
}
window.togQ = (id, s) => db.ref('quizzes/'+id).update({active: !s});

// --- PDF VƏ MATERİAL YÜKLƏMƏ ---
window.uploadMaterial = function() {
    const title = document.getElementById('m-t').value;
    const file = document.getElementById('m-file').files[0];
    const link = document.getElementById('m-l').value;
    const btn = document.getElementById('upload-btn');

    btn.innerText = "Yüklənir...";
    if (file) {
        const ref = storage.ref('materials/' + file.name);
        ref.put(file).then(snap => snap.ref.getDownloadURL()).then(url => saveMat(title, url));
    } else {
        saveMat(title, link);
    }
};

function saveMat(t, u) {
    db.ref('materials').push({ title: t, link: u }).then(() => { alert("Yükləndi!"); admGoBack(); });
}

function loadAdminResults() {
    db.ref('results').on('value', snap => {
        let h = "<table><tr><th>Şagird</th><th>Sınaq</th><th>Bal</th></tr>";
        snap.forEach(c => { h += `<tr><td>${c.val().studentName}</td><td>${c.val().quizTitle}</td><td>${c.val().score}</td></tr>`; });
        document.getElementById('adm-res-list').innerHTML = h + "</table>";
    });
}
