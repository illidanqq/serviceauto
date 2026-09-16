const { useState, useEffect, useRef, createContext, useContext, useCallback } = React;

const LanguageContext = createContext();

function useT() {
    return useContext(LanguageContext).t;
}

function useLang() {
    return useContext(LanguageContext);
}

function submitAppointment(data) {
    return fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(res => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
    }).catch(() => {
        console.warn('Backend unavailable, appointment saved locally only');
        return { ok: true, local: true };
    });
}

function TopBar() {
    const t = useT();
    return (
        <div className="top-bar">
            <div className="container top-bar-inner">
                <div className="top-bar-left">
                    <span className="work-hours"><i className="fas fa-clock"></i> {t.workHours}</span>
                    <span className="divider">|</span>
                    <a href="tel:+77077777777" className="phone-link"><i className="fas fa-phone"></i> +7 707 777 77 77</a>
                </div>
                <div className="top-bar-right">
                    <span className="address"><i className="fas fa-map-marker-alt"></i> {t.address}</span>
                </div>
            </div>
        </div>
    );
}

function Header() {
    const t = useT();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { lang, setLang } = useLang();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 100);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const navItems = [
        { href: '#services', label: t.services },
        { href: '#about', label: t.about },
        { href: '#calculator', label: t.prices },
        { href: '#news', label: t.news },
        { href: '#reviews', label: t.reviews },
        { href: '#contacts', label: t.contacts },
        { href: '#faq', label: t.faq },
    ];

    return (
        <header className="header" id="header" style={{ boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.12)' : '0 2px 16px rgba(0,0,0,0.08)' }}>
            <div className="container header-inner">
                <a href="#" className="logo">
                    <span className="logo-icon"><i className="fas fa-car-side"></i></span>
                    <span className="logo-text">Remont<span className="logo-accent">Otsechki</span></span>
                </a>
                <nav className={`nav ${open ? 'open' : ''}`} id="nav">
                    <ul className="nav-list">
                        {navItems.map((item, i) => (
                            <li key={i}><a href={item.href} className="nav-link" onClick={(e) => {
                                e.preventDefault();
                                setOpen(false);
                                const el = document.querySelector(item.href);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}>{item.label}</a></li>
                        ))}
                    </ul>
                </nav>
                <div className="header-actions">
                    <div className="lang-switch header-lang">
                        <span className={`lang ${lang === 'ru' ? 'active' : ''}`} onClick={() => setLang('ru')}>RU</span>
                        <span className={`lang ${lang === 'kz' ? 'active' : ''}`} onClick={() => setLang('kz')}>KZ</span>
                    </div>
                    <a href="#appointment" className="btn btn-primary btn-sm" onClick={(e) => {
                        e.preventDefault();
                        document.querySelector('#appointment')?.scrollIntoView({ behavior: 'smooth' });
                    }}>{t.bookNow}</a>
                </div>
                <button className={`burger ${open ? 'active' : ''}`} id="burger" aria-label="Menu" onClick={() => setOpen(!open)}>
                    <span></span><span></span><span></span>
                </button>
            </div>
        </header>
    );
}

function Hero() {
    const t = useT();
    const [counters, setCounters] = useState({ y: 0, s: 0, c: 0, cl: 0 });
    const [animated, setAnimated] = useState(false);
    const ref = useRef(null);

    const targets = { y: 14, s: 50, c: 12, cl: 5200 };
    const labels = { y: t.yearsExp, s: t.servicesCount, c: t.certificates, cl: t.happyClients };

    useEffect(() => {
        if (!ref.current) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !animated) {
                setAnimated(true);
                const start = performance.now();
                const dur = 2000;
                function tick(now) {
                    const p = Math.min((now - start) / dur, 1);
                    const ease = 1 - Math.pow(1 - p, 3);
                    setCounters({
                        y: Math.floor(ease * targets.y),
                        s: Math.floor(ease * targets.s),
                        c: Math.floor(ease * targets.c),
                        cl: Math.floor(ease * targets.cl),
                    });
                    if (p < 1) requestAnimationFrame(tick);
                    else setCounters({ ...targets });
                }
                requestAnimationFrame(tick);
                obs.disconnect();
            }
        }, { threshold: 0.3 });
        obs.observe(ref.current);
        return () => obs.disconnect();
    }, [animated]);

    return (
        <section className="hero" id="hero" ref={ref}>
            <div className="hero-bg"><div className="hero-overlay"></div></div>
            <div className="container hero-content">
                <div className="hero-badge">
                    <span className="badge-icon"><i className="fas fa-wrench"></i></span>
                    <span>{t.heroBadge}</span>
                </div>
                <h1 className="hero-title">{t.heroTitle}</h1>
                <p className="hero-subtitle">{t.heroSubtitle}</p>
                <div className="hero-buttons">
                    <a href="#appointment" className="btn btn-primary btn-lg" onClick={(e) => { e.preventDefault(); document.querySelector('#appointment')?.scrollIntoView({ behavior: 'smooth' }); }}>{t.bookNow}</a>
                    <a href="#calculator" className="btn btn-outline btn-lg" onClick={(e) => { e.preventDefault(); document.querySelector('#calculator')?.scrollIntoView({ behavior: 'smooth' }); }}>{t.learnPrices}</a>
                </div>
                <div className="hero-stats">
                    <div className="hero-stat">
                        <span className="stat-number">{counters.y}</span>
                        <span className="stat-plus">+</span>
                        <span className="stat-label">{labels.y}</span>
                    </div>
                    <div className="hero-stat">
                        <span className="stat-number">{counters.s}</span>
                        <span className="stat-plus">+</span>
                        <span className="stat-label">{labels.s}</span>
                    </div>
                    <div className="hero-stat">
                        <span className="stat-number">{counters.c}</span>
                        <span className="stat-label">{labels.c}</span>
                    </div>
                    <div className="hero-stat">
                        <span className="stat-number">{counters.cl.toLocaleString()}</span>
                        <span className="stat-plus">+</span>
                        <span className="stat-label">{labels.cl}</span>
                    </div>
                </div>
            </div>
            <a href="#services" className="scroll-down" onClick={(e) => { e.preventDefault(); document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' }); }}>
                <i className="fas fa-chevron-down"></i>
            </a>
        </section>
    );
}
const SERVICE_DATA = [
    { key: 'headlights', img: 'src/Image(1).png', price: 4000, cat: 'electrical' },
    { key: 'injectors', img: 'src/Image(2).png', price: 12000, cat: 'engine' },
    { key: 'ac', img: 'src/Image(3).png', price: 17000, cat: 'body' },
    { key: 'brakes', img: 'src/Image(4).png', price: 5000, cat: 'chassis' },
    { key: 'suspension', img: 'src/Image(5).png', price: 8000, cat: 'chassis' },
    { key: 'heater', img: 'src/Image(6).png', price: 185000, cat: 'engine' },
];

function Services() {
    const t = useT();
    const [cat, setCat] = useState('all');
    const categories = ['all', 'engine', 'chassis', 'electrical', 'body'];
    const filtered = cat === 'all' ? SERVICE_DATA : SERVICE_DATA.filter(s => s.cat === cat);

    return (
        <section className="services" id="services">
            <div className="container">
                <div className="section-header">
                    <span className="section-label">{t.servicesLabel}</span>
                    <h2 className="section-title">{t.servicesTitle}</h2>
                </div>
                <div className="filter-bar">
                    {categories.map(c => (
                        <button key={c} className={`filter-btn ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
                            {t.categories[c]}
                        </button>
                    ))}
                </div>
                <div className="services-grid">
                    {filtered.map((s) => (
                        <article className="service-card fade-up visible" key={s.key}>
                            <div className="service-photo">
                                <img src={s.img} alt={t.serviceNames[s.key]} />
                            </div>
                            <div className="service-body">
                                <h3>{t.serviceNames[s.key]}</h3>
                                <a href="#appointment" className="service-price" onClick={(e) => { e.preventDefault(); document.querySelector('#appointment')?.scrollIntoView({ behavior: 'smooth' }); }}>
                                    {t.priceFrom} {s.price.toLocaleString()} {t.currency}
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

function WhyUs() {
    const t = useT();
    return (
        <section className="why-us" id="why-us">
            <div className="container">
                <div className="section-header">
                    <span className="section-label">{t.whyLabel}</span>
                    <h2 className="section-title">{t.whyTitle}</h2>
                </div>
                <div className="why-grid">
                    {t.whyItems.map((item, i) => (
                        <div className="why-card fade-up visible" key={i}>
                            <div className="why-number">{item.number}</div>
                            <div className="why-text">{item.text}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function PriceCalculator() {
    const t = useT();
    const [selected, setSelected] = useState({});
    const [promo, setPromo] = useState('');
    const [promoMsg, setPromoMsg] = useState(null);
    const [promoApplied, setPromoApplied] = useState(false);
    const [filterCat, setFilterCat] = useState('all');

    const toggle = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

    const filtered = filterCat === 'all' ? t.calcServices : t.calcServices.filter(s => s.category === filterCat);

    const total = filtered.reduce((sum, s) => sum + (selected[s.id] ? s.price : 0), 0);
    const discount = promoApplied ? Math.round(total * 0.1) : 0;
    const finalTotal = total - discount;

    const applyPromo = () => {
        if (t.promoCodes.includes(promo.toUpperCase())) {
            setPromoApplied(true);
            setPromoMsg('success');
        } else {
            setPromoApplied(false);
            setPromoMsg('invalid');
        }
    };

    return (
        <section className="calculator" id="calculator">
            <div className="container">
                <div className="section-header">
                    <span className="section-label">{t.calculatorLabel}</span>
                    <h2 className="section-title">{t.calculatorTitle}</h2>
                    <p className="calc-desc">{t.calculatorDesc}</p>
                </div>
                <div className="calc-layout">
                    <div className="calc-filters">
                        {['all', 'engine', 'chassis', 'electrical', 'body'].map(c => (
                            <button key={c} className={`filter-btn ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>
                                {t.categories[c]}
                            </button>
                        ))}
                    </div>
                    <div className="calc-grid">
                        {filtered.map(s => (
                            <label className={`calc-item ${selected[s.id] ? 'selected' : ''}`} key={s.id}>
                                <input type="checkbox" checked={!!selected[s.id]} onChange={() => toggle(s.id)} />
                                <div className="calc-item-info">
                                    <span className="calc-item-name">{s.name}</span>
                                    <span className="calc-item-price">{s.price.toLocaleString()} {t.currency}</span>
                                </div>
                                <div className={`calc-check ${selected[s.id] ? 'checked' : ''}`}>
                                    {selected[s.id] && <i className="fas fa-check"></i>}
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="calc-summary">
                        <div className="calc-total-row">
                            <span>{t.calcTotal}</span>
                            <span className="calc-total-value">{finalTotal.toLocaleString()} {t.currency}</span>
                        </div>
                        {promoApplied && <div className="calc-discount">-{discount.toLocaleString()} {t.currency}</div>}
                        <div className="promo-row">
                            <input type="text" placeholder={t.promoPlaceholder} value={promo} onChange={e => { setPromo(e.target.value); setPromoMsg(null); }} />
                            <button className="btn btn-primary btn-sm" onClick={applyPromo}>{t.applyPromo}</button>
                        </div>
                        {promoMsg === 'success' && <div className="promo-msg success">{t.promoSuccess}</div>}
                        {promoMsg === 'invalid' && <div className="promo-msg error">{t.promoInvalid}</div>}
                    </div>
                </div>
            </div>
        </section>
    );
}

function AppointmentForm() {
    const t = useT();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [service, setService] = useState('');
    const [consent, setConsent] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const validate = () => {
        const e = {};
        if (!name.trim()) e.name = t.formErrors.nameRequired;
        if (!phone.trim()) e.phone = t.formErrors.phoneRequired;
        else if (!/^[\+]?[0-9\s\-\(\)]{7,15}$/.test(phone.trim())) e.phone = t.formErrors.phoneInvalid;
        if (!consent) e.consent = t.formErrors.consentRequired;
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length === 0) {
            submitAppointment({ name, phone, service });
            setSubmitted(true);
            setName(''); setPhone(''); setService(''); setConsent(false);
        }
    };

    return (
        <section className="cta-appointment" id="appointment">
            <div className="container">
                <div className="cta-inner">
                    <div className="cta-content">
                        <h2>{t.ctaTitle}</h2>
                        <p>{t.ctaDesc}</p>
                    </div>
                    <div className="cta-form-wrapper">
                        {submitted ? (
                            <div className="form-success-msg">
                                <i className="fas fa-check-circle"></i>
                                <p>{t.formSuccess}</p>
                                <button className="btn btn-primary btn-lg" onClick={() => setSubmitted(false)}>{t.bookNow}</button>
                            </div>
                        ) : (
                            <form className="appointment-form" onSubmit={handleSubmit}>
                                <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
                                    <input type="text" placeholder={t.formName} value={name} onChange={e => setName(e.target.value)} />
                                    {errors.name && <span className="field-error">{errors.name}</span>}
                                </div>
                                <div className={`form-group ${errors.phone ? 'has-error' : ''}`}>
                                    <input type="tel" placeholder={t.formPhone} value={phone} onChange={e => setPhone(e.target.value)} />
                                    {errors.phone && <span className="field-error">{errors.phone}</span>}
                                </div>
                                <div className="form-group">
                                    <select value={service} onChange={e => setService(e.target.value)}>
                                        <option value="">{t.formService}</option>
                                        {t.serviceOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className={`form-group checkbox-group ${errors.consent ? 'has-error' : ''}`}>
                                    <label>
                                        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                                        <span>{t.formConsent}</span>
                                    </label>
                                    {errors.consent && <span className="field-error">{errors.consent}</span>}
                                </div>
                                <button type="submit" className="btn btn-primary btn-lg btn-block">{t.formSubmit}</button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

const REVIEWS_DATA = [
    { stars: 5, text: { ru: "\u041E\u0442\u043B\u0438\u0447\u043D\u044B\u0439 \u0441\u0435\u0440\u0432\u0438\u0441! \u041F\u0440\u0438\u0435\u0445\u0430\u043B \u0441 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u043E\u0439 \u0432 \u0445\u043E\u0434\u043E\u0432\u043E\u0439 \u2014 \u0431\u044B\u0441\u0442\u0440\u043E \u0434\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043B\u0438, \u0432\u0441\u0451 \u043E\u0431\u044A\u044F\u0441\u043D\u0438\u043B\u0438 \u0438 \u0443\u0441\u0442\u0440\u0430\u043D\u0438\u043B\u0438. \u0426\u0435\u043D\u044B \u0447\u0435\u0441\u0442\u043D\u044B\u0435, \u0431\u0435\u0437 \u043D\u0430\u043A\u0440\u0443\u0442\u043E\u043A.", kz: "\u0422\u0430\u043C\u0430\u0448\u0430 \u0441\u0435\u0440\u0432\u0438\u0441! \u0410\u0441\u043F\u0430\u043B\u044B \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0430\u043C\u0435\u043D \u043A\u0435\u043B\u0434\u0456\u043C \u2014 \u0436\u044B\u043B\u0434\u0430\u043C \u0434\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u043A\u0430 \u0436\u0430\u0441\u0430\u043F, \u0431\u04D9\u0440\u0456\u043D \u0442\u04AF\u0441\u0456\u043D\u0434\u0438\u0440\u0456\u043F, \u0436\u04D9\u043D\u0434\u0435\u0434\u0456. \u0411\u0430\u04D9\u043B\u0430\u0440 \u0430\u0434\u0430\u043B." }, name: "\u0414\u043C\u0438\u0442\u0440\u0438\u0439 \u041A.", date: "15.08.2025", letter: "\u0414" },
    { stars: 5, text: { ru: "\u0414\u0435\u043B\u0430\u043B\u0438 \u0437\u0430\u043F\u0440\u0430\u0432\u043A\u0443 \u043A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440\u0430 \u2014 \u0432\u0441\u0451 \u0431\u044B\u0441\u0442\u0440\u043E \u0438 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E. \u041C\u0430\u0441\u0442\u0435\u0440\u0430 \u0437\u043D\u0430\u044E\u0442 \u0441\u0432\u043E\u0451 \u0434\u0435\u043B\u043E. \u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u044E!", kz: "\u041A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440\u0434\u0456 \u0442\u043E\u043B\u0442\u044B\u0440\u0434\u044B\u043A \u2014 \u0431\u04D9\u0440\u0456 \u0436\u044B\u043B\u0434\u0430\u043C \u04D9\u0440\u0456 \u0441\u0430\u043F\u0430\u043B\u044B. \u041C\u0430\u043C\u0430\u043D\u0434\u0430\u0440 \u0438\u0441\u0456\u043D \u0431\u0456\u043B\u0435\u0434\u0456. \u0422\u04B1\u0436\u044B\u0440\u044B\u043C\u0434\u0430\u0439\u043C\u044B\u043D!" }, name: "\u0410\u0439\u0436\u0430\u043D \u041C.", date: "02.07.2025", letter: "\u0410" },
    { stars: 4.5, text: { ru: "\u041E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u0435\u043C \u0437\u0434\u0435\u0441\u044C \u043A\u043E\u0440\u043F\u043E\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u0430\u0440\u043A \u0443\u0436\u0435 3 \u0433\u043E\u0434\u0430. \u0412\u0441\u0451 \u043F\u043E \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0443, \u043E\u0442\u0447\u0451\u0442\u043D\u043E\u0441\u0442\u044C \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u0430\u044F. \u0421\u0435\u0440\u0432\u0438\u0441 \u043D\u0430 \u0432\u044B\u0441\u043E\u0442\u0435!", kz: "\u041A\u043E\u0440\u043F\u043E\u0440\u0430\u0442\u0438\u0432\u0442\u0456\u043A \u043F\u0430\u0440\u043A\u0442\u0456 3 \u0436\u044B\u043B\u0434\u0430\u043D \u0431\u0435\u0440\u0456 \u043E\u0441\u044B\u043D\u0434\u0430 043A\u044B\u0437\u043C\u0435\u0442 \u043A\u04B1\u0440\u0441\u0435\u0442\u0435\u043C\u0456\u0437. \u0411\u04D9\u0440\u0456 \u043A\u0435\u043B\u0456\u0441\u0456\u043C\u0448\u0430\u0440\u0442 \u0431\u043E\u0439\u044B\u043D\u0448\u0430, \u0435\u0441\u0435\u043F \u0431\u0435\u0440\u0443 \u0430\u0448\u044B\u043A. \u0421\u0435\u0440\u0432\u0438\u0441 \u0436\u043E\u04D9\u0440\u044B \u0434\u0435\u04A3\u0433\u0435\u0439\u0434\u0435!" }, name: "\u0411\u043E\u043B\u0430\u0442 \u0422.", date: "18.06.2025", letter: "\u0411" },
    { stars: 5, text: { ru: "\u0417\u0430\u043C\u0435\u043D\u0438\u043B \u0440\u0435\u043C\u0435\u043D\u044C \u0413\u0420\u041C \u0438 \u0441\u0430\u043B\u044C\u043D\u0438\u043A\u0438. \u0420\u0430\u0431\u043E\u0442\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0430 \u0437\u0430 \u0434\u0435\u043D\u044C, \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u044F 6 \u043C\u0435\u0441\u044F\u0446\u0435\u0432. \u0412\u0441\u0451 \u043E\u0442\u043B\u0438\u0447\u043D\u043E!", kz: "\u0413\u0420\u041C \u0431\u0435\u043B\u0434\u0456\u0433\u0456 \u043C\u0435\u043D \u0441\u0430\u04D9\u043D\u044B\u043B\u0430\u0443\u043B\u0430\u0440\u0434\u044B \u0430\u0443\u044B\u0441\u0442\u044B\u0440\u0434\u044B\u043C. \u0416\u04B1\u043C\u044B\u0441 \u0431\u0456\u0440 \u043A\u04AF\u043D\u0434\u0435 \u043E\u0440\u044B\u043D\u0434\u044B, 6 \u0430\u0439 \u043A\u0435\u043F\u0456\u043B\u0434\u0456\u043A. \u0411\u04D9\u0440\u0456 \u0442\u0430\u043C\u0430\u0448\u0430!" }, name: "\u0421\u0435\u0440\u0433\u0435\u0439 \u0412.", date: "05.05.2025", letter: "\u0421" },
];

function Reviews() {
    const t = useT();
    const { lang } = useLang();
    return (
        <section className="reviews" id="reviews">
            <div className="container">
                <div className="section-header">
                    <span className="section-label">{t.reviewsLabel}</span>
                    <h2 className="section-title">{t.reviewsTitle}</h2>
                </div>
                <div className="reviews-slider">
                    {REVIEWS_DATA.map((r, i) => (
                        <div className="review-card fade-up visible" key={i}>
                            <div className="review-stars">
                                {[...Array(5)].map((_, j) => {
                                    if (j < Math.floor(r.stars)) return <i className="fas fa-star" key={j}></i>;
                                    if (j < r.stars) return <i className="fas fa-star-half-alt" key={j}></i>;
                                    return <i className="far fa-star" key={j}></i>;
                                })}
                            </div>
                            <p className="review-text">{r.text[lang]}</p>
                            <div className="review-author">
                                <div className="review-avatar">{r.letter}</div>
                                <div>
                                    <div className="review-name">{r.name}</div>
                                    <div className="review-date">{r.date}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

const BRANDS = ['Toyota', 'Lexus', 'Hyundai', 'Kia', 'Mitsubishi', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'SsangYong', 'Chevrolet', 'Daewoo'];

function BrandsSlider() {
    const t = useT();
    const viewportRef = useRef(null);
    const trackRef = useRef(null);
    const [idx, setIdx] = useState(BRANDS.length);
    const [itemW, setItemW] = useState(0);
    const [animating, setAnimating] = useState(false);
    const gap = 16;

    const getVisible = useCallback(() => {
        const w = viewportRef.current?.offsetWidth || 800;
        if (w < 420) return 2;
        if (w < 640) return 3;
        if (w < 900) return 4;
        return 5;
    }, []);

    useEffect(() => {
        if (!trackRef.current || !viewportRef.current) return;
        const items = [...trackRef.current.children];
        const vis = getVisible();
        const w = (viewportRef.current.offsetWidth - gap * (vis - 1)) / vis;
        setItemW(w);
        items.forEach(el => el.style.flex = '0 0 ' + w + 'px');
    }, [getVisible]);

    const offset = idx * (itemW + gap);

    const normalize = useCallback((i) => {
        const total = BRANDS.length;
        if (i >= total * 2) return i - total;
        if (i < total) return i + total;
        return i;
    }, []);

    const go = (next) => {
        if (animating) return;
        setAnimating(true);
        setIdx(next);
    };

    const onTransitionEnd = (e) => {
        if (e.propertyName !== 'transform') return;
        setIdx(prev => normalize(prev));
        setAnimating(false);
    };

    return (
        <section className="brands" id="brands">
            <div className="container">
                <div className="section-header">
                    <span className="section-label">{t.brandsLabel}</span>
                    <h2 className="section-title">{t.brandsTitle}</h2>
                </div>
                <div className="brands-slider">
                    <button className="brands-nav brands-prev" onClick={() => go(idx - 1)}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="brands-viewport" ref={viewportRef}>
                        <div className={'brands-track' + (animating ? ' is-animating' : '')} ref={trackRef} style={{ transform: 'translateX(-' + offset + 'px)' }} onTransitionEnd={onTransitionEnd}>
                            {BRANDS.map((b, i) => <div className="brand-item" key={'o-' + i}><span>{b}</span></div>)}
                            {BRANDS.map((b, i) => <div className="brand-item" key={'c-' + i}><span>{b}</span></div>)}
                            {BRANDS.map((b, i) => <div className="brand-item" key={'d-' + i}><span>{b}</span></div>)}
                        </div>
                    </div>
                    <button className="brands-nav brands-next" onClick={() => go(idx + 1)}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </section>
    );
}

function Stages() {
    const t = useT();
    return (
        <section className="stages" id="stages">
            <div className="container">
                <div className="section-header">
                    <span className="section-label">{t.stagesLabel}</span>
                    <h2 className="section-title">{t.stagesTitle}</h2>
                </div>
                <div className="stages-timeline">
                    {t.stages.map((s, i) => (
                        <div className="stage-item fade-up visible" key={i}>
                            <div className="stage-number">{i + 1}</div>
                            <div className="stage-content">
                                <h3>{s.title}</h3>
                                <p>{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function About() {
    const t = useT();
    return (
        <section className="about" id="about">
            <div className="container">
                <div className="about-grid">
                    <div className="about-content">
                        <span className="section-label">{t.aboutLabel}</span>
                        <h2 className="section-title">{t.aboutTitle}</h2>
                        <p>{t.aboutP1}</p>
                        <p>{t.aboutP2}</p>
                        <p>{t.aboutP3}</p>
                        <a href="#" className="btn btn-primary">{t.aboutMore}</a>
                    </div>
                    <div className="about-image">
                        <img src="src/Group_21_1.png.webp.png" alt="" />
                    </div>
                </div>
            </div>
        </section>
    );
}

const PRICE_DATA = [
    { icon: 'fas fa-laptop-code', key: 'diag', price: 4000 },
    { icon: 'fas fa-snowflake', key: 'ac', price: 17000 },
    { icon: 'fas fa-tire', key: 'tires', price: 8000 },
    { icon: 'fas fa-gas-pump', key: 'injectors', price: 12000 },
    { icon: 'fas fa-compact-disc', key: 'brakes', price: 5000 },
    { icon: 'fas fa-fire', key: 'heater', price: 185000 },
];

function Prices() {
    const t = useT();
    const { lang } = useLang();
    const priceNames = {
        ru: { diag: '\u041A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u043D\u0430\u044F \u0434\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u043A\u0430 \u0430\u0432\u0442\u043E', ac: '\u0417\u0430\u043F\u0440\u0430\u0432\u043A\u0430 \u0430\u0432\u0442\u043E\u043A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440\u0430', tires: '\u0428\u0438\u043D\u043E\u043C\u043E\u043D\u0442\u0430\u0436 \u0438 \u0431\u0430\u043B\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u043A\u0430', injectors: '\u0427\u0438\u0441\u0442\u043A\u0430 \u0444\u043E\u0440\u0441\u0443\u043D\u043E\u043A', brakes: '\u041F\u0440\u043E\u0442\u043E\u0447\u043A\u0430 \u0442\u043E\u0440\u043C\u043E\u0437\u043D\u044B\u0445 \u0434\u0438\u0441\u043A\u043E\u0432', heater: '\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u043F\u043E\u0434\u043E\u0433\u0440\u0435\u0432\u0430\u0442\u0435\u043B\u0435\u0439' },
        kz: { diag: '\u041A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u043B\u0456\u043A \u0434\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u043A\u0430', ac: '\u0410\u0432\u0442\u043E\u043A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440\u0434\u0456 \u0442\u043E\u043B\u0442\u044B\u0440\u0443', tires: '\u0428\u0438\u043D\u0430 \u043E\u0440\u043D\u0430\u0442\u0443 \u0436\u04D9\u043D\u0435 \u0431\u0430\u043B\u0430\u043D\u0441\u0442\u0430\u0443', injectors: '\u0424\u043E\u0440\u0441\u0443\u043D\u043A\u0430\u043B\u0430\u0440\u0434\u044B \u0442\u0430\u0437\u0430\u043B\u0430\u0443', brakes: '\u0422\u0435\u0436\u0435\u0433\u0456\u0448 \u0434\u0438\u0441\u043A\u0456\u043B\u0435\u0440\u0456\u043D \u04B9\u043D\u0434\u0435\u0443', heater: '\u0414\u0438\u0437\u0435\u043B\u044C \u043E\u0442\u044B\u043D \u0436\u044B\u043B\u044B\u0442\u043A\u044B\u0448\u044B\u043D \u043E\u0440\u043D\u0430\u0442\u0443' },
    };
    return (
        <section className="prices" id="prices">
            <div className="container">
                <div className="section-header">
                    <span className="section-label">{t.pricesLabel}</span>
                    <h2 className="section-title">{t.pricesTitle}</h2>
                </div>
                <div className="prices-grid">
                    {PRICE_DATA.map((p, i) => (
                        <div className="price-card fade-up visible" key={i}>
                            <div className="price-icon"><i className={p.icon}></i></div>
                            <div className="price-info">
                                <h3>{priceNames[lang][p.key]}</h3>
                                <div className="price-value">{p.key === 'heater' ? 'от ' : ''}{p.price.toLocaleString()} {t.currency}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-40">
                    <a href="#calculator" className="btn btn-primary btn-lg" onClick={(e) => { e.preventDefault(); document.querySelector('#calculator')?.scrollIntoView({ behavior: 'smooth' }); }}>{t.allPrices}</a>
                </div>
            </div>
        </section>
    );
}

function CtaReliable() {
    const t = useT();
    return (
        <section className="cta-reliable">
            <div className="container">
                <div className="cta-reliable-inner">
                    <h2>{t.ctaReliableTitle}</h2>
                    <p>{t.ctaReliableP1}</p>
                    <p>{t.ctaReliableP2}</p>
                    <a href="#appointment" className="btn btn-primary btn-lg" onClick={(e) => { e.preventDefault(); document.querySelector('#appointment')?.scrollIntoView({ behavior: 'smooth' }); }}>{t.bookNow}</a>
                </div>
            </div>
        </section>
    );
}

function FAQ() {
    const t = useT();
    const [active, setActive] = useState(null);
    return (
        <section className="faq" id="faq">
            <div className="container">
                <div className="section-header">
                    <span className="section-label">{t.faqLabel}</span>
                    <h2 className="section-title">{t.faqTitle}</h2>
                </div>
                <div className="faq-list">
                    {t.faqItems.map((item, i) => (
                        <div className={'faq-item' + (active === i ? ' active' : '')} key={i}>
                            <div className="faq-question" onClick={() => setActive(active === i ? null : i)}>
                                <span>{item.q}</span>
                                <i className="fas fa-chevron-down faq-icon"></i>
                            </div>
                            <div className="faq-answer">
                                <p>{item.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

const NEWS_DATA = [
    { img: 'src/news1.png', date: '15.09.2025', title: { ru: '\u041E\u0431\u0443\u0447\u0435\u043D\u0438\u0435 \u0432 \u0430\u0432\u0442\u043E\u0441\u0435\u0440\u0432\u0438\u0441\u0435', kz: '\u0410\u0432\u0442\u043E\u0441\u0435\u0440\u0432\u0438\u0441\u0442\u0435 \u043E\u043A\u0443' }, desc: { ru: '\u041D\u0430\u0448\u0438 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u044B \u043F\u0440\u043E\u0448\u043B\u0438 \u043A\u0443\u0440\u0441\u044B \u043F\u043E\u0432\u044B\u0448\u0435\u043D\u0438\u044F \u043A\u0432\u0430\u043B\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438', kz: '\u0411\u0456\u0437\u0434\u0456\u043D\u0456\u043D\u0433 \u043C\u0430\u043C\u0430\u043D\u0434\u0430\u0440 \u0431\u0456\u043B\u0438\u043A\u0442\u0456\u043B\u0456\u043A\u0442\u0456 \u0430\u0440\u0442\u0442\u044B\u0440\u0443 \u043A\u0443\u0440\u0441\u0442\u0430\u0440\u044B\u043D\u0430\u043D \u04B9\u0442\u0442\u0456' } },
    { img: 'src/news2.png', date: '01.08.2025', title: { ru: '\u041E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u043D\u0438\u0435 \u0430\u0432\u0442\u043E\u043A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440\u0430 \u0432 \u0423\u0437\u0431\u0435\u043A\u0438\u0441\u0442\u0430\u043D\u0435', kz: '\u04E8\u0437\u0431\u0435\u043A\u0441\u0442\u0430\u043D\u0434\u0430 \u0430\u0432\u0442\u043E\u043A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440\u0434\u0456 \u049B\u044B\u0437\u043C\u0435\u0442 \u043A\u04B1\u0440\u0441\u0435\u0442\u0443' }, desc: { ru: '\u0420\u0430\u0441\u0448\u0438\u0440\u044F\u0435\u043C \u0433\u0435\u043E\u0433\u0440\u0430\u0444\u0438\u044E \u043E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u043D\u0438\u044F \u043A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440\u043E\u0432', kz: '\u041A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440\u043B\u0435\u0440\u0434\u0456 \u049B\u044B\u0437\u043C\u0435\u0442 \u043A\u04B1\u0440\u0441\u0435\u0442\u0443 \u0433\u0435\u043E\u0433\u0440\u0430\u0444\u0438\u044F\u0441\u044B\u043D \u043A\u0435\u043D\u0435\u0439\u0442\u0435\u043C\u0456\u0437' } },
    { img: 'src/news3.png', date: '20.07.2025', title: { ru: '\u041A\u0443\u0440\u0441 \u043F\u043E \u0440\u0435\u043C\u043E\u043D\u0442\u0443 \u043A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440\u0430 \u0432 \u041A\u044B\u0440\u0433\u044B\u0437\u0441\u0442\u0430\u043D\u0435', kz: '\u049A\u044B\u0440\u04B9\u0437\u0441\u0442\u0430\u043D\u0434\u0430 \u043A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440\u0434\u0456 \u0436\u04B9\u043D\u0434\u0435\u0443 \u043A\u0443\u0440\u0441\u044B' }, desc: { ru: '\u041F\u0440\u043E\u0448\u043B\u0438 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u0435 \u043F\u043E \u0440\u0435\u043C\u043E\u043D\u0442\u0443 \u0441\u0438\u0441\u0442\u0435\u043C \u043A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F', kz: '\u041A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440 \u0436\u04B9\u0439\u0435\u043B\u0435\u0440\u0456\u043D \u0436\u04B9\u043D\u0434\u0435\u0443 \u0431\u043E\u0439\u044B\u043D\u0448\u0430 \u043E\u043A\u0443\u0434\u0430\u043D \u04B9\u0442\u0442\u0456\u043A' } },
];

function News() {
    const t = useT();
    const { lang } = useLang();
    return (
        <section className="news" id="news">
            <div className="container">
                <div className="section-header">
                    <span className="section-label">{t.newsLabel}</span>
                    <h2 className="section-title">{t.newsTitle}</h2>
                </div>
                <div className="news-grid">
                    {NEWS_DATA.map((n, i) => (
                        <a href="#" className="news-card fade-up visible" key={i}>
                            <div className="news-img">
                                <img src={n.img} alt="" />
                            </div>
                            <div className="news-body">
                                <span className="news-date">{n.date}</span>
                                <h3>{n.title[lang]}</h3>
                                <p>{n.desc[lang]}</p>
                            </div>
                        </a>
                    ))}
                </div>
                <div className="text-center mt-40">
                    <a href="#" className="btn btn-outline btn-lg">{t.allNews}</a>
                </div>
            </div>
        </section>
    );
}

function Requisites() {
    const t = useT();
    return (
        <section className="requisites">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">{t.requisitesTitle}</h2>
                </div>
                <div className="requisites-grid">
                    {t.requisites.map((r, i) => (
                        <div className="req-item" key={i}>
                            <span className="req-label">{r.label}</span>
                            <span className="req-value">{r.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Contacts() {
    const t = useT();
    return (
        <section className="contacts" id="contacts">
            <div className="container">
                <div className="section-header">
                    <span className="section-label">{t.contactsLabel}</span>
                    <h2 className="section-title">{t.contactsTitle}</h2>
                </div>
                <div className="contacts-grid">
                    <div className="contacts-info">
                        {t.contactBlocks.map((b, i) => (
                            <div className="contact-block" key={i}>
                                <div className="contact-icon"><i className={b.icon}></i></div>
                                <div>
                                    <h3>{b.title}</h3>
                                    {b.lines.map((line, j) => (
                                        <p key={j}>{b.link ? <a href={b.link} target="_blank" rel="noopener noreferrer">{line}</a> : line}</p>
                                    ))}
                                    {b.muted && <p className="text-muted">{b.muted}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="contacts-map">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2906.6446650983394!2d76.91120057628929!3d43.237909171124834!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3883692f0279a0c5%3A0x7970edb08b2ffdce!2z0JjQvdC90L7QstCw0YbQuNC-0L3QvdGL0Lkg0KLQtdGF0L3QuNGH0LXRgdC60LjQuSDQutC-0LvQu9C10LTQtg!5e0!3m2!1sru!2skz!4v1789568764557!5m2!1sru!2skz"
                            title="Map"
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"></iframe>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    const t = useT();
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col">
                        <a href="#" className="footer-logo">
                            <span className="logo-icon"><i className="fas fa-car-side"></i></span>
                            <span className="logo-text">Remont<span className="logo-accent">Otsechki</span></span>
                        </a>
                        <p className="footer-desc">{t.footerDesc}</p>
                    </div>
                    <div className="footer-col">
                        <h3>{t.footerServices}</h3>
                        <ul className="footer-links">
                            {t.footerLinks.services.map((link, i) => <li key={i}><a href="#">{link}</a></li>)}
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>{t.footerCompany}</h3>
                        <ul className="footer-links">
                            {t.footerLinks.company.map((link, i) => <li key={i}><a href="#">{link}</a></li>)}
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>{t.footerContacts}</h3>
                        <p>+7 727 317 22 89</p>
                        <p>{t.address}</p>
                        <div className="footer-social">
                            <a href="#" className="social-link"><i className="fab fa-instagram"></i></a>
                            <a href="#" className="social-link"><i className="fab fa-whatsapp"></i></a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>{t.copyright}</p>
                    <a href="#">{t.privacy}</a>
                </div>
            </div>
        </footer>
    );
}

function WhatsAppFloat() {
    return (
        <a href="https://wa.me/77071126671" className="whatsapp-float" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-whatsapp"></i>
        </a>
    );
}

function Modal({ active, onClose }) {
    const t = useT();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [service, setService] = useState('');
    const [consent, setConsent] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        submitAppointment({ name, phone, service });
        setSubmitted(true);
        setName(''); setPhone(''); setService(''); setConsent(false);
    };

    const handleClose = () => {
        setSubmitted(false);
        onClose();
    };

    if (!active) return null;

    return (
        <div className="modal-overlay active" onClick={handleClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={handleClose}><i className="fas fa-times"></i></button>
                <h2>{t.modalTitle}</h2>
                <p>{t.modalDesc}</p>
                {submitted ? (
                    <div className="form-success-msg">
                        <i className="fas fa-check-circle"></i>
                        <p>{t.formSuccess}</p>
                    </div>
                ) : (
                    <form className="modal-form" onSubmit={handleSubmit}>
                        <input type="text" placeholder={t.formName} value={name} onChange={e => setName(e.target.value)} required />
                        <input type="tel" placeholder={t.formPhone} value={phone} onChange={e => setPhone(e.target.value)} required />
                        <select value={service} onChange={e => setService(e.target.value)}>
                            <option value="">{t.formService}</option>
                            {t.serviceOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                        </select>
                        <label className="checkbox-label">
                            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required />
                            <span>{t.formConsent}</span>
                        </label>
                        <button type="submit" className="btn btn-primary btn-lg btn-block">{t.formSubmit}</button>
                    </form>
                )}
            </div>
        </div>
    );
}

function App() {
    const [lang, setLang] = useState('ru');
    const t = TRANSLATIONS[lang];
    const [modalActive, setModalActive] = useState(false);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            <TopBar />
            <Header />
            <Hero />
            <Services />
            <WhyUs />
            <PriceCalculator />
            <AppointmentForm />
            <Reviews />
            <BrandsSlider />
            <Stages />
            <About />
            <Prices />
            <CtaReliable />
            <FAQ />
            <News />
            <Requisites />
            <Contacts />
            <Footer />
            <WhatsAppFloat />
            <Modal active={modalActive} onClose={() => setModalActive(false)} />
        </LanguageContext.Provider>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
