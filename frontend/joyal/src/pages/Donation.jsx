import { useEffect, useState } from "react";

function Donation() {
    const [prayerAreas, setPrayerAreas] = useState([]);
    const [purposes, setPurposes] = useState([]);
    const [paymentResult, setPaymentResult] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        phone_number: "",
        area_place: "",
        prayer_area: "",
        purpose: "",
        amount: "",
    });

    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/v1/forms/prayer-areas/")
            .then((response) => response.json())
            .then((data) => setPrayerAreas(data));

        fetch("http://127.0.0.1:8000/api/v1/forms/purposes/")
            .then((response) => response.json())
            .then((data) => setPurposes(data));
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value,
        });
    }

    async function handleSubmit(event) {
    event.preventDefault();

    setMessage("Creating payment...");

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/api/v1/forms/donations/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    prayer_area:
                        formData.prayer_area || null,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            setMessage(JSON.stringify(data));
            return;
        }

        const options = {
            key: data.razorpay_key_id,

            amount: data.amount,

            currency: data.currency,

            name: "Your Church",

            description: "Church Donation",

            order_id: data.razorpay_order_id,

            prefill: {
                name: formData.name,
                contact: formData.phone_number,
            },

            handler: async function (paymentResponse) {
                setMessage("Verifying payment...");

                const verifyResponse = await fetch(
                    "http://127.0.0.1:8000/api/v1/forms/payments/verify/",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                        },

                        body: JSON.stringify({
                            donation_id:
                                data.donation_id,

                            razorpay_payment_id:
                                paymentResponse.razorpay_payment_id,

                            razorpay_order_id:
                                paymentResponse.razorpay_order_id,

                            razorpay_signature:
                                paymentResponse.razorpay_signature,
                        }),
                    }
                );

                const verifyData =
                    await verifyResponse.json();

                if (verifyResponse.ok) {
                    setPaymentResult({
                        donationId: data.donation_id,
                        transactionId:
                            verifyData.transaction_id,
                        amount: formData.amount,
                    });

                    setMessage("");
                }
                 else {
                    setMessage(
                        verifyData.error ||
                            "Payment verification failed."
                    );
                }
            },

            modal: {
                ondismiss: function () {
                    setMessage(
                        "Payment was cancelled."
                    );
                },
            },

            theme: {
                color: "#000000",
            },
        };

        const razorpay = new window.Razorpay(options);

        razorpay.open();
    } catch (error) {
        console.error(error);

        setMessage(
            "Something went wrong. Please try again."
        );
    }
}

    return (
        <div>
            <h1>Make a Donation</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Phone Number</label>
                    <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Area / Place</label>
                    <input
                        type="text"
                        name="area_place"
                        value={formData.area_place}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Prayer Area</label>

                    <select
                        name="prayer_area"
                        value={formData.prayer_area}
                        onChange={handleChange}
                    >
                        <option value="">
                            Select Prayer Area
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
                </div>

                <div>
                    <label>Donation Purpose</label>

                    <select
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleChange}
                        required
                    >
                        <option value="">
                            Select Purpose
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
                </div>

                <div>
                    <label>Amount</label>

                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        min="1"
                        step="0.01"
                        required
                    />
                </div>

                <button type="submit">
                    Continue to Payment
                </button>
            </form>

            {message && <p>{message}</p>}

                {paymentResult && (
                    <div>
                        <h2>✅ Donation Successful</h2>

                        <p>
                            Thank you for your generous donation.
                        </p>

                        <p>
                            <strong>Amount:</strong>{" "}
                            ₹{paymentResult.amount}
                        </p>

                        <p>
                            <strong>Transaction ID:</strong>{" "}
                            {paymentResult.transactionId}
                        </p>

                        <a
                            href={`http://127.0.0.1:8000/api/v1/forms/donations/${paymentResult.donationId}/receipt/`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Download PDF Receipt
                        </a>
                    </div>
                )}
        </div>
    );
}

export default Donation;