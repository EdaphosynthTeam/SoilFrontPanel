import flask
import flask_cors
import json
import requests
import random
import ai
import threading

app = flask.Flask(__name__)
flask_cors.CORS(app)

# 如果有json post请求，然后{"type":"getCurrentPH"}，就返回{"ph":7.0}

@app.route("/", methods=["POST"])
def getCurrentPH():
    global ph  # 添加这行
    if flask.request.method == "POST":
        data = flask.request.get_json()
        if data["type"] == "getStatus":
            return {"status": "ok", "temp": random.randint(20, 21), "wp": round(random.uniform(50.0, 60.0), 1), "ph": round(random.uniform(7.0, 7.5), 1), "code": 200}
        elif data["type"] == "check":
            return {"status": "ok", "code": 200}
        elif data["type"] == "getAIResult":
            print("getAIResult")
            if data['time']:
                aiResult = ai.getAIResult(round(random.uniform(7.0, 7.5), 1), data['time'])
                if aiResult == "获取AI信息失败":
                    return {"status": "error", "code": -1, "message": aiResult}
                else:
                    return {"status": "ok", "code": 200, "message": aiResult} if len(aiResult) <= 90 else {"status": "ok", "code": 200, "message": aiResult[:90]}  # 如果没到90字就直接返回
            else:
                return {"status": "error", "code": 400, "message": "Invalid parameters"}
            # return {"status": "ok", "code": 200, "message": "AI功能可以用，但是调试时不断刷新会扣API次数，所以暂时关闭"}
        elif data["type"] == "getAlarmStatus":
            return {"status": "ok", "code": 200, "value": random.randint(0, 1)}
        else:
            return {"status": "error", "code": 400, "message": "Invalid type"}
if __name__ == "__main__":
    app.run(port=8080,host="0.0.0.0")  # 设置端口为4500
