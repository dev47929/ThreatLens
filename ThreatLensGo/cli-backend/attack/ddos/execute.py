from attack import save_attack, plot, sse
from attack.ddos import DDoSAttack
from schema.ddos import DDoSConfig
import asyncio 


config = {
    "target": {
        "base_url": "http://localhost:8000",
        "endpoint": "/tc-auth/config/pulse",
        "method": "GET",
        "path_params": None,
        "query_params": None
    },

    "request": {
        "headers": None,
        "auth": None,
        "body": None
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
}


async def save_ddos(attack_id: str, attack: DDoSAttack, config: DDoSConfig ):
    plt = await plot(attack)  
    status = attack.get_status()
    save_attack(
        attack_id = attack_id, 
        attack_type="ddos",
        plot=plt, 
        request=config.model_dump(), 
        status=status,
    )


# attack = DDoSAttack(config)
# if __name__ == "__main__":
#     asyncio.run(sse(attack))
