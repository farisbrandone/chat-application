import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  json,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { z } from "zod";
import { requireUser } from "~/server/auth.server";
import type { ActionFeedback } from "~/components/FeedbackComponent";
import { AlertFeedback } from "~/components/FeedbackComponent";
import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useUser } from "~/root";
import { updateUserAvatar } from "~/server/user.server";
const MAX_FILE_SIZE = 10_000_000; //10MB
const UpdateAvatarSchema = z.object({
  avatar: z.instanceof(File).superRefine((file, ctx) => {
    /**le superRefine permet de rajouter une règle que nous allons collé nous meme */
    /**si notre requete passe la validation et est bien un fichier nous allons comparer sa taille suivant la règle ci-dessous */
    if (file.size > MAX_FILE_SIZE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'image est trop lourde (10Mo max)",
      });
      return false;
    }
    return file;
  }),
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUser({
    request,
  }); /**un loader qui permet de récupérer l'utilisateur authentifier */
  return json({});
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireUser({ request });

  const imageHandler = unstable_createMemoryUploadHandler({
    /**utiliser pour des fichier envoyer en formadata donc en streaming par paquet progressif */
    maxPartSize:
      MAX_FILE_SIZE /**stocker le fichier dans la mémoire en attendant que le téléchargement se termine */,
  });

  const formData = await unstable_parseMultipartFormData(request, imageHandler);

  try {
    UpdateAvatarSchema.parse({
      /**pour valider notre image on a définit un schéma avec zod */
      avatar: formData.get("avatar"),
    });
    /**une fois notre fichier valider par zod,
     * nous allons envoyer notre fichier et nous allons le streamer
     * pour l'envoie à notre API
     * D'OU La methode updateUserAvatar qui permet d'envoyer au server de manière
     * streamer nos données
     */
    const feedback = await updateUserAvatar({
      request,
      formData,
    });
    // updateUser();
    // return await createConversation({
    // 	request,
    // 	recipientId: recipientId as string,
    // });
    return json<ActionFeedback>(feedback);
  } catch (error) {
    if (error instanceof Error) {
      return json<ActionFeedback>({
        error: true,
        message: error.message,
      });
    }
    if (error instanceof z.ZodError) {
      return json<ActionFeedback>({
        error: true,
        message: error.errors.map((error) => error.message).join("\n"),
      });
    }
    return json<ActionFeedback>({
      error: true,
      message: "L'image n'a pas pu être mise en ligne",
    });
  }
};

const UserSettings = () => {
  const user = useUser();
  const formFeedback = useActionData<ActionFeedback>();
  const isLoading = useNavigation().state !== "idle";
  return (
    <>
      <div className="container relative flex-col items-center justify-center lg:max-w-none lg:px-0">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Inscription
            </h1>
            <p className="text-sm text-muted-foreground">Créez votre compte</p>
          </div>

          {/* FOrm */}
          <div className={"grid gap-6"}>
            <Form encType="multipart/form-data" method="POST">
              <div className="grid gap-2">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    className="w-30 h-auto flex-shrink-0"
                    alt=""
                  />
                ) : null}
                <div className="grid gap-1">
                  <Label className="sr-only" htmlFor="avatar">
                    Avatar
                  </Label>
                  <Input
                    id="avatar"
                    name="avatar"
                    placeholder="Votre avatar"
                    type="file"
                    accept="image/*"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* <div className='grid gap-1'>
									<Label className='sr-only' htmlFor='firstName'>
										Prénom
									</Label>
									<Input
										id='firstName'
										name='firstName'
										placeholder='Votre prénom'
										type='text'
										autoCapitalize='none'
										autoComplete='given-name'
										autoCorrect='off'
										required
										disabled={isLoading}
									/>
								</div> */}
                {/* <div className='grid gap-1'>
									<Label className='sr-only' htmlFor='email'>
										Email
									</Label>
									<Input
										id='email'
										name='email'
										placeholder='Adresse email'
										type='email'
										autoCapitalize='none'
										autoComplete='email'
										autoCorrect='off'
										required
										disabled={isLoading}
									/>
								</div>
								<div className='grid gap-1'>
									<Label className='sr-only' htmlFor='email'>
										Mot de passe
									</Label>
									<Input
										id='password'
										name='password'
										placeholder='Mot de passe'
										type='password'
										autoCapitalize='none'
										autoComplete='password'
										autoCorrect='off'
										required
									/>
								</div> */}

                <AlertFeedback feedback={formFeedback} />
                <Button type="submit">
                  {isLoading ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Modifier l'avatar
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
};
export default UserSettings;
