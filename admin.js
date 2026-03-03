
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
        alert("Şifrə yanlışdır!");
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
};

window.admGoBack = function() {
    document.getElementById('admin-dashboard-grid').classList.remove('hidden');
    document.getElementById('adm-tab-container').classList.add('hidden');
};

window.openNewQuizForm = function() {
    let h = `
        <div class="question-box" style="background:#fff; padding:20px; border-radius:10px;">
            <h3>Yeni 30 Suallıq Sınaq</h3>
            <input id="q-title" placeholder="Sınağın Başlığı (Məs: Səfəvilər)">
            <input id="q-time" type="number" placeholder="Vaxt (dəqiqə)">
            <div id="dim-questions-container" style="max-height:500px; overflow-y:auto; margin:15px 0; border:1px solid #eee; padding:10px;">
                <p>Sualları daxil etmək üçün sahələri açın ↓</p>
            </div>
            <button onclick="generateDIMFields()" style="background:#3498db;">Sual Sahələrini Aç (1-30)</button>
            <button id="save-all-btn" onclick="saveDIMQuiz()" style="background:green; margin-top:10px; display:none;">Sınağı və Şəkilləri Yadda Saxla</button>
        </div>
    `;
    document.getElementById('adm-quiz-list').innerHTML = h;
};

window.generateDIMFields = function() {
    let container = document.getElementById('dim-questions-container');
    container.innerHTML = "";
    for(let i=1; i<=30; i++) {
        container.innerHTML += `
            <div style="margin-bottom:25px; padding:15px; border:1px solid #ddd; border-radius:8px; background:#f9f9f9;">
                <b>Sual ${i}</b>
                <textarea id="q-txt-${i}" placeholder="Sualın mətni" style="width:100%; height:50px; margin-top:5px;"></textarea>
                
                <div style="margin:10px 0;">
                    <label style="font-size:13px; color:#555;">Sxem/Şəkil əlavə et (SS edib bura yüklə):</label><br>
                    <input type="file" id="q-file-${i}" accept="image/*">
                </div>

                ${i <= 22 ? `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px;">
                    <input id="vA-${i}" placeholder="A variantı"> <input id="vB-${i}" placeholder="B variantı">
                    <input id="vC-${i}" placeholder="C variantı"> <input id="vD-${i}" placeholder="D variantı">
                    <input id="vE-${i}" placeholder="E variantı">
                </div>` : ""}
                
                <input id="q-cor-${i}" placeholder="Düzgün cavab (Məs: A)" style="background:#e8f5e9; border:1px solid #27ae60; margin-top:5px;">
            </div>`;
    }
    document.getElementById('save-all-btn').style.display = "block";
};

window.saveDIMQuiz = async function() {
    const title = document.getElementById('q-title').value;
    const time = document.getElementById('q-time').value;
    const btn = document.getElementById('save-all-btn');

    if(!title || !time) return alert("Başlıq və vaxtı yazın!");
    
    btn.innerText = "Şəkillər yüklənir... (Gözləyin)";
    btn.disabled = true;

    let questions = [];

    try {
        for(let i=1; i<=30; i++) {
            let fileInput = document.getElementById(`q-file-${i}`);
            let file = fileInput.files[0];
            let imgUrl = "";
            if(file) {
                const storageRef = storage.ref(`quiz_files/${Date.now()}_sual${i}`);
                const snapshot = await storageRef.put(file);
                imgUrl = await snapshot.ref.getDownloadURL();
            }

            let qData = {
                text: document.getElementById(`q-txt-${i}`).value,
                image: imgUrl,
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
        await db.ref('quizzes').push({
            title: title,
            time: time,
            active: false,
            questions: questions
        });

        alert("Sınaq bütün şəkillərlə birlikdə uğurla yükləndi!");
        location.reload();

    } catch (error) {
        console.error(error);
        alert("Xəta baş verdi: " + error.message);
        btn.innerText = "Yadda Saxla";
        btn.disabled = false;
    }
};

// 6. Şagird və Nəticə yükləmə funksiyaları (Eynidir)
function loadAdminStudents() {
    db.ref('students').on('value', snap => {
        let h = "<table><tr><th>Ad Soyad</th><th>Şifrə</th><th>Sil</th></tr>";
        snap.forEach(c => {
            h += `<tr><td>${c.val().name}</td><td>${c.val().password}</td><td><button onclick="delS('${c.key}')" style="background:red; width:auto;">X</button></td></tr>`;
        });
        document.getElementById('adm-std-list').innerHTML = h + "</table>";
    });
}
window.delS = (id) => { if(confirm("Silinsin?")) db.ref('students/'+id).remove(); };

function loadAdminQuizzes() {
    db.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const q = c.val();
            h += `<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
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
