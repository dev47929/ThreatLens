from datetime import datetime
from uuid import UUID

from sqlalchemy.inspection import inspect


def to_dict(model, exclude=None):
    if model is None:
        return {}

    exclude = set(exclude or [])

    result = {}

    for column in inspect(model).mapper.column_attrs:
        key = column.key

        if key in exclude:
            continue

        value = getattr(model, key)

        if isinstance(value, UUID):
            value = str(value)
        elif isinstance(value, datetime):
            value = value.isoformat()

        result[key] = value

    return result


def to_list_dict(models, exclude=None):
    if models is None:
        return []

    return [
        to_dict(model, exclude=exclude)
        for model in models
        if model is not None
    ]