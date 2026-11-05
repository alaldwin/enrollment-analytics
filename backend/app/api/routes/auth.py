
from datetime import datetime, timedelta, timezone
from uuid import UUID
import hmac

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from fastapi.security import OAuth2PasswordRequestForm
from pwdlib import PasswordHash
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from backend.app.core.config import settings
from backend.app.core.permissions import require_roles
from backend.app.core.security import (
    create_access_token,
    create_password_reset_code,
    create_password_reset_token,
    hash_password_reset_code,
    hash_password_reset_token,
)

from backend.app.db.session import engine
from backend.app.schemas.auth import (
    UserCreate,
    UserResponse,
    TokenResponse,
    UserRoleUpdate,
    UserStatusUpdate,
    ForgotPasswordRequest,
    VerifyPasswordResetCodeRequest,
    ResetPasswordRequest,
)

from backend.app.services.email_service import send_password_reset_code




router = APIRouter(prefix="/auth", tags=["Authentication"])

password_hash = PasswordHash.recommended()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(user: UserCreate):
    username = user.username.strip().lower()
    email = str(user.email).strip().lower()

    if not username or not email:
        raise HTTPException(
            status_code=400,
            detail="Username and email are required.",
        )

    hashed_password = password_hash.hash(user.password)

    try:
        with engine.begin() as connection:
            existing_user = connection.execute(
                text("""
                    SELECT 1
                    FROM auth.users
                    WHERE username = :username OR email = :email
                """),
                {"username": username, "email": email},
            ).first()

            if existing_user:
                raise HTTPException(
                    status_code=409,
                    detail="Username or email already registered.",
                )

            result = connection.execute(
                text("""
                    INSERT INTO auth.users (
                        username,
                        email,
                        password_hash,
                        role
                    )
                    VALUES (
                        :username,
                        :email,
                        :password_hash,
                        'guest'
                    )
                    RETURNING
                        user_id,
                        username,
                        email,
                        role,
                        is_active
                """),
                {
                    "username": username,
                    "email": email,
                    "password_hash": hashed_password,
                },
            )

            created_user = result.mappings().one()

            return {
                **dict(created_user),
                "user_id": str(created_user["user_id"]),
            }

    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Username or email already registered.",
        ) from exc

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to register user.",
        ) from exc


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    username = form_data.username.strip().lower()

    try:
        with engine.connect() as connection:
            user = connection.execute(
                text("""
                    SELECT
                        user_id,
                        username,
                        password_hash,
                        role,
                        is_active
                    FROM auth.users
                    WHERE username = :username
                """),
                {"username": username},
            ).mappings().first()

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to authenticate user.",
        ) from exc

    # Check username and password.
    if not user or not password_hash.verify(
        form_data.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Prevent inactive accounts from logging in.
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )

    # Generate JWT access token.
    access_token = create_access_token(
        subject=str(user["user_id"]),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "role": user["role"],
    }



@router.get(
    "/users",
    dependencies=[Depends(require_roles("admin"))],
)
def get_users():
    try:
        with engine.connect() as connection:
            users = connection.execute(
                text("""
                    SELECT
                        user_id,
                        username,
                        email,
                        role,
                        is_active,
                        created_at
                    FROM auth.users
                    ORDER BY created_at DESC
                """)
            ).mappings().all()

            return [
                {
                    **dict(user),
                    "user_id": str(user["user_id"]),
                }
                for user in users
            ]

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve users.",
        ) from exc



@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(require_roles("admin"))],
)
def get_user(user_id: UUID):
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
                {"user_id": str(user_id)},
            ).mappings().first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        return {
            **dict(user),
            "user_id": str(user["user_id"]),
        }

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to retrieve user.",
        ) from exc


@router.patch(
    "/users/{user_id}/role",
)
def update_user_role(
    user_id: UUID,
    payload: UserRoleUpdate,
    current_user: dict = Depends(require_roles("admin")),
):
    try:
        with engine.begin() as connection:
            # Lock active administrator records.
            active_admins = connection.execute(
                text("""
                    SELECT user_id
                    FROM auth.users
                    WHERE role = 'admin'
                      AND is_active = TRUE
                    ORDER BY user_id
                    FOR UPDATE
                """)
            ).all()

            user = connection.execute(
                text("""
                    SELECT user_id, username, role, is_active
                    FROM auth.users
                    WHERE user_id = :user_id
                    FOR UPDATE
                """),
                {"user_id": user_id},
            ).mappings().first()

            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User not found.",
                )

            # Prevent administrators from demoting themselves.
            if (
                str(user["user_id"]) == current_user["user_id"]
                and payload.role != "admin"
            ):
                raise HTTPException(
                    status_code=409,
                    detail="You cannot change your own administrator role.",
                )

            # Protect the last active administrator.
            if (
                user["role"] == "admin"
                and user["is_active"]
                and payload.role != "admin"
                and len(active_admins) <= 1
            ):
                raise HTTPException(
                    status_code=409,
                    detail="Cannot demote the last active administrator.",
                )

            updated_user = connection.execute(
                text("""
                    UPDATE auth.users
                    SET role = :role,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = :user_id
                    RETURNING
                        user_id,
                        username,
                        email,
                        role,
                        is_active,
                        updated_at
                """),
                {
                    "role": payload.role,
                    "user_id": user_id,
                },
            ).mappings().one()

            return {
                **dict(updated_user),
                "user_id": str(updated_user["user_id"]),
            }

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to update user role.",
        ) from exc




@router.patch(
    "/users/{user_id}/status",
)
def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdate,
    current_user: dict = Depends(require_roles("admin")),
):
    try:
        with engine.begin() as connection:
            # Lock active administrator records.
            active_admins = connection.execute(
                text("""
                    SELECT user_id
                    FROM auth.users
                    WHERE role = 'admin'
                      AND is_active = TRUE
                    ORDER BY user_id
                    FOR UPDATE
                """)
            ).all()

            user = connection.execute(
                text("""
                    SELECT user_id, username, role, is_active
                    FROM auth.users
                    WHERE user_id = :user_id
                    FOR UPDATE
                """),
                {"user_id": user_id},
            ).mappings().first()

            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User not found.",
                )

            # Prevent administrators from deactivating themselves.
            if (
                str(user["user_id"]) == current_user["user_id"]
                and not payload.is_active
            ):
                raise HTTPException(
                    status_code=409,
                    detail="You cannot deactivate your own account.",
                )

            # Protect the last active administrator.
            if (
                user["role"] == "admin"
                and user["is_active"]
                and not payload.is_active
                and len(active_admins) <= 1
            ):
                raise HTTPException(
                    status_code=409,
                    detail="Cannot deactivate the last active administrator.",
                )

            updated_user = connection.execute(
                text("""
                    UPDATE auth.users
                    SET is_active = :is_active,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = :user_id
                    RETURNING
                        user_id,
                        username,
                        email,
                        role,
                        is_active,
                        updated_at
                """),
                {
                    "is_active": payload.is_active,
                    "user_id": user_id,
                },
            ).mappings().one()

            return {
                **dict(updated_user),
                "user_id": str(updated_user["user_id"]),
            }

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to update user status.",
        ) from exc




@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    email = str(payload.email).strip().lower()

    generic_message = (
        "If an active account exists for this email, "
        "a verification code will be sent."
    )

    try:
        with engine.begin() as connection:
            # Lock the account row to prevent concurrent reset requests.
            user = connection.execute(
                text("""
                    SELECT user_id
                    FROM auth.users
                    WHERE email = :email
                      AND is_active = TRUE
                    FOR UPDATE
                """),
                {"email": email},
            ).mappings().first()

            if not user:
                return {"message": generic_message}

            # Enforce a 60-second resend cooldown.
            recent_request = connection.execute(
                text("""
                    SELECT reset_id
                    FROM auth.password_reset_tokens
                    WHERE user_id = :user_id
                      AND created_at >
                          CURRENT_TIMESTAMP - INTERVAL '60 seconds'
                    ORDER BY created_at DESC
                    LIMIT 1
                """),
                {"user_id": user["user_id"]},
            ).first()

            if recent_request:
                return {"message": generic_message}

            # Invalidate previous unused reset requests.
            connection.execute(
                text("""
                    UPDATE auth.password_reset_tokens
                    SET used_at = CURRENT_TIMESTAMP
                    WHERE user_id = :user_id
                      AND used_at IS NULL
                """),
                {"user_id": user["user_id"]},
            )

            code, code_hash = create_password_reset_code()

            reset_record = connection.execute(
                text("""
                    INSERT INTO auth.password_reset_tokens (
                        user_id,
                        token_hash,
                        expires_at,
                        attempt_count
                    )
                    VALUES (
                        :user_id,
                        :token_hash,
                        :expires_at,
                        0
                    )
                    RETURNING reset_id
                """),
                {
                    "user_id": user["user_id"],
                    "token_hash": code_hash,
                    "expires_at": (
                        datetime.now(timezone.utc)
                        + timedelta(minutes=10)
                    ),
                },
            ).mappings().one()

            reset_id = reset_record["reset_id"]

        # Send the email after the transaction succeeds.
        try:
            send_password_reset_code(email, code)
        except HTTPException:
            # Invalidate the code if email delivery fails.
            with engine.begin() as connection:
                connection.execute(
                    text("""
                        UPDATE auth.password_reset_tokens
                        SET used_at = CURRENT_TIMESTAMP
                        WHERE reset_id = :reset_id
                          AND used_at IS NULL
                    """),
                    {"reset_id": reset_id},
                )
            raise

        return {"message": generic_message}

    except HTTPException:
        raise

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to process password reset request.",
        ) from exc


@router.post("/verify-reset-code")
def verify_reset_code(payload: VerifyPasswordResetCodeRequest):
    email = str(payload.email).strip().lower()
    code_hash = hash_password_reset_code(payload.code)

    try:
        with engine.begin() as connection:
            # Lock the latest active reset request for this email.
            reset_record = connection.execute(
                text("""
                    SELECT
                        pr.reset_id,
                        pr.token_hash,
                        pr.attempt_count,
                        pr.verified_at
                    FROM auth.password_reset_tokens pr
                    JOIN auth.users u
                        ON u.user_id = pr.user_id
                    WHERE u.email = :email
                      AND u.is_active = TRUE
                      AND pr.used_at IS NULL
                      AND pr.expires_at > CURRENT_TIMESTAMP
                    ORDER BY pr.created_at DESC
                    LIMIT 1
                    FOR UPDATE OF pr
                """),
                {"email": email},
            ).mappings().first()

            if not reset_record:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid, expired, or already used verification code.",
                )

            # Do not allow more than five incorrect attempts.
            if reset_record["attempt_count"] >= 5:
                raise HTTPException(
                    status_code=400,
                    detail="Too many attempts. Request a new verification code.",
                )

            # A successfully verified code cannot be reused.
            if reset_record["verified_at"] is not None:
                raise HTTPException(
                    status_code=400,
                    detail="This verification code has already been used.",
                )

            # Compare the submitted code hash with the stored hash.
            if not hmac.compare_digest(
                reset_record["token_hash"],
                code_hash,
            ):
                connection.execute(
                    text("""
                        UPDATE auth.password_reset_tokens
                        SET attempt_count = attempt_count + 1
                        WHERE reset_id = :reset_id
                    """),
                    {"reset_id": reset_record["reset_id"]},
                )

                raise HTTPException(
                    status_code=400,
                    detail="Invalid verification code.",
                )

            # Generate a separate short-lived reset session.
            reset_token, _ = create_password_reset_token()
            reset_token_hash = hash_password_reset_token(reset_token)

            connection.execute(
                text("""
                    UPDATE auth.password_reset_tokens
                    SET verified_at = CURRENT_TIMESTAMP,
                        reset_token_hash = :reset_token_hash,
                        reset_expires_at = :reset_expires_at
                    WHERE reset_id = :reset_id
                      AND verified_at IS NULL
                      AND used_at IS NULL
                """),
                {
                    "reset_id": reset_record["reset_id"],
                    "reset_token_hash": reset_token_hash,
                    "reset_expires_at": (
                        datetime.now(timezone.utc)
                        + timedelta(minutes=5)
                    ),
                },
            )

            return {
                "message": "Verification successful.",
                "reset_token": reset_token,
            }

    except HTTPException:
        raise

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to verify password reset code.",
        ) from exc


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    reset_token_hash = hash_password_reset_token(
        payload.reset_token
    )
    new_password_hash = password_hash.hash(payload.new_password)

    try:
        with engine.begin() as connection:
            reset_record = connection.execute(
                text("""
                    SELECT reset_id, user_id
                    FROM auth.password_reset_tokens
                    WHERE reset_token_hash = :reset_token_hash
                      AND verified_at IS NOT NULL
                      AND reset_expires_at > CURRENT_TIMESTAMP
                      AND used_at IS NULL
                    FOR UPDATE
                """),
                {"reset_token_hash": reset_token_hash},
            ).mappings().first()

            if not reset_record:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid or expired password reset session.",
                )

            updated_user = connection.execute(
                text("""
                    UPDATE auth.users
                    SET password_hash = :password_hash,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = :user_id
                      AND is_active = TRUE
                    RETURNING user_id
                """),
                {
                    "password_hash": new_password_hash,
                    "user_id": reset_record["user_id"],
                },
            ).first()

            if not updated_user:
                raise HTTPException(
                    status_code=400,
                    detail="Unable to reset password for this account.",
                )

            connection.execute(
                text("""
                    UPDATE auth.password_reset_tokens
                    SET used_at = CURRENT_TIMESTAMP
                    WHERE reset_id = :reset_id
                """),
                {"reset_id": reset_record["reset_id"]},
            )

            return {
                "message": "Password has been reset successfully."
            }

    except HTTPException:
        raise

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to reset password.",
        ) from exc


