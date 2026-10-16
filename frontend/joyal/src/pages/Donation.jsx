import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Donation.css";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "")}/api/v1/forms`;
const AMOUNTS = ["100", "500", "1000", "2000"];
const EMPTY_FORM = {
    name: "",
    phone_number: "",
    area_place: "",
    prayer_area: "",
    purpose: "",
    amount: "",
};
const EMPTY_LISTS = {
    "prayer-areas": { items: [], status: "loading" },
    purposes: { items: [], status: "loading" },
};

/* ---------- helpers ---------- */

function csrfHeaders() {
    const cookie = document.cookie
        .split("; ")
        .find((c) => c.startsWith("csrftoken="));
    return cookie ? { "X-CSRFToken": decodeURIComponent(cookie.slice(10)) } : {};
}

// GET when no body is given, POST (JSON) otherwise
async function request(path, body) {
    const response = await fetch(
        `${API}${path}`,
        body && {
            method: "POST",
            headers: { "Content-Type": "application/json", ...csrfHeaders() },
            body: JSON.stringify(body),
        },
    );
    const isJson = (response.headers.get("content-type") || "").includes(
        "application/json",
    );
    return { ok: response.ok, data: isJson ? await response.json() : {} };
}

function errorText(data, fallback) {
    if (typeof data === "string") return data;
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.detail === "string") return data.detail;
    const first =
        data && typeof data === "object"
            ? Object.values(data).flat().find((v) => typeof v === "string")
            : null;
    return first || fallback;
}

/* ---------- small components ---------- */

function Field({ label, name, optional, full, children }) {
    return (
        <div className={full ? "field full" : "field"}>
            <label htmlFor={name}>
                {label} {optional ? <small>Optional</small> : <b>*</b>}
            </label>
            {children}
        </div>
    );
}

function Select({ list, placeholder, ...props }) {
    const { items, status } = list;
    const text =
        status === "loading"
            ? "Loading…"
            : status === "error"
              ? "Unavailable"
              : items.length
                ? placeholder
                : "None available";

    return (
        <div className="select-wrap">
            <select {...props} disabled={status !== "loaded" || !items.length}>
                <option value="">{text}</option>
                {items.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

/* ---------- page ---------- */

function Donation() {
    const [form, setForm] = useState(EMPTY_FORM);
    const [lists, setLists] = useState(EMPTY_LISTS);
const [upiPayment, setUpiPayment] = useState(null);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState("");
    const [message, setMessage] = useState("");
    const submitLock = useRef(false);

    const loadOptions = useCallback(() => {
        Object.keys(EMPTY_LISTS).forEach(async (key) => {
            try {
                const { ok, data } = await request(`/${key}/`);
                if (!ok || !Array.isArray(data)) throw new Error();
                setLists((cur) => ({ ...cur, [key]: { items: data, status: "loaded" } }));
            } catch {
                setLists((cur) => ({ ...cur, [key]: { items: [], status: "error" } }));
            }
        });
    }, []);

    useEffect(() => {
        loadOptions();
    }, [loadOptions]);

    function retryLoadOptions() {
        setLists(EMPTY_LISTS);
        loadOptions();
    }

    const bind = (name) => ({ id: name, name, value: form[name], onChange: handleChange });

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((cur) => ({ ...cur, [name]: value }));
        setMessage("");
    }

    function notify(type, text) {
        setStatus(type);
        setMessage(text);
    }

function finish(type, text) {
    submitLock.current = false;
    setBusy(false);
    notify(type, text);
}


async function handleSubmit(event) {
    event.preventDefault();

    if (submitLock.current || upiPayment) return;

    const name = form.name.trim();
    const phone = form.phone_number.trim();
    const area = form.area_place.trim();
    const digits = phone.replace(/\D/g, "");

    const problem = !name
        ? "Please enter your full name."
        : !area
          ? "Please enter your area or place."
          : !/^[+0-9()\s-]+$/.test(phone) ||
              digits.length < 7 ||
              digits.length > 20
            ? "Please enter a valid phone number."
            : "";

    if (problem) {
        notify("error", problem);
        return;
    }

    submitLock.current = true;
    setBusy(true);
    notify("creating", "Creating your donation record...");

    try {
        const { ok, data } = await request("/donations/", {
            ...form,
            name,
            phone_number: phone,
            area_place: area,
            prayer_area: form.prayer_area || null,
        });

        if (!ok) {
            throw new Error(
                errorText(
                    data,
                    "Your donation could not be created. Please try again.",
                ),
            );
        }

        if (!data.donation_id || !data.upi_payment_url) {
            throw new Error(
                "The UPI payment link was not returned. Please contact the church.",
            );
        }

        setUpiPayment({
            donationId: data.donation_id,
            amount: data.amount,
            url: data.upi_payment_url,
        });

        setForm(EMPTY_FORM);
        finish(
            "pending",
            "Your donation record has been created. Payment is not yet confirmed.",
        );
    } catch (error) {
        finish(
            "error",
            error instanceof Error
                ? error.message
                : "Something went wrong. Please try again.",
        );
    }
}

    

    const optionsFailed = Object.values(lists).some((l) => l.status === "error");
    const canSubmit = !busy && !upiPayment && lists.purposes.items.length > 0;
    return (
        <div className="giving-page">
            <header className="site-header">
                <Link
                    to="/"
                    className="brand"
                    aria-label="St. Stephen's C.S.I Church, Puthuval"
                >
                    <img
                        src="/images/csi-logo.png"
                        alt=""
                        onError={(e) => (e.currentTarget.hidden = true)}
                    />
                    <span>
                        <strong>St. Stephen&apos;s C.S.I Church,</strong>
                        <small>Puthuval</small>
                    </span>
                </Link>

                <nav className="header-actions">
                    <a href="#donation-form">Make a donation ↗</a>
                    <Link to="/" className="home-btn">
                        Home
                    </Link>
                </nav>
            </header>

            <main>
                <section className="giving-hero">
                    <div className="hero-copy">
                        <p className="eyebrow">A generous heart brings people together</p>
                        <h1>
                            Give with faith.
                            <br />
                            <span>Serve with love.</span>
                        </h1>
                        <p className="hero-description">
                            Your generosity supports the ministry and community of
                            St. Stephen&apos;s C.S.I Church, Puthuval.
                        </p>
                    </div>
                </section>

                <section className="donation-layout" id="donation-form">
                    <div className="form-intro">
                        <p className="kicker">Your generosity</p>
                        <h2>Make your gift</h2>
                        <p>
                            Share a few details to begin. You’ll review your payment
                            securely with Razorpay in the next step.
                        </p>
                        <p className="required-note">Fields marked with * are required.</p>
                    </div>

                    <div className="donation-card">
                        {upiPayment ? (
    <div className="success-panel" aria-live="polite">
        <p className="kicker">Donation created</p>
        <h2>Complete your UPI payment</h2>

        <p>
            Your donation record has been saved, but your payment
            has not yet been verified by the church.
        </p>

        <dl className="receipt">
            <div>
                <dt>Donation amount</dt>
                <dd>
                    ₹
                    {Number(upiPayment.amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}
                </dd>
            </div>

            <div>
                <dt>Donation reference</dt>
                <dd>{upiPayment.donationId}</dd>
            </div>

            <div>
                <dt>Payment status</dt>
                <dd>Pending verification</dd>
            </div>
        </dl>

        <a className="submit-button" href={upiPayment.url}>
            Pay with UPI →
        </a>

        <p className="payment-note">
            Your UPI app should open with the amount prefilled.
            Check the recipient and amount before approving payment.
            The church must verify the transaction before issuing
            your confirmed receipt.
        </p>
    </div>


                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="form-heading">
                                    <div>
                                        <p className="kicker">Donation details</p>
                                        <h2>Tell us about your gift</h2>
                                    </div>
                                    <span className="step">STEP 1 OF 2</span>
                                </div>

                                <div className="field-grid">
                                    <Field label="Full name" name="name" full>
                                        <input
                                            {...bind("name")}
                                            autoComplete="name"
                                            placeholder="Enter your full name"
                                            maxLength={150}
                                            required
                                        />
                                    </Field>

                                    <Field label="Phone number" name="phone_number">
                                        <input
                                            {...bind("phone_number")}
                                            type="tel"
                                            inputMode="tel"
                                            autoComplete="tel"
                                            placeholder="e.g. +91 98765 43210"
                                            maxLength={20}
                                            pattern=".{7,20}"
                                            title="Enter a phone number with 7 to 20 characters."
                                            required
                                        />
                                    </Field>

                                    <Field label="Address" name="area_place">
                                        <input
                                            {...bind("area_place")}
                                            autoComplete="address-level2"
                                            placeholder="Enter your address"
                                            maxLength={150}
                                            required
                                        />
                                    </Field>

                                    <Field label="Prayer area" name="prayer_area" optional>
                                        <Select
                                            {...bind("prayer_area")}
                                            list={lists["prayer-areas"]}
                                            placeholder="Choose a prayer area"
                                        />
                                    </Field>

                                    <Field label="Donation purpose" name="purpose">
                                        <Select
                                            {...bind("purpose")}
                                            list={lists.purposes}
                                            placeholder="Choose a purpose"
                                            required
                                        />
                                    </Field>

                                    <Field label="Donation amount" name="amount" full>
                                        <div className="amount-input">
                                            <span>₹</span>
                                            <input
                                                {...bind("amount")}
                                                type="number"
                                                inputMode="decimal"
                                                placeholder="Enter amount"
                                                min="1"
                                                max="99999999.99"
                                                step="0.01"
                                                required
                                            />
                                            <small>INR</small>
                                        </div>
                                        <div className="chips" aria-label="Suggested donation amounts">
                                            {AMOUNTS.map((amount) => (
                                                <button
                                                    key={amount}
                                                    type="button"
                                                    className={
                                                        form.amount === amount ? "chip on" : "chip"
                                                    }
                                                    aria-pressed={form.amount === amount}
                                                    onClick={() =>
                                                        setForm((cur) => ({ ...cur, amount }))
                                                    }
                                                >
                                                    ₹{Number(amount).toLocaleString("en-IN")}
                                                </button>
                                            ))}
                                        </div>
                                    </Field>
                                </div>

                                {optionsFailed && (
                                    <div className="msg msg-error" role="status">
                                        Some options couldn’t be loaded.{" "}
                                        <button type="button" className="link-btn" onClick={retryLoadOptions}>
                                            Try again
                                        </button>
                                    </div>
                                )}
{message && (
    <div
        className={status === "error" ? "msg msg-error" : "msg"}
        role={status === "error" ? "alert" : "status"}
        aria-live="polite"
    >
        {busy && <i className="spinner" aria-hidden="true" />}
        {message}
    </div>
)}
{message && (
    <div
        className={status === "error" ? "msg msg-error" : "msg"}
        role={status === "error" ? "alert" : "status"}
        aria-live="polite"
    >
        {busy && <i className="spinner" aria-hidden="true" />}
        {message}
    </div>
)}

                                <button className="submit-button" type="submit" disabled={!canSubmit}>
{busy ? "Creating donation..." : "Continue to UPI payment →"}
                                </button>

                                <p className="payment-note">
   Payments are verified manually by the church. Submitting this
    form or opening a UPI app does not confirm that payment succeeded.
                                </p>
                            </form>
                        )}
                    </div>
                </section>
            </main>

            <footer className="site-footer">
                <p>Given with gratitude. Received with care.</p>
                <span>St. Stephen&apos;s C.S.I Church, Puthuval</span>
            </footer>
        </div>
    );
}

export default Donation;