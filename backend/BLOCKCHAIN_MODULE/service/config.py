true = True


config={
    "chain_id": "atharv",
    "usage": true,

    "repos": [
        {
            "repo_id": 1
        },
        {
            "repo_id": 2
        }
    ],

    "commits": [
        {
            "repo_id": 1,
            "limit": 500
        },
        {
            "repo_id": 2,
            "limit": 100
        }
    ],

    "attacks": [
        {
            "type": "data_burning",
            "limit": 10
        },
        {
            "type": "ddos",
            "limit": 20
        }
    ],

    "custom": [
        {
            "type": "security_summary",
            "data": {"hello":"world"    }
        },
        {
            "type": "deployment_state",
            "data": {"hello":"world"    }
        }
    ]
}