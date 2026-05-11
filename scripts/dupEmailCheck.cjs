/**
 * check-duplicate-emails.js
 *
 * Scans your Firestore `users` collection and Firebase Auth for duplicate email
 * addresses, then reports:
 *   - Emails that appear more than once in the `users` collection
 *   - Firestore docs whose email doesn't match the Auth record for that UID
 *   - Firestore docs with no corresponding Auth user (orphaned profiles)
 *
 * Usage:
 *   1. npm install firebase-admin
 *   2. Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path, or
 *      set SERVICE_ACCOUNT_PATH below directly.
 *   3. Set YOUR_PROJECT_ID below.
 *   4. node check-duplicate-emails.js
 *
 * Output: console table + writes results to duplicate-email-report.json
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// ─── Config ───────────────────────────────────────────────────────────────────

const PROJECT_ID = "z12-website-prod"; // ← replace
const USERS_COLLECTION = "users";     // ← your Firestore collection name
const SERVICE_ACCOUNT_PATH = "./z12-website-prod-firebase-adminsdk-fbsvc-adef5a1fdd.json"

// ─── Init ─────────────────────────────────────────────────────────────────────

const appOptions = { projectId: PROJECT_ID };
if (SERVICE_ACCOUNT_PATH) {
    appOptions.credential = admin.credential.cert(require(path.resolve(SERVICE_ACCOUNT_PATH)));
} else {
    appOptions.credential = admin.credential.applicationDefault();
}

admin.initializeApp(appOptions);

const db = admin.firestore();
const authClient = admin.auth();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch all docs from a collection in batches to avoid memory issues on large sets.
 */
async function fetchAllDocs(collectionName) {
    const docs = [];
    let query = db.collection(collectionName).orderBy(admin.firestore.FieldPath.documentId()).limit(500);
    let lastDoc = null;

    while (true) {
        const snapshot = await (lastDoc ? query.startAfter(lastDoc) : query).get();
        if (snapshot.empty) break;
        snapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() }));
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        if (snapshot.size < 500) break;
    }

    return docs;
}

/**
 * Look up a Firebase Auth user by UID, returning null if not found.
 */
async function getAuthUser(uid) {
    try {
        return await authClient.getUser(uid);
    } catch {
        return null;
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\nFetching all documents from "${USERS_COLLECTION}"…\n`);
    const docs = await fetchAllDocs(USERS_COLLECTION);
    console.log(`Found ${docs.length} Firestore user documents.\n`);

    // 1. Build a map of email → [uid, uid, …]
    const emailMap = new Map(); // email (lowercase) → [{ uid, docId, fullName }]

    for (const doc of docs) {
        const rawEmail = (doc.email || "").trim().toLowerCase();
        if (!rawEmail) continue;
        if (!emailMap.has(rawEmail)) emailMap.set(rawEmail, []);
        emailMap.get(rawEmail).push({
            uid: doc.uid || doc.id,
            docId: doc.id,
            fullName: doc.fullName || doc.displayName || "(unknown)",
        });
    }

    // 2. Find duplicates in Firestore
    const duplicates = [];
    for (const [email, entries] of emailMap.entries()) {
        if (entries.length > 1) {
            duplicates.push({ email, entries });
        }
    }

    // 3. Cross-check Auth vs Firestore for every doc
    console.log("Cross-checking Firestore docs against Firebase Auth records…\n");
    const mismatches = [];
    const orphans = [];
    const CONCURRENCY = 10;

    for (let i = 0; i < docs.length; i += CONCURRENCY) {
        const batch = docs.slice(i, i + CONCURRENCY);
        await Promise.all(
            batch.map(async (doc) => {
                const uid = doc.uid || doc.id;
                const authUser = await getAuthUser(uid);

                if (!authUser) {
                    orphans.push({
                        docId: doc.id,
                        uid,
                        email: doc.email || "(none)",
                        fullName: doc.fullName || "(unknown)",
                    });
                    return;
                }

                const authEmail = (authUser.email || "").trim().toLowerCase();
                const firestoreEmail = (doc.email || "").trim().toLowerCase();

                if (authEmail && firestoreEmail && authEmail !== firestoreEmail) {
                    mismatches.push({
                        uid,
                        docId: doc.id,
                        authEmail,
                        firestoreEmail,
                        fullName: doc.fullName || "(unknown)",
                    });
                }
            })
        );

        process.stdout.write(`\rChecked ${Math.min(i + CONCURRENCY, docs.length)} / ${docs.length}`);
    }

    console.log("\n");

    // 4. Report
    console.log("═══════════════════════════════════════════════════");
    console.log("  DUPLICATE EMAIL REPORT");
    console.log("═══════════════════════════════════════════════════\n");

    if (duplicates.length === 0) {
        console.log("✅  No duplicate emails found in Firestore.\n");
    } else {
        console.log(`⚠️  ${duplicates.length} duplicate email(s) found:\n`);
        for (const { email, entries } of duplicates) {
            console.log(`  Email: ${email}`);
            for (const e of entries) {
                console.log(`    UID: ${e.uid}  |  Doc: ${e.docId}  |  Name: ${e.fullName}`);
            }
            console.log();
        }
    }

    if (mismatches.length === 0) {
        console.log("✅  No Auth ↔ Firestore email mismatches found.\n");
    } else {
        console.log(`⚠️  ${mismatches.length} Auth ↔ Firestore email mismatch(es):\n`);
        console.table(mismatches);
        console.log();
    }

    if (orphans.length === 0) {
        console.log("✅  No orphaned Firestore profiles found.\n");
    } else {
        console.log(`⚠️  ${orphans.length} Firestore profile(s) with no Auth record:\n`);
        console.table(orphans);
        console.log();
    }

    // 5. Write JSON report
    const report = {
        generatedAt: new Date().toISOString(),
        totalDocs: docs.length,
        duplicateEmails: duplicates,
        authFirestoreMismatches: mismatches,
        orphanedProfiles: orphans,
    };

    const outPath = path.join(process.cwd(), "duplicate-email-report.json");
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`Full report saved to: ${outPath}\n`);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});