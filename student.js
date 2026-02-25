const firebaseConfig = {
    apiKey: "AIzaSyDulTEwR08ErC3J9uvjDHGJ1wxqTy91x1I",
    authDomain: "tarix-sinaq-db.firebaseapp.com",
    databaseURL: "https://tarix-sinaq-db-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tarix-sinaq-db",
    storageBucket: "tarix-sinaq-db.firebasestorage.app",
    messagingSenderId: "233204280838",
    appId: "1:233204280838:web:7d00c9800170a13ca45d87"
};

// Firebase-i yalnız bir dəfə başlat
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Giriş funksiyası
window.login = function() {
    const u = document.getElementById('std-user').value;
    const p = document.getElementById('std-pass').value;

    if (!u || !p) {
        alert("Xanaları doldurun!");
        return;
    }

    db.ref('students').once('value').then(snap => {
        let foundUser = null;
        snap.forEach(c => {
            if (c.val().name === u && c.val().password === p) {
                foundUser = c.val();
            }
        });

        if (foundUser) {
            localStorage.setItem('student', JSON.stringify(foundUser));
            // Ekranları dəyişdir
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('cabinet-screen').classList.remove('hidden');
            document.getElementById('user-name-display').innerText = "Xoş gəldin, " + foundUser.name;
            showTab('exams');
        } else {
            alert("Məlumatlar səhvdir!");
        }
    }).catch(err => alert("Xəta: " + err.message));
};

// Tabları göstər
window.showTab = function(id) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(t => t.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');

    if (id === 'exams') loadExams();
    if (id === 'library') loadMaterials();
    if (id === 'results') loadResults();
};

function loadExams() {
    db.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const q = c.val();
            if (q.active) {
                h += `<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <span>${q.title}</span>
                    <button onclick="startQuiz('${c.key}')" style="width:80px; margin:0;">Başla</button>
                </div>`;
            }
        });
        document.getElementById('list-exams').innerHTML = h || "Aktiv sınaq yoxdur.";
    });
}

window.startQuiz = function(id) {
    db.ref('quizzes/' + id).once('value').then(snap => {
        const q = snap.val();
        document.getElementById('cabinet-screen').classList.add('hidden');
        const screen = document.getElementById('quiz-screen');
        screen.classList.remove('hidden');

        let html = `<h2>${q.title}</h2><hr>`;
        q.questions.forEach((s, i) => {
            html += `<div class="question-box" style="text-align:left; margin-bottom:20px;">
                <p><b>${i + 1}. ${s.text} (${s.point} bal)</b></p>
                ${s.img ? `<img src="${s.img}" style="max-width:100%;">` : ''}
                ${Object.entries(s.variants).map(([k, v]) => `
                    <label style="display:block; margin:5px 0;">
                        <input type="radio" name="q${i}" value="${k}"> ${k}) ${v}
                    </label>
                `).join('')}
            </div>`;
        });
        html += `<button onclick="finishQuiz('${id}')">İmtahanı Bitir</button>`;
        screen.innerHTML = html;
    });
};

window.finishQuiz = function(id) {
    db.ref('quizzes/' + id).once('value').then(snap => {
        const q = snap.val();
        let cor = 0, wrg = 0, earned = 0, max = 0;

        q.questions.forEach((s, i) => {
            const sel = document.querySelector(`input[name="q${i}"]:checked`);
            const p = Number(s.point);
            max += p;
            if (sel && sel.value === s.correct) {
                cor++; earned += p;
            } else if (sel) {
                wrg++;
            }
        });

        // DİM: 4 səhv 1 düzün balını aparır
        const penalty = (wrg / 4) * (max / q.questions.length);
        const final = Math.max(0, earned - penalty).toFixed(2);

        const user = JSON.parse(localStorage.getItem('student'));
        db.ref('results').push({
            studentName: user.name,
            quizTitle: q.title,
            score: final,
            correct: cor,
            wrong: wrg,
            date: new Date().toLocaleString()
        }).then(() => {
            alert("İmtahan bitdi! Balınız: " + final);
            window.location.reload(); // Yalnız imtahan bitəndə reload et
        });
    });
};

function loadMaterials() {
    db.ref('materials').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            h += `<div style="padding:10px; border-bottom:1px solid #eee;">
                ${c.val().title} <a href="${c.val().link}" target="_blank" style="float:right;">Aç</a>
            </div>`;
        });
        document.getElementById('list-mats').innerHTML = h || "Material yoxdur.";
    });
}

function loadResults() {
    const user = JSON.parse(localStorage.getItem('student'));
    if(!user) return;
    db.ref('results').on('value', snap => {
        let h = "<table><tr><th>Sınaq</th><th>Bal</th><th>D/S</th></tr>";
        snap.forEach(c => {
            const r = c.val();
            if (r.studentName === user.name) {
                h += `<tr><td>${r.quizTitle}</td><td>${r.score}</td><td>${r.correct}/${r.wrong}</td></tr>`;
            }
        });
        document.getElementById('list-results').innerHTML = h + "</table>";
    });
}

window.logout = function() {
    localStorage.removeItem('student');
    window.location.reload();
};
