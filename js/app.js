import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    collection, query, where, getDocs, deleteDoc, doc,
    addDoc, updateDoc, getDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { loadDailyEvents } from "./daily-events.js";

let currentUser = null;

// Toast
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Notification write
async function addNotificationRecord(type, eventId, title) {
    if (!currentUser) return;
    await addDoc(collection(db, "notifications"), {
        userId: currentUser.uid,
        type,
        eventId,
        title,
        timestamp: Timestamp.now()
    });
}

// Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadEvents();

        if (window.location.pathname.includes("edit_event.html")) {
            const eventId = new URLSearchParams(window.location.search).get("id");
            if (eventId) loadEventDetails(eventId);
        }
    } else {
        if (!window.location.pathname.includes("login.html") &&
            !window.location.pathname.includes("signup.html") &&
            !window.location.pathname.includes("index.html")) {
            window.location.href = "login.html";
        }
    }
});

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "login.html";
    });
}

// Create Event
const createEventForm = document.getElementById("createEventForm");
if (createEventForm) {
    createEventForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const data = {
            userId: currentUser.uid,
            title: title.value,
            description: description.value,
            startDateTime: Timestamp.fromDate(new Date(startDateTime.value)),
            endDateTime: Timestamp.fromDate(new Date(endDateTime.value)),
            location: location.value
        };

        const docRef = await addDoc(collection(db, "events"), data);
        showToast("Event created");
        await addNotificationRecord("create", docRef.id, data.title);
        window.location.href = "monthly_view.html";
    });
}

// Edit Event
const editEventForm = document.getElementById("editEventForm");
const deleteEventBtn = document.getElementById("deleteEventBtn");

if (editEventForm) {
    editEventForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const eventId = eventIdInput.value;

        await updateDoc(doc(db, "events", eventId), {
            title: title.value,
            description: description.value,
            startDateTime: Timestamp.fromDate(new Date(startDateTime.value)),
            endDateTime: Timestamp.fromDate(new Date(endDateTime.value)),
            location: location.value
        });

        window.location.href = "monthly_view.html";
    });
}

if (deleteEventBtn) {
    deleteEventBtn.addEventListener("click", async () => {
        const eventId = eventIdInput.value;
        if (!confirm("Delete this event?")) return;

        await deleteDoc(doc(db, "events", eventId));
        window.location.href = "monthly_view.html";
    });
}

// Load Single Event for Edit Page
async function loadEventDetails(eventId) {
    const docSnap = await getDoc(doc(db, "events", eventId));
    if (!docSnap.exists()) {
        alert("Event not found");
        return window.location.href = "monthly_view.html";
    }

    const data = docSnap.data();
    eventIdInput.value = eventId;
    title.value = data.title;
    description.value = data.description;
    location.value = data.location;

    const format = (d) => d.toISOString().slice(0, 16);
    startDateTime.value = format(data.startDateTime.toDate());
    endDateTime.value = format(data.endDateTime.toDate());
}

// Page Grid refs
const calendarGrid = document.getElementById("calendarGrid");
const weeklyGrid = document.getElementById("weeklyGrid");
const dailyGrid = document.getElementById("dailyGrid");
const currentMonthElement = document.getElementById("currentMonth");
const currentWeekElement = document.getElementById("currentWeek");
const currentDayElement = document.getElementById("currentDay");

// Calendar Rendering — (Tidak diubah)
const today = new Date();

// Initial page detect & render
if (window.location.pathname.includes("monthly_view.html")) {
    renderCalendar(today);
}
if (window.location.pathname.includes("weekly_view.html")) {
    renderWeekly(today);
}
if (window.location.pathname.includes("daily_view.html")) {
    const date = new URLSearchParams(window.location.search).get("date");
    renderDaily(date ? new Date(date) : today);
    setTimeout(() => {
        loadDailyEvents(currentUser.uid, (date || today.toISOString()).split("T")[0]);
    }, 500);
}

// Load Events for All Views
async function loadEvents() {
    if (!currentUser) return;

    const q = query(collection(db, "events"), where("userId", "==", currentUser.uid));
    const snapshot = await getDocs(q);

    snapshot.forEach((docSnap) => {
        const event = { id: docSnap.id, ...docSnap.data() };
        const dateStr = event.startDateTime.toDate().toISOString().split("T")[0];
        const hour = event.startDateTime.toDate().getHours();

        // Monthly View
        const dayCell = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
        if (dayCell) {
            const div = document.createElement("div");
            div.className = "event-item";
            div.textContent = event.title;
            div.onclick = (e) => {
                e.stopPropagation();
                location.href = `edit_event.html?id=${event.id}`;
            };
            dayCell.appendChild(div);
        }

        // Weekly/Daily View
        const block = document.querySelector(`.day-column[data-date="${dateStr}"][data-hour="${hour}"]`);
        if (block) {
            const div = document.createElement("div");
            div.className = "event-block";
            div.textContent = event.title;
            div.onclick = () => location.href = `edit_event.html?id=${event.id}`;
            block.appendChild(div);
        }
    });
}
