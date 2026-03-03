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
    if (document.getElementById('adm-pass').value === "nermine_2026") {
        document.getElementById('admin-login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        document.body.classList.add('after-login');
    } else alert("Səhv şifrə!");
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
};

window.openNewQuizForm = () => {
    document.getElementById('adm-quiz-list').innerHTML = `
        <div class="card">
            <h3>DİM Standartı: 30 Sual (28-30 Situasiya)</h3>
            <input id="q-title" placeholder="Sınaq Adı">
            <input id="q-time" type="number" placeholder="Dəqiqə">
            
            <div id="dim-cont" style="max-height:450px; overflow-y:auto; margin:15px 0; border:1px solid #ddd; padding:10px;">
                <p>Sualları yükləmək üçün aşağıdakı düyməyə basın ↓</p>
            </div>
            
            <button onclick="genDIMFields()" style="background:#3498db;">Sual Sahələrini Aç</button>
            <button id="save-btn" onclick="saveFullQuiz()" style="background:green; margin-top:10px; display:none;">Sınağı Yadda Saxla</button>
        </div>`;
};

window.genDIMFields = () => {
    let c = document.getElementById('dim-cont'); c.innerHTML = "";
 for(let i=1; i<=27; i++){
        c.innerHTML += `
        <div class="question-box" style="margin-bottom:20px; border-left:4px solid #3498db; padding-left:10px;">
            <b>Sual ${i}</b>
            <textarea id="q-t-${i}" placeholder="Sualın mətni"></textarea>
            <input type="file" id="q-f-${i}" accept="image/*" style="font-size:11px;">
            ${i<=22 ? `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px;">
                    <input id="vA-${i}" placeholder="A"> <input id="vB-${i}" placeholder="B">
                    <input id="vC-${i}" placeholder="C"> <input id="vD-${i}" placeholder="D">
                    <input id="vE-${i}" placeholder="E">
                </div>` : ""}
            <input id="q-c-${i}" placeholder="Düzgün cavab">
        </div>`;
    }

   c.innerHTML += `
    <div class="question-box" style="background:#fff3cd; border:2px solid #ffc107; padding:15px; border-radius:10px;">
        <h4 style="margin-top:0;">📖 Mənbə (Suallar 28-30 üçün)</h4>
        <textarea id="source-text" placeholder="Mənbə mətnini bura yazın (Məs: 'В первые годы своего правления...')" style="width:100%; height:120px; border:1px solid #ffc107;"></textarea>
        <div style="margin-top:10px;">
            <b>28. Sual:</b> <input id="q-t-28" style="width:80%;" placeholder="Məs: Отметьте имя шаха..."><br>
            <b>Cavab:</b> <input id="q-c-28" style="width:50%;"><br><br>
            
            <b>29. Sual:</b> <input id="q-t-29" style="width:80%;" placeholder="Məs: Напишите причину..."><br>
            <b>Cavab:</b> <input id="q-c-29" style="width:50%;"><br><br>
            
            <b>30. Sual:</b> <input id="q-t-30" style="width:80%;" placeholder="Məs: Напишите 2 результата..."><br>
            <b>Cavab:</b> <input id="q-c-30" style="width:50%;">
        </div>
    </div>`;
    
    document.getElementById('save-btn').style.display = "block";
};

window.saveFullQuiz = async function() {
    const btn = document.getElementById('save-btn');
    btn.innerText = "Yüklənir..."; btn.disabled = true;

    let qs = [];
    const sourceText = document.getElementById('source-text').value;

    for(let i=1; i<=30; i++) {
        let file = document.getElementById(`q-f-${i}`) ? document.getElementById(`q-f-${i}`).files[0] : null;
        let imgUrl = "";

        if(file) {
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

    db.ref('quizzes').push({
        title: document.getElementById('q-title').value,
        time: document.getElementById('q-time').value,
        active: false,
        questions: qs
    }).then(() => { alert("Sınaq hazırdır!"); location.reload(); });
};
