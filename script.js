/* ==============================================
   KAUSTAV ASWAL - PORTFOLIO JAVASCRIPT v3.0
   High Performance, Ultra-Smooth (Mobile, Tablet, Desktop)
   ============================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ============ NAVBAR SCROLL & ACTIVE LINK (OPTIMIZED) ============
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section[id]');
    const navLinkElements = document.querySelectorAll('.nav-link:not(.nav-cta)');
    const shapes = document.querySelectorAll('.shape');

    let isScrolling = false;

    const onScrollHandler = () => {
        const scrollY = window.scrollY;

        // Navbar blur toggle
        if (scrollY > 40) {
            if (!navbar.classList.contains('scrolled')) {
                navbar.classList.add('scrolled');
            }
        } else {
            if (navbar.classList.contains('scrolled')) {
                navbar.classList.remove('scrolled');
            }
        }

        // Active link detection
        const scrollPos = scrollY + 140;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                navLinkElements.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });

        // Subtle parallax on hero shapes (only in hero viewport)
        if (scrollY < window.innerHeight && shapes.length > 0) {
            shapes.forEach((shape, i) => {
                const speed = (i + 1) * 0.04;
                shape.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
            });
        }

        isScrolling = false;
    };

    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(onScrollHandler);
            isScrolling = true;
        }
    }, { passive: true });

    // Initial check
    onScrollHandler();

    // ============ MOBILE NAVIGATION ============
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        // Close on link click
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!navbar.contains(e.target) && navLinks.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // ============ TYPING EFFECT ============
    const typedTextEl = document.getElementById('typedText');
    const phrases = [
        'Digital Marketing Executive',
        'Social Media Strategist',
        'Meta Ads Specialist',
        'AI Prompt Engineer',
        'Content Creator',
        'WordPress Developer',
        'SEO Enthusiast',
        'Brand Growth Specialist'
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let speed = 75;

    function typeEffect() {
        if (!typedTextEl) return;
        const phrase = phrases[phraseIndex];

        if (isDeleting) {
            typedTextEl.textContent = phrase.substring(0, charIndex - 1);
            charIndex--;
            speed = 35;
        } else {
            typedTextEl.textContent = phrase.substring(0, charIndex + 1);
            charIndex++;
            speed = 75;
        }

        if (!isDeleting && charIndex === phrase.length) {
            speed = 2200; // Pause when word complete
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            speed = 350;
        }

        setTimeout(typeEffect, speed);
    }

    setTimeout(typeEffect, 1200);

    // ============ SMOOTH ANIMATED COUNTER ============
    function animateCounter(el, target) {
        let current = 0;
        const duration = 1800;
        const startTime = performance.now();

        function updateCount(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            current = Math.floor(easeOut * target);
            
            el.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                el.textContent = target;
            }
        }

        requestAnimationFrame(updateCount);
    }

    // ============ INTERSECTION OBSERVER FOR SCROLL REVEALS ============
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -10% 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');

                    // Check if element has counter
                    const counter = entry.target.querySelector('[data-count]');
                    if (counter && !counter.dataset.counted) {
                        counter.dataset.counted = 'true';
                        const target = parseInt(counter.dataset.count, 10);
                        animateCounter(counter, target);
                    }

                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });
    } else {
        // Fallback for older browsers
        document.querySelectorAll('[data-animate]').forEach(el => {
            el.classList.add('animated');
            const counter = el.querySelector('[data-count]');
            if (counter) {
                counter.textContent = counter.dataset.count;
            }
        });
    }

    // ============ SMOOTH SCROLL WITH DYNAMIC NAVBAR OFFSET ============
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;

            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                const navHeight = navbar ? navbar.offsetHeight : 70;
                const elementPosition = targetEl.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - (navHeight - 10);

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

});
