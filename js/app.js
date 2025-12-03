import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, deleteDoc, doc, addDoc, updateDoc, getDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("User logged in:", user.email);
        updateUIForAuthState();
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
        // Guest users can view calendar pages
        currentUser = null;
        updateUIForAuthState();
        
        // Only redirect to login if trying to access create/edit pages
        if (window.location.pathname.includes('create_event.html') || 
            window.location.pathname.includes('edit_event.html')) {
            alert('Please login to create or edit events');
            window.location.href = 'login.html';
        }
        // If on a view page (monthly, weekly, daily), load events for guests
        else if (window.location.pathname.includes('monthly_view.html') ||
                 window.location.pathname.includes('weekly_view.html') ||
                 window.location.pathname.includes('daily_view.html')) {
            loadEvents();
        }
    }
});

const logoutBtn = document.getElementById('logoutBtn');
const loginBtn = document.getElementById('loginBtn');
const newEventBtn = document.getElementById('newEventBtn');
const newEventLink = document.getElementById('newEventLink');
const manageCategoriesLink = document.getElementById('manageCategoriesLink');

function updateUIForAuthState() {
    if (currentUser) {
        // Logged in user
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (newEventBtn) newEventBtn.style.display = 'inline-block';
        if (newEventLink) newEventLink.style.display = 'inline-block';
        if (manageCategoriesLink) manageCategoriesLink.style.display = 'inline-block';
    } else {
        // Guest user
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (newEventBtn) newEventBtn.style.display = 'none';
        if (newEventLink) newEventLink.style.display = 'none';
        if (manageCategoriesLink) manageCategoriesLink.style.display = 'none';
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'monthly_view.html';
        } catch (error) {
            console.error("Logout error:", error);
        }
    });
}

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
}

// Load categories for dropdowns
let categoriesCache = [];

async function loadCategoriesForDropdown() {
    if (!currentUser) return;
    
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;
    
    try {
        const q = query(collection(db, "categories"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        categoriesCache = [];
        categorySelect.innerHTML = '<option value="">Select a category...</option>';
        
        querySnapshot.forEach((doc) => {
            const category = doc.data();
            categoriesCache.push({ id: doc.id, ...category });
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = category.name;
            option.dataset.color = category.color;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

// Load categories on page load for create/edit pages
if (window.location.pathname.includes('create_event.html') || 
    window.location.pathname.includes('edit_event.html')) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            loadCategoriesForDropdown();
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
        const categoryId = document.getElementById('category').value;
        
        if (!categoryId) {
            alert('Please select a category');
            return;
        }
        
        // Get category details
        const selectedCategory = categoriesCache.find(c => c.id === categoryId);

        try {
            await addDoc(collection(db, "events"), {
                userId: currentUser.uid,
                title,
                description,
                startDateTime: Timestamp.fromDate(new Date(startDateTime)),
                endDateTime: Timestamp.fromDate(new Date(endDateTime)),
                location,
                categoryId: categoryId,
                categoryName: selectedCategory?.name || '',
                categoryColor: selectedCategory?.color || '#3b82f6'
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
        const categoryId = document.getElementById('category').value;
        
        if (!categoryId) {
            alert('Please select a category');
            return;
        }
        
        // Get category details
        const selectedCategory = categoriesCache.find(c => c.id === categoryId);

        try {
            const eventRef = doc(db, "events", eventId);
            await updateDoc(eventRef, {
                title,
                description,
                startDateTime: Timestamp.fromDate(new Date(startDateTime)),
                endDateTime: Timestamp.fromDate(new Date(endDateTime)),
                location,
                categoryId: categoryId,
                categoryName: selectedCategory?.name || '',
                categoryColor: selectedCategory?.color || '#3b82f6'
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
            
            // Set category if exists
            if (data.categoryId) {
                document.getElementById('category').value = data.categoryId;
            }
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

        div.innerHTML = `<div class="calendar-day-number">${i}</div>`;
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
    // Only load events if we are on a view page
    if (!document.getElementById('calendarGrid') && !document.getElementById('weeklyGrid') && !document.getElementById('dailyGrid')) return;

    let querySnapshot;
    
    if (currentUser) {
        // Logged-in users: show all events, but only allow editing their own
        const q = query(collection(db, "events"));
        querySnapshot = await getDocs(q);
    } else {
        // Guest users: show all events (read-only)
        const q = query(collection(db, "events"));
        querySnapshot = await getDocs(q);
    }
    
    // For monthly view, group events by date
    if (calendarGrid) {
        // First, clear all existing events from all day cells
        document.querySelectorAll('.calendar-day').forEach(cell => {
            // Remove all event-item and more-events elements
            cell.querySelectorAll('.event-item, .more-events').forEach(el => el.remove());
        });
        
        const eventsByDate = {};
        
        querySnapshot.forEach((doc) => {
            const event = doc.data();
            const eventDate = event.startDateTime.toDate().toISOString().split('T')[0];
            
            if (!eventsByDate[eventDate]) {
                eventsByDate[eventDate] = [];
            }
            
            eventsByDate[eventDate].push({
                id: doc.id,
                data: event,
                time: event.startDateTime.toDate()
            });
        });
        
        // Process each date
        Object.keys(eventsByDate).forEach(eventDate => {
            const dayCell = document.querySelector(`.calendar-day[data-date="${eventDate}"]`);
            if (!dayCell) return;
            
            // Sort events by time (earliest first)
            const sortedEvents = eventsByDate[eventDate].sort((a, b) => a.time - b.time);
            const totalEvents = sortedEvents.length;
            
            // Show only first 2 events
            const eventsToShow = sortedEvents.slice(0, 2);
            
            eventsToShow.forEach(({ id, data: event }) => {
                const isOwnEvent = currentUser && currentUser.uid === event.userId;
                const eventColor = event.categoryColor || '#3b82f6';
                
                const eventDiv = document.createElement('div');
                eventDiv.className = 'event-item';
                eventDiv.textContent = event.title;
                eventDiv.style.cursor = 'pointer';
                eventDiv.style.backgroundColor = eventColor;
                eventDiv.style.color = '#ffffff';
                eventDiv.style.border = `2px solid ${eventColor}`;
                
                eventDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showEventDetailModal(id, event, isOwnEvent);
                });
                
                dayCell.appendChild(eventDiv);
            });
            
            // Add "+N more" indicator if there are more than 2 events
            if (totalEvents > 2) {
                const moreDiv = document.createElement('div');
                moreDiv.className = 'more-events';
                moreDiv.textContent = `+${totalEvents - 2} more`;
                moreDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showAllEventsForDate(eventDate, sortedEvents);
                });
                dayCell.appendChild(moreDiv);
            }
        });
    }
    
    // Weekly & Daily View - show all events
    if (weeklyGrid || dailyGrid) {
        querySnapshot.forEach((doc) => {
            const event = doc.data();
            const eventDate = event.startDateTime.toDate().toISOString().split('T')[0];
            const eventHour = event.startDateTime.toDate().getHours();
            const isOwnEvent = currentUser && currentUser.uid === event.userId;
            const eventColor = event.categoryColor || '#3b82f6';
            
            const selector = `.day-column[data-date="${eventDate}"][data-hour="${eventHour}"]`;
            const cell = document.querySelector(selector);
            
            if (cell) {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'event-block';
                eventDiv.textContent = `${event.title}`;
                eventDiv.title = event.description || event.title;
                eventDiv.style.cursor = 'pointer';
                eventDiv.style.backgroundColor = eventColor;
                eventDiv.style.color = '#ffffff';
                eventDiv.style.border = `2px solid ${eventColor}`;
                
                eventDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showEventDetailModal(doc.id, event, isOwnEvent);
                });
                
                cell.appendChild(eventDiv);
            }
        });
    }
}

// Show all events for a specific date in a modal
function showAllEventsForDate(date, events) {
    const modal = document.getElementById('eventDetailModal');
    const modalContent = modal.querySelector('.modal-content');
    
    // Create custom content for all events view
    modalContent.innerHTML = `
        <span class="close-modal" id="closeAllEventsModal">&times;</span>
        <h3>All Events - ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
        <div style="margin-top: 1rem; max-height: 400px; overflow-y: auto;">
            ${events.map(({ id, data: event }) => {
                const isOwnEvent = currentUser && currentUser.uid === event.userId;
                const eventColor = event.categoryColor || '#3b82f6';
                const timeStr = event.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                
                return `
                    <div class="event-item" style="background-color: ${eventColor}; color: #ffffff; border: 2px solid ${eventColor}; margin-bottom: 0.5rem; cursor: pointer;" 
                         data-event-id="${id}">
                        <strong>${timeStr}</strong> - ${event.title}
                    </div>
                `;
            }).join('')}
        </div>
        <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button id="closeAllEventsBtn" class="btn secondary">Close</button>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Add event listeners
    document.getElementById('closeAllEventsModal').addEventListener('click', () => {
        modal.style.display = 'none';
        // Restore original modal content structure
        restoreModalContent();
    });
    
    document.getElementById('closeAllEventsBtn').addEventListener('click', () => {
        modal.style.display = 'none';
        restoreModalContent();
    });
    
    // Click on individual events to show details
    modalContent.querySelectorAll('.event-item[data-event-id]').forEach(item => {
        item.addEventListener('click', () => {
            const eventId = item.dataset.eventId;
            const eventData = events.find(e => e.id === eventId);
            if (eventData) {
                const isOwnEvent = currentUser && currentUser.uid === eventData.data.userId;
                showEventDetailModal(eventId, eventData.data, isOwnEvent);
            }
        });
    });
}

function restoreModalContent() {
    const modal = document.getElementById('eventDetailModal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <span class="close-modal" id="closeDetailModal">&times;</span>
        <h3 id="detailTitle">Event Details</h3>
        <div style="margin-top: 1rem;">
            <p><strong>Title:</strong> <span id="detailEventTitle"></span></p>
            <p><strong>Date & Time:</strong> <span id="detailEventDateTime"></span></p>
            <p><strong>Location:</strong> <span id="detailEventLocation"></span></p>
            <p><strong>Description:</strong></p>
            <p id="detailEventDescription" style="white-space: pre-wrap;"></p>
        </div>
        <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button id="editEventBtn" class="btn primary" style="display: none;">Edit Event</button>
            <button id="closeDetailBtn" class="btn secondary">Close</button>
        </div>
    `;
    
    // Re-attach event listeners
    const closeDetailModal = document.getElementById('closeDetailModal');
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    
    if (closeDetailModal) {
        closeDetailModal.addEventListener('click', closeEventDetailModal);
    }
    
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeEventDetailModal);
    }
}

// Event Detail Modal Logic
const eventDetailModal = document.getElementById('eventDetailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const closeDetailBtn = document.getElementById('closeDetailBtn');
const editEventBtn = document.getElementById('editEventBtn');

let currentEventId = null;

function showEventDetailModal(eventId, event, canEdit) {
    currentEventId = eventId;
    
    // Populate modal with event details
    document.getElementById('detailEventTitle').textContent = event.title;
    
    const startDate = event.startDateTime.toDate();
    const endDate = event.endDateTime.toDate();
    const dateTimeStr = `${startDate.toLocaleString()} - ${endDate.toLocaleString()}`;
    document.getElementById('detailEventDateTime').textContent = dateTimeStr;
    
    document.getElementById('detailEventLocation').textContent = event.location || 'N/A';
    document.getElementById('detailEventDescription').textContent = event.description || 'No description';
    
    // Show edit button only if user can edit
    if (canEdit) {
        editEventBtn.style.display = 'inline-block';
    } else {
        editEventBtn.style.display = 'none';
    }
    
    // Show modal
    eventDetailModal.style.display = 'flex';
}

function closeEventDetailModal() {
    eventDetailModal.style.display = 'none';
    currentEventId = null;
}

if (closeDetailModal) {
    closeDetailModal.addEventListener('click', closeEventDetailModal);
}

if (closeDetailBtn) {
    closeDetailBtn.addEventListener('click', closeEventDetailModal);
}

if (editEventBtn) {
    editEventBtn.addEventListener('click', () => {
        if (currentEventId) {
            window.location.href = `edit_event.html?id=${currentEventId}`;
        }
    });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === eventDetailModal) {
        closeEventDetailModal();
    }
});
