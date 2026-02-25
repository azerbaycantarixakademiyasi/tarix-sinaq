// Firebase config 
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
let qQs = [];

window.admLogin = () => {
    if(document.getElementById('adm-pass').value === "12345") {
        document.getElementById('admin-login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        admTab('std-sec');
    } else alert("Səhv!");
};

window.admTab = (id) => {
    document.querySelectorAll('.adm-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id === 'std-sec') loadAdminStudents();
    if(id === 'quiz-sec') loadAdminQuizzes();
    if(id === 'res-sec') loadAdminResults();
    if(id === 'mat-sec') loadAdminMaterials();
};

window.addS = () => {
    const n = document.getElementById('n-s-n').value, p = document.getElementById('n-s-p').value;
    if(n && p) db.ref('students').push({name:n, password:p}).then(() => loadAdminStudents());
};

function loadAdminStudents() {
    db.ref('students').on('value', snap => {
        let h = "<table>";
        snap.forEach(c => { h += `<tr><td>${c.val().name}</td><td>${c.val().password}</td><td><button onclick="delS('${c.key}')" style="background:red;">Sil</button></td></tr>`; });
        document.getElementById('adm-std-list').innerHTML = h + "</table>";
    });
}
window.delS = (id) => db.ref('students/'+id).remove();

window.openForm = () => {
    qQs = [];
    document.getElementById('adm-quiz-list').innerHTML = `
        <input id="qt" placeholder="Sınaq Adı"><input id="tm" placeholder="Dəqiqə">
        <div id="q-cont"></div>
        <button onclick="addQF()">+ Sual</button><button onclick="saveQ()" style="background:green;">Yadda Saxla</button>
    `;
};

window.addQF = () => {
    const i = qQs.length + 1;
    const d = document.createElement('div');
    d.innerHTML = `<hr><b>Sual ${i}</b><input id="t${i}" placeholder="Mətn"><input id="p${i}" placeholder="Bal">
    <input id="vA${i}" placeholder="A"><input id="vB${i}" placeholder="B"><input id="vC${i}" placeholder="C"><input id="vD${i}" placeholder="D">
    <input id="c${i}" placeholder="Düzgün (A,B,C,D)">`;
    document.getElementById('q-cont').appendChild(d);
    qQs.push(i);
};

window.saveQ = () => {
    let qs = [];
    qQs.forEach(i => {
        qs.push({
            text: document.getElementById('t'+i).value,
            point: document.getElementById('p'+i).value,
            correct: document.getElementById('c'+i).value.toUpperCase(),
            variants: { A: document.getElementById('vA'+i).value, B: document.getElementById('vB'+i).value, C: document.getElementById('vC'+i).value, D: document.getElementById('vD'+i).value }
        });
    });
    db.ref('quizzes').push({ title: document.getElementById('qt').value, time: document.getElementById('tm').value, active: false, questions: qs }).then(() => loadAdminQuizzes());
};

function loadAdminQuizzes() {
    db.ref('quizzes').on('value', snap => {
        let h = "";
        snap.forEach(c => { h += `<div style="border:1px solid #ccc; margin:10px; padding:10px;">${c.val().title} 
        <button onclick="togQ('${c.key}',${c.val().active})">${c.val().active?'Deaktiv Et':'Aktiv Et'}</button>
        <button onclick="delQ('${c.key}')" style="background:red;">Sil</button></div>`; });
        document.getElementById('adm-quiz-list').innerHTML = h;
    });
}
window.togQ = (id, s) => db.ref('quizzes/'+id).update({active: !s});
window.delQ = (id) => db.ref('quizzes/'+id).remove();

function loadAdminResults() {
    db.ref('results').on('value', snap => {
        let h = "<table><tr><th>Şagird</th><th>Bal</th><th>Sil</th></tr>";
        snap.forEach(c => { h += `<tr><td>${c.val().studentName}</td><td>${c.val().score}</td><td><button onclick="delR('${c.key}')" style="background:red;">Sil</button></td></tr>`; });
        document.getElementById('adm-res-list').innerHTML = h + "</table>";
    });
}
window.delR = (id) => db.ref('results/'+id).remove();

window.addM = () => {
    const t = document.getElementById('m-t').value, l = document.getElementById('m-l').value;
    if(t && l) db.ref('materials').push({title:t, link:l});
};

function loadAdminMaterials() {
    db.ref('materials').on('value', snap => {
        let h = "<table>";
        snap.forEach(c => { h += `<tr><td>${c.val().title}</td><td><button onclick="delM('${c.key}')" style="background:red;">Sil</button></td></tr>`; });
        document.getElementById('adm-mat-list').innerHTML = h + "</table>";
    });
}
window.delM = (id) => db.ref('materials/'+id).remove();
