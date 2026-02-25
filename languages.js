const translations = {
    az: {
        welcome: "Nərminə Əmirbəyovanın sınaq portalı",
        login: "Giriş et",
        adminLogin: "Müəllim Girişi",
        username: "İstifadəçi adınız",
        pass: "Parolunuzu daxil edin",
        startQuiz: "Sınağa Başla",
        timer: "Qalan vaxt",
        finish: "İmtahanı Bitir"
    },
    ru: {
        welcome: "Тестовый портал Нармины Амирбековой",
        login: "Войти",
        adminLogin: "Вход для учителя",
        username: "Имя пользователя",
        pass: "Введите пароль",
        startQuiz: "Начать тест",
        timer: "Оставшееся время",
        finish: "Завершить экзамен"
    }
};

let currentLang = localStorage.getItem('siteLang') || 'az';
