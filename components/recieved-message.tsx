import { Card, CardBody } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import { Button } from "@heroui/button";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";
import { useLocale } from "next-intl";

const ReceivedMessage = ({
  text,
  isLoading,
}: {
  text: string;
  isLoading?: boolean;
}) => {
  const currentLocale = useLocale();

  console.log(currentLocale);
  const speak = (text: string) => {
    if (!window.speechSynthesis) {
      alert("Text-to-Speech is not supported in this browser.");

      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel(); // Reset the speech queue if already speaking
    }
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = currentLocale === "en" ? "en-US" : "es-ES"; // Change language if needed
      utterance.rate = 1; // Speed of speech (0.5 to 2)
      utterance.pitch = 1; // Voice pitch
      utterance.volume = 1; // Volume (0 to 1)

      window.speechSynthesis.speak(utterance);
    }, 50);
  };

  return (
    <div className="flex justify-start items-end">
      <Card className="rounded-tl-none max-w-[280px] md:max-w-md border dark:border-default/50">
        <CardBody className="text-sm sm:text-base">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="w-full rounded-full">
                <div className="h-3 w-[250px] rounded-lg bg-default-300" />
              </Skeleton>
              <Skeleton className="w-full rounded-full">
                <div className="h-3 w-[250px] rounded-lg bg-default-300" />
              </Skeleton>
              <Skeleton className="w-full rounded-full">
                <div className="h-3 w-[250px] md:w-[600px] rounded-lg bg-default-300" />
              </Skeleton>
            </div>
          ) : (
            text
          )}
        </CardBody>
      </Card>
      <Button isIconOnly className="bg-transparent" onPress={() => speak(text)}>
        <SpeakerWaveIcon height={20} width={20} />
      </Button>
    </div>
  );
};

export default ReceivedMessage;
