// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.backdropFilter = 'blur(10px)';
    } else {
        navbar.style.background = '#fff';
        navbar.style.backdropFilter = 'none';
    }
});

// Search functionality
const searchBtn = document.querySelector('.search-btn');
const searchInput = document.querySelector('.search-input');
const locationInput = document.querySelector('.location-input');

searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim();
    const location = locationInput.value.trim();
    
    if (searchTerm) {
        // Here you would typically send the search to your backend
        console.log(`Searching for: ${searchTerm} in ${location || 'all locations'}`);
        alert(`Suche nach "${searchTerm}" ${location ? `in ${location}` : 'in allen Orten'}`);
    } else {
        alert('Bitte geben Sie einen Suchbegriff ein.');
    }
});

// Enter key support for search
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// Category card click handlers
document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
        const categoryName = card.querySelector('h3').textContent;
        console.log(`Category clicked: ${categoryName}`);
        alert(`Kategorie "${categoryName}" ausgewählt`);
    });
});

// Item card click handlers
document.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
        const itemName = card.querySelector('h3').textContent;
        console.log(`Item clicked: ${itemName}`);
        alert(`Artikel "${itemName}" ausgewählt`);
    });
});

// CTA button handlers
document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (!btn.getAttribute('href')) {
            e.preventDefault();
            const buttonText = btn.textContent.trim();
            console.log(`Button clicked: ${buttonText}`);
            
            if (buttonText.includes('registrieren') || buttonText.includes('Anmelden')) {
                alert('Registrierung/Anmeldung würde hier geöffnet werden.');
            } else if (buttonText.includes('vermieten')) {
                alert('Artikel-Vermietung würde hier geöffnet werden.');
            }
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.category-card, .item-card, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Counter animation for hero stats
const animateCounters = () => {
    const counters = document.querySelectorAll('.stat h3');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent.replace(/[^\d]/g, ''));
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                if (counter.textContent.includes('+')) {
                    counter.textContent = Math.ceil(current).toLocaleString() + '+';
                } else {
                    counter.textContent = Math.ceil(current).toLocaleString();
                }
                requestAnimationFrame(updateCounter);
            } else {
                if (counter.textContent.includes('+')) {
                    counter.textContent = target.toLocaleString() + '+';
                } else {
                    counter.textContent = target.toLocaleString();
                }
            }
        };
        
        updateCounter();
    });
};

// Trigger counter animation when hero section is visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            heroObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroSection = document.querySelector('.hero');
if (heroSection) {
    heroObserver.observe(heroSection);
}

// Form validation (for future forms)
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Local storage for user preferences
const saveUserPreference = (key, value) => {
    localStorage.setItem(`renthub_${key}`, JSON.stringify(value));
};

const getUserPreference = (key) => {
    const item = localStorage.getItem(`renthub_${key}`);
    return item ? JSON.parse(item) : null;
};

// Save search history
const saveSearchHistory = (searchTerm, location) => {
    let history = getUserPreference('search_history') || [];
    const newSearch = {
        term: searchTerm,
        location: location,
        timestamp: new Date().toISOString()
    };
    
    history.unshift(newSearch);
    history = history.slice(0, 10); // Keep only last 10 searches
    
    saveUserPreference('search_history', history);
};

// Enhanced search with history
const enhancedSearch = () => {
    const searchTerm = searchInput.value.trim();
    const location = locationInput.value.trim();
    
    if (searchTerm) {
        saveSearchHistory(searchTerm, location);
        // Perform search logic here
        console.log('Search performed and saved to history');
    }
};

// Update search button to use enhanced search
searchBtn.removeEventListener('click', searchBtn.onclick);
searchBtn.addEventListener('click', enhancedSearch);

// Lazy loading for images
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
        }
    });
});

document.querySelectorAll('img').forEach(img => {
    imageObserver.observe(img);
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
});

// Performance monitoring
window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
});

// Accessibility improvements
document.addEventListener('keydown', (e) => {
    // ESC key closes mobile menu
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Focus management for mobile menu
hamburger.addEventListener('click', () => {
    if (navMenu.classList.contains('active')) {
        // Focus first menu item when menu opens
        setTimeout(() => {
            const firstMenuItem = navMenu.querySelector('.nav-link');
            if (firstMenuItem) firstMenuItem.focus();
        }, 100);
    }
});

// Print styles trigger
window.addEventListener('beforeprint', () => {
    document.body.classList.add('printing');
});

window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing');
});

console.log('RentHub website loaded successfully!');