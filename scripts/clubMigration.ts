#!/usr/bin/env npx ts-node --esm
/**
 * seed-firestore.ts
 *
 * Phase 2.1–2.4 — Create federation documents, club documents, and
 * ClubPrivateConfig subcollection docs in Firestore.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *   npx ts-node seed-firestore.ts [--dry-run] [--force]
 *
 * Flags:
 *   --dry-run   Print what would be written without touching Firestore.
 *   --force     Overwrite documents that already exist (default: skip).
 *
 * Requirements:
 *   npm install firebase-admin
 *   npm install --save-dev ts-node typescript @types/node
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, DocumentReference } from "firebase-admin/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FederationSeed {
    id:        string;
    name:      string;
    shortName: string;
    sport:     string;
    country:   string;
    adminUids: string[];
    status:    "active" | "inactive";
    createdAt: string;
    updatedAt: string;
}

interface ClubSeed {
    id:             string;
    name:           string;
    shortName:      string;
    sport:          string;
    federationId:   string;
    location:       { city: string; country: string };
    openMembership: boolean;
}

interface ClubDoc extends Omit<ClubSeed, never> {
    adminUids:   string[];
    memberCount: number;
    rowerCount:  number;
    coachCount:  number;
    status:      "active" | "inactive";
    createdAt:   string;
    updatedAt:   string;
}

interface ClubPrivateConfig {
    inviteCodeHashes: string[];
    updatedAt:        string;
}

type UpsertResult = "created" | "updated" | "skipped" | "dry-run";

// ─── CLI flags ────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE   = process.argv.includes("--force");

if (DRY_RUN) console.log("🔍  DRY RUN — no Firestore writes will occur.\n");

// ─── Init ─────────────────────────────────────────────────────────────────────

if (!getApps().length) {
    initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!) });
}
const db = getFirestore();

// ─── Timestamp ────────────────────────────────────────────────────────────────

const NOW = new Date().toISOString();

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEDERATIONS: FederationSeed[] = [
    {
        id:        "fed-rowing-ireland",
        name:      "Rowing Ireland",
        shortName: "RI",
        sport:     "rowing",
        country:   "IE",
        adminUids: [],
        status:    "active",
        createdAt: NOW,
        updatedAt: NOW,
    },
    {
        id:        "fed-us-rowing",
        name:      "US Rowing",
        shortName: "USR",
        sport:     "rowing",
        country:   "US",
        adminUids: [],
        status:    "active",
        createdAt: NOW,
        updatedAt: NOW,
    },
];

const CLUBS: ClubSeed[] = [
    // ── Rowing Ireland ──────────────────────────────────────────────────────────
    {
        id:             "club-neptune",
        name:           "Neptune Rowing Club",
        shortName:      "Neptune RC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        location:       { city: "Dublin",        country: "IE" },
        openMembership: true,
    },
    {
        id:             "club-castleconnell",
        name:           "Castleconnell Boat Club",
        shortName:      "Castleconnell BC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        location:       { city: "Castleconnell", country: "IE" },
        openMembership: true,
    },
    {
        id:             "club-shannon",
        name:           "Shannon Rowing Club",
        shortName:      "Shannon RC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        location:       { city: "Shannon",       country: "IE" },
        openMembership: true,
    },
    {
        id:             "club-ul-rowing",
        name:           "University of Limerick Rowing Club",
        shortName:      "UL RC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        location:       { city: "Limerick",      country: "IE" },
        openMembership: true,
    },
    {
        id:             "club-beat-cancer",
        name:           "Beat Cancer Boat Club",
        shortName:      "Beat Cancer BC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        location:       { city: "Dublin",        country: "IE" },
        openMembership: true,
    },
    {
        id:             "club-commercial",
        name:           "Commercial Rowing Club",
        shortName:      "Commercial RC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        location:       { city: "Dublin",        country: "IE" },
        openMembership: true,
    },
    {
        id:             "club-carlow",
        name:           "Carlow Rowing Club",
        shortName:      "Carlow RC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        location:       { city: "Carlow",        country: "IE" },
        openMembership: true,
    },
    {
        id:             "club-kilorglin",
        name:           "Kilorglin Rowing Club",
        shortName:      "Kilorglin RC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        location:       { city: "Kilorglin",     country: "IE" },
        openMembership: true,
    },
    // ── US Rowing ────────────────────────────────────────────────────────────────
    {
        id:             "club-gcds",
        name:           "Greenwich Country Day School",
        shortName:      "GCDS",
        sport:          "rowing",
        federationId:   "fed-us-rowing",
        location:       { city: "Greenwich",     country: "US" },
        openMembership: false,
    },
    {
        id:             "club-gms",
        name:           "GMS Rowing Center",
        shortName:      "GMS",
        sport:          "rowing",
        federationId:   "fed-us-rowing",
        location:       { city: "New Milford",   country: "US" },
        openMembership: true,
    },
    {
        id:             "club-row-america",
        name:           "RowAmerica Greenwich",
        shortName:      "RowAmerica",
        sport:          "rowing",
        federationId:   "fed-us-rowing",
        location:       { city: "Greenwich",     country: "US" },
        openMembership: true,
    },
    {
        id:             "club-harlem-river",
        name:           "Harlem River Community Rowing",
        shortName:      "HRCR",
        sport:          "rowing",
        federationId:   "fed-us-rowing",
        location:       { city: "New York",      country: "US" },
        openMembership: true,
    },
    {
        id:             "club-longmont",
        name:           "Longmont Sculling Club",
        shortName:      "Longmont SC",
        sport:          "rowing",
        federationId:   "fed-us-rowing",
        location:       { city: "Longmont",      country: "US" },
        openMembership: true,
    },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

async function upsertDoc(
    ref:   DocumentReference,
    data:  Record<string, unknown>,
    label: string,
): Promise<UpsertResult> {
    if (DRY_RUN) {
        console.log(`  [dry-run] would write ${label}`);
        console.log("  ", JSON.stringify(data, null, 2).replace(/\n/g, "\n   "));
        return "dry-run";
    }

    const snap = await ref.get();
    if (snap.exists && !FORCE) {
        console.log(`  ⏭  skipped  ${label}  (already exists — use --force to overwrite)`);
        return "skipped";
    }

    await ref.set(data, { merge: FORCE });
    return snap.exists ? "updated" : "created";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // ── 2.1 Federations ──────────────────────────────────────────────────────────
    console.log("\n📁  Writing federations…");
    for (const fed of FEDERATIONS) {
        const { id, ...data } = fed;
        const ref = db.doc(`federations/${id}`);
        try {
            const result = await upsertDoc(ref, { id, ...data }, `federations/${id}`);
            if (result === "created" || result === "updated") {
                console.log(`  ✅  ${result}  federations/${id}`);
                created++;
            } else if (result === "skipped") {
                skipped++;
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`  ❌  federations/${id}:`, msg);
            errors.push(`federations/${id}: ${msg}`);
        }
    }

    // ── 2.3 Clubs ────────────────────────────────────────────────────────────────
    console.log("\n🏛   Writing clubs…");
    for (const club of CLUBS) {
        const { id, ...rest } = club;
        const doc: ClubDoc = {
            id,
            ...rest,
            adminUids:   [],
            memberCount: 0,
            rowerCount:  0,
            coachCount:  0,
            status:      "active",
            createdAt:   NOW,
            updatedAt:   NOW,
        };

        const ref = db.doc(`clubs/${id}`);
        try {
            const result = await upsertDoc(ref, doc as unknown as Record<string, unknown>, `clubs/${id}`);
            if (result === "created" || result === "updated") {
                console.log(`  ✅  ${result}  clubs/${id}  (${doc.name})`);
                created++;
            } else if (result === "skipped") {
                skipped++;
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`  ❌  clubs/${id}:`, msg);
            errors.push(`clubs/${id}: ${msg}`);
        }
    }

    // ── 2.4 ClubPrivateConfig ────────────────────────────────────────────────────
    console.log("\n🔒  Writing ClubPrivateConfig docs…");
    for (const club of CLUBS) {
        const configRef = db.doc(`clubs/${club.id}/private/config`);
        const configData: ClubPrivateConfig = {
            inviteCodeHashes: [],
            updatedAt:        NOW,
        };
        try {
            const result = await upsertDoc(
                configRef,
                configData as unknown as Record<string, unknown>,
                `clubs/${club.id}/private/config`,
            );
            if (result === "created" || result === "updated") {
                console.log(`  ✅  ${result}  clubs/${club.id}/private/config`);
                created++;
            } else if (result === "skipped") {
                skipped++;
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`  ❌  clubs/${club.id}/private/config:`, msg);
            errors.push(`clubs/${club.id}/private/config: ${msg}`);
        }
    }

    // ── Summary ──────────────────────────────────────────────────────────────────
    console.log("\n─────────────────────────────────────────");
    if (DRY_RUN) {
        console.log("✅  Dry run complete — no writes performed.");
        console.log(
            `   Would write: ${FEDERATIONS.length} federations, ` +
            `${CLUBS.length} clubs, ${CLUBS.length} private/config docs`,
        );
    } else {
        console.log(`✅  Done.  created/updated: ${created}  skipped: ${skipped}  errors: ${errors.length}`);
        if (errors.length) {
            console.log("\n❌  Errors:");
            errors.forEach(e => console.log("  ", e));
            process.exit(1);
        }
    }
}

main().catch(err => {
    console.error("Fatal:", err);
    process.exit(1);
});