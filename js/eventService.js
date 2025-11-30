import { db } from "./firebase-config.js";
import {
    collection,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// CREATE
export async function createEvent(eventData) {
    return await addDoc(collection(db, "events"), eventData);
}

// READ SINGLE EVENT
export async function getEvent(id) {
    const ref = doc(db, "events", id);
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data() };
}

// UPDATE
export async function updateEvent(id, updatedData) {
    const ref = doc(db, "events", id);
    return await updateDoc(ref, updatedData);
}

// DELETE
export async function deleteEventById(id) {
    const ref = doc(db, "events", id);
    await deleteDoc(ref);
}
