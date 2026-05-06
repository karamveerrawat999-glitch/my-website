import { login, signup, logout, getUser, handleAuthCallback, AuthError, MissingIdentityError } from 'https://esm.sh/@netlify/identity';

function showMessage() {
    alert("Welcome to my website!");
}
window.showMessage = showMessage;

const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const authModal = document.getElementById('auth-modal');
const closeAuth = document.getElementById('close-auth');
const submitAuth = document.getElementById('submit-auth');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authName = document.getElementById('auth-name');
const authTitle = document.getElementById('auth-title');
const authError = document.getElementById('auth-error');
const authSuccess = document.getElementById('auth-success');

let authMode = 'login'; // 'login' or 'signup'

function updateUI() {
    getUser().then(user => {
        if (user) {
            userInfo.textContent = `Hello, ${user.user_metadata?.full_name || user.email}`;
            loginBtn.style.display = 'none';
            signupBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
        } else {
            userInfo.textContent = '';
            loginBtn.style.display = 'inline-block';
            signupBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        }
    });
}

function openModal(mode) {
    authMode = mode;
    authTitle.textContent = mode === 'login' ? 'Log In' : 'Sign Up';
    authName.style.display = mode === 'signup' ? 'block' : 'none';
    authError.style.display = 'none';
    authSuccess.style.display = 'none';
    authEmail.value = '';
    authPassword.value = '';
    authName.value = '';
    authModal.style.display = 'flex';
}

function closeModal() {
    authModal.style.display = 'none';
}

loginBtn.addEventListener('click', () => openModal('login'));
signupBtn.addEventListener('click', () => openModal('signup'));
closeAuth.addEventListener('click', closeModal);

logoutBtn.addEventListener('click', async () => {
    try {
        await logout();
        updateUI();
    } catch (e) {
        console.error('Logout error', e);
    }
});

submitAuth.addEventListener('click', async () => {
    const email = authEmail.value;
    const password = authPassword.value;
    const name = authName.value;

    authError.style.display = 'none';
    authSuccess.style.display = 'none';

    try {
        if (authMode === 'login') {
            await login(email, password);
            closeModal();
            updateUI();
        } else {
            const user = await signup(email, password, { full_name: name });
            if (user.emailVerified) {
                closeModal();
                updateUI();
            } else {
                authSuccess.textContent = 'Check your email to confirm your account.';
                authSuccess.style.display = 'block';
            }
        }
    } catch (error) {
        authError.style.display = 'block';
        if (error instanceof MissingIdentityError) {
            authError.textContent = 'Identity is not enabled on this site.';
        } else if (error instanceof AuthError) {
            if (error.status === 401) authError.textContent = 'Invalid email or password.';
            else if (error.status === 403) authError.textContent = 'Signups are not allowed.';
            else if (error.status === 422) authError.textContent = 'Invalid input (weak password or malformed email).';
            else authError.textContent = error.message;
        } else {
            authError.textContent = 'An error occurred.';
            console.error(error);
        }
    }
});

async function processCallback() {
    try {
        const result = await handleAuthCallback();
        if (!result) return;
        if (result.type === 'confirmation') {
            alert('Email confirmed. You are now logged in.');
            updateUI();
        }
    } catch (error) {
        console.error('Auth callback error', error);
    }
}

// Initialization
processCallback();
updateUI();


// Subscribe form handler
const subscribeForm = document.querySelector('form[name="subscribe"]');
if (subscribeForm) {
    subscribeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Form needs hidden form-name field for AJAX, let's inject it if not present
        let formData = new FormData(subscribeForm);
        formData.append('form-name', 'subscribe');

        try {
            const response = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            });

            if (response.ok) {
                alert('Thank you for subscribing!');
                subscribeForm.reset();
            } else {
                alert('Oops! There was a problem submitting your form.');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            alert('Oops! There was a problem submitting your form.');
        }
    });
}
