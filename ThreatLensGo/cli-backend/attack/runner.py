import asyncio , json

async def simulate(attack):

    attack_id = await attack.start()
    print("Attack ID:", attack_id)

    while True:

        await asyncio.sleep(3)
        status = attack.get_status()

        print(
            json.dumps(
                status,
                indent=2,
            )
        )

        if status["status"] in {
            "completed",
            "failed",
            "stopped",
        }:
            break


async def sse(attack):

    attack_id = await attack.start()
    print("Attack ID:", attack_id)
    async for status in attack.stream(interval=1):
        print(status)