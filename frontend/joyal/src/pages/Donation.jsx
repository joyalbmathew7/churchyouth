
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

function csrfHeaders() {
    const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith("csrftoken="));

    return cookie
        ? { "X-CSRFToken": decodeURIComponent(cookie.slice(10)) }
        : {};
}

async function request(path, body) {
    const response = await fetch(`${API}${path}`, {
        ...(body !== undefined
            ? {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                      ...csrfHeaders(),
                  },
                  body: JSON.stringify(body),
              }
            : {}),
    });

    const isJson = (
        response.headers.get("content-type") || ""
    ).includes("application/json");

    const data = isJson ? await response.json() : {};

    return { ok: response.ok, data };
}

function errorText(data, fallback) {
    if (typeof data === "string") return data;
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.detail === "string") return data.detail;

    if (data && typeof data === "object") {
        const first = Object.values(data)
            .flat()
            .find((value) => typeof value === "string");

        if (first) return first;
    }

    return fallback;
}

function Field({ label, name, optional = false, full = false, children }) {
    return (
        <div className={full ? "field full" : "field"}>
            <label htmlFor={name}>
                {label}{" "}
                {optional ? <small>Optional</small> : <b>*</b>}
            </label>
            {children}
        </div>
    );
}

function Select({ list, placeholder, ...props }) {
    const { items, status } = list;

    const optionText =
        status === "loading"
            ? "Loading…"
            : status === "error"
              ? "Unavailable"
              : items.length
                ? placeholder
                : "None available";

    return (
        <div className="select-wrap">
            <select
                {...props}
                disabled={status !== "loaded" || !items.length}
            >
                <option value="">{optionText}</option>

                {items.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

function loadRazorpayScript() {
    if (window.Razorpay) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        );

        if (existingScript) {
            existingScript.addEventListener("load", resolve, {
                once: true,
            });

            existingScript.addEventListener(
                "error",
                () => reject(
                    new Error("Unable to load Razorpay Checkout.")
                ),
                { once: true }
            );

            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;

        script.onload = resolve;
        script.onerror = () => {
            script.remove();
            reject(
                new Error("Unable to load Razorpay Checkout.")
            );
        };

        document.body.appendChild(script);
    });
}

function Donation() {
    const [form, setForm] = useState(EMPTY_FORM);
    const [lists, setLists] = useState(EMPTY_LISTS);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState("");
    const [message, setMessage] = useState("");
    const [payment, setPayment] = useState(null);

    const submitLock = useRef(false);

    const loadOptions = useCallback(async () => {
        for (const key of Object.keys(EMPTY_LISTS)) {
            try {
                const { ok, data } = await request(`/${key}/`);

                if (!ok || !Array.isArray(data)) {
                    throw new Error("Unable to load options.");
                }

                setLists((current) => ({
                    ...current,
                    [key]: {
                        items: data,
                        status: "loaded",
                    },
                }));
            } catch {
                setLists((current) => ({
                    ...current,
                    [key]: {
                        items: [],
                        status: "error",
                    },
                }));
            }
        }
    }, []);

    useEffect(() => {
        loadOptions();
    }, [loadOptions]);

    function retryLoadOptions() {
        setLists({
            "prayer-areas": { items: [], status: "loading" },
            purposes: { items: [], status: "loading" },
        });

        loadOptions();
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setMessage("");
        setStatus("");
    }

    function bind(name) {
        return {
            id: name,
            name,
            value: form[name],
            onChange: handleChange,
        };
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

    async function verifyPayment(donationId, paymentResponse) {
        const { ok, data } = await request("/donations/verify/", {
            donation_id: donationId,
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
        });

        if (!ok) {
            throw new Error(
                errorText(
                    data,
                    "Payment verification failed. Please contact the church."
                )
            );
        }

        if (data.payment_status !== "success") {
            throw new Error(
                "Payment has not been confirmed by the server yet."
            );
        }

        setPayment({
            donationId,
            amount: data.amount ?? form.amount,
            status: "success",
        });

        setForm(EMPTY_FORM);
        finish(
            "success",
            "Your donation payment has been verified successfully."
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (submitLock.current || payment) return;

        const name = form.name.trim();
        const phone = form.phone_number.trim();
        const area = form.area_place.trim();
        const digits = phone.replace(/\D/g, "");
        const amount = Number(form.amount);

        const problem = !name
            ? "Please enter your full name."
            : !area
              ? "Please enter your address."
              : !/^[+0-9()\s-]+$/.test(phone) ||
                  digits.length < 7 ||
                  digits.length > 20
                ? "Please enter a valid phone number."
                : !Number.isFinite(amount) ||
                    amount < 1 ||
                    amount > 99999999.99
                  ? "Please enter a valid donation amount."
                  : !form.purpose
                    ? "Please select a donation purpose."
                    : "";

        if (problem) {
            notify("error", problem);
            return;
        }

        submitLock.current = true;
        setBusy(true);
        notify("creating", "Preparing your donation payment…");

        try {
            await loadRazorpayScript();

            const { ok, data } = await request("/donations/", {
                ...form,
                name,
                phone_number: phone,
                area_place: area,
                prayer_area: form.prayer_area || null,
                amount: amount.toFixed(2),
            });

            if (!ok) {
                throw new Error(
                    errorText(
                        data,
                        "Unable to create your donation. Please try again."
                    )
                );
            }

            if (
                !data.donation_id ||
                !data.razorpay_order_id ||
                !data.razorpay_key_id ||
                !data.amount
            ) {
                throw new Error(
                    "The payment order details are incomplete. Please contact the church."
                );
            }

            const donationId = data.donation_id;

            const checkout = new window.Razorpay({
                key: data.razorpay_key_id,
                amount: Math.round(Number(data.amount) * 100),
                currency: data.currency || "INR",
                name: "St. Stephen's C.S.I Church, Puthuval",
                description: "Church donation",
                order_id: data.razorpay_order_id,

                prefill: {
                    name,
                    contact: phone,
                },

                notes: {
                    donation_id: String(donationId),
                },

                theme: {
                    color: "#9f1239",
                },

                handler: async (paymentResponse) => {
                    notify(
                        "creating",
                        "Payment received by checkout. Verifying securely…"
                    );

                    try {
                        await verifyPayment(
                            donationId,
                            paymentResponse
                        );
                    } catch (error) {
                        finish(
                            "error",
                            error instanceof Error
                                ? error.message
                                : "Could not verify the payment. Please contact the church."
                        );
                    }
                },

                modal: {
                    ondismiss: () => {
                        finish(
                            "pending",
                            "Checkout was closed. Your donation is not confirmed unless payment is verified."
                        );
                    },
                },
            });

            checkout.on("payment.failed", (response) => {
                finish(
                    "error",
                    response.error?.description ||
                        "Payment failed. You can try again."
                );
            });

            checkout.open();
        } catch (error) {
            finish(
                "error",
                error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again."
            );
        }
    }

    const optionsFailed = Object.values(lists).some(
        (list) => list.status === "error"
    );

    const canSubmit =
        !busy &&
        !payment &&
        lists.purposes.status === "loaded" &&
        lists.purposes.items.length > 0;

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
                        onError={(event) => {
                            event.currentTarget.hidden = true;
                        }}
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
                        <p className="eyebrow">
                            This page is underconstruction
                        </p>

                        <h1>
                            Give with faith.
                            <br />
                            <span>Serve with love.</span>
                        </h1>

                        <p className="hero-description">
                            Your generosity supports the
                            community of St. Stephen&apos;s C.S.I Church,
                            Puthuval.
                        </p>
                    </div>
                </section>

                <section className="donation-layout" id="donation-form">
                    <div className="form-intro">
                        <p className="kicker">Sorry for your inconvience</p>
                        <h2>This page is now underconstruction </h2>
                        <p>
                            Due to razorpay issue, payment cannot work well, but this will be fix as soon as possible
                        </p>
                        <p className="required-note">
                            Fields marked with * are required.
                        </p>
                    </div>

                    <div className="donation-card">
                        {payment?.status === "success" ? (
                            <div className="success-panel" aria-live="polite">
                                <p className="kicker">Payment verified</p>
                                <h2>Thank you for your donation!</h2>

                                <p>
                                    Your payment has been verified by the
                                    server. Thank you for supporting
                                    St. Stephen&apos;s C.S.I Church, Puthuval.
                                </p>

                                <dl className="receipt">
                                    <div>
                                        <dt>Donation amount</dt>
                                        <dd>
                                            ₹
                                            {Number(payment.amount).toLocaleString(
                                                "en-IN",
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }
                                            )}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt>Donation reference</dt>
                                        <dd>{payment.donationId}</dd>
                                    </div>

                                    <div>
                                        <dt>Payment status</dt>
                                        <dd>Verified</dd>
                                    </div>
                                </dl>

                                <button
                                    className="submit-button"
                                    type="button"
                                    onClick={() => {
                                        setPayment(null);
                                        setMessage("");
                                        setStatus("");
                                    }}
                                >
                                    Make another donation
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="form-heading">
                                    <div>
                                        <p className="kicker">
                                            Donation details
                                        </p>
                                        <h2>Tell us about your gift</h2>
                                    </div>

                                    <span className="step">STEP 1 OF 2</span>
                                </div>

                                <div className="field-grid">
                                    <Field
                                        label="Full name"
                                        name="name"
                                        full
                                    >
                                        <input
                                            {...bind("name")}
                                            autoComplete="name"
                                            placeholder="Enter your full name"
                                            maxLength={150}
                                            required
                                        />
                                    </Field>

                                    <Field
                                        label="Phone number"
                                        name="phone_number"
                                    >
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

                                    <Field
                                        label="Address"
                                        name="area_place"
                                    >
                                        <input
                                            {...bind("area_place")}
                                            autoComplete="address-level2"
                                            placeholder="Enter your address"
                                            maxLength={150}
                                            required
                                        />
                                    </Field>

                                    <Field
                                        label="Prayer area"
                                        name="prayer_area"
                                        optional
                                    >
                                        <Select
                                            {...bind("prayer_area")}
                                            list={lists["prayer-areas"]}
                                            placeholder="Choose a prayer area"
                                        />
                                    </Field>

                                    <Field
                                        label="Donation purpose"
                                        name="purpose"
                                    >
                                        <Select
                                            {...bind("purpose")}
                                            list={lists.purposes}
                                            placeholder="Choose a purpose"
                                            required
                                        />
                                    </Field>

                                    <Field
                                        label="Donation amount"
                                        name="amount"
                                        full
                                    >
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

                                        <div
                                            className="chips"
                                            aria-label="Suggested donation amounts"
                                        >
                                            {AMOUNTS.map((amount) => (
                                                <button
                                                    key={amount}
                                                    type="button"
                                                    className={
                                                        form.amount === amount
                                                            ? "chip on"
                                                            : "chip"
                                                    }
                                                    aria-pressed={
                                                        form.amount === amount
                                                    }
                                                    onClick={() =>
                                                        setForm((current) => ({
                                                            ...current,
                                                            amount,
                                                        }))
                                                    }
                                                >
                                                    ₹
                                                    {Number(
                                                        amount
                                                    ).toLocaleString("en-IN")}
                                                </button>
                                            ))}
                                        </div>
                                    </Field>
                                </div>

                                {optionsFailed && (
                                    <div className="msg msg-error" role="status">
                                        Some options could not be loaded.{" "}
                                        <button
                                            type="button"
                                            className="link-btn"
                                            onClick={retryLoadOptions}
                                        >
                                            Try again
                                        </button>
                                    </div>
                                )}

                                {message && (
                                    <div
                                        className={
                                            status === "error"
                                                ? "msg msg-error"
                                                : "msg"
                                        }
                                        role={
                                            status === "error"
                                                ? "alert"
                                                : "status"
                                        }
                                        aria-live="polite"
                                    >
                                        {busy && (
                                            <i
                                                className="spinner"
                                                aria-hidden="true"
                                            />
                                        )}
                                        {message}
                                    </div>
                                )}

                                <button
                                    className="submit-button"
                                    type="submit"
                                    disabled={!canSubmit}
                                >
                                    {busy
                                        ? "Preparing payment…"
                                        : "Continue to Razorpay payment →"}
                                </button>

                                <p className="payment-note">
                                    Your donation is confirmed only after
                                    the payment has been verified by our
                                    server. Please do not close the page
                                    while payment is being verified.
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
