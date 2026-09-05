from attack.ddos import DDoSAttack
from attack import plot , save_attack , sse
from schema.data_burning import DataBurningConfig
import asyncio



config = {
    "target": {
        "base_url": "http://localhost:8000",
        "endpoint": "/tc-auth/login/password",
        "method": "POST",
        "path_params": None,
        "query_params": None,
    },

    "request": {
        "headers": {
            "Content-Type": "application/json",
        },
        "auth": None,
        "body": {
            "email": "test@example.com",
            "password": "test-password",
        },
    },

    "attack": {
        "duration": 30,
        "requests": 100,
        "concurrency": 10,
        "delay": 0.2,
        "timeout": 1,
        "retries": 0,
        "on_failure": "continue",
    },
}


async def save_data_burn(attack_id: str, attack: DDoSAttack, config: DataBurningConfig ):
    plt = await plot(attack)  
    status = attack.get_status()
    save_attack(
        attack_id = attack_id, 
        attack_type="data_burning",
        plot=plt, 
        request=config.model_dump(), 
        status=status,
    )



# attack = DDoSAttack(config)

# if __name__ == "__main__":
#     asyncio.run(sse(attack))