let timeLeft = 900; 
let timerInterval;

function startQuiz() {
    const name = document.getElementById('student-name').value.trim();
    if (name.length < 5) {
        alert("Zəhmət olmasa ad və soyadınızı tam daxil edin!");
        return;
    }
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    document.getElementById('timer').innerText = `Qalan Vaxt: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        finishQuiz();
    }
    timeLeft--;
}

function finishQuiz() {
    clearInterval(timerInterval);
    
    let score = 0;
    const answers = document.querySelectorAll('input[type="radio"]:checked');
    answers.forEach(ans => {
        score += parseInt(ans.value);
    });

    const studentName = document.getElementById('student-name').value;
    
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = `${studentName}, topladığınız bal: ${score}`;
}
