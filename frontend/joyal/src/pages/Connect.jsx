
import { Link } from "react-router-dom";
import "./Connect.css";

function Connect() {
    const socialLinks = [
        {
            name: "Facebook",
            description: "Follow our church updates",
            icon: "f",
            className: "facebook",
            url: "https://www.facebook.com/PUTHUVALYOUTH/", // Add your Facebook URL
        },
        {
            name: "Instagram",
            description: "See photos and activities",
            icon: "◎",
            className: "instagram",
            url: "https://www.instagram.com/csi_youth_movement_puthuval/", // Add your Instagram URL
        },
        {
            name: "YouTube",
            description: "Watch worship and church videos",
            icon: "▶",
            className: "youtube",
            url: "https://www.youtube.com/@st.stephenscsichoirputhuva4609", // Add your YouTube URL
        },
        {
            name: "WhatsApp",
            description: "Connect with our community",
            icon: "☏",
            className: "whatsapp",
            url: "https://wa.me/919495240674", // Add your WhatsApp URL
        },
    ];

    return (
        <div className="connect-page">
            <header className="connect-header">
                <Link to="/" className="connect-brand">
                    St. Stephen's C.S.I Church
                    <span>Puthuval</span>
                </Link>

                <Link to="/" className="connect-home-link">
                    ← Back to Home
                </Link>
            </header>

            <main>
                <section className="connect-hero">
                    <span className="connect-badge">
                        FAITH · HOPE · LOVE
                    </span>

                    <h1>Connect With Us</h1>

                    <p>
                        We welcome you to connect with our church,
                        join our community, and grow together in faith.
                    </p>
                </section>

                <section className="connect-location">
                    <div className="connect-section-heading">
                        <span className="connect-eyebrow">
                            VISIT US
                        </span>

                        <h2>Find Our Church</h2>

                        <p>
                            We look forward to welcoming you.
                        </p>
                    </div>

                    <div className="connect-map-placeholder">
                        <span className="connect-map-icon">⌖</span>
                        <h3>St. Stephen's C.S.I Church, Puthuval</h3>
                        <p>
                            Add your church's exact Google Maps location
                            to display the map here.
                        </p>
                    </div>

                    <a
                        className="connect-directions-button"
                        href="https://maps.app.goo.gl/THepfa5QUMupysP59"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Get Directions ↗
                    </a>
                </section>

                <section className="connect-social">
                    <div className="connect-section-heading">
                        <span className="connect-eyebrow">
                            FOLLOW US
                        </span>

                        <h2>Our Social Media</h2>

                        <p>
                            Follow our pages to stay updated with church
                            news, events, and youth activities.
                        </p>
                    </div>

                    <div className="connect-social-grid">
                        {socialLinks.map((social) => (
                            <article
                                className="connect-social-card"
                                key={social.name}
                            >
                                <div
                                    className={`connect-social-icon ${social.className}`}
                                >
                                    {social.icon}
                                </div>

                                <h3>{social.name}</h3>

                                <p>{social.description}</p>

                                {social.url ? (
                                    <a
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="connect-social-link"
                                    >
                                        Visit Page ↗
                                    </a>
                                ) : (
                                    <span className="connect-social-unavailable">
                                        Link coming soon
                                    </span>
                                )}
                            </article>
                        ))}
                    </div>
                </section>

                <section className="connect-contact">
                    <h2>We'd Love to Hear From You</h2>

                    <p>
                        Have a question, need prayer, or want to know
                        more about our church?
                    </p>

                    <Link to="/" className="connect-contact-button">
                        Return to Homepage
                    </Link>
                </section>
            </main>

            <footer className="connect-footer">
                <p>St. Stephen's C.S.I Church, Puthuval</p>
                <span>Serving God and our community with love.</span>
            </footer>
        </div>
    );
}

export default Connect;