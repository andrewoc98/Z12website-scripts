/**
 * backfillGuardianChildren.mjs
 *
 * Migrates guardian documents from the old single-child shape:
 *   roles.guardian.linkedChildName
 *   roles.guardian.linkedChildPendingId
 *
 * …to the new multi-child array shape:
 *   roles.guardian.linkedChildren: [{ childPendingId, childName, approvedAt, childUid? }]
 *
 * Safe to run multiple times — already-migrated docs are skipped.
 *
 * NOTE: We do NOT filter by primaryRole === "guardian" because primaryRole is
 * not reliably set. Instead we fetch all users and check for the presence of
 * roles.guardian in memory.
 *
 * Prerequisites:
 *   npm install firebase-admin
 *   Place your service account JSON in the same directory as this script.
 *
 * Run:
 *   node backfillGuardianChildren.mjs
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ── Init ──────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, "./z12-website-prod-firebase-adminsdk-fbsvc-adef5a1fdd.json"), "utf-8")
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isGuardian(data) {
    return !!data?.roles?.guardian;
}

function needsMigration(data) {
    const g = data?.roles?.guardian;
    if (!g) return false;
    // Already migrated
    if (Array.isArray(g.linkedChildren)) return false;
    // Has old scalar fields
    return !!(g.linkedChildName || g.linkedChildPendingId);
}

async function commitBatch(batch, count) {
    if (count === 0) return;
    await batch.commit();
    console.log(`    ✔  Committed batch of ${count} writes.`);
}

// ── Pass 1: migrate scalar fields → linkedChildren array ─────────────────────

async function backfill() {
    console.log("🔍  Fetching all user documents…");

    const snapshot = await db.collection("users").get();

    const guardianDocs = snapshot.docs.filter(d => isGuardian(d.data()));

    console.log(`    Total users   : ${snapshot.size}`);
    console.log(`    Has guardian  : ${guardianDocs.length}`);

    let migrated = 0;
    let skipped  = 0;
    let errored  = 0;

    const BATCH_SIZE = 400;
    let batch      = db.batch();
    let batchCount = 0;

    for (const docSnap of guardianDocs) {
        const data = docSnap.data();

        if (!needsMigration(data)) {
            skipped++;
            continue;
        }

        const g = data.roles.guardian;
        const approvedAt = data.createdAt ?? new Date().toISOString();

        const linkedChildren = [
            {
                childPendingId: g.linkedChildPendingId ?? "",
                childName:      g.linkedChildName      ?? "",
                approvedAt,
            },
        ];

        try {
            batch.update(docSnap.ref, {
                "roles.guardian.linkedChildren":       linkedChildren,
                "roles.guardian.linkedChildName":      FieldValue.delete(),
                "roles.guardian.linkedChildPendingId": FieldValue.delete(),
                updatedAt: new Date().toISOString(),
            });

            batchCount++;
            migrated++;

            console.log(
                `  → [${docSnap.id}] "${g.linkedChildName}" (pendingId: ${g.linkedChildPendingId})`
            );

            if (batchCount >= BATCH_SIZE) {
                await commitBatch(batch, batchCount);
                batch      = db.batch();
                batchCount = 0;
            }
        } catch (err) {
            console.error(`  ✗  Failed to queue ${docSnap.id}:`, err);
            errored++;
        }
    }

    await commitBatch(batch, batchCount);

    console.log("\n── Pass 1 complete ───────────────────────────────────────────");
    console.log(`   Migrated : ${migrated}`);
    console.log(`   Skipped  : ${skipped}  (already on new schema)`);
    console.log(`   Errors   : ${errored}`);
}

// ── Pass 2: enrich linkedChildren entries with childUid ───────────────────────
//
// Looks up each child's user doc by pendingId and stamps childUid onto the
// linkedChildren entry. Best-effort — silently skips if not found yet.

async function backfillChildUids() {
    console.log("\n🔍  Enriching linkedChildren with childUid values…");

    const snapshot = await db.collection("users").get();
    const guardianDocs = snapshot.docs.filter(d => isGuardian(d.data()));

    let enriched   = 0;
    const BATCH_SIZE = 400;
    let batch      = db.batch();
    let batchCount = 0;

    for (const guardianSnap of guardianDocs) {
        const data     = guardianSnap.data();
        const children = data?.roles?.guardian?.linkedChildren ?? [];

        if (children.length === 0) continue;

        let changed = false;
        const updated = [];

        for (const child of children) {
            if (child.childUid || !child.childPendingId) {
                updated.push(child);
                continue;
            }

            try {
                // Child docs store the pendingId they were created from.
                // Adjust the field path here if your schema differs.
                const q = await db
                    .collection("users")
                    .where("roles.rower.pendingId", "==", child.childPendingId)
                    .limit(1)
                    .get();

                if (!q.empty) {
                    const childUid = q.docs[0].id;
                    updated.push({ ...child, childUid });
                    changed = true;
                    console.log(
                        `  → [${guardianSnap.id}] "${child.childName}" → uid: ${childUid}`
                    );
                } else {
                    updated.push(child);
                }
            } catch {
                updated.push(child);
            }
        }

        if (changed) {
            batch.update(guardianSnap.ref, {
                "roles.guardian.linkedChildren": updated,
                updatedAt: new Date().toISOString(),
            });
            batchCount++;
            enriched++;

            if (batchCount >= BATCH_SIZE) {
                await commitBatch(batch, batchCount);
                batch      = db.batch();
                batchCount = 0;
            }
        }
    }

    await commitBatch(batch, batchCount);
    console.log(`   Enriched : ${enriched} guardian document(s) with childUid.`);
}

// ── Run ───────────────────────────────────────────────────────────────────────

(async () => {
    try {
        await backfill();
        await backfillChildUids();
        console.log("\n✅  Done.");
        process.exit(0);
    } catch (err) {
        console.error("\n❌  Fatal error:", err);
        process.exit(1);
    }
})();
