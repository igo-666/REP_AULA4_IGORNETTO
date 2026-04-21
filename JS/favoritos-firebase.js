import {
  auth,
  db,
  doc,
  setDoc,
  getDocs,
  collection,
  signInAnonymously
} from "./firebase.js";

// Estrutura:
// users/{uid}/favoritos/{carroId} { createdAt: number }

async function ensureUser() {
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

function localGet() {
  return JSON.parse(localStorage.getItem("favoritos")) || [];
}

function localSet(ids) {
  localStorage.setItem("favoritos", JSON.stringify(ids));
}

export async function getFavoritosIds() {
  try {
    const user = await ensureUser();
    const snap = await getDocs(collection(db, "users", user.uid, "favoritos"));
    const ids = [];
    snap.forEach(d => ids.push(d.id));
    localSet(ids); // cache local
    return ids;
  } catch {
    return localGet();
  }
}

export async function isFavoritoId(carroId) {
  const ids = await getFavoritosIds();
  return ids.includes(carroId);
}

export async function toggleFavoritoId(carroId) {
  // Otimista + fallback
  const current = localGet();
  const next = current.includes(carroId)
    ? current.filter(id => id !== carroId)
    : [...current, carroId];
  localSet(next);

  try {
    const user = await ensureUser();
    const ref = doc(db, "users", user.uid, "favoritos", carroId);

    // Se estava favoritado, remover doc; se não, criar
    if (current.includes(carroId)) {
      // deleteDoc não está exportado no firebase.js? está, mas aqui evitamos import extra:
      // Workaround: marcar como removido (MVP). Depois podemos trocar para deleteDoc.
      await setDoc(ref, { removed: true, updatedAt: Date.now() }, { merge: true });
    } else {
      await setDoc(ref, { createdAt: Date.now(), removed: false }, { merge: true });
    }
  } catch {
    // mantém localStorage se falhar
  }
}

