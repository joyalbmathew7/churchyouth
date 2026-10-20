import { Link } from "react-router-dom";
import "./Home.css";

import SocialMedia from "../components/SocialMedia";
import Header from "../components/Header";
import ActivitiesSection from "../components/ActivitiesSection";
import ChurchInformation from "../components/ChurchInformation";
import FlappyGame from "../components/FlappyGame";

function Home() {
    const officials = [
        {
            role: "President",
            name: "Rev. Jiji Joseph",
            image: "https://r2-pub.csimadhyakeraladiocese.org/images/7c50b3a4-7fe7-45b7-a6a3-d679115c715a.png",
        },
        {
            role: "Secretary",
            name: "Shalom George Koshy",
            image: "/images/shalom.png",
        },
        {
            role: "Joint Secretary",
            name: "Anugraha Ann Bobby",
            image: "/images/anugraha.png",
        },
        {
            role: "Vice President",
            name: "Nithin Joseph",
            image: "/images/nithin.png",
        },
        {
            role: "Treasurer",
            name: "Jibin Thomas",
            image: "/images/jibinthomas.png",
        },
    ];

    const councilors = [
        {
            name: "Binil Babu",
            role: "Councilor",
            image: "/images/binil.png",
        },
        {
            name: "Allen Robby",
            role: "Councilor",
            image: "/images/alan.png",
        },
        {
            name: "Joyal B Mathew",
            role: "Councilor",
            image: "/images/joyal.png",
        },
        {
            name: "Somi Mathew",
            role: "Councilor",
            image: "/images/somi.png",
        },
    ];

    const committeeMembers = [
        {
            name: "Ashbin Reji",
            role: "Committee Member",
            image: "/images/ashbin.png",
        },
        {
            name: "Bijin Mathew",
            role: "Committee Member",
            image: "/images/bijin.png",
        },
        {
            name: "Philip David",
            role: "Committee Member",
            image: "/images/philp.png",
        },
        {
            name: "Anisa Amiyan Kunju",
            role: "Committee Member",
            image: "/images/aneesa.jpeg",
        },
        {
            name: "Christo Susan Mathew",
            role: "Committee Member",
            image: "/images/christo.jpeg",
        },
        {
            name: "Meedhal Ann Mathew",
            role: "Committee Member",
            image: "/images/meethal.png",
        },
        {
            name: "Shalin Mariam Stephen",
            role: "Committee Member",
            image: "/images/shalin.png",
        },
        {
            name: "Ajoop Daniel",
            role: "Committee Member",
            image: "/images/ajoop.jpeg",
        },
    ];

    return (
        <div className="home-page">
            <Header />

            <main>
                {/* Youth Activities - directly below the navbar */}
                <ActivitiesSection />

                {/* Welcome / Hero Section */}
                <section className="home-hero">
                    <div className="home-content">
                        <span className="home-badge">
                            FAITH · HOPE · LOVE
                        </span>

                        <h1>
                            Welcome to <br />
                            <span className="highlight">
                                St. Stephen's CSI Church Youth Movement
                            </span>
                        </h1>
                        <FlappyGame />
                        <p className="home-description">
                            A place to grow in faith, share God's love,
                            and serve our community together in unity and grace.
                        </p>

                        <div className="home-actions">
                            <Link
                                to="/donation/"
                                className="home-donate-button"
                            >
                                Make a Donation <span>→</span>
                            </Link>
                        </div>

                        <blockquote className="home-verse">
                            <p>
                                "Let all that you do be done in love."
                            </p>
                            <cite>— 1 Corinthians 16:14</cite>
                        </blockquote>
                    </div>
                </section>

                {/* Youth Team Section */}
                <section className="youth-section">
                    <div className="youth-heading">
                        <span className="home-badge">
                            UNITED IN FAITH
                        </span>

                        <h2>2026 - 2027 Youth Officials and Members</h2>

                        <p>
                            Meet the dedicated individuals who lead, support,
                            and serve our church youth community with passion.
                        </p>
                    </div>

                    {/* Officials */}
                    <div className="youth-group">
                        <h3 className="group-title">Officials</h3>

                        <div className="youth-grid officials-grid">
                            {officials.map((person) => (
                                <article
                                    className="youth-card"
                                    key={person.role}
                                >
                                    <div className="youth-avatar-container">
                                        <img
                                            src={person.image}
                                            alt={person.name}
                                            className="youth-avatar-img"
                                        />
                                    </div>

                                    <div className="youth-card-body">
                                        <span className="youth-role">
                                            {person.role}
                                        </span>
                                        <h4>{person.name}</h4>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    {/* Councilors */}
                    <div className="youth-group">
                        <h3 className="group-title">Councilors</h3>

                        <div className="youth-grid">
                            {councilors.map((person) => (
                                <article
                                    className="youth-card"
                                    key={person.name}
                                >
                                    <div className="youth-avatar-container">
                                        <img
                                            src={person.image}
                                            alt={person.name}
                                            className="youth-avatar-img"
                                        />
                                    </div>

                                    <div className="youth-card-body">
                                        <span className="youth-role">
                                            {person.role}
                                        </span>
                                        <h4>{person.name}</h4>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    {/* Committee Members */}
                    <div className="youth-group">
                        <h3 className="group-title">
                            Committee Members
                        </h3>

                        <div className="youth-grid committee-grid">
                            {committeeMembers.map((person, idx) => (
                                <article
                                    className="youth-card"
                                    key={`${person.name}-${idx}`}
                                >
                                    <div className="youth-avatar-container">
                                        <img
                                            src={person.image}
                                            alt={person.name}
                                            className="youth-avatar-img"
                                        />
                                    </div>

                                    <div className="youth-card-body">
                                        <span className="youth-role">
                                            {person.role}
                                        </span>
                                        <h4>{person.name}</h4>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <ChurchInformation />
            <SocialMedia />

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-content">
                    <p>St. Stephen's C.S.I Church, Puthuval</p>
                    <span>
                        Serving God and our community with love.
                    </span>
                </div>
            </footer>
        </div>
    );
}

export default Home;
