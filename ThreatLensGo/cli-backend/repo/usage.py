from repo.repository import Repository
import json


repo = Repository(
    "https://github.com/dev47929/ThreatLens"
)


# # Repository information
# print(repo.info_repo())


# # Latest 10 commits
# commits = repo.list_commits(
#     branch="main",
#     limit=50,
# )

# for commit in commits:
#     print(commit)


# # Commit metadata
# commit = repo.info_commit(
#     commits[0]["sha"]
# )

# print(commit)


# # Commit diff
# changes = repo.diff(
#     commits[0]["sha"]
# )

# for change in changes:
#     print(change["change_type"])
#     print(change["new_path"])
#     print(change["diff"])





# print(json.dumps(repo.info_repo(), indent=2, default=str))

# commits = repo.list_commits(limit=5)
# print(json.dumps(commits, indent=2, default=str))


# for commit in commits:
#     commit_info = repo.info_commit(commit["sha"])
#     print(json.dumps(commit_info, indent=2, default=str))

# for commit in commits :
#     diff = repo.diff(commit["sha"])
#     print(json.dumps(diff, indent=2, default=str))

# diff = repo.diff(commits[0]["sha"])

# files = repo.get_files()
# print(json.dumps(files, indent=2, default=str))

# content = repo.get_file(files[144]["path"])
# print(json.dumps(content, indent=2, default=str))

tags = repo.info_tags()
print(json.dumps(tags, indent=2, default=str))

repo.close()