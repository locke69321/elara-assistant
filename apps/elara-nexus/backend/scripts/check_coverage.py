import json
from pathlib import Path

THRESHOLD = 90.0


def main() -> int:
    path = Path("coverage.json")
    payload = json.loads(path.read_text(encoding="utf-8"))
    totals = payload.get("totals", {})

    lines_pct = float(totals.get("percent_covered", 0.0))
    covered_branches = int(totals.get("covered_branches", 0))
    missing_branches = int(totals.get("missing_branches", 0))
    branch_total = covered_branches + missing_branches
    branch_pct = 100.0 if branch_total == 0 else (covered_branches / branch_total) * 100.0

    print(f"Line coverage: {lines_pct:.2f}%")
    print(f"Branch coverage: {branch_pct:.2f}%")

    if lines_pct < THRESHOLD or branch_pct < THRESHOLD:
        print(f"Coverage gate failed (required {THRESHOLD:.2f}% for both line and branch).")
        return 1

    print("Coverage gate passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
