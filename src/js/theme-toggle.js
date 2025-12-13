function generateNewTheme() {
  const hue = Math.floor(Math.random() * 360);
  const complementaryHue = (hue + 120 + Math.random() * 120 - 60) % 360;

  const baseSat = 15 + Math.random() * 50;
  const highlightSat = 60 + Math.random() * 40;

  const themeTypes = ['warm', 'cool', 'neutral', 'vibrant', 'pastel'];
  const themeType = themeTypes[Math.floor(Math.random() * themeTypes.length)];
  const mode = Math.random() < 0.6 ? 'light' : 'dark';

  let colors = {};

  if (mode === 'light') {
    const bgLightness = 92 + Math.random() * 6;
    const surfaceLightness = bgLightness - 4 - Math.random() * 8;
    const primaryLightness = 8 + Math.random() * 16;
    const secondaryLightness = 35 + Math.random() * 20;
    const highlightLightness = 35 + Math.random() * 25;

    colors = {
      '--background': `hsl(${hue}, ${Math.min(
        baseSat * 0.4,
        25
      )}%, ${bgLightness}%)`,
      '--surface': `hsl(${hue}, ${baseSat * 0.8}%, ${surfaceLightness}%)`,
      '--primary': `hsl(${hue}, ${baseSat * 0.9}%, ${primaryLightness}%)`,
      '--secondary': `hsl(${hue}, ${baseSat * 0.5}%, ${secondaryLightness}%)`,
      '--highlight': `hsl(${complementaryHue}, ${highlightSat}%, ${highlightLightness}%)`,
    };
  } else {
    const bgLightness = 6 + Math.random() * 12;
    const surfaceLightness = bgLightness + 6 + Math.random() * 10;
    const primaryLightness = 85 + Math.random() * 12;
    const secondaryLightness = 60 + Math.random() * 20;
    const highlightLightness = 50 + Math.random() * 25;

    colors = {
      '--background': `hsl(${hue}, ${baseSat}%, ${bgLightness}%)`,
      '--surface': `hsl(${hue}, ${baseSat * 1.2}%, ${surfaceLightness}%)`,
      '--primary': `hsl(${hue}, ${baseSat * 0.6}%, ${primaryLightness}%)`,
      '--secondary': `hsl(${hue}, ${baseSat * 0.4}%, ${secondaryLightness}%)`,
      '--highlight': `hsl(${complementaryHue}, ${highlightSat}%, ${highlightLightness}%)`,
    };
  }

  (function addPrimaryVariant() {
    const primary = colors['--primary'];
    const m = primary.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
    if (m) {
      const h = Number(m[1]);
      const s = Number(m[2]);
      const l = Number(m[3]);

      const hueShift = Math.floor(Math.random() * 17) - 8;
      const satShift = Math.floor(Math.random() * 9) - 4;
      const lightShift = Math.floor(Math.random() * 9) - 4;
      const vh = (h + hueShift + 360) % 360;
      const vs = Math.max(0, Math.min(100, s + satShift));
      const vl = Math.max(0, Math.min(100, l + lightShift));
      colors['--primary-variant'] = `hsl(${vh}, ${vs}%, ${vl}%)`;
    } else {
      colors['--primary-variant'] = colors['--primary'];
    }
  })();

  if (themeType === 'vibrant') {
    colors['--highlight'] = `hsl(${complementaryHue}, ${
      85 + Math.random() * 15
    }%, ${mode === 'light' ? 45 : 65}%)`;
  } else if (themeType === 'pastel') {
    Object.keys(colors).forEach(key => {
      if (key !== '--background') {
        const match = colors[key].match(/hsl\((\d+), (\d+)%, (\d+)%\)/);
        if (match) {
          const [, h, s, l] = match;
          colors[key] = `hsl(${h}, ${Math.min(parseInt(s) * 0.7, 40)}%, ${l}%)`;
        }
      }
    });
  }

  return colors;
}

function applyTheme(colors) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

function clearCustomTheme() {
  const root = document.documentElement;
  root.style.removeProperty('--background');
  root.style.removeProperty('--surface');
  root.style.removeProperty('--primary');
  root.style.removeProperty('--secondary');
  root.style.removeProperty('--highlight');
  root.style.removeProperty('--primary-variant');
  localStorage.removeItem('customTheme');
}

function toggleTheme() {
  const root = document.documentElement;
  const currentTheme = root.getAttribute('data-theme');
  const button = document.querySelector('.theme-toggle');

  if (button) {
    clearCustomTheme();

    if (currentTheme === 'dark') {
      root.setAttribute('data-theme', 'light');
      button.textContent = '🌙';
      localStorage.setItem('theme', 'light');
    } else {
      root.setAttribute('data-theme', 'dark');
      button.textContent = '☀️';
      localStorage.setItem('theme', 'dark');
    }

    showRandomThemeButton();
  }
}

window.toggleTheme = toggleTheme;

function randomTheme() {
  const newTheme = generateNewTheme();
  const root = document.documentElement;

  if (root) {
    root.removeAttribute('data-theme');
    applyTheme(newTheme);

    localStorage.setItem('customTheme', JSON.stringify(newTheme));
    localStorage.removeItem('theme');
  }
}

window.randomTheme = randomTheme;

function showRandomThemeButton() {
  let randomThemeButton = document.querySelector('.random-theme-button');
  if (!randomThemeButton) {
    randomThemeButton = document.createElement('button');
    randomThemeButton.className = 'random-theme-button';
    randomThemeButton.textContent = 'surprise me';
    randomThemeButton.onclick = randomTheme;
    const headerButtons = document.querySelector('.header-buttons');
    if (headerButtons) {
      headerButtons.appendChild(randomThemeButton);
    } else {
      document.body.appendChild(randomThemeButton);
    }
  }
  randomThemeButton.style.opacity = '1';
  randomThemeButton.style.transform = 'translateX(0)';
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const customTheme = localStorage.getItem('customTheme');
  const button = document.querySelector('.theme-toggle');
  const root = document.documentElement;

  if (button) {
    if (customTheme) {
      const colors = JSON.parse(customTheme);
      applyTheme(colors);
    }

    if (savedTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      button.textContent = '☀️';
    } else {
      root.setAttribute('data-theme', 'light');
      button.textContent = '🌙';
    }

    button.addEventListener('mouseenter', showRandomThemeButton);
  }
}
document.addEventListener('DOMContentLoaded', initializeTheme);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
  initializeTheme();
}
