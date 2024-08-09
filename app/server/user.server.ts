import { z } from "zod";
import { fetcher, fileFetcher } from "./utils.server";
import { feedbackSchema } from "~/routes/forgot-password";

const getUsersSchema = z.array(
  z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    avatarUrl: z.string().optional().nullable(),
  })
);

export const getUsers = async ({ request }: { request: Request }) => {
  const response = await fetcher({
    request,
    url: "/users",
  });

  return getUsersSchema.parse(response);
};

export const updateUserAvatar = async ({
  request,
  formData /**or file:File */,
}: {
  request: Request;
  formData: FormData;
}) => {
  /** const formData=new formData()
   * formData.append("avatar", file)
   */
  /**ici on utilise pas la methode fectcher mais plutot fileFecher
   * qui permet un envoi streamer des données
   */
  const response = await fileFetcher({
    request,
    method: "POST",
    data: formData,
    url: "/users",
  });

  return feedbackSchema.parse(response);
};
