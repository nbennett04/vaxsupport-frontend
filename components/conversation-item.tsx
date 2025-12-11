import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { TrashIcon } from "@heroicons/react/24/outline"; // Switched to outline for a cleaner look
import clsx from "clsx";

const ConversationItem = ({
  title,
  onClick,
  onDelete,
  isDeleting,
  selected,
}: {
  selected: boolean;
  title: string;
  onClick?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}) => {
  return (
    <Card
      isHoverable
      isPressable
      // Added "group" class to handle hover effects for children
      className={clsx(
        "group border dark:border-default/50 transition-all",
        selected
          ? "bg-lime-100 border-lime-300 dark:bg-lime-500/25 dark:border-lime-500/50"
          : "bg-transparent hover:bg-default-100"
      )}
      radius="sm"
      shadow="sm"
      onPress={onClick}
    >
      {/* Reduced padding (p-2.5) to make the card slimmer */}
      <CardBody className="flex flex-row items-center gap-2 justify-between p-2.5 overflow-hidden">
        
        {/* Added flex-1 to push the button to the right and text-left for alignment */}
        <span 
          className={clsx(
            "text-sm font-medium line-clamp-1 flex-1 text-left break-all",
             selected ? "text-lime-900 dark:text-lime-100" : "text-default-700"
          )}
        >
          {title}
        </span>

       
      </CardBody>
    </Card>
  );
};

export default ConversationItem;