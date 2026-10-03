"""Read-only ABP Engine presentation API for API Gateway proxy events.

Configure a VPC-connected Lambda and use an RDS Proxy when the existing
database is Amazon RDS. This function only reads the supplied schema.
"""
from __future__ import annotations

import json
import logging
import os
import re
import time
from datetime import date, datetime
from decimal import Decimal
from typing import Any

import boto3
import pymysql
from pymysql.cursors import DictCursor

LOG = logging.getLogger()
LOG.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
_secret_cache: dict[str, tuple[float, Any]] = {}

CASE_SELECT = """
SELECT c.case_id, c.case_number, c.patient_token, c.prescriber_token,
       c.payer_id, c.payer_name, c.plan_type, c.territory, c.current_state,
       c.version, c.owner_role, c.owner_id, c.closed_at, c.created_at,
       c.updated_at, p.drug_id, p.drug_name, p.diagnosis_code,
       p.diagnosis_name, ca.risk_score, ca.risk_band, ca.bscore,
       ca.confidence, ca.predicted_barriers, ci.executive_summary,
       u.user_name AS assigned_to, a.assignment_status, a.action_required,
       a.sla_due_at
FROM case_master c
LEFT JOIN (SELECT p1.* FROM prescriptions p1
           JOIN (SELECT case_id, MAX(prescription_seq_id) AS max_id
                 FROM prescriptions GROUP BY case_id) px
             ON px.case_id=p1.case_id AND px.max_id=p1.prescription_seq_id) p
       ON p.case_id=c.case_id
LEFT JOIN (SELECT a1.* FROM case_assessment a1
           JOIN (SELECT case_id, MAX(assessment_id) AS max_id
                 FROM case_assessment WHERE is_current=TRUE GROUP BY case_id) ax
             ON ax.case_id=a1.case_id AND ax.max_id=a1.assessment_id) ca
       ON ca.case_id=c.case_id
LEFT JOIN (SELECT i1.* FROM case_insights i1
           JOIN (SELECT case_id, MAX(insight_id) AS max_id
                 FROM case_insights GROUP BY case_id) ix
             ON ix.case_id=i1.case_id AND ix.max_id=i1.insight_id) ci
       ON ci.case_id=c.case_id
LEFT JOIN (SELECT a1.* FROM case_assignments a1
           JOIN (SELECT case_id, MAX(assignment_id) AS max_id
                 FROM case_assignments GROUP BY case_id) ax
             ON ax.case_id=a1.case_id AND ax.max_id=a1.assignment_id) a
       ON a.case_id=c.case_id
LEFT JOIN users u ON u.user_id=a.user_id
"""

class ApiProblem(Exception):
    def __init__(self, status: int, message: str):
        self.status, self.message = status, message


def _json_default(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    raise TypeError(f"Unsupported response value: {type(value).__name__}")


def _response(status: int, body: Any, origin: str | None = None) -> dict[str, Any]:
    allowed = {x.strip() for x in os.getenv("CORS_ORIGINS", "").split(",") if x.strip()}
    cors_origin = origin if origin and ("*" in allowed or origin in allowed) else ("*" if "*" in allowed else "null")
    headers = {"Content-Type": "application/json; charset=utf-8",
               "Access-Control-Allow-Origin": cors_origin,
               "Access-Control-Allow-Methods": "GET,OPTIONS",
               "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
               "Vary": "Origin", "Cache-Control": "no-store"}
    if cors_origin != "*":
        headers["Access-Control-Allow-Credentials"] = "true"
    return {"statusCode": status, "headers": headers,
            "body": json.dumps(body, default=_json_default, ensure_ascii=False)}


def _connection():
    required = ("DB_HOST", "DB_NAME", "DB_SECRET_ARN")
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise RuntimeError("Missing Lambda configuration: " + ", ".join(missing))
    arn = os.environ["DB_SECRET_ARN"]
    cached = _secret_cache.get(arn)
    if cached is None or cached[0] <= time.time():
        result = boto3.client("secretsmanager").get_secret_value(SecretId=arn)
        _secret_cache[arn] = (time.time() + int(os.getenv("SECRET_CACHE_TTL_SECONDS", "300")), json.loads(result["SecretString"]))
    secret = _secret_cache[arn][1]
    return pymysql.connect(host=os.environ["DB_HOST"],
        port=int(os.getenv("DB_PORT", "3306")), user=secret["username"],
        password=secret["password"], database=os.environ["DB_NAME"],
        connect_timeout=int(os.getenv("DB_CONNECT_TIMEOUT", "5")),
        read_timeout=int(os.getenv("DB_READ_TIMEOUT", "15")),
        write_timeout=int(os.getenv("DB_WRITE_TIMEOUT", "15")),
        charset="utf8mb4", cursorclass=DictCursor, autocommit=True,
        ssl={"ca": os.environ["DB_SSL_CA"]} if os.getenv("DB_SSL_CA") else None)


def _fetch(sql: str, params: tuple = ()) -> list[dict[str, Any]]:
    with _connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return list(cur.fetchall())


def _cases(limit: int = 500) -> list[dict[str, Any]]:
    return _fetch(CASE_SELECT + " ORDER BY c.updated_at DESC LIMIT %s", (limit,))


def _case(case_id: str) -> dict[str, Any]:
    # The route may contain a numeric PK or the externally visible case number.
    if not (case_id.isdigit() or re.fullmatch(r"[A-Za-z0-9_-]{1,50}", case_id)):
        raise ApiProblem(400, "Invalid case identifier")
    rows = _fetch(CASE_SELECT + " WHERE c.case_id=%s OR c.case_number=%s LIMIT 1", (case_id, case_id))
    if not rows:
        raise ApiProblem(404, "Case not found")
    return rows[0]


def _dashboard(role: str) -> dict[str, Any]:
    cases = _cases()
    now = datetime.utcnow()
    due = [c for c in cases if c.get("sla_due_at")]
    approaching = [c for c in due if 0 <= (c["sla_due_at"] - now).total_seconds() <= 48 * 3600]
    high_risk = [c for c in cases if (c.get("bscore") or 0) >= 70 or str(c.get("risk_band") or "").upper() in ("HIGH", "CRITICAL")]
    status_counts: dict[str, int] = {}
    payer_counts: dict[str, int] = {}
    risk_counts = {"0–20": 0, "21–40": 0, "41–70": 0, "71–100": 0}
    regions: dict[str, int] = {}
    for c in cases:
        state = str(c.get("current_state") or "Unknown").replace("_", " ").title()
        status_counts[state] = status_counts.get(state, 0) + 1
        payer = c.get("payer_name") or "Unspecified"
        payer_counts[payer] = payer_counts.get(payer, 0) + 1
        if c.get("territory"):
            regions[c["territory"]] = regions.get(c["territory"], 0) + 1
        score = c.get("bscore")
        if score is not None:
            bucket = "0–20" if score <= 20 else "21–40" if score <= 40 else "41–70" if score <= 70 else "71–100"
            risk_counts[bucket] += 1
    with _connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT u.user_name AS name, COUNT(*) AS assigned_cases FROM case_assignments a JOIN users u ON u.user_id=a.user_id WHERE a.assignment_status='ASSIGNED' GROUP BY u.user_id,u.user_name ORDER BY assigned_cases DESC LIMIT 5")
            resources = list(cur.fetchall())
            cur.execute("SELECT h.case_id,c.case_number,h.new_state AS event,h.changed_at AS at FROM case_state_history h JOIN case_master c ON c.case_id=h.case_id ORDER BY h.changed_at DESC LIMIT 8")
            activity = list(cur.fetchall())
            cur.execute("SELECT COUNT(DISTINCT user_id) AS total FROM case_assignments WHERE assignment_status='ASSIGNED' AND user_id IS NOT NULL")
            resource_count = cur.fetchone()["total"]
    kpis = {"total_cases": len(cases), "high_risk_cases": len(high_risk),
            "sla_due_soon": len(approaching), "sla_at_risk": len(approaching),
            "overdue_cases": sum(1 for c in due if c["sla_due_at"] < now),
            "assigned_resources": resource_count, "provider_accounts": None,
            "hub_follow_ups": sum(1 for c in cases if (c.get("owner_role") or "").upper().startswith("HUB")),
            "pending_documents": None}
    return {"kpis": kpis, "cases": cases,
            "cases_by_status": [{"name": k, "value": v} for k, v in status_counts.items()],
            "cases_by_payer": [{"name": k, "value": v} for k, v in sorted(payer_counts.items(), key=lambda x: -x[1])[:8]],
            "risk_distribution": [{"name": k, "value": v} for k, v in risk_counts.items()],
            "cases_by_region": [{"name": k, "value": v} for k, v in regions.items()],
            "top_barriers": _top_barriers(cases), "upcoming_sla": sorted(approaching, key=lambda c: c["sla_due_at"])[:10],
            "resources": resources,
            "recent_activity": [{"case_number": a["case_number"], "event": a["event"], "at": a["at"]} for a in activity]}


def _top_barriers(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    counts: dict[str, int] = {}
    for case in cases:
        values = case.get("predicted_barriers") or []
        if isinstance(values, str):
            try: values = json.loads(values)
            except (TypeError, json.JSONDecodeError): values = []
        if isinstance(values, dict): values = list(values.keys())
        if isinstance(values, list):
            for value in values:
                label = str(value.get("barrier_code") or value.get("name") or value) if isinstance(value, dict) else str(value)
                counts[label] = counts.get(label, 0) + 1
    return [{"name": k, "value": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])[:8]]


def _detail_section(case_id: str, section: str) -> Any:
    c = _case(case_id)
    pk = c["case_id"]
    if section == "payer":
        return {"case_id": pk, "payer_id": c["payer_id"], "payer_name": c["payer_name"], "plan_type": c["plan_type"], "patient_token": c["patient_token"], "territory": c["territory"]}
    if section == "clinical":
        prescriptions = _fetch("SELECT prescription_id,drug_id,drug_name,diagnosis_code,diagnosis_name,quantity,days_supply,created_at FROM prescriptions WHERE case_id=%s ORDER BY prescription_seq_id DESC", (pk,))
        assessment = _fetch("SELECT assessment_id,model_version,feature_set_version,risk_score,risk_band,confidence,bscore,barrier_probability_map,predicted_barriers,reason_codes,assessment_status,decision_timestamp,created_at FROM case_assessment WHERE case_id=%s AND is_current=TRUE ORDER BY assessment_id DESC LIMIT 1", (pk,))
        return {"case_id": pk, "prescriptions": prescriptions, "assessment": assessment[0] if assessment else None}
    if section == "barriers":
        return {"case_id": pk, "risk_score": c["risk_score"], "risk_band": c["risk_band"], "bscore": c["bscore"], "confidence": c["confidence"], "predicted_barriers": c["predicted_barriers"], "insights": _fetch("SELECT executive_summary,key_findings,recommendations,generated_by,created_at FROM case_insights WHERE case_id=%s ORDER BY insight_id DESC LIMIT 10", (pk,))}
    if section == "actions":
        assignments = _fetch("SELECT a.assignment_id,a.role_type,a.user_id,u.user_name,a.assignment_reason,a.assignment_status,a.action_required,a.sla_due_at,a.crm_task_id,a.crm_sync_status,a.assigned_at FROM case_assignments a LEFT JOIN users u ON u.user_id=a.user_id WHERE a.case_id=%s ORDER BY a.assigned_at DESC", (pk,))
        decisions = _fetch("SELECT d.action_type,d.actor_role,d.override_reason,d.comments,d.created_at FROM case_decision d WHERE d.case_id=%s ORDER BY d.created_at DESC", (pk,))
        return {"case_id": pk, "assignments": assignments, "decisions": decisions}
    if section == "documents":
        return {"case_id": pk, "items": [], "available": False, "message": "The supplied database schema does not define a case document table."}
    raise ApiProblem(404, "Unknown case section")


def _path_event(event: dict[str, Any]) -> tuple[str, str]:
    path = event.get("rawPath") or event.get("path") or "/"
    method = (event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod") or "GET").upper()
    return method, path.rstrip("/") or "/"


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    origin = headers.get("origin")
    method, path = _path_event(event)
    if method == "OPTIONS": return _response(204, {}, origin)
    if method != "GET": return _response(405, {"error": "Method not allowed"}, origin)
    try:
        match = re.fullmatch(r"/cases/([^/]+)(?:/(payer|clinical|barriers|actions|documents))?", path)
        if path == "/cases":
            result = _cases()
            return _response(200, {"items": result, "count": len(result)}, origin)
        if match:
            case_id, section = match.groups()
            if section: return _response(200, _detail_section(case_id, section), origin)
            detail = _case(case_id)
            for section_name in ("clinical", "barriers", "actions", "documents"):
                detail[section_name] = _detail_section(case_id, section_name)
            detail["payer"] = _detail_section(case_id, "payer")
            detail["prescriptions"] = detail["clinical"]["prescriptions"]
            detail["assessment"] = detail["clinical"]["assessment"]
            detail["assignments"] = detail["actions"]["assignments"]
            detail["insights"] = detail["barriers"]["insights"]
            detail["timeline"] = _fetch("SELECT previous_state,new_state,comments,changed_at FROM case_state_history WHERE case_id=%s ORDER BY changed_at DESC LIMIT 20", (detail["case_id"],))
            detail["barriers"] = detail["barriers"].get("predicted_barriers") or []
            detail["documents"] = detail["documents"].get("items", [])
            return _response(200, detail, origin)
        if path in ("/dashboard/hub", "/dashboard/frm", "/dashboard/fc"):
            return _response(200, _dashboard(path.rsplit("/", 1)[-1]), origin)
        if path.startswith("/frm/"):
            key = path.rsplit("/", 1)[-1]
            mapping = {"territory-cases": "cases", "cases-by-region": "cases_by_region", "top-payers": "cases_by_payer", "top-barriers": "top_barriers", "provider-accounts": "provider_accounts", "sla-risk": "upcoming_sla", "hub-follow-ups": "hub_follow_ups"}
            if key not in mapping: raise ApiProblem(404, "Route not found")
            if key == "provider-accounts": return _response(200, {"items": [], "available": False, "message": "Provider accounts are not present in the supplied schema."}, origin)
            dash = _dashboard("frm")
            if key == "hub-follow-ups": return _response(200, {"count": dash["kpis"]["hub_follow_ups"], "items": [c for c in dash["cases"] if (c.get("owner_role") or "").upper().startswith("HUB") ]}, origin)
            return _response(200, {"items": dash[mapping[key]]}, origin)
        if path.startswith("/fc/"):
            key = path.rsplit("/", 1)[-1]
            mapping = {"assigned-cases": "cases", "upcoming-sla": "upcoming_sla", "recent-activity": "recent_activity", "pending-documents": "pending_documents", "resource-workload": "resources"}
            if key not in mapping: raise ApiProblem(404, "Route not found")
            if key == "pending-documents": return _response(200, {"items": [], "available": False, "message": "Documents are not present in the supplied schema."}, origin)
            dash = _dashboard("fc")
            return _response(200, {"items": dash[mapping[key]]}, origin)
        raise ApiProblem(404, "Route not found")
    except ApiProblem as exc:
        return _response(exc.status, {"error": exc.message}, origin)
    except Exception:
        LOG.exception("Presentation API request failed: method=%s path=%s", method, path)
        return _response(500, {"error": "Unable to load presentation data"}, origin)
