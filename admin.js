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

function renderQuizForm(existingData = null) {
    let title = currentEditingQuizId ? "Sınağı Redaktə Et" : "Yeni Sınaq Yarat";
    let h = `
        <div class="card" style="max-width:900px; margin:auto; border:2px solid #3498db;">
            <h3 style="color:#3498db; text-align:center;">${title}</h3>
            <input id="q-title" placeholder="Sınağın adı" style="width:100%; margin-bottom:10px; padding:12px; font-size:16px;">
            <input id="q-time" type="number" placeholder="Vaxt (dəqiqə)" style="width:100%; margin-bottom:15px; padding:12px;">
            
            <div id="dim-cont" style="max-height:600px; overflow-y:auto; border:1px solid #ddd; padding:20px; background:#fff; margin-bottom:15px; border-radius:10px;">
                ${genDIMFieldsHTML(existingData)}
            </div>

            <button id="save-btn" onclick="saveFullQuiz()" style="background:#27ae60; width:100%; height:55px; font-size:20px; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">
                ${currentEditingQuizId ? '💾 DƏYİŞİKLİKLƏRİ YENİLƏ' : '🚀 SINAĞI BAZAYA YÜKLƏ'}
            </button>
            <p id="upload-status" style="color:#e67e22; font-weight:bold; text-align:center; margin-top:15px; font-size:16px;"></p>
        </div>`;
    document.getElementById('adm-quiz-list').innerHTML = h;
}

function genDIMFieldsHTML(existingData) {
    let html = "";
    for(let i=1; i<=27; i++){
        let q = existingData ? existingData[i-1] : { text: "", image: "", correct: "", variants: {A:"", B:"", C:"", D:"", E:""} };
        html += `
        <div style="margin-bottom:25px; border-left:5px solid #3498db; padding:15px; background:#f4f7f6; border-radius:5px;">
            <b style="font-size:18px;">Sual ${i}</b>
            <textarea id="q-t-${i}" style="width:100%; height:60px; margin:10px 0; padding:8px;">${q.text}</textarea>
            
            <div style="margin:10px 0; background:#fff; padding:10px; border:1px dashed #ccc;">
                <label>Şəkil/Sxem yüklə:</label>
                <input type="file" id="q-f-${i}" accept="image/*">
                ${q.image ? `<p style="color:green; font-size:12px;">Mövcud şəkil bazadadır.</p>` : ''}
                <input type="hidden" id="q-img-old-${i}" value="${q.image || ''}">
            </div>

            ${i<=22 ? `
            <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:8px; margin-top:10px;">
                ${['A','B','C','D','E'].map(v => `<input id="v${v}-${i}" placeholder="${v}" value="${q.variants ? q.variants[v] : ''}" style="padding:8px; border:1px solid #ccc;">`).join('')}
            </div>` : ""}
            
            <input id="q-c-${i}" placeholder="Düzgün cavab (Məs: A)" value="${q.correct}" style="width:100%; margin-top:10px; padding:10px; border:2px solid #27ae60; font-weight:bold;">
        </div>`;
    }

    let sourceVal = (existingData && existingData[27]) ? existingData[27].source : "";
    html += `
    <div style="background:#fff3cd; padding:20px; border:2px solid #f1c40f; border-radius:10px;">
        <h4 style="margin-top:0;">📖 MƏNBƏ MƏTNİ (Suallar 28-30)</h4>
        <textarea id="source-text" style="width:100%; height:120px; padding:10px;">${sourceVal}</textarea>
        ${[28,29,30].map(n => {
            let q = existingData ? existingData[n-1] : { text: "", correct: "" };
            return `
            <div style="margin-top:15px; border-top:1px solid #f39c12; padding-top:10px;">
                <b>${n}. Sual:</b> <input id="q-t-${n}" style="width:70%; padding:8px;" value="${q.text}">
                <b>Cavab:</b> <input id="q-c-${n}" style="width:15%; padding:8px;" value="${q.correct}">
            </div>`;
        }).join('')}
    </div>`;
    return html;
}

window.saveFullQuiz = async function() {
    const btn = document.getElementById('save-btn');
    const status = document.getElementById('upload-status');
    const title = document.getElementById('q-title').value;
    const time = document.getElementById('q-time').value;

    if(!title || !time) return alert("Başlıq və vaxt boş ola bilməz!");

    btn.disabled = true;
    let qs = [];
    const sourceText = document.getElementById('source-text').value;

    try {
        for(let i=1; i<=30; i++) {
            status.innerText = `Sual ${i} hazırlanır...`;
            let file = document.getElementById(`q-f-${i}`) ? document.getElementById(`q-f-${i}`).files[0] : null;
            let oldImg = document.getElementById(`q-img-old-${i}`) ? document.getElementById(`q-img-old-${i}`).value : "";
            let imgUrl = oldImg;

            if(file) {
                status.innerText = `Sual ${i}: Şəkil yüklənir...`;
                const ref = storage.ref('quiz_files/' + Date.now() + "_" + i);
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
                    A: document.getElementById(`vA-${i}`).value, B: document.getElementById(`vB-${i}`).value, 
                    C: document.getElementById(`vC-${i}`).value, D: document.getElementById(`vD-${i}`).value,
                    E: document.getElementById(`vE-${i}`).value 
                };
            }
            qs.push(d);
        }

        status.innerText = "Yadda saxlanılır...";
        if(currentEditingQuizId) {
            await db.ref('quizzes/' + currentEditingQuizId).update({ title, time, questions: qs });
            alert("Sınaq uğurla YENİLƏNDİ!");
        } else {
            await db.ref('quizzes').push({ title, time, active: false, questions: qs });
            alert("Yeni sınaq uğurla YARADILDI!");
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
            h += `<div class="quiz-item" style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #eee; background:#fff; margin-bottom:5px;">
                <span><b>${q.title}</b> (${q.time} dəq)</span>
                <div>
                    <button onclick="togQ('${c.key}',${q.active})" style="background:${q.active?'green':'#7f8c8d'}; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">${q.active?'Aktiv':'Deaktiv'}</button>
                    <button onclick="editQuiz('${c.key}')" style="background:#f39c12; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; margin-left:5px;">Düzəliş</button>
                    <button onclick="delQ('${c.key}')" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; margin-left:5px;">Sil</button>
                </div>
            </div>`;
        });
        document.getElementById('adm-quiz-list').innerHTML = h;
    });
}

window.editQuiz = (id) => {
    currentEditingQuizId = id;
    db.ref('quizzes/' + id).once('value', snap => {
        const q = snap.val();
        renderQuizForm(q.questions);
        document.getElementById('q-title').value = q.title;
        document.getElementById('q-time').value = q.time;
    });
};

window.openNewQuizForm = () => {
    currentEditingQuizId = null;
    renderQuizForm(null);
};

window.togQ = (id, s) => db.ref('quizzes/'+id).update({ active: !s });
window.delQ = (id) => confirm("Bu sınağı silmək istəyirsiz?") && db.ref('quizzes/'+id).remove();

function loadAdminStudents() {
    db.ref('students').on('value', snap => {
        let h = "<table border='1' width='100%' style='border-collapse:collapse;'><tr><th>Ad</th><th>Şifrə</th><th>Sil</th></tr>";
        snap.forEach(c => { h += `<tr align='center'><td>${c.val().name}</td><td>${c.val().password}</td><td><button onclick="delS('${c.key}')" style='background:red; color:white;'>X</button></td></tr>`; });
        document.getElementById('adm-std-list').innerHTML = h + "</table>";
    });
}
window.delS = (id) => db.ref('students/'+id).remove();

function loadAdminResults() {
    db.ref('results').on('value', snap => {
        let h = "<table border='1' width='100%' style='border-collapse:collapse;'><tr><th>Şagird</th><th>Sınaq</th><th>Net Bal</th></tr>";
        snap.forEach(c => { h += `<tr align='center'><td>${c.val().studentName}</td><td>${c.val().quizTitle}</td><td><b>${c.val().score}</b></td></tr>`; });
        document.getElementById('adm-res-list').innerHTML = h + "</table>";
    });
}
