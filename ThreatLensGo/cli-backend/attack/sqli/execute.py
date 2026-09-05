from . import SQLInjectionAttack
from schema.sqli import SQLiConfig
from attack import plot , save_attack , sse
import asyncio


config = {
  "target": {
    "base_url": "http://localhost:8000",
    "endpoint": "/login",
    "method": "POST",
    "path_params": None,
    "query_params": None
  },

  "request": {
    "headers": {
      "Content-Type": "application/json"
    },
    "auth": None,
    "body": {
      "username": "test",
      "password": "test"
    }
  },

  "attack": {
    "requests_per_case": 1,
    "delay": 0.2,
    "timeout": 5,
    "on_failure": "continue"
  }
}

async def save_sqli(attack_id: str, attack: SQLInjectionAttack, config: SQLiConfig ):
    plt = await plot(attack)  
    status = attack.get_status()
    save_attack(
        attack_id = attack_id, 
        attack_type="sqli",
        plot=plt, 
        request=config.model_dump(), 
        status=status,
    )



# attack = SQLInjectionAttack(config)
# if __name__ == "__main__":
#     asyncio.run(sse(attack))