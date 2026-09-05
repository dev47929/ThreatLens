from .structure import RepositoryAnalyzer
from .commit import CommitAnalyzer
from repo.repository import Repository
import json

repo = Repository("https://github.com/dev47929/ThreatLens")
# analysis = CommitAnalyzer(repo)

# commits = repo.list_commits(
#     branch="main",
#     limit=2,
# )

# for commit in commits:
#     result = analysis.analyze(
#         commit["sha"]
#     )

#     print(
#         json.dumps(
#             result,
#             indent=2,
#             default=str,
#         )
#     )

analyzer = RepositoryAnalyzer(repo)
print(analyzer.analyze().to_json())

# result = analyzer.analyze().to_dict()
# print(json.dumps(result, indent=2, default=str))

repo.close()
