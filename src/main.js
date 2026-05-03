import { createStore } from './state/store.js';
import { initialState } from './state/initialState.js';
import { mountApp } from './components/App.js';

const root = document.getElementById('app');
const store = createStore(initialState);

mountApp(root, store);
