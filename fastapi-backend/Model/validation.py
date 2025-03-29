from pydantic import BaseModel, Field

class BlogPost(BaseModel):
    title: str
    content: str

class RegisterRequest(BaseModel):
    username: str
    password: str