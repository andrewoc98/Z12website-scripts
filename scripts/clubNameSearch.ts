/**
 * clubNameSearch.ts
 *
 * Mirror of clubNameSearchKey in the functions repo
 * (Z12website-functions/functions/src/club/clubNameSearch.ts).
 * Change one, change the other — a divergence silently breaks club search.
 *
 * Every club document needs a `nameSearch` key: Firestore range queries compare
 * raw UTF-8 bytes, so searchClubs prefix-matches on this lowercase,
 * accent-folded copy of `name` rather than on `name` itself. A club written
 * without it is invisible to search on the profile and registration pages.
 */
export function clubNameSearchKey(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/['\u2019]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}
