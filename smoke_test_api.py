import json
import time
import urllib.error
import urllib.parse
import urllib.request


BASE_URL = "http://127.0.0.1:8000"


def request(method: str, path: str, payload: dict | None = None):
    body = None
    headers = {}
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(f"{BASE_URL}{path}", data=body, headers=headers, method=method)
    try:
      with urllib.request.urlopen(req, timeout=60) as response:
          return response.getcode(), json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body_text = error.read().decode("utf-8")
        raise RuntimeError(f"{method} {path} failed with {error.code}: {body_text}") from error


def assert_true(condition: bool, message: str):
    if not condition:
        raise AssertionError(message)


def main():
    prompt_name = f"Codex Smoke {int(time.time())}"
    prompt_id = None

    try:
        status, created_prompt = request(
            "POST",
            "/prompts",
            {
                "name": prompt_name,
                "description": "API smoke test prompt",
            },
        )
        assert_true(status == 200, "prompt creation should succeed")
        prompt_id = created_prompt["id"]

        status, updated_prompt = request(
            "PUT",
            f"/prompts/{prompt_id}",
            {
                "name": prompt_name,
                "description": "Updated smoke test prompt",
            },
        )
        assert_true(updated_prompt["description"] == "Updated smoke test prompt", "prompt update should persist description")

        version_payloads = [
            {
                "content": "How many r's are there in Strawberry?",
                "commit_message": "Initial strawberry baseline",
            },
            {
                "content": "Count the letter r in the word Strawberry and answer in one sentence.",
                "commit_message": "Clarified output shape",
            },
        ]

        version_ids = []
        for payload in version_payloads:
            _, version = request("POST", f"/prompts/{prompt_id}/versions", payload)
            version_ids.append(version["id"])

        _, prompt_record = request("GET", f"/prompts/{prompt_id}")
        assert_true(len(prompt_record["versions"]) == 2, "prompt should expose both saved versions")

        query = urllib.parse.urlencode({"v1": version_ids[0], "v2": version_ids[1]})
        _, diff = request("GET", f"/diff?{query}")
        assert_true(len(diff) > 0, "diff endpoint should return changes")

        _, playground = request(
            "POST",
            f"/prompts/{prompt_id}/playground-run",
            {
                "content": version_payloads[1]["content"],
                "input_data": "",
            },
        )
        assert_true(bool(playground["actual_output"]), "playground run should return model output")

        _, first_case = request(
            "POST",
            f"/prompts/{prompt_id}/test-cases",
            {
                "input": "How many r's are there in Strawberry?",
                "expected_output": "There are 3 r's in Strawberry.",
            },
        )
        assert_true(first_case["prompt_id"] == prompt_id, "test case should attach to prompt")

        _, imported_cases = request(
            "POST",
            f"/prompts/{prompt_id}/test-cases/import",
            {
                "test_cases": [
                    {
                        "input": "Count the r letters in Strawberry.",
                        "expected_output": "There are 3 r letters in Strawberry.",
                    }
                ]
            },
        )
        assert_true(imported_cases["imported_count"] == 1, "bulk import should report one imported case")

        _, test_cases = request("GET", f"/prompts/{prompt_id}/test-cases")
        assert_true(len(test_cases) == 2, "prompt should expose both test cases")

        _, test_results = request("POST", f"/versions/{version_ids[1]}/run-tests")
        assert_true(len(test_results["results"]) == 2, "test suite should run against every test case")

        _, listed_runs = request("GET", f"/versions/{version_ids[1]}/test-runs")
        assert_true(len(listed_runs) >= 2, "test runs endpoint should list persisted runs")

        _, analytics = request("GET", f"/prompts/{prompt_id}/analytics")
        assert_true(len(analytics["version_stats"]) == 2, "analytics should include both versions")

        _, matrix = request("GET", f"/prompts/{prompt_id}/test-case-matrix")
        assert_true(len(matrix["rows"]) == 2, "matrix should include every test case")
        assert_true(any(row["versions"] for row in matrix["rows"]), "matrix should include stored run results")

        _, tagged = request("POST", f"/versions/{version_ids[1]}/tag", {"tag": "production", "force": False})
        assert_true(tagged["tag"] == "production", "production tag should apply after evals")

        _, rollback = request("POST", f"/versions/{version_ids[0]}/rollback")
        assert_true(rollback["version_number"] == 3, "rollback should create a new version")

        print("API smoke test passed.")
        print(json.dumps(
            {
                "prompt_id": prompt_id,
                "versions": version_ids + [rollback["id"]],
                "pass_rate": test_results["pass_rate"],
                "matrix_rows": len(matrix["rows"]),
            },
            indent=2,
        ))
    finally:
        if prompt_id is not None:
            request("DELETE", f"/prompts/{prompt_id}")


if __name__ == "__main__":
    main()
