"""Génère les badges shields.io (endpoint) de couverture et de tests."""

import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def color(pct):
    return (
        "brightgreen" if pct >= 90 else "green" if pct >= 80 else "yellow" if pct >= 70 else "red"
    )


def main(coverage_json, junit_xml, out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    pct = json.loads(Path(coverage_json).read_text())["totals"]["percent_covered"]
    badge = {
        "schemaVersion": 1,
        "label": "couverture",
        "message": f"{pct:.0f}%",
        "color": color(pct),
    }
    (out / "coverage.json").write_text(json.dumps(badge))

    suite = ET.parse(junit_xml).getroot()
    suite = suite if suite.tag == "testsuite" else suite.find("testsuite")
    total = int(suite.get("tests"))
    failed = int(suite.get("failures")) + int(suite.get("errors"))
    passed = total - failed - int(suite.get("skipped"))
    message = f"{passed} réussis" if not failed else f"{failed} en échec"
    badge = {
        "schemaVersion": 1,
        "label": "tests",
        "message": message,
        "color": "brightgreen" if not failed else "red",
    }
    (out / "tests.json").write_text(json.dumps(badge))


if __name__ == "__main__":
    main(*sys.argv[1:4])
