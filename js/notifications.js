import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUser = null;
let notificationPermission = false;
let notificationCheckInterval = null;

// Alert time mappings (in milliseconds)
const ALERT_TIMES = {
    'none': 0,
    'at_time': 0,
    '5min': 5 * 60 * 1000,
    '10min': 10 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    '1hour': 60 * 60 * 1000,
    '2hours': 2 * 60 * 60 * 1000,
    '1day': 24 * 60 * 60 * 1000,
    '2days': 2 * 24 * 60 * 60 * 1000,
    '1week': 7 * 24 * 60 * 60 * 1000
};

// Request notification permission
async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
        return false;
    }

    if (Notification.permission === "granted") {
        notificationPermission = true;
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        notificationPermission = permission === "granted";
        return notificationPermission;
    }

    return false;
}

// Show browser notification
function showNotification(title, body, eventData) {
    if (!notificationPermission) return;

    const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: eventData.id,
        requireInteraction: false,
        silent: false
    });

    notification.onclick = function() {
        window.focus();
        // Could navigate to event detail here
        notification.close();
    };
}

// Get alert time label
function getAlertTimeLabel(alertTime) {
    const labels = {
        'none': 'No alert',
        'at_time': 'At time of event',
        '5min': '5 minutes before',
        '10min': '10 minutes before',
        '15min': '15 minutes before',
        '30min': '30 minutes before',
        '1hour': '1 hour before',
        '2hours': '2 hours before',
        '1day': '1 day before',
        '2days': '2 days before',
        '1week': '1 week before'
    };
    return labels[alertTime] || 'No alert';
}

// Check for upcoming events and show notifications
async function checkUpcomingEvents() {
    if (!notificationPermission) return;

    const { db } = await import('./firebase-config.js');
    const { collection, query, where, getDocs, Timestamp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    const now = new Date();
    const pastTime = new Date(now.getTime() - 5 * 60 * 1000); // Look back 5 minutes
    const futureTime = new Date(now.getTime() + 2 * 60 * 1000); // Check 2 minutes ahead

    try {
        // Query ALL events with alerts enabled (for both guests and logged-in users)
        const q = query(
            collection(db, "events"),
            where("alertEnabled", "==", true)
        );
        
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            const event = doc.data();
            const eventTime = event.startDateTime.toDate();
            const alertOffset = ALERT_TIMES[event.alertTime] || 0;
            const alertTime = new Date(eventTime.getTime() - alertOffset);
            
            // Check if alert time is within the window (5 minutes past to 2 minutes future)
            if (alertTime >= pastTime && alertTime <= futureTime) {
                // Check if we haven't already shown this notification
                const notificationKey = `notified_${doc.id}_${event.alertTime}`;
                if (!sessionStorage.getItem(notificationKey)) {
                    const timeLabel = getAlertTimeLabel(event.alertTime);
                    const eventTimeStr = eventTime.toLocaleString();
                    
                    showNotification(
                        `Event Reminder: ${event.title}`,
                        `${timeLabel}\nEvent time: ${eventTimeStr}\n${event.description || ''}`,
                        { id: doc.id, ...event }
                    );
                    
                    // Mark as notified
                    sessionStorage.setItem(notificationKey, 'true');
                }
            }
        });
    } catch (error) {
        console.error("Error checking upcoming events:", error);
    }
}

// Initialize notification system
async function initializeNotifications() {
    const hasPermission = await requestNotificationPermission();
    
    if (hasPermission) {
        // Check immediately
        checkUpcomingEvents();
        
        // Check every minute (works for both logged-in and guest users)
        if (notificationCheckInterval) {
            clearInterval(notificationCheckInterval);
        }
        notificationCheckInterval = setInterval(checkUpcomingEvents, 60 * 1000);
    }
}

// Stop notification checking
function stopNotifications() {
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
        notificationCheckInterval = null;
    }
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    
    // Initialize notifications for everyone (logged-in users and guests)
    // This allows the secretary/boss to get notifications even when not logged in
    initializeNotifications();
});

// Export functions for use in other modules
export {
    requestNotificationPermission,
    showNotification,
    getAlertTimeLabel,
    checkUpcomingEvents,
    initializeNotifications,
    stopNotifications
};
