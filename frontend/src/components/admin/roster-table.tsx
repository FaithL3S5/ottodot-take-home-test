"use client";

import { Heading, Spinner, Stack, Table, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { useApiData } from "@/hooks/use-api-data";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format-date-time";

export function RosterTable({ trialClassId }: { trialClassId: number }) {
  const loadRoster = useMemo(
    () => () => apiClient.getRoster(trialClassId),
    [trialClassId],
  );
  const roster = useApiData(loadRoster);

  if (roster.errorMessage) {
    return <Text color="fg.error">{roster.errorMessage}</Text>;
  }
  if (!roster.data) return <Spinner />;

  const { trialClass, students } = roster.data;

  return (
    <Stack gap="4">
      <Stack gap="1">
        <Heading size="xl">{trialClass.title}</Heading>
        <Text color="fg.muted">
          {formatDateTime(trialClass.startsAt)} · {students.length} /{" "}
          {trialClass.capacity} confirmed
        </Text>
      </Stack>

      {students.length === 0 ? (
        <Text color="fg.muted">No confirmed students yet.</Text>
      ) : (
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Student</Table.ColumnHeader>
              <Table.ColumnHeader>Booking</Table.ColumnHeader>
              <Table.ColumnHeader>Confirmed at</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {students.map((student) => (
              <Table.Row key={student.bookingId}>
                <Table.Cell>{student.childName}</Table.Cell>
                <Table.Cell>#{student.bookingId}</Table.Cell>
                <Table.Cell>{formatDateTime(student.confirmedAt)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Stack>
  );
}
