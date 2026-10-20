import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Header.css"
function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="home-header">
            <Link to="/" className="home-brand" onClick={closeMenu}>
                <div className="home-logo-wrapper">
                    <img
                        src="/images/csi-logo.png"
                        alt="CSI Church logo"
                        className="home-logo"
                        onError={(e) => {
                            e.target.src =
                                "https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=100&q=80";
                        }}
                    />
                </div>
                <div className="brand-text">
                    <strong>St. Stephen's C.S.I Church</strong>
                    <span>Puthuval</span>
                </div>
            </Link>

            {/* Hamburger button (only visible on mobile) */}
            <button
                type="button"
                className={`nav-toggle ${menuOpen ? "open" : ""}`}
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="main-nav"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            <nav id="main-nav" className={`nav-links ${menuOpen ? "open" : ""}`}>
                <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
                <NavLink to="/about" onClick={closeMenu}>About</NavLink>
                <Link to="/donation/" className="nav-donate" onClick={closeMenu}>
                    Donate Now
                </Link>
            </nav>
        </header>
    );
}

export default Header;