import json
import requests

def getAIResult(ph, time):
    with open("./config.json", "r") as f:
        config = json.load(f)
        url = config["api_url"]
        token = config["api_key"]
        model = config["model"]
        headers = {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        }
        data = {
            "model": model,
            "messages": [{"role": "assistant", "content": "好的，我已经知道了，接下来的回答示例：“今天土壤偏酸，需要进行调整...” 这里是部分，完整由于篇幅接下来再说"}, {"role": "system", "content": f"你是一个土壤检测专家，精通酸碱度对作物的影响，输出示例：今天土壤偏酸，需要进行调整... 实际上应该要写多一点(20-30字左右) 不要用markdown 我们每{str(time)}小时给你检测一次"}, {"role": "user", "content": f"pH:{str(ph)}"}]
        }
        response = requests.post(url, headers=headers, json=data)
        result = response.json()
        try:
            return result['choices'][0]['message']['content']
        except Exception as e:
            return "获取AI信息失败"