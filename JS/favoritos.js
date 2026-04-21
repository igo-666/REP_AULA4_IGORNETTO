import {
  auth,
  db,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  signInAnonymously
} from "./firebase.js";

function localGet() {
  return JSON.parse(localStorage.getItem("favoritos")) || [];
}

function localSet(ids) {
  localStorage.setItem("favoritos", JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("favoritos:changed", { detail: { ids } }));
}

let firebaseReady = false;
let firebaseSyncStarted = false;

async function ensureAnon() {
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

async function syncFromFirebase() {
  if (firebaseSyncStarted) return;
  firebaseSyncStarted = true;

  try {
    const user = await ensureAnon();
    const snap = await getDocs(collection(db, "users", user.uid, "favoritos"));
    const ids = [];
    snap.forEach(d => ids.push(d.id));
    localSet(ids);
    firebaseReady = true;
  } catch {
    // silencioso: fica em localStorage
  }
}

// dispara sync em background no primeiro import
syncFromFirebase();

export function getFavoritos() {
  return localGet();
}

export function isFavorito(id) {
  return localGet().includes(id);
}

export function toggleFavorito(id) {
  const current = localGet();
  const exists = current.includes(id);
  const next = exists ? current.filter(x => x !== id) : [...current, id];
  localSet(next);

  // sync em background
  (async () => {
    try {
      const user = await ensureAnon();
      const ref = doc(db, "users", user.uid, "favoritos", id);
      if (exists) await deleteDoc(ref);
      else await setDoc(ref, { createdAt: Date.now() }, { merge: true });
      firebaseReady = true;
    } catch {
      // mantém localStorage se falhar
    }
  })();
}