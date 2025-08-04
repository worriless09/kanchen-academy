// Application Data
const applicationData = {
  "courses": [
    {
      "id": 1,
      "name": "UPSC CSE Foundation",
      "category": "UPSC",
      "duration": "12 months",
      "batchTiming": "Morning (9 AM - 1 PM)",
      "fee": "₹85,000",
      "features": ["Spaced Repetition Flashcards", "Previous Year Questions", "AI Revision Tools", "Mock Tests", "Current Affairs"],
      "description": "Comprehensive foundation course for UPSC Civil Services Examination"
    },
    {
      "id": 2,
      "name": "SSC CGL Complete",
      "category": "SSC",
      "duration": "8 months",
      "batchTiming": "Evening (6 PM - 9 PM)",
      "fee": "₹45,000",
      "features": ["Interactive Flashcards", "Quantitative Aptitude Focus", "English Language Mastery", "General Awareness"],
      "description": "Complete preparation package for SSC CGL examination"
    },
    {
      "id": 3,
      "name": "State PCS Comprehensive",
      "category": "State PCS",
      "duration": "10 months",
      "batchTiming": "Weekend (Sat-Sun)",
      "fee": "₹65,000",
      "features": ["State-specific Content", "Local Current Affairs", "Essay Writing", "Interview Preparation"],
      "description": "Focused preparation for State Public Service Commission examinations"
    },
    {
      "id": 4,
      "name": "SSC CHSL Foundation",
      "category": "SSC",
      "duration": "6 months",
      "batchTiming": "Morning (10 AM - 1 PM)",
      "fee": "₹35,000",
      "features": ["Basic to Advanced Coverage", "Typing Practice", "Computer Knowledge", "Mock Interviews"],
      "description": "Complete foundation course for SSC CHSL examination"
    }
  ],
  "faculty": [
    {
      "id": 1,
      "name": "Dr. Priya Sharma",
      "subject": "History & Polity",
      "experience": "15 years",
      "qualification": "PhD in Modern History, MA Political Science",
      "achievements": "500+ successful students, Former IAS Officer",
      "specialization": "Ancient & Medieval History, Indian Polity, Constitutional Law"
    },
    {
      "id": 2,
      "name": "Prof. Rajesh Kumar",
      "subject": "Geography & Environment",
      "experience": "12 years",
      "qualification": "MSc Geography, NET-JRF qualified",
      "achievements": "300+ selections, Award-winning educator",
      "specialization": "Physical Geography, Environmental Studies, Disaster Management"
    },
    {
      "id": 3,
      "name": "Ms. Anita Verma",
      "subject": "Economics & Current Affairs",
      "experience": "10 years",
      "qualification": "MA Economics, MBA Finance",
      "achievements": "250+ successful candidates, Financial Times contributor",
      "specialization": "Indian Economy, Budget Analysis, International Relations"
    },
    {
      "id": 4,
      "name": "Dr. Suresh Patel",
      "subject": "Science & Technology",
      "experience": "18 years",
      "qualification": "PhD in Chemistry, B.Tech",
      "achievements": "400+ selections, Research publications",
      "specialization": "General Science, Technology Applications, Space & Defense"
    }
  ],
  "testimonials": [
    {
      "name": "Rahul Mishra",
      "position": "IAS 2023, AIR 45",
      "image": "student1.jpg",
      "text": "Kanchen Academy's AI-powered revision tools and spaced repetition flashcards were game-changers in my preparation. The faculty's personalized attention made all the difference."
    },
    {
      "name": "Priya Singh",
      "position": "SSC CGL 2023, AIR 12",
      "image": "student2.jpg", 
      "text": "The systematic approach and regular mock tests helped me identify my weak areas. The evening batch timing was perfect for working professionals like me."
    },
    {
      "name": "Amit Joshi",
      "position": "WBCS 2023, Rank 8",
      "image": "student3.jpg",
      "text": "The state-specific content and local current affairs coverage in their State PCS course is unmatched. Highly recommend for serious aspirants."
    }
  ],
  "features": [
    {
      "title": "AI-Powered Learning",
      "description": "Personalized study paths using artificial intelligence to optimize your preparation",
      "icon": "🤖"
    },
    {
      "title": "Spaced Repetition System",
      "description": "Scientific flashcard system that adapts to your learning pace for maximum retention",
      "icon": "🧠"
    },
    {
      "title": "Previous Year Questions",
      "description": "Comprehensive database of PYQs with detailed solutions and trend analysis",
      "icon": "📚"
    },
    {
      "title": "Expert Faculty",
      "description": "Learn from experienced educators and former civil servants",
      "icon": "👨‍🏫"
    },
    {
      "title": "Live Classes",
      "description": "Interactive online and offline classes with real-time doubt resolution",
      "icon": "📹"
    },
    {
      "title": "Mock Test Series",
      "description": "Regular assessments following actual exam patterns with detailed feedback",
      "icon": "📝"
    }
  ],
  "ctaMessages": [
    "Book Your Free Trial Class Today!",
    "Start Your Success Journey Now!",
    "Claim Your Seat - Limited Batches!",
    "Get Free Demo Class - No Cost!",
    "Join 1000+ Successful Students!"
  ]
};

// DOM Elements
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const contactForm = document.getElementById('contactForm');
const successModal = document.getElementById('successModal');
const modalClose = document.getElementById('modalClose');
const modalOk = document.getElementById('modalOk');
const heroCtaMain = document.getElementById('heroCtaMain');
const heroCtaSecondary = document.getElementById('heroCtaSecondary');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    populateFeatures();
    populateCourses();
    populateFaculty();
    populateTestimonials();
    initializeCourseFilters();
    initializeContactForm();
    initializeModal();
    initializeCTAButtons();
    initializeScrollAnimations();
    initializeSmoothScrolling();
});

// Navigation Functions
function initializeNavigation() {
    navToggle.addEventListener('click', toggleMobileMenu);
    
    // Close mobile menu when clicking on nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            closeMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
}

function closeMobileMenu() {
    navMenu.classList.remove('active');
    navToggle.classList.remove('active');
}

// Content Population Functions
function populateFeatures() {
    const featuresGrid = document.getElementById('featuresGrid');
    if (!featuresGrid) return;

    featuresGrid.innerHTML = applicationData.features.map(feature => `
        <div class="feature-card scroll-animate">
            <div class="feature-icon">${feature.icon}</div>
            <h3>${feature.title}</h3>
            <p>${feature.description}</p>
        </div>
    `).join('');
}

function populateCourses() {
    const coursesGrid = document.getElementById('coursesGrid');
    if (!coursesGrid) return;

    coursesGrid.innerHTML = applicationData.courses.map(course => `
        <div class="course-card scroll-animate" data-category="${course.category}">
            <div class="course-header">
                <span class="course-category">${course.category}</span>
                <h3>${course.name}</h3>
                <p>${course.description}</p>
            </div>
            <div class="course-body">
                <div class="course-meta">
                    <div class="course-meta-item">
                        <span class="course-meta-icon">⏱️</span>
                        <div>
                            <div class="course-meta-label">Duration</div>
                            <div class="course-meta-value">${course.duration}</div>
                        </div>
                    </div>
                    <div class="course-meta-item">
                        <span class="course-meta-icon">🕒</span>
                        <div>
                            <div class="course-meta-label">Timing</div>
                            <div class="course-meta-value">${course.batchTiming}</div>
                        </div>
                    </div>
                </div>
                
                <div class="course-features">
                    <h4>Key Features:</h4>
                    <div class="features-list">
                        ${course.features.map(feature => `
                            <span class="feature-tag">${feature}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="course-price">
                    <span class="price">${course.fee}</span>
                </div>
                
                <div class="course-actions">
                    <button class="btn btn--outline" onclick="showCourseDetails(${course.id})">Learn More</button>
                    <button class="btn btn--primary" onclick="enrollCourse(${course.id})">Enroll Now</button>
                </div>
            </div>
        </div>
    `).join('');
}

function populateFaculty() {
    const facultyGrid = document.getElementById('facultyGrid');
    if (!facultyGrid) return;

    facultyGrid.innerHTML = applicationData.faculty.map(faculty => `
        <div class="faculty-card scroll-animate">
            <div class="faculty-avatar">
                ${faculty.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h3>${faculty.name}</h3>
            <div class="faculty-subject">${faculty.subject}</div>
            <div class="faculty-details">
                <p><strong>Experience:</strong> ${faculty.experience}</p>
                <p><strong>Qualification:</strong> ${faculty.qualification}</p>
                <p><strong>Specialization:</strong> ${faculty.specialization}</p>
            </div>
            <div class="faculty-achievements">
                <h4>Achievements</h4>
                <p>${faculty.achievements}</p>
            </div>
        </div>
    `).join('');
}

function populateTestimonials() {
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    if (!testimonialsGrid) return;

    testimonialsGrid.innerHTML = applicationData.testimonials.map(testimonial => `
        <div class="testimonial-card scroll-animate">
            <div class="testimonial-text">
                ${testimonial.text}
            </div>
            <div class="testimonial-author">
                <div class="testimonial-avatar">
                    ${testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div class="testimonial-info">
                    <h4>${testimonial.name}</h4>
                    <p>${testimonial.position}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Course Filter Functions
function initializeCourseFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter courses
            filterCourses(category);
        });
    });
}

function filterCourses(category) {
    const courseCards = document.querySelectorAll('.course-card');
    
    courseCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.6s ease-out';
        } else {
            card.style.display = 'none';
        }
    });
}

// Contact Form Functions
function initializeContactForm() {
    if (!contactForm) return;

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // Validate form
        if (validateForm(data)) {
            // Simulate form submission
            submitForm(data);
        }
    });
}

function validateForm(data) {
    const requiredFields = ['name', 'email', 'phone', 'interest'];
    let isValid = true;
    
    requiredFields.forEach(field => {
        const input = document.getElementById(field);
        const value = data[field];
        
        if (!value || value.trim() === '') {
            showFieldError(input, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(input);
        }
    });
    
    // Email validation
    if (data.email && !isValidEmail(data.email)) {
        showFieldError(document.getElementById('email'), 'Please enter a valid email address');
        isValid = false;
    }
    
    // Phone validation
    if (data.phone && !isValidPhone(data.phone)) {
        showFieldError(document.getElementById('phone'), 'Please enter a valid phone number');
        isValid = false;
    }
    
    return isValid;
}

function showFieldError(input, message) {
    clearFieldError(input);
    
    input.style.borderColor = 'var(--error-color)';
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.color = 'var(--error-color)';
    errorElement.style.fontSize = 'var(--font-size-xs)';
    errorElement.style.marginTop = 'var(--space-4)';
    
    input.parentNode.appendChild(errorElement);
}

function clearFieldError(input) {
    input.style.borderColor = '';
    
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function submitForm(data) {
    // Show loading state
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset form
        contactForm.reset();
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // Show success modal
        showSuccessModal();
        
        // Log form data (in real app, this would be sent to server)
        console.log('Form submitted:', data);
    }, 1500);
}

// Modal Functions
function initializeModal() {
    if (!successModal) return;

    modalClose.addEventListener('click', hideSuccessModal);
    modalOk.addEventListener('click', hideSuccessModal);
    
    // Close modal when clicking outside
    successModal.addEventListener('click', function(e) {
        if (e.target === successModal) {
            hideSuccessModal();
        }
    });
}

function showSuccessModal() {
    successModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hideSuccessModal() {
    successModal.classList.add('hidden');
    document.body.style.overflow = '';
}

// CTA Button Functions
function initializeCTAButtons() {
    let ctaIndex = 0;
    
    // Rotate CTA messages
    setInterval(() => {
        if (heroCtaMain) {
            ctaIndex = (ctaIndex + 1) % applicationData.ctaMessages.length;
            heroCtaMain.textContent = applicationData.ctaMessages[ctaIndex];
        }
    }, 5000);
    
    // Add click handlers
    if (heroCtaMain) {
        heroCtaMain.addEventListener('click', () => {
            scrollToSection('contact');
        });
    }
    
    if (heroCtaSecondary) {
        heroCtaSecondary.addEventListener('click', () => {
            scrollToSection('courses');
        });
    }
    
    // Add click handlers to all CTA buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('nav-cta') || 
            e.target.textContent.includes('Trial Class') ||
            e.target.textContent.includes('Book')) {
            scrollToSection('contact');
        }
    });
}

// Course Action Functions
function showCourseDetails(courseId) {
    const course = applicationData.courses.find(c => c.id === courseId);
    if (course) {
        alert(`Course Details:\n\nName: ${course.name}\nCategory: ${course.category}\nDuration: ${course.duration}\nTiming: ${course.batchTiming}\nFee: ${course.fee}\n\nFeatures:\n${course.features.join('\n')}\n\nDescription: ${course.description}`);
    }
}

function enrollCourse(courseId) {
    const course = applicationData.courses.find(c => c.id === courseId);
    if (course) {
        // Pre-fill contact form
        const interestSelect = document.getElementById('interest');
        const inquirySelect = document.getElementById('inquiry');
        const messageTextarea = document.getElementById('message');
        
        if (interestSelect) {
            interestSelect.value = course.category;
        }
        
        if (inquirySelect) {
            inquirySelect.value = 'course-info';
        }
        
        if (messageTextarea) {
            messageTextarea.value = `I am interested in enrolling for the ${course.name} course. Please provide more details about the enrollment process and upcoming batch schedules.`;
        }
        
        // Scroll to contact form
        scrollToSection('contact');
    }
}

// Scroll Animation Functions
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);
    
    // Observe all scroll-animate elements
    document.querySelectorAll('.scroll-animate').forEach(el => {
        observer.observe(el);
    });
}

// Smooth Scrolling Functions
function initializeSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = section.offsetTop - navbarHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        // Close mobile menu if open
        closeMobileMenu();
    }
}

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
});

// Performance Monitoring
window.addEventListener('load', function() {
    console.log('Kanchen Academy website loaded successfully');
    
    // Log performance metrics
    if (window.performance && window.performance.timing) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        console.log('Page load time:', loadTime + 'ms');
    }
});

// Accessibility Enhancements
document.addEventListener('keydown', function(e) {
    // Close modal with Escape key
    if (e.key === 'Escape' && !successModal.classList.contains('hidden')) {
        hideSuccessModal();
    }
    
    // Close mobile menu with Escape key
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        closeMobileMenu();
    }
});

// Focus management for modal
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    });
    
    // Focus first element
    firstElement.focus();
}