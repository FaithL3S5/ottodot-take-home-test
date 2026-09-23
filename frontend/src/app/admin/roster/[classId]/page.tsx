import { Container, Link, Stack } from "@chakra-ui/react";
import NextLink from "next/link";
import { RosterTable } from "@/components/admin/roster-table";

export default async function RosterPage({
  params,
}: PageProps<"/admin/roster/[classId]">) {
  const { classId } = await params;

  return (
    <Container maxWidth="5xl" paddingBlock="10">
      <Stack gap="6">
        <Link asChild colorPalette="blue">
          <NextLink href="/admin">← All classes</NextLink>
        </Link>
        <RosterTable trialClassId={Number(classId)} />
      </Stack>
    </Container>
  );
}
