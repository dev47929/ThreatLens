from . import XSSAttack
from schema.xss import XSSConfig
from attack import save_attack, plot , sse
import asyncio


config = {
    "target": {
        "base_url": "http://127.0.0.1:8000",
        "endpoint": "/xss/reflected",
        "method": "GET",
        "path_params": None,
        "query_params": {
            "q": ""
        }
    },

    "request": {
        "headers": {},
        "auth": None,
        "body": {}
    },

    "attack": {
        "requests_per_case": 1,
        "delay": 0.2,
        "timeout": 5,
        "on_failure": "continue"
    }
}


async def save_xss(attack_id: str, attack: XSSAttack, config: XSSConfig ):
    plt = await plot(attack)  
    status = attack.get_status()
    save_attack(
        attack_id = attack_id, 
        attack_type="xss",
        plot=plt, 
        request=config.model_dump(), 
        status=status,
    )

# attack = XSSAttack(config)

# if __name__ == "__main__":
#     asyncio.run(sse(attack))
