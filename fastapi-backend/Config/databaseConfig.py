from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
Mongo_url = os.getenv("MONGO_URL")

client = MongoClient(Mongo_url)

db = client.todo_db

collection_name = db["todo_collection"]

users_collection = db["users_collection"]


