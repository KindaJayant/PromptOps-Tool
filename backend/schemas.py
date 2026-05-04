from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Prompt Schemas
class PromptBase(BaseModel):
    name: str
    description: Optional[str] = None

class PromptCreate(PromptBase):
    pass

class PromptVersionSchema(BaseModel):
    id: int
    version_number: int
    content: str
    commit_message: Optional[str]
    tag: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True

class PromptSchema(PromptBase):
    id: int
    created_at: datetime
    versions: List[PromptVersionSchema] = []

    class Config:
        orm_mode = True

# Version Schemas
class VersionCreate(BaseModel):
    content: str
    commit_message: Optional[str] = None

class TagUpdate(BaseModel):
    tag: str
    force: bool = False


class PlaygroundRunRequest(BaseModel):
    content: str
    input_data: Optional[str] = ""


class PlaygroundRunResponse(BaseModel):
    rendered_prompt: str
    actual_output: str

# Test Case Schemas
class TestCaseBase(BaseModel):
    input: str
    expected_output: str

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseSchema(TestCaseBase):
    id: int
    prompt_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class TestCaseImportRequest(BaseModel):
    test_cases: List[TestCaseCreate]

class TestCaseImportResponse(BaseModel):
    imported_count: int
    test_cases: List[TestCaseSchema]

class PromptListItemSchema(PromptBase):
    id: int
    created_at: datetime
    versions: List[PromptVersionSchema] = []
    test_cases: List[TestCaseSchema] = []

    class Config:
        orm_mode = True

# Test Run Schemas
class TestRunSchema(BaseModel):
    id: int
    prompt_version_id: int
    test_case_id: int
    actual_output: Optional[str]
    score: Optional[float]
    reasoning: Optional[str]
    passed: bool
    ran_at: datetime

    class Config:
        orm_mode = True

class TestRunResults(BaseModel):
    results: List[TestRunSchema]
    pass_rate: float


class VersionCaseResultSchema(BaseModel):
    version_id: int
    version_number: int
    score: Optional[float]
    passed: bool
    ran_at: datetime


class TestCaseMatrixRow(BaseModel):
    test_case_id: int
    input: str
    expected_output: str
    versions: List[VersionCaseResultSchema]


class TestCaseMatrixResponse(BaseModel):
    prompt_id: int
    rows: List[TestCaseMatrixRow]

# Diff Schemas
class DiffLine(BaseModel):
    type: str # "added", "removed", "unchanged"
    content: str

# Analytics Schemas
class AnalyticsSchema(BaseModel):
    version_id: int
    version_number: int
    pass_rate: float
    avg_score: float
    total_runs: int

class PromptAnalytics(BaseModel):
    prompt_id: int
    name: str
    version_stats: List[AnalyticsSchema]

# Export Schema
class ExportSchema(BaseModel):
    prompt: PromptListItemSchema
    test_cases: List[TestCaseSchema]
