import { z } from "zod";
import { getUserToken, logout } from "~/routes/session.server";
import { fetcher } from "./utils.server";

const getAuthenticateUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  avatarUrl: z.string().optional().nullable(),
  canReceiveMoney: z.boolean(),
});

export const getOptionalUser = async ({ request }: { request: Request }) => {
  try {
    const userToken = await getUserToken({ request }); //recupération du token sauvegardé dans la session de l'utilisateur(cookie)
    if (userToken === undefined) {
      return null;
    }
    const response = await fetch("http://localhost:8000/auth", {
      //get method
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
    });
    const data = await response.json();
    console.log({ data });
    return getAuthenticateUserSchema.parse(data); //pourque la valeur retourné soit fortement typé
  } catch (error) {
    console.error(error);
    throw await logout({ request });
    //si il ya un token mais que l'utilisateur n'existe pas
  }
};

export const requireUser = async ({ request }: { request: Request }) => {
  const user = await getOptionalUser({ request });
  if (user) {
    return user;
  }
  throw await logout({ request });
};

const stripeConnectSchema = z.object({
  accountLink: z.string(),
});

/** obtenir le lien pour la conexion sur stripe*/
export const startStripeOnboarding = async ({
  request,
}: {
  request: Request;
}) => {
  const response = await fetcher({
    request,
    url: "/stripe/connect",
    method: "POST",
    data: {},
  });
  return stripeConnectSchema.parse(response);
};

const stripeDonateUrlSchema = z.object({
  error: z.boolean(),
  message: z.string(),
  sessionUrl: z.string().nullable(),
});

export const createDonation = async ({
  request,
  receivingUserId,
}: {
  request: Request;
  receivingUserId: string;
}) => {
  const response = await fetcher({
    request,
    url: `/stripe/donate/${receivingUserId}`,
    method: "POST",
    data: {},
  });
  return stripeDonateUrlSchema.parse(response); //on parse la reponse de notre route por s'assurer qu'elle a la forme souhaiter
};
