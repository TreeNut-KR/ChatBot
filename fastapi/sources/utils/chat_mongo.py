import uuid
from pymongo import MongoClient

username = "root"  # MongoDB 사용자 이름
password = "1234"  # MongoDB 비밀번호
client = MongoClient(f'mongodb://{username}:{password}@192.168.219.105:27017/')  # MongoDB 서버 주소
db = client['TreeNut']  # 데이터베이스 이름
collection = db['chatlog']  # 컬렉션 이름

def generate_data(api_data):
    value = []
    for index, item in enumerate(api_data, start=1):  # 인덱스를 1부터 시작
        value.append({
            "index": index,
            "img": str(item.get("img", "")),
            "input": str(item.get("input", "")),
            "output": str(item.get("output", ""))
        })
    
    data = {
        "id": str(uuid.uuid4()),  # UUID 생성
        "value": value
    }
    return data

# 저장된 데이터의 id로 검색
def find_data_by_id(data_id):
    result = collection.find_one({"id": data_id})  # id로 데이터 검색
    return result


if __name__ == "__main__":
    # 예시 API 데이터 (실제 API에서 받아온 데이터로 대체)
    api_data = [
        {"img": "image1.png", "input": "input1", "output": "output1"},
        {"img": "image2.png", "input": "input2", "output": "output2"},
        # 추가 데이터...
    ]

    # 데이터를 생성하고 MongoDB에 저장
    data = generate_data(api_data)
    collection.insert_one(data)

    print("데이터가 성공적으로 저장되었습니다.")
    # 데이터 검색 예시
    searched_id = data["id"]  # 방금 생성된 데이터의 id
    found_data = find_data_by_id(searched_id)

    if found_data:
        print("검색된 데이터:", found_data)
    else:
        print("해당 id의 데이터가 존재하지 않습니다.")
