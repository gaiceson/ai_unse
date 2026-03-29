import os
import json
import re
import time
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client

SUPABASE_URL = "https://iagjuubpbrafwiuoqgrr.supabase.co"
SUPABASE_KEY = "sb_publishable_RdBV5XnH2u3pMh2x5BNXew__C1uASkN"
DEEPSEEK_API_KEY = "sk-f57ff7f6cb87414ba67113a21b4b56ea"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

API_URL = "https://api.deepseek.com/chat/completions"

WORKERS = 5
BATCH_SIZE = 50


def make_saju_key(year, month, day, hour, gender):
    return f"{year:04}{month:02}{day:02}{hour:02}_{gender}_S"


def make_prompt(year, month, day, hour, gender):

    return f"""
생년월일
{year}년 {month}월 {day}일 {hour}시
성별 {gender}

다음 JSON 형식으로만 답하세요.
설명 금지
코드블록 금지
JSON 외 텍스트 금지

문장 규칙
wealth 3문장
marriage 3문장
yearlyFortune 3문장
career 3문장
relationship 3문장
health 3문장
luckyInfo 3문장
lifeFlow 7문장

{{
"wealth":"",
"marriage":"",
"yearlyFortune":"",
"career":"",
"relationship":"",
"health":"",
"luckyInfo":"",
"lifeFlow":""
}}
"""


def extract_json(text):

    match = re.search(r"\{.*\}", text, re.DOTALL)

    if not match:
        return None

    try:
        return json.loads(match.group())
    except:
        return None


def call_deepseek(prompt):

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "JSON만 출력"},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }

    for attempt in range(5):

        try:

            res = requests.post(API_URL, headers=headers, json=data, timeout=60)

            if res.status_code != 200:

                print("API 오류:", res.text)
                time.sleep(2)
                continue

            content = res.json()["choices"][0]["message"]["content"]

            parsed = extract_json(content)

            if parsed:
                return parsed

            print("JSON 파싱 실패 재시도")

        except Exception as e:

            print("Deepseek error:", e)

        time.sleep(2)

    return None


def load_existing_keys():

    print("기존 캐시 로딩중...")

    res = supabase.table("fortune_cache").select("saju_key").execute()

    keys = {r["saju_key"] for r in res.data}

    print("기존 캐시:", len(keys))

    return keys


def save_batch(rows):

    if not rows:
        return

    try:

        supabase.table("fortune_cache").insert(rows).execute()

        print("DB 저장:", len(rows))

    except Exception as e:

        print("DB 저장 실패:", e)


def generate_one(task, existing_keys):

    date, hour, gender = task

    saju_key = make_saju_key(date.year, date.month, date.day, hour, gender)

    if saju_key in existing_keys:
        return None

    prompt = make_prompt(date.year, date.month, date.day, hour, gender)

    result = call_deepseek(prompt)

    if not result:
        return None

    rows = [
        {
            "saju_key": saju_key,
            "fortune_type": "basic",
            "ai_result": result
        },
        {
            "saju_key": saju_key,
            "fortune_type": "premium",
            "ai_result": result
        }
    ]

    return rows


def generate():

    print("사주 캐시 생성 시작")

    existing_keys = load_existing_keys()

    start = datetime(1980,1,1)
    end = datetime(2010,12,31)

    hours = [0,6,12,18]
    genders = ["M","F"]

    tasks = []

    date = start

    while date <= end:

        for hour in hours:
            for gender in genders:

                tasks.append((date,hour,gender))

        date += timedelta(days=1)

    print("총 작업:", len(tasks))

    batch = []
    done = 0

    with ThreadPoolExecutor(max_workers=WORKERS) as executor:

        futures = [executor.submit(generate_one, t, existing_keys) for t in tasks]

        for future in as_completed(futures):

            rows = future.result()

            done += 1

            if done % 100 == 0:
                print(f"진행률 {done}/{len(tasks)}")

            if rows:
                batch.extend(rows)

            if len(batch) >= BATCH_SIZE:

                save_batch(batch)

                batch = []

    save_batch(batch)

    print("전체 완료")


if __name__ == "__main__":
    generate()