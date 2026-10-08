import razorpay

from django.conf import settings


client = razorpay.Client(
    auth=(
        settings.RAZORPAY_KEY_ID,
        settings.RAZORPAY_KEY_SECRET,
    )
)


def create_razorpay_order(amount, receipt):
    amount_in_paise = int(amount * 100)

    order = client.order.create(
        {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": receipt,
        }
    )

    return order


def verify_payment(payment_data):
    client.utility.verify_payment_signature(payment_data)