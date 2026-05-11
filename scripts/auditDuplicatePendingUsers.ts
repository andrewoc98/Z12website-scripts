// scripts/auditDuplicatePendingUsers.ts
// npx ts-node scripts/auditDuplicatePendingUsers.ts

import * as admin from "firebase-admin";
import serviceAccount from "./z12-website-prod-firebase-adminsdk-fbsvc-adef5a1fdd.json";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();
const adminAuth = admin.auth();

async function audit() {
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

    // ── Tally by status across the whole collection ───────────────────────────
    const statusTotals = new Map<string, number>();
    for (const d of snap.docs) {
        const status = d.data().status ?? "unknown";
        statusTotals.set(status, (statusTotals.get(status) ?? 0) + 1);
    }

    // ── Separate clean vs duplicate emails ───────────────────────────────────
    const clean: typeof byEmail      = new Map();
    const duplicates: typeof byEmail = new Map();

    for (const [email, docs] of byEmail.entries()) {
        (docs.length > 1 ? duplicates : clean).set(email, docs);
    }

    // ── For every unique email, check Auth + users collection in parallel ─────
    console.log("Cross-referencing Auth and users collection...\n");

    type EmailProfile = {
        authUid:     string | null;  // null = no Auth account
        userDocUid:  string | null;  // null = no Firestore user doc
        userDocStatus: string | null;
    };

    const profileCache = new Map<string, EmailProfile>();

    await Promise.all(
        [...byEmail.keys()].map(async (email) => {
            // Auth lookup
            let authUid: string | null = null;
            try {
                const userRecord = await adminAuth.getUserByEmail(email);
                authUid = userRecord.uid;
            } catch (e: any) {
                if (e.code !== "auth/user-not-found") {
                    console.warn(`  Auth lookup failed for ${email}: ${e.message}`);
                }
            }

            // Firestore users doc lookup — query by email field since we
            // don't have the uid client-side for pending users
            let userDocUid:    string | null = null;
            let userDocStatus: string | null = null;

            // If we have the Auth uid, fetch directly (fast + cheap)
            if (authUid) {
                const docSnap = await db.collection("users").doc(authUid).get();
                if (docSnap.exists) {
                    userDocUid    = authUid;
                    userDocStatus = docSnap.data()?.status?.isActive !== undefined
                        ? `isActive:${docSnap.data()?.status?.isActive} / isVerified:${docSnap.data()?.status?.isVerified}`
                        : "present (no status field)";
                }
            } else {
                // No Auth uid — fall back to email query
                const userQuery = await db
                    .collection("users")
                    .where("email", "==", email)
                    .limit(1)
                    .get();

                if (!userQuery.empty) {
                    const d       = userQuery.docs[0];
                    userDocUid    = d.id;
                    userDocStatus = d.data()?.status?.isActive !== undefined
                        ? `isActive:${d.data()?.status?.isActive} / isVerified:${d.data()?.status?.isVerified}`
                        : "present (no status field)";
                }
            }

            profileCache.set(email, { authUid, userDocUid, userDocStatus });
        })
    );

    // ── Print collection-wide summary ─────────────────────────────────────────
    const withAuth    = [...profileCache.values()].filter((p) => p.authUid).length;
    const withUserDoc = [...profileCache.values()].filter((p) => p.userDocUid).length;

    console.log("════════════════════════════════════════════════════");
    console.log("  PENDING USERS — AUDIT REPORT");
    console.log("════════════════════════════════════════════════════");
    console.log(`  Total documents        : ${snap.size}`);
    console.log(`  Unique emails          : ${byEmail.size}`);
    console.log(`  Clean (1 doc)          : ${clean.size}`);
    console.log(`  Duplicate emails       : ${duplicates.size}`);
    console.log(`  Duplicate docs         : ${snap.size - byEmail.size}  (excess beyond 1 per email)`);
    console.log("");
    console.log("  Cross-reference (per unique email):");
    console.log(`    Has Firebase Auth account  : ${withAuth}`);
    console.log(`    Has users collection doc   : ${withUserDoc}`);
    console.log(`    No Auth + no user doc      : ${[...profileCache.values()].filter((p) => !p.authUid && !p.userDocUid).length}`);
    console.log("");
    console.log("  Status breakdown (whole collection):");
    for (const [status, count] of [...statusTotals.entries()].sort()) {
        console.log(`    ${status.padEnd(30)} ${count}`);
    }
    console.log("════════════════════════════════════════════════════\n");

    // ── All emails detail (clean + duplicates) ────────────────────────────────
    // Show clean ones first so you can spot unexpected Auth/user doc entries
    console.log("CLEAN EMAILS (1 pending doc each)\n");

    if (clean.size === 0) {
        console.log("  None.\n");
    } else {
        for (const [email, docs] of [...clean.entries()].sort()) {
            const profile = profileCache.get(email)!;
            const d       = docs[0];
            const data    = d.data();

            console.log(`  ${email}`);
            console.log(`    pending doc  : ${d.id}  status: ${data.status ?? "unknown"}  created: ${data.createdAt ?? "—"}`);
            console.log(`    auth account : ${profile.authUid    ?? "✗ none"}`);
            console.log(`    user doc     : ${profile.userDocUid ?? "✗ none"}${profile.userDocStatus ? `  (${profile.userDocStatus})` : ""}`);
            console.log("");
        }
    }

    if (duplicates.size === 0) {
        console.log("════════════════════════════════════════════════════");
        console.log("✓ No duplicate emails found. Collection is clean.");
        console.log("════════════════════════════════════════════════════");
        return;
    }

    // ── Duplicate detail ──────────────────────────────────────────────────────
    console.log("DUPLICATE EMAILS\n");

    let totalExcess = 0;

    for (const [email, docs] of [...duplicates.entries()].sort()) {
        const profile = profileCache.get(email)!;

        // Sort newest → oldest so the "keep" candidate is always first
        const sorted = [...docs].sort(
            (a, b) =>
                new Date(b.data().createdAt ?? 0).getTime() -
                new Date(a.data().createdAt ?? 0).getTime()
        );

        const excess = sorted.length - 1;
        totalExcess += excess;

        console.log(`  ${email}  (${sorted.length} docs — ${excess} excess)`);
        console.log(`    auth account : ${profile.authUid    ?? "✗ none"}`);
        console.log(`    user doc     : ${profile.userDocUid ?? "✗ none"}${profile.userDocStatus ? `  (${profile.userDocStatus})` : ""}`);
        console.log("");

        sorted.forEach((d, i) => {
            const data    = d.data();
            const status  = data.status  ?? "unknown";
            const created = data.createdAt ?? "no createdAt";
            const label   = i === 0 ? "KEEP  " : "DELETE";
            console.log(`    [${label}]  id: ${d.id}  status: ${status.padEnd(28)}  created: ${created}`);
        });

        console.log("");
    }

    console.log("════════════════════════════════════════════════════");
    console.log(`  Total excess docs to delete : ${totalExcess}`);
    console.log("════════════════════════════════════════════════════");
    console.log("\nRun the cleanup script to remove the excess docs.");
}

audit().catch(console.error);