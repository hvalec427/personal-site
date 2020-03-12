export const getLanFromUrl = () => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const lan = urlParams.get('lan');
    return lan;
};
