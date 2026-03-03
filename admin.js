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
    if (p === "nermine_2026") {
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
            h += `<tr><td>${c.val().name}</td><td>${c.val().password}</td><td><button onclick="delS('${c.key}')" style="background:red; width:auto; padding:5px;">X</button></td></tr>`;
        });
        document.getElementById('adm-std-list').innerHTML = h + "</table>";
    });
}
window.delS = (id) => { if(confirm("Silinsin?")) db.ref('students/'+id).remove(); };

window.openNewQuizForm = function() {
    let h = `
        <div style="background:#f9f9f9; padding:15px; border-radius:10px;">
            <h3>Yeni 30 Suallıq DİM Sınağı</h3>
            <input id="q-title" placeholder="Sınağın Adı">
            <input id="q-time" type="number" placeholder="Vaxt (dəqiqə)">
            <div id="dim-questions-container" style="max-height:450px; overflow-y:auto; margin:15px 0; border:1px solid #ddd; padding:10px; background:white;">
                <p style="color:#e67e22; font-weight:bold;">Sual sahələrini açmaq üçün aşağıdakı düyməyə basın ↓</p>
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
            <div class="question-box" style="margin-bottom:25px; border-left:5px solid #1a4e8a; padding:10px; background:#fcfcfc;">
                <b>Sual ${i}</b>
                <textarea id="q-txt-${i}" placeholder="Sualın mətni və ya Mənbə mətni" style="width:100%; height:50px; margin-top:5px;"></textarea>
                <input id="q-img-${i}" placeholder="Şəkil linki (Xəritə/Sxem varsa linki bura qoyun)">
                
                ${i <= 22 ? `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-top:5px;">
                    <input id="vA-${i}" placeholder="A variantı"> <input id="vB-${i}" placeholder="B variantı">
                    <input id="vC-${i}" placeholder="C variantı"> <input id="vD-${i}" placeholder="D variantı">
                    <input id="vE-${i}" placeholder="E variantı">
                </div>` : "<p style='color:blue; font-size:12px;'>Açıq sual (Cavabı 'Düzgün Cavab' yerinə yazın)</p>"}
                
                <input id="q-cor-${i}" placeholder="Düzgün Cavab (Məs: A və ya 1,2,5)" style="background:#e8f5e9; border:1px solid #27ae60;">
            </div>`;
    }
};

window.saveDIMQuiz = function() {
    const title = document.getElementById('q-title').value;
    const time = document.getElementById('q-time').value;
    if(!title || !time) return alert("Başlıq və vaxt yazılmalıdır!");
    
    let questions = [];
    for(let i=1; i<=30; i++) {
        let qData = {
            text: document.getElementById(`q-txt-${i}`).value,
            image: document.getElementById(`q-img-${i}`).value,
            correct: document.getElementById(`q-cor-${i}`).value.toUpperCase().trim()
        };
        if(i <= 22) {
            qData.variants = {
                A: document.getElementById(`vA-${i}`).value,
                B: document.getElementById(`vB-${i}`).value,
                C: document.getElementById(`vC-${i}`).value,
                D: document.getElementById(`vD-${i}`).value,
                E: document.getElementById(`vE-${i}`).value
            };
        }
        questions.push(qData);
    }
    db.ref('quizzes').push({ title: title, time: time, active: false, questions: questions })
    .then(() => { alert("Sınaq yaradıldı!"); admGoBack(); });
};

window.uploadMaterial = function() {
    const title = document.getElementById('m-t').value;
    const file = document.getElementById('m-file').files[0];
    const btn = document.getElementById('upload-btn');

    if (!title || !file) return alert("Başlıq və fayl seçin!");
    btn.innerText = "Yüklənir...";

    const storageRef = storage.ref('materials/' + file.name);
    storageRef.put(file).then(snap => snap.ref.getDownloadURL()).then(url => {
        db.ref('materials').push({ title: title, link: url });
        alert("Fayl uğurla yükləndi!");
        location.reload();
    });
};

function loadAdminQuizzes() {
    db.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const q = c.val();
            h += `<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                <span>${q.title}</span>
                <button onclick="togQ('${c.key}',${q.active})" style="width:auto; background:${q.active?'green':'gray'}">${q.active?'Aktiv':'Deaktiv'}</button>
            </div>`;
        });
        document.getElementById('adm-quiz-list').innerHTML = h;
    });
}
window.togQ = (id, s) => db.ref('quizzes/'+id).update({ active: !s });

function loadAdminResults() {
    db.ref('results').on('value', snap => {
        let h = "<table><tr><th>Şagird</th><th>Sınaq</th><th>Net Bal</th></tr>";
        snap.forEach(c => {
            h += `<tr><td>${c.val().studentName}</td><td>${c.val().quizTitle}</td><td><b>${c.val().score}</b></td></tr>`;
        });
        document.getElementById('adm-res-list').innerHTML = h + "</table>";
    });
}
