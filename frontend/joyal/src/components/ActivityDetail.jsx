import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import activities from "./Activities";
import "./ActivityDetail.css";

function ActivityDetail() {
    const { id } = useParams();
    const activity = activities.find((a) => a.id === id);
    const [index, setIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const total = activity ? activity.images.length : 0;

    const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
    const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);

    useEffect(() => {
        setIndex(0);
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (!total) return;
        const onKey = (e) => {
            if (isModalOpen) {
                if (e.key === "Escape") setIsModalOpen(false);
                return;
            }
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [total, next, prev, isModalOpen]);

    if (!activity) {
        return (
            <div className="home-page">
                <Header />
                <section className="activity-detail-page">
                    <h2 className="activity-detail-title">Activity not found</h2>
                    <Link to="/" className="activity-detail-back">← Back to Home</Link>
                </section>
            </div>
        );
    }

    return (
        <div className="home-page">
            <Header />

            <section className="activity-detail-page">
                <Link to="/" className="activity-detail-back">← Back to Home</Link>

                <div className="activity-detail-head">
                    <span className="home-badge">YOUTH ACTIVITY</span>
                    <h2 className="activity-detail-title">{activity.title}</h2>
                    <div className="activity-detail-meta">
                        <span>📅 {activity.date}</span>
                        {activity.location && <span>📍 {activity.location}</span>}
                    </div>
                </div>

                <div className="activity-detail-slider">
                    <button
                        type="button"
                        className="activity-detail-arrow activity-detail-arrow-left"
                        onClick={prev}
                        aria-label="Previous photo"
                    >
                        ‹
                    </button>

                    <img
                        key={activity.images[index]}
                        src={activity.images[index]}
                        alt={`${activity.title} ${index + 1}`}
                        className="activity-detail-main-img"
                        style={{ cursor: "zoom-in" }}
                        onClick={() => setIsModalOpen(true)}
                        title="Click to enlarge"
                    />

                    <button
                        type="button"
                        className="activity-detail-arrow activity-detail-arrow-right"
                        onClick={next}
                        aria-label="Next photo"
                    >
                        ›
                    </button>

                    <span className="activity-detail-counter">{index + 1} / {total}</span>
                </div>

                <div className="activity-detail-thumbs">
                    {activity.images.map((src, i) => (
                        <button
                            type="button"
                            key={src}
                            className={`activity-detail-thumb ${i === index ? "active" : ""}`}
                            onClick={() => setIndex(i)}
                            aria-label={`Show photo ${i + 1}`}
                        >
                            <img src={src} alt="" loading="lazy" />
                        </button>
                    ))}
                </div>

                <div className="activity-detail-text">
                    <h3>About this activity</h3>
                    <p>{activity.description}</p>
                </div>
            </section>

            {/* Fullscreen Lightbox Modal */}
            {isModalOpen && (
                <div className="image-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button 
                            type="button" 
                            className="image-modal-close" 
                            onClick={() => setIsModalOpen(false)}
                            aria-label="Close enlarged photo"
                        >
                            &times;
                        </button>
                        <img src={activity.images[index]} alt={`${activity.title} enlarged`} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default ActivityDetail;