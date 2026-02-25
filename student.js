// Firebase konfiqurasiyası eynidir
const database = firebase.database();

window.showCabinetTab = (tabId) => {
    document.querySelectorAll('.cabinet-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    if(tabId === 'exams-tab') loadExams();
    if(tabId === 'library-tab') loadLibrary();
    if(tabId === 'results-tab') loadMyResults();
};

function loadExams() {
    database.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const q = c.val();
            if(q.active) {
                h += `<div class="exam-item">
                    <span>${q.title}</span>
                    <button onclick="startQuiz('${c.key}')">Başla</button>
                </div>`;
            }
        });
        document.getElementById('active-exams-list').innerHTML = h || "Aktiv sınaq yoxdur.";
    });
}

window.finishQuiz = (qId) => {
    database.ref('quizzes/' + qId).once('value').then(snap => {
        const quiz = snap.val();
        let correct = 0, wrong = 0, maxScore = 0, earnedTotal = 0;
        
        quiz.questions.forEach((q, idx) => {
            const sel = document.querySelector(`input[name="q${idx}"]:checked`);
            const ans = sel ? sel.value : null;
            const p = Number(q.point);
            maxScore += p;
            if(ans === q.correct) { correct++; earnedTotal += p; }
            else if(ans !== null) { wrong++; }
        });

        // DİM Məntiqi: 4 səhv 1 sualın balını aparır
        const penalty = (wrong / 4) * (maxScore / quiz.questions.length);
        const finalScore = Math.max(0, earnedTotal - penalty).toFixed(2);

        const user = JSON.parse(localStorage.getItem('currentUser'));
        database.ref('results').push({
            studentName: user.name,
            quizTitle: quiz.title,
            score: finalScore,
            maxScore: maxScore,
            correct, wrong,
            date: new Date().toLocaleString('az-AZ')
        }).then(() => {
            alert("İmtahan bitdi! Nəticələrim bölməsinə baxın.");
            location.reload();
        });
    });
};

function loadLibrary() {
    database.ref('materials').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const m = c.val();
            h += `<div class="material-card">
                <b>[${m.type.toUpperCase()}]</b> ${m.title} 
                <a href="${m.link}" target="_blank">Aç</a>
            </div>`;
        });
        document.getElementById('materials-list').innerHTML = h;
    });
}

function loadMyResults() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    database.ref('results').on('value', snap => {
        let h = "<table><tr><th>Sınaq</th><th>Bal</th><th>D/S</th></tr>";
        snap.forEach(c => {
            const r = c.val();
            if(r.studentName === user.name) {
                h += `<tr><td>${r.quizTitle}</td><td>${r.score}</td><td>${r.correct}/${r.wrong}</td></tr>`;
            }
        });
        document.getElementById('my-results-list').innerHTML = h + "</table>";
    });
}
