from BLOCKCHAIN_MODULE.service.chain_service import InternalChain
from BLOCKCHAIN_MODULE.imports import *
from BLOCKCHAIN_MODULE.service.config import config
from BLOCKCHAIN_MODULE.service.builder_service import build_chain
from connect import auth , init , destroy

user = {
  "account": {
    "id": 1,
    "uid": "ae510a25-bf2d-4da8-93db-b4661666dc20",
    "name": "Atharv Thakre",
    "handle": "atharv",
    "email": "atharvthakre37@gmail.com",
    "phone": None,
    "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKHIv875aqnBui4d44EdXqyAatTiQe5RreOrpTx0_5Paes_hNl7=s96-c",
    "role": "superadmin",
    "status": "active",
    "created_at": "2026-08-24T23:27:51.685544",
    "updated_at": "2026-08-25T00:09:19.896125"
  },
  "session": {
    "id": 11,
    "account_id": 1,
    "token_hash": "00cb6ca6768e28d8f2600f04d083e4eb891eea2dec25e2cb875ff2c22924eb16",
    "ip_address": "2405:201:301a:10ec:2d28:ac5c:2d06:a736",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
    "expires_at": "2026-09-02T01:13:35.171025",
    "created_at": "2026-09-01T01:13:35.175363"
  },
  "payload": {
    "aid": 1,
    "sid": 11,
    "token": "b4_aATkYhytU080SU5LfGpBPm9ytUAGUD88DQ_1BbYTAKgwwNFRIq41VIALFx0yc",
    "exp": 1788810215
  }
}


chain = build_chain(config=config, user=user)
print(chain.load_chain())
