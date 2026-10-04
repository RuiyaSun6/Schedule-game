import { Router, type Request, type Response, type NextFunction } from "express";
import { clearedSessionCookie, login, register, revokeSession, SESSION_COOKIE, sessionCookie, sessionUser } from "../services/authService.js";

const router = Router();
function cookieToken(request: Request): string | undefined {
  return request.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
}
export async function requireAuth(request: Request, response: Response, next: NextFunction): Promise<void> {
  const user = await sessionUser(cookieToken(request));
  if (!user) { response.status(401).json({ error: "Please log in." }); return; }
  request.authUser = user;
  next();
}
router.post("/register", async (request, response) => {
  const input = request.body && typeof request.body === "object" && !Array.isArray(request.body) ? request.body : {};
  const result = await register(input);
  if ("error" in result) { response.status(result.status).json({ error: result.error }); return; }
  response.setHeader("Set-Cookie", sessionCookie(result.token));
  response.status(201).json({ user: result.user });
});
router.post("/login", async (request, response) => {
  const result = await login(request.body?.identity, request.body?.password);
  if (!result) { response.status(401).json({ error: "Invalid email/username or password." }); return; }
  response.setHeader("Set-Cookie", sessionCookie(result.token));
  response.json({ user: result.user });
});
router.get("/session", requireAuth, (request, response) => { response.json({ user: request.authUser }); });
router.post("/logout", async (request, response) => {
  await revokeSession(cookieToken(request));
  response.setHeader("Set-Cookie", clearedSessionCookie());
  response.json({ ok: true });
});
export default router;
