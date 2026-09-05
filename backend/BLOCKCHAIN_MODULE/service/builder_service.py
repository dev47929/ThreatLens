from BLOCKCHAIN_MODULE.imports import *

def build_chain(
    config: dict,
    user: dict,
):
    account_id = user["account"]["id"]
    chain = InternalChain(
        chain_name=config["chain_id"],
        user=user,
    )

    # Repositories
    for repo in config.get("repos", []):
        repo_data = get_repositories(
            account_id=account_id,
            repo_id=repo["repo_id"],
            limit=1,
        )

        chain.create_block(
            type="repo",
            data=repo_data,
        )

    # Commit analysis
    for commit in config.get("commits", []):
        commit_data = get_commit_analysis(
            repo_id=commit["repo_id"],
            limit=commit["limit"],
        )

        chain.create_block(
            type="commit_analysis",
            data=commit_data,
        )

    # Attacks
    for attack in config.get("attacks", []):
        attack_data = get_attack(
            account_id=account_id,
            attack_type=attack["type"],
            limit=attack["limit"],
        )

        chain.create_block(
            type=attack["type"],
            data=attack_data,
        )

    # Usage
    if config.get("usage"):
        usage_data = get_usage(
            account_id=account_id,
        )

        chain.create_block(
            type="usage",
            data=usage_data,
        )

    # Custom blocks
    for custom in config.get("custom", []):
        chain.create_block(
            type="custom_"+custom["type"],
            data=custom.get("data", {}),
        )

    chain.commit()

    return chain



def get_chain_ids(user: dict) -> list[str]:
    account_id = user["account"]["id"]

    chain_dir = (
        blockchain_dir
        / "chains"
        / str(account_id)
    )

    if not chain_dir.exists():
        return []

    return sorted(
        path.stem
        for path in chain_dir.glob("*.json")
        if path.is_file()
    )


def destroy_chain(chain_id: str, user: dict) -> dict:
    account_id = user["account"]["id"]

    chain_dir = (
        blockchain_dir
        / "chains"
        / str(account_id)
    )

    chain_file = chain_dir / f"{chain_id}.json"

    if not chain_file.exists():
        return {
            "status": False,
            "message": "Chain does not exist",
            "chain_id": chain_id,
        }

    chain_file.unlink()

    return {
        "status": True,
        "message": "Chain destroyed successfully",
        "chain_id": chain_id,
    }