import { Container, Heading, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { BookingFlow } from "@/components/booking/booking-flow";

export default function BookingPage() {
  return (
    <Container maxWidth="5xl" paddingBlock="10">
      <Stack gap="8">
        <Stack gap="1">
          <Heading size="2xl">Book a trial class</Heading>
          <Text color="fg.muted">
            Trial classes are capped at 4 students.{" "}
            <Link asChild colorPalette="blue">
              <NextLink href="/admin">Admin rosters</NextLink>
            </Link>
          </Text>
        </Stack>
        <BookingFlow />
      </Stack>
    </Container>
  );
}
