
import os
import resend
from html import escape


def send_critical_alert(
    to_email: str,
    farm_name: str,
    pond_name: str,
    risk_score: float,
    contributing_factors,
    recommendation: str,
    detected_at: str
):
    """
    Send an email notification when a High-risk pond condition
    is detected.

    Contributing factors can be supplied as either a string
    or a list.
    """

    api_key = os.getenv("RESEND_API_KEY")

    if not api_key:
        raise RuntimeError("RESEND_API_KEY is not configured.")

    resend.api_key = api_key

    # Normalize contributing factors.
    if isinstance(contributing_factors, str):
        factors = [contributing_factors] if contributing_factors.strip() else []
    elif isinstance(contributing_factors, (list, tuple)):
        factors = [str(factor) for factor in contributing_factors]
    else:
        factors = []

    factors_html = "".join(
        f"<li>{escape(str(factor))}</li>"
        for factor in factors
    )

    factors_text = "\n".join(
        f"- {factor}" for factor in factors
    )

    params = {
        "from": "AquaSentinel Labs <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "CRITICAL ALERT - Immediate Pond Attention Required",

        "html": f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px;
                    margin: auto; color: #17313b;">

            <div style="background: #b91c1c; color: white;
                        padding: 20px; border-radius: 8px;">
                <h2>CRITICAL POND ALERT</h2>
                <p>Immediate attention is required.</p>
            </div>

            <div style="padding: 20px;">

                <p><strong>Farm:</strong> {escape(str(farm_name))}</p>

                <p><strong>Pond:</strong> {escape(str(pond_name))}</p>

                <p><strong>Risk Score:</strong> {risk_score}</p>

                <p><strong>Detected:</strong> {escape(str(detected_at))}</p>

                <h3>Detected Issues</h3>
                <ul>{factors_html}</ul>

                <h3>Recommended Action</h3>
                <p>{escape(str(recommendation))}</p>

                <hr>

                <p>
                    This alert was generated automatically by
                    AquaSentinel Labs.
                </p>

            </div>
        </div>
        """,

        "text": f"""
CRITICAL POND ALERT

Farm: {farm_name}
Pond: {pond_name}
Risk Score: {risk_score}
Detected: {detected_at}

Detected Issues:
{factors_text}

Recommended Action:
{recommendation}

AquaSentinel Labs
        """
    }

    return resend.Emails.send(params)
