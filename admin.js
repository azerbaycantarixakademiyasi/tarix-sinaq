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


window.admLogin = () => {
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
    let h = `
        <div class="card">
            <h3 style="text-align:center; color:#1a4e8a;">${currentEditingQuizId ? 'Sınağı Redaktə Et' : 'Yeni Sınaq Yarat'}</h3>
            <input id="q-title" placeholder="Sınağın adı (Məs: Səfəvilər dövləti)">
            <input id="q-time" type="number" placeholder="Vaxt (dəqiqə)">
            <div id="dim-cont">${genFieldsHTML(existingData)}</div>
            <button id="save-btn" onclick="saveFullQuiz()" style="background:#27ae60; color:white; width:100%; margin-top:20px;">
                ${currentEditingQuizId ? '💾 DƏYİŞİKLİKLƏRİ YENİLƏ' : '🚀 SINAĞI BAZAYA YÜKLƏ'}
            </button>
            <p id="upload-status"></p>
        </div>`;
    document.getElementById('adm-quiz-list').innerHTML = h;
}


function genFieldsHTML(data) {
    let html = "";
    for(let i=1; i<=27; i++){
        let q = data ? data[i-1] : {text:"", image:"", correct:"", variants:{A:"",B:"",C:"",D:"",E:""}};
        html += `
        <div class="question-box">
            <b>Sual ${i}</b>
            <textarea id="q-t-${i}" placeholder="Sual mətni">${q.text}</textarea>
            <div style="background:#f8f9fa; padding:10px; border:1px dashed #ccc; margin:10px 0;">
                <label>Şəkil yüklə:</label>
                <input type="file" id="q-f-${i}" accept="image/*">
                <input type="hidden" id="q-img-old-${i}" value="${q.image || ''}">
                ${q.image ? `<p style="font-size:11px; color:green;">Mövcud şəkil saxlanılır.</p>` : ''}
            </div>
            ${i<=22 ? `<div class="variants-grid">
                ${['A','B','C','D','E'].map(v => `<input id="v${v}-${i}" placeholder="${v}" value="${q.variants ? q.variants[v] : ''}">`).join('')}
            </div>` : ""}
            <input id="q-c-${i}" placeholder="Düzgün cavab (Məs: A)" value="${q.correct}" style="border-bottom:2px solid #27ae60;">
        </div>`;
    }
    
    let src = (data && data[27]) ? data[27].source : "";
    html += `
    <div class="source-section">
        <h4>📖 Mənbə (28-30)</h4>
        <textarea id="source-text" placeholder="Mənbə mətni bura yazılır...">${src}</textarea>
        ${[28,29,30].map(n => {
            let q = data ? data[n-1] : {text:"", correct:""};
            return `
            <div style="margin-top:10px; display:flex; gap:10px;">
                <b>${n}.</b> <input id="q-t-${n}" placeholder="Sual" value="${q.text}" style="width:70%"> 
                <input id="q-c-${n}" placeholder="Cavab" value="${q.correct}" style="width:25%">
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

    if(!title || !time) return alert("Başlıq və vaxt mütləqdir!");

    btn.disabled = true;
    let qs = [];
    const sourceText = document.getElementById('source-text').value;

    try {
        for(let i=1; i<=30; i++) {
            status.innerText = `Sual ${i} hazırlanır...`;
            let file = document.getElementById(`q-f-${i}`)?.files[0];
            let imgUrl = document.getElementById(`q-img-old-${i}`).value;

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
            alert("Sınaq uğurla yeniləndi!");
        } else {
            await db.ref('quizzes').push({ title, time, active: false, questions: qs });
            alert("Yeni sınaq yaradıldı!");
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
            <div class="quiz-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #ddd; background:white;">
                <span><b>${q.title}</b> (${q.time} dəq)</span>
                <div>
                    <button onclick="togQ('${c.key}',${q.active})" style="background:${q.active?'green':'gray'}; color:white; padding:5px 10px;">${q.active?'Aktiv':'Passiv'}</button>
                    <button onclick="editQuiz('${c.key}')" style="background:orange; color:white; padding:5px 10px; margin-left:5px;">Düzəliş</button>
                    <button onclick="delQ('${c.key}')" style="background:red; color:white; padding:5px 10px; margin-left:5px;">Sil</button>
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
        let h = "<table border='1' width='100%' style='border-collapse:collapse;'><tr><th>Şagird</th><th>Sınaq</th><th>Bal</th></tr>";
        snap.forEach(c => { h += `<tr align='center'><td>${c.val().studentName}</td><td>${c.val().quizTitle}</td><td>${c.val().score}</td></tr>`; });
        document.getElementById('adm-res-list').innerHTML = h + "</table>";
    });
}
