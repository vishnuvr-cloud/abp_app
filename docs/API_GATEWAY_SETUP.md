# API Gateway setup

For the route-by-route API Gateway, Lambda, CORS, deployment, Invoke URL, and frontend configuration instructions, see [API Gateway Route Guide](./API_GATEWAY_ROUTE_GUIDE.md).

The frontend reads the stage URL only from `VITE_API_BASE_URL` (configured in `src/config/api.ts`). Set it in `.env.local` for development and in the static frontend build environment for production. No React component needs to be edited when the stage URL changes.
