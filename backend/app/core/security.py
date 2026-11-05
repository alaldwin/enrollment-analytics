
import hashlib
import hmac
import secrets

from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from backend.app.core.config import settings
from backend.app.db.session import engine


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    payload = {
        "sub": subject,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


def create_password_reset_token() -> tuple[str, str]:
    """
    Generate a secure password-reset token.

    Returns:
        raw_token: Token sent to the user.
        token_hash: Hash stored in PostgreSQL.
    """
    raw_token = secrets.token_urlsafe(32)

    token_hash = hashlib.sha256(
        raw_token.encode("utf-8")
    ).hexdigest()

    return raw_token, token_hash


def hash_password_reset_token(raw_token: str) -> str:
    """Hash a password-reset token for database lookup."""
    return hashlib.sha256(
        raw_token.encode("utf-8")
    ).hexdigest()

def create_password_reset_code() -> tuple[str, str]:
    """Generate a six-digit code and its protected database hash."""
    code = f"{secrets.randbelow(1_000_000):06d}"
    code_hash = hash_password_reset_code(code)

    return code, code_hash


def hash_password_reset_code(code: str) -> str:
    """Hash a six-digit code using the application's secret key."""
    return hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        code.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def get_current_user(
    token: str = Depends(oauth2_scheme),
) -> dict:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode and validate the JWT.
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")

        if not user_id:
            raise credentials_exception

    except JWTError as exc:
        raise credentials_exception from exc

    # Retrieve the authenticated user.
    try:
        with engine.connect() as connection:
            user = connection.execute(
                text("""
                    SELECT
                        user_id,
                        username,
                        email,
                        role,
                        is_active
                    FROM auth.users
                    WHERE user_id = :user_id
                """),
                {"user_id": user_id},
            ).mappings().first()

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to verify authenticated user.",
        ) from exc

    if not user or not user["is_active"]:
        raise credentials_exception

    return {
        **dict(user),
        "user_id": str(user["user_id"]),
    }