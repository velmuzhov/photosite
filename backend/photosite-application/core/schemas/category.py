from pydantic import BaseModel

class BaseCategory(BaseModel):
    name: str

class CategoryEventRead(BaseCategory):
    ...