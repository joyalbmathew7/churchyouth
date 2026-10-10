import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
    const officials = [
        { 
            role: "President", 
            name: "Rev. Jiji Joseph", 
            image: "https://r2-pub.csimadhyakeraladiocese.org/images/7c50b3a4-7fe7-45b7-a6a3-d679115c715a.png" 
        },
        { 
            role: "Secretary", 
            name: "Shalom George Koshy", 
            image: "/images/shalom.png" 
        },
        { 
            role: "Joint Secretary", 
            name: "Anugraha Ann Bobby", 
            image: "/images/anugraha.png" 
        },
        { 
            role: "Vice President", 
            name: "Nithin Joseph", 
            image: "/images/nithin.png" 
        },
        { 
            role: "Treasurer", 
            name: "Jibin Thomas", 
            image: "/images/jibinthomas.png" 
        },
    ];

    const councilors = [
        { 
            name: "Binil Babu", 
            role: "Councilor", 
            image: "/images/binil.png" 
        },
        { 
            name: "Joyal B Mathew", 
            role: "Councilor", 
            image: "/images/joyal.png" 
        },
        { 
            name: "Somi Mathew", 
            role: "Councilor", 
            image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" 
        },
    ];

    const committeeMembers = [
        { 
            name: "Ashbin Reji", 
            role: "Committee Member", 
            image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80" 
        },
        { 
            name: "Bijin Mathew", 
            role: "Committee Member", 
            image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80" 
        },
        { 
            name: "Philip David", 
            role: "Committee Member", 
            image: "/images/philp.png" 
        },
        { 
            name: "Anisa Amiyan Kunju", 
            role: "Committee Member", 
            image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80" 
        },
        { 
            name: "Christo Susan Mathew", 
            role: "Committee Member", 
            image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80" 
        },
        { 
            name: "Meedhal Ann Mathew", 
            role: "Committee Member", 
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80" 
        },
        { 
            name: "Shalin Mariam Stephen", 
            role: "Committee Member", 
            image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" 
        },
    ];

    return (
        <div className="home-page">
            {/* Header / Navbar */}
            <header className="home-header">
                <Link to="/" className="home-brand">
                    <div className="home-logo-wrapper">
                        <img
                            src="/images/csi-logo.png"
                            alt="CSI Church logo"
                            className="home-logo"
                            onError={(e) => {
                                // Fallback placeholder if local image doesn't exist yet
                                e.target.src = "https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=100&q=80";
                            }}
                        />
                    </div>
                    <div className="brand-text">
                        <strong>St. Stephen's C.S.I Church</strong>
                        <span>Puthuval</span>
                    </div>
                </Link>

                <Link to="/donation/" className="nav-donate">
                    Donate Now
                </Link>
            </header>

            <main>
                {/* Hero Section */}
                <section className="home-hero">
                    <div className="home-content">
                        <span className="home-badge">
                            FAITH · HOPE · LOVE
                        </span>

                        <h1>
                            Welcome to <br />
                            <span className="highlight">Our Church Community</span>
                        </h1>

                        <p className="home-description">
                            A place to grow in faith, share God's love,
                            and serve our community together in unity and grace.
                        </p>

                        <div className="home-actions">
                            <Link to="/donation/" className="home-donate-button">
                                Make a Donation <span>→</span>
                            </Link>
                        </div>

                        <blockquote className="home-verse">
                            <p>"Let all that you do be done in love."</p>
                            <cite>— 1 Corinthians 16:14</cite>
                        </blockquote>
                    </div>
                </section>

                {/* Youth Team Section */}
                <section className="youth-section">
                    <div className="youth-heading">
                        <span className="home-badge">UNITED IN FAITH</span>
                        <h2>Our Youth Team</h2>
                        <p>
                            Meet the dedicated individuals who lead, support, and serve
                            our church youth community with passion.
                        </p>
                    </div>

                    {/* Officials Group */}
                    <div className="youth-group">
                        <h3 className="group-title">Officials</h3>
                        <div className="youth-grid officials-grid">
                            {officials.map((person) => (
                                <article className="youth-card" key={person.role}>
                                    <div className="youth-avatar-container">
                                        <img 
                                            src={person.image} 
                                            alt={person.name} 
                                            className="youth-avatar-img"
                                        />
                                    </div>
                                    <div className="youth-card-body">
                                        <span className="youth-role">{person.role}</span>
                                        <h4>{person.name}</h4>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    {/* Councilors Group */}
                    <div className="youth-group">
                        <h3 className="group-title">Councilors</h3>
                        <div className="youth-grid">
                            {councilors.map((person) => (
                                <article className="youth-card" key={person.name}>
                                    <div className="youth-avatar-container">
                                        <img 
                                            src={person.image} 
                                            alt={person.name} 
                                            className="youth-avatar-img"
                                        />
                                    </div>
                                    <div className="youth-card-body">
                                        <span className="youth-role">{person.role}</span>
                                        <h4>{person.name}</h4>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    {/* Committee Members Group */}
                    <div className="youth-group">
                        <h3 className="group-title">Committee Members</h3>
                        <div className="youth-grid committee-grid">
                            {committeeMembers.map((person, idx) => (
                                <article className="youth-card" key={`${person.name}-${idx}`}>
                                    <div className="youth-avatar-container">
                                        <img 
                                            src={person.image} 
                                            alt={person.name} 
                                            className="youth-avatar-img"
                                        />
                                    </div>
                                    <div className="youth-card-body">
                                        <span className="youth-role">{person.role}</span>
                                        <h4>{person.name}</h4>
                                    </div>
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

export default Home;