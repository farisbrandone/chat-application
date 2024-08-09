import type {
  MetaFunction,
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, json, useActionData, useLoaderData } from "@remix-run/react";
import { boolean, z } from "zod";
import {
  authenticateUser,
  commitUserToken,
  getUserToken,
} from "./session.server";
import { getOptionalUser } from "~/server/auth.server";
import { useOptionalUser } from "~/root";
import { tokenSchema } from "./register";
export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};
type message = {
  message: string;
};
const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});
/*const tokenSchema = z.object({
  access_token: z.string(),
});*/
//loader permet le rendue coté server donc permet que la page soit charger
//avant de le rendre coté server
/*export const loader = async (request: LoaderFunctionArgs) => {
  const user = await getOptionalUser({ request: request.request });

  return json({ user });
};*/

export const action = async (request: ActionFunctionArgs) => {
  const formData = await request.request.formData();
  const jsonData = Object.fromEntries(formData);
  const parsedJson = loginSchema.parse(jsonData);

  const response = await fetch("http://localhost:8000/auth/login", {
    method: "POST",
    body: JSON.stringify(parsedJson),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const { access_token, message, error } = tokenSchema.parse(
    await response.json()
  );

  if (error) {
    return json({
      error,
      message,
    });
  }
  if (access_token) {
    return await authenticateUser({
      request: request.request,
      userToken: access_token,
    });
  }
  return json({
    error: true,
    message: "Une erreur inatendu est survenue",
  });
};
//partie qui est rendue coté client donc aucun chargement coté server
export default function Index() {
  const user = useOptionalUser(); //recupérer la donné envoyé par le server et que renvoie la fonction loader
  const isConnected = user != null;

  return (
    <div className="font-sans p-4 flex flex-col items-center justify-center ">
      <div className="w-[500px] h-[500px] bg-white mt-10">
        <h1 className="text-3xl">Welcome to Remix</h1>
        <pre>{JSON.stringify(user, null, 4)}</pre>
        {isConnected ? <h1>Welcome {user.firstName}</h1> : <LoginForm />}
      </div>
    </div>
  );
}

const LoginForm = () => {
  const message = useActionData<message>();
  console.log(message);
  return (
    <Form method="POST" className="flex flex-col gap-5 bg-white mt-5">
      <input
        type="email"
        name="email"
        required
        className="h-14 border-[#003ce4] p-4 border-2 rounded-md"
        placeholder="entrer votre email"
      />
      <input
        type="password"
        name="password"
        required
        className="h-14 border-[#003ce4] p-4 border-2 rounded-md"
        placeholder="entrer votre mots de passe"
      />
      <button type="submit" className="p-4 bg-[#003ce4] text-white">
        Se connecter
      </button>
      {!!message ? <pre className="text-red-600">{message.message}</pre> : null}
    </Form>
  );
};
