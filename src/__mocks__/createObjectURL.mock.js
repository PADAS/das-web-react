import jest from 'jest';

window.URL.createObjectURL = () => {};
window.matchMedia = jest.fn();