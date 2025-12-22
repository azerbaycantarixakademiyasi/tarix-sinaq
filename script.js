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

function saveAnswer(questionName, value) {
    let answers = JSON.parse(localStorage.getItem('savedAnswers')) || {};
    answers[questionName] = value;
    localStorage.setItem('savedAnswers', JSON.stringify(answers));
}

function restoreAnswers() {
    let answers = JSON.parse(localStorage.getItem('savedAnswers')) || {};
    for (let questionName in answers) {
        let value = answers[questionName];
        let radio = document.querySelector(`input[name="${questionName}"][value="${value}"]`);
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
    let totalQuestions = questions.length;
    let studentAnswers = [];

    questions.forEach((qDiv, index) => {
        const qNum = index + 1;
        const selected = qDiv.querySelector(`input[name="q${qNum}"]:checked`);
        const qText = qDiv.querySelector('p').innerText;
        
        // Bu hissədə bal yox, doğruluğu yoxlayırıq (value="10" olanlar düzdür)
        let isCorrect = selected ? (parseInt(selected.value) > 0) : false;
        if (isCorrect) correctCount++;

        studentAnswers.push({
            sual: qText,
            cavab: selected ? selected.getAttribute('data-text') : "Boş buraxılıb",
            dogrudurmu: isCorrect
        });
    });

    let wrongCount = totalQuestions - correctCount;
    const name = localStorage.getItem('studentName');

    database.ref('imtahan_neticeleri').push({
        adSoyad: name,
        duz: correctCount,
        sehv: wrongCount,
        cemi: totalQuestions,
        tarix: new Date().toLocaleString(),
        detallar: studentAnswers
    }).then(() => {
        localStorage.clear();
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('result-screen').classList.remove('hidden');
        document.getElementById('final-score').innerHTML = `
            <strong>${name}</strong>,<br> 
            Düz: <span style="color:green">${correctCount}</span> | 
            Səhv: <span style="color:red">${wrongCount}</span>
        `;
    });
}

// ADMIN PANEL
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
        snapshot.forEach((child) => {
            const val = child.val();
            const key = child.key;
            tbody.innerHTML += `<tr onclick="showDetails('${key}')" style="cursor:pointer">
                <td><strong>${val.adSoyad}</strong></td>
                <td style="color:green">D: ${val.duz}</td>
                <td style="color:red">S: ${val.sehv}</td>
                <td>${val.tarix}</td>
            </tr>`;
        });
    });
}

function showDetails(key) {
    database.ref('imtahan_neticeleri/' + key).once('value', (snapshot) => {
        const data = snapshot.val();
        document.getElementById('student-details').classList.remove('hidden');
        document.getElementById('detail-name').innerText = data.adSoyad + " (Nəticə: " + data.duz + " düz)";
        let listHtml = "";
        data.detallar.forEach(d => {
            const color = d.dogrudurmu ? "#27ae60" : "#e74c3c";
            listHtml += `<p style="border-left: 4px solid ${color}; padding: 10px; background: #fff; margin: 5px 0; font-size:14px;">
                ${d.dogrudurmu ? '✅' : '❌'} <strong>${d.sual}</strong><br>
                <span>Şagirdin cavabı: ${d.cavab}</span>
            </p>`;
        });
        document.getElementById('detail-list').innerHTML = listHtml;
    });
}

function showLogin() { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('admin-login').classList.remove('hidden'); }
function hideLogin() { document.getElementById('admin-login').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }
function logoutAdmin() { localStorage.clear(); location.reload(); }
