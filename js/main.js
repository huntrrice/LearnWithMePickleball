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
            redirect_uri: 'https://joshualevitas.github.io/zen-pickle/'
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

// YouTube channel latest videos
const CHANNEL_ID = 'LearnWithMePickleball';
const API_KEY = 'YOUR_YOUTUBE_API_KEY'; // You'll need to get this from Google Cloud Console

async function fetchLatestVideos() {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=3`
        );
        const data = await response.json();
        
        const videoGrid = document.querySelector('.video-grid');
        videoGrid.innerHTML = data.items.map(video => `
            <div class="video-container">
                <iframe 
                    src="https://www.youtube.com/embed/${video.id.videoId}"
                    title="${video.snippet.title}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
                </iframe>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching videos:', error);
    }
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', fetchLatestVideos); 

function copyCode() {
    const promoCode = document.getElementById('promoCode').innerText;
    
    // Create a temporary textarea element to copy from
    const textarea = document.createElement('textarea');
    textarea.value = promoCode;
    document.body.appendChild(textarea);
    
    // Select and copy the text
    textarea.select();
    document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textarea);
    
    // Update message
    const message = document.getElementById('copyMessage');
    message.innerText = 'Code copied!';
    
    setTimeout(() => {
        message.innerText = 'Click the code to copy';
    }, 2000);
}

// Testimonial slider logic
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.testimonial-card-stack .testimonial-card');
    const leftBtn = document.querySelector('.testimonial-arrow.left');
    const rightBtn = document.querySelector('.testimonial-arrow.right');
    let current = 0;
    function showCard(idx) {
        cards.forEach((card, i) => {
            card.style.display = (i === idx) ? '' : 'none';
        });
    }
    function prevCard() {
        current = (current - 1 + cards.length) % cards.length;
        showCard(current);
    }
    function nextCard() {
        current = (current + 1) % cards.length;
        showCard(current);
    }
    if (leftBtn && rightBtn && cards.length) {
        leftBtn.addEventListener('click', prevCard);
        rightBtn.addEventListener('click', nextCard);
        showCard(current);
        // Keyboard accessibility
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') prevCard();
            if (e.key === 'ArrowRight') nextCard();
        });
    }
});

// New Testimonial Carousel Logic
function initTestimonialCarousel() {
    const cards = document.querySelectorAll('.testimonial-carousel .testimonial-card');
    const dots = document.querySelectorAll('.testimonial-dot');
    let current = 0;
    function showCard(idx) {
        cards.forEach((card, i) => {
            card.style.display = (i === idx) ? '' : 'none';
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === idx);
        });
        current = idx;
    }
    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => showCard(idx));
    });
    showCard(0);
}
document.addEventListener('DOMContentLoaded', initTestimonialCarousel); 

// Testimonial Multi-Grid Logic
function initTestimonialMultiGrid() {
    const cards = Array.from(document.querySelectorAll('.testimonial-multigrid .testimonial-card'));
    const leftBtn = document.querySelector('.testimonial-multigrid-arrow.left');
    const rightBtn = document.querySelector('.testimonial-multigrid-arrow.right');
    let visibleCount = 3;
    function updateVisibleCount() {
        if (window.innerWidth <= 600) visibleCount = 1;
        else if (window.innerWidth <= 900) visibleCount = 2;
        else visibleCount = 3;
    }
    let start = 0;
    function showCards() {
        cards.forEach((card, i) => {
            card.classList.toggle('hidden', i < start || i >= start + visibleCount);
        });
    }
    function prev() {
        start -= visibleCount;
        if (start < 0) start = Math.max(0, cards.length - visibleCount);
        showCards();
    }
    function next() {
        start += visibleCount;
        if (start >= cards.length) start = 0;
        showCards();
    }
    function onResize() {
        const oldCount = visibleCount;
        updateVisibleCount();
        if (visibleCount !== oldCount) {
            start = 0;
        }
        showCards();
    }
    leftBtn.addEventListener('click', prev);
    rightBtn.addEventListener('click', next);
    window.addEventListener('resize', onResize);
    updateVisibleCount();
    start = 0;
    showCards();
}
document.addEventListener('DOMContentLoaded', initTestimonialMultiGrid); 