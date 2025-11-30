import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function loadDailyEvents(userId, date) {
    const q = query(
        collection(db, "events"),
        where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const events = [];

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const start = data.startDateTime.toDate();
        
        const startStr = start.toISOString().split("T")[0];
        if (startStr === date) {
            events.push({
                id: docSnap.id,
                title: data.title,
                desc: data.description,
                start,
                end: data.endDateTime.toDate(),
            });
        }
    });

    renderDailyEvents(events);
}

function renderDailyEvents(events) {
    events.forEach(ev => {
        const hour = ev.start.getHours();
        const cell = document.querySelector(`.day-column[data-hour="${hour}"]`);

        if (cell) {
            const div = document.createElement("div");
            div.className = "event-block";
            div.style.padding = "4px";
            div.style.cursor = "pointer";
            div.textContent = ev.title;

            div.addEventListener("click", (e) => {
                e.stopPropagation();
                window.location.href = `edit_event.html?id=${ev.id}`;
            });

            cell.appendChild(div);
        }
    });
}
