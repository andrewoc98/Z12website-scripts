// scripts/cleanupDuplicatePendingUsers.ts
// npx ts-node scripts/cleanupDuplicatePendingUsers.ts

import * as admin from "firebase-admin";
import serviceAccount from "./z12-website-prod-firebase-adminsdk-fbsvc-adef5a1fdd.json"

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db    = admin.firestore();
const auth  = admin.auth();

// Status priority — higher index wins when choosing which doc to keep
const STATUS_PRIORITY: Record<string, number> = {
    awaiting_parent_consent : 0,
    approved                : 1,
    converted               : 2,
};

function priorityOf(status: string): number {
    return STATUS_PRIORITY[status] ?? -1;
}

async function cleanup() {
    console.log("Fetching all pending users...\n");

    const snap = await db.collection("pendingUsers").get();

    if (snap.empty) {
        console.log("No documents found in pendingUsers collection.");
        return;
    }

    // ── Group by normalised email ─────────────────────────────────────────────
    const byEmail = new Map<string, admin.firestore.QueryDocumentSnapshot[]>();
    for (const d of snap.docs) {
        const email = (d.data().email ?? "").trim().toLowerCase();
        if (!byEmail.has(email)) byEmail.set(email, []);
        byEmail.get(email)!.push(d);
    }

    let totalDeleted  = 0;
    let totalUpgraded = 0;
    let totalSkipped  = 0;

    console.log("════════════════════════════════════════════════════");
    console.log("  CLEANUP RUN");
    console.log("════════════════════════════════════════════════════\n");

    for (const [email, docs] of [...byEmail.entries()].sort()) {

        // ── Single doc — nothing to do ────────────────────────────────────────
        if (docs.length === 1) {
            const status = docs[0].data().status ?? "unknown";

            // Even for single docs, if status is `approved` and a user doc
            // exists, patch it to `converted` so nothing is left half-finished.
            if (status === "approved") {
                const hasUserDoc = await checkUserDocExists(email);
                if (hasUserDoc) {
                    await docs[0].ref.set({ status: "converted" }, { merge: true });
                    console.log(`  [UPGRADE]  ${email}`);
                    console.log(`             ${docs[0].id}  approved → converted (single doc, user doc exists)\n`);
                    totalUpgraded++;
                } else {
                    console.log(`  [SKIP]     ${email}`);
                    console.log(`             ${docs[0].id}  approved but no user doc — leaving untouched\n`);
                    totalSkipped++;
                }
            }
            continue;
        }

        // ── Multiple docs — pick the best one to keep ─────────────────────────
        //
        // Sort by status priority DESC, then by createdAt DESC as tiebreaker.
        // This ensures `converted` always beats `approved` beats
        // `awaiting_parent_consent`, regardless of which is newest.
        const sorted = [...docs].sort((a, b) => {
            const pd = priorityOf(b.data().status) - priorityOf(a.data().status);
            if (pd !== 0) return pd;
            // Same status — keep the newest
            return (
                new Date(b.data().createdAt ?? 0).getTime() -
                new Date(a.data().createdAt ?? 0).getTime()
            );
        });

        const keep   = sorted[0];
        const rest   = sorted.slice(1);
        const keepStatus = keep.data().status ?? "unknown";

        console.log(`  ${email}  (${docs.length} docs)`);

        // ── If the best doc is `approved`, check for a user doc ───────────────
        if (keepStatus === "approved") {
            const hasUserDoc = await checkUserDocExists(email);

            if (!hasUserDoc) {
                // Shouldn't happen given this audit output, but never delete
                // anything if the account may be incomplete
                console.log(`  [SKIP]     all docs — kept doc is approved but no user doc found`);
                console.log(`             Manual review required for ${email}\n`);
                totalSkipped += rest.length;
                continue;
            }

            // Patch the kept doc to `converted`
            await keep.ref.set(
                { status: "converted", updatedAt: new Date().toISOString() },
                { merge: true }
            );
            console.log(`             [KEEP + UPGRADE]  ${keep.id}  approved → converted`);
            totalUpgraded++;
        } else {
            console.log(`             [KEEP]   ${keep.id}  status: ${keepStatus}`);
        }

        // ── Delete the rest ───────────────────────────────────────────────────
        for (const d of rest) {
            await d.ref.delete();
            console.log(`             [DELETE] ${d.id}  status: ${d.data().status ?? "unknown"}  created: ${d.data().createdAt ?? "—"}`);
            totalDeleted++;
        }

        console.log("");
    }

    console.log("════════════════════════════════════════════════════");
    console.log(`  Docs deleted          : ${totalDeleted}`);
    console.log(`  Docs upgraded         : ${totalUpgraded}  (approved → converted)`);
    console.log(`  Emails skipped        : ${totalSkipped}  (manual review needed)`);
    console.log("════════════════════════════════════════════════════");
}

// ── Helper: check whether a users collection doc exists for this email ────────
// Tries Auth uid first (fast path), falls back to email query.
async function checkUserDocExists(email: string): Promise<boolean> {
    try {
        const userRecord = await auth.getUserByEmail(email);
        const docSnap    = await db.collection("users").doc(userRecord.uid).get();
        return docSnap.exists;
    } catch (e: any) {
        if (e.code === "auth/user-not-found") {
            // No Auth account — fall back to email query
            const q = await db
                .collection("users")
                .where("email", "==", email)
                .limit(1)
                .get();
            return !q.empty;
        }
        throw e;
    }
}

cleanup().catch(console.error);