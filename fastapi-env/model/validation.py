from pydantic import BaseModel, Field

class BlogPost(BaseModel):
    title: str
    content: str

# class Todo(BaseModel):
#     title : str = Field(min_length=1)
#     description: str = Field(min_length=1)
#     is_completed : bool