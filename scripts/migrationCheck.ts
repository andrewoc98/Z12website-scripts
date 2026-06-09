// scripts/auditClubStrings.ts
// Run with: npx ts-node scripts/auditClubStrings.ts

import * as admin from "firebase-admin";
import * as serviceAccount from "./z12-website-prod-firebase-adminsdk-fbsvc-adef5a1fdd.json"; // your downloaded key

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

async function auditClubs() {
    const clubCounts: Record<string, { rowerCount: number; coachCount: number; uids: string[] }> = {};

    let lastDoc: admin.firestore.DocumentSnapshot | null = null;
    let totalUsers = 0;

    while (true) {
        let q: admin.firestore.Query = db.collection("users").limit(200);
        if (lastDoc) q = q.startAfter(lastDoc);

        const snap = await q.get();
        if (snap.empty) break;

        for (const doc of snap.docs) {
            totalUsers++;
            const data = doc.data();
            const uid = doc.id;

            const rowerClub = data.roles?.rower?.club;
            const coachClub = data.roles?.coach?.club;

            if (typeof rowerClub === "string" && rowerClub.trim()) {
                const key = rowerClub.trim();
                if (!clubCounts[key]) clubCounts[key] = { rowerCount: 0, coachCount: 0, uids: [] };
                clubCounts[key].rowerCount++;
                clubCounts[key].uids.push(uid);
            }

            if (typeof coachClub === "string" && coachClub.trim()) {
                const key = coachClub.trim();
                if (!clubCounts[key]) clubCounts[key] = { rowerCount: 0, coachCount: 0, uids: [] };
                clubCounts[key].coachCount++;
                if (!clubCounts[key].uids.includes(uid)) clubCounts[key].uids.push(uid);
            }
        }

        lastDoc = snap.docs[snap.docs.length - 1];
        if (snap.size < 200) break;
    }

    console.log(`\nTotal users scanned: ${totalUsers}`);
    console.log(`Unique club strings found: ${Object.keys(clubCounts).length}\n`);
    console.log("=".repeat(60));

    // Sort by total member count descending
    const sorted = Object.entries(clubCounts).sort(
        ([, a], [, b]) => (b.rowerCount + b.coachCount) - (a.rowerCount + a.coachCount)
    );

    for (const [name, counts] of sorted) {
        console.log(`"${name}"`);
        console.log(`  Rowers: ${counts.rowerCount}  Coaches: ${counts.coachCount}  Total: ${counts.uids.length}`);
    }

    // Also output as JSON skeleton for club-mapping.json
    const mappingSkeleton = sorted.map(([name]) => ({
        rawString: name,
        clubId: "TODO",          // fill in after creating Firestore docs
        name: name,
        shortName: "TODO",
        sport: "rowing",
        federationId: "TODO",    // your Rowing Ireland federation ID
        city: "TODO",
        country: "IE",
        openMembership: true,
    }));

    const fs = await import("fs");
    fs.writeFileSync("club-mapping.skeleton.json", JSON.stringify(mappingSkeleton, null, 2));
    console.log("\n✓ Skeleton written to club-mapping.skeleton.json");
}

auditClubs().catch(console.error);