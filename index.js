document.addEventListener('DOMContentLoaded', function () {
    const mainCard = document.getElementById('main-card');
    const aboutMeCard = document.getElementById('aboutme-card');
    const aboutMeButton = document.getElementById('aboutMeButton');
    const aboutMeGoBackButton = document.getElementById('aboutMeGoBackButton');
    const projectsCard = document.getElementById('projects-card');
    const projectsButton = document.getElementById('projectsButton');
    const projectsGoBackButton = document.getElementById('projectsGoBackButton');

    // Show main card, hide about me card by default
    if (mainCard) mainCard.style.display = 'block';
    if (aboutMeCard) aboutMeCard.style.display = 'none';

    if (aboutMeButton && mainCard && aboutMeCard) {
        aboutMeButton.addEventListener('click', function (e) {
            e.preventDefault();
            mainCard.style.display = 'none';
            aboutMeCard.style.display = 'block';
        });
    }
    if (aboutMeGoBackButton && mainCard && aboutMeCard) {
        aboutMeGoBackButton.addEventListener('click', function (e) {
            e.preventDefault();
            mainCard.style.display = 'block';
            aboutMeCard.style.display = 'none';
        });
    }
    if (projectsButton && mainCard && projectsCard) {
        projectsButton.addEventListener('click', function (e) {
            e.preventDefault();
            mainCard.style.display = 'none';
            projectsCard.style.display = 'block';
        });
    }
    if (projectsGoBackButton && mainCard && projectsCard) {
        projectsGoBackButton.addEventListener('click', function (e) {
            e.preventDefault();
            mainCard.style.display = 'block';
            projectsCard.style.display = 'none';
        });
    }
});
