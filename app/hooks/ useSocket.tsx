import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useEnv } from "~/root";
//création d'un nouveau hook et d'un nouveau context  de websocket
const context = createContext<{ socket: Socket | null }>({ socket: null });

export const useSocket = () => {
  //est utiliser dans les composant enfant pour récupérer
  //la valeur passé au context.provider
  return useContext(context);
};

//composant parent qui donnera access à toutes les valeurs du context au composants enfant
export const SocketProvider = ({
  children,
}: /**represente n'importe quel enfant à l'interieur de notre socketprovider */ {
  children: ReactNode;
}) => {
  const [socket, setSocket] = useState<Socket | null>();
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const env = useEnv();
  useEffect(() => {
    //affecter le socket pendant le chargement de la page
    const createdSocket = io(env.WEBSOCKET_URL); // au premier chargement ou rendu de la page le useEffect déclanche la méthode io ce qui ouvrirai une requetes vers notre serveur websocket
    setSocket(createdSocket); // recupère le serveur de coommunication creer pour le passer au useStae
    if (!createdSocket) return;

    createdSocket.emit("connection"); //Emission de notre première notification vers le serveur

    const handleConfirmation = () => {
      setIsSocketConnected(true);
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };
    createdSocket.on("confirmation", handleConfirmation); //permet d'avoir la confirmation que le conexion est établi et renvoit cette confirmation qui est stocke dans isSocketConnected

    createdSocket.on("disconnect", handleDisconnect);

    return () => {
      //desactivation des exécution de ces methode avec un socket.off
      createdSocket.off("confirmation", handleConfirmation);
      createdSocket.off("disconnect", handleDisconnect);
    };
  }, []);
  return (
    <context.Provider
      value={{
        // Désactiver l'avertissement typescript
        //valeur passsé à notre context de type socket
        //cette valeur sera donc utiliser dans tous les enfants sans problème
        socket: socket ?? null,
      }}
    >
      <span className="fixed top-0 right-0">
        {isSocketConnected ? "🟢" : "🔴"}
      </span>
      {children}
    </context.Provider>
  );
};
