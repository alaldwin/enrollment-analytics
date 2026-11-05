import httpx

from fastapi import HTTPException

from backend.app.core.config import settings


RESEND_API_URL = "https://api.resend.com/emails"


def send_password_reset_code(
    recipient: str,
    code: str,
) -> None:
    if not settings.RESEND_API_KEY or not settings.RESEND_FROM_EMAIL:
        raise HTTPException(
            status_code=503,
            detail="Email service is not configured.",
        )

    payload = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": [recipient],
        "subject": "EDARS Password Reset Verification Code",
        "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
                <h2>EDARS Password Reset</h2>
                <p>We received a request to reset your password.</p>
                <p>Your 6-digit verification code is:</p>
                <div style="
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    padding: 20px;
                    background: #f1f5f9;
                    text-align: center;
                    border-radius: 8px;
                ">{code}</div>
                <p>This code expires in 10 minutes.</p>
                <p>If you did not request this, you can ignore this email.</p>
                <p>EDARS Security Team</p>
            </div>
        """,
    }

    try:
        response = httpx.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10.0,
        )

        response.raise_for_status()

    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to send verification email.",
        ) from exc
