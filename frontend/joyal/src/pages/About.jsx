import { Link } from "react-router-dom";
import "./Home.css";   // reuses your theme variables, header, hero and footer styles
import "./About.css";  // only the new styles for this page

function About() {
    const activities = [
        {
            title: "Worship & Prayer",
            text: "Join us every week to worship together, pray for one another and grow in the Word.",
        },
        {
            title: "Youth Fellowship",
            text: "Meetings, retreats and games that help young people build friendships rooted in faith.",
        },
        {
            title: "Community Service",
            text: "Visiting the sick, helping families in need and serving the people around Puthuval.",
        },
    ];

    return (
        // "home-page" gives this page your colour variables and base styles
        <div className="home-page about-page">
            {/* Header */}
            <header className="home-header">
                <Link to="/" className="home-brand">
                    <div className="home-logo-wrapper">
                        <img
                            src="/images/csi-logo.png"
                            alt="CSI Church logo"
                            className="home-logo"
                        />
                    </div>
                    <div className="brand-text">
                        <strong>St. Stephen's C.S.I Church</strong>
                        <span>Puthuval</span>
                    </div>
                </Link>

                <nav className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/about" className="active">About</Link>
                    <Link to="/donation/" className="nav-donate">Donate Now</Link>
                </nav>
            </header>

            <main>
                {/* Hero */}
                <section className="home-hero about-hero">
                    <div className="home-content">
                        <h1>About our church youth</h1>
                        <p className="home-description">
                            We are the youth of St. Stephen's CSI Church, Puthuval, a
                            community that grows in faith, shares God's love and serves
                            others together.
                        </p>
                    </div>
                </section>

                {/* What we do */}
                <section className="youth-section">
                    <div className="youth-heading">
                        <h2>What we do</h2>
                        <p>
                            Replace this text with a short introduction to your church
                            youth movement.
                        </p>
                    </div>

                    <div className="youth-group">
                        <div className="youth-grid about-grid">
                            {activities.map((item) => (
                                <article className="youth-card about-card" key={item.title}>
                                    <h4>{item.title}</h4>
                                    <p>{item.text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-content">
                    <p>St. Stephen's C.S.I Church, Puthuval</p>
                    <span>Serving God and our community with love.</span>
                </div>
            </footer>
        </div>
    );
}

export default About;