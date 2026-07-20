"""Database connection and collections."""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import settings


class Database:
    """MongoDB database manager."""
    
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None
    connected: bool = False


db_manager = Database()


async def connect_to_mongo():
    """Connect to MongoDB Atlas. Non-fatal on startup — if the IP is not whitelisted,
    the server still starts; DB-dependent endpoints will return 503 instead of crashing."""
    try:
        # tlsAllowInvalidCertificates helps with some Atlas SSL issues on Windows
        db_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=20000,
            tlsAllowInvalidCertificates=True,
        )
        db_manager.db = db_manager.client[settings.DB_NAME]

        # Ping to verify connection (will raise if Atlas IP not whitelisted)
        await db_manager.client.admin.command("ping")

        # Create indexes
        await db_manager.db.users.create_index("email", unique=True)
        await db_manager.db.evaluations.create_index("user_id")
        await db_manager.db.progress.create_index([("user_id", 1), ("lesson_id", 1)])
        await db_manager.db.notifications.create_index([("user_id", 1), ("created_at", -1)])
        await db_manager.db.feedback.create_index([("user_id", 1), ("created_at", -1)])
        await db_manager.db.appointments.create_index([("therapist_id", 1), ("scheduled_at", 1)])
        await db_manager.db.appointments.create_index([("user_id", 1), ("scheduled_at", 1)])
        await db_manager.db.announcements.create_index([("published", 1), ("created_at", -1)])
        await db_manager.db.calendar_events.create_index([("user_id", 1), ("start", 1)])
        await db_manager.db.settings.create_index("user_id", unique=True)
        await db_manager.db.wallets.create_index("user_id", unique=True)
        await db_manager.db.wallet_transactions.create_index([("user_id", 1), ("created_at", -1)])
        await db_manager.db.inventory.create_index([("user_id", 1), ("item_slug", 1)], unique=True)
        await db_manager.db.games.create_index("slug", unique=True)
        await db_manager.db.game_scores.create_index([("game_slug", 1), ("score", -1)])
        await db_manager.db.game_scores.create_index([("user_id", 1), ("created_at", -1)])
        await db_manager.db.quizzes.create_index("slug", unique=True)
        await db_manager.db.quiz_attempts.create_index([("user_id", 1), ("created_at", -1)])
        await db_manager.db.videos.create_index("slug", unique=True)
        await db_manager.db.video_progress.create_index([("user_id", 1), ("video_slug", 1)], unique=True)
        await db_manager.db.shop_items.create_index("slug", unique=True)
        await db_manager.db.friendships.create_index([("a", 1), ("b", 1)])
        await db_manager.db.audit_logs.create_index([("created_at", -1)])
        await db_manager.db.audit_logs.create_index("action")
        await db_manager.db.password_resets.create_index("email")
        await db_manager.db.saved_reports.create_index("user_id")

        db_manager.connected = True
        print("[OK] Connected to MongoDB Atlas")

    except Exception as e:
        db_manager.connected = False
        print(f"[WARN] MongoDB connection failed: {e}")
        print("[INFO] Server starting anyway — fix MongoDB Atlas IP whitelist to enable DB features.")
        print("[INFO] Go to: https://cloud.mongodb.com -> Network Access -> Add IP: 0.0.0.0/0")


async def close_mongo_connection():
    """Close MongoDB connection."""
    if db_manager.client:
        db_manager.client.close()
        print("[INFO] Closed MongoDB connection")


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance."""
    return db_manager.db
