from BLOCKCHAIN_MODULE.service.chain_service import InternalChain
from BLOCKCHAIN_MODULE.imports import *
from BLOCKCHAIN_MODULE.service.config import config
from BLOCKCHAIN_MODULE.service.builder_service import build_chain
from connect import auth , init , destroy
from SITE_MODULE.service.email_service import send_attack_report

null = None

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


# chain = build_chain(config=config, user=user)
# print(chain.load_chain())

# destroy()
# init()
# auth.account.update_role(1, "superadmin")


user = {
  "account": {
    "id": 1,
    "uid": "5396fa4b-37a3-489d-8c66-e3a53d14ffc3",
    "name": "Atharv Thakre",
    "handle": "atharv",
    "email": "atharvthakre37@gmail.com",
    "phone": 1234567890,
    "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKHIv875aqnBui4d44EdXqyAatTiQe5RreOrpTx0_5Paes_hNl7=s96-c",
    "role": "superadmin",
    "status": "active",
    "created_at": "2026-09-05T16:31:52.602447",
    "updated_at": "2026-09-05T16:33:51.471994"
  },
  "session": {
    "id": 1,
    "account_id": 1,
    "token_hash": "8fdf84b223ce3b44ba74494057fab896eec76e46f8cc937bed4db2d023202154",
    "ip_address": "115.247.247.28",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
    "expires_at": "2026-09-06T16:31:52.630575",
    "created_at": "2026-09-05T16:31:52.635030"
  },
  "payload": {
    "aid": 1,
    "sid": 1,
    "token": "V7DgnBiKIv0GA5Fd8ZM0mN51P_rYJjl456OTvzhXjBrau1Ah2yuVpBYIttc7RZfj",
    "exp": 1789210912
  }
}
attack ={
    "id": 23,
    "account_id": 1,
    "attack_id": "4bafc521-c1b3-4ed6-8c9c-0720239baafc",
    "attack_type": "ddos",
    "request": {
      "target": {
        "base_url": "https://api.codesena.me",
        "endpoint": "/tc-auth/config/pulse",
        "method": "GET",
        "path_params": null,
        "query_params": null
      },
      "request": {
        "headers": null,
        "auth": null,
        "body": null
      },
      "attack": {
        "duration": 30,
        "requests": 100,
        "concurrency": 10,
        "delay": 0.2,
        "timeout": 1,
        "retries": 0,
        "on_failure": "continue"
      }
    },
    "status": {
      "attack_id": "4bafc521-c1b3-4ed6-8c9c-0720239baafc",
      "status": "completed",
      "elapsed_seconds": 6.735074520111084,
      "progress": {
        "planned_requests": 100,
        "attempted_requests": 100,
        "active_requests": 0
      },
      "requests": {
        "successful": 91,
        "failed": 0,
        "timeouts": 0,
        "retried": 0
      },
      "performance": {
        "requests_per_second": 14.847645664706121,
        "average_latency_ms": 511.27201098191375,
        "p50_latency_ms": 412.23230003379285,
        "p95_latency_ms": 1131.919200066477,
        "p99_latency_ms": 1283.5762000177056
      },
      "status_codes": {
        "200": 91
      },
      "errors": {},
      "error_message": null
    },
    "plot": {
      "timeline": [
        {
          "time": 0,
          "attempted": 0,
          "active": 0,
          "successful": 0,
          "failed": 0,
          "timeouts": 0,
          "retried": 0,
          "rps": 0,
          "latency": {
            "average": 0,
            "p50": 0,
            "p95": 0,
            "p99": 0
          }
        },
        {
          "time": 1.0020508766174316,
          "attempted": 10,
          "active": 8,
          "successful": 2,
          "failed": 0,
          "timeouts": 0,
          "retried": 0,
          "rps": 9.979533208689416,
          "latency": {
            "average": 902.0638499641791,
            "p50": 905.5055000353605,
            "p95": 905.5055000353605,
            "p99": 905.5055000353605
          }
        },
        {
          "time": 2.013749837875366,
          "attempted": 26,
          "active": 9,
          "successful": 17,
          "failed": 0,
          "timeouts": 0,
          "retried": 0,
          "rps": 12.911236297072357,
          "latency": {
            "average": 829.5543764937012,
            "p50": 905.5055000353605,
            "p95": 1283.5762000177056,
            "p99": 1283.5762000177056
          }
        },
        {
          "time": 3.027675151824951,
          "attempted": 42,
          "active": 10,
          "successful": 32,
          "failed": 0,
          "timeouts": 0,
          "retried": 0,
          "rps": 13.872029822844178,
          "latency": {
            "average": 665.2811750027467,
            "p50": 444.1762000788003,
            "p95": 1282.6716999989003,
            "p99": 1283.5762000177056
          }
        },
        {
          "time": 4.027820825576782,
          "attempted": 56,
          "active": 5,
          "successful": 51,
          "failed": 0,
          "timeouts": 0,
          "retried": 0,
          "rps": 13.903299681157199,
          "latency": {
            "average": 583.2627215605303,
            "p50": 411.43120010383427,
            "p95": 1282.3216000106186,
            "p99": 1283.5762000177056
          }
        },
        {
          "time": 5.0423078536987305,
          "attempted": 71,
          "active": 5,
          "successful": 66,
          "failed": 0,
          "timeouts": 0,
          "retried": 0,
          "rps": 14.080853858996077,
          "latency": {
            "average": 549.8396939294638,
            "p50": 416.2688998039812,
            "p95": 1141.7477000504732,
            "p99": 1283.5762000177056
          }
        },
        {
          "time": 6.042642831802368,
          "attempted": 88,
          "active": 7,
          "successful": 81,
          "failed": 0,
          "timeouts": 0,
          "retried": 0,
          "rps": 14.563164239470996,
          "latency": {
            "average": 523.9369839424106,
            "p50": 413.4994999039918,
            "p95": 1131.919200066477,
            "p99": 1283.5762000177056
          }
        },
        {
          "time": 6.735074520111084,
          "attempted": 100,
          "active": 0,
          "successful": 91,
          "failed": 0,
          "timeouts": 0,
          "retried": 0,
          "rps": 14.847645664706121,
          "latency": {
            "average": 511.27201098191375,
            "p50": 412.23230003379285,
            "p95": 1131.919200066477,
            "p99": 1283.5762000177056
          }
        }
      ]
    },
    "created_at": "2026-09-06T04:00:10.079672"
  }


send_attack_report(email="atharvthakre37@gmail.com",attack=attack)
