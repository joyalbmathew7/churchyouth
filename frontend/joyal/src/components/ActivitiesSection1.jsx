import { Link } from "react-router-dom";
import activities from "./Activities";

function ActivitiesSection() {
    return (
        <section className="activities-section">
            <div className="youth-heading">
                <span className="home-badge">2026 - 2027</span>
                <h2>Youth Activities</h2>
                <p>Tap an activity to see the photos and read more about it.</p>
            </div>

            <div className="activities-grid">
                {activities.map((item) => (
                    <Link
                        to={`/activities/${item.id}`}
                        className="activity-card"
                        key={item.id}
                    >
                        <div className="activity-thumb">
                            <img src={item.cover} alt={item.title} loading="lazy" />
                        </div>
                        <div className="activity-body">
                            <h4>{item.title}</h4>
                            <span className="activity-link">View →</span>
                        </div>
                    </Link>
                ))}
            </div>

        </section>
    );
}

export default ActivitiesSection;