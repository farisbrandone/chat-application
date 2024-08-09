import { createCookieSessionStorage, json, redirect } from "@remix-run/node";

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "__session",
      secrets: ["s3cret1"],
    },
  });

export const getUserToken = async ({ request }: { request: Request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  return session.get("userToken");
};

export const commitUserToken = async ({
  request,
  userToken,
}: {
  request: Request;
  userToken: string;
}) => {
  const session = await getSession(request.headers.get("Cookie"));
  session.set("userToken", userToken);
  return await commitSession(session);
};

export const logout = async ({ request }: { request: Request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const destroyedSession = await destroySession(session);
  return redirect("/", {
    headers: {
      "set-Cookie": destroyedSession, //permet de deconnecter tout utilisateur en detruisant les cookie de la session
    },
  });
};

export const authenticateUser = async ({
  request,
  userToken,
}: {
  request: Request;
  userToken: string;
}) => {
  const createdSession = await commitUserToken({
    request,
    userToken,
  });

  return redirect("/", {
    headers: {
      "Set-Cookie": createdSession,
    },
  });
};
