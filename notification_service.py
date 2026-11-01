
"""
AquaSentinel notification service.

Provider-neutral notification layer for dashboard, SMS, email and
future voice/push notifications.

SMS is optional and only activates when the required environment
variables are configured.

Email notifications are sent to the registered owner of a farm
when a pond reaches the existing High risk level.
"""

import logging
import os
from datetime import datetime, timezone
from typing import Optional

import psycopg
from dotenv import load_dotenv

from email_service import send_critical_alert

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
# FARMER / POND OWNER DETAILS
# ============================================================


def get_pond_owner_details(pond_id: int):
    """
    Retrieve the pond, farm and registered farm owner's details.

    The farmer's registered AquaSentinel account email is used
    as the email notification recipient.
    """

    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        logger.error("DATABASE_URL is not configured.")
        return None

    try:
        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        u.email,
                        f.name,
                        p.name
                    FROM ponds p
                    JOIN farms f
                        ON p.farm_id = f.id
                    JOIN users u
                        ON f.user_id = u.id
                    WHERE p.id = %s;
                    """,
                    (pond_id,),
                )

                result = cur.fetchone()

                if not result:
                    logger.warning(
                        "No farm owner found for pond %s",
                        pond_id,
                    )
                    return None

                return {
                    "email": result[0],
                    "farm_name": result[1],
                    "pond_name": result[2],
                }

    except Exception:
        logger.exception(
            "Could not retrieve owner details for pond %s",
            pond_id,
        )
        return None


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
# EMAIL MESSAGE BUILDING
# ============================================================


def build_email_recommendation(
    contributing_factors: str,
) -> str:
    """
    Build a general immediate-action recommendation.

    This does not replace the risk engine's contributing factors
    or introduce new risk classifications.
    """

    return (
        "Please inspect the pond immediately. Check the water "
        "conditions associated with the reported warning, verify "
        "that your aeration and water-management systems are "
        "functioning, and take appropriate corrective action. "
        "Continue monitoring the pond closely."
    )


# ============================================================
# EMAIL DELIVERY
# ============================================================


def send_farmer_email(
    pond_id: int,
    risk_score: float,
    contributing_factors: str,
) -> bool:
    """
    Send a High-risk email alert to the registered farm owner.

    Email delivery failures are logged and do not interrupt
    the risk-analysis process.
    """

    owner_details = get_pond_owner_details(pond_id)

    if not owner_details:
        logger.warning(
            "Email not sent: owner details unavailable for pond %s",
            pond_id,
        )
        return False

    recipient = owner_details.get("email")

    if not recipient:
        logger.warning(
            "Email not sent: no registered email for pond %s",
            pond_id,
        )
        return False

    recommendation = build_email_recommendation(
        contributing_factors
    )

    detected_at = datetime.now(timezone.utc).strftime(
        "%Y-%m-%d %H:%M:%S UTC"
    )

    try:
        result = send_critical_alert(
            to_email=recipient,
            farm_name=owner_details["farm_name"],
            pond_name=owner_details["pond_name"],
            risk_score=risk_score,
            contributing_factors=contributing_factors,
            recommendation=recommendation,
            detected_at=detected_at,
        )

        email_sent = bool(result)

        if email_sent:
            logger.info(
                "High-risk email notification accepted for pond %s",
                pond_id,
            )
        else:
            logger.warning(
                "High-risk email notification was not accepted for pond %s",
                pond_id,
            )

        return email_sent

    except Exception:
        logger.exception(
            "Email notification failed for pond %s",
            pond_id,
        )
        return False


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
        logger.info(
            "SMS disabled; notification logged only: %s",
            message,
        )
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

    except Exception:
        logger.exception("SMS notification failed.")
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
    email_sent = False

    sms_message = build_sms_message(
        pond_id=pond_id,
        risk_level=risk_level,
        risk_score=risk_score,
        contributing_factors=contributing_factors,
    )

    if risk_level == "High":

        # Send email to the registered owner of the farm.
        email_sent = send_farmer_email(
            pond_id=pond_id,
            risk_score=risk_score,
            contributing_factors=contributing_factors,
        )

        # Existing optional SMS notification.
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
        "email_sent": email_sent,
        "sms_sent": sms_sent,
        "voice_sent": voice_sent,
        "sms_message": sms_message,
    }
