import sys
import requests
import json
API_URL = "https://tools.dongvanfb.net/api/get_messages_oauth2"

def main():
    if len(sys.argv) != 4:
        print("Usage: getMail.exe <email> <refresh_token> <client_id>", file=sys.stderr)
        sys.exit(1)

    email = sys.argv[1]
    refresh_token = sys.argv[2]
    client_id = sys.argv[3]

    body = {
        "email": email,
        "refresh_token": refresh_token,
        "client_id": client_id,
    }

    try:
        res = requests.post(API_URL, json=body)
        res.raise_for_status()
        data = res.json()
        with open("data.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        mail_box = data.get("messages", [])
        if not mail_box:
            print("No messages found", file=sys.stderr)
            sys.exit(1)

        last_mail = mail_box[0]
        subject = last_mail.get("subject", "")

        if 'là mã Instagram của bạn' in subject:
            code = last_mail.get("code")
            if code:
                print(code)
                sys.exit(0)
            else:
                print("Code not found", file=sys.stderr)
                sys.exit(1)
        else:
            print("No Instagram code in subject", file=sys.stderr)
            sys.exit(1)

    except requests.exceptions.RequestException as e:
        if e.response is not None:
            try:
                err_json = e.response.json()
                print(f"Request failed: {err_json}", file=sys.stderr)
            except Exception:
                print(f"Request failed: {e.response.text}", file=sys.stderr)
        else:
            print(f"Request error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
