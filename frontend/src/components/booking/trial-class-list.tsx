import { Button, Card, SimpleGrid, Text } from "@chakra-ui/react";
import type { TrialClassWithSeatsLeft } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format-date-time";

interface TrialClassListProps {
  trialClasses: TrialClassWithSeatsLeft[];
  isBookingDisabled: boolean;
  onBook: (trialClass: TrialClassWithSeatsLeft) => void;
}

export function TrialClassList({
  trialClasses,
  isBookingDisabled,
  onBook,
}: TrialClassListProps) {
  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
      {trialClasses.map((trialClass) => {
        const isFull = trialClass.seatsLeft <= 0;
        return (
          <Card.Root key={trialClass.id} size="sm">
            <Card.Header>
              <Card.Title>{trialClass.title}</Card.Title>
            </Card.Header>
            <Card.Body gap="1">
              <Text textStyle="sm">{formatDateTime(trialClass.startsAt)}</Text>
              <Text textStyle="sm" color={isFull ? "fg.error" : "fg.muted"}>
                {isFull
                  ? "Full"
                  : `${trialClass.seatsLeft} of ${trialClass.capacity} seats left`}
              </Text>
            </Card.Body>
            <Card.Footer>
              <Button
                size="sm"
                disabled={isBookingDisabled || isFull}
                onClick={() => onBook(trialClass)}
              >
                Book trial
              </Button>
            </Card.Footer>
          </Card.Root>
        );
      })}
    </SimpleGrid>
  );
}
