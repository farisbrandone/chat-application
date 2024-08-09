import {
  Form,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useMatch,
  useMatches,
  useRouteLoaderData,
} from "@remix-run/react";
import "./tailwind.css";
import { getOptionalUser } from "./server/auth.server";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { SocketProvider } from "./hooks/ useSocket";
import { Navigation } from "./components/Navigation";
import { z } from "zod";

const envSchema = z.object({
  // BACKEND_URL: z.string(),
  WEBSOCKET_URL: z.string(),
});

//ce composant root est utiliser sur tous les pages.
export const loader = async (request: LoaderFunctionArgs) => {
  /**permet de manière optionnel de récupérer l'utilisateur si jamais il est connecté */
  const user = await getOptionalUser({ request: request.request });
  const env = envSchema.parse({
    // BACKEND_URL: process.env.BACKEND_URL,
    WEBSOCKET_URL: process.env.WEBSOCKET_URL ?? "ws://localhost:8001",
  });

  return json({ user, env });
};
export const useOptionalUser = () => {
  //récupérer le routeId des routes active
  //récupérer l'id root et l'id de tous ces enfants
  const data = useRouteLoaderData<typeof loader>("root");
  if (data?.user) {
    return data.user;
  }
  return null;
};

export const useEnv = () => {
  const data = useRouteLoaderData<typeof loader>("root");
  if (data?.env) {
    return data.env;
  }
  throw new Error("L'objet ENV n'existe pas");
};

export const useUser = () => {
  const data = useRouteLoaderData<typeof loader>("root");
  if (!data?.user) {
    throw new Error("L'utilisateur n'est pas identifié.");
  }
  return data.user;
};

export function Layout({ children }: { children: React.ReactNode }) {
  const user = useOptionalUser(); //récupérer notre utilisateur avec le useOptionalUser
  const matches = useMatches(); //récupérel'id des enfants
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <SocketProvider>
        {/**SocketProvider permet d'avoir access au websocket dans l'ensemble de l'application */}
        <body className="flex items-center justify-center w-screen h-screen">
          {user ? (
            <div
              className={`w-full text-sm ${
                user?.canReceiveMoney ? "bg-emerald-700" : "bg-red-700"
              }`}
            >
              {" "}
              <span>
                {user?.canReceiveMoney
                  ? "Votre compte est bien configuré pour recevoir des donations"
                  : "vous devez configurez votre compte pour recevoir des donations"}{" "}
              </span>
              {
                /*si l'utilisateur ne peut pas renvoyé de lien*/ !user?.canReceiveMoney ? (
                  <Link to="/onboarding">je configure mon compte</Link>
                ) : null
              }
            </div>
          ) : null}
          <nav className="flex row gap-4 absolute top-4 right-3 border-2 rounded-lg p-4">
            {!user ? (
              <Link to="/register">Créer un compte</Link>
            ) : (
              <Form method="POST" action="logout">
                <button type="submit">Se deconnecter</button>
              </Form>
            )}
          </nav>
          <Navigation />
          {/*<pre>{JSON.stringify(matches, null, 4)}</pre>*/}
          <div className="w-[500px] h-[500px] flex items-center justify-center p-2">
            {children}
          </div>

          <ScrollRestoration />
          <Scripts />
        </body>
      </SocketProvider>
    </html>
  );
}

export default function App() {
  return <Outlet />; /**rendu de tous les composant selon la route */
}
