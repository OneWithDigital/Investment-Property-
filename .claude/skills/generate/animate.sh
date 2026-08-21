#!/usr/bin/env bash
# Animate an approved still on kie.ai, image->video, 1080p vertical.
# Reads KIE_API_KEY from .env itself.
# Usage: animate.sh <still.png> [motion_prompt] [model_key] [duration]
#   model_key : pro (default, Seedance 1.0 Pro) | lite (Seedance 1.0 Lite) | 2.5 (Seedance 2.5, explicit only)
#   duration  : Seedance 1.0 -> "5" or "10" only.  2.5 -> any integer seconds.
# Resolution is fixed at 1080p. If a request cannot be served at 1080p the
# script stops rather than dropping resolution.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

STILL="${1:?Usage: animate.sh <still.png> [motion] [model_key: pro|lite|2.5] [duration]}"
SIDE="${STILL%.png}.json"
MOTION="${2:-slow push in, subtle parallax, gentle morning light, no text}"
MODEL_KEY="${3:-pro}"
DUR="${4:-10}"   # Seedance 1.0 default is 10s
RES="1080p"   # hard floor — do not change

set -a; source "$SKILL_DIR/.env"; set +a
if [ -z "${KIE_API_KEY:-}" ] || [ "$KIE_API_KEY" = "your_kie_key_here" ]; then
  echo "ERROR: KIE_API_KEY missing/placeholder in .env"; exit 1
fi

OUT_DIR="${GENERATIONS_DIR:-$HOME/faceless/generations}"
mkdir -p "$OUT_DIR"

# --- resolution floor ---
if [ "$RES" != "1080p" ]; then
  echo "STOP: resolution floor is 1080p."; exit 1
fi

# --- model routing + per-second credit rate ---
FAMILY="v1"   # v1 (Seedance 1.0) or v25 (Seedance 2.5)
case "$MODEL_KEY" in
  pro)  MODEL="bytedance/v1-pro-image-to-video";  CPS=14; FAMILY="v1" ;;
  lite) MODEL="bytedance/v1-lite-image-to-video"; CPS=10; FAMILY="v1" ;;
  2.5|seedance-2-5)
        MODEL="bytedance/seedance-2-5"; FAMILY="v25"
        # 2.5 must be quoted from kie's live 1080p rate.
        CPS="${SEEDANCE25_CPS:-}"
        if [ -z "$CPS" ]; then
          echo "STOP: Seedance 2.5 must be quoted at kie's live 1080p rate."
          echo "      Set SEEDANCE25_CPS=<credits_per_second> from kie pricing, then re-run."
          exit 1
        fi ;;
  *) echo "STOP: unknown model key '$MODEL_KEY' (use pro | lite | 2.5)"; exit 1 ;;
esac

# --- duration: Seedance 1.0 accepts 5 or 10 only. Round (don't fail) and say so. ---
if [ "$FAMILY" = "v1" ]; then
  if [ "$DUR" != "5" ] && [ "$DUR" != "10" ]; then
    NEWDUR=$(python3 -c "d=float('$DUR'); print(10 if d>=7.5 else 5)" 2>/dev/null || echo 10)
    echo "NOTE: Seedance 1.0 supports only 5s or 10s. Requested ${DUR}s -> rounded to ${NEWDUR}s."
    DUR="$NEWDUR"
  fi
fi

COST_CREDITS=$((CPS * DUR))
COST_USD=$(python3 -c "print(f'{$COST_CREDITS/1000*5:.2f}')")

# Pull the hosted still URL from the draft's sidecar
STILL_URL=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1])).get("hosted_url",""))' "$SIDE" 2>/dev/null || true)
if [ -z "$STILL_URL" ]; then echo "ERROR: no hosted_url in $SIDE"; exit 1; fi

BASENAME="$(basename "${STILL%.png}")"
MP4_PATH="${OUT_DIR}/${BASENAME}.mp4"

# --- pre-animate QA: the clip inherits the still's dimensions, so each still must be EXACTLY 1080x1920 ---
gate_1080x1920() {
  local f="$1" label="$2" gw gh d
  read gw gh < <(python3 - "$f" <<'PY'
import struct,sys
try:
    with open(sys.argv[1],'rb') as fh:
        fh.read(16); w,h=struct.unpack('>II',fh.read(8)); print(w,h)
except Exception:
    print("0 0")
PY
)
  if [ "${gw:-0}" = "0" ]; then
    if command -v ffprobe >/dev/null 2>&1; then
      d=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of default=nw=1:nk=1 "$f" 2>/dev/null | tr '\n' ' ')
      gw=$(echo "$d" | awk '{print $1}'); gh=$(echo "$d" | awk '{print $2}')
    elif command -v sips >/dev/null 2>&1; then
      gw=$(sips -g pixelWidth "$f" 2>/dev/null | awk '/pixelWidth/{print $2}')
      gh=$(sips -g pixelHeight "$f" 2>/dev/null | awk '/pixelHeight/{print $2}')
    fi
  fi
  if [ -z "${gw:-}" ] || [ "${gw:-0}" = "0" ]; then
    echo "!!! WARNING: could not read ${label} dimensions (need python3, ffprobe, or sips). Skipping its 1080x1920 gate." >&2
  elif [ "$gw" != "1080" ] || [ "$gh" != "1920" ]; then
    echo "STOP: ${label} is ${gw}x${gh}, must be exactly 1080x1920 (the clip inherits the still's dimensions). Resize first. Nothing was spent."
    exit 1
  else
    echo "Still QA: ${label} ${gw}x${gh} = 1080x1920 OK"
  fi
}
gate_1080x1920 "$STILL" "still"

# --- pre-flight balance gate: refuse if you can't afford the clip ---
BAL_RESP=$(curl -s -m 15 -H "Authorization: Bearer ${KIE_API_KEY}" "https://api.kie.ai/api/v1/chat/credit")
BALANCE=$(printf '%s' "$BAL_RESP" | python3 -c 'import json,sys;print(int(float(json.load(sys.stdin).get("data",0))))' 2>/dev/null || echo "")
if [ -n "$BALANCE" ]; then
  echo "Balance: ${BALANCE} credits  |  this clip needs ${COST_CREDITS}"
  if [ "$BALANCE" -lt "$COST_CREDITS" ]; then
    echo "STOP: insufficient credits (${BALANCE} < ${COST_CREDITS}). Top up first. Nothing was spent."; exit 1
  fi
  echo "After this clip you'd have ~$((BALANCE - COST_CREDITS)) credits left."
else
  echo "WARN: could not read balance (continuing; kie.ai will still reject if short)."
fi

echo "Animating $BASENAME  ($MODEL, ${RES}, ${DUR}s = ${COST_CREDITS} credits ~\$${COST_USD}) ..."

# --- request body: field names differ by family ---
if [ "$FAMILY" = "v1" ]; then
  # Seedance 1.0: image_url (single string), duration STRING "5"/"10", no aspect_ratio (derives from image)
  REQ=$(python3 - "$MODEL" "$MOTION" "$STILL_URL" "$DUR" "$RES" <<'PY'
import json,sys
model,prompt,url,dur,res=sys.argv[1:6]
print(json.dumps({"model":model,"input":{
  "prompt":prompt,"image_url":url,"resolution":res,"duration":str(dur),"camera_fixed":False}}))
PY
)
else
  # Seedance 2.5: first_frame_url, aspect_ratio "adaptive", duration numeric
  REQ=$(python3 - "$MODEL" "$MOTION" "$STILL_URL" "$DUR" "$RES" <<'PY'
import json,sys
model,prompt,url,dur,res=sys.argv[1:6]
print(json.dumps({"model":model,"input":{
  "prompt":prompt,"first_frame_url":url,"aspect_ratio":"adaptive","resolution":res,"duration":int(dur)}}))
PY
)
fi

CREATE=$(curl -s -X POST "https://api.kie.ai/api/v1/jobs/createTask" \
  -H "Authorization: Bearer ${KIE_API_KEY}" -H "Content-Type: application/json" -d "$REQ")
TASK_ID=$(printf '%s' "$CREATE" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("data",{}).get("taskId",""))' 2>/dev/null || true)
if [ -z "$TASK_ID" ]; then echo "Create failed:"; echo "$CREATE"; exit 1; fi
echo "taskId: $TASK_ID  — polling every 15s (video takes longer) ..."

URL=""
for i in $(seq 1 40); do
  sleep 15
  Q=$(curl -s "https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${TASK_ID}" -H "Authorization: Bearer ${KIE_API_KEY}")
  STATE=$(printf '%s' "$Q" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("data",{}).get("state",""))' 2>/dev/null || true)
  echo "  [$i] state=$STATE"
  if [ "$STATE" = "success" ]; then
    URL=$(printf '%s' "$Q" | python3 -c 'import json,sys;d=json.load(sys.stdin);rj=d["data"].get("resultJson") or "{}";import json as j;r=j.loads(rj) if isinstance(rj,str) else rj;u=r.get("resultUrls") or r.get("resultUrl") or [];print(u[0] if isinstance(u,list) and u else (u if isinstance(u,str) else ""))' 2>/dev/null || true)
    ACTUAL=$(printf '%s' "$Q" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("data",{}).get("creditsConsumed",""))' 2>/dev/null || true)
    break
  fi
  if [ "$STATE" = "fail" ]; then echo "Generation failed:"; echo "$Q"; exit 1; fi
done
if [ -z "$URL" ]; then echo "No result URL (timed out)."; exit 1; fi

echo "Downloading -> $MP4_PATH"
curl -s -L "$URL" -o "$MP4_PATH"

# actual billed credits if kie reported them, else the quote
BILLED="$COST_CREDITS"
if [ -n "${ACTUAL:-}" ]; then BILLED=$(python3 -c "print(int(round(float('${ACTUAL}'))))" 2>/dev/null || echo "$COST_CREDITS"); fi
BILLED_USD=$(python3 -c "print(f'{$BILLED/1000*5:.2f}')")

ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"; LEDGER="${OUT_DIR}/ledger.json"
python3 - "$MP4_PATH" "$BASENAME" "$MOTION" "$URL" "$BILLED" "$BILLED_USD" "$ISO" "$LEDGER" "$STILL_URL" "$MODEL" "$RES" "$DUR" <<'PY'
import json,sys,pathlib
mp4,base,prompt,url,cc,cu,iso,ledger,still,model,res,dur=sys.argv[1:13]
cc=int(cc); cu=float(cu)
pathlib.Path(mp4).with_suffix(".json").write_text(json.dumps({
 "model":model,"type":"video","prompt":prompt,"preset":"pov",
 "source_still_url":still,"params":{"resolution":res,"duration":int(dur)},
 "hosted_url":url,"cost_credits":cc,"cost_usd":cu,"created":iso},indent=2))
lp=pathlib.Path(ledger)
data=json.loads(lp.read_text()) if lp.exists() and lp.read_text().strip() else []
data.append({"timestamp":iso,"model":model,"type":"video","cost_credits":cc,"cost_usd":cu,"description":base})
lp.write_text(json.dumps(data,indent=2))
print(f"LEDGER_TOTAL_USD={sum(x.get('cost_usd',0) for x in data):.2f}  ENTRIES={len(data)}")
PY

echo "SAVED=$MP4_PATH"
echo "QUOTED=${COST_CREDITS} credits (~\$${COST_USD})"
echo "BILLED=${BILLED} credits (~\$${BILLED_USD})"

# --- post-download QA: confirm vertical and >=1080 on the short side ---
if command -v ffprobe >/dev/null 2>&1; then
  DIMS=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of default=nw=1:nk=1 "$MP4_PATH" | tr '\n' ' ' || true)
  W=$(echo "$DIMS" | awk '{print $1}'); H=$(echo "$DIMS" | awk '{print $2}')
  echo "DIMENSIONS=${W}x${H}"
  python3 - "$W" "$H" <<'PY'
import sys
w,h=int(sys.argv[1]),int(sys.argv[2]); short=min(w,h)
print("ORIENTATION=vertical OK" if h>w else f"ORIENTATION=WRONG (not vertical, {w}x{h})")
print("RESOLUTION=1080p+ OK" if short>=1080 else f"RESOLUTION=BELOW FLOOR (short side {short} < 1080)")
PY
fi
if command -v ffmpeg >/dev/null 2>&1; then
  ffmpeg -y -v error -i "$MP4_PATH" -frames:v 1 "${MP4_PATH%.mp4}_frame.png" && echo "FRAME=${MP4_PATH%.mp4}_frame.png"
fi
echo "DONE"
