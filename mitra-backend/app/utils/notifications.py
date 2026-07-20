"""Shared helper for creating in-app notifications from any router."""
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from ..models.social import Notification, NotificationType


async def notify(
    db: AsyncSession,
    user_id: UUID,
    type: NotificationType,
    title: str,
    body: Optional[str] = None,
    deep_link: Optional[str] = None,
) -> Notification:
    """Create and flush a notification. Caller is responsible for db.commit()."""
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        deep_link=deep_link,
    )
    db.add(notification)
    await db.flush()
    return notification
