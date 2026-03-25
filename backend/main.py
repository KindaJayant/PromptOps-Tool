from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import difflib
from datetime import datetime

from . import models, schemas, database, llm
from .database import engine, get_db

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="PromptOps API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prompts
@app.post("/prompts", response_model=schemas.PromptSchema)
def create_prompt(prompt: schemas.PromptCreate, db: Session = Depends(get_db)):
    db_prompt = models.Prompt(name=prompt.name, description=prompt.description)
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

@app.get("/prompts", response_model=List[schemas.PromptSchema])
def list_prompts(db: Session = Depends(get_db)):
    return db.query(models.Prompt).all()

@app.get("/prompts/{prompt_id}", response_model=schemas.PromptSchema)
def get_prompt(prompt_id: int, db: Session = Depends(get_db)):
    db_prompt = db.query(models.Prompt).filter(models.Prompt.id == prompt_id).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return db_prompt

# Versions
@app.post("/prompts/{prompt_id}/versions", response_model=schemas.PromptVersionSchema)
def create_version(prompt_id: int, version: schemas.VersionCreate, db: Session = Depends(get_db)):
    # Get the highest version number
    last_version = db.query(models.PromptVersion).filter(models.PromptVersion.prompt_id == prompt_id).order_by(models.PromptVersion.version_number.desc()).first()
    next_num = 1 if not last_version else last_version.version_number + 1
    
    db_version = models.PromptVersion(
        prompt_id=prompt_id,
        version_number=next_num,
        content=version.content,
        commit_message=version.commit_message
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version

@app.get("/prompts/{prompt_id}/versions", response_model=List[schemas.PromptVersionSchema])
def list_versions(prompt_id: int, db: Session = Depends(get_db)):
    return db.query(models.PromptVersion).filter(models.PromptVersion.prompt_id == prompt_id).all()

@app.get("/versions/{version_id}", response_model=schemas.PromptVersionSchema)
def get_version(version_id: int, db: Session = Depends(get_db)):
    db_version = db.query(models.PromptVersion).filter(models.PromptVersion.id == version_id).first()
    if not db_version:
        raise HTTPException(status_code=404, detail="Version not found")
    return db_version

@app.post("/versions/{version_id}/tag", response_model=schemas.PromptVersionSchema)
def update_tag(version_id: int, tag_data: schemas.TagUpdate, db: Session = Depends(get_db)):
    db_version = db.query(models.PromptVersion).filter(models.PromptVersion.id == version_id).first()
    if not db_version:
        raise HTTPException(status_code=404, detail="Version not found")
    db_version.tag = tag_data.tag
    db.commit()
    db.refresh(db_version)
    return db_version

@app.post("/versions/{version_id}/rollback", response_model=schemas.PromptVersionSchema)
def rollback_version(version_id: int, db: Session = Depends(get_db)):
    target_version = db.query(models.PromptVersion).filter(models.PromptVersion.id == version_id).first()
    if not target_version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Get highest version number for this prompt
    last_version = db.query(models.PromptVersion).filter(models.PromptVersion.prompt_id == target_version.prompt_id).order_by(models.PromptVersion.version_number.desc()).first()
    next_num = last_version.version_number + 1
    
    new_version = models.PromptVersion(
        prompt_id=target_version.prompt_id,
        version_number=next_num,
        content=target_version.content,
        commit_message=f"Rollback to v{target_version.version_number}",
        tag=target_version.tag
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    return new_version

# Diff
@app.get("/diff", response_model=List[schemas.DiffLine])
def get_diff(v1: int, v2: int, db: Session = Depends(get_db)):
    ver1 = db.query(models.PromptVersion).filter(models.PromptVersion.id == v1).first()
    ver2 = db.query(models.PromptVersion).filter(models.PromptVersion.id == v2).first()
    
    if not ver1 or not ver2:
        raise HTTPException(status_code=404, detail="One or both versions not found")
    
    diff = difflib.unified_diff(
        ver1.content.splitlines(),
        ver2.content.splitlines(),
        fromfile=f"v{ver1.version_number}",
        tofile=f"v{ver2.version_number}",
        lineterm=""
    )
    
    result = []
    # Skip the first 3 lines of unified_diff (header)
    lines = list(diff)
    for line in lines[3:] if len(lines) > 3 else lines:
        if line.startswith('+'):
            result.append({"type": "added", "content": line[1:]})
        elif line.startswith('-'):
            result.append({"type": "removed", "content": line[1:]})
        else:
            result.append({"type": "unchanged", "content": line})
            
    return result

# Test Cases
@app.post("/prompts/{prompt_id}/test-cases", response_model=schemas.TestCaseSchema)
def create_test_case(prompt_id: int, test_case: schemas.TestCaseCreate, db: Session = Depends(get_db)):
    db_test_case = models.TestCase(
        prompt_id=prompt_id,
        input=test_case.input,
        expected_output=test_case.expected_output
    )
    db.add(db_test_case)
    db.commit()
    db.refresh(db_test_case)
    return db_test_case

@app.get("/prompts/{prompt_id}/test-cases", response_model=List[schemas.TestCaseSchema])
def list_test_cases(prompt_id: int, db: Session = Depends(get_db)):
    return db.query(models.TestCase).filter(models.TestCase.prompt_id == prompt_id).all()

# Test Runs
@app.post("/versions/{version_id}/run-tests", response_model=schemas.TestRunResults)
async def run_tests(version_id: int, db: Session = Depends(get_db)):
    db_version = db.query(models.PromptVersion).filter(models.PromptVersion.id == version_id).first()
    if not db_version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    test_cases = db.query(models.TestCase).filter(models.TestCase.prompt_id == db_version.prompt_id).all()
    
    results = []
    passed_count = 0
    
    for tc in test_cases:
        actual_output = await llm.call_llm(db_version.content, tc.input)
        judge_result = await llm.run_judge(tc.expected_output, actual_output)
        
        score = judge_result.get("score", 0.0)
        reasoning = judge_result.get("reasoning", "No reasoning provided")
        passed = score >= 0.7
        
        db_run = models.TestRun(
            prompt_version_id=version_id,
            test_case_id=tc.id,
            actual_output=actual_output,
            score=score,
            reasoning=reasoning,
            passed=passed
        )
        db.add(db_run)
        results.append(db_run)
        if passed:
            passed_count += 1
            
    db.commit()
    for r in results:
        db.refresh(r)
        
    pass_rate = (passed_count / len(test_cases)) if test_cases else 1.0
    return {"results": results, "pass_rate": pass_rate}

@app.get("/versions/{version_id}/test-runs", response_model=List[schemas.TestRunSchema])
def list_test_runs(version_id: int, db: Session = Depends(get_db)):
    return db.query(models.TestRun).filter(models.TestRun.prompt_version_id == version_id).all()
