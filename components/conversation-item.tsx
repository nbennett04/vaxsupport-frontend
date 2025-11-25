import { Card, CardBody } from "@heroui/card";
import clsx from "clsx";

const ConversationItem = ({
  title,
  onClick,
  selected,
}: {
  selected: boolean;
  title: string;
  onClick?: () => void;
}) => {
  return (
    <Card
      isHoverable
      isPressable
      className={clsx(
        "border dark:border-default/50",
        selected &&
          "bg-lime-100 border-lime-300 dark:bg-lime-500/25 dark:border-lime-500/50",
      )}
      radius="sm"
      shadow="sm"
      onPress={onClick}
    >
      <CardBody>
        <span className="text-sm font-medium">{title}</span>
      </CardBody>
    </Card>
  );
};

export default ConversationItem;
