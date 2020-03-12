import '../css/style.css';
import en from '../translations/en.json';
import si from '../translations/si.json';
import Banana from 'banana-i18n';

import { getLanFromUrl } from './utils';
const banana = new Banana();

banana.load({
    en,
    si,
});

const lan = getLanFromUrl();
banana.setLocale(lan);

const items = document.querySelectorAll('[data-i18n]');
items.forEach(item => {
    const translatedItem = banana.i18n(item.dataset.i18n);
    item.innerText = translatedItem;
});

const enLan = document.querySelector('.en-toggle');
const siLan = document.querySelector('.si-toggle');

if (lan == 'en') {
    enLan.classList.add('lan-toggle-selected');
} else {
    siLan.classList.add('lan-toggle-selected');
}

enLan.addEventListener('click', event => {
    window.location.href = '?lan=en';
});

siLan.addEventListener('click', event => {
    window.location.href = '?lan=si';
});
