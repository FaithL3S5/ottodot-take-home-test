import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1790141544779 implements MigrationInterface {
  name = 'InitialSchema1790141544779';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE parents (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name text NOT NULL,
        email text NOT NULL UNIQUE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE children (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        parent_id bigint NOT NULL REFERENCES parents (id),
        name text NOT NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX children_parent_id_index ON children (parent_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE trial_classes (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        title text NOT NULL,
        starts_at timestamptz NOT NULL,
        capacity integer NOT NULL DEFAULT 4 CHECK (capacity > 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE bookings (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        child_id bigint NOT NULL REFERENCES children (id),
        trial_class_id bigint NOT NULL REFERENCES trial_classes (id),
        status text NOT NULL DEFAULT 'pending_payment'
          CHECK (status IN ('pending_payment', 'confirmed', 'payment_failed', 'seat_taken')),
        created_at timestamptz NOT NULL DEFAULT now(),
        confirmed_at timestamptz,
        CHECK ((status = 'confirmed') = (confirmed_at IS NOT NULL))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX bookings_one_active_per_child_and_class
        ON bookings (child_id, trial_class_id)
        WHERE status IN ('pending_payment', 'confirmed')
    `);
    await queryRunner.query(
      `CREATE INDEX bookings_trial_class_id_status_index ON bookings (trial_class_id, status)`,
    );

    await queryRunner.query(`
      CREATE TABLE payment_attempts (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        booking_id bigint NOT NULL REFERENCES bookings (id),
        status text NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
        amount_cents integer NOT NULL CHECK (amount_cents > 0),
        idempotency_key text NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX payment_attempts_booking_id_index ON payment_attempts (booking_id)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE payment_attempts`);
    await queryRunner.query(`DROP TABLE bookings`);
    await queryRunner.query(`DROP TABLE trial_classes`);
    await queryRunner.query(`DROP TABLE children`);
    await queryRunner.query(`DROP TABLE parents`);
  }
}
