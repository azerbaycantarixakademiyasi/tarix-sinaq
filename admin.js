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

// Admin Giriş Funksiyası
window.admLogin = function() {
    const p = document.getElementById('adm-pass').value;
    if (p === "nermine2026") {
        document.getElementById('admin-login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
    } else {
        alert("Admin şifrəsi yanlışdır!");
    }
};

// Tab Naviqasiyası
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

// Şagirdlərin İdarə Edilməsi
window.addS = function() {
    const n = document.getElementById('n-s-n').value.trim();
    const p = document.getElementById('n-s-p').value.trim();
    if (n && p) {
        db.ref('students').push({ name: n, password: p }).then(() => {
            document.getElementById('n-s-n').value = "";
            document.getElementById('n-s-p').value = "";
            alert("Şagird sistemə əlavə edildi!");
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
window.delS = (id) => { if(confirm("Bu şagirdi silmək istəyirsiniz?")) db.ref('students/'+id).remove(); };

// DİM Sınaq Yaradılması
window.openNewQuizForm = function() {
    let h = `
        <div style="background:#f9f9f9; padding:15px; border-radius:10px;">
            <h3>Yeni 30 Suallıq DİM Sınağı</h3>
            <input id="q-title" placeholder="Sınağın Adı (məs: İbtidai İcma Quruluşu)">
            <input id="q-time" type="number" placeholder="Vaxt (dəqiqə ilə, məs: 90)">
            <div id="dim-questions-container" style="max-height:400px; overflow-y:auto; margin:15px 0; border:1px solid #ddd; padding:10px;">
                <p style="color:red;">Əvvəlcə sahələri yaradın ↓</p>
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
        let typeInfo = i <= 22 ? "Qapalı (4 Səhv 1 Düzü Aparır)" : (i <= 26 ? "Rəqəmli" : (i == 27 ? "Uyğunluq" : "Açıq/Situasiya"));
        container.innerHTML += `
            <div class="question-box" style="margin-bottom:20px; border-left:4px solid #1a4e8a; padding-left:10px;">
                <b>Sual ${i} (${typeInfo})</b>
                <input id="q-txt-${i}" placeholder="Sualın mətni">
                ${i <= 22 ? `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px;">
                    <input id="vA-${i}" placeholder="A variantı"> <input id="vB-${i}" placeholder="B variantı">
                    <input id="vC-${i}" placeholder="C variantı"> <input id="vD-${i}" placeholder="D variantı">
                </div>` : ""}
                <input id="q-cor-${i}" placeholder="Düzgün Cavab (Məs: A)" style="background:#e8f5e9;">
            </div>`;
    }
};

window.saveDIMQuiz = function() {
    const title = document.getElementById('q-title').value;
    const time = document.getElementById('q-time').value;
    if(!title || !time) return alert("Sınaq adını və vaxtını qeyd edin!");
    
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
    .then(() => { alert("30 suallıq sınaq yaradıldı!"); window.admTab('quiz-sec'); });
};

function loadAdminQuizzes() {
    db.ref('quizzes').on('value', snap => {
        let h = "<h3>Mövcud Sınaqlar</h3>";
        snap.forEach(c => {
            const q = c.val();
            h += `<div style="padding:10px; border:1px solid #ddd; margin-bottom:5px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <span>${q.title} (${q.time} dəq)</span>
                <div>
                    <button onclick="togQ('${c.key}',${q.active})" style="width:auto; padding:5px 10px; background:${q.active?'#27ae60':'#7f8c8d'}">${q.active?'Aktiv':'Deaktiv'}</button>
                    <button onclick="delQ('${c.key}')" style="width:auto; padding:5px 10px; background:red;">Sil</button>
                </div>
            </div>`;
        });
        document.getElementById('adm-quiz-list').innerHTML = h || "Hələ sınaq yoxdur.";
    });
}
window.togQ = (id, s) => db.ref('quizzes/'+id).update({ active: !s });
window.delQ = (id) => { if(confirm("Sınaq silinsin?")) db.ref('quizzes/'+id).remove(); };

function loadAdminResults() {
    db.ref('results').on('value', snap => {
        let h = "<table><tr><th>Şagird</th><th>Sınaq</th><th>Bal (Net)</th><th>Tarix</th></tr>";
        snap.forEach(c => {
            const r = c.val();
            h += `<tr><td>${r.studentName}</td><td>${r.quizTitle}</td><td><b>${r.score}</b></td><td><small>${r.date}</small></td></tr>`;
        });
        document.getElementById('adm-res-list').innerHTML = h + "</table>";
    });
}

// Materiallar
window.addM = function() {
    const t = document.getElementById('m-t').value;
    const l = document.getElementById('m-l').value;
    if (t && l) db.ref('materials').push({ title: t, link: l }).then(() => {
        alert("Material əlavə edildi!");
        document.getElementById('m-t').value = "";
        document.getElementById('m-l').value = "";
    });
};

function loadAdminMaterials() {
    db.ref('materials').on('value', snap => {
        let h = "<table>";
        snap.forEach(c => {
            h += `<tr><td>${c.val().title}</td><td><button onclick="delM('${c.key}')" style="background:red; width:auto; padding:5px;">Sil</button></td></tr>`;
        });
        document.getElementById('adm-mat-list').innerHTML = h + "</table>";
    });
}
window.delM = (id) => db.ref('materials/'+id).remove();
