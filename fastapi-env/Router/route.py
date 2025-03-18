import json
from fastapi import APIRouter, HTTPException
from model.validation import BlogPost
from config.databaseCon import collection_name
from bson import ObjectId
from datetime import datetime
import requests
import re
import os
from dotenv import load_dotenv


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

# @router.get("/posts/{post_id}")
# def get_post(post_id: str):
#     post = collection_name.find_one({"_id": ObjectId(post_id)})
#     if not post:
#         raise HTTPException(status_code=404, detail="Post not found")
#     post["id"] = str(post["_id"])
#     del post["_id"]
#     return post

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
            f"Correct the following blog post for grammar, spelling, and clarity:\n\n"
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
        
        # Extract AI suggestions
        corrected_text = response_data["choices"][0]["message"]["content"]

        if corrected_text=="":
           corrected_text = response_data["choices"][0]["message"]["reasoning"] 

        # Splitting title and content based on the format
        corrected_lines = corrected_text.split("\n\n")
        corrected_title = re.sub(r"\*\*Title:\s*|\*\*", "", corrected_lines[0]).strip()
        corrected_content = corrected_lines[1].replace("**Content:** ", "").strip()

        return {
            "title": corrected_title,
            "content": corrected_content
        }
    
    except (KeyError, IndexError):
        raise HTTPException(status_code=500, detail="Unexpected AI response format")