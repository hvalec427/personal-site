document.addEventListener('DOMContentLoaded', function () {
    const mainCard = document.getElementById('main-card');
    const aboutMeCard = document.getElementById('aboutme-card');
    const aboutMeButton = document.getElementById('aboutMeButton');
    const aboutMeGoBackButton = document.getElementById('aboutMeGoBackButton');
    const projectsCard = document.getElementById('projects-card');
    const projectsButton = document.getElementById('projectsButton');
    const projectsGoBackButton = document.getElementById('projectsGoBackButton');

    function showCard(card) {
        if (mainCard) mainCard.style.display = 'none';
        if (aboutMeCard) aboutMeCard.style.display = 'none';
        if (projectsCard) projectsCard.style.display = 'none';
        if (card) card.style.display = 'block';
    }

    function updateCardFromHash() {
        if (location.hash === '#about-me') {
            showCard(aboutMeCard);
        } else if (location.hash === '#projects') {
            showCard(projectsCard);
        } else {
            showCard(mainCard);
        }
    }
    updateCardFromHash();

    if (aboutMeButton) {
        aboutMeButton.addEventListener('click', function (e) {
            e.preventDefault();
            history.pushState(null, '', '#about-me');
            showCard(aboutMeCard);
        });
    }
    if (aboutMeGoBackButton) {
        aboutMeGoBackButton.addEventListener('click', function (e) {
            e.preventDefault();
            history.pushState(null, '', location.pathname);
            showCard(mainCard);
        });
    }
    if (projectsButton) {
        projectsButton.addEventListener('click', function (e) {
            e.preventDefault();
            history.pushState(null, '', '#projects');
            showCard(projectsCard);
        });
    }
    if (projectsGoBackButton) {
        projectsGoBackButton.addEventListener('click', function (e) {
            e.preventDefault();
            history.pushState(null, '', location.pathname);
            showCard(mainCard);
        });
    }

    window.addEventListener('popstate', updateCardFromHash);
    window.addEventListener('hashchange', updateCardFromHash);
});
