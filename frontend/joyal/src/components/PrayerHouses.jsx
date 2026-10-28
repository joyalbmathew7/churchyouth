import { useEffect, useState } from "react";
import "./PrayerHouses.css";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "https://churchyouth.onrender.com";

function PrayerHouses() {
    const [categories, setCategories] = useState([]);
    const [prayerHouses, setPrayerHouses] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPrayerHouses = async () => {
            try {
                setLoading(true);
                setError("");

                const [categoriesResponse, housesResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/v1/prayerhouses/categories/`),
                    fetch(`${API_BASE_URL}/api/v1/prayerhouses/`),
                ]);

                if (!categoriesResponse.ok || !housesResponse.ok) {
                    throw new Error("Unable to load prayer house details.");
                }

                const categoriesData = await categoriesResponse.json();
                const housesData = await housesResponse.json();

                setCategories(categoriesData);
                setPrayerHouses(housesData);
            } catch (err) {
                setError(
                    err.message ||
                        "Something went wrong while loading prayer houses."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPrayerHouses();
    }, []);

    const filteredHouses =
        selectedCategory === "all"
            ? prayerHouses
            : prayerHouses.filter(
                  (house) => String(house.category) === selectedCategory
              );

    return (
        <main className="prayer-houses-page">
            <section className="prayer-houses-hero">
                <span className="prayer-houses-label">
                    ST. STEPHEN'S C.S.I CHURCH
                </span>

                <h1>Prayer Houses</h1>

                <p>
                    Find prayer meetings, connect with fellow members, and grow
                    together in faith.
                </p>
            </section>

            <section className="prayer-houses-content">
                <div className="prayer-houses-heading">
                    <div>
                        <h2>Upcoming Prayer Meetings</h2>
                        <p>
                            Explore meetings organized by prayer house category.
                        </p>
                    </div>

                    <label className="prayer-category-filter">
                        <span>Category</span>

                        <select
                            value={selectedCategory}
                            onChange={(event) =>
                                setSelectedCategory(event.target.value)
                            }
                        >
                            <option value="all">All Categories</option>

                            {categories.map((category) => (
                                <option
                                    key={category.id}
                                    value={String(category.id)}
                                >
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {loading && (
                    <p className="prayer-houses-message">
                        Loading prayer meetings...
                    </p>
                )}

                {!loading && error && (
                    <div className="prayer-houses-message prayer-houses-error">
                        <p>{error}</p>
                        <p>
                            Please check your connection and try again later.
                        </p>
                    </div>
                )}

                {!loading && !error && filteredHouses.length === 0 && (
                    <div className="prayer-houses-empty">
                        <h3>No prayer meetings found</h3>
                        <p>
                            There are no meetings available in this category
                            right now. Please check again later.
                        </p>
                    </div>
                )}

                {!loading && !error && filteredHouses.length > 0 && (
                    <div className="prayer-houses-grid">
                        {filteredHouses.map((house) => (
                            <article
                                className="prayer-house-card"
                                key={house.id}
                            >
                                <div className="prayer-house-card-top">
                                    <span className="prayer-house-category">
                                        {house.category_name}
                                    </span>

                                    <span
                                        className="prayer-house-icon"
                                        aria-hidden="true"
                                    >
                                        ✝
                                    </span>
                                </div>

                                <h3>{house.house_name}</h3>

                                <div className="prayer-house-details">
                                    <p>
                                        <strong>Host:</strong>{" "}
                                        {house.host_member_name}
                                    </p>

                                    <p>
                                        <strong>Meeting date:</strong>{" "}
                                        {new Date(
                                            `${house.meeting_date}T00:00:00`
                                        ).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>

                                {house.notes && (
                                    <p className="prayer-house-notes">
                                        {house.notes}
                                    </p>
                                )}

                                {house.location_link && (
                                    <a
                                        className="prayer-house-location"
                                        href={house.location_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View Location ↗
                                    </a>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default PrayerHouses;