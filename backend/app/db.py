import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

# MongoDB connection URL
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://mongo:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ice_db")

# Global MongoDB client
client: Optional[AsyncIOMotorClient] = None


def get_database():
    """Get MongoDB database instance"""
    return client[DATABASE_NAME]


async def connect_to_mongo():
    """Connect to MongoDB on startup"""
    global client
    client = AsyncIOMotorClient(MONGODB_URL)
    print(f"Connected to MongoDB at {MONGODB_URL}")


async def close_mongo_connection():
    """Close MongoDB connection on shutdown"""
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")


def get_collection(collection_name: str):
    """Get a specific collection"""
    db = get_database()
    return db[collection_name]
