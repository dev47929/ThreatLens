from GIT_MODULE import (
    get_repositories,
    get_commit_analysis,
)

from SITE_MODULE import (
    get_usage,
    get_attack,
)

from BLOCKCHAIN_MODULE.service.chain_service import InternalChain
from pathlib import Path
blockchain_dir = Path("BLOCKCHAIN_MODULE")