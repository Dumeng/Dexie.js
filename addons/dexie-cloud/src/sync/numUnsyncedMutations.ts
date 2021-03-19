import Dexie, { liveQuery } from "dexie";
import { getMutationTable } from "../helpers/getMutationTable";
import { getSyncableTables } from "../helpers/getSyncableTables";
import { combineLatest, from } from "rxjs";
import { distinctUntilChanged, filter, map } from "rxjs/operators";

export function getNumUnsyncedMutationsObservable(db: Dexie) {
  const syncableTables = getSyncableTables(db.tables.map((t) => t.name));
  const mutationTables = syncableTables.map((table) =>
    db.table(getMutationTable(table))
  );
  const queries = mutationTables.map((mt) => from(liveQuery(() => mt.count())));
  return combineLatest(queries).pipe(
    // Compute the sum of all tables' unsynced changes:
    map((counts) => counts.reduce((x, y) => x + y)),
    // Swallow false positives - when the number was the same as before:
    distinctUntilChanged()
  );
}
