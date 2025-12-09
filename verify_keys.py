import hashlib
import hmac
import os
import time
from urllib.parse import urlencode

import requests

# Credentials from local.env
API_KEY = "a951d11fda5023b288630ffe4263115d133d29c5c943760246b92bfbde79640f"
SECRET_KEY = "0b6178cf1d583c5e61e4565842a074092aa08cb9219bebaf8e1f7a4787c95d82"
BASE_URL = "https://fapi.asterdex.com"


def get_signature(params, secret):
    query_string = urlencode(params)
    signature = hmac.new(
        secret.encode("utf-8"), query_string.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return signature


def check_balance():
    endpoint = "/fapi/v4/account"
    params = {"timestamp": int(time.time() * 1000)}
    params["signature"] = get_signature(params, SECRET_KEY)

    headers = {"X-MBX-APIKEY": API_KEY}

    print(f"Testing API Key: {API_KEY[:6]}...")
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", params=params, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    check_balance()
