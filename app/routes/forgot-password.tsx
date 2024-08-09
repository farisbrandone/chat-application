import type {
  MetaFunction,
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  json,
  Link,
  redirect,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import { z } from "zod";
import { getOptionalUser } from "~/server/auth.server";
export const meta: MetaFunction = () => {
  return [
    { title: "Reset Password" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const actionSchema = z.object({
  actions: z.enum(["request-password-reset", "reset-password"]),
});
const forgotPasswordSchema = z.object({
  email: z
    .string({
      required_error: "Votre adresse email est requise",
      invalid_type_error: "Vous devez fournir une adresse email valide",
    })
    .email({
      message: "Vous devez fournir un email valide",
    }),
});
export const feedbackSchema = z.object({
  message: z.string(),
  error: z.boolean(),
});

const resetPasswordSchema = z.object({
  password: z
    .string({
      required_error: "Votre mot de passe est requis",
    })
    .min(3, {
      message: "le mots de passe doit faire au moins 3 caractères",
    }),

  passwordConfirmation: z
    .string({
      required_error: "Votre mot de passe est requis",
    })
    .min(3, {
      message: "le mots de passe doit faire au moins 3 caractères",
    }),
});

//loader permet le rendue coté server donc permet que la page soit charger
//avant de le rendre coté server
export const loader = async (request: LoaderFunctionArgs) => {
  try {
    const user = await getOptionalUser({ request: request.request });

    if (user) {
      //l'utilisateur est connecte
      return redirect("/");
    }
    console.log(request.request.url);
    const urlParams = new URL(request.request.url).searchParams;
    const token = urlParams.get("token");
    console.log({ token });

    //vérifier coté serveur que ce token est valide
    if (token) {
      const response = await fetch(
        `http://localhost:8000/auth/verify-reset-password-token?token=${token}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      console.log({ result });
      const { message, error } = feedbackSchema.parse(result);

      return json({
        error,
        message,
        token,
      });
    }
    return json({
      error: false,
      message: "",
      token,
    });
  } catch (error) {
    let err = error as Error;
    return json({
      error: true,
      message: err.message,
      token: null,
    });
  }
};

export const action = async (request: ActionFunctionArgs) => {
  try {
    const formData = await request.request.formData();
    const jsonData = Object.fromEntries(formData);
    const { actions } = actionSchema.parse(jsonData);
    switch (actions) {
      case "request-password-reset": {
        const parsedJson =
          forgotPasswordSchema.safeParse(
            jsonData
          ); /*registerSchema.parse(jsonData)*/

        if (parsedJson.success === false) {
          const { error } = parsedJson;
          return json({
            error: true,
            message: error.errors.map((err) => err.message).join(", "),
          });
        }
        const response = await fetch(
          "http://localhost:8000/auth/request-reset-password",
          {
            method: "POST",
            body: JSON.stringify(parsedJson.data),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const myResponse = await response.json();
        console.log(myResponse);
        const { message, error } = feedbackSchema.parse(myResponse);

        return json({
          error,
          message,
        });
      }
      case "reset-password": {
        const parsedJson =
          resetPasswordSchema.safeParse(
            jsonData
          ); /*registerSchema.parse(jsonData)*/

        if (parsedJson.success === false) {
          const { error } = parsedJson;
          return json({
            error: true,
            message: error.errors.map((err) => err.message).join(", "),
          });
        }
        const { password, passwordConfirmation } = parsedJson.data;

        if (password !== passwordConfirmation) {
          return json({
            error: true,
            message: "Les mots de passe ne correspondent pas",
          });
        }

        const response = await fetch(
          "http://localhost:8000/auth/reset-password",
          {
            method: "POST",
            body: JSON.stringify(parsedJson.data),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const myResponse = await response.json();
        console.log(myResponse);
        const { message, error } = feedbackSchema.parse(myResponse);

        return json({
          error,
          message,
        });
      }

      default:
        break;
    }
  } catch (error) {
    let err = error as Error;
    return json({
      error: true,
      message: err.message,
    });
  }
};

//partie qui est rendue coté client donc aucun chargement coté server
export default function ForgotPasswordForm() {
  const { error, message, token } = useLoaderData<typeof loader>();
  const formFeedBack = useActionData<typeof action>();
  if (!token) {
    return (
      <Form method="POST" className="flex flex-col gap-5 bg-white mt-5">
        {error ? (
          <span className="text-red-800">{message}</span>
        ) : (
          <span className="text-blue-700">{message}</span>
        )}
        <input
          type="email"
          name="email"
          required
          className="h-14 border-[#003ce4] p-4 border-2 rounded-md"
          placeholder="entrer votre email"
        />
        <input type="hidden" name="actions" value="request-password-reset" />
        {formFeedBack ? <span>{formFeedBack.message}</span> : null}
        <button type="submit" className="p-4 bg-[#003ce4] text-white">
          Récupérer mon mot de passe
        </button>
      </Form>
    );
  }
  if (token && error === true) {
    return (
      <div>
        <span className="text-red-800">{message}</span>
        <Link to="/">Retourner à l'acceuil</Link>
      </div>
    );
  }
  if (token && error === false) {
    return (
      <Form method="POST" className="flex flex-col gap-5 bg-white mt-5">
        <input
          type="password"
          name="password"
          required
          className="h-14 border-[#003ce4] p-4 border-2 rounded-md"
          placeholder="entrer votre mot de passe"
        />
        <label htmlFor="passwordConfirmation">
          Confirmez votre mots de passe
        </label>
        <input
          type="password"
          name="passwordConfirmation"
          id="passwordConfirmation"
          required
          className="h-14 border-[#003ce4] p-4 border-2 rounded-md"
          placeholder="entrer votre mot de passe"
        />
        <input type="hidden" name="actions" value="reset-password" />
        {formFeedBack ? <span>{formFeedBack.message}</span> : null}
        <button type="submit" className="p-4 bg-[#003ce4] text-white">
          Réinitialiser votre nouveau mot de passe
        </button>
      </Form>
    );
  }
}
