// pocketbase/config.js

const POCKETBASE_URL = "http://192.168.0.3:8020";

// Remova o "const" e coloque "window." antes de pb
window.pb = new PocketBase(POCKETBASE_URL);
