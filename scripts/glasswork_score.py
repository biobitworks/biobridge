"""
Glasswork model scoring for BioBridge's deterministic core.

Runs one fixed custody task (structured extraction from a fixed source) across
a spread of Butterbase models, scores each against a SEALED golden answer
(the oracle / golden path), and ranks by cost-to-pass — the cheapest model
that clears the precision/recall bar wins. This is the Glasswork method applied
to BioBridge's deterministic extraction core.
"""
import os, json, time, hashlib
import requests

BB_KEY = os.environ["BUTTERBASE_API_KEY"]
BB = "https://api.butterbase.ai/v1/chat/completions"

# ---- The deterministic task: extract these fields from a fixed source. ----
SOURCE = (
    "Retro Biosciences is a San Francisco longevity biotech founded by Joe Betts-LaCroix, "
    "developing therapies that target aging biology to extend healthy human lifespan by ~10 years."
)
# ---- Golden path: sealed reference answer. Its Merkle root is the yardstick. ----
GOLD = {"org": "Retro Biosciences", "hq": "San Francisco", "founder": "Joe Betts-LaCroix", "category": "longevity biotech"}
GOLD_ROOT = hashlib.sha256(json.dumps(GOLD, sort_keys=True).encode()).hexdigest()

PROMPT = (
    "Extract EXACTLY this JSON (keys: org, hq, founder, category) from the text. "
    "Return ONLY the JSON, no prose.\n\nTEXT:\n" + SOURCE
)

MODELS = [
    "openai/gpt-4o-mini",
    "anthropic/claude-3-haiku",
    "google/gemini-2.5-flash",
    "google/gemma-2-27b-it",
    "meta-llama/llama-3.1-8b-instruct",
    "deepseek/deepseek-chat",
    "openai/gpt-oss-120b",
    "qwen/qwen-2.5-7b-instruct",
]

def call(model):
    t0=time.time()
    r=requests.post(BB, headers={"Authorization":f"Bearer {BB_KEY}","Content-Type":"application/json"},
        json={"model":model,"messages":[{"role":"user","content":PROMPT}],"max_tokens":150,"temperature":0}, timeout=60)
    dt=time.time()-t0
    if r.status_code!=200:
        return {"ok":False,"err":f"HTTP {r.status_code}","dt":dt}
    d=r.json()
    txt=d["choices"][0]["message"]["content"].strip()
    usage=d.get("usage",{})
    return {"ok":True,"text":txt,"tokens":usage.get("total_tokens",0),"dt":dt}

def score(text):
    """precision/recall of extracted fields vs sealed golden path."""
    try:
        s=text[text.find("{"):text.rfind("}")+1]
        got=json.loads(s)
    except Exception:
        return 0.0,0.0,None,"invalid_json"
    correct=sum(1 for k,v in GOLD.items() if str(got.get(k,"")).strip().lower()==v.lower())
    got_keys=[k for k in GOLD if got.get(k)]
    recall=correct/len(GOLD)
    precision=correct/max(len(got_keys),1)
    got_root=hashlib.sha256(json.dumps({k:got.get(k) for k in GOLD},sort_keys=True).encode()).hexdigest()
    return precision,recall,got_root,("match" if got_root==GOLD_ROOT else "diverged")

print(f"GOLDEN ROOT (sealed): {GOLD_ROOT[:24]}…\n")
rows=[]
for m in MODELS:
    res=call(m)
    if not res["ok"]:
        print(f"  {m:<38} ERROR {res['err']}"); continue
    p,rc,root,verdict=score(res["text"])
    passed = p>=1.0 and rc>=1.0
    rows.append({"model":m,"pass":passed,"precision":p,"recall":rc,"tokens":res["tokens"],"verdict":verdict})
    print(f"  {m:<38} {'PASS' if passed else 'fail'}  P={p:.2f} R={rc:.2f}  tok={res['tokens']:<4} {verdict}")

winners=[r for r in rows if r["pass"]]
winners.sort(key=lambda r:r["tokens"])
print("\n=== Glasswork verdict ===")
if winners:
    w=winners[0]
    print(f"Cheapest model that PASSES the golden bar: {w['model']}  ({w['tokens']} tokens)")
else:
    print("No model cleared the bar on this task.")
json.dump(rows, open("/tmp/glasswork_results.json","w"))
