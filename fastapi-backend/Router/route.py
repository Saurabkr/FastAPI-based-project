import json
from fastapi import APIRouter, HTTPException, Depends
from Model.validation import BlogPost
from Model.validation import RegisterRequest
from Config.databaseConfig import collection_name
from Config.databaseConfig import users_collection
from bson import ObjectId
from datetime import datetime
import requests
import re
import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordRequestForm
from Auth.auth import create_access_token, authenticate_user, get_current_user, pwd_context
from datetime import timedelta


load_dotenv()
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_API_URL = "https://openrouter.ai/api/v1/chat/completions"

router = APIRouter()

@router.post("/posts")
def create_post(post: BlogPost):
    new_post = {
        "title": post.title,
        "content": post.content,
        "published_at": datetime.now()
    }
    result = collection_name.insert_one(new_post)
    return {"id": str(result.inserted_id), "message": "Post published successfully!"}

@router.get("/posts")
def get_posts():
    posts = list(collection_name.find())
    for post in posts:
        post["id"] = str(post["_id"])
        del post["_id"]
    return posts

@router.put("/posts/{post_id}")
def update_post(post_id: str, post: BlogPost):
    updated_post = collection_name.find_one_and_update(
        {"_id": ObjectId(post_id)},
        {"$set": {"title": post.title, "content": post.content}},
        return_document=True
    )
    if not updated_post:
        raise HTTPException(status_code=404, detail="Post not found")
    updated_post["id"] = str(updated_post["_id"])
    del updated_post["_id"]
    return updated_post

@router.delete("/posts/{post_id}")
def delete_post(post_id: str):
    result = collection_name.delete_one({"_id": ObjectId(post_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted successfully!"}


@router.post("/check-ai")
async def check_ai(blog: BlogPost):
    try:
        prompt = (
            f"Proofread and correct the following blog post for grammar, spelling, and clarity. Do not add or remove any sentences or alter the meaning. Keep the original structure and style intact.\n\n"
            f"Title: {blog.title}\n"
            f"Content: {blog.content}"
        )

        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        }

        data = {
            "model": "deepseek/deepseek-r1:free",
            "messages": [{"role": "user", "content": prompt}],
        }

        response = requests.post(DEEPSEEK_API_URL, headers=headers, data=json.dumps(data))

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        response_data = response.json()

        print(response_data)
        
        # Extract AI suggestions
        corrected_text = response_data["choices"][0]["message"]["content"]

        # if corrected_text=="":
        #    corrected_text = response_data["choices"][0]["message"]["reasoning"] 

        # Extract title and content dynamically
        title_match = re.search(r"\*\*Title:\*\*\s*(.+)", corrected_text)
        content_match = re.search(r"\*\*Content:\*\*\s*(.+?)(?:\n\n\*\*|$)", corrected_text, re.DOTALL)

        corrected_title = title_match.group(1).strip() if title_match else blog.title
        corrected_content = content_match.group(1).strip() if content_match else blog.content

        return {
            "title": corrected_title,
            "content": corrected_content
        }
    
    except (KeyError, IndexError):
        raise HTTPException(status_code=500, detail="Unexpected AI response format")

@router.post("/register")
def register(user: RegisterRequest):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = pwd_context.hash(user.password)
    users_collection.insert_one({"username": user.username, "password": hashed_password})
    return {"message": "User registered successfully"}

@router.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    access_token = create_access_token(data={"sub": form_data.username}, expires_delta=timedelta(hours=1))
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/protected")
def protected_route(current_user: dict = Depends(get_current_user)):
    return {"message": f"Welcome {current_user['username']}, you are authenticated!"}