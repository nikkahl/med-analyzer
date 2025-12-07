
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');

showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});


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
            let tokenToSave = null;
            
            if (data.token && typeof data.token === 'string') {
                tokenToSave = data.token;
            } 
            else if (data.data && data.data.token && typeof data.data.token === 'string') {
                tokenToSave = data.data.token;
            }

            if (tokenToSave) {
                localStorage.setItem('token', tokenToSave);
                localStorage.setItem('userEmail', email); 
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 300);

            } else {
                console.error('⛔ ПОМИЛКА: Сервер не надіслав токен у відповіді!', data);
                alert('Помилка входу: Сервер не надав ключ доступу. Спробуйте пізніше.');
            }

        } else {
            alert(data.message || 'Помилка входу');
        }
    } catch (err) {
        console.error('⛔ Помилка мережі або сервера:', err);
        alert('Щось пішло не так. Перевірте з\'єднання.');
    }
});


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
             let tokenToSave = null;
             if (data.token && typeof data.token === 'string') {
                 tokenToSave = data.token;
             } else if (data.data && data.data.token && typeof data.data.token === 'string') {
                 tokenToSave = data.data.token;
             }
 
             if (tokenToSave) {
                localStorage.setItem('token', tokenToSave);
                localStorage.setItem('userEmail', email);
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 300);
             } else {
                console.error('⛔ ПОМИЛКА РЕЄСТРАЦІЇ: Немає токена!', data);
                alert('Реєстрація успішна, але виникла помилка авторитації. Спробуйте увійти.');
             }
        } else {
            alert(data.message || 'Помилка реєстрації');
        }
    } catch (err) {
        console.error('⛔ Помилка сервера:', err);
        alert('Помилка сервера');
    }
});