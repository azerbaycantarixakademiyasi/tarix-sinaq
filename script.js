// 1. FİREBASE KONFİQURASİYASI
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
const database = firebase.database();

let questions = [];

window.onload = () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        showQuizArea(JSON.parse(savedUser));
    }
};

// 3. ADMİN TAB SİSTEMİ VƏ ŞAGİRD SİYAHISI
window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(div => div.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    if (tabId === 'students-section') {
        loadStudentsList();
    }
};

function loadStudentsList() {
    const listDiv = document.getElementById('students-list');
    listDiv.innerHTML = "Yüklənir...";

    database.ref('students').on('value', (snap) => {
        let html = `
            <table style="width:100%; border-collapse: collapse; margin-top:15px; font-size:14px;">
                <thead>
                    <tr style="background:#1a4e8a; color:white;">
                        <th style="padding:8px; border:1px solid #ddd;">Ad Soyad</th>
                        <th style="padding:8px; border:1px solid #ddd;">Parol</th>
                        <th style="padding:8px; border:1px solid #ddd;">Sil</th>
                    </tr>
                </thead>
                <tbody>`;
        
        snap.forEach(child => {
            const s = child.val();
            html += `
                <tr>
                    <td style="padding:8px; border:1px solid #ddd;">${s.name}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${s.password}</td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:center;">
                        <button onclick="deleteStudent('${child.key}')" style="background:red; padding:2px 8px; width:auto; font-size:10px;">X</button>
                    </td>
                </tr>`;
        });
        
        html += `</tbody></table>`;
        listDiv.innerHTML = html;
    });
}

window.deleteStudent = (id) => {
    if(confirm("Bu şagirdi silmək istədiyinizə əminsiniz?")) {
        database.ref('students/' + id).remove();
    }
};

// 4. ŞAGİRD ƏLAVƏ ETMƏ
window.addStudent = () => {
    const name = document.getElementById('new-std-name').value.trim();
    const pass = document.getElementById('new-std-pass').value.trim();

    if (name && pass) {
        database.ref('students').push({ name: name, password: pass }).then(() => {
            alert("Şagird əlavə olundu!");
            document.getElementById('new-std-name').value = "";
            document.getElementById('new-std-pass').value = "";
        });
    } else {
        alert("Boş buraxmayın!");
    }
};

// 5. SINAQ YARATMA
window.addQuestionField = () => {
    const qIndex = questions.length + 1;
    const qDiv = document.createElement('div');
    qDiv.className = "question-box";
    qDiv.style = "border:1px dashed #1a4e8a; padding:10px; margin-top:10px; border-radius:8px; text-align:left;";
    qDiv.innerHTML = `
        <label style="font-weight:bold; display:block; margin-bottom:5px;">Sual ${qIndex}:</label>
        <input type="text" placeholder="Sualı daxil edin" id="q-text-${qIndex}">
        <input type="text" placeholder="Düzgün cavab" id="q-ans-${qIndex}">
    `;
    document.getElementById('questions-area').appendChild(qDiv);
    questions.push(qIndex);
};

window.saveQuiz = () => {
    const title = document.getElementById('quiz-title').value;
    const time = document.getElementById('quiz-time').value;
    
    if (!title || questions.length === 0) {
        alert("Məlumatları tam doldurun!");
        return;
    }

    let quizData = { title: title, time: time, questions: [] };
    questions.forEach(idx => {
        quizData.questions.push({
            q: document.getElementById(`q-text-${idx}`).value,
            a: document.getElementById(`q-ans-${idx}`).value
        });
    });

    database.ref('quizzes').push(quizData).then(() => {
        alert("Sınaq arxivə yazıldı!");
        location.reload();
    });
};

// 6. GİRİŞ VƏ LOGOUT
window.loginStudent = () => {
    const user = document.getElementById('student-username').value.trim();
    const pass = document.getElementById('student-pass').value.trim();
    
    database.ref('students').once('value').then(snap => {
        let found = null;
        snap.forEach(c => {
            if (c.val().name === user && c.val().password === pass) found = c.val();
        });
        if (found) {
            localStorage.setItem('currentUser', JSON.stringify(found));
            showQuizArea(found);
        } else {
            alert("Məlumatlar yanlışdır!");
        }
    });
};

window.checkAdmin = () => {
    const pass = document.getElementById('admin-password').value;
    if (pass === "12345") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        window.showTab('results-section');
    } else {
        alert("Səhv şifrə!");
    }
};

function showQuizArea(user) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('quiz-selection-area').classList.remove('hidden');
    document.getElementById('welcome-msg').innerText = "Xoş gəldin, " + user.name;
}

window.showAdminLogin = () => {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-login').classList.remove('hidden');
};

window.hideAdminLogin = () => {
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
};

window.logout = () => {
    localStorage.removeItem('currentUser');
    location.reload();
};
