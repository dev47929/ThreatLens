import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


# Configurable base directory for InternalChain storage.
blockchain_dir = Path("BLOCKCHAIN_MODULE")


class InternalChain:
    def __init__(self, chain_name: str, user: dict):
        self.account_id = user["account"]["id"]

        if chain_name.rsplit("_", 1)[-1].isdigit():
            chain_name = chain_name.rsplit("_", 1)[0]

        self.chain_id = f"{chain_name}_{self.account_id}"

        self.chain_dir = (
            blockchain_dir
            / "chains"
            / str(self.account_id)
        )

        self.chain_file = (
            self.chain_dir
            / f"{self.chain_id}.json"
        )

        self.chain: list[dict] = []

        if self.chain_file.exists():
            self._load_from_file()
        else:
            self.chain.append(
                self._build_block(
                    index=0,
                    block_type="genesis",
                    data=user,
                    created_at=self._utc_timestamp(),
                    prev=None,
                )
            )

    def create_block(
        self,
        type: str,
        data: dict | list[dict],
    ):
        if isinstance(data, dict):
            return self._create_single_block(type, data)

        if isinstance(data, list):
            if not all(isinstance(item, dict) for item in data):
                raise TypeError(
                    "data must be a dict or a list of dictionaries"
                )

            return [
                self._create_single_block(type, item)
                for item in data
            ]

        raise TypeError(
            "data must be a dict or a list of dictionaries"
        )

    def commit(self):
        self.chain_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        with self.chain_file.open(
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                self.chain,
                file,
                ensure_ascii=False,
                indent=2,
            )

    def load_chain(
        self,
        page: int = 1,
        limit: int = 10,
    ) -> list[dict]:
        self._validate_pagination(page, limit)

        non_genesis = self.chain[1:]

        end = len(non_genesis) - (
            (page - 1) * limit
        )

        start = max(0, end - limit)

        selected = non_genesis[start:end]

        return [
            self.get_genesis(),
            *selected,
        ]

    def get_genesis(self) -> dict:
        if not self.chain:
            raise RuntimeError("Chain is empty")

        return self.chain[0]

    def get_block(self, idx: int) -> dict:
        for block in self.chain:
            if block["index"] == idx:
                return block

        raise IndexError(
            f"Block with index {idx} does not exist"
        )

    def get_latest_block(self) -> dict:
        if not self.chain:
            raise RuntimeError("Chain is empty")

        return self.chain[-1]

    def get_chain_hash(self) -> str:
        return self.get_latest_block()["current"]

    def get_block_hash(self, idx: int) -> str:
        return self.get_block(idx)["current"]

    def get_block_by_type(
        self,
        type: str,
        page: int = 1,
        limit: int = 10,
    ) -> list[dict]:
        self._validate_pagination(page, limit)

        matching = [
            block
            for block in self.chain
            if block["type"] == type
        ]

        start = (page - 1) * limit
        end = start + limit

        return matching[start:end]

    def verify_chain(
        self,
        target: int = 10,
        mode: str = "last",
    ) -> dict:
        if not self.chain:
            return {
                "status": True,
                "message": "Chain verified successfully",
            }

        if mode == "single":
            if target < 1 or target >= len(self.chain):
                raise IndexError(
                    "single verification requires a non-genesis target"
                )

            return self._verify_range(
                target,
                target,
                include_predecessor=True,
            )

        if mode == "from":
            if target < 0 or target >= len(self.chain):
                raise IndexError(
                    "target is outside the chain"
                )

            return self._verify_range(
                target,
                len(self.chain) - 1,
            )

        if mode == "till":
            if target < 0 or target >= len(self.chain):
                raise IndexError(
                    "target is outside the chain"
                )

            return self._verify_range(
                0,
                target,
            )

        if mode == "full":
            return self._verify_range(
                0,
                len(self.chain) - 1,
            )

        if mode == "last":
            if target < 1:
                raise ValueError(
                    "target must be at least 1"
                )

            end = len(self.chain) - 1
            start = max(
                1,
                end - target + 1,
            )

            return self._verify_range(
                start,
                end,
                include_predecessor=start > 0,
            )

        if mode == "latest":
            latest = len(self.chain) - 1

            if latest == 0:
                return self._verify_block(
                    self.chain[0]
                )

            return self._verify_range(
                latest,
                latest,
                include_predecessor=True,
            )

        raise ValueError(
            "mode must be one of: "
            "single, from, till, full, last, latest"
        )

    @staticmethod
    def get_chains(user: dict) -> list[str]:
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

    @staticmethod
    def destroy_chain(
        chain_id: str,
        user: dict,
    ) -> dict:
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


    @staticmethod
    def validate_chain_data(
        chain: list[dict],
    ) -> bool:
        if not isinstance(chain, list):
            raise TypeError(
                "chain must be a list"
            )

        if not chain:
            raise ValueError(
                "chain cannot be empty"
            )

        required_fields = {
            "index",
            "type",
            "data",
            "created_at",
            "prev",
            "current",
        }

        for position, block in enumerate(chain):
            if not isinstance(block, dict):
                raise TypeError(
                    f"Block at position {position} "
                    "must be a dictionary"
                )

            missing_fields = (
                required_fields - block.keys()
            )

            if missing_fields:
                raise ValueError(
                    f"Block at position {position} "
                    f"is missing fields: "
                    f"{sorted(missing_fields)}"
                )

            if not isinstance(block["index"], int):
                raise TypeError(
                    f"Block index at position {position} "
                    "must be an integer"
                )

            if not isinstance(block["type"], str):
                raise TypeError(
                    f"Block type at position {position} "
                    "must be a string"
                )

            if not isinstance(block["data"], dict):
                raise TypeError(
                    f"Block data at position {position} "
                    "must be a dictionary"
                )

            if not isinstance(block["created_at"], str):
                raise TypeError(
                    f"Block created_at at position {position} "
                    "must be a string"
                )

            if (
                block["prev"] is not None
                and not isinstance(block["prev"], str)
            ):
                raise TypeError(
                    f"Block prev at position {position} "
                    "must be a string or None"
                )

            if not isinstance(block["current"], str):
                raise TypeError(
                    f"Block current at position {position} "
                    "must be a string"
                )

            if position == 0:
                if block["index"] != 0:
                    raise ValueError(
                        "Genesis block must have index 0"
                    )

                if block["type"] != "genesis":
                    raise ValueError(
                        "First block must have type 'genesis'"
                    )

                if block["prev"] is not None:
                    raise ValueError(
                        "Genesis block must have prev=None"
                    )

                continue

            previous = chain[position - 1]

            if block["index"] != previous["index"] + 1:
                raise ValueError(
                    f"Invalid block index at position "
                    f"{position}"
                )

            if block["prev"] != previous["current"]:
                raise ValueError(
                    f"Invalid previous hash at position "
                    f"{position}"
                )

        return True

    def replace_chain(
        self,
        chain: list[dict],
    ) -> dict:
        self.validate_chain_data(chain)

        self.chain = chain

        return {
            "status": True,
            "message": "Chain replaced successfully",
            "chain_id": self.chain_id,
        }

    def _create_single_block(
        self,
        type: str,
        data: dict,
    ) -> dict:
        latest = self.get_latest_block()

        block = self._build_block(
            index=latest["index"] + 1,
            block_type=type,
            data=data,
            created_at=self._utc_timestamp(),
            prev=latest["current"],
        )

        self.chain.append(block)

        return block

    def _build_block(
        self,
        index: int,
        block_type: str,
        data: dict,
        created_at: str,
        prev: str | None,
    ) -> dict:
        block_without_current = {
            "index": index,
            "type": block_type,
            "data": data,
            "created_at": created_at,
            "prev": prev,
        }

        current = self._calculate_hash(
            block_without_current
        )

        return {
            **block_without_current,
            "current": current,
        }

    def _calculate_hash(
        self,
        block: dict,
    ) -> str:
        canonical = json.dumps(
            block,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
        )

        return hashlib.sha256(
            canonical.encode("utf-8")
        ).hexdigest()

    def _load_from_file(self):
        with self.chain_file.open(
            "r",
            encoding="utf-8",
        ) as file:
            loaded = json.load(file)

        if not isinstance(loaded, list):
            raise ValueError(
                "Chain JSON must contain a list of blocks"
            )

        self.chain = loaded

    def _verify_range(
        self,
        start: int,
        end: int,
        include_predecessor: bool = False,
    ) -> dict:
        verification_start = start

        if (
            include_predecessor
            and start > 0
        ):
            verification_start = start - 1

        for position in range(
            verification_start,
            end + 1,
        ):
            block = self.chain[position]

            result = self._verify_block(block)

            if not result["status"]:
                return result

            if position == 0:
                if block["prev"] is not None:
                    return {
                        "status": False,
                        "message": (
                            "Genesis block has an "
                            "invalid previous hash"
                        ),
                        "failure_type": "previous_hash",
                        "block_index": block["index"],
                    }

                continue

            previous = self.chain[position - 1]

            if (
                block["index"]
                != previous["index"] + 1
            ):
                return {
                    "status": False,
                    "message": (
                        "Block index sequence is invalid"
                    ),
                    "failure_type": "block_index",
                    "block_index": block["index"],
                }

            if block["prev"] != previous["current"]:
                return {
                    "status": False,
                    "message": (
                        "Previous block hash linkage failed"
                    ),
                    "failure_type": "previous_hash",
                    "block_index": block["index"],
                }

        return {
            "status": True,
            "message": "Chain verified successfully",
        }

    def _verify_block(
        self,
        block: dict,
    ) -> dict:
        block_without_current = {
            "index": block["index"],
            "type": block["type"],
            "data": block["data"],
            "created_at": block["created_at"],
            "prev": block["prev"],
        }

        expected_hash = self._calculate_hash(
            block_without_current
        )

        if block["current"] != expected_hash:
            return {
                "status": False,
                "message": "Block hash verification failed",
                "failure_type": "current_hash",
                "block_index": block["index"],
            }

        return {
            "status": True,
            "message": "Block verified successfully",
            "block_index": block["index"],
        }

    @staticmethod
    def _utc_timestamp() -> str:
        return (
            datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z")
        )

    @staticmethod
    def _validate_pagination(
        page: int,
        limit: int,
    ):
        if page < 1:
            raise ValueError(
                "page must be >= 1"
            )

        if limit < 1:
            raise ValueError(
                "limit must be >= 1"
            )