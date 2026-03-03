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

let currentEditingQuizId = null; 
window.admLogin = function() {
    if (document.getElementById('adm-pass').value === "12345") {
        document.getElementById('admin-login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        document.body.classList.add('after-login');
    } else alert("Şifrə yanlışdır!");
};

window.admTab = (id) => {
    document.getElementById('admin-dashboard-grid').classList.add('hidden');
    document.getElementById('adm-tab-container').classList.remove('hidden');
    document.querySelectorAll('.adm-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id==='std-sec') loadAdminStudents();
    if(id==='quiz-sec') loadAdminQuizzes();
    if(id==='res-sec') loadAdminResults();
};

window.admGoBack = () => {
    document.getElementById('admin-dashboard-grid').classList.remove('hidden');
    document.getElementById('adm-tab-container').classList.add('hidden');
    currentEditingQuizId = null;
};

// SINAQ YARATMA VƏ REDAKTƏ FORMASI
window.openNewQuizForm = () => {
    currentEditingQuizId = null;
    renderQuizForm();
};

function renderQuizForm() {
    document.getElementById('adm-quiz-list').innerHTML = `
        <div class="card">
            <h3>${currentEditingQuizId ? 'Sınağı Redaktə Et' : 'Yeni Sınaq (30 Sual)'}</h3>
            <input id="q-title" placeholder="Sınağın adı">
            <input id="q-time" type="number" placeholder="Vaxt (dəq)">
            <div id="dim-cont" style="max-height:400px; overflow-y:auto; margin:10px 0; border:1px solid #ddd; padding:10px; background:#fff;"></div>
            <button onclick="genDIMFields()" style="background:#3498db;">${currentEditingQuizId ? 'Məlumatları Yüklə' : 'Sahələri Aç'}</button>
            <button id="save-btn" onclick="saveFullQuiz()" style="background:green; margin-top:10px; display:none;">
                ${currentEditingQuizId ? 'Dəyişiklikləri Yenilə' : 'Sınağı Yadda Saxla'}
            </button>
            <p id="upload-status" style="color:blue; font-weight:bold; margin-top:10px;"></p>
        </div>`;
}

window.genDIMFields = (existingData = null) => {
    let c = document.getElementById('dim-cont'); c.innerHTML = "";
    for(let i=1; i<=27; i++){
        let q = existingData ? existingData[i-1] : null;
        c.innerHTML += `
        <div class="question-box" style="margin-bottom:15px; border-left:4px solid #3498db; padding:10px; background:#f9f9f9;">
            <b>Sual ${i}</b>
            <textarea id="q-t-${i}" placeholder="Sual mətni" style="width:100%; height:40px;">${q ? q.text : ''}</textarea>
            <input type="file" id="q-f-${i}" accept="image/*" style="font-size:11px;">
            ${q && q.image ? `<p style="font-size:10px; color:green;">Mövcud şəkil: <a href="${q.image}" target="_blank">Bax</a></p>` : ''}
            <input type="hidden" id="q-img-old-${i}" value="${q ? q.image : ''}">
            ${i<=22 ? `<div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:2px; margin-top:5px;">
                <input id="vA-${i}" placeholder="A" value="${q && q.variants ? q.variants.A : ''}">
                <input id="vB-${i}" placeholder="B" value="${q && q.variants ? q.variants.B : ''}">
                <input id="vC-${i}" placeholder="C" value="${q && q.variants ? q.variants.C : ''}">
                <input id="vD-${i}" placeholder="D" value="${q && q.variants ? q.variants.D : ''}">
                <input id="vE-${i}" placeholder="E" value="${q && q.variants ? q.variants.E : ''}">
            </div>` : ""}
            <input id="q-c-${i}" placeholder="Düzgün cavab" value="${q ? q.correct : ''}" style="margin-top:5px; border-bottom:2px solid green;">
        </div>`;
    }
    
    let sourceVal = existingData && existingData[27] ? existingData[27].source : '';
    c.innerHTML += `
    <div style="background:#fff3cd; padding:10px; border:2px solid #ffc107; border-radius:8px;">
        <h4>📖 Mənbə (28-30)</h4>
        <textarea id="source-text" style="width:100%; height:80px;" placeholder="Mənbə mətni...">${sourceVal}</textarea>
        ${[28,29,30].map(n => {
            let q = existingData ? existingData[n-1] : null;
            return `
            <div style="margin-top:5px;">
                <b>${n}.</b> <input id="q-t-${n}" style="width:70%;" placeholder="Sual" value="${q ? q.text : ''}">
                <input id="q-c-${n}" style="width:20%;" placeholder="Cavab" value="${q ? q.correct : ''}">
            </div>`;
        }).join('')}
    </div>`;
    document.getElementById('save-btn').style.display = "block";
};

// SINAĞI YADDA SAXLA VƏ YA YENİLƏ
window.saveFullQuiz = async function() {
    const btn = document.getElementById('save-btn');
    const status = document.getElementById('upload-status');
    const title = document.getElementById('q-title').value;
    const time = document.getElementById('q-time').value;

    if(!title || !time) return alert("Başlıq və vaxt yazın!");

    btn.disabled = true;
    let qs = [];
    const sourceText = document.getElementById('source-text').value;

    try {
        for(let i=1; i<=30; i++) {
            status.innerText = `Sual ${i} hazırlanır...`;
            let file = document.getElementById(`q-f-${i}`) ? document.getElementById(`q-f-${i}`).files[0] : null;
            let oldImg = document.getElementById(`q-img-old-${i}`) ? document.getElementById(`q-img-old-${i}`).value : "";
            let imgUrl = oldImg; // Əgər yeni şəkil seçilməsə, köhnəni saxlayırıq

            if(file) {
                status.innerText = `Sual ${i}: Yeni şəkil yüklənir...`;
                const ref = storage.ref('quiz/'+Date.now()+'_'+i);
                const snap = await ref.put(file);
                imgUrl = await snap.ref.getDownloadURL();
            }

            let d = {
                text: document.getElementById(`q-t-${i}`).value,
                image: imgUrl,
                correct: document.getElementById(`q-c-${i}`).value.toUpperCase().trim()
            };
            if(i >= 28) d.source = sourceText;
            if(i <= 22) {
                d.variants = { 
                    A: document.getElementById(`vA-${i}`).value, 
                    B: document.getElementById(`vB-${i}`).value, 
                    C: document.getElementById(`vC-${i}`).value, 
                    D: document.getElementById(`vD-${i}`).value,
                    E: document.getElementById(`vE-${i}`).value 
                };
            }
            qs.push(d);
        }

        status.innerText = "Bazaya yazılır...";
        if(currentEditingQuizId) {
            await db.ref('quizzes/' + currentEditingQuizId).update({ title, time, questions: qs });
            alert("Sınaq yeniləndi!");
        } else {
            await db.ref('quizzes').push({ title, time, active: false, questions: qs });
            alert("Sınaq yaradıldı!");
        }
        location.reload();
    } catch (err) {
        alert("Xəta: " + err.message);
        btn.disabled = false;
        status.innerText = "";
    }
};

function loadAdminQuizzes() {
    db.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const q = c.val();
            h += `
            <div class="quiz-item" style="padding:10px; border-bottom:1px solid #eee; display:flex; gap:10px; align-items:center;">
                <span style="flex:1"><b>${q.title}</b></span>
                <button onclick="togQ('${c.key}',${q.active})" style="background:${q.active?'green':'gray'}">${q.active?'Aktiv':'Deaktiv'}</button>
                <button onclick="editQuiz('${c.key}')" style="background:orange">Düzəliş</button>
                <button onclick="delQ('${c.key}')" style="background:red">Sil</button>
            </div>`;
        });
        document.getElementById('adm-quiz-list').innerHTML = h;
    });
}

window.editQuiz = (id) => {
    currentEditingQuizId = id;
    db.ref('quizzes/' + id).once('value', snap => {
        const q = snap.val();
        renderQuizForm();
        document.getElementById('q-title').value = q.title;
        document.getElementById('q-time').value = q.time;
        window.genDIMFields(q.questions);
    });
};

window.togQ = (id, s) => db.ref('quizzes/'+id).update({ active: !s });
window.delQ = (id) => confirm("Bu sınağı silmək istəyirsiz?") && db.ref('quizzes/'+id).remove();

function loadAdminStudents() {
    db.ref('students').on('value', snap => {
        let h = "<table><tr><th>Ad</th><th>Şifrə</th><th>Sil</th></tr>";
        snap.forEach(c => { h += `<tr><td>${c.val().name}</td><td>${c.val().password}</td><td><button onclick="delS('${c.key}')">X</button></td></tr>`; });
        document.getElementById('adm-std-list').innerHTML = h + "</table>";
    });
}
window.delS = (id) => db.ref('students/'+id).remove();

function loadAdminResults() {
    db.ref('results').on('value', snap => {
        let h = "<table><tr><th>Şagird</th><th>Sınaq</th><th>Bal</th></tr>";
        snap.forEach(c => { h += `<tr><td>${c.val().studentName}</td><td>${c.val().quizTitle}</td><td>${c.val().score}</td></tr>`; });
        document.getElementById('adm-res-list').innerHTML = h + "</table>";
    });
}
