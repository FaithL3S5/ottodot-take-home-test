"use client";

import { Link, Spinner, Table, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useApiData } from "@/hooks/use-api-data";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format-date-time";

export function TrialClassOverview() {
  const trialClasses = useApiData(apiClient.listTrialClasses);

  if (trialClasses.errorMessage) {
    return <Text color="fg.error">{trialClasses.errorMessage}</Text>;
  }
  if (!trialClasses.data) return <Spinner />;

  return (
    <Table.Root size="sm" variant="outline">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Class</Table.ColumnHeader>
          <Table.ColumnHeader>Starts</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">Confirmed</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {trialClasses.data.map((trialClass) => (
          <Table.Row key={trialClass.id}>
            <Table.Cell>
              <Link asChild colorPalette="blue">
                <NextLink href={`/admin/roster/${trialClass.id}`}>
                  {trialClass.title}
                </NextLink>
              </Link>
            </Table.Cell>
            <Table.Cell>{formatDateTime(trialClass.startsAt)}</Table.Cell>
            <Table.Cell textAlign="end">
              {trialClass.capacity - trialClass.seatsLeft} /{" "}
              {trialClass.capacity}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
