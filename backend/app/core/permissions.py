
from fastapi import Depends, HTTPException, status

from backend.app.core.security import get_current_user


ROLE_PERMISSIONS = {
    "admin": {
        "view_overview",
        "view_enrollments",
        "view_analytics",
        "view_reports",
        "manage_users",
    },
    "analyst": {
        "view_overview",
        "view_enrollments",
        "view_analytics",
        "view_reports",
    },
    "dean": {
        "view_overview",
        "view_enrollments",
        "view_analytics",
    },
    "guest": {
        "view_overview",
    },
}


def require_roles(*allowed_roles: str):
    def role_checker(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )

        return current_user

    return role_checker


def require_permission(permission: str):
    def permission_checker(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        permissions = ROLE_PERMISSIONS.get(current_user["role"], set())

        if permission not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )

        return current_user

    return permission_checker



# Reusable permission dependencies
require_view_overview = require_permission("view_overview")
require_view_enrollments = require_permission("view_enrollments")
require_view_analytics = require_permission("view_analytics")
require_view_reports = require_permission("view_reports")
require_manage_users = require_permission("manage_users")