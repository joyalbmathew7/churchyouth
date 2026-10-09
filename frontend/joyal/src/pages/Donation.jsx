import { useCallback, useEffect, useRef, useState } from "react";
import "./Donation.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
    /\/+$/,
    "",
);
const FORMS_API_URL = `${API_BASE_URL}/api/v1/forms`;
const SUGGESTED_AMOUNTS = ["100", "500", "1000", "2000"];

const INITIAL_FORM_DATA = {
    name: "",
    phone_number: "",
    area_place: "",
    prayer_area: "",
    purpose: "",
    amount: "",
};

function getCsrfHeaders() {
    const csrfCookie = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("csrftoken="));
    if (!csrfCookie) return {};

    return {
        "X-CSRFToken": decodeURIComponent(csrfCookie.slice("csrftoken=".length)),
    };
}

async function readResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return response.json();
    }
    return {};
}

function getErrorMessage(data, fallback) {
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data === "string") return data;

    if (data && typeof data === "object") {
        const firstError = Object.values(data)
            .flat()
            .find((value) => typeof value === "string");
        if (firstError) return firstError;
    }

    return fallback;
}

function BrandMark() {
    return (
        <img
            className="brand-mark"
            src="/images/csi-logo.png"
            alt="Church of South India denomination logo"
            onError={(event) => {
                event.currentTarget.hidden = true;
            }}
        />
    );
}

function ShieldIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
                d="M10 2.5 16 5v4.4c0 3.7-2.5 6.8-6 8.1-3.5-1.3-6-4.4-6-8.1V5l6-2.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path
                d="m7.5 9.8 1.7 1.7 3.4-3.6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function SuccessIcon() {
    return (
        <svg viewBox="0 0 56 56" fill="none" aria-hidden="true">
            <circle cx="28" cy="28" r="27" fill="currentColor" opacity=".1" />
            <circle
                cx="28"
                cy="28"
                r="20"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="m19 28.5 6 6 12-13"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function Donation() {
    const [prayerAreas, setPrayerAreas] = useState([]);
    const [purposes, setPurposes] = useState([]);
    const [prayerAreasState, setPrayerAreasState] = useState("loading");
    const [purposesState, setPurposesState] = useState("loading");
    const [paymentResult, setPaymentResult] = useState(null);
    const [pendingPayment, setPendingPayment] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState("");
    const [message, setMessage] = useState("");
    const submissionLock = useRef(false);
    const verificationLock = useRef(false);

    const loadOptions = useCallback(async () => {
        const requests = [
            {
                url: `${FORMS_API_URL}/prayer-areas/`,
                onSuccess: setPrayerAreas,
                onStateChange: setPrayerAreasState,
                fallback: "Prayer areas could not be loaded.",
            },
            {
                url: `${FORMS_API_URL}/purposes/`,
                onSuccess: setPurposes,
                onStateChange: setPurposesState,
                fallback: "Donation purposes could not be loaded.",
            },
        ];

        await Promise.all(
            requests.map(async ({ url, onSuccess, onStateChange, fallback }) => {
                try {
                    const response = await fetch(url);
                    const data = await readResponse(response);
                    if (!response.ok || !Array.isArray(data)) {
                        throw new Error(getErrorMessage(data, fallback));
                    }
                    onSuccess(data);
                    onStateChange("loaded");
                } catch {
                    onStateChange("error");
                }
            }),
        );
    }, []);

    function retryLoadOptions() {
        setPrayerAreasState("loading");
        setPurposesState("loading");
        loadOptions();
    }

    useEffect(() => {
        loadOptions();
    }, [loadOptions]);

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
        setMessage("");
    }

    function finishSubmission(status, nextMessage) {
        submissionLock.current = false;
        verificationLock.current = false;
        setIsSubmitting(false);
        setPaymentStatus(status);
        setMessage(nextMessage);
    }

    async function verifyPayment(payment) {
        if (verificationLock.current) return;
        verificationLock.current = true;
        submissionLock.current = true;
        setIsSubmitting(true);
        setPaymentStatus("verifying");
        setMessage("Confirming your payment with the church.");

        try {
            const response = await fetch(`${FORMS_API_URL}/payments/verify/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify({
                    donation_id: payment.donationId,
                    razorpay_payment_id:
                        payment.response.razorpay_payment_id,
                    razorpay_order_id: payment.response.razorpay_order_id,
                    razorpay_signature: payment.response.razorpay_signature,
                }),
            });
            const data = await readResponse(response);

            if (!response.ok || data.payment_status !== "success") {
                throw new Error(
                    getErrorMessage(
                        data,
                        "We could not confirm this payment yet.",
                    ),
                );
            }

            setPaymentResult({
                donationId: payment.donationId,
                transactionId: data.transaction_id,
                amount: payment.amount,
            });
            setPendingPayment(null);
            setFormData(INITIAL_FORM_DATA);
            finishSubmission("success", "");
        } catch {
            submissionLock.current = false;
            verificationLock.current = false;
            setIsSubmitting(false);
            setPaymentStatus("error");
            setMessage(
                "We couldn’t confirm your payment yet. Please retry verification before making another donation.",
            );
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (submissionLock.current || pendingPayment) return;

        const donorName = formData.name.trim();
        const phoneNumber = formData.phone_number.trim();
        const areaPlace = formData.area_place.trim();
        const phoneDigits = phoneNumber.replace(/\D/g, "");

        if (!donorName) {
            setPaymentStatus("error");
            setMessage("Please enter your full name.");
            return;
        }
        if (!areaPlace) {
            setPaymentStatus("error");
            setMessage("Please enter your area or place.");
            return;
        }
        if (
            !/^[+0-9()\s-]+$/.test(phoneNumber) ||
            phoneDigits.length < 7 ||
            phoneDigits.length > 20
        ) {
            setPaymentStatus("error");
            setMessage("Please enter a valid phone number.");
            return;
        }

        submissionLock.current = true;
        setIsSubmitting(true);
        setPaymentStatus("creating");
        setMessage("Preparing your secure payment…");

        try {
            const response = await fetch(`${FORMS_API_URL}/donations/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify({
                    ...formData,
                    name: donorName,
                    phone_number: phoneNumber,
                    area_place: areaPlace,
                    prayer_area: formData.prayer_area || null,
                }),
            });
            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        data,
                        "Your donation could not be started. Please check your details and try again.",
                    ),
                );
            }

            if (
                !data.donation_id ||
                !data.razorpay_order_id ||
                !data.razorpay_key_id ||
                !window.Razorpay
            ) {
                throw new Error(
                    "Secure payment is temporarily unavailable. Please try again later.",
                );
            }

            setPaymentStatus("checkout");
            setMessage("Opening Razorpay checkout…");

            let verificationStarted = false;
            let checkoutFailed = false;
            const options = {
                key: data.razorpay_key_id,
                amount: data.amount,
                currency: data.currency,
                name: "St. Stephen's C.S.I Church, Puthuval",
                description: "Church donation",
                order_id: data.razorpay_order_id,
                prefill: {
                    name: formData.name,
                    contact: formData.phone_number,
                },
                handler: async (paymentResponse) => {
                    verificationStarted = true;
                    const payment = {
                        donationId: data.donation_id,
                        amount: formData.amount,
                        response: paymentResponse,
                    };
                    setPendingPayment(payment);
                    await verifyPayment(payment);
                },
                modal: {
                    ondismiss: () => {
                        if (
                            submissionLock.current &&
                            !verificationStarted &&
                            !checkoutFailed
                        ) {
                            finishSubmission(
                                "cancelled",
                                "Payment was cancelled. Your donation has not been confirmed.",
                            );
                        }
                    },
                },
                theme: { color: "#702b3a" },
            };

            const checkout = new window.Razorpay(options);
            checkout.on("payment.failed", () => {
                checkoutFailed = true;
                finishSubmission(
                    "error",
                    "The payment could not be completed. Please try again or choose another payment method.",
                );
            });
            checkout.open();
        } catch (error) {
            finishSubmission(
                "error",
                error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again.",
            );
        }
    }

    const isPurposeLoading = purposesState === "loading";
    const canSubmit =
        !isSubmitting &&
        !pendingPayment &&
        !isPurposeLoading &&
        purposes.length > 0;

    return (
        <div className="giving-page">
            <header className="site-header">
                <a
                    className="brand"
                    href="/donation/"
                    aria-label="St. Stephen's C.S.I Church, Puthuval"
                >
                    <BrandMark />
                    <span className="brand-copy">
                        <strong>St. Stephen&apos;s C.S.I Church,</strong>
                        <span>Puthuval</span>
                    </span>
                </a>
                <a className="header-link" href="#donation-form">
                    Make a donation
                    <span aria-hidden="true">↗</span>
                </a>
            </header>

            <main>
                <section className="giving-hero" aria-labelledby="page-title">
                    <div className="hero-copy">
                        <p className="eyebrow">
                            <span className="eyebrow-line" />
                            A generous heart brings people together
                        </p>
                        <h1 id="page-title">
                            Give with faith.
                            <br />
                            <span>Serve with love.</span>
                        </h1>
                        <p className="hero-description">
                            Your generosity supports the ministry and community
                            of St. Stephen&apos;s C.S.I Church, Puthuval.
                        </p>
                        <div className="hero-note">
                            <span className="hero-note-mark" aria-hidden="true">
                                ✳
                            </span>
                            <p>
                                Thank you for sharing in the life and ministry
                                of our church community.
                            </p>
                        </div>
                    </div>

                </section>

                <section
                    className="donation-layout"
                    id="donation-form"
                    aria-labelledby="donation-heading"
                >
                    <div className="form-intro">
                        <p className="section-kicker">Your generosity</p>
                        <h2 id="donation-heading">Make your gift</h2>
                        <p>
                            Share a few details to begin. You’ll review your
                            payment securely with Razorpay in the next step.
                        </p>
                        <div className="form-intro-rule" />
                        <p className="form-intro-small">
                            Fields marked with <span aria-hidden="true">*</span>{" "}
                            are required.
                        </p>
                    </div>

                    <div className="donation-card">
                        {paymentResult ? (
                            <section
                                className="success-panel"
                                aria-labelledby="success-title"
                                aria-live="polite"
                            >
                                <div className="success-icon">
                                    <SuccessIcon />
                                </div>
                                <p className="section-kicker">Gift received</p>
                                <h2 id="success-title">Thank you for giving.</h2>
                                <p className="success-copy">
                                    Your generosity means a great deal to our
                                    church community.
                                </p>
                                <dl className="receipt-details">
                                    <div>
                                        <dt>Donation amount</dt>
                                        <dd>
                                            ₹
                                            {Number(
                                                paymentResult.amount,
                                            ).toLocaleString("en-IN", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Transaction ID</dt>
                                        <dd className="receipt-value">
                                            {paymentResult.transactionId ||
                                                "Confirmed"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Donation reference</dt>
                                        <dd>
                                            {paymentResult.donationId}
                                        </dd>
                                    </div>
                                </dl>
                                <a
                                    className="receipt-button"
                                    href={`${FORMS_API_URL}/donations/${paymentResult.donationId}/receipt/`}
                                >
                                    <svg
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 13.5v2A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5v-2"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    Download PDF receipt
                                </a>
                            </section>
                        ) : (
                            <form className="donation-form" onSubmit={handleSubmit}>
                                <div className="form-heading">
                                    <div>
                                        <p className="section-kicker">
                                            Donation details
                                        </p>
                                        <h2>Tell us about your gift</h2>
                                    </div>
                                    <span className="step-indicator">
                                        STEP 1 OF 2
                                    </span>
                                </div>

                                <div className="field-grid">
                                    <div className="field-group field-full">
                                        <label htmlFor="donor-name">
                                            Full name <span>*</span>
                                        </label>
                                        <input
                                            autoComplete="name"
                                            id="donor-name"
                                            name="name"
                                            placeholder="Enter your full name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            maxLength={150}
                                            required
                                        />
                                    </div>

                                    <div className="field-group">
                                        <label htmlFor="donor-phone">
                                            Phone number <span>*</span>
                                        </label>
                                        <input
                                            autoComplete="tel"
                                            id="donor-phone"
                                            name="phone_number"
                                            type="tel"
                                            inputMode="tel"
                                            placeholder="e.g. +91 98765 43210"
                                            value={formData.phone_number}
                                            onChange={handleChange}
                                            maxLength={20}
                                            pattern=".{7,20}"
                                            title="Enter a phone number with 7 to 20 characters."
                                            required
                                        />
                                    </div>

                                    <div className="field-group">
                                        <label htmlFor="donor-area">
                                            Address <span>*</span>
                                        </label>
                                        <input
                                            autoComplete="address-level2"
                                            id="donor-area"
                                            name="area_place"
                                            placeholder="Enter your address"
                                            value={formData.area_place}
                                            onChange={handleChange}
                                            maxLength={150}
                                            required
                                        />
                                    </div>

                                    <div className="field-group">
                                        <label htmlFor="prayer-area">
                                            Prayer area{" "}
                                            <span className="optional">
                                                Optional
                                            </span>
                                        </label>
                                        <div className="select-wrap">
                                            <select
                                                id="prayer-area"
                                                name="prayer_area"
                                                value={formData.prayer_area}
                                                onChange={handleChange}
                                                disabled={
                                                    prayerAreasState !==
                                                        "loaded" ||
                                                    prayerAreas.length === 0
                                                }
                                            >
                                                <option value="">
                                                    {prayerAreasState ===
                                                    "loading"
                                                        ? "Loading prayer areas…"
                                                        : prayerAreasState ===
                                                            "error"
                                                          ? "Prayer areas unavailable"
                                                          : prayerAreas.length
                                                            ? "Choose a prayer area"
                                                            : "No prayer areas available"}
                                                </option>
                                                {prayerAreas.map((area) => (
                                                    <option
                                                        key={area.id}
                                                        value={area.id}
                                                    >
                                                        {area.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <span aria-hidden="true">⌄</span>
                                        </div>
                                        {prayerAreasState === "error" && (
                                            <p
                                                className="field-help-error"
                                                role="status"
                                            >
                                                Prayer areas are unavailable.{" "}
                                                <button
                                                    type="button"
                                                    onClick={retryLoadOptions}
                                                >
                                                    Retry
                                                </button>
                                            </p>
                                        )}
                                    </div>

                                    <div className="field-group">
                                        <label htmlFor="donation-purpose">
                                            Donation purpose <span>*</span>
                                        </label>
                                        <div className="select-wrap">
                                            <select
                                                id="donation-purpose"
                                                name="purpose"
                                                value={formData.purpose}
                                                onChange={handleChange}
                                                required
                                                disabled={
                                                    purposesState !== "loaded" ||
                                                    purposes.length === 0
                                                }
                                            >
                                                <option value="">
                                                    {isPurposeLoading
                                                        ? "Loading purposes…"
                                                        : purposesState ===
                                                            "error"
                                                          ? "Purposes unavailable"
                                                          : purposes.length
                                                            ? "Choose a purpose"
                                                            : "No purposes available"}
                                                </option>
                                                {purposes.map((purpose) => (
                                                    <option
                                                        key={purpose.id}
                                                        value={purpose.id}
                                                    >
                                                        {purpose.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <span aria-hidden="true">⌄</span>
                                        </div>
                                    </div>

                                    <div className="field-group field-full">
                                        <label htmlFor="donation-amount">
                                            Donation amount <span>*</span>
                                        </label>
                                        <div className="amount-input">
                                            <span aria-hidden="true">₹</span>
                                            <input
                                                id="donation-amount"
                                                name="amount"
                                                type="number"
                                                inputMode="decimal"
                                                placeholder="Enter amount"
                                                value={formData.amount}
                                                onChange={handleChange}
                                                min="1"
                                                max="99999999.99"
                                                step="0.01"
                                                required
                                            />
                                            <span className="amount-currency">
                                                INR
                                            </span>
                                        </div>
                                        <div
                                            className="suggested-amounts"
                                            aria-label="Suggested donation amounts"
                                        >
                                            {SUGGESTED_AMOUNTS.map((amount) => (
                                                <button
                                                    className={
                                                        formData.amount ===
                                                        amount
                                                            ? "amount-chip is-selected"
                                                            : "amount-chip"
                                                    }
                                                    key={amount}
                                                    type="button"
                                                    aria-pressed={
                                                        formData.amount ===
                                                        amount
                                                    }
                                                    onClick={() =>
                                                        setFormData(
                                                            (current) => ({
                                                                ...current,
                                                                amount,
                                                            }),
                                                        )
                                                    }
                                                >
                                                    ₹
                                                    {Number(
                                                        amount,
                                                    ).toLocaleString("en-IN")}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {purposesState === "error" && (
                                    <div className="option-error" role="status">
                                        Donation purposes couldn’t be loaded.{" "}
                                        <button
                                            type="button"
                                            onClick={retryLoadOptions}
                                        >
                                            Try again
                                        </button>
                                    </div>
                                )}

                                {paymentStatus === "error" &&
                                    pendingPayment && (
                                        <div className="verification-retry">
                                            <p role="alert">{message}</p>
                                            <button
                                                type="button"
                                                className="retry-button"
                                                disabled={isSubmitting}
                                                onClick={() =>
                                                    verifyPayment(pendingPayment)
                                                }
                                            >
                                                {isSubmitting
                                                    ? "Verifying payment…"
                                                    : "Retry payment verification"}
                                            </button>
                                        </div>
                                    )}

                                {message && !pendingPayment && (
                                    <div
                                        className={`form-message message-${paymentStatus}`}
                                        role={
                                            paymentStatus === "error"
                                                ? "alert"
                                                : "status"
                                        }
                                        aria-live="polite"
                                    >
                                        {isSubmitting && (
                                            <span
                                                className="status-spinner"
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
                                    <span>
                                        {isSubmitting
                                            ? paymentStatus === "verifying"
                                                ? "Verifying payment…"
                                                : "Preparing payment…"
                                            : pendingPayment
                                              ? "Payment confirmation needed"
                                              : "Continue to secure payment"}
                                    </span>
                                    {!isSubmitting && !pendingPayment && (
                                        <span
                                            className="button-arrow"
                                            aria-hidden="true"
                                        >
                                            →
                                        </span>
                                    )}
                                </button>

                                <p className="payment-note">
                                    <ShieldIcon />
                                    <span>
                                        You’ll complete payment through
                                        Razorpay checkout. Your card and UPI
                                        details are not collected on this page.
                                    </span>
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
