from SITE_MODULE.db.usage_model import Usage
from connect import session_factory
from utils.get_helper import to_dict


def set_usage(
    account_id: int,
    prompt_tokens: int,
    completion_tokens: int,
    plan: str | None = None,
):
    db = session_factory()

    usage = (
        db.query(Usage)
        .filter(Usage.account_id == account_id)
        .first()
    )

    if usage is None:
        usage = Usage(
            account_id=account_id,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        )

        db.add(usage)

    else:
        if plan is not None:
            usage.plan = plan

        usage.prompt_tokens = prompt_tokens
        usage.completion_tokens = completion_tokens

    db.commit()
    return {
        "status" : "usage synced"
    }


def get_usage(
    account_id: int,
):
    db = session_factory()
    return to_dict(
        db.query(Usage)
        .filter(Usage.account_id == account_id)
        .first()
    )


def set_plan(
    account_id: int,
    plan : str
):
    db = session_factory()
    usage = (
        db.query(Usage)
        .filter(Usage.account_id == account_id)
        .first()
    )

    if usage is None:
        return {
            "status" : "account not found"
        }

    usage.plan = plan
    db.commit()
    return {
        "status" : "plan updated"
    }