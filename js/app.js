import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, deleteDoc, doc, addDoc, updateDoc, getDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("User logged in:", user.email);
        loadEvents(); 
        
        // If on edit page, load event details
        if (window.location.pathname.includes('edit_event.html')) {
            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get('id');
            if (eventId) {
                loadEventDetails(eventId);
            }
        }
    } else {
        // Allow access to login/signup pages without redirect loop
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html') && !window.location.pathname.includes('index.html')) {
             window.location.href = 'login.html';
        }
    }
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Logout error:", error);
        }
    });
}

// Create Event Logic
const createEventForm = document.getElementById('createEventForm');
if (createEventForm) {
    createEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const startDateTime = document.getElementById('startDateTime').value;
        const endDateTime = document.getElementById('endDateTime').value;
        const location = document.getElementById('location').value;

        try {
            await addDoc(collection(db, "events"), {
                userId: currentUser.uid,
                title,
                description,
                startDateTime: Timestamp.fromDate(new Date(startDateTime)),
                endDateTime: Timestamp.fromDate(new Date(endDateTime)),
                location
            });
            window.location.href = 'monthly_view.html';
        } catch (error) {
            console.error("Error adding event: ", error);
            alert("Error creating event");
        }
    });
}

// Edit Event Logic
const editEventForm = document.getElementById('editEventForm');
const deleteEventBtn = document.getElementById('deleteEventBtn');

if (editEventForm) {
    editEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const eventId = document.getElementById('eventId').value;
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const startDateTime = document.getElementById('startDateTime').value;
        const endDateTime = document.getElementById('endDateTime').value;
        const location = document.getElementById('location').value;

        try {
            const eventRef = doc(db, "events", eventId);
            await updateDoc(eventRef, {
                title,
                description,
                startDateTime: Timestamp.fromDate(new Date(startDateTime)),
                endDateTime: Timestamp.fromDate(new Date(endDateTime)),
                location
            });
            window.location.href = 'monthly_view.html';
        } catch (error) {
            console.error("Error updating event: ", error);
            alert("Error updating event");
        }
    });
}

if (deleteEventBtn) {
    deleteEventBtn.addEventListener('click', async () => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        
        const eventId = document.getElementById('eventId').value;
        try {
            await deleteDoc(doc(db, "events", eventId));
            window.location.href = 'monthly_view.html';
        } catch (error) {
            console.error("Error deleting event: ", error);
            alert("Error deleting event");
        }
    });
}

async function loadEventDetails(eventId) {
    try {
        const docRef = doc(db, "events", eventId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('eventId').value = eventId;
            document.getElementById('title').value = data.title;
            document.getElementById('description').value = data.description;
            
            // Format dates for datetime-local input (YYYY-MM-DDTHH:MM)
            const start = data.startDateTime.toDate();
            const end = data.endDateTime.toDate();
            
            const formatDateTime = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day}T${hours}:${minutes}`;
            };

            document.getElementById('startDateTime').value = formatDateTime(start);
            document.getElementById('endDateTime').value = formatDateTime(end);
            document.getElementById('location').value = data.location;
        } else {
            console.log("No such document!");
            alert("Event not found");
            window.location.href = 'monthly_view.html';
        }
    } catch (error) {
        console.error("Error getting event:", error);
    }
}

// Basic Calendar Rendering Logic
const calendarGrid = document.getElementById('calendarGrid');
const weeklyGrid = document.getElementById('weeklyGrid');
const dailyGrid = document.getElementById('dailyGrid');
const currentMonthElement = document.getElementById('currentMonth');
const currentWeekElement = document.getElementById('currentWeek');
const currentDayElement = document.getElementById('currentDay');

// Navigation State
let currentViewDate = new Date();

function renderCalendar(date) {
    if (!calendarGrid || !currentMonthElement) return;

    const year = date.getFullYear();
    const month = date.getMonth();
    
    currentMonthElement.textContent = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

    // Clear previous
    calendarGrid.innerHTML = '';

    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const div = document.createElement('div');
        div.className = 'calendar-day-header';
        div.textContent = day;
        calendarGrid.appendChild(div);
    });

    // Get first day of month and days in month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.style.backgroundColor = '#f9fafb';
        calendarGrid.appendChild(div);
    }

    // Days of month
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        
        // Highlight Today
        if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
            div.style.backgroundColor = '#e0f2fe'; // Light blue highlight
            div.style.border = '2px solid var(--primary-color)';
        }

        div.innerHTML = `<div style="font-weight: bold; margin-bottom: 5px;">${i}</div>`;
        div.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        // Click to go to daily view
        div.addEventListener('click', (e) => {
             if(e.target === div || e.target.parentElement === div) {
                window.location.href = `daily_view.html?date=${div.dataset.date}`;
             }
        });

        calendarGrid.appendChild(div);
    }
    // Reload events for the new view
    loadEvents();
}

function renderWeekly(date) {
    if (!weeklyGrid || !currentWeekElement) return;

    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    currentWeekElement.textContent = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
    
    weeklyGrid.innerHTML = '';
    
    // Header Row: Time + 7 Days
    const timeHeader = document.createElement('div');
    timeHeader.className = 'day-header';
    timeHeader.textContent = 'Time';
    weeklyGrid.appendChild(timeHeader);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const div = document.createElement('div');
        div.className = 'day-header';
        div.textContent = `${days[i]} ${dayDate.getDate()}`;
        weeklyGrid.appendChild(div);
    }

    // Grid Rows: 24 Hours
    for (let hour = 0; hour < 24; hour++) {
        // Time Label
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-slot';
        timeLabel.textContent = `${hour}:00`;
        weeklyGrid.appendChild(timeLabel);

        // 7 Day Columns for this hour
        for (let day = 0; day < 7; day++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + day);
            const dateStr = dayDate.toISOString().split('T')[0];
            
            const cell = document.createElement('div');
            cell.className = 'day-column';
            cell.style.borderBottom = '1px solid var(--border-color)';
            cell.dataset.date = dateStr;
            cell.dataset.hour = hour;
            weeklyGrid.appendChild(cell);
        }
    }
    loadEvents();
}

function renderDaily(date) {
    if (!dailyGrid || !currentDayElement) return;

    currentDayElement.textContent = date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    dailyGrid.innerHTML = '';

    // Header
    const timeHeader = document.createElement('div');
    timeHeader.className = 'day-header';
    timeHeader.textContent = 'Time';
    dailyGrid.appendChild(timeHeader);

    const eventHeader = document.createElement('div');
    eventHeader.className = 'day-header';
    eventHeader.textContent = 'Events';
    dailyGrid.appendChild(eventHeader);

    // 24 Hours
    for (let hour = 0; hour < 24; hour++) {
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-slot';
        timeLabel.textContent = `${hour}:00`;
        dailyGrid.appendChild(timeLabel);

        const cell = document.createElement('div');
        cell.className = 'day-column';
        cell.style.borderBottom = '1px solid var(--border-color)';
        cell.style.width = '100%';
        cell.dataset.date = date.toISOString().split('T')[0];
        cell.dataset.hour = hour;
        dailyGrid.appendChild(cell);
    }
    loadEvents();
}

// Navigation Logic
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayBtn');

if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
        currentViewDate.setMonth(currentViewDate.getMonth() - 1);
        renderCalendar(currentViewDate);
    });
}

if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
        currentViewDate.setMonth(currentViewDate.getMonth() + 1);
        renderCalendar(currentViewDate);
    });
}

if (todayBtn) {
    todayBtn.addEventListener('click', () => {
        currentViewDate = new Date();
        renderCalendar(currentViewDate);
    });
}

// Initial render
if (window.location.pathname.includes('monthly_view.html')) {
    renderCalendar(currentViewDate);
} else if (window.location.pathname.includes('weekly_view.html')) {
    renderWeekly(currentViewDate);
} else if (window.location.pathname.includes('daily_view.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    const date = dateParam ? new Date(dateParam) : currentViewDate;
    renderDaily(date);
}

async function loadEvents() {
    if (!currentUser) return;
    
    // Only load events if we are on a view page
    if (!document.getElementById('calendarGrid') && !document.getElementById('weeklyGrid') && !document.getElementById('dailyGrid')) return;

    const q = query(collection(db, "events"), where("userId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => {
        const event = doc.data();
        const eventDate = event.startDateTime.toDate().toISOString().split('T')[0];
        const eventHour = event.startDateTime.toDate().getHours();

        // Monthly View
        if (calendarGrid) {
            const dayCell = document.querySelector(`.calendar-day[data-date="${eventDate}"]`);
            if (dayCell) {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'event-item';
                eventDiv.textContent = event.title;
                eventDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.location.href = `edit_event.html?id=${doc.id}`;
                });
                dayCell.appendChild(eventDiv);
            }
        }

        // Weekly & Daily View
        if (weeklyGrid || dailyGrid) {
            // Find cell by date and hour
            // Note: This is a simple implementation that puts event in the start hour slot.
            // Does not span multiple hours visually in this grid, but lists it.
            const selector = `.day-column[data-date="${eventDate}"][data-hour="${eventHour}"]`;
            const cell = document.querySelector(selector);
            
            if (cell) {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'event-block';
                eventDiv.textContent = `${event.title}`;
                eventDiv.title = event.description || event.title;
                eventDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.location.href = `edit_event.html?id=${doc.id}`;
                });
                cell.appendChild(eventDiv);
            }
        }
    });
}
