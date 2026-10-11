
import { Link } from "react-router-dom";
import "./SocialMedia.css";

function SocialMedia() {
    return (
        <section className="social-media-section">
            <div className="social-media-content">
                <span className="social-media-badge">
                    STAY CONNECTED
                </span>

                <h2>Connect With Our Church</h2>

                <p>
                    Find our church, follow us on social media,
                    and stay connected with our church community.
                </p>

                <Link to="/connect" className="social-media-button">
                    Explore & Connect <span>→</span>
                </Link>
            </div>
        </section>
    );
}

export default SocialMedia;