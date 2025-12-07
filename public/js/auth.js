// ==========================================
// 1. ПЕРЕВІРКА АВТОРИЗАЦІЇ ПРИ ЗАВАНТАЖЕННІ
// ==========================================

if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
}

// ==========================================
// 2. DOM
// ==========================================

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');

// ==========================================
// 3. ПЕРЕМИКАННЯ МІЖ ВХОДОМ І РЕЄСТРАЦІЄЮ
// ==========================================

if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });
}

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });
}

// ==========================================
// 4. ЛОГІКА ВХОДУ (LOGIN)
// ==========================================

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                let tokenToSave = data.token || (data.data && data.data.token);

                if (tokenToSave) {
                    localStorage.setItem('token', tokenToSave);
                    localStorage.setItem('userEmail', email);
                    
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Помилка: Сервер не надіслав токен.');
                }
            } else {
                alert(data.message || 'Помилка входу');
            }
        } catch (err) {
            console.error('Login error:', err);
            alert('Помилка з\'єднання з сервером');
        }
    });
}

// ==========================================
// 5. REGISTER
// ==========================================

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

        if (res.ok) {
                let tokenToSave = data.token || (data.data && data.data.token);

                if (tokenToSave) {
                    localStorage.setItem('token', tokenToSave);
                    localStorage.setItem('userEmail', email);
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Реєстрація успішна! Будь ласка, увійдіть.');
                    registerForm.classList.add('hidden');
                    loginForm.classList.remove('hidden');
                }
            } else {
                alert(data.message || 'Помилка реєстрації');
            }
        } catch (err) {
            console.error('Register error:', err);
            alert('Помилка з\'єднання з сервером');
        }
    });
}