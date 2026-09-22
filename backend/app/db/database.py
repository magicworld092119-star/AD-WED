import json
import bcrypt
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from loguru import logger
from config.settings import settings

def hash_password(password: str) -> str:
    if password.startswith(("$2a$", "$2b$", "$2y$")):
        return password  # Already hashed
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
        return plain_password == hashed_password
    try:
        plain_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False

class AppDatabase:
    def __init__(self):
        self.mode = "json"  # default fallback
        self.client = None
        self.db = None
        
        # Local JSON Paths (derived from auth.py and history.py)
        self.users_file = settings.STORAGE_DIR / "users.json"
        self.history_file = settings.STORAGE_DIR / "history" / "records.json"

    async def connect(self):
        if not settings.MONGODB_URL:
            logger.info("MONGODB_URL is empty. Running in local JSON storage mode.")
            self.mode = "json"
            return
        
        try:
            logger.info(f"Attempting to connect to MongoDB at {settings.MONGODB_URL}...")
            # We set a serverSelectionTimeoutMS of 2000 ms so it doesn't hang startup if DB is down
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URL, 
                serverSelectionTimeoutMS=2000
            )
            # Ping the admin database to verify connection
            await self.client.admin.command('ping')
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.mode = "mongodb"
            logger.info("Successfully connected to MongoDB! Active storage mode: MONGODB")
            
            # Run data migration from JSON to MongoDB if MongoDB is empty
            await self._migrate_local_data()
        except Exception as e:
            logger.warning(
                f"Failed to connect to MongoDB: {e}. "
                "Gracefully falling back to local JSON storage mode."
            )
            self.mode = "json"
            self.client = None
            self.db = None

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

    # Automated migration helper from JSON files to MongoDB
    async def _migrate_local_data(self):
        try:
            # 1. Migrate Users
            if self.users_file.exists():
                user_count = await self.db["users"].count_documents({})
                if user_count == 0:
                    logger.info("Migrating existing local user records to MongoDB...")
                    with open(self.users_file, "r") as f:
                        users_data = json.load(f)
                    
                    if users_data:
                        # users_data in auth.py is stored as a dictionary mapping email -> user dict
                        documents = list(users_data.values())
                        for doc in documents:
                            if "password" in doc:
                                doc["password"] = hash_password(doc["password"])
                        await self.db["users"].insert_many(documents)
                        logger.info(f"Migrated {len(documents)} users to MongoDB (hashed).")

            # 2. Migrate Scan History Records
            if self.history_file.exists():
                history_count = await self.db["history"].count_documents({})
                if history_count == 0:
                    logger.info("Migrating existing local scan history records to MongoDB...")
                    with open(self.history_file, "r") as f:
                        history_data = json.load(f)
                    
                    if history_data:
                        # history_data in history.py is stored as a list of records
                        await self.db["history"].insert_many(history_data)
                        logger.info(f"Migrated {len(history_data)} scan records to MongoDB.")
        except Exception as err:
            logger.error(f"Error during JSON to MongoDB migration: {err}")

    # --- User Operations ---
    async def get_user_by_email(self, email: str) -> dict | None:
        email_clean = email.strip().lower()
        if self.mode == "mongodb":
            user = await self.db["users"].find_one({"email": email_clean})
            if user:
                user.pop("_id", None)
            return user
        else:
            return self._load_json_users().get(email_clean)

    async def save_user(self, user: dict):
        email_clean = user["email"].strip().lower()
        if "password" in user:
            user["password"] = hash_password(user["password"])
            
        if self.mode == "mongodb":
            # Upsert user record
            await self.db["users"].update_one(
                {"email": email_clean},
                {"$set": user},
                upsert=True
            )
        else:
            users = self._load_json_users()
            users[email_clean] = user
            self._save_json_users(users)

    # --- History Operations ---
    async def get_history_records(self, user_id: str | None = None, user_email: str | None = None) -> list:
        email_clean = user_email.strip().lower() if user_email and user_email.strip() else None
        uid_clean = user_id.strip() if user_id and user_id.strip() else None

        # Disallow pseudo-null string values
        if uid_clean in ("null", "undefined", "none", ""):
            uid_clean = None
        if email_clean in ("null", "undefined", "none", ""):
            email_clean = None

        # Enforce strict user isolation: if no valid user credentials provided, return empty list
        if not uid_clean and not email_clean:
            return []

        if self.mode == "mongodb":
            if uid_clean and email_clean:
                query = {"$or": [{"user_id": uid_clean}, {"user_email": email_clean}]}
            elif uid_clean:
                query = {"user_id": uid_clean}
            else:
                query = {"user_email": email_clean}

            cursor = self.db["history"].find(query).sort("scan_date", -1)
            records = await cursor.to_list(length=1000)
            for r in records:
                r.pop("_id", None)
            return records
        else:
            all_records = self._load_json_history()
            filtered = []
            for r in all_records:
                r_uid = r.get("user_id")
                r_email = r.get("user_email")
                if email_clean and r_email and r_email.strip().lower() == email_clean:
                    filtered.append(r)
                elif uid_clean and r_uid and r_uid.strip() == uid_clean:
                    filtered.append(r)
            return filtered

    async def save_history_record(self, record: dict):
        if self.mode == "mongodb":
            await self.db["history"].insert_one(record)
        else:
            records = self._load_json_history()
            records.insert(0, record)
            self._save_json_history(records)

    # --- Local JSON Helper Methods ---
    def _load_json_users(self) -> dict:
        if not self.users_file.exists():
            return {}
        try:
            with open(self.users_file, "r") as f:
                users = json.load(f)
            
            # Auto-hash any plain text passwords found in storage
            modified = False
            for email, user_data in users.items():
                if isinstance(user_data, dict) and "password" in user_data:
                    pwd = user_data["password"]
                    if pwd and not pwd.startswith(("$2a$", "$2b$", "$2y$")):
                        user_data["password"] = hash_password(pwd)
                        modified = True
            
            if modified:
                self._save_json_users(users)
                
            return users
        except Exception:
            return {}

    def _save_json_users(self, users: dict):
        self.users_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.users_file, "w") as f:
            json.dump(users, f, indent=2)

    def _load_json_history(self) -> list:
        if not self.history_file.exists():
            return []
        try:
            with open(self.history_file, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_json_history(self, records: list):
        self.history_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.history_file, "w") as f:
            json.dump(records, f, indent=2)

db = AppDatabase()
