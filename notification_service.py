"""
AquaSentinel notification service.

Provider-neutral notification layer for dashboard, SMS and future voice/push.
SMS is optional and only activates when the required environment variables
are configured. Until then, the service safely logs the event instead of
breaking risk analysis.
"""

import logging
import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("aquasentinel.notifications")


# ============================================================
# CONFIGURATION
# ============================================================

NOTIFICATION_SMS_ENABLED = (
    os.getenv("NOTIFICATION_SMS_ENABLED", "false").lower() == "true"
)

FARMER_PHONE_NUMBER = os.getenv("FARMER_PHONE_NUMBER")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")


# ============================================================
# MESSAGE BUILDING
# ============================================================


def build_sms_message(
    pond_id: int,
    risk_level: str,
    risk_score: float,
    contributing_factors: str,
) -> str:
    """Build a short farmer-facing SMS message."""

    if risk_level == "High":
        prefix = "AquaSentinel HIGH ALERT"
        action = "Please check the pond immediately."
    else:
        prefix = "AquaSentinel WARNING"
        action = "Please inspect the pond when possible."

    return (
        f"{prefix}: Pond {pond_id} has a risk score of {risk_score:.0f}. "
        f"{contributing_factors}. {action}"
    )


# ============================================================
# SMS DELIVERY
# ============================================================


def send_sms(message: str, to_number: Optional[str] = None) -> bool:
    """
    Send an SMS when SMS delivery is explicitly enabled and configured.

    Returns True when a provider accepted the message, otherwise False.
    Missing credentials never crash the risk engine.
    """

    if not NOTIFICATION_SMS_ENABLED:
        logger.info("SMS disabled; notification logged only: %s", message)
        return False

    recipient = to_number or FARMER_PHONE_NUMBER

    missing = []

    if not recipient:
        missing.append("FARMER_PHONE_NUMBER")

    if not TWILIO_ACCOUNT_SID:
        missing.append("TWILIO_ACCOUNT_SID")

    if not TWILIO_AUTH_TOKEN:
        missing.append("TWILIO_AUTH_TOKEN")

    if not TWILIO_FROM_NUMBER:
        missing.append("TWILIO_FROM_NUMBER")

    if missing:
        logger.warning(
            "SMS enabled but configuration is incomplete: %s",
            ", ".join(missing),
        )
        return False

    try:
        from twilio.rest import Client

        client = Client(
            TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN,
        )

        result = client.messages.create(
            body=message,
            from_=TWILIO_FROM_NUMBER,
            to=recipient,
        )

        logger.info(
            "SMS notification accepted: sid=%s recipient=%s",
            result.sid,
            recipient,
        )

        return True

    except ImportError:
        logger.error(
            "Twilio SDK is not installed. Install it with: pip install twilio"
        )
        return False

    except Exception as exc:
        logger.exception("SMS notification failed: %s", exc)
        return False


# ============================================================
# VOICE PLACEHOLDER
# ============================================================


def send_voice_alert(
    pond_id: int,
    risk_level: str,
    message: str,
    language: str = "en",
) -> bool:
    """
    Voice delivery placeholder.

    This intentionally does not select a voice provider yet. The same
    structured event will later feed English, Twi, Dagbani and Hausa
    approved message templates and a suitable speech provider.
    """

    logger.info(
        "VOICE EVENT queued: pond=%s level=%s language=%s message=%s",
        pond_id,
        risk_level,
        language,
        message,
    )

    return False


# ============================================================
# MAIN NOTIFICATION DISPATCH
# ============================================================


def dispatch_notification(
    pond_id: int,
    risk_level: str,
    risk_score: float,
    contributing_factors: str,
) -> dict:
    """Dispatch the appropriate notification channels for a risk event."""

    sms_sent = False
    voice_sent = False

    sms_message = build_sms_message(
        pond_id=pond_id,
        risk_level=risk_level,
        risk_score=risk_score,
        contributing_factors=contributing_factors,
    )

    if risk_level == "High":
        sms_sent = send_sms(sms_message)

        # Voice will be enabled once the provider/language layer is selected.
        voice_sent = send_voice_alert(
            pond_id=pond_id,
            risk_level=risk_level,
            message=sms_message,
            language="en",
        )

    elif risk_level == "Moderate":
        # Moderate currently remains dashboard-only.
        logger.info(
            "Moderate risk notification remains dashboard-only: pond=%s",
            pond_id,
        )

    return {
        "pond_id": pond_id,
        "risk_level": risk_level,
        "sms_sent": sms_sent,
        "voice_sent": voice_sent,
        "sms_message": sms_message,
    }
