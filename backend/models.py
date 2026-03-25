from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    versions = relationship("PromptVersion", back_populates="prompt", cascade="all, delete-orphan")
    test_cases = relationship("TestCase", back_populates="prompt", cascade="all, delete-orphan")

class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    id = Column(Integer, primary_key=True, index=True)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    commit_message = Column(String, nullable=True)
    tag = Column(String, nullable=True) # e.g. "production", "staging", "experiment"
    created_at = Column(DateTime, default=datetime.utcnow)

    prompt = relationship("Prompt", back_populates="versions")
    test_runs = relationship("TestRun", back_populates="prompt_version", cascade="all, delete-orphan")

class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False)
    input = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    prompt = relationship("Prompt", back_populates="test_cases")
    test_runs = relationship("TestRun", back_populates="test_case", cascade="all, delete-orphan")

class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(Integer, primary_key=True, index=True)
    prompt_version_id = Column(Integer, ForeignKey("prompt_versions.id"), nullable=False)
    test_case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False)
    actual_output = Column(Text, nullable=True)
    score = Column(Float, nullable=True) # 0.0 to 1.0
    reasoning = Column(Text, nullable=True)
    passed = Column(Boolean, default=False)
    ran_at = Column(DateTime, default=datetime.utcnow)

    prompt_version = relationship("PromptVersion", back_populates="test_runs")
    test_case = relationship("TestCase", back_populates="test_runs")
