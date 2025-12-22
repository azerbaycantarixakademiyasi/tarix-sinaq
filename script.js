// Firebase konfiqurasiyası
const firebaseConfig = {
  apiKey: "AIzaSyDulTEwR08ErC3J9uvjDHGJ1wxqTy91x1I",
  authDomain: "tarix-sinaq-db.firebaseapp.com",
  databaseURL: "https://tarix-sinaq-db-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tarix-sinaq-db",
  storageBucket: "tarix-sinaq-db.firebasestorage.app",
  messagingSenderId: "233204280838",
  appId: "1:233204280838:web:7d00c9800170a13ca45d87"
};

// Firebase-i başlat
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let timeLeft = 900; // 15 dəqiqə
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

    // Məlumatı Firebase-ə göndəririk
    database.ref('imtahan_neticeleri').push({
        adSoyad: studentName,
        toplananBal: score,
        tarix: new Date().toLocaleString()
    }).then(() => {
        // Məlumat uğurla getdikdən sonra ekranı dəyişirik
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('result-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = `${studentName}, topladığınız bal: ${score}`;
    }).catch((error) => {
        console.error("Xəta baş verdi:", error);
        alert("Xəta: Nəticə göndərilə bilmədi. İnterneti yoxlayın.");
    });
}
