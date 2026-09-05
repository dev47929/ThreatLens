from . import OriginProxyAttack
from schema.proxy import OriginProxyConfig

from attack import sse, plot, save_attack
import asyncio

config = {
    "target": {
        "base_url": "http://127.0.0.1:8000",
        "endpoint": "/test",
        "method": "GET",
        "path_params": None,
        "query_params": None
    },

    "request": {
        "headers": {},
        "auth": None,
        "body": None
    },

    "attack": {
        "requests_per_case": 1,
        "delay": 0.2,
        "timeout": 5,
        "on_failure": "continue"
    }
}


async def save_origin_proxy(attack_id: str, attack: OriginProxyAttack, config: OriginProxyConfig ):
    plt = await plot(attack) 
    print(plt)
    status = attack.get_status()
    save_attack(
        attack_id = attack_id, 
        attack_type="origin_proxy",
        plot=plt, 
        request=config.model_dump(), 
        status=status,
    )


# attack = OriginProxyAttack(config)
# if __name__ == "__main__":
#     asyncio.run(sse(attack))