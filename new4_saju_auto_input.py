import os
import json
import re
import time
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client

# ========================================
# ⚠️ 주의: 실제 사용 시 반드시 Service Role Key 사용
SUPABASE_URL = "https://iagjuubpbrafwiuoqgrr.supabase.co"
SUPABASE_KEY = "sb_publishable_RdBV5XnH2u3pMh2x5BNXew__C1uASkN"
DEEPSEEK_API_KEY = "sk-f57ff7f6cb87414ba67113a21b4b56ea"
# ========================================

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

API_URL = "https://api.deepseek.com/chat/completions"
WORKERS = 5          # 병렬 요청 수 (높이면 실패 가능성 ↑)
BATCH_SIZE = 50      # DB 한번에 저장 개수
RETRY = 7            # DeepSeek 재시도 횟수

# -------------------------------
# 사주 key 생성
def make_saju_key(year, month, day, hour, gender):
    return f"{year:04}{month:02}{day:02}{hour:02}_{gender}_S"

# -------------------------------
# 프롬프트 생성
def make_prompt(year, month, day, hour, gender):
    return f"""
당신은 사주 해석가입니다.
MZ세대 친구에게 말하듯 "팩폭형 공감" 스타일로 해석하세요.

말투 규칙
- 냉철하게 짚어주되 내 편을 들어주는 느낌
- 모호한 표현, 한자, 고풍스러운 말투 절대 금지
- 구체적이고 직접적으로 작성
- 문장 수 반드시 엄수 (lifeFlow는 7문장)

예시 말투
지금 좀 지치죠? 사실 이 사주는 혼자 다 하려는 경향이 강해요. 
3월부터 흐름이 바뀌니까 딱 그때까지만 버텨봐요.

생년월일
{year}년 {month}월 {day}일 {hour}시
성별 {gender}

JSON 외 텍스트 절대 금지
설명, 코드블록, 주석 절대 금지
반드시 JSON만 출력

각 항목 문장 수
wealth 3문장
marriage 3문장
yearlyFortune 3문장
career 3문장
relationship 3문장
health 3문장
luckyInfo 3문장
lifeFlow 7문장

JSON 형식

{{
"wealth":"재물운 3문장 (돈 버는 방식, 재물 모이는 시기, 조심할 소비 패턴 솔직하게)",
"marriage":"연애/결혼운 3문장 (어떤 사람에게 끌리는지, 연애 스타일 장단점, 주의할 점)",
"yearlyFortune":"올해 운세 3문장 (상반기 흐름, 하반기 변화 포인트, 올해 집중할 것)",
"career":"직업운 3문장 (잘 맞는 일과 이유, 커리어에서 조심할 것, 터닝포인트 시기)",
"relationship":"인간관계 3문장 (관계 패턴 강점과 약점, 좋은 인연 만나는 방법, 조심할 인연)",
"health":"건강운 3문장 (약한 부분 솔직하게, 지금 할 관리법, 조심할 시기)",
"luckyInfo":"행운 정보 3문장 (행운 색, 숫자, 방향을 친근하게 설명)",
"lifeFlow":"인생 흐름 정확히 7문장. 1)유년기 2)10대 3)20대 4)30대 5)40대 6)50대 7)노년"
}}
"""

# -------------------------------
# DeepSeek JSON 안정 추출
def extract_json(text):
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group())
    except:
        return None

# -------------------------------
# DeepSeek 호출 (재시도 포함)
def call_deepseek(prompt):
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "당신은 사주 해석가입니다. 반드시 JSON만 출력하세요. 설명, 코드블록, 추가 텍스트 금지."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 700
    }

    for attempt in range(RETRY):
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

            print("JSON 파싱 실패, 재시도 중...", attempt+1)
            time.sleep(2)

        except Exception as e:
            print("DeepSeek 호출 에러:", e)
            time.sleep(2)

    print("7회 재시도 실패, 다음 사주로 넘어갑니다.")
    return None

# -------------------------------
# 기존 캐시 로딩 (limit 1000씩 반복)
def load_existing_keys():
    print("기존 캐시 로딩 중...")
    keys = set()
    start = 0
    step = 1000
    while True:
        res = supabase.table("fortune_cache").select("saju_key").range(start, start+step-1).execute()
        if not res.data:
            break
        for r in res.data:
            keys.add(r["saju_key"])
        start += step
        print("현재 로드된 캐시 수:", len(keys))
    return keys

# -------------------------------
# 배치 DB 저장
def save_batch(rows):
    if not rows:
        return
    try:
        supabase.table("fortune_cache").insert(rows).execute()
        print(f"DB 저장: {len(rows)}개")
    except Exception as e:
        print("DB 저장 실패:", e)

# -------------------------------
# 한 사주 생성
def generate_one(task, existing_keys):
    date, hour, gender = task
    saju_key = make_saju_key(date.year, date.month, date.day, hour, gender)
    if saju_key in existing_keys:
        return None

    prompt = make_prompt(date.year, date.month, date.day, hour, gender)
    result = call_deepseek(prompt)
    if not result:
        return None

    return [
        {"saju_key": saju_key, "fortune_type": "basic", "ai_result": result},
        {"saju_key": saju_key, "fortune_type": "premium", "ai_result": result}
    ]

# -------------------------------
# 전체 생성
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

    print("총 작업 수:", len(tasks))

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

# -------------------------------
if __name__ == "__main__":
    generate()