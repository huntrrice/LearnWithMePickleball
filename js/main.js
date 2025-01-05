// Add your custom JavaScript here
document.querySelector('.waffle-menu').addEventListener('click', function() {
    this.classList.toggle('active');
    document.querySelector('.side-menu').classList.toggle('open');
});

let isTransitioning = false;

window.addEventListener('wheel', function(e) {
    if (!isTransitioning) {
        const contentSection = document.querySelector('.content-section');
        const scrollIndicator = document.querySelector('.scroll-indicator');
        
        if (e.deltaY > 0) { // Scrolling down
            contentSection.classList.add('visible');
            scrollIndicator.classList.add('hidden');
        } else if (e.deltaY < 0 && window.scrollY === 0) { // Scrolling up at top
            contentSection.classList.remove('visible');
            scrollIndicator.classList.remove('hidden');
        }
        
        isTransitioning = true;
        setTimeout(() => {
            isTransitioning = false;
        }, 800); // Match transition duration
    }
});

// Also handle touch events for mobile
let touchStartY = 0;
window.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
});

window.addEventListener('touchmove', function(e) {
    if (!isTransitioning) {
        const contentSection = document.querySelector('.content-section');
        const scrollIndicator = document.querySelector('.scroll-indicator');
        const touchDiff = touchStartY - e.touches[0].clientY;
        
        if (touchDiff > 0) { // Swiping up
            contentSection.classList.add('visible');
            scrollIndicator.classList.add('hidden');
        } else if (touchDiff < 0 && window.scrollY === 0) { // Swiping down at top
            contentSection.classList.remove('visible');
            scrollIndicator.classList.remove('hidden');
        }
        
        isTransitioning = true;
        setTimeout(() => {
            isTransitioning = false;
        }, 800);
    }
});

// Scroll animation
window.addEventListener('scroll', function() {
    const contentSection = document.querySelector('.content-section');
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;

    if (scrollPosition > windowHeight * 0.1) { // Start transition very early in scroll
        contentSection.classList.add('visible');
    }
});

// Google Sign-In
function onSignIn(googleUser) {
    const profile = googleUser.getBasicProfile();
    document.getElementById('user-info').style.display = 'flex';
    document.getElementById('user-image').src = profile.getImageUrl();
    document.getElementById('user-name').textContent = profile.getName();
    document.querySelector('.g-signin2').style.display = 'none';
}

function signOut() {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(() => {
        document.getElementById('user-info').style.display = 'none';
        document.querySelector('.g-signin2').style.display = 'block';
    });
}

// Calendar Initialization with Google Calendar Integration
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Google API client
    gapi.load('client:auth2', function() {
        gapi.client.init({
            apiKey: 'AIzaSyC09_0iJn3d5tF1HPU-o8IN5MDwjiOy0k8',
            clientId: '647888274471-qi6tukmnldfhb70iqt42arvk054ptu7s.apps.googleusercontent.com',
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            scope: 'https://www.googleapis.com/auth/calendar.events',
            redirect_uri: 'https://<your-username>.github.io/<repo-name>'
        }).then(function() {
            // Initialize calendar after Google API is loaded
            initializeCalendar();
        });
    });
});

function initializeCalendar() {
    const calendarEl = document.getElementById('booking-calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        slotMinTime: '08:00:00',
        slotMaxTime: '20:00:00',
        selectable: true,
        selectMirror: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay'
        },
        
        // Event Handling
        select: function(info) {
            // Check if user is signed in
            if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
                showBookingForm(info);
            } else {
                showLoginPrompt();
            }
        },
        
        // Google Calendar Integration
        googleCalendarApiKey: 'AIzaSyC09_0iJn3d5tF1HPU-o8IN5MDwjiOy0k8',
        events: {
            googleCalendarId: 'ff31d948fd6f7fdc79061853a71487cfdf6764516172e2e9c8f35b876ccb2cc1@group.calendar.google.com',
            className: 'gcal-event'
        }
    });
    
    calendar.render();
}

// UI Helper Functions
function showLoadingState() {
    const calendar = document.getElementById('booking-calendar');
    calendar.classList.add('loading');
    const loader = document.createElement('div');
    loader.className = 'calendar-loader';
    loader.innerHTML = '<div class="spinner"></div>';
    calendar.appendChild(loader);
}

function hideLoadingState() {
    const calendar = document.getElementById('booking-calendar');
    calendar.classList.remove('loading');
    const loader = calendar.querySelector('.calendar-loader');
    if (loader) loader.remove();
}

function showErrorMessage(message) {
    const container = document.querySelector('.booking-section .container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showLoginPrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'login-prompt';
    prompt.innerHTML = `
        <div class="login-prompt-content">
            <h3>Please Sign In</h3>
            <p>You need to sign in to book a session.</p>
            <button onclick="this.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(prompt);
}

// Booking Form Handling
async function handleBookingSubmission(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        showLoadingState();
        
        // Create Google Calendar event
        const event = {
            'summary': `Zen Pickle - ${formData.get('session-type')}`,
            'start': {
                'dateTime': formData.get('session-time'),
                'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            'end': {
                'dateTime': calculateEndTime(formData.get('session-time'), formData.get('session-type')),
                'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
        
        await createCalendarEvent(event);
        
        showSuccessMessage('Booking confirmed! Check your email for details.');
        form.reset();
        document.getElementById('booking-form').style.display = 'none';
        
    } catch (error) {
        showErrorMessage('Failed to book session. Please try again.');
        console.error('Booking error:', error);
    } finally {
        hideLoadingState();
    }
}

function showBookingForm(info) {
    const bookingForm = document.getElementById('booking-form');
    const sessionTime = document.getElementById('session-time');
    sessionTime.value = info.startStr;
    bookingForm.style.display = 'block';
}

// Handle booking form submission
document.getElementById('session-form').addEventListener('submit', handleBookingSubmission); 