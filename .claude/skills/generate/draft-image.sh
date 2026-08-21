#!/usr/bin/env bash
# Draft a still on any kie.ai image model. Reads KIE_API_KEY from .env itself.
# Usage: draft-image.sh <model> <resolution> <basename> <prompt>
set -euo pipefail
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MODEL="${1:?model}"; RES="${2:?resolution}"; BASE="${3:?basename}"; PROMPT="${4:?prompt}"
set -a; source "$SKILL_DIR/.env"; set +a
if [ -z "${KIE_API_KEY:-}" ] || [ "$KIE_API_KEY" = "your_kie_key_here" ]; then
  echo "ERROR: KIE_API_KEY missing/placeholder in .env"; exit 1
fi

OUT_DIR="${GENERATIONS_DIR:-$HOME/faceless/generations}"
mkdir -p "$OUT_DIR"

TS="$(date +%Y%m%d-%H%M%S)"
BASENAME="${BASE}_${TS}"
IMG_PATH="${OUT_DIR}/${BASENAME}.png"

echo "Submitting draft to ${MODEL} (${RES}, 9:16) ..."
REQ=$(python3 - "$MODEL" "$PROMPT" "$RES" <<'PY'
import json,sys
model,prompt,res=sys.argv[1:4]
print(json.dumps({"model":model,"input":{
  "prompt":prompt,"aspect_ratio":"9:16","resolution":res}}))
PY
)
CREATE=$(curl -s -X POST "https://api.kie.ai/api/v1/jobs/createTask" \
  -H "Authorization: Bearer ${KIE_API_KEY}" -H "Content-Type: application/json" -d "$REQ")
TASK_ID=$(printf '%s' "$CREATE" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("data",{}).get("taskId",""))' 2>/dev/null || true)
if [ -z "$TASK_ID" ]; then echo "Create failed:"; echo "$CREATE"; exit 1; fi
echo "taskId: $TASK_ID  — polling every 12s ..."

URL=""; CREDITS=""
for i in $(seq 1 30); do
  sleep 12
  Q=$(curl -s "https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${TASK_ID}" -H "Authorization: Bearer ${KIE_API_KEY}")
  STATE=$(printf '%s' "$Q" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("data",{}).get("state",""))' 2>/dev/null || true)
  echo "  [$i] state=$STATE"
  if [ "$STATE" = "success" ]; then
    URL=$(printf '%s' "$Q" | python3 -c 'import json,sys;d=json.load(sys.stdin);rj=d["data"].get("resultJson") or "{}";import json as j;r=j.loads(rj) if isinstance(rj,str) else rj;u=r.get("resultUrls") or r.get("resultUrl") or [];print(u[0] if isinstance(u,list) and u else (u if isinstance(u,str) else ""))' 2>/dev/null || true)
    CREDITS=$(printf '%s' "$Q" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("data",{}).get("creditsConsumed",""))' 2>/dev/null || true)
    break
  fi
  if [ "$STATE" = "fail" ]; then echo "Generation failed:"; echo "$Q"; exit 1; fi
done
if [ -z "$URL" ]; then echo "No result URL (timed out)."; exit 1; fi

echo "Downloading -> $IMG_PATH"
curl -s -L "$URL" -o "$IMG_PATH"

# Draft at 2K for detail, then fit to EXACTLY 1080x1920 (9:16) with scale-to-cover + centre crop
# (no distortion; non-9:16 sources are cropped, never squashed). Cross-platform: ffmpeg, else sips,
# else Pillow. If none is available, warn loudly rather than skip quietly.
read CW CH < <(python3 - "$IMG_PATH" <<'PY'
import struct,sys
try:
    with open(sys.argv[1],'rb') as f:
        f.read(16); w,h=struct.unpack('>II',f.read(8)); print(w,h)
except Exception:
    print("0 0")
PY
)
if [ "${CW:-0}" = "1080" ] && [ "${CH:-0}" = "1920" ]; then
  : # already exact
elif command -v ffmpeg >/dev/null 2>&1; then
  TMP="${IMG_PATH%.*}__r.png"
  ffmpeg -y -v error -i "$IMG_PATH" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" "$TMP" && mv "$TMP" "$IMG_PATH"
  echo "Resized still ${CW}x${CH} -> 1080x1920 (scale + centre crop, animate-ready)."
elif command -v sips >/dev/null 2>&1; then
  # scale on the binding dimension so the frame is fully covered, then centre-crop to exact size
  if [ "${CW:-0}" -gt 0 ] && [ "${CH:-0}" -gt 0 ] && [ $(( CW * 1920 )) -gt $(( CH * 1080 )) ]; then
    sips --resampleHeight 1920 "$IMG_PATH" >/dev/null 2>&1   # source relatively wider -> bind on height
  else
    sips --resampleWidth 1080 "$IMG_PATH" >/dev/null 2>&1    # source relatively taller -> bind on width
  fi
  sips -c 1920 1080 "$IMG_PATH" >/dev/null 2>&1               # centre-crop to exactly 1080x1920
  echo "Resized still ${CW}x${CH} -> 1080x1920 (scale + centre crop, animate-ready)."
elif python3 -c "import PIL" >/dev/null 2>&1; then
  python3 - "$IMG_PATH" <<'PY'
from PIL import Image
import sys
p=sys.argv[1]; im=Image.open(p).convert("RGB")
tw,th=1080,1920; w,h=im.size
s=max(tw/w, th/h); nw,nh=round(w*s),round(h*s)
im=im.resize((nw,nh), Image.LANCZOS)
l=(nw-tw)//2; t=(nh-th)//2
im.crop((l,t,l+tw,t+th)).save(p)
PY
  echo "Resized still ${CW}x${CH} -> 1080x1920 (scale + centre crop, animate-ready)."
else
  echo "!!! WARNING: no image resizer found (need ffmpeg, sips, or Python Pillow)." >&2
  echo "!!! Still left at ${CW}x${CH} — NOT 1080x1920, so animate will refuse it. Install ffmpeg." >&2
fi

ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"; LEDGER="${OUT_DIR}/ledger.json"
python3 - "$IMG_PATH" "$BASENAME" "$PROMPT" "$URL" "$MODEL" "$RES" "$CREDITS" "$ISO" "$LEDGER" <<'PY'
import json,sys,pathlib
img,base,prompt,url,model,res,credits,iso,ledger=sys.argv[1:10]
try: cc=int(round(float(credits)))
except: cc=10
cu=round(cc/1000*5,4)
pathlib.Path(img).with_suffix(".json").write_text(json.dumps({
 "model":model,"type":"image","prompt":prompt,
 "params":{"aspect_ratio":"9:16","resolution":res,"output_format":"png"},
 "hosted_url":url,"cost_credits":cc,"cost_usd":cu,"created":iso},indent=2))
lp=pathlib.Path(ledger)
data=json.loads(lp.read_text()) if lp.exists() and lp.read_text().strip() else []
data.append({"timestamp":iso,"model":model,"type":"image","cost_credits":cc,"cost_usd":cu,"description":base})
lp.write_text(json.dumps(data,indent=2))
print(f"COST={cc} credits (~${cu})  LEDGER_TOTAL_USD={sum(x['cost_usd'] for x in data):.2f}")
PY
echo "HOSTED_URL=$URL"
echo "SAVED=$IMG_PATH"
echo "DONE"
