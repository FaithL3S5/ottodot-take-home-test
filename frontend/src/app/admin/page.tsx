import { Container, Heading, Link, Stack } from "@chakra-ui/react";
import NextLink from "next/link";
import { TrialClassOverview } from "@/components/admin/trial-class-overview";

export default function AdminPage() {
  return (
    <Container maxWidth="5xl" paddingBlock="10">
      <Stack gap="6">
        <Link asChild colorPalette="blue">
          <NextLink href="/">← Back to booking</NextLink>
        </Link>
        <Heading size="2xl">Trial class rosters</Heading>
        <TrialClassOverview />
      </Stack>
    </Container>
  );
}
