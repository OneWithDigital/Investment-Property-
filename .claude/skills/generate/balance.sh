#!/usr/bin/env bash
# Show remaining kie.ai credit balance. Reads KIE_API_KEY from .env (never prints it).
set -euo pipefail
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set -a; source "$SKILL_DIR/.env"; set +a

RESP=$(curl -s -m 15 -H "Authorization: Bearer ${KIE_API_KEY}" "https://api.kie.ai/api/v1/chat/credit")
python3 - "$RESP" <<'PY'
import json,sys
try:
    cr=float(json.loads(sys.argv[1]).get("data",0))
except Exception:
    print("Could not read balance. Raw:", sys.argv[1]); raise SystemExit(1)
usd=cr/1000*5  # ~$5 per 1,000 credits, 1 credit = half a cent
print(f"kie.ai balance: {cr:.0f} credits  (~${usd:.2f})")
print(f"  stills (10cr)                        : ~{int(cr//10)}")
print(f"  10s 1080p Pro clips  (video 140cr)   : ~{int(cr//140)}   [finished w/ still 150cr: ~{int(cr//150)}]")
print(f"  10s 1080p Lite clips (video 100cr)   : ~{int(cr//100)}   [finished w/ still 110cr: ~{int(cr//110)}]")
PY
