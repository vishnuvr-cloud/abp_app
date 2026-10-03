# ABP Engine API Gateway Route Guide

This project contains a **read-only presentation Lambda** that adapts the supplied `abp_engine` MySQL schema for the React SPA. Point its database connection at the existing database (or its RDS Proxy); do not create or migrate a database for this function. If your existing backend already exposes equivalent presentation endpoints, keep that backend and configure API Gateway to those integrations instead.

## 1. Prepare the presentation Lambda

1. Create a Python Lambda using the runtime supported by your AWS account and package `lambda/presentation/handler.py` plus `lambda/presentation/requirements.txt` (`pymysql`) into its deployment artifact. The AWS SDK (`boto3`) is available in supported Lambda Python runtimes.
2. Set the handler to `handler.lambda_handler` and configure environment variables:

   | Variable | Required | Description |
   | --- | --- | --- |
   | `DB_HOST` | Yes | Existing MySQL endpoint, preferably the existing RDS Proxy endpoint |
   | `DB_PORT` | No | Database port; defaults to `3306` |
   | `DB_NAME` | Yes | Existing schema name, `abp_engine` per the supplied schema |
   | `DB_SECRET_ARN` | Yes | Secrets Manager ARN whose JSON has `username` and `password` |
   | `DB_CONNECT_TIMEOUT` | No | Connection timeout seconds, defaults to `5` |
   | `DB_READ_TIMEOUT` | No | Query timeout seconds, defaults to `15` |
   | `DB_WRITE_TIMEOUT` | No | Socket timeout seconds, defaults to `15` |
   | `DB_SSL_CA` | No | CA bundle path when database TLS verification needs a custom CA |
   | `SECRET_CACHE_TTL_SECONDS` | No | Secrets Manager cache lifetime; defaults to `300` seconds |
   | `CORS_ORIGINS` | Yes for browser access | Comma-separated exact frontend origins, e.g. `http://localhost:5173,https://app.example.com` |
   | `LOG_LEVEL` | No | Defaults to `INFO` |

3. Give the Lambda execution role `secretsmanager:GetSecretValue` only for the selected secret. If the secret uses a customer-managed KMS key, grant decrypt on that key. Place the Lambda in the existing database network and security group path (or the existing RDS Proxy path). The database security group should allow connections from the Lambda security group. Do not put credentials in source code or frontend variables.
4. Use a database identity with SELECT access to the tables this reader needs. The function performs no writes and does not create tables.

## 2. Create or identify API Gateway

In AWS Console, open **API Gateway → APIs**. Reuse the API already used by your backend when possible. If the presentation routes need a new API, choose **Create API → HTTP API**. Select the existing presentation Lambda integration (or your already implemented read-only backend integration) and grant API Gateway permission to invoke it.

## 3. Add the routes

For each row, create the HTTP method and route key, then attach the Lambda integration. All routes below use one Lambda and are dispatched by path. Use `GET` for all data operations and `OPTIONS /{proxy+}` if your API Gateway configuration needs an explicit preflight route. API Gateway HTTP API can instead answer preflight through its built-in CORS settings.

| Method | Route | React use |
| --- | --- | --- |
| `GET` | `/cases` | Hub work queue; returns `{items, count}` |
| `GET` | `/cases/{caseId}` | Case detail plus related read-only sections |
| `GET` | `/cases/{caseId}/payer` | Payer, plan, member token, territory fields |
| `GET` | `/cases/{caseId}/clinical` | Prescriptions and current assessment |
| `GET` | `/cases/{caseId}/barriers` | Assessment risk, predicted barriers, insights |
| `GET` | `/cases/{caseId}/actions` | Assignments and case decisions |
| `GET` | `/cases/{caseId}/documents` | Explicit unavailable/empty response; supplied schema has no case document table |
| `GET` | `/dashboard/hub` | Hub aggregate dashboard |
| `GET` | `/dashboard/frm` | FRM aggregate dashboard |
| `GET` | `/frm/territory-cases` | Cases with territory mapping |
| `GET` | `/frm/cases-by-region` | Counts grouped from `case_master.territory` |
| `GET` | `/frm/top-payers` | Counts grouped from `case_master.payer_name` |
| `GET` | `/frm/top-barriers` | Existing assessment predicted barriers |
| `GET` | `/frm/provider-accounts` | Explicit unavailable response; no provider account table exists |
| `GET` | `/frm/sla-risk` | Cases with approaching SLA assignments |
| `GET` | `/frm/hub-follow-ups` | Cases assigned to HUB roles |
| `GET` | `/dashboard/fc` | FC aggregate dashboard |
| `GET` | `/fc/assigned-cases` | Case queue and existing assignment fields |
| `GET` | `/fc/upcoming-sla` | Upcoming assignment deadlines |
| `GET` | `/fc/recent-activity` | State history entries |
| `GET` | `/fc/pending-documents` | Explicit unavailable response; no document table exists |
| `GET` | `/fc/resource-workload` | Workload grouped by assigned user |

Use API Gateway **Lambda proxy integration** so the Lambda receives the path/method and API Gateway forwards its JSON response and status code. If your existing backend already has these read routes, integrate those routes to that backend and align `src/services` paths to its published contract instead of deploying the optional Lambda.

If the existing API uses a JWT/Cognito/custom authorizer, attach that existing authorizer to the protected GET routes. This presentation handler does not establish user identity or replace the backend's authorization policy; keep access control at the existing API Gateway/backend boundary.

## 4. Configure CORS

On an HTTP API, open **CORS** and set:

- **Allowed origins:** the exact local development origin and deployed SPA origin, such as `http://localhost:5173` and `https://app.example.com`.
- **Allowed methods:** `GET`, `OPTIONS`.
- **Allowed headers:** `Content-Type`, `Authorization`, `X-Amz-Date`, `X-Api-Key`, `X-Amz-Security-Token`.

Set the same comma-separated origins in Lambda `CORS_ORIGINS`. Do not use `*` with credentialed browser requests. `localhost` is a distinct origin from the production domain and needs its own entry. For REST APIs, enable CORS for each route/resource and ensure the OPTIONS response and Lambda proxy response include the appropriate allow-origin headers.

## 5. Deploy and get the Invoke URL

For HTTP APIs, open **API Gateway → APIs → your API → Stages**, select or create a stage (for example `dev`), and enable auto-deploy or choose **Deploy** after route changes. Copy the stage's **Invoke URL**. It looks like `https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/dev`. For a `$default` stage it may have no stage suffix.

## 6. Configure the SPA URL once

In the project root, copy `.env.example` to `.env.local` for local development and set:

```env
VITE_API_BASE_URL=https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
```

Restart the Vite server after changing the variable. All frontend services use the single `src/config/api.ts` configuration and do not contain AWS credentials.

## 7. Run and build locally

```bash
npm install
npm run dev
npm run build
```

Open the local origin printed by Vite. In browser developer tools, inspect **Network**, filter for `dashboard` or `cases`, and confirm successful JSON responses. A browser CORS error usually means the local/deployed origin or OPTIONS behavior is missing. `401`/`403` usually points to authorizer/API-key/route permissions; `404` usually means a route is missing or the base URL has an incorrect stage; `5xx` indicates an integration, Lambda, network, secret, or database error. Check API Gateway access/execution logs and Lambda CloudWatch logs for the server-side cause.

## 8. Production frontend

Set `VITE_API_BASE_URL` in the frontend build environment to the deployed stage Invoke URL, then produce a new static build. Allow the deployed frontend origin in both API Gateway CORS and Lambda `CORS_ORIGINS`. The browser calls API Gateway over HTTPS; it never receives database credentials and never connects directly to MySQL/RDS.

## Schema mapping notes

- Case identity, state, payer, plan, territory, tokens and dates: `case_master`.
- Drug and diagnosis values: latest `prescriptions` row for a case.
- B.Score, risk, confidence and predicted barriers: current `case_assessment` row.
- Owner/action/SLA: `case_assignments` joined to `users`.
- Explanations and recommendations: latest `case_insights` row.
- Activity timeline: `case_state_history`.
- Documents, provider accounts, and detailed patient benefit/clinical-history data do not have source tables in the supplied schema; the Lambda returns empty/unavailable data for document/provider routes and the UI identifies those gaps.
