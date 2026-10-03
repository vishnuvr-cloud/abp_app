# API Gateway setup

For the route-by-route API Gateway, Lambda, CORS, deployment, Invoke URL, and frontend configuration instructions, see [API Gateway Route Guide](./API_GATEWAY_ROUTE_GUIDE.md).

The frontend reads the stage URL only from `VITE_API_BASE_URL` (configured in `src/config/api.ts`). Set it in `.env.local` for development and in the static frontend build environment for production. No React component needs to be edited when the stage URL changes.

For local design review, synthetic fixtures are enabled by default when no Gateway URL is set. To turn them off explicitly, set `VITE_USE_DEMO_DATA=false` in `.env.local` and restart Vite. A configured real `VITE_API_BASE_URL` always takes precedence over the fixtures. See the [route guide](./API_GATEWAY_ROUTE_GUIDE.md#local-synthetic-preview-data) for details.
