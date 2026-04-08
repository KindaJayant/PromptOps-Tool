import argparse
import asyncio
import json
import os
import sys
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, llm

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

async def list_prompts():
    db = SessionLocal()
    prompts = db.query(models.Prompt).all()
    print(f"{'ID':<5} | {'Name':<20} | {'Versions':<10}")
    print("-" * 40)
    for p in prompts:
        print(f"{p.id:<5} | {p.name:<20} | {len(p.versions):<10}")
    db.close()

async def run_tests(version_id: int):
    db = SessionLocal()
    version = db.query(models.PromptVersion).filter(models.PromptVersion.id == version_id).first()
    if not version:
        print(f"Error: Version {version_id} not found.")
        db.close()
        return

    test_cases = db.query(models.TestCase).filter(models.TestCase.prompt_id == version.prompt_id).all()
    if not test_cases:
        print("No test cases found for this prompt.")
        db.close()
        return

    print(f"Running {len(test_cases)} tests for version {version.version_number} of '{version.prompt.name}'...")
    
    # Simple sequential loop for CLI visibility, or could use parallel
    passed_count = 0
    for i, tc in enumerate(test_cases):
        print(f"[{i+1}/{len(test_cases)}] Case ID {tc.id}: ", end="", flush=True)
        try:
            actual_output = await llm.call_llm(version.content, tc.input)
            judge_result = await llm.run_judge(tc.expected_output, actual_output)
            score = judge_result.get("score", 0.0)
            passed = score >= 0.7
            if passed:
                print("\033[92mPASSED\033[0m")
                passed_count += 1
            else:
                print(f"\033[91mFAILED\033[0m (Score: {score})")
            
            # Save run
            run = models.TestRun(
                prompt_version_id=version_id,
                test_case_id=tc.id,
                actual_output=actual_output,
                score=score,
                reasoning=judge_result.get("reasoning", ""),
                passed=passed
            )
            db.add(run)
        except Exception as e:
            print(f"\033[91mERROR\033[0m: {str(e)}")

    db.commit()
    print("-" * 40)
    print(f"Total: {len(test_cases)} | Passed: {passed_count} | Failed: {len(test_cases) - passed_count}")
    db.close()

def main():
    parser = argparse.ArgumentParser(description="PromptOps CLI Tool")
    subparsers = parser.add_subparsers(dest="command")

    # List command
    subparsers.add_parser("list", help="List all prompts")

    # Run command
    run_parser = subparsers.add_parser("run", help="Run tests for a version")
    run_parser.add_argument("version_id", type=int, help="ID of the prompt version to test")

    args = parser.parse_args()

    if args.command == "list":
        asyncio.run(list_prompts())
    elif args.command == "run":
        asyncio.run(run_tests(args.version_id))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
