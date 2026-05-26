from pydantic import BaseModel


class ExportInfo(BaseModel):
    filename: str
    media_type: str
