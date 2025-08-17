let currentLanguage = 'en';
const originalTexts = new Map();

function switchLanguage(lang) {
    currentLanguage = lang;

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(lang + '-btn').classList.add('active');

    document.querySelectorAll('[data-sl]').forEach(element => {
        if (!originalTexts.has(element)) {
            originalTexts.set(element, element.textContent);
        }

        if (lang === 'sl') {
            element.textContent = element.getAttribute('data-sl');
        } else {
            element.textContent = originalTexts.get(element);
        }
    });

    localStorage.setItem('preferredLanguage', lang);
}

document.addEventListener('DOMContentLoaded', function () {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
        switchLanguage(savedLanguage);
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
