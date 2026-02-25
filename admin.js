
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();
let quizQuestions = [];

window.checkAdmin = () => {
    if(document.getElementById('admin-password').value === "12345") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        showTab('results-sec');
    } else alert("Şifrə səhvdir!");
};

window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(d => d.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    if (tabId === 'results-sec') loadAdminResults();
    if (tabId === 'quizzes-sec') loadAdminQuizzes();
    if (tabId === 'materials-sec') loadAdminMaterials();
};


function loadAdminQuizzes() {
    database.ref('quizzes').on('value', snap => {
        let h = "<h3>Mövcud Sınaqlar</h3><table><tr><th>Ad</th><th>Status</th><th>X</th></tr>";
        snap.forEach(c => {
            const q = c.val();
            h += `<tr>
                <td>${q.title}</td>
                <td><button onclick="toggleQuiz('${c.key}', ${q.active})" style="background:${q.active?'#27ae60':'#7f8c8d'}; width:auto;">${q.active?'Aktiv':'Deaktiv'}</button></td>
                <td><button onclick="deleteQuiz('${c.key}')" style="background:red; width:auto;">Sil</button></td>
            </tr>`;
        });
        document.getElementById('admin-quizzes-display').innerHTML = h + "</table>";
    });
}

window.toggleQuiz = (id, status) => {
    database.ref('quizzes/' + id).update({ active: !status });
};

window.deleteQuiz = (id) => {
    if(confirm("Sınağı tamamilə silmək istəyirsiniz?")) database.ref('quizzes/' + id).remove();
};

// Nəticələrin idarə edilməsi
function loadAdminResults() {
    database.ref('results').on('value', snap => {
        let h = "<table><tr><th>Şagird</th><th>Sınaq</th><th>Bal</th><th>X</th></tr>";
        snap.forEach(c => {
            const r = c.val();
            h += `<tr>
                <td>${r.studentName}</td>
                <td>${r.quizTitle}</td>
                <td><b>${r.score}</b></td>
                <td><button onclick="deleteResult('${c.key}')" style="background:red; width:auto; padding:2px 8px;">Sil</button></td>
            </tr>`;
        });
        document.getElementById('admin-results-display').innerHTML = h + "</table>";
    });
}

window.deleteResult = (id) => {
    if(confirm("Nəticə silinsin?")) database.ref('results/' + id).remove();
};

// Materialların idarə edilməsi
window.saveMaterial = () => {
    const title = document.getElementById('mat-title').value;
    const type = document.getElementById('mat-type').value;
    const link = document.getElementById('mat-link').value;
    if(title && link) {
        database.ref('materials').push({ title, type, link }).then(() => {
            alert("Yükləndi!");
            document.getElementById('mat-title').value = "";
            document.getElementById('mat-link').value = "";
        });
    }
};

function loadAdminMaterials() {
    database.ref('materials').on('value', snap => {
        let h = "<table><tr><th>Başlıq</th><th>Növ</th><th>X</th></tr>";
        snap.forEach(c => {
            h += `<tr>
                <td>${c.val().title}</td>
                <td>${c.val().type}</td>
                <td><button onclick="deleteMaterial('${c.key}')" style="background:red; width:auto;">Sil</button></td>
            </tr>`;
        });
        document.getElementById('admin-materials-list').innerHTML = h + "</table>";
    });
}

window.deleteMaterial = (id) => database.ref('materials/' + id).remove();
function loadAdminQuizzes() {
    database.ref('quizzes').on('value', snap => {
        let h = `<table><tr><th>Sınaq</th><th>Sil</th></tr>`;
        snap.forEach(c => { h += `<tr><td>${c.val().title}</td><td><button onclick="deleteQuiz('${c.key}')" style="background:red; width:auto;">X</button></td></tr>`; });
        document.getElementById('admin-quizzes-list').innerHTML = h + `</table>`;
    });
}

function loadStudents() {
    database.ref('students').on('value', snap => {
        let h = `<table><tr><th>Ad</th><th>Parol</th><th>X</th></tr>`;
        snap.forEach(c => { h += `<tr><td>${c.val().name}</td><td>${c.val().password}</td><td><button onclick="deleteStudent('${c.key}')" style="background:red; width:auto;">X</button></td></tr>`; });
        document.getElementById('students-list').innerHTML = h + `</table>`;
    });
}

window.addStudent = () => {
    const n = document.getElementById('new-std-name').value;
    const p = document.getElementById('new-std-pass').value;
    if(n && p) database.ref('students').push({name: n, password: p}).then(() => alert("Əlavə edildi!"));
};

window.deleteQuiz = (id) => { if(confirm("Silinsin?")) database.ref('quizzes/' + id).remove(); };
window.deleteStudent = (id) => { if(confirm("Silinsin?")) database.ref('students/' + id).remove(); };
window.closeModal = () => document.getElementById('details-modal').classList.add('hidden');
window.logout = () => { location.href = "index.html"; };
