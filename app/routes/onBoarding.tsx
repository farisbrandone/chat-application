/**ce fichier n'est pas une vue mais seulement une API */

import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { requireUser, startStripeOnboarding } from "~/server/auth.server";
/**ceci est une action donc ne peut s'éxécuter qu'a la suite de la soumission d'un formulaire */
export const action = async ({ request }: ActionFunctionArgs) => {
  /**pour forcer les utilisateurs connecté à appeler cette route , n'exécute le suivant que si il sont connecté sinon les redirige vers l'acceuil et détruit la session existante*/
  /**au cas ou l'utilisateur n"as pas remplit son profil a temps rapellons nous de de notre refresh url coté backend
   * qui va regenerer son lien onboarding
   */
  await requireUser({ request });
  const { accountLink } = await startStripeOnboarding({ request });
  /**redirigons donc l'utilisateur vers le liens de payement renvoyé par stripe */
  redirect(accountLink);
};

/**mettons la logique de la methode associée au refresh url dans un loader */

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { accountLink } = await startStripeOnboarding({ request });
  /**redirigons donc l'utilisateur vers le liens de payement renvoyé par stripe */
  redirect(accountLink);
};
