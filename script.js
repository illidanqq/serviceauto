const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    nav.classList.toggle('open');
    document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        burger.classList.remove('active');
        nav.classList.remove('open');
        document.body.style.overflow = '';
    });
});

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const duration = 2000;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.floor(eased * target).toLocaleString();
            if (progress < 1) requestAnimationFrame(update);
            else counter.textContent = target.toLocaleString();
        }
        requestAnimationFrame(update);
    });
}

const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            heroObserver.disconnect();
        }
    });
}, { threshold: 0.3 });
heroObserver.observe(document.getElementById('hero'));

document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const item = question.closest('.faq-item');
        const wasActive = item.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

        if (!wasActive) item.classList.add('active');
    });
});

const fadeElements = document.querySelectorAll('.service-card, .why-card, .price-card, .review-card, .stage-item, .team-card, .news-card');
fadeElements.forEach(el => el.classList.add('fade-up'));

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            scrollObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

fadeElements.forEach(el => scrollObserver.observe(el));

let lastScroll = 0;
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    const currentScroll = window.scrollY;

    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
    } else {
        header.style.boxShadow = '0 2px 16px rgba(0,0,0,0.08)';
    }

    lastScroll = currentScroll;
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');

document.querySelectorAll('a[href="#appointment"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

modalClose.addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
});

document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Спасибо! Мы свяжемся с вами в ближайшее время.');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        form.reset();
    });
});

const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const children = entry.target.querySelectorAll('.fade-up');
            children.forEach((child, index) => {
                child.style.transitionDelay = `${index * 80}ms`;
                child.classList.add('visible');
            });
            staggerObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.services-grid, .why-grid, .prices-grid, .reviews-slider, .team-grid').forEach(grid => {
    staggerObserver.observe(grid);
});

(function initBrandsSlider() {
    const slider = document.querySelector('.brands-slider');
    if (!slider) return;

    const viewport = slider.querySelector('.brands-viewport');
    const track = slider.querySelector('.brands-track');
    const prevBtn = slider.querySelector('.brands-prev');
    const nextBtn = slider.querySelector('.brands-next');
    const originals = Array.from(track.children);
    const total = originals.length;
    const gap = 16;
    let index = total;
    let itemWidth = 0;
    let isAnimating = false;

    function getVisibleCount() {
        const width = viewport.offsetWidth;
        if (width < 420) return 2;
        if (width < 640) return 3;
        if (width < 900) return 4;
        return 5;
    }

    function setItemWidths() {
        const visible = getVisibleCount();
        itemWidth = (viewport.offsetWidth - gap * (visible - 1)) / visible;
        Array.from(track.children).forEach(item => {
            item.style.flex = `0 0 ${itemWidth}px`;
        });
    }

    function offset() {
        return index * (itemWidth + gap);
    }

    function applyTransform(animate) {
        track.classList.toggle('is-animating', animate);
        track.style.transform = `translateX(-${offset()}px)`;
    }

    function goTo(nextIndex) {
        if (isAnimating) return;
        index = nextIndex;
        isAnimating = true;
        applyTransform(true);
    }

    function normalizeIndex() {
        if (index >= total * 2) {
            index -= total;
            applyTransform(false);
        } else if (index < total) {
            index += total;
            applyTransform(false);
        }
    }

    track.addEventListener('transitionend', (e) => {
        if (e.propertyName !== 'transform') return;
        normalizeIndex();
        isAnimating = false;
    });

    function setupClones() {
        originals.forEach(item => {
            const clone = item.cloneNode(true);
            clone.classList.add('brand-clone');
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
        });
        originals.slice().reverse().forEach(item => {
            const clone = item.cloneNode(true);
            clone.classList.add('brand-clone');
            clone.setAttribute('aria-hidden', 'true');
            track.insertBefore(clone, track.firstChild);
        });
    }

    function layout() {
        setItemWidths();
        applyTransform(false);
    }

    prevBtn.addEventListener('click', () => goTo(index - 1));
    nextBtn.addEventListener('click', () => goTo(index + 1));

    let startX = 0;
    let currentX = 0;
    let dragging = false;

    viewport.addEventListener('pointerdown', (e) => {
        if (isAnimating) return;
        dragging = true;
        startX = e.clientX;
        currentX = startX;
        track.classList.remove('is-animating');
        viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        currentX = e.clientX;
        track.style.transform = `translateX(${-offset() + (currentX - startX)}px)`;
    });

    function endDrag() {
        if (!dragging) return;
        dragging = false;
        const delta = currentX - startX;
        const threshold = itemWidth / 4;
        if (delta < -threshold) goTo(index + 1);
        else if (delta > threshold) goTo(index - 1);
        else {
            isAnimating = true;
            applyTransform(true);
        }
    }

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    window.addEventListener('resize', layout);

    setupClones();
    layout();
})();
