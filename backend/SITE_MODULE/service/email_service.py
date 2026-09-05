import json
from html import escape

from connect import auth


def _value(value, default="N/A"):
    if value is None:
        return default

    return escape(str(value))


def _status_badge(status):
    status = str(status or "unknown").lower()

    if status == "completed":
        background = "#dcfce7"
        text = "#166534"

    elif status == "failed":
        background = "#fee2e2"
        text = "#991b1b"

    elif status in {"running", "pending"}:
        background = "#fef3c7"
        text = "#92400e"

    else:
        background = "#f3f4f6"
        text = "#374151"

    return f"""
        <span style="
            display: inline-block;
            padding: 6px 12px;
            border-radius: 999px;
            background-color: {background};
            color: {text};
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
        ">
            {escape(status)}
        </span>
    """


def _parse_attack(attack):
    """
    Accept a single attack as either:

    - dict
    - JSON string

    Never accepts or handles a list.
    """

    if isinstance(attack, dict):
        return attack

    if isinstance(attack, str):
        try:
            attack = json.loads(attack)
        except json.JSONDecodeError as e:
            raise ValueError(
                "attack must be a valid JSON object"
            ) from e

        if not isinstance(attack, dict):
            raise ValueError(
                "attack JSON must contain an object, not a list or other value"
            )

        return attack

    raise TypeError(
        "attack must be a dict or JSON string"
    )


def attack_report_template(
    *,
    attack: dict | str,
):
    attack = _parse_attack(attack)

    request_data = attack.get("request") or {}
    target = request_data.get("target") or {}
    request = request_data.get("request") or {}
    attack_config = request_data.get("attack") or {}

    status_data = attack.get("status") or {}
    progress = status_data.get("progress") or {}
    requests_data = status_data.get("requests") or {}
    performance = status_data.get("performance") or {}
    status_codes = status_data.get("status_codes") or {}

    attack_type = _value(
        attack.get("attack_type"),
        "Unknown",
    ).upper()

    attack_id = _value(
        attack.get("attack_id")
    )

    account_id = _value(
        attack.get("account_id")
    )

    created_at = _value(
        attack.get("created_at")
    )

    attack_status = _status_badge(
        status_data.get("status")
    )

    method = _value(
        target.get("method")
    )

    base_url = _value(
        target.get("base_url"),
        "",
    )

    endpoint = _value(
        target.get("endpoint"),
        "",
    )

    target_url = f"{base_url}{endpoint}"

    # ------------------------------------------------------
    # THREAT VECTOR
    # ------------------------------------------------------

    headers = request.get("headers") or {}

    threat_vector = (
        headers.get("X-ThreatLens-Vectors")
        or headers.get("x-threatlens-vectors")
    )

    threat_vector_html = ""

    if threat_vector:
        threat_vector_html = f"""
            <div style="
                margin-top: 18px;
                padding: 14px;
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
            ">

                <div style="
                    margin-bottom: 6px;
                    color: #6b7280;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                ">
                    Threat Vector
                </div>

                <div style="
                    color: #111827;
                    font-size: 13px;
                    line-height: 1.5;
                ">
                    {_value(threat_vector)}
                </div>

            </div>
        """

    # ------------------------------------------------------
    # STATUS CODE ROWS
    # ------------------------------------------------------

    status_code_rows = ""

    for code, count in status_codes.items():
        status_code_rows += f"""
            <tr>
                <td style="
                    padding: 7px 0;
                    color: #6b7280;
                ">
                    HTTP {_value(code)}
                </td>

                <td align="right" style="
                    padding: 7px 0;
                    color: #111827;
                    font-weight: 600;
                ">
                    {_value(count)}
                </td>
            </tr>
        """

    if not status_code_rows:
        status_code_rows = """
            <tr>
                <td colspan="2" style="
                    padding: 7px 0;
                    color: #9ca3af;
                ">
                    No status codes recorded
                </td>
            </tr>
        """

    # ------------------------------------------------------
    # ATTACK CARD
    # ------------------------------------------------------

    attack_card = f"""
        <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
                margin-bottom: 24px;
                background-color: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                overflow: hidden;
            "
        >

            <!-- HEADER -->
            <tr>
                <td style="
                    padding: 22px;
                    background-color: #111827;
                ">

                    <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                    >
                        <tr>

                            <td valign="top">

                                <div style="
                                    color: #ffffff;
                                    font-size: 20px;
                                    font-weight: 700;
                                ">
                                    {attack_type}
                                </div>

                                <div style="
                                    margin-top: 7px;
                                    color: #9ca3af;
                                    font-size: 12px;
                                    word-break: break-all;
                                ">
                                    Attack ID: {attack_id}
                                </div>

                            </td>

                            <td
                                align="right"
                                valign="top"
                            >
                                {attack_status}
                            </td>

                        </tr>
                    </table>

                </td>
            </tr>


            <!-- TARGET -->
            <tr>
                <td style="padding: 24px;">

                    <div style="
                        margin-bottom: 9px;
                        color: #6b7280;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                    ">
                        Target
                    </div>

                    <div style="
                        color: #111827;
                        font-size: 14px;
                        font-weight: 600;
                        line-height: 1.5;
                        word-break: break-all;
                    ">
                        <span style="
                            color: #6b7280;
                        ">
                            {method}
                        </span>

                        &nbsp;

                        {target_url}
                    </div>

                    <div style="
                        margin-top: 7px;
                        color: #9ca3af;
                        font-size: 12px;
                    ">
                        Account ID: {account_id}
                    </div>

                    {threat_vector_html}

                </td>
            </tr>


            <!-- ATTACK CONFIGURATION -->
            <tr>
                <td style="
                    padding: 0 24px 24px;
                ">

                    <div style="
                        margin-bottom: 12px;
                        color: #6b7280;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                    ">
                        Attack Configuration
                    </div>

                    <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                    >

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Duration
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    attack_config.get("duration")
                                )}s
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Planned Requests
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    attack_config.get("requests")
                                )}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Concurrency
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    attack_config.get("concurrency")
                                )}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Delay
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    attack_config.get("delay")
                                )}s
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Timeout
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    attack_config.get("timeout")
                                )}s
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Retries
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    attack_config.get("retries")
                                )}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                On Failure
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    attack_config.get("on_failure")
                                )}
                            </td>
                        </tr>

                    </table>

                </td>
            </tr>


            <!-- RESULTS -->
            <tr>
                <td style="
                    padding: 24px;
                    background-color: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                ">

                    <div style="
                        margin-bottom: 14px;
                        color: #6b7280;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                    ">
                        Results
                    </div>

                    <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                    >

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Planned
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    progress.get("planned_requests")
                                )}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Attempted
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    progress.get("attempted_requests")
                                )}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Successful
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #166534;
                                font-weight: 700;
                            ">
                                {_value(
                                    requests_data.get("successful"),
                                    "0",
                                )}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Failed
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #991b1b;
                                font-weight: 700;
                            ">
                                {_value(
                                    requests_data.get("failed"),
                                    "0",
                                )}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Timeouts
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    requests_data.get("timeouts"),
                                    "0",
                                )}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Retried
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    requests_data.get("retried"),
                                    "0",
                                )}
                            </td>
                        </tr>

                    </table>

                </td>
            </tr>


            <!-- PERFORMANCE -->
            <tr>
                <td style="padding: 24px;">

                    <div style="
                        margin-bottom: 14px;
                        color: #6b7280;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                    ">
                        Performance
                    </div>

                    <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                    >

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Requests / Second
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    performance.get(
                                        "requests_per_second"
                                    )
                                )}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                Average Latency
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    performance.get(
                                        "average_latency_ms"
                                    )
                                )} ms
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                P50 Latency
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    performance.get(
                                        "p50_latency_ms"
                                    )
                                )} ms
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                P95 Latency
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    performance.get(
                                        "p95_latency_ms"
                                    )
                                )} ms
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 7px 0;
                                color: #6b7280;
                            ">
                                P99 Latency
                            </td>

                            <td align="right" style="
                                padding: 7px 0;
                                color: #111827;
                                font-weight: 600;
                            ">
                                {_value(
                                    performance.get(
                                        "p99_latency_ms"
                                    )
                                )} ms
                            </td>
                        </tr>

                    </table>

                </td>
            </tr>


            <!-- HTTP STATUS CODES -->
            <tr>
                <td style="
                    padding: 0 24px 24px;
                ">

                    <div style="
                        margin-bottom: 12px;
                        color: #6b7280;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                    ">
                        HTTP Status Codes
                    </div>

                    <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                    >
                        {status_code_rows}
                    </table>

                </td>
            </tr>


            <!-- CREATED -->
            <tr>
                <td style="
                    padding: 14px 24px;
                    background-color: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                ">

                    <span style="
                        color: #9ca3af;
                        font-size: 12px;
                    ">
                        Created: {created_at}
                    </span>

                </td>
            </tr>

        </table>
    """

    return f"""
<!DOCTYPE html>

<html lang="en">

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>ThreadLens Attack Report</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #f3f4f6;
    font-family: Arial, Helvetica, sans-serif;
">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>
    <tr>
        <td
            align="center"
            style="padding: 40px 15px;"
        >

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                    max-width: 680px;
                "
            >

                <!-- MAIN HEADER -->
                <tr>
                    <td style="
                        padding: 32px;
                        background-color: #111827;
                        border-radius: 12px 12px 0 0;
                        text-align: center;
                    ">

                        <h1 style="
                            margin: 0;
                            color: #ffffff;
                            font-size: 27px;
                            font-weight: 700;
                        ">
                            ThreadLens
                        </h1>

                        <p style="
                            margin: 8px 0 0;
                            color: #9ca3af;
                            font-size: 14px;
                        ">
                            Security Attack Report
                        </p>

                    </td>
                </tr>


                <!-- INTRO -->
                <tr>
                    <td style="
                        padding: 28px 30px;
                        background-color: #ffffff;
                    ">

                        <h2 style="
                            margin: 0 0 10px;
                            color: #111827;
                            font-size: 20px;
                        ">
                            Attack Activity
                        </h2>

                        <p style="
                            margin: 0;
                            color: #6b7280;
                            font-size: 14px;
                            line-height: 1.6;
                        ">
                            The following security activity was
                            recorded by ThreadLens.
                        </p>

                    </td>
                </tr>


                <!-- ATTACK CARD -->
                <tr>
                    <td style="
                        padding: 25px 30px;
                        background-color: #f9fafb;
                    ">

                        {attack_card}

                    </td>
                </tr>


                <!-- FOOTER -->
                <tr>
                    <td style="
                        padding: 22px 30px;
                        background-color: #ffffff;
                        border-radius: 0 0 12px 12px;
                        text-align: center;
                        border-top: 1px solid #e5e7eb;
                    ">

                        <p style="
                            margin: 0;
                            color: #9ca3af;
                            font-size: 12px;
                        ">
                            This is an automated message from ThreadLens.
                        </p>

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>
"""


def send_attack_report(
    email: str,
    attack: dict ,
) -> None:

    try:
        body = attack_report_template(
            attack=attack
        )

        auth.email.send(
            to=email,
            subject="ThreadLens Attack Report",
            body=body,
            html=True,
        )

    except Exception as e:
        print(f"Failed to send attack report email: {e}")