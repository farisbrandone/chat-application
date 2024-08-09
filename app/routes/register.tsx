import type {
  MetaFunction,
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  json,
  redirect,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import { z } from "zod";
import {
  authenticateUser,
  commitUserToken,
  getUserToken,
} from "./session.server";
import { getOptionalUser } from "~/server/auth.server";
export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const registerSchema = z.object({
  email: z
    .string({
      required_error: "Votre adresse email est requise",
      invalid_type_error: "Vous devez fournir une adresse email valide",
    })
    .email({
      message: "Vous devez fournir un email valide",
    }),
  password: z
    .string({
      required_error: "Votre mot de passe est requis",
    })
    .min(3, {
      message: "le mots de passe doit faire au moins 3 caractères",
    }),
  firstName: z.string({
    required_error: "Votre prenom est requis",
  }),
});
export const tokenSchema = z.object({
  access_token: z.string().optional(),
  message: z.string().optional(),
  error: z.boolean().optional(),
});
//loader permet le rendue coté server donc permet que la page soit charger
//avant de le rendre coté server
export const loader = async (request: LoaderFunctionArgs) => {
  const user = await getOptionalUser({ request: request.request });

  if (user) {
    //l'utilisateur est connecte
    return redirect("/");
  }
  return json({});
};

export const action = async (request: ActionFunctionArgs) => {
  const formData = await request.request.formData();
  const jsonData = Object.fromEntries(formData);
  const parsedJson =
    registerSchema.safeParse(jsonData); /*registerSchema.parse(jsonData)*/

  if (parsedJson.success === false) {
    const { error } = parsedJson;
    return json({
      error: true,
      message: error.errors.map((err) => err.message).join(", "),
    });
  }
  console.log({ value: parsedJson.data });

  const response = await fetch("http://localhost:8000/auth/register", {
    method: "POST",
    body: JSON.stringify(parsedJson.data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const result = await response.json();
  console.log({ penis: result });
  const { access_token, error, message } = tokenSchema.parse(result);
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
  console.log({ access_token });
  return json({
    error: true,
    message: "Une erreur inatendu est survenue",
  });
};

//partie qui est rendue coté client donc aucun chargement coté server
export default function Index() {
  const formFeedBack = useActionData<typeof action>();
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
      <input
        type="text"
        name="firstName"
        required
        className="h-14 border-[#003ce4] p-4 border-2 rounded-md"
        placeholder="entrer votre nom et prenom"
      />
      {formFeedBack ? <span>{formFeedBack.message}</span> : null}
      <button type="submit" className="p-4 bg-[#003ce4] text-white">
        Créer votre compte
      </button>
    </Form>
  );
}
