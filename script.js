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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let timeLeft = localStorage.getItem('timeLeft') ? parseInt(localStorage.getItem('timeLeft')) : 900;
let timerInterval;

// Səhifə yüklənəndə vəziyyəti bərpa et
window.onload = function() {
    const savedName = localStorage.getItem('studentName');
    const isQuizRunning = localStorage.getItem('isQuizRunning');

    if (isQuizRunning === "true" && savedName) {
        document.getElementById('student-name').value = savedName;
        restoreAnswers();
        resumeQuiz();
    }

    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            saveAnswer(this.name, this.value);
        });
    });
};

function saveAnswer(qName, val) {
    let answers = JSON.parse(localStorage.getItem('savedAnswers')) || {};
    answers[qName] = val;
    localStorage.setItem('savedAnswers', JSON.stringify(answers));
}

function restoreAnswers() {
    let answers = JSON.parse(localStorage.getItem('savedAnswers')) || {};
    for (let qName in answers) {
        let val = answers[qName];
        let radio = document.querySelector(`input[name="${qName}"][value="${val}"]`);
        if (radio) radio.checked = true;
    }
}

function startQuiz() {
    const name = document.getElementById('student-name').value.trim();
    if (name.length < 5) { alert("Ad və Soyad daxil edin!"); return; }
    
    localStorage.setItem('studentName', name);
    localStorage.setItem('isQuizRunning', "true");
    localStorage.setItem('timeLeft', 900);
    localStorage.setItem('savedAnswers', JSON.stringify({}));

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    timerInterval = setInterval(updateTimer, 1000);
}

function resumeQuiz() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    let min = Math.floor(timeLeft / 60);
    let sec = timeLeft % 60;
    document.getElementById('timer').innerText = `Qalan Vaxt: ${min}:${sec < 10 ? '0' : ''}${sec}`;
    localStorage.setItem('timeLeft', timeLeft);
    if (timeLeft-- <= 0) finishQuiz();
}

function finishQuiz() {
    clearInterval(timerInterval);
    let correctCount = 0;
    let questions = document.querySelectorAll('.question');
    let studentAnswers = [];

    questions.forEach((qDiv, index) => {
        const qNum = index + 1;
        const selected = qDiv.querySelector(`input[name="q${qNum}"]:checked`);
        let isCorrect = selected ? (parseInt(selected.value) > 0) : false;
        if (isCorrect) correctCount++;

        studentAnswers.push({
            sual: qDiv.querySelector('p').innerText,
            cavab: selected ? selected.getAttribute('data-text') : "Boş buraxılıb",
            dogrudurmu: isCorrect
        });
    });

    const name = localStorage.getItem('studentName');
    database.ref('imtahan_neticeleri').push({
        adSoyad: name,
        duz: correctCount,
        sehv: questions.length - correctCount,
        tarix: new Date().toLocaleString(),
        detallar: studentAnswers
    }).then(() => {
        localStorage.clear();
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('result-screen').classList.remove('hidden');
        document.getElementById('final-score').innerHTML = `<strong>${name}</strong>: ${correctCount} Düz, ${questions.length - correctCount} Səhv`;
    });
}

// --- MÜƏLLİM (ADMIN) FUNKSİYALARI ---

function checkAdmin() {
    if (document.getElementById('admin-password').value === "nermin2025") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        loadResults();
    } else { alert("Yanlış parol!"); }
}

function loadResults() {
    const tbody = document.getElementById('results-body');
    database.ref('imtahan_neticeleri').on('value', (snapshot) => {
        tbody.innerHTML = "";
        if (!snapshot.exists()) {
            tbody.innerHTML = "<tr><td colspan='4' style='text-align:center'>Nəticə yoxdur</td></tr>";
            return;
        }
        snapshot.forEach((child) => {
            const val = child.val();
            const key = child.key;
            tbody.innerHTML += `<tr>
                <td onclick="showDetails('${key}')" style="cursor:pointer"><strong>${val.adSoyad}</strong></td>
                <td style="color:green">D: ${val.duz}</td>
                <td style="color:red">S: ${val.sehv}</td>
                <td style="font-size:11px">${val.tarix} 
                    <button onclick="deleteResult('${key}')" style="width:auto; background:#e74c3c; padding:3px 7px; margin-left:5px;">X</button>
                </td>
            </tr>`;
        });
    });
}

// Tək bir nəticəni silmək
function deleteResult(key) {
    if (confirm("Bu nəticəni silmək istəyirsiniz?")) {
        database.ref('imtahan_neticeleri/' + key).set(null);
    }
}

// Bütün nəticələri təmizləmək
function clearAllResults() {
    if (confirm("DİQQƏT: Bütün şagird nəticələri silinəcək! Əminsiniz?")) {
        database.ref('imtahan_neticeleri').set(null)
        .then(() => alert("Baza tamamilə təmizləndi."))
        .catch(err => alert("Xəta: " + err.message));
    }
}

function showDetails(key) {
    database.ref('imtahan_neticeleri/' + key).once('value', (snapshot) => {
        const data = snapshot.val();
        document.getElementById('student-details').classList.remove('hidden');
        document.getElementById('detail-name').innerText = data.adSoyad + " - Analiz";
        let html = "";
        data.detallar.forEach(d => {
            const color = d.dogrudurmu ? "green" : "red";
            html += `<p style="color:${color}; border-bottom:1px solid #eee; padding:5px;">
                ${d.dogrudurmu ? '✅' : '❌'} <strong>${d.sual}</strong><br>
                <small>Cavab: ${d.cavab}</small>
            </p>`;
        });
        document.getElementById('detail-list').innerHTML = html;
    });
}

function showLogin() { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); }
function hideLogin() { document.getElementById('admin-login').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }
function logoutAdmin() { location.reload(); }
