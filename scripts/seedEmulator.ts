/**
 * seed-emulator.ts
 *
 * Populates the Firebase emulator with:
 *   - 2 federations (Rowing Ireland, USRowing)
 *   - 9 clubs (mix of Irish and US, including 1 hidden internal club)
 *   - private config for each club
 *   - 5 admin users (1 platformAdmin, 2 federationAdmins, 2 clubAdmins) with custom claims
 *   - 18 test users (16 rowers + 2 coaches) with realistic clubMemberships
 *   - membership documents for each user
 *   - 1 sample clubCreationRequest (pending)
 *   - 1 sample federationInvite (pending)
 *   - 6 regional series groups (4 Rowing Ireland, 2 USRowing)
 *   - 8 series events forming a Regional → National Series → National Event pathway per federation
 *   - Concept2 Logbook links in three states (linked / mirror-only / none)
 *   - 2 indoor series: one running with 12 stages and real scores, one paid and empty
 *     (indoor racing is seeded ONLY as a series — no standalone erg events)
 *
 * Usage:
 *   1. Make sure emulators are running:
 *        firebase emulators:start
 *
 *   2. Run the script:
 *        npx ts-node --esm scripts/seed-emulator.ts
 *      or if you prefer plain node:
 *        npx tsx scripts/seed-emulator.ts
 *
 * The script is idempotent — re-running it overwrites existing seed data
 * using the same fixed document IDs.
 */

import { initializeApp, App } from "firebase-admin/app";
import { getFirestore, Firestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { clubNameSearchKey } from "./clubNameSearch";

// ── Point the Admin SDK at the local emulator ─────────────────────────────────
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

const app: App = initializeApp({
    projectId: "z12-website", // must match your firebase.json emulator projectId
});

const db: Firestore = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });
const auth = getAuth(app);

const NOW    = new Date().toISOString();
const IN_72H = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

// ─── Federations ──────────────────────────────────────────────────────────────

const FEDERATIONS = [
    {
        id:                      "fed-rowing-ireland",
        name:                    "Rowing Ireland",
        shortName:               "RI",
        sport:                   "rowing",
        slug:                    "rowing-ireland",
        country:                 "IE",
        websiteUrl:              "https://www.rowingireland.ie",
        contactEmail:            "info@rowingireland.ie",
        logoUrl:                 null,
        adminUids:               ["test-fed-admin-001"],
        autoApproveClubRequests: true,
        createdBy:               "test-platform-admin-001",
        status:                  "active",
        createdAt:               NOW,
        updatedAt:               NOW,
    },
    {
        id:                      "fed-usrowing",
        name:                    "USRowing",
        shortName:               "USR",
        sport:                   "rowing",
        slug:                    "usrowing",
        country:                 "US",
        websiteUrl:              "https://www.usrowing.org",
        contactEmail:            "members@usrowing.org",
        logoUrl:                 null,
        adminUids:               ["test-fed-admin-002"],
        autoApproveClubRequests: true,
        createdBy:               "test-platform-admin-001",
        status:                  "active",
        createdAt:               NOW,
        updatedAt:               NOW,
    },
] as const;

// ─── Clubs ────────────────────────────────────────────────────────────────────

const CLUBS = [
    // ── Ireland ──────────────────────────────────────────────────────────────
    {
        id:             "club-neptune",
        name:           "Neptune Rowing Club",
        shortName:      "Neptune RC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        logoUrl:        null,
        websiteUrl:     "https://www.neptunerc.ie",
        contactEmail:   "info@neptunerc.ie",
        location: {
            city:    "Cork",
            county:  "Cork",
            country: "IE",
            lat:     51.8985,
            lng:     -8.4756,
        },
        adminUids:      ["test-club-admin-001"],
        memberCount:    0,
        rowerCount:     0,
        coachCount:     0,
        status:         "active",
        openMembership: true,
        // Series designations this club may pick in the event create wizard.
        // Granted in production by a federationAdmin; seeded here so the host
        // flow for the series events below can be tested without that step.
        // The indoor grant. Absent on every other club, which reads as open water
        // only — it is issued per club by a platform admin in production, and
        // this is the club the seeded indoor series belongs to, so its admins
        // have to be able to create one through the wizard rather than the
        // series existing only because this script wrote it directly.
        allowedEventTypes: ["open_water", "erg"],
        allowedSeriesTypes: ["regional_series", "national_series", "national_event"],
        createdBy:      "test-club-admin-001",
        approvedAt:     NOW,
        approvedBy:     "test-fed-admin-001",
        createdAt:      NOW,
        updatedAt:      NOW,
    },
    {
        id:             "club-comercial",
        name:           "Cork Rowing Club",
        shortName:      "Cork RC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        logoUrl:        null,
        websiteUrl:     null,
        contactEmail:   "secretary@corkrowingclub.ie",
        location: {
            city:    "Cork",
            county:  "Cork",
            country: "IE",
            lat:     51.9001,
            lng:     -8.4672,
        },
        adminUids:      [],
        memberCount:    0,
        rowerCount:     0,
        coachCount:     0,
        status:         "active",
        openMembership: true,
        createdBy:      "test-platform-admin-001",
        approvedAt:     NOW,
        approvedBy:     "test-platform-admin-001",
        createdAt:      NOW,
        updatedAt:      NOW,
    },
    {
        id:             "club-lee-valley",
        name:           "Lee Valley Rowing Club",
        shortName:      "Lee Valley RC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        logoUrl:        null,
        websiteUrl:     null,
        contactEmail:   null,
        location: {
            city:    "Cork",
            county:  "Cork",
            country: "IE",
            lat:     51.9245,
            lng:     -8.5012,
        },
        adminUids:      [],
        memberCount:    0,
        rowerCount:     0,
        coachCount:     0,
        status:         "active",
        openMembership: false, // requires approval — good for testing that flow
        createdBy:      "test-platform-admin-001",
        approvedAt:     NOW,
        approvedBy:     "test-platform-admin-001",
        createdAt:      NOW,
        updatedAt:      NOW,
    },
    {
        id:             "club-dcrc",
        name:           "Dublin City Rowing Club",
        shortName:      "DCRC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        logoUrl:        null,
        websiteUrl:     "https://www.dcrc.ie",
        contactEmail:   "info@dcrc.ie",
        location: {
            city:    "Dublin",
            county:  "Dublin",
            country: "IE",
            lat:     53.3498,
            lng:     -6.2603,
        },
        adminUids:      [],
        memberCount:    0,
        rowerCount:     0,
        coachCount:     0,
        status:         "active",
        openMembership: true,
        createdBy:      "test-platform-admin-001",
        approvedAt:     NOW,
        approvedBy:     "test-platform-admin-001",
        createdAt:      NOW,
        updatedAt:      NOW,
    },
    {
        id:             "club-galway",
        name:           "Galway Rowing Club",
        shortName:      "Galway RC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        logoUrl:        null,
        websiteUrl:     null,
        contactEmail:   null,
        location: {
            city:    "Galway",
            county:  "Galway",
            country: "IE",
            lat:     53.2707,
            lng:     -9.0568,
        },
        adminUids:      [],
        memberCount:    0,
        rowerCount:     0,
        coachCount:     0,
        status:         "active",
        openMembership: true,
        createdBy:      "test-platform-admin-001",
        approvedAt:     NOW,
        approvedBy:     "test-platform-admin-001",
        createdAt:      NOW,
        updatedAt:      NOW,
    },
    // ── Hidden internal club (should appear in federation admin but not public search) ──
    {
        id:             "club-ri-hpc",
        name:           "Rowing Ireland High Performance Centre",
        shortName:      "RI HPC",
        sport:          "rowing",
        federationId:   "fed-rowing-ireland",
        logoUrl:        null,
        websiteUrl:     null,
        contactEmail:   "hpc@rowingireland.ie",
        location: {
            city:    "Cork",
            county:  "Cork",
            country: "IE",
            lat:     51.9033,
            lng:     -8.4731,
        },
        adminUids:      [],
        memberCount:    0,
        rowerCount:     0,
        coachCount:     0,
        status:         "active",
        openMembership: false,
        hidden:         true, // internal — excluded from public club search
        createdBy:      "test-platform-admin-001",
        approvedAt:     NOW,
        approvedBy:     "test-platform-admin-001",
        createdAt:      NOW,
        updatedAt:      NOW,
    },
    // ── United States ─────────────────────────────────────────────────────────
    {
        id:             "club-harvard",
        name:           "Harvard Rowing Club",
        shortName:      "Harvard RC",
        sport:          "rowing",
        federationId:   "fed-usrowing",
        logoUrl:        null,
        websiteUrl:     "https://www.harvardrowingclub.org",
        contactEmail:   "contact@harvardrowingclub.org",
        location: {
            city:    "Cambridge",
            county:  "Massachusetts",
            country: "US",
            lat:     42.3736,
            lng:     -71.1106,
        },
        adminUids:      [],
        memberCount:    0,
        rowerCount:     0,
        coachCount:     0,
        status:         "active",
        openMembership: true,
        createdBy:      "test-platform-admin-001",
        approvedAt:     NOW,
        approvedBy:     "test-platform-admin-001",
        createdAt:      NOW,
        updatedAt:      NOW,
    },
    {
        id:             "club-nyac",
        name:           "New York Athletic Club Rowing",
        shortName:      "NYAC",
        sport:          "rowing",
        federationId:   "fed-usrowing",
        logoUrl:        null,
        websiteUrl:     "https://www.nyac.org",
        contactEmail:   "rowing@nyac.org",
        location: {
            city:    "New York",
            county:  "New York",
            country: "US",
            lat:     40.7648,
            lng:     -73.9808,
        },
        adminUids:      [],
        memberCount:    0,
        rowerCount:     0,
        coachCount:     0,
        status:         "active",
        openMembership: false,
        createdBy:      "test-platform-admin-001",
        approvedAt:     NOW,
        approvedBy:     "test-platform-admin-001",
        createdAt:      NOW,
        updatedAt:      NOW,
    },
    {
        id:             "club-vesper",
        name:           "Vesper Boat Club",
        shortName:      "Vesper BC",
        sport:          "rowing",
        federationId:   "fed-usrowing",
        logoUrl:        null,
        websiteUrl:     "https://www.vesperboatclub.org",
        contactEmail:   "info@vesperboatclub.org",
        location: {
            city:    "Philadelphia",
            county:  "Pennsylvania",
            country: "US",
            lat:     39.9526,
            lng:     -75.1652,
        },
        adminUids:      ["test-club-admin-002"],
        memberCount:    0,
        rowerCount:     0,
        coachCount:     0,
        status:         "active",
        openMembership: true,
        // Series designations this club may pick in the event create wizard.
        // Granted in production by a federationAdmin; seeded here so the USRowing
        // series events below have a host club permitted to create them.
        allowedSeriesTypes: ["regional_series", "national_series", "national_event"],
        createdBy:      "test-club-admin-002",
        approvedAt:     NOW,
        approvedBy:     "test-fed-admin-002",
        createdAt:      NOW,
        updatedAt:      NOW,
    },
] as const;

// ─── Admin users ──────────────────────────────────────────────────────────────
// One platformAdmin, two federationAdmins (one per federation), two clubAdmins.
// Custom claims are set on their Auth tokens to match — used by security rules.
// Passwords are all "Test1234!" for convenience in the emulator.

const ADMIN_USERS = [
    {
        uid:       "test-platform-admin-001",
        email:     "platform.admin@test.com",
        displayName: "Platform Admin",
        fullName:  "Platform Admin",
        adminRole: "platformAdmin",
        gender:    "male",
        dateOfBirth: "1975-06-15",
        createdAt: NOW,
        updatedAt: NOW,
        // Custom claims use `role` key — matches security rules and Cloud Functions
        claims:    { role: "platformAdmin" },
    },
    {
        uid:          "test-fed-admin-001",
        email:        "fed.admin.ri@test.com",
        displayName:  "Fionnuala Hayes",
        fullName:     "Fionnuala Hayes",
        adminRole:    "federationAdmin",
        federationId: "fed-rowing-ireland",
        gender:       "female",
        dateOfBirth:  "1978-03-22",
        createdAt:    NOW,
        updatedAt:    NOW,
        claims:       { role: "federationAdmin", federationId: "fed-rowing-ireland" },
    },
    {
        uid:          "test-fed-admin-002",
        email:        "fed.admin.usr@test.com",
        displayName:  "Mike Thompson",
        fullName:     "Mike Thompson",
        adminRole:    "federationAdmin",
        federationId: "fed-usrowing",
        gender:       "male",
        dateOfBirth:  "1972-11-08",
        createdAt:    NOW,
        updatedAt:    NOW,
        claims:       { role: "federationAdmin", federationId: "fed-usrowing" },
    },
    {
        uid:          "test-club-admin-001",
        email:        "club.admin.neptune@test.com",
        displayName:  "Declan O'Brien",
        fullName:     "Declan O'Brien",
        adminRole:    "clubAdmin",
        clubId:       "club-neptune",
        federationId: "fed-rowing-ireland",
        gender:       "male",
        dateOfBirth:  "1982-09-14",
        createdAt:    NOW,
        updatedAt:    NOW,
        claims:       { role: "clubAdmin", clubId: "club-neptune", federationId: "fed-rowing-ireland" },
    },
    {
        uid:          "test-club-admin-002",
        email:        "club.admin.vesper@test.com",
        displayName:  "Sarah Mitchell",
        fullName:     "Sarah Mitchell",
        adminRole:    "clubAdmin",
        clubId:       "club-vesper",
        federationId: "fed-usrowing",
        gender:       "female",
        dateOfBirth:  "1988-05-27",
        createdAt:    NOW,
        updatedAt:    NOW,
        claims:       { role: "clubAdmin", clubId: "club-vesper", federationId: "fed-usrowing" },
    },
] as const;

// ─── Test users ───────────────────────────────────────────────────────────────
// Passwords are all "Test1234!" for convenience in the emulator.
// Never use these in production.

const TEST_USERS = [
    {
        uid:                    "test-rower-001",
        email:                  "rower.one@test.com",
        displayName:            "Aoife Murphy",
        fullName:               "Aoife Murphy",
        primaryRole:            "rower",
        gender:                 "female",
        dateOfBirth:            "2000-03-15",
        birthYear:              2000,
        ageGroup:               "u23",
        isMinor:                false,
        nationalSelectionVisible: false,
        // Two clubs on purpose: an indoor entry asks which one you are
        // representing, because that is who the prize is posted to, and this is
        // the account most testing is done from.
        clubMemberships: [
            {
                clubId:           "club-neptune",
                clubName:         "Neptune Rowing Club",
                clubShortName:    "Neptune RC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
            {
                // Deliberately in the OTHER federation. An athlete can row for
                // clubs on both sides of the Atlantic, and a federation-only
                // event has to offer only the club that qualifies.
                clubId:           "club-vesper",
                clubName:         "Vesper Boat Club",
                clubShortName:    "Vesper",
                federationId:     "fed-usrowing",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   172,
            wingspanCm: 178,
            weightKg:   68,
        },
        performances: {
            best2000m: 420,
            best500m:  98,
        },
    },
    {
        uid:                    "test-rower-002",
        email:                  "rower.two@test.com",
        displayName:            "Ciarán Walsh",
        fullName:               "Ciarán Walsh",
        primaryRole:            "rower",
        gender:                 "male",
        dateOfBirth:            "1998-07-22",
        birthYear:              1998,
        ageGroup:               "senior",
        isMinor:                false,
        nationalSelectionVisible: true, // opted in — useful for testing federationAdmin selection view
        clubMemberships: [
            {
                clubId:           "club-neptune",
                clubName:         "Neptune Rowing Club",
                clubShortName:    "Neptune RC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
            {
                clubId:           "club-dcrc",
                clubName:         "Dublin City Rowing Club",
                clubShortName:    "DCRC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   188,
            wingspanCm: 195,
            weightKg:   85,
        },
        performances: {
            best2000m: 386,
            best6000m: 1260,
        },
    },
    {
        uid:                    "test-rower-003",
        email:                  "rower.three@test.com",
        displayName:            "Jake Anderson",
        fullName:               "Jake Anderson",
        primaryRole:            "rower",
        gender:                 "male",
        dateOfBirth:            "2002-11-08",
        birthYear:              2002,
        ageGroup:               "u23",
        isMinor:                false,
        nationalSelectionVisible: false,
        clubMemberships: [
            {
                clubId:           "club-vesper",
                clubName:         "Vesper Boat Club",
                clubShortName:    "Vesper BC",
                federationId:     "fed-usrowing",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   183,
            wingspanCm: 189,
            weightKg:   80,
        },
        performances: {
            best2000m: 398,
            best500m:  102,
        },
    },
    {
        uid:         "test-coach-001",
        email:       "coach.one@test.com",
        displayName: "Seán Brennan",
        fullName:    "Seán Brennan",
        primaryRole: "coach",
        gender:      "male",
        dateOfBirth: "1980-04-10",
        birthYear:   1980,
        ageGroup:    "masters",
        isMinor:     false,
        clubMemberships: [
            {
                clubId:           "club-neptune",
                clubName:         "Neptune Rowing Club",
                clubShortName:    "Neptune RC",
                federationId:     "fed-rowing-ireland",
                role:             "coach",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
    },
    {
        uid:         "test-coach-002",
        email:       "coach.two@test.com",
        displayName: "Emily Carter",
        fullName:    "Emily Carter",
        primaryRole: "coach",
        gender:      "female",
        dateOfBirth: "1985-09-30",
        birthYear:   1985,
        ageGroup:    "masters",
        isMinor:     false,
        clubMemberships: [
            {
                clubId:           "club-harvard",
                clubName:         "Harvard Rowing Club",
                clubShortName:    "Harvard RC",
                federationId:     "fed-usrowing",
                role:             "coach",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
            {
                clubId:           "club-vesper",
                clubName:         "Vesper Boat Club",
                clubShortName:    "Vesper BC",
                federationId:     "fed-usrowing",
                role:             "coach",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
    },
    {
        uid:                    "test-rower-004",
        email:                  "rower.four@test.com",
        displayName:            "Niamh Kelly",
        fullName:               "Niamh Kelly",
        primaryRole:            "rower",
        gender:                 "female",
        dateOfBirth:            "2005-01-20",
        birthYear:              2005,
        ageGroup:               "junior",
        isMinor:                false, // just turned 19
        nationalSelectionVisible: false,
        clubMemberships: [
            {
                clubId:           "club-galway",
                clubName:         "Galway Rowing Club",
                clubShortName:    "Galway RC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   165,
            wingspanCm: 168,
            weightKg:   60,
        },
        performances: {
            best2000m: 462,
        },
    },
    // ── Additional rowers for national team selection testing ─────────────────
    {
        uid:                    "test-rower-005",
        email:                  "rower.five@test.com",
        displayName:            "Conor Doyle",
        fullName:               "Conor Doyle",
        primaryRole:            "rower",
        gender:                 "male",
        dateOfBirth:            "1996-04-11",
        birthYear:              1996,
        ageGroup:               "senior",
        isMinor:                false,
        nationalSelectionVisible: true,
        clubMemberships: [
            {
                clubId:           "club-neptune",
                clubName:         "Neptune Rowing Club",
                clubShortName:    "Neptune RC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   192,
            wingspanCm: 199,
            weightKg:   90,
        },
        performances: {
            best2000m: 368,
            best6000m: 1215,
        },
    },
    {
        uid:                    "test-rower-006",
        email:                  "rower.six@test.com",
        displayName:            "Siobhán O'Sullivan",
        fullName:               "Siobhán O'Sullivan",
        primaryRole:            "rower",
        gender:                 "female",
        dateOfBirth:            "1999-08-03",
        birthYear:              1999,
        ageGroup:               "senior",
        isMinor:                false,
        nationalSelectionVisible: true,
        clubMemberships: [
            {
                clubId:           "club-dcrc",
                clubName:         "Dublin City Rowing Club",
                clubShortName:    "DCRC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   174,
            wingspanCm: 180,
            weightKg:   67,
        },
        performances: {
            best2000m: 424,
            best6000m: 1390,
        },
    },
    {
        uid:                    "test-rower-007",
        email:                  "rower.seven@test.com",
        displayName:            "Éamonn Fitzgerald",
        fullName:               "Éamonn Fitzgerald",
        primaryRole:            "rower",
        gender:                 "male",
        dateOfBirth:            "2003-02-17",
        birthYear:              2003,
        ageGroup:               "u23",
        isMinor:                false,
        nationalSelectionVisible: true,
        clubMemberships: [
            {
                clubId:           "club-lee-valley",
                clubName:         "Lee Valley Rowing Club",
                clubShortName:    "Lee Valley RC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   186,
            wingspanCm: 192,
            weightKg:   82,
        },
        performances: {
            best2000m: 392,
            best500m:  100,
        },
    },
    {
        uid:                    "test-rower-008",
        email:                  "rower.eight@test.com",
        displayName:            "Róisín Burke",
        fullName:               "Róisín Burke",
        primaryRole:            "rower",
        gender:                 "female",
        dateOfBirth:            "2002-05-29",
        birthYear:              2002,
        ageGroup:               "u23",
        isMinor:                false,
        nationalSelectionVisible: true,
        clubMemberships: [
            {
                clubId:           "club-comercial",
                clubName:         "Cork Rowing Club",
                clubShortName:    "Cork RC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   170,
            wingspanCm: 175,
            weightKg:   64,
        },
        performances: {
            best2000m: 438,
            best500m:  108,
        },
    },
    {
        uid:                    "test-rower-009",
        email:                  "rower.nine@test.com",
        displayName:            "Patrick Gallagher",
        fullName:               "Patrick Gallagher",
        primaryRole:            "rower",
        gender:                 "male",
        dateOfBirth:            "1997-12-05",
        birthYear:              1997,
        ageGroup:               "senior",
        isMinor:                false,
        nationalSelectionVisible: true,
        clubMemberships: [
            {
                clubId:           "club-galway",
                clubName:         "Galway Rowing Club",
                clubShortName:    "Galway RC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   189,
            wingspanCm: 194,
            weightKg:   87,
        },
        performances: {
            best2000m: 378,
            best6000m: 1245,
        },
    },
    {
        uid:                    "test-rower-010",
        email:                  "rower.ten@test.com",
        displayName:            "Caoimhe Ní Bhriain",
        fullName:               "Caoimhe Ní Bhriain",
        primaryRole:            "rower",
        gender:                 "female",
        dateOfBirth:            "2006-06-14",
        birthYear:              2006,
        ageGroup:               "junior",
        isMinor:                false,
        nationalSelectionVisible: true,
        clubMemberships: [
            {
                clubId:           "club-neptune",
                clubName:         "Neptune Rowing Club",
                clubShortName:    "Neptune RC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   168,
            wingspanCm: 172,
            weightKg:   61,
        },
        performances: {
            best2000m: 453,
            best500m:  111,
        },
    },
    {
        uid:                    "test-rower-011",
        email:                  "rower.eleven@test.com",
        displayName:            "Oisín McCarthy",
        fullName:               "Oisín McCarthy",
        primaryRole:            "rower",
        gender:                 "male",
        dateOfBirth:            "2007-03-28",
        birthYear:              2007,
        ageGroup:               "junior",
        isMinor:                false,
        nationalSelectionVisible: true,
        clubMemberships: [
            {
                clubId:           "club-dcrc",
                clubName:         "Dublin City Rowing Club",
                clubShortName:    "DCRC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   181,
            wingspanCm: 186,
            weightKg:   76,
        },
        performances: {
            best2000m: 412,
            best500m:  103,
        },
    },
    {
        uid:                    "test-rower-012",
        email:                  "rower.twelve@test.com",
        displayName:            "Méabh Connolly",
        fullName:               "Méabh Connolly",
        primaryRole:            "rower",
        gender:                 "female",
        dateOfBirth:            "2001-10-07",
        birthYear:              2001,
        ageGroup:               "senior",
        isMinor:                false,
        nationalSelectionVisible: true,
        clubMemberships: [
            {
                clubId:           "club-lee-valley",
                clubName:         "Lee Valley Rowing Club",
                clubShortName:    "Lee Valley RC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   176,
            wingspanCm: 182,
            weightKg:   70,
        },
        performances: {
            best2000m: 431,
            best6000m: 1415,
        },
    },
    {
        uid:                    "test-rower-013",
        email:                  "rower.thirteen@test.com",
        displayName:            "Daithí Ó'Murchú",
        fullName:               "Daithí Ó'Murchú",
        primaryRole:            "rower",
        gender:                 "male",
        dateOfBirth:            "1984-09-19",
        birthYear:              1984,
        ageGroup:               "masters",
        isMinor:                false,
        nationalSelectionVisible: true,
        clubMemberships: [
            {
                clubId:           "club-comercial",
                clubName:         "Cork Rowing Club",
                clubShortName:    "Cork RC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   184,
            wingspanCm: 190,
            weightKg:   84,
        },
        performances: {
            best2000m: 403,
            best6000m: 1330,
        },
    },
    {
        uid:                    "test-rower-014",
        email:                  "rower.fourteen@test.com",
        displayName:            "Deirdre Sheehan",
        fullName:               "Deirdre Sheehan",
        primaryRole:            "rower",
        gender:                 "female",
        dateOfBirth:            "2000-07-31",
        birthYear:              2000,
        ageGroup:               "senior",
        isMinor:                false,
        nationalSelectionVisible: true,
        clubMemberships: [
            {
                clubId:           "club-neptune",
                clubName:         "Neptune Rowing Club",
                clubShortName:    "Neptune RC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   172,
            wingspanCm: 177,
            weightKg:   66,
        },
        performances: {
            best2000m: 427,
            best500m:  106,
        },
    },
    {
        uid:                    "test-rower-015",
        email:                  "rower.fifteen@test.com",
        displayName:            "Tomás Hennessy",
        fullName:               "Tomás Hennessy",
        primaryRole:            "rower",
        gender:                 "male",
        dateOfBirth:            "1998-01-25",
        birthYear:              1998,
        ageGroup:               "senior",
        isMinor:                false,
        nationalSelectionVisible: false, // opted out — should not appear in federation selection view
        clubMemberships: [
            {
                clubId:           "club-dcrc",
                clubName:         "Dublin City Rowing Club",
                clubShortName:    "DCRC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   187,
            wingspanCm: 193,
            weightKg:   86,
        },
        performances: {
            best2000m: 382,
            best6000m: 1258,
        },
    },
    {
        uid:                    "test-rower-016",
        email:                  "rower.sixteen@test.com",
        displayName:            "Ailbhe Nolan",
        fullName:               "Ailbhe Nolan",
        primaryRole:            "rower",
        gender:                 "female",
        dateOfBirth:            "2004-11-12",
        birthYear:              2004,
        ageGroup:               "u23",
        isMinor:                false,
        nationalSelectionVisible: true,
        clubMemberships: [
            {
                clubId:           "club-galway",
                clubName:         "Galway Rowing Club",
                clubShortName:    "Galway RC",
                federationId:     "fed-rowing-ireland",
                role:             "rower",
                membershipStatus: "active",
                joinedAt:         NOW,
            },
        ],
        stats: {
            heightCm:   169,
            wingspanCm: 174,
            weightKg:   63,
        },
        performances: {
            best2000m: 443,
            best500m:  109,
        },
    },
] as const;

// ─── Timing users ─────────────────────────────────────────────────────────────
// Host users (race organisers) and timing admins scoped to them.
// These are specific to the Z12 Challenge race-timing system, separate from
// the federation/club admin roles above.
// Passwords are all "Test1234!" for convenience in the emulator.

const CLUB_ADMIN_USERS = [
    {
        uid:          "seed-host-001",
        email:        "host@seed.ie",
        displayName:  "Seed Host",
        fullName:     "Seed Host",
        gender:       "unknown",
        dateOfBirth:  "1990-01-01",
        clubId:       "club-neptune",
        federationId: "fed-rowing-ireland",
    },
    {
        uid:          "seed-host-002",
        email:        "host2@seed.ie",
        displayName:  "Seed Host Two",
        fullName:     "Seed Host Two",
        gender:       "female",
        dateOfBirth:  "1985-07-20",
        clubId:       "club-lee-valley",
        federationId: "fed-rowing-ireland",
    },
] as const;

const TIMING_ADMINS = [
    {
        uid:         "seed-timer-001",
        email:       "timer1@seed.ie",
        displayName: "Timer One",
        fullName:    "Timer One",
        gender:      "unknown",
        dateOfBirth: "1992-05-15",
        mobile:      "+353871110001",
        hostIds:     ["seed-host-001"],
    },
    {
        uid:         "seed-timer-002",
        email:       "timer2@seed.ie",
        displayName: "Timer Two",
        fullName:    "Timer Two",
        gender:      "unknown",
        dateOfBirth: "1988-11-22",
        mobile:      "+353871110002",
        hostIds:     ["seed-host-001"],
    },
    {
        uid:         "seed-timer-003",
        email:       "timer3@seed.ie",
        displayName: "Timer Three",
        fullName:    "Timer Three",
        gender:      "unknown",
        dateOfBirth: "1995-03-08",
        mobile:      "+353871110003",
        hostIds:     ["seed-host-001"],
    },
    {
        uid:         "seed-timer-004",
        email:       "timer4@seed.ie",
        displayName: "Timer Four",
        fullName:    "Timer Four",
        gender:      "unknown",
        dateOfBirth: "1991-09-14",
        mobile:      "+353871110004",
        hostIds:     ["seed-host-002"],
    },
] as const;

const TIMING_ROWER = {
    uid:         "seed-rower-001",
    email:       "rower@seed.ie",
    displayName: "Seed Rower",
    fullName:    "Seed Rower",
    gender:      "male",
    dateOfBirth: "2000-03-10",
} as const;

const TIMING_EVENTS = [
    {
        id:                 "seed-event-001",
        name:               "Z12 Spring League — Heat 1",
        location:           "National Rowing Centre, Cork",
        description:        "Z12 Challenge spring time trial — 2000m single sculls.",
        lengthMeters:       2000,
        status:             "running",
        clubId:             "club-neptune",
        hostId:             "seed-host-001",
        createdByUid:       "seed-host-001",
        createdByName:      "Seed Host",
        categories: [
            { id: "senior-men",   name: "Men • Senior Open • 1x"   },
            { id: "senior-women", name: "Women • Senior Open • 1x" },
        ],
        resultsPublishMode: "live",
        bowsAssigned:       false,
    },
] as const;

// ─── Mock race performance data ───────────────────────────────────────────────
// Finished events with boats for test-rower-001 (Aoife Murphy) so the profile
// Race History section has real data to render.
// startedAt / finishedAt are plain Unix-ms numbers (not Timestamps) — matches
// what the timing system writes and what useUserResults expects.

const T = Date.now();
const MONTHS = (n: number) => n * 30 * 24 * 3600 * 1000;

// Base start timestamps, spread across the last year
const BASE = {
    ev2: T - MONTHS(9),   // ~9 months ago
    ev3: T - MONTHS(6),   // ~6 months ago
    ev4: T - MONTHS(3),   // ~3 months ago
    ev5: T - MONTHS(1),   // ~1 month ago
};

// Each tuple: [boatId, rowerUids, elapsedMs]
// test-rower-001 is Aoife Murphy — women's senior open
type BoatSpec = { id: string; rowerUids: string[]; elapsedMs: number };

const MOCK_EVENTS: Array<{
    id: string; name: string; lengthMeters: number;
    base: number; categoryId: string; categoryName: string; boats: BoatSpec[];
}> = [
    {
        id:           "seed-event-002",
        name:         "Z12 Autumn League 2024",
        lengthMeters: 2000,
        base:         BASE.ev2,
        categoryId:   "senior-women",
        categoryName: "Women • Senior Open • 1x",
        boats: [
            { id: "se002-b1", rowerUids: ["test-rower-006"],   elapsedMs: 425_000 }, // 1st
            { id: "se002-b2", rowerUids: ["test-rower-008"],   elapsedMs: 428_000 }, // 2nd
            { id: "se002-b3", rowerUids: ["test-rower-001"],   elapsedMs: 435_000 }, // 3rd ← Aoife
            { id: "se002-b4", rowerUids: ["test-rower-012"],   elapsedMs: 440_000 },
            { id: "se002-b5", rowerUids: ["test-rower-014"],   elapsedMs: 448_000 },
            { id: "se002-b6", rowerUids: ["other-rower-a"],    elapsedMs: 455_000 },
            { id: "se002-b7", rowerUids: ["other-rower-b"],    elapsedMs: 462_000 },
        ],
    },
    {
        id:           "seed-event-003",
        name:         "Cork City Head 2024",
        lengthMeters: 2000,
        base:         BASE.ev3,
        categoryId:   "senior-women",
        categoryName: "Women • Senior Open • 1x",
        boats: [
            { id: "se003-b1", rowerUids: ["test-rower-006"],   elapsedMs: 422_000 }, // 1st
            { id: "se003-b2", rowerUids: ["test-rower-008"],   elapsedMs: 427_000 }, // 2nd
            { id: "se003-b3", rowerUids: ["other-rower-c"],    elapsedMs: 429_000 }, // 3rd
            { id: "se003-b4", rowerUids: ["test-rower-014"],   elapsedMs: 430_000 }, // 4th
            { id: "se003-b5", rowerUids: ["test-rower-001"],   elapsedMs: 432_000 }, // 5th ← Aoife
            { id: "se003-b6", rowerUids: ["test-rower-012"],   elapsedMs: 438_000 },
            { id: "se003-b7", rowerUids: ["other-rower-d"],    elapsedMs: 445_000 },
            { id: "se003-b8", rowerUids: ["other-rower-e"],    elapsedMs: 458_000 },
        ],
    },
    {
        id:           "seed-event-004",
        name:         "Z12 Spring Challenge 2025",
        lengthMeters: 2000,
        base:         BASE.ev4,
        categoryId:   "senior-women",
        categoryName: "Women • Senior Open • 1x",
        boats: [
            { id: "se004-b1", rowerUids: ["test-rower-006"],   elapsedMs: 423_000 }, // 1st
            { id: "se004-b2", rowerUids: ["test-rower-001"],   elapsedMs: 425_000 }, // 2nd ← Aoife
            { id: "se004-b3", rowerUids: ["test-rower-014"],   elapsedMs: 430_000 },
            { id: "se004-b4", rowerUids: ["other-rower-c"],    elapsedMs: 437_000 },
            { id: "se004-b5", rowerUids: ["test-rower-012"],   elapsedMs: 443_000 },
            { id: "se004-b6", rowerUids: ["other-rower-b"],    elapsedMs: 451_000 },
        ],
    },
    {
        id:           "seed-event-005",
        name:         "Lee Valley Regatta 2025",
        lengthMeters: 2000,
        base:         BASE.ev5,
        categoryId:   "senior-women",
        categoryName: "Women • Senior Open • 1x",
        boats: [
            { id: "se005-b1", rowerUids: ["test-rower-001"],   elapsedMs: 420_000 }, // 1st ← Aoife
            { id: "se005-b2", rowerUids: ["test-rower-008"],   elapsedMs: 425_000 },
            { id: "se005-b3", rowerUids: ["test-rower-014"],   elapsedMs: 428_000 },
            { id: "se005-b4", rowerUids: ["other-rower-a"],    elapsedMs: 435_000 },
            { id: "se005-b5", rowerUids: ["other-rower-f"],    elapsedMs: 442_000 },
        ],
    },
];

async function seedMockPerformanceData() {
    console.log("\n── Mock race performance data ───────────────────────");

    const now = new Date();

    for (const ev of MOCK_EVENTS) {
        // Write the event document
        await db.doc(`events/${ev.id}`).set({
            id:                 ev.id,
            name:               ev.name,
            location:           "National Rowing Centre, Cork",
            description:        `${ev.name} — 2000m single sculls.`,
            lengthMeters:       ev.lengthMeters,
            status:             "finished",
            clubId:             "club-neptune",
            hostId:             "seed-host-001",
            createdByUid:       "seed-host-001",
            createdByName:      "Seed Host",
            categories: [
                { id: ev.categoryId, name: ev.categoryName },
            ],
            resultsPublishMode: "live",
            bowsAssigned:       true,
            startAt:            Timestamp.fromMillis(ev.base),
            endAt:              Timestamp.fromMillis(ev.base + 4 * 3_600_000),
            closeAt:            Timestamp.fromMillis(ev.base - 7 * 86_400_000),
            createdAt:          Timestamp.fromDate(now),
            updatedAt:          Timestamp.fromDate(now),
            // Lee Valley Regatta 2025 is the payment verification test event
            ...(ev.id === "seed-event-005" && { verificationStatus: "pending" }),
        });

        // Write each boat with plain Unix-ms timestamps (what the timing system uses)
        for (let i = 0; i < ev.boats.length; i++) {
            const b = ev.boats[i];
            const startedAt  = ev.base;
            const finishedAt = ev.base + b.elapsedMs;

            await db.doc(`events/${ev.id}/boats/${b.id}`).set({
                id:           b.id,
                eventId:      ev.id,
                bowNumber:    i + 1,
                boatSize:     1,
                category:     ev.categoryId,
                categoryId:   ev.categoryId,
                categoryName: ev.categoryName,
                clubName:     "Neptune Rowing Club",
                rowerUids:    b.rowerUids,
                status:       "finished",
                activeRunId:  null,
                startedAt,
                finishedAt,
                elapsedMs:    b.elapsedMs,
                adjustmentMs: 0,
                inviteCode:   null,
                invitedEmails: [],
                createdAt:    Timestamp.fromDate(now),
                updatedAt:    Timestamp.fromDate(now),
            });

            // Seed released payments for test rowers in completed events (002–004).
            // Excludes seed-event-005 which has its own held-payment block below.
            if (ev.id !== "seed-event-005") {
                const testRowerUids = b.rowerUids.filter((uid: string) => uid.startsWith("test-"));
                for (const payerId of testRowerUids) {
                    const { eventFeeCents, processingFeeCents, totalChargedCents } = calcFeeBreakdown(3000);
                    await db.doc(`payments/pay-${b.id}-${payerId}`).set({
                        id:                    `pay-${b.id}-${payerId}`,
                        eventId:               ev.id,
                        boatId:                b.id,
                        payerId,
                        hostId:                "seed-host-001",
                        stripePaymentIntentId: `pi_test_${b.id}`,
                        eventFeeCents,
                        processingFeeCents,
                        totalChargedCents,
                        status:                "released",
                        createdAt:             Timestamp.fromMillis(ev.base),
                    });
                }
            }
        }

        // Seed held payments for Lee Valley Regatta 2025 so it appears in Payment Verification
        if (ev.id === "seed-event-005") {
            const FEE_CENTS = 3000; // €30 entry fee
            const leeValleyPayments = [
                { id: "pay-lv-001", boatId: "se005-b1", payerId: "test-rower-001" }, // Aoife Murphy
                { id: "pay-lv-002", boatId: "se005-b2", payerId: "test-rower-008" }, // Róisín Burke
                { id: "pay-lv-003", boatId: "se005-b3", payerId: "test-rower-014" }, // Deirdre Sheehan
            ];
            for (const p of leeValleyPayments) {
                const { eventFeeCents, processingFeeCents, totalChargedCents } = calcFeeBreakdown(FEE_CENTS);
                await db.doc(`payments/${p.id}`).set({
                    id:                    p.id,
                    eventId:               ev.id,
                    boatId:                p.boatId,
                    payerId:               p.payerId,
                    hostId:                "seed-host-001",
                    stripePaymentIntentId: `pi_test_lv_${p.id}`,
                    eventFeeCents,
                    processingFeeCents,
                    totalChargedCents,
                    status:                "held",
                    createdAt:             Timestamp.fromDate(now),
                });
            }
        }

        const aofieBoat = ev.boats.find(b => b.rowerUids.includes("test-rower-001"));
        const place     = ev.boats
            .slice()
            .sort((a, b) => a.elapsedMs - b.elapsedMs)
            .findIndex(b => b.id === aofieBoat?.id) + 1;

        const testBoatCount = ev.id !== "seed-event-005"
            ? ev.boats.filter((b: BoatSpec) => b.rowerUids.some((uid: string) => uid.startsWith("test-"))).length
            : 3;
        const paymentNote = ev.id === "seed-event-005"
            ? ` | ${testBoatCount} held payments (verificationStatus: pending)`
            : ` | ${testBoatCount} released payments`;
        console.log(`  ✓ ${ev.name} — ${ev.boats.length} boats | Aoife Murphy: ${place}/${ev.boats.length}${paymentNote}`);
    }
}

// ─── Coach assignments ────────────────────────────────────────────────────────
// Mirrors what the Cloud Function would write after both parties confirm.
// Each entry writes:
//   users/{coachId}/athleteRoster/{id}   — read by useAthleteRoster
//   users/{rowerId}/coachAssignments/{id} — read by useCoachAssignments

const COACH_ASSIGNMENTS = [
    // test-coach-001 (Seán Brennan, Neptune RC) coaches 5 Neptune rowers
    {
        id:               "assign_c001_r001",
        coachId:          "test-coach-001",
        coachDisplayName: "Seán Brennan",
        rowerId:          "test-rower-001",
        rowerDisplayName: "Aoife Murphy",
        clubId:           "club-neptune",
        clubName:         "Neptune Rowing Club",
        roles:            ["head_coach"],
        status:           "active",
    },
    {
        id:               "assign_c001_r005",
        coachId:          "test-coach-001",
        coachDisplayName: "Seán Brennan",
        rowerId:          "test-rower-005",
        rowerDisplayName: "Conor Doyle",
        clubId:           "club-neptune",
        clubName:         "Neptune Rowing Club",
        roles:            ["head_coach"],
        status:           "active",
    },
    {
        id:               "assign_c001_r014",
        coachId:          "test-coach-001",
        coachDisplayName: "Seán Brennan",
        rowerId:          "test-rower-014",
        rowerDisplayName: "Deirdre Sheehan",
        clubId:           "club-neptune",
        clubName:         "Neptune Rowing Club",
        roles:            ["head_coach"],
        status:           "active",
    },
    {
        id:               "assign_c001_r010",
        coachId:          "test-coach-001",
        coachDisplayName: "Seán Brennan",
        rowerId:          "test-rower-010",
        rowerDisplayName: "Caoimhe Ní Bhriain",
        clubId:           "club-neptune",
        clubName:         "Neptune Rowing Club",
        roles:            ["head_coach"],
        status:           "active",
    },
    {
        id:               "assign_c001_r002",
        coachId:          "test-coach-001",
        coachDisplayName: "Seán Brennan",
        rowerId:          "test-rower-002",
        rowerDisplayName: "Ciarán Walsh",
        clubId:           "club-neptune",
        clubName:         "Neptune Rowing Club",
        roles:            ["head_coach", "assistant_coach"],
        status:           "active",
    },
    // test-coach-002 (Emily Carter, Harvard/Vesper RC) coaches 1 Vesper rower
    {
        id:               "assign_c002_r003",
        coachId:          "test-coach-002",
        coachDisplayName: "Emily Carter",
        rowerId:          "test-rower-003",
        rowerDisplayName: "Jake Anderson",
        clubId:           "club-vesper",
        clubName:         "Vesper Boat Club",
        roles:            ["head_coach"],
        status:           "active",
    },
] as const;

async function seedCoachAssignments() {
    console.log("\n── Coach assignments ────────────────────────────────");

    for (const a of COACH_ASSIGNMENTS) {
        const now = Timestamp.now();

        // athleteRoster entry on the coach doc — read by useAthleteRoster
        await db.doc(`users/${a.coachId}/athleteRoster/${a.id}`).set({
            id:               a.id,
            rowerId:          a.rowerId,
            rowerDisplayName: a.rowerDisplayName,
            assignmentId:     a.id,
            clubId:           a.clubId,
            clubName:         a.clubName,
            roles:            [...a.roles],
            status:           a.status,
            updatedAt:        now,
        });

        // coachAssignments entry on the rower doc — read by useCoachAssignments
        await db.doc(`users/${a.rowerId}/coachAssignments/${a.id}`).set({
            id:               a.id,
            coachId:          a.coachId,
            coachDisplayName: a.coachDisplayName,
            clubId:           a.clubId,
            clubName:         a.clubName,
            roles:            [...a.roles],
            status:           a.status,
            requestedAt:      now,
            confirmedAt:      now,
            archivedAt:       null,
            archivedBy:       null,
        });

        console.log(`  ✓ ${a.coachDisplayName} → ${a.rowerDisplayName} [${a.clubName}] (${a.roles.join(", ")})`);
    }
}

// ─── Club creation requests ───────────────────────────────────────────────────
// One pending request so the federationAdmin dashboard has something to act on.

const CLUB_CREATION_REQUESTS = [
    {
        id:                    "req-tralee-001",
        requestedBy:           "test-rower-002",
        requesterDisplayName:  "Ciarán Walsh",
        requesterEmail:        "rower.two@test.com",
        federationId:          "fed-rowing-ireland",
        proposedClubName:      "Tralee Rowing Club",
        proposedClubLocation:  "Tralee, Kerry",
        proposedClubDescription: "A new rowing club serving the Tralee and North Kerry area.",
        supportingInfo:        "We have 20 committed founding members and secured access to the River Lee at Tralee.",
        status:                "pending",
        submittedAt:           NOW,
        reviewedAt:            null,
        reviewedBy:            null,
        rejectionReason:       null,
        resultingClubId:       null,
    },
] as const;

// ─── Federation invites ───────────────────────────────────────────────────────
// One pending invite so the platformAdmin dashboard has something to display.
// NOTE: token is a placeholder string for emulator use only — not a real SHA-256 hash.

const FEDERATION_INVITES = [
    {
        id:             "invite-ri-pending-001",
        invitedEmail:   "pending.fed.admin@test.com",
        federationId:   "fed-rowing-ireland",
        federationName: "Rowing Ireland",
        invitedBy:      "test-platform-admin-001",
        status:         "pending",
        token:          "emulator-placeholder-token-not-a-real-hash",
        createdAt:      NOW,
        expiresAt:      IN_72H,
        acceptedAt:     null,
        acceptedByUid:  null,
    },
] as const;

// ─── Seed helpers ─────────────────────────────────────────────────────────────

async function seedFederations() {
    console.log("\n── Federations ──────────────────────────────────────");
    for (const fed of FEDERATIONS) {
        const { id, ...data } = fed;
        await db.doc(`federations/${id}`).set({ id, ...data });
        console.log(`  ✓ ${data.name} (slug: ${data.slug})`);
    }
}

async function seedClubs() {
    console.log("\n── Clubs ────────────────────────────────────────────");
    for (const club of CLUBS) {
        const { id, ...data } = club;

        // Public club document
        await db.doc(`clubs/${id}`).set({ id, ...data, nameSearch: clubNameSearchKey(data.name) });

        // Private config subcollection
        await db.doc(`clubs/${id}/private/config`).set({
            inviteCodeHashes: [],
            updatedAt:        NOW,
        });

        console.log(`  ✓ ${data.name} (${data.location.city}, ${data.location.country}) — openMembership: ${data.openMembership}`);
    }
}

async function seedAdminUsers() {
    console.log("\n── Admin users ──────────────────────────────────────");

    for (const u of ADMIN_USERS) {
        // Build roles sub-object to match UserProfile.roles shape.
        // Admin role is determined by roles.* presence — no primaryRole field written.
        const roles: Record<string, unknown> = {};
        if (u.adminRole === "platformAdmin") {
            roles.platformAdmin = {};
        } else if (u.adminRole === "federationAdmin" && "federationId" in u) {
            roles.federationAdmin = { federationId: u.federationId };
        } else if (u.adminRole === "clubAdmin" && "clubId" in u && "federationId" in u) {
            roles.clubAdmin = { clubId: u.clubId, federationId: u.federationId };
        }

        // Build Firestore doc — role determined via roles.* sub-objects, no primaryRole field
        const userDoc: Record<string, unknown> = {
            uid:         u.uid,
            email:       u.email,
            displayName: u.displayName,
            fullName:    u.fullName,
            gender:      u.gender,
            dateOfBirth: u.dateOfBirth,
            roles,
            consent: {
                termsAcceptedAt:   NOW,
                privacyAcceptedAt: NOW,
                givenBy:           "self",
                givenByUid:        u.uid,
                updatedAt:         NOW,
            },
            permissions: {
                shareWithCoaches:      false,
                shareWithUniversities: false,
                shareWithFederations:  false,
            },
            status: {
                isActive:   true,
                isVerified: true,
            },
            hasSeenTour: false,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
        };

        if ("federationId" in u) userDoc.federationId = u.federationId;
        if ("clubId" in u)       userDoc.clubId        = u.clubId;

        await db.doc(`users/${u.uid}`).set(userDoc);

        // Create Firebase Auth account and set custom claims
        try {
            await auth.createUser({
                uid:           u.uid,
                email:         u.email,
                password:      "Test1234!",
                displayName:   u.displayName,
                emailVerified: true,
            });
        } catch (e: any) {
            if (e.code === "auth/uid-already-exists" || e.code === "auth/email-already-exists") {
                await auth.updateUser(u.uid, {
                    email:         u.email,
                    displayName:   u.displayName,
                    emailVerified: true,
                });
            } else {
                throw e;
            }
        }

        await auth.setCustomUserClaims(u.uid, u.claims);

        console.log(`  ✓ ${u.displayName} <${u.email}> [${u.adminRole}] — claims: ${JSON.stringify(u.claims)}`);
    }
}

async function seedUsers() {
    console.log("\n── Users ────────────────────────────────────────────");

    for (const u of TEST_USERS) {
        const isRower = u.primaryRole === "rower";
        const isCoach = u.primaryRole === "coach";

        // Build the full UserProfile document.
        // primaryRole is intentionally omitted — role is determined by roles.* sub-objects.
        const userDoc: Record<string, unknown> = {
            uid:         u.uid,
            email:       u.email,
            displayName: u.displayName,
            fullName:    u.fullName,
            gender:      u.gender,
            dateOfBirth: u.dateOfBirth,
            birthYear:   u.birthYear,
            ageGroup:    u.ageGroup,
            isMinor:     u.isMinor,
            consent: {
                termsAcceptedAt:             NOW,
                privacyAcceptedAt:           NOW,
                performanceTrackingAccepted: isRower,
                dataSharingAccepted:         false,
                givenBy:                     "self",
                givenByUid:                  u.uid,
                updatedAt:                   NOW,
            },
            permissions: {
                shareWithCoaches:      true,
                shareWithUniversities: false,
                shareWithFederations:  false,
            },
            roles: {
                ...(isRower && {
                    rower: {
                        clubMemberships: u.clubMemberships,
                        coachId: u.uid === "test-rower-001" ? "test-coach-001" : undefined,
                        stats:        (u as any).stats        ?? {},
                        performances: (u as any).performances ?? {},
                    },
                }),
                ...(isCoach && {
                    coach: {
                        clubMemberships: u.clubMemberships,
                    },
                }),
            },
            status: {
                isActive:   true,
                isVerified: true,
            },
            hasSeenTour: false,
            createdAt: NOW,
            updatedAt: NOW,
        };

        // nationalSelectionVisible is athlete-only — add when present on the user
        if ("nationalSelectionVisible" in u) {
            userDoc.nationalSelectionVisible = u.nationalSelectionVisible;
        }

        await db.doc(`users/${u.uid}`).set(userDoc);

        // Create Firebase Auth account in the emulator
        try {
            await auth.createUser({
                uid:           u.uid,
                email:         u.email,
                password:      "Test1234!",
                displayName:   u.displayName,
                emailVerified: true,
            });
        } catch (e: any) {
            if (e.code === "auth/uid-already-exists" || e.code === "auth/email-already-exists") {
                await auth.updateUser(u.uid, {
                    email:         u.email,
                    displayName:   u.displayName,
                    emailVerified: true,
                });
            } else {
                throw e;
            }
        }

        console.log(`  ✓ ${u.displayName} <${u.email}> [${u.primaryRole}] — ${u.clubMemberships.length} club(s)`);
    }
}

async function seedMemberships() {
    console.log("\n── Membership documents ─────────────────────────────");

    for (const u of TEST_USERS) {
        for (const membership of u.clubMemberships) {
            const memberDoc = {
                uid:         u.uid,
                clubId:      membership.clubId,
                displayName: u.displayName,
                email:       u.email,
                role:        membership.role,
                status:      "active",
                joinedAt:    NOW,
                updatedAt:   NOW,
            };

            await db
                .doc(`clubs/${membership.clubId}/members/${u.uid}`)
                .set(memberDoc);

            console.log(`  ✓ ${u.displayName} → ${membership.clubName} [${membership.role}]`);
        }
    }
}

async function updateClubCounts() {
    console.log("\n── Updating club member counts ──────────────────────");

    for (const club of CLUBS) {
        const membersSnap = await db
            .collection(`clubs/${club.id}/members`)
            .where("status", "==", "active")
            .get();

        const rowerCount = membersSnap.docs.filter(d => d.data().role === "rower").length;
        const coachCount = membersSnap.docs.filter(d => d.data().role === "coach").length;

        await db.doc(`clubs/${club.id}`).update({
            memberCount: membersSnap.size,
            rowerCount,
            coachCount,
            updatedAt:   NOW,
        });

        if (membersSnap.size > 0) {
            console.log(`  ✓ ${club.name} — ${rowerCount} rower(s), ${coachCount} coach(es)`);
        }
    }
}

async function seedTimingUsers() {
    console.log("\n── Timing users (club admins & timing admins) ────────");

    for (const h of CLUB_ADMIN_USERS) {
        await db.doc(`users/${h.uid}`).set({
            uid:         h.uid,
            email:       h.email,
            displayName: h.displayName,
            fullName:    h.fullName,
            gender:      h.gender,
            dateOfBirth: h.dateOfBirth,
            isMinor:     false,
            consent: {
                termsAcceptedAt:   NOW,
                privacyAcceptedAt: NOW,
                givenBy:           "self",
                givenByUid:        h.uid,
                updatedAt:         NOW,
            },
            permissions: {
                shareWithCoaches:      false,
                shareWithUniversities: false,
                shareWithFederations:  false,
            },
            roles: {
                clubAdmin: { clubId: h.clubId, federationId: h.federationId },
            },
            status:      { isActive: true, isVerified: true },
            hasSeenTour: false,
            createdAt:   NOW,
            updatedAt:   NOW,
        });

        try {
            await auth.createUser({
                uid:           h.uid,
                email:         h.email,
                password:      "Test1234!",
                displayName:   h.displayName,
                emailVerified: true,
            });
        } catch (e: any) {
            if (e.code === "auth/uid-already-exists" || e.code === "auth/email-already-exists") {
                await auth.updateUser(h.uid, { email: h.email, displayName: h.displayName, emailVerified: true });
            } else {
                throw e;
            }
        }

        await auth.setCustomUserClaims(h.uid, {
            role:         "clubAdmin",
            clubId:       h.clubId,
            federationId: h.federationId,
        });

        console.log(`  ✓ ${h.displayName} <${h.email}> [clubAdmin] — ${h.clubId}`);
    }

    for (const t of TIMING_ADMINS) {
        await db.doc(`users/${t.uid}`).set({
            uid:         t.uid,
            email:       t.email,
            displayName: t.displayName,
            fullName:    t.fullName,
            gender:      t.gender,
            dateOfBirth: t.dateOfBirth,
            isMinor:     false,
            mobile:      t.mobile,
            consent: {
                termsAcceptedAt:   NOW,
                privacyAcceptedAt: NOW,
                givenBy:           "self",
                givenByUid:        t.uid,
                updatedAt:         NOW,
            },
            permissions: {
                shareWithCoaches:      false,
                shareWithUniversities: false,
                shareWithFederations:  false,
            },
            roles: {
                admin: {
                    name:    t.displayName,
                    email:   t.email,
                    hostIds: [...t.hostIds],
                },
            },
            status:      { isActive: true, isVerified: true },
            hasSeenTour: false,
            createdAt:   NOW,
            updatedAt:   NOW,
        });

        try {
            await auth.createUser({
                uid:           t.uid,
                email:         t.email,
                password:      "Test1234!",
                displayName:   t.displayName,
                emailVerified: true,
            });
        } catch (e: any) {
            if (e.code === "auth/uid-already-exists" || e.code === "auth/email-already-exists") {
                await auth.updateUser(t.uid, { email: t.email, displayName: t.displayName, emailVerified: true });
            } else {
                throw e;
            }
        }

        console.log(`  ✓ ${t.displayName} <${t.email}> [timing admin] → hostIds: [${t.hostIds.join(", ")}]`);
    }

    // Seed rower scoped to the Z12 timing context
    const r = TIMING_ROWER;
    await db.doc(`users/${r.uid}`).set({
        uid:         r.uid,
        email:       r.email,
        displayName: r.displayName,
        fullName:    r.fullName,
        primaryRole: "rower",
        gender:      r.gender,
        dateOfBirth: r.dateOfBirth,
        isMinor:     false,
        consent: {
            termsAcceptedAt:             NOW,
            privacyAcceptedAt:           NOW,
            performanceTrackingAccepted: true,
            dataSharingAccepted:         false,
            givenBy:                     "self",
            givenByUid:                  r.uid,
            updatedAt:                   NOW,
        },
        permissions: {
            shareWithCoaches:      false,
            shareWithUniversities: false,
            shareWithFederations:  false,
        },
        roles: {
            rower: { clubMemberships: [], stats: {}, performances: {} },
        },
        status:      { isActive: true, isVerified: true },
        hasSeenTour: false,
        createdAt:   NOW,
        updatedAt:   NOW,
    });

    try {
        await auth.createUser({
            uid:           r.uid,
            email:         r.email,
            password:      "Test1234!",
            displayName:   r.displayName,
            emailVerified: true,
        });
    } catch (e: any) {
        if (e.code === "auth/uid-already-exists" || e.code === "auth/email-already-exists") {
            await auth.updateUser(r.uid, { email: r.email, displayName: r.displayName, emailVerified: true });
        } else {
            throw e;
        }
    }

    console.log(`  ✓ ${r.displayName} <${r.email}> [rower] — hasSeenTour: false`);
}

async function seedTimingEvents() {
    console.log("\n── Timing events ────────────────────────────────────");

    const now   = new Date();
    const start = new Date(now.getTime() - 2  * 3_600_000);   // started 2 h ago
    const end   = new Date(now.getTime() + 22 * 3_600_000);   // ends in 22 h
    const close = new Date(now.getTime() - 7  * 86_400_000);  // closed 7 days ago

    for (const ev of TIMING_EVENTS) {
        const { id, ...data } = ev;
        await db.doc(`events/${id}`).set({
            ...data,
            startAt:   Timestamp.fromDate(start),
            endAt:     Timestamp.fromDate(end),
            closeAt:   Timestamp.fromDate(close),
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
        });
        console.log(`  ✓ ${data.name} [${data.status}] — createdBy: ${data.createdByUid}`);
    }

    // Seed one registered boat on seed-event-001 so the timing page has something to work with
    const boatId = "seed-boat-001";
    await db.doc(`events/seed-event-001/boats/${boatId}`).set({
        id:           boatId,
        eventId:      "seed-event-001",
        bowNumber:    1,
        boatSize:     1,
        category:     "senior-men",
        categoryId:   "senior-men",
        categoryName: "Men • Senior Open • 1x",
        clubName:     "Neptune Rowing Club",
        rowerUids:    [TIMING_ROWER.uid],
        status:       "registered",
        activeRunId:  null,
        startedAt:    null,
        finishedAt:   null,
        elapsedMs:    null,
        adjustmentMs: 0,
        inviteCode:   null,
        invitedEmails: [],
        createdAt:    Timestamp.fromDate(now),
        updatedAt:    Timestamp.fromDate(now),
    });
    console.log(`  ✓ seed-boat-001 — #1 Neptune Rowing Club [registered] → seed-event-001`);
}

async function seedClubCreationRequests() {
    console.log("\n── Club creation requests ───────────────────────────");
    for (const req of CLUB_CREATION_REQUESTS) {
        const { id, ...data } = req;
        await db.doc(`clubCreationRequests/${id}`).set({ id, ...data });
        console.log(`  ✓ "${data.proposedClubName}" by ${data.requesterDisplayName} [${data.status}]`);
    }
}

async function seedFederationInvites() {
    console.log("\n── Federation invites ───────────────────────────────");
    for (const invite of FEDERATION_INVITES) {
        const { id, ...data } = invite;
        await db.doc(`federationInvites/${id}`).set({ id, ...data });
        console.log(`  ✓ ${data.invitedEmail} → ${data.federationName} [${data.status}] expires ${data.expiresAt}`);
    }
}

// ─── Regional Series Groups ───────────────────────────────────────────────────
// Regions under a federation. Each region runs its own Regional Series, which
// feeds its own National Series, which in turn feeds the one federation-wide
// National Event.
//
// Keep in step with the identical section in the sibling seed script.

/**
 * Pinned so a fixture seeded near New Year doesn't land its tiers in two
 * different seasons — findTargetEvent() matches season with an equality filter,
 * so all three tiers of a pathway have to agree. seasonOf() prefers this
 * explicit field over startAt's year.
 */
const SERIES_SEASON = new Date().getUTCFullYear();

/** Keep in step with SERIES_LENGTH_METERS in Z12Website2.0 features/events/types.ts. */
const SERIES_LENGTH_METERS = {
    regional_series: 3000,
    national_series: 3000,
    national_event:  6000,
} as const;

const SERIES_GROUPS = [
    // ── Rowing Ireland ───────────────────────────────────────────────────────
    {
        id:           "group-munster",
        federationId: "fed-rowing-ireland",
        name:         "Munster Regional Series",
        clubIds:      ["club-neptune", "club-comercial", "club-lee-valley"],
        createdAt:    NOW,
        updatedAt:    NOW,
    },
    {
        id:           "group-leinster",
        federationId: "fed-rowing-ireland",
        name:         "Leinster Regional Series",
        clubIds:      ["club-dcrc"],
        createdAt:    NOW,
        updatedAt:    NOW,
    },
    {
        id:           "group-connacht",
        federationId: "fed-rowing-ireland",
        name:         "Connacht Regional Series",
        clubIds:      ["club-galway"],
        createdAt:    NOW,
        updatedAt:    NOW,
    },
    {
        // Deliberately empty — no Ulster club is seeded. Gives the federation
        // admin UI a region-with-no-clubs case to render. club-ri-hpc is left
        // out of every group on purpose too: it is the hidden internal HPC
        // club, not a regional competitor.
        id:           "group-ulster",
        federationId: "fed-rowing-ireland",
        name:         "Ulster Regional Series",
        clubIds:      [] as string[],
        createdAt:    NOW,
        updatedAt:    NOW,
    },
    // ── USRowing ─────────────────────────────────────────────────────────────
    {
        id:           "group-us-northeast",
        federationId: "fed-usrowing",
        name:         "Northeast Regional Series",
        clubIds:      ["club-harvard"],
        createdAt:    NOW,
        updatedAt:    NOW,
    },
    {
        id:           "group-us-mid-atlantic",
        federationId: "fed-usrowing",
        name:         "Mid-Atlantic Regional Series",
        clubIds:      ["club-nyac", "club-vesper"],
        createdAt:    NOW,
        updatedAt:    NOW,
    },
] as const;

async function seedSeriesGroups() {
    console.log("\n── Regional series groups ───────────────────────────");
    for (const g of SERIES_GROUPS) {
        const { id, federationId, ...data } = g;
        await db
            .doc(`federations/${federationId}/seriesGroups/${id}`)
            .set({ id, federationId, ...data });
        console.log(`  ✓ ${data.name} — clubs: [${data.clubIds.join(", ")}]`);
    }

    // Groups are written by id and never overwritten wholesale, so a region that
    // is renamed or split leaves its old document behind — and its clubs then
    // appear in two regions at once, which is exactly the state the qualification
    // scope is meant to rule out. Drop any group under a seeded federation that
    // this fixture no longer defines.
    const seeded = new Set<string>(SERIES_GROUPS.map(g => `${g.federationId}/${g.id}`));
    for (const federationId of new Set(SERIES_GROUPS.map(g => g.federationId))) {
        const existing = await db.collection(`federations/${federationId}/seriesGroups`).get();
        for (const doc of existing.docs) {
            if (seeded.has(`${federationId}/${doc.id}`)) continue;
            await doc.ref.delete();
            console.log(`  ✗ removed stale group ${federationId}/${doc.id}`);
        }
    }
}

// ─── Series Events ────────────────────────────────────────────────────────────
// A full pathway per federation: Regional Series → National Series → National
// Event. Two Irish regions each get their own National Series so the "one
// National Series per region" shape is visible; USRowing gets a single-region
// pathway hosted by Vesper.

async function seedSeriesEvents() {
    console.log("\n── Series events ────────────────────────────────────");

    const now = new Date();

    // Host club + host user per federation. Both clubs carry allowedSeriesTypes
    // so the same events can be recreated through the event create wizard.
    const IE = {
        federationId:  "fed-rowing-ireland",
        clubId:        "club-neptune",
        hostId:        "seed-host-001",
        createdByName: "Seed Host",
        location:      "National Rowing Centre, Cork",
    } as const;

    const US = {
        federationId:  "fed-usrowing",
        clubId:        "club-vesper",
        hostId:        "test-club-admin-002",
        createdByName: "Sarah Mitchell",
        location:      "Schuylkill River, Philadelphia",
    } as const;

    const SERIES_EVENT_DEFS = [
        // ── Rowing Ireland ───────────────────────────────────────────────────
        {
            ...IE,
            id:            "seed-event-regional-001",
            name:          `Munster Regional Series ${SERIES_SEASON}`,
            description:   "First leg of the Munster Regional Series. Top crews qualify for the Munster National Series.",
            seriesType:    "regional_series",
            seriesGroupId: "group-munster",
            daysFromNow:   30,
        },
        {
            ...IE,
            id:            "seed-event-regional-002",
            name:          `Leinster Regional Series ${SERIES_SEASON}`,
            description:   "First leg of the Leinster Regional Series. Top crews qualify for the Leinster National Series.",
            seriesType:    "regional_series",
            seriesGroupId: "group-leinster",
            daysFromNow:   30,
        },
        {
            ...IE,
            id:            "seed-event-national-series-001",
            name:          `Munster National Series ${SERIES_SEASON}`,
            description:   "Munster's National Series round. Entry is by qualification from the Munster Regional Series.",
            seriesType:    "national_series",
            seriesGroupId: "group-munster",
            daysFromNow:   60,
        },
        {
            ...IE,
            id:            "seed-event-national-series-002",
            name:          `Leinster National Series ${SERIES_SEASON}`,
            description:   "Leinster's National Series round. Entry is by qualification from the Leinster Regional Series.",
            seriesType:    "national_series",
            seriesGroupId: "group-leinster",
            daysFromNow:   60,
        },
        {
            ...IE,
            id:            "seed-event-national-001",
            name:          `Rowing Ireland National Championships ${SERIES_SEASON}`,
            description:   "The National Event, fed by every region's National Series. Qualification required.",
            seriesType:    "national_event",
            seriesGroupId: null,
            daysFromNow:   90,
        },
        // ── USRowing ─────────────────────────────────────────────────────────
        {
            ...US,
            id:            "seed-event-us-regional-001",
            name:          `Mid-Atlantic Regional Series ${SERIES_SEASON}`,
            description:   "First leg of the Mid-Atlantic Regional Series. Top crews qualify for the Mid-Atlantic National Series.",
            seriesType:    "regional_series",
            seriesGroupId: "group-us-mid-atlantic",
            daysFromNow:   30,
        },
        {
            ...US,
            id:            "seed-event-us-national-series-001",
            name:          `Mid-Atlantic National Series ${SERIES_SEASON}`,
            description:   "The Mid-Atlantic National Series round. Entry is by qualification from the regional series.",
            seriesType:    "national_series",
            seriesGroupId: "group-us-mid-atlantic",
            daysFromNow:   60,
        },
        {
            ...US,
            id:            "seed-event-us-national-001",
            name:          `USRowing National Championships ${SERIES_SEASON}`,
            description:   "The National Event, fed by every region's National Series. Qualification required.",
            seriesType:    "national_event",
            seriesGroupId: null,
            daysFromNow:   90,
        },
    ] as const;

    for (const ev of SERIES_EVENT_DEFS) {
        const startAt      = new Date(now.getTime() + ev.daysFromNow * 86_400_000);
        const endAt        = new Date(startAt.getTime() + 2 * 86_400_000);
        const closeAt      = new Date(startAt.getTime() - 7 * 86_400_000);
        const lengthMeters = SERIES_LENGTH_METERS[ev.seriesType];

        const doc: Record<string, unknown> = {
            id:                 ev.id,
            name:               ev.name,
            description:        ev.description,
            location:           ev.location,
            lengthMeters,
            seriesType:         ev.seriesType,
            federationId:       ev.federationId,
            // Written explicitly because findTargetEvent() matches season with an
            // equality filter, and a document missing the field never matches
            // one — every qualification this pathway awards would be stranded.
            season:             SERIES_SEASON,
            status:             "open",
            clubId:             ev.clubId,
            hostId:             ev.hostId,
            createdByUid:       ev.hostId,
            createdByName:      ev.createdByName,
            categories: [
                { id: "senior-men",   name: "Men • Senior Open • 1x"   },
                { id: "senior-women", name: "Women • Senior Open • 1x" },
            ],
            resultsPublishMode: "live",
            bowsAssigned:       false,
            startAt:            Timestamp.fromDate(startAt),
            endAt:              Timestamp.fromDate(endAt),
            closeAt:            Timestamp.fromDate(closeAt),
            createdAt:          Timestamp.fromDate(now),
            updatedAt:          Timestamp.fromDate(now),
        };

        // Only a national_event may omit the group — it is the one tier with no
        // region of its own, since every region feeds it. The other two tiers
        // must carry a real group id or hasValidSeriesBinding() in
        // firestore.rules would reject the same document written through the app.
        if (ev.seriesGroupId) doc.seriesGroupId = ev.seriesGroupId;

        await db.doc(`events/${ev.id}`).set(doc);
        console.log(
            `  ✓ ${ev.name} [${ev.seriesType}]` +
            `${ev.seriesGroupId ? ` → ${ev.seriesGroupId}` : ""}` +
            ` — ${lengthMeters}m — opens in ${ev.daysFromNow} days`,
        );
    }
}

// ─── Training Sessions ────────────────────────────────────────────────────────
// coach:   test-coach-001  (Seán Brennan, Neptune RC)
// athletes: test-rower-001 (Aoife Murphy), test-rower-005 (Conor Doyle),
//           test-rower-014 (Deirdre Sheehan), test-rower-010 (Caoimhe Ní Bhriain)

async function seedTrainingSessions() {
    console.log("\n── Training sessions ────────────────────────────────");

    const SESSION_DATE = new Date("2025-09-16T07:00:00");
    const START_TS     = Timestamp.fromDate(SESSION_DATE);

    // ── Completed session: Tuesday 2k / 1k ──────────────────────────────────
    await db.doc("sessions/session_seed_001").set({
        id:                   "session_seed_001",
        coachId:              "test-coach-001",
        sessionType:          "race",
        timingAssistantEmail: null,
        timingAssistantName:  null,
        name:     "Tuesday 2k / 1k",
        date:     START_TS,
        status:   "completed",
        pieces: [
            {
                pieceNumber:     1,
                distanceMeters:  2000,
                boats: [
                    { boatId: "boat_p1_a1", boatClass: "1x", rowerIds: ["test-rower-001"], rowerNames: ["Aoife Murphy"] },
                    { boatId: "boat_p1_a2", boatClass: "1x", rowerIds: ["test-rower-005"], rowerNames: ["Conor Doyle"] },
                    { boatId: "boat_p1_a3", boatClass: "1x", rowerIds: ["test-rower-014"], rowerNames: ["Deirdre Sheehan"] },
                    { boatId: "boat_p1_dnf", boatClass: "1x", rowerIds: ["test-rower-010"], rowerNames: ["Caoimhe Ní Bhriain"] },
                ],
                status:          "completed",
                startTimestamp:  START_TS,
            },
            {
                pieceNumber:     2,
                distanceMeters:  1000,
                boats: [
                    { boatId: "boat_p2_a1", boatClass: "1x", rowerIds: ["test-rower-001"], rowerNames: ["Aoife Murphy"] },
                    { boatId: "boat_p2_a2", boatClass: "1x", rowerIds: ["test-rower-005"], rowerNames: ["Conor Doyle"] },
                    { boatId: "boat_p2_a3", boatClass: "1x", rowerIds: ["test-rower-014"], rowerNames: ["Deirdre Sheehan"] },
                ],
                status:          "completed",
                startTimestamp:  Timestamp.fromDate(new Date("2025-09-16T07:15:00")),
            },
        ],
        createdAt: START_TS,
        updatedAt: START_TS,
    });

    // Piece 1 results (2000m) — Conor wins, Aoife 2nd, Deirdre 3rd, Caoimhe DNF
    const p1Start = new Date("2025-09-16T07:00:00").getTime();
    const p1Results = [
        { id: "result_p1_a2", boatId: "boat_p1_a2", boatClass: "1x", rowerIds: ["test-rower-005"], rowerNames: ["Conor Doyle"],    displayName: "Conor Doyle (1x)",    elapsedMs: 441000, split500mMs: 110250 },
        { id: "result_p1_a1", boatId: "boat_p1_a1", boatClass: "1x", rowerIds: ["test-rower-001"], rowerNames: ["Aoife Murphy"],    displayName: "Aoife Murphy (1x)",   elapsedMs: 449000, split500mMs: 112250 },
        { id: "result_p1_a3", boatId: "boat_p1_a3", boatClass: "1x", rowerIds: ["test-rower-014"], rowerNames: ["Deirdre Sheehan"], displayName: "Deirdre Sheehan (1x)", elapsedMs: 461000, split500mMs: 115250 },
    ];
    for (const r of p1Results) {
        await db.doc(`pieceResults/${r.id}`).set({
            sessionId:      "session_seed_001",
            sessionName:    "Tuesday 2k / 1k",
            coachId:        "test-coach-001",
            pieceNumber:    1,
            distanceMeters: 2000,
            boatId:         r.boatId,
            boatClass:      r.boatClass,
            rowerIds:       r.rowerIds,
            rowerNames:     r.rowerNames,
            displayName:    r.displayName,
            startTimestamp: START_TS,
            endTimestamp:   Timestamp.fromMillis(p1Start + r.elapsedMs),
            elapsedMs:      r.elapsedMs,
            split500mMs:    r.split500mMs,
            status:         "finished",
            createdAt:      START_TS,
        });
    }
    // Caoimhe DNF
    await db.doc("pieceResults/result_p1_dnf").set({
        sessionId:      "session_seed_001",
        sessionName:    "Tuesday 2k / 1k",
        coachId:        "test-coach-001",
        pieceNumber:    1,
        distanceMeters: 2000,
        boatId:         "boat_p1_dnf",
        boatClass:      "1x",
        rowerIds:       ["test-rower-010"],
        rowerNames:     ["Caoimhe Ní Bhriain"],
        displayName:    "Caoimhe Ní Bhriain (1x)",
        startTimestamp: START_TS,
        endTimestamp:   Timestamp.fromDate(new Date("2025-09-16T07:09:00")),
        elapsedMs:      null,
        split500mMs:    null,
        status:         "dnf",
        createdAt:      START_TS,
    });

    // Piece 2 results (1000m)
    const p2Start = new Date("2025-09-16T07:15:00").getTime();
    const p2StartTs = Timestamp.fromMillis(p2Start);
    const p2Results = [
        { id: "result_p2_a1", boatId: "boat_p2_a1", rowerIds: ["test-rower-001"], rowerNames: ["Aoife Murphy"],    displayName: "Aoife Murphy (1x)",    elapsedMs: 215000, split500mMs: 107500 },
        { id: "result_p2_a2", boatId: "boat_p2_a2", rowerIds: ["test-rower-005"], rowerNames: ["Conor Doyle"],    displayName: "Conor Doyle (1x)",    elapsedMs: 208000, split500mMs: 104000 },
        { id: "result_p2_a3", boatId: "boat_p2_a3", rowerIds: ["test-rower-014"], rowerNames: ["Deirdre Sheehan"], displayName: "Deirdre Sheehan (1x)", elapsedMs: 225000, split500mMs: 112500 },
    ];
    for (const r of p2Results) {
        await db.doc(`pieceResults/${r.id}`).set({
            sessionId:      "session_seed_001",
            sessionName:    "Tuesday 2k / 1k",
            coachId:        "test-coach-001",
            pieceNumber:    2,
            distanceMeters: 1000,
            boatId:         r.boatId,
            boatClass:      "1x",
            rowerIds:       r.rowerIds,
            rowerNames:     r.rowerNames,
            displayName:    r.displayName,
            startTimestamp: p2StartTs,
            endTimestamp:   Timestamp.fromMillis(p2Start + r.elapsedMs),
            elapsedMs:      r.elapsedMs,
            split500mMs:    r.split500mMs,
            status:         "finished",
            createdAt:      p2StartTs,
        });
    }

    console.log("  ✓ session_seed_001 — Tuesday 2k / 1k [completed] — 2 pieces, 7 results");

    // ── Draft session ────────────────────────────────────────────────────────
    const draftTs = Timestamp.fromDate(new Date("2025-09-18"));
    await db.doc("sessions/session_seed_002").set({
        id:                   "session_seed_002",
        coachId:              "test-coach-001",
        sessionType:          "race",
        timingAssistantEmail: null,
        timingAssistantName:  null,
        name:     "Thursday Ergs — 4x500m",
        date:     draftTs,
        status:   "draft",
        pieces: [
            { pieceNumber: 1, distanceMeters: 500, boats: [
                { boatId: "draft_b1", boatClass: "1x", rowerIds: ["test-rower-001"], rowerNames: ["Aoife Murphy"] },
                { boatId: "draft_b2", boatClass: "1x", rowerIds: ["test-rower-005"], rowerNames: ["Conor Doyle"] },
            ], status: "pending", startTimestamp: null },
            { pieceNumber: 2, distanceMeters: 500, boats: [
                { boatId: "draft_b3", boatClass: "1x", rowerIds: ["test-rower-001"], rowerNames: ["Aoife Murphy"] },
                { boatId: "draft_b4", boatClass: "1x", rowerIds: ["test-rower-005"], rowerNames: ["Conor Doyle"] },
            ], status: "pending", startTimestamp: null },
            { pieceNumber: 3, distanceMeters: 500, boats: [
                { boatId: "draft_b5", boatClass: "1x", rowerIds: ["test-rower-001"], rowerNames: ["Aoife Murphy"] },
                { boatId: "draft_b6", boatClass: "1x", rowerIds: ["test-rower-005"], rowerNames: ["Conor Doyle"] },
            ], status: "pending", startTimestamp: null },
            { pieceNumber: 4, distanceMeters: 500, boats: [
                { boatId: "draft_b7", boatClass: "1x", rowerIds: ["test-rower-001"], rowerNames: ["Aoife Murphy"] },
                { boatId: "draft_b8", boatClass: "1x", rowerIds: ["test-rower-005"], rowerNames: ["Conor Doyle"] },
            ], status: "pending", startTimestamp: null },
        ],
        createdAt: draftTs,
        updatedAt: draftTs,
    });

    console.log("  ✓ session_seed_002 — Thursday Ergs — 4x500m [draft] — 4 pieces");

    // ── Time trial session (draft, with timing assistant) ────────────────────
    const ttTs = Timestamp.fromDate(new Date("2025-09-20"));
    await db.doc("sessions/session_seed_003").set({
        id:                   "session_seed_003",
        coachId:              "test-coach-001",
        sessionType:          "time_trial",
        timingAssistantEmail: "coach.two@test.com",
        timingAssistantName:  "Emily Carter",
        name:     "Singles Time Trial — 2000m",
        date:     ttTs,
        status:   "draft",
        pieces: [
            {
                pieceNumber: 1, distanceMeters: 2000,
                boats: [
                    { boatId: "tt_b1", boatClass: "1x", rowerIds: ["test-rower-001"], rowerNames: ["Aoife Murphy"] },
                    { boatId: "tt_b2", boatClass: "1x", rowerIds: ["test-rower-005"], rowerNames: ["Conor Doyle"] },
                    { boatId: "tt_b3", boatClass: "1x", rowerIds: ["test-rower-014"], rowerNames: ["Deirdre Sheehan"] },
                ],
                status: "pending", startTimestamp: null,
            },
        ],
        createdAt: ttTs,
        updatedAt: ttTs,
    });

    console.log("  ✓ session_seed_003 — Singles Time Trial — 2000m [draft, time_trial] — assistant: coach.two@test.com");
}

// ─── Bookings ─────────────────────────────────────────────────────────────────
// Realistic booking documents that mirror what the stripeWebhook CF would write
// after a successful payment_intent.succeeded event.
// Covers: single-sculls confirmed, doubles pending crew, coach-pays, and refunded.

const BOOKING_NOW = new Date().toISOString();

function bookingFeeBreakdown(eventFeeCents: number) {
    const totalChargedCents    = Math.ceil((eventFeeCents + 30) / (1 - 0.029));
    const processingFeeCents   = totalChargedCents - eventFeeCents;
    const applicationFeeCents  = Math.round(eventFeeCents * 0.10);
    return { eventFeeCents, processingFeeCents, totalChargedCents, applicationFeeCents };
}

const BOOKINGS = [
    // ── Confirmed single scull — Aoife Murphy pays, Aoife rows ────────────────
    {
        id:                     "bk-001",
        eventId:                "seed-event-stripe-001",
        categoryId:             "women-senior-1x",
        categoryName:           "Women • Senior • 1x",
        payerUid:               "test-rower-001",
        payerRole:              "athlete" as const,
        stripePaymentIntentId:  "pi_test_seed_001",
        amount:                 5000,
        ...bookingFeeBreakdown(5000),
        status:                 "confirmed" as const,
        boatId:                 "seed-stripe-boat-001",
        inviteCode:             null,
        crewMemberUids:         ["test-rower-001"],
        eventName:              "Harvard Fall Classic 2026",
        eventDate:              new Date(Date.now() + 15 * 86_400_000).toISOString(),
        hostId:                 "seed-host-001",
        createdAt:              BOOKING_NOW,
    },
    // ── Confirmed single scull — Ciarán Walsh ─────────────────────────────────
    {
        id:                     "bk-002",
        eventId:                "seed-event-stripe-001",
        categoryId:             "men-senior-1x",
        categoryName:           "Men • Senior • 1x",
        payerUid:               "test-rower-002",
        payerRole:              "athlete" as const,
        stripePaymentIntentId:  "pi_test_seed_002",
        amount:                 5000,
        ...bookingFeeBreakdown(5000),
        status:                 "confirmed" as const,
        boatId:                 "seed-stripe-boat-002",
        inviteCode:             null,
        crewMemberUids:         ["test-rower-002"],
        eventName:              "Harvard Fall Classic 2026",
        eventDate:              new Date(Date.now() + 15 * 86_400_000).toISOString(),
        hostId:                 "seed-host-001",
        createdAt:              BOOKING_NOW,
    },
    // ── Confirmed single scull — Jake Anderson at Vesper ──────────────────────
    {
        id:                     "bk-004",
        eventId:                "seed-event-us-vesper-001",
        categoryId:             "Men • Senior Open • 1x",
        categoryName:           "Men • Senior Open • 1x",
        payerUid:               "test-rower-003",
        payerRole:              "athlete" as const,
        stripePaymentIntentId:  "pi_test_vesper_001",
        amount:                 4000,
        ...bookingFeeBreakdown(4000),
        status:                 "confirmed" as const,
        boatId:                 "seed-vesper-boat-001",
        inviteCode:             null,
        crewMemberUids:         ["test-rower-003"],
        eventName:              "Vesper Boathouse Regatta 2026",
        eventDate:              new Date(Date.now() + 28 * 86_400_000).toISOString(),
        hostId:                 "seed-host-001",
        createdAt:              BOOKING_NOW,
    },
    // ── Refunded — Niamh Kelly cancelled her Harvard entry ────────────────────
    {
        id:                     "bk-005",
        eventId:                "seed-event-stripe-001",
        categoryId:             "women-senior-1x",
        categoryName:           "Women • Senior • 1x",
        payerUid:               "test-rower-004",
        payerRole:              "athlete" as const,
        stripePaymentIntentId:  "pi_test_seed_004",
        amount:                 5000,
        ...bookingFeeBreakdown(5000),
        status:                 "refunded" as const,
        boatId:                 "seed-stripe-boat-004",
        inviteCode:             null,
        crewMemberUids:         ["test-rower-004"],
        eventName:              "Harvard Fall Classic 2026",
        eventDate:              new Date(Date.now() + 15 * 86_400_000).toISOString(),
        hostId:                 "seed-host-001",
        createdAt:              BOOKING_NOW,
    },
    // ── Coach booking — Emily Carter pays for 2 Vesper boats.
    //    One boat (Women 2x) closed with no crew → partial refund already applied.
    {
        id:                     "bk-006",
        eventId:                "seed-event-us-vesper-001",
        payerUid:               "test-coach-002",
        payerRole:              "coach" as const,
        stripePaymentIntentId:  "pi_test_vesper_coach_001",
        amount:                 7500,
        ...bookingFeeBreakdown(7500),
        status:                 "partially_refunded" as const,
        boatIds:                ["seed-coach-boat-001", "seed-coach-boat-002"],
        partialRefunds:         [
            {
                boatId:      "seed-coach-boat-002",
                refundCents: 3500,
                refundId:    "re_test_coach_boat002",
            },
        ],
        eventName:              "Vesper Boathouse Regatta 2026",
        eventDate:              new Date(Date.now() + 28 * 86_400_000).toISOString(),
        hostId:                 "seed-host-001",
        createdAt:              BOOKING_NOW,
    },
] as const;

async function seedBookings() {
    console.log("\n── Bookings ─────────────────────────────────────────");
    const now = Timestamp.fromDate(new Date());

    for (const b of BOOKINGS) {
        const { id, ...data } = b;
        // Convert refundedAt timestamps in partialRefunds if present
        const partialRefunds = (data as any).partialRefunds
            ? (data as any).partialRefunds.map((r: any) => ({ ...r, refundedAt: now }))
            : undefined;
        await db.doc(`bookings/${id}`).set({
            id,
            ...data,
            ...(partialRefunds && { partialRefunds }),
            eventDate: Timestamp.fromDate(new Date(data.eventDate)),
            createdAt: now,
            ...(data.status === "refunded" && { refundedAt: now }),
        });
        const roleLabel = data.payerRole === "coach" ? "coach" : "athlete";
        console.log(`  ✓ ${id} — ${data.status} — ${data.eventName} (${roleLabel}: ${data.payerUid})`);
    }
}

// ─── Stripe test event ────────────────────────────────────────────────────────
// A paid event closing 10 days from script execution, with 3 pre-registered
// boats and held payments, so the admin payment verification flow has real data.

function calcFeeBreakdown(eventFeeCents: number) {
    const totalChargedCents = Math.ceil((eventFeeCents + 30) / (1 - 0.029));
    const processingFeeCents = totalChargedCents - eventFeeCents;
    return { eventFeeCents, processingFeeCents, totalChargedCents };
}

async function seedStripeTestEvent() {
    console.log("\n── Stripe test event ────────────────────────────────");

    const now     = new Date();
    const closeAt = new Date(now.getTime() + 10 * 86_400_000);  // closes in 10 days
    const startAt = new Date(now.getTime() + 15 * 86_400_000);  // starts in 15 days
    const endAt   = new Date(now.getTime() + 15 * 86_400_000 + 4 * 3_600_000);

    const EVENT_ID = "seed-event-stripe-001";
    const HOST_ID  = "seed-host-001";

    // Make seed-host-001 look like an onboarded US Stripe Connect club admin
    await db.doc(`users/${HOST_ID}`).update({
        "roles.clubAdmin.country":                  "US",
        "roles.clubAdmin.stripeOnboarded":          true,
        "roles.clubAdmin.stripeConnectedAccountId": "acct_test_mock_seed001",
    });
    console.log(`  ✓ seed-host-001 updated — country: US, stripeOnboarded: true`);

    const categories = [
        { id: "men-senior-1x",   name: "Men • Senior • 1x",   feeCents: 5000 },
        { id: "women-senior-1x", name: "Women • Senior • 1x", feeCents: 5000 },
    ];

    await db.doc(`events/${EVENT_ID}`).set({
        id:                 EVENT_ID,
        name:               "Harvard Fall Classic 2026",
        location:           "Charles River, Cambridge MA",
        description:        "Open head race on the Charles River. All senior categories welcome.",
        lengthMeters:       2000,
        status:             "open",
        verificationStatus: "pending",
        clubId:             "club-harvard",
        hostId:             HOST_ID,
        createdByUid:       HOST_ID,
        createdByName:      "Seed Host",
        categories,
        resultsPublishMode: "live",
        bowsAssigned:       false,
        startAt:            Timestamp.fromDate(startAt),
        endAt:              Timestamp.fromDate(endAt),
        closeAt:            Timestamp.fromDate(closeAt),
        createdAt:          Timestamp.fromDate(now),
        updatedAt:          Timestamp.fromDate(now),
    });
    console.log(`  ✓ ${EVENT_ID} — "Harvard Fall Classic 2026" [open] closes ${closeAt.toLocaleDateString("en-US")}`);

    // Three pre-registered boats with held payments
    const registrations = [
        {
            boatId:       "seed-stripe-boat-001",
            paymentId:    "seed-stripe-pay-001",
            piId:         "pi_test_seed_001",
            rowerUids:    ["test-rower-001"],
            creatorUid:   "test-rower-001",
            categoryId:   "women-senior-1x",
            categoryName: "Women • Senior • 1x",
            clubName:     "Harvard Rowing Club",
            boatSize:     1,
            ...calcFeeBreakdown(5000),
        },
        {
            boatId:       "seed-stripe-boat-002",
            paymentId:    "seed-stripe-pay-002",
            piId:         "pi_test_seed_002",
            rowerUids:    ["test-rower-002"],
            creatorUid:   "test-rower-002",
            categoryId:   "men-senior-1x",
            categoryName: "Men • Senior • 1x",
            clubName:     "Harvard Rowing Club",
            boatSize:     1,
            ...calcFeeBreakdown(5000),
        },
        // Niamh Kelly — registered then refunded (illustrates the refunded booking state)
        {
            boatId:       "seed-stripe-boat-004",
            paymentId:    "seed-stripe-pay-004",
            piId:         "pi_test_seed_004",
            rowerUids:    ["test-rower-004"],
            creatorUid:   "test-rower-004",
            categoryId:   "women-senior-1x",
            categoryName: "Women • Senior • 1x",
            clubName:     "Harvard Rowing Club",
            boatSize:     1,
            ...calcFeeBreakdown(5000),
        },
    ];

    for (const reg of registrations) {
        await db.doc(`events/${EVENT_ID}/boats/${reg.boatId}`).set({
            id:              reg.boatId,
            eventId:         EVENT_ID,
            bowNumber:       null,
            boatSize:        reg.boatSize,
            category:        reg.categoryId,
            categoryId:      reg.categoryId,
            categoryName:    reg.categoryName,
            clubName:        reg.clubName,
            rowerUids:       reg.rowerUids,
            creatorUid:      reg.creatorUid,
            paymentIntentId: reg.piId,
            status:          "registered",
            activeRunId:     null,
            startedAt:       null,
            finishedAt:      null,
            elapsedMs:       null,
            adjustmentMs:    0,
            inviteCode:      null,
            invitedEmails:   [],
            createdAt:       Timestamp.fromDate(now),
            updatedAt:       Timestamp.fromDate(now),
        });

        // Guard doc used by the webhook for idempotency
        await db.doc(`events/${EVENT_ID}/rowerCategorySignups/${reg.creatorUid}__${reg.categoryId}`).set({
            createdAt: Timestamp.fromDate(now),
        });

        // Payment held pending admin confirmation
        await db.doc(`payments/${reg.paymentId}`).set({
            id:                    reg.paymentId,
            eventId:               EVENT_ID,
            boatId:                reg.boatId,
            payerId:               reg.creatorUid,
            hostId:                HOST_ID,
            stripePaymentIntentId: reg.piId,
            eventFeeCents:         reg.eventFeeCents,
            processingFeeCents:    reg.processingFeeCents,
            totalChargedCents:     reg.totalChargedCents,
            status:                "held",
            createdAt:             Timestamp.fromDate(now),
        });

        console.log(
            `  ✓ ${reg.boatId} — ${reg.categoryName} [${reg.rowerUids.join(", ")}]` +
            ` | €${(reg.totalChargedCents / 100).toFixed(2)} held`
        );
    }
}

// ─── Multi-class Irish event (free entry) ────────────────────────────────────
// Demonstrates varied boat classes on the public events list page.
// No entry fee — this is an Irish federation event.

async function seedBoatClassFeeEvent() {
    console.log("\n── Per-boat-class fee event ─────────────────────────");

    const now     = new Date();
    const startAt = new Date(now.getTime() + 45 * 86_400_000);   // 45 days from now
    const endAt   = new Date(startAt.getTime() +  2 * 86_400_000);
    const closeAt = new Date(startAt.getTime() -  7 * 86_400_000);

    const EVENT_ID = "seed-event-multiclass-001";

    // Categories use the canonical "Gender • Division • BoatClass" key format.
    // Senior Open divisions only have 1x and 2- (sweep).
    // Masters Open is one bracket at any age and has all four boat classes, so we
    // mix both to show the full range.
    const categories = [
        { id: "Men • Senior Open • 1x",       name: "Men • Senior Open • 1x"       },
        { id: "Women • Senior Open • 1x",     name: "Women • Senior Open • 1x"     },
        { id: "Men • Senior Open • 2-",       name: "Men • Senior Open • 2-"       },
        { id: "Women • Senior Open • 2-",     name: "Women • Senior Open • 2-"     },
        { id: "Men • Masters Open • 2x",    name: "Men • Masters Open • 2x"    },
        { id: "Women • Masters Open • 2x",  name: "Women • Masters Open • 2x"  },
        { id: "Men • Masters Open • 4x+",   name: "Men • Masters Open • 4x+"   },
        { id: "Women • Masters Open • 4x+", name: "Women • Masters Open • 4x+" },
    ];

    await db.doc(`events/${EVENT_ID}`).set({
        id:                 EVENT_ID,
        name:               "National Rowing Centre Head 2026",
        location:           "National Rowing Centre, Cork",
        description:        "Annual head race open to all senior and masters categories. Free entry for all senior and masters boat classes.",
        lengthMeters:       3000,
        status:             "open",
        clubId:             "club-neptune",
        hostId:             "seed-host-001",
        createdByUid:       "seed-host-001",
        createdByName:      "Seed Host",
        categories,
        resultsPublishMode: "live",
        bowsAssigned:       false,
        startAt:            Timestamp.fromDate(startAt),
        endAt:              Timestamp.fromDate(endAt),
        closeAt:            Timestamp.fromDate(closeAt),
        createdAt:          Timestamp.fromDate(now),
        updatedAt:          Timestamp.fromDate(now),
    });

    console.log(`  ✓ ${EVENT_ID} — "National Rowing Centre Head 2026" [open, free entry]`);
    console.log(`      opens in 45 days, ${categories.length} categories`);
}

// ─── Second US paid event ─────────────────────────────────────────────────────
// Vesper Boathouse Regatta — a Schuylkill-based paid event to complement the
// Harvard event above. Hosted by the same US Stripe-onboarded seed-host-001.
// One pre-registered boat: Jake Anderson (test-rower-003, Vesper BC).

async function seedVesperPaidEvent() {
    console.log("\n── Vesper paid event ────────────────────────────────");

    const now     = new Date();
    const closeAt = new Date(now.getTime() + 20 * 86_400_000);  // closes in 20 days
    const startAt = new Date(now.getTime() + 28 * 86_400_000);  // starts in 28 days
    const endAt   = new Date(startAt.getTime() + 6 * 3_600_000);

    const EVENT_ID = "seed-event-us-vesper-001";
    const HOST_ID  = "seed-host-001"; // already US Stripe onboarded by seedStripeTestEvent

    const categories = [
        { id: "Men • Senior Open • 1x",   name: "Men • Senior Open • 1x",   feeCents: 4000 },
        { id: "Women • Senior Open • 1x", name: "Women • Senior Open • 1x", feeCents: 4000 },
        { id: "Men • Senior Open • 2x",   name: "Men • Senior Open • 2x",   feeCents: 3500 },
        { id: "Women • Senior Open • 2x", name: "Women • Senior Open • 2x", feeCents: 3500 },
    ];

    await db.doc(`events/${EVENT_ID}`).set({
        id:                 EVENT_ID,
        name:               "Vesper Boathouse Regatta 2026",
        location:           "Schuylkill River, Philadelphia PA",
        description:        "Annual regatta on the Schuylkill River hosted by Vesper Boat Club. Open to all senior scullers.",
        lengthMeters:       2000,
        status:             "open",
        verificationStatus: "pending",
        clubId:             "club-vesper",
        hostId:             HOST_ID,
        createdByUid:       HOST_ID,
        createdByName:      "Seed Host",
        categories,
        resultsPublishMode: "live",
        bowsAssigned:       false,
        startAt:            Timestamp.fromDate(startAt),
        endAt:              Timestamp.fromDate(endAt),
        closeAt:            Timestamp.fromDate(closeAt),
        createdAt:          Timestamp.fromDate(now),
        updatedAt:          Timestamp.fromDate(now),
    });
    console.log(`  ✓ ${EVENT_ID} — "Vesper Boathouse Regatta 2026" [open] closes ${closeAt.toLocaleDateString("en-US")}`);

    // One pre-registered boat — Jake Anderson (Vesper BC rower)
    const reg = {
        boatId:       "seed-vesper-boat-001",
        paymentId:    "seed-vesper-pay-001",
        piId:         "pi_test_vesper_001",
        rowerUids:    ["test-rower-003"],
        creatorUid:   "test-rower-003",
        categoryId:   "Men • Senior Open • 1x",
        categoryName: "Men • Senior Open • 1x",
        clubName:     "Vesper Boat Club",
        boatSize:     1,
        ...calcFeeBreakdown(4000),
    };

    await db.doc(`events/${EVENT_ID}/boats/${reg.boatId}`).set({
        id:              reg.boatId,
        eventId:         EVENT_ID,
        bowNumber:       null,
        boatSize:        reg.boatSize,
        category:        reg.categoryId,
        categoryId:      reg.categoryId,
        categoryName:    reg.categoryName,
        clubName:        reg.clubName,
        rowerUids:       reg.rowerUids,
        creatorUid:      reg.creatorUid,
        paymentIntentId: reg.piId,
        status:          "registered",
        activeRunId:     null,
        startedAt:       null,
        finishedAt:      null,
        elapsedMs:       null,
        adjustmentMs:    0,
        inviteCode:      null,
        invitedEmails:   [],
        createdAt:       Timestamp.fromDate(now),
        updatedAt:       Timestamp.fromDate(now),
    });

    await db.doc(`events/${EVENT_ID}/rowerCategorySignups/${reg.creatorUid}__${reg.categoryId}`).set({
        createdAt: Timestamp.fromDate(now),
    });

    await db.doc(`payments/${reg.paymentId}`).set({
        id:                    reg.paymentId,
        eventId:               EVENT_ID,
        boatId:                reg.boatId,
        payerId:               reg.creatorUid,
        hostId:                HOST_ID,
        stripePaymentIntentId: reg.piId,
        eventFeeCents:         reg.eventFeeCents,
        processingFeeCents:    reg.processingFeeCents,
        totalChargedCents:     reg.totalChargedCents,
        status:                "held",
        createdAt:             Timestamp.fromDate(now),
    });

    console.log(
        `  ✓ ${reg.boatId} — ${reg.categoryName} [${reg.rowerUids.join(", ")}]` +
        ` | $${(reg.totalChargedCents / 100).toFixed(2)} held`
    );

    // Two coach-booked boats — Emily Carter (test-coach-002) paid for both in one intent
    const COACH_PI = "pi_test_vesper_coach_001";
    const coachBoats = [
        {
            boatId:       "seed-coach-boat-001",
            categoryId:   "Women • Senior Open • 1x",
            categoryName: "Women • Senior Open • 1x",
            clubName:     "Harvard Rowing Club",
            boatSize:     1,
            inviteCode:   "COACHWM1",
            // Crew filled — represents the 3 "good" boats in the scenario
            status:       "registered" as const,
            rowerUids:    ["test-rower-002"],
            ...calcFeeBreakdown(4000),
        },
        {
            boatId:       "seed-coach-boat-002",
            categoryId:   "Women • Senior Open • 2x",
            categoryName: "Women • Senior Open • 2x",
            clubName:     "Harvard Rowing Club",
            boatSize:     2,
            inviteCode:   "COACHWM2",
            // No crew by closing date → cancelled & refunded
            status:       "cancelled" as const,
            rowerUids:    [] as string[],
            ...calcFeeBreakdown(3500),
        },
    ];
    const coachTotalFee = coachBoats.reduce((s, b) => s + b.eventFeeCents, 0);
    const coachTotalCharged = coachBoats.reduce((s, b) => s + b.totalChargedCents, 0);

    for (const boat of coachBoats) {
        await db.doc(`events/${EVENT_ID}/boats/${boat.boatId}`).set({
            id:              boat.boatId,
            eventId:         EVENT_ID,
            bowNumber:       null,
            boatSize:        boat.boatSize,
            category:        boat.categoryId,
            categoryId:      boat.categoryId,
            categoryName:    boat.categoryName,
            clubName:        boat.clubName,
            rowerUids:       boat.rowerUids,
            createdByUid:    "test-coach-002",
            paymentIntentId: COACH_PI,
            status:          boat.status,
            inviteCode:      boat.inviteCode,
            invitedEmails:   [],
            activeRunId:     null,
            startedAt:       null,
            finishedAt:      null,
            elapsedMs:       null,
            adjustmentMs:    0,
            createdAt:       Timestamp.fromDate(now),
            updatedAt:       Timestamp.fromDate(now),
        });
        console.log(`  ✓ ${boat.boatId} — ${boat.categoryName} [${boat.status}]`);
    }

    // Coach guard doc (idempotency) + single payment covering all coach boats
    await db.doc(`events/${EVENT_ID}/coachPayments/${COACH_PI}`).set({
        coachUid:        "test-coach-002",
        paymentIntentId: COACH_PI,
        boatIds:         coachBoats.map(b => b.boatId),
        boatCount:       coachBoats.length,
        createdAt:       Timestamp.fromDate(now),
    });

    await db.doc(`payments/seed-coach-pay-001`).set({
        id:                    "seed-coach-pay-001",
        eventId:               EVENT_ID,
        eventName:             "Vesper Boathouse Regatta 2026",
        boatIds:               coachBoats.map(b => b.boatId),
        payerId:               "test-coach-002",
        hostId:                HOST_ID,
        stripePaymentIntentId: COACH_PI,
        eventFeeCents:         coachTotalFee,
        processingFeeCents:    coachTotalCharged - coachTotalFee,
        totalChargedCents:     coachTotalCharged,
        status:                "held",
        createdAt:             Timestamp.fromDate(now),
    });

    console.log(`  ✓ seed-coach-pay-001 — coach payment covering ${coachBoats.length} boats | $${(coachTotalCharged / 100).toFixed(2)} held`);
}

// ─── Multi-role fed admin ─────────────────────────────────────────────────────
// Mirrors the shape of a production account that has federationAdmin + clubAdmin
// + coach + guardian all on the same user doc.

// ─── Shared helpers for erg-backed seeders ───────────────────────────────────

/**
 * Deletes every document in a collection, in batches.
 *
 * Needed because erg score ids derive from the Concept2 result id: if the
 * fixture below changes, the old score docs would otherwise survive a re-seed
 * as orphans that no entry's ergBestTimeMs accounts for. The rest of this script
 * is idempotent through fixed ids; this collection needs a sweep instead.
 */
async function clearCollection(path: string): Promise<number> {
    let removed = 0;
    for (;;) {
        const snap = await db.collection(path).limit(400).get();
        if (snap.empty) return removed;
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        removed += snap.size;
    }
}


async function seedMultiRoleFedAdmin() {
    console.log("\n── Multi-role federation + club admin ───────────────");

    const UID          = "test-fed-multi-001";
    const FEDERATION   = "fed-usrowing";
    const ADMIN_CLUB_ID   = "club-nyac";
    const ADMIN_CLUB_NAME = "New York Athletic Club Rowing";

    const COACH_MEMBERSHIP = {
        clubId:           "club-vesper",
        clubName:         "Vesper Boat Club",
        clubShortName:    "Vesper BC",
        federationId:     "fed-usrowing",
        role:             "coach",
        membershipStatus: "active",
        joinedAt:         NOW,
    };

    const userDoc = {
        uid:         UID,
        email:       "james.mangan@test.com",
        displayName: "James Mangan",
        fullName:    "James Mangan",
        gender:      "male",
        dateOfBirth: "1988-05-10",
        isMinor:     false,
        consent: {
            termsAcceptedAt:   NOW,
            privacyAcceptedAt: NOW,
            givenBy:           "self",
            givenByUid:        UID,
            updatedAt:         NOW,
        },
        permissions: {
            shareWithCoaches:      false,
            shareWithUniversities: false,
            shareWithFederations:  false,
        },
        roles: {
            federationAdmin: { federationId: FEDERATION },
            clubAdmin:       { clubId: ADMIN_CLUB_ID, federationId: FEDERATION },
            coach: {
                clubMemberships: [COACH_MEMBERSHIP],
            },
            guardian: {
                linkedChildren: [
                    {
                        childPendingId: "mock-child-pending-001",
                        childName:      "Max Mangan",
                        approvedAt:     NOW,
                    },
                ],
            },
        },
        status: { isActive: true, isVerified: true },
        hasSeenTour: false,
        createdAt: NOW,
        updatedAt: NOW,
    };

    await db.doc(`users/${UID}`).set(userDoc);

    // Add as admin on the club doc
    await db.doc(`clubs/${ADMIN_CLUB_ID}`).update({
        adminUids: FieldValue.arrayUnion(UID),
        updatedAt: NOW,
    });

    // Coach membership doc at Vesper
    await db.doc(`clubs/club-vesper/members/${UID}`).set({
        uid:         UID,
        clubId:      "club-vesper",
        displayName: "James Mangan",
        email:       "james.mangan@test.com",
        role:        "coach",
        status:      "active",
        joinedAt:    NOW,
        updatedAt:   NOW,
    });

    try {
        await auth.createUser({
            uid:           UID,
            email:         "james.mangan@test.com",
            password:      "Test1234!",
            displayName:   "James Mangan",
            emailVerified: true,
        });
    } catch (e: any) {
        if (e.code === "auth/uid-already-exists" || e.code === "auth/email-already-exists") {
            await auth.updateUser(UID, {
                email:         "james.mangan@test.com",
                displayName:   "James Mangan",
                emailVerified: true,
            });
        } else {
            throw e;
        }
    }

    // federationAdmin claim takes precedence; clubId included so clubAdmin
    // dashboard also works without a second Firestore lookup.
    await auth.setCustomUserClaims(UID, {
        role:         "federationAdmin",
        federationId: FEDERATION,
        clubId:       ADMIN_CLUB_ID,
    });

    console.log(`  ✓ James Mangan <james.mangan@test.com> [federationAdmin + clubAdmin (${ADMIN_CLUB_NAME}) + coach + guardian]`);
}

// ─── Masters & senior regatta (finished, with results) ────────────────────────
//
// Exercises the reworked masters model end to end. Masters is one bracket per
// weight, boat class and gender: any crew whose rowers all clear 27 may enter,
// and the band (A…K) plus the USRowing handicap fall out of the crew's average
// age afterwards. So this event is built to make that visible:
//
//   • crews of mixed ages rowing together — a 48 year old with a 32 year old —
//     which the old per-band categories made impossible;
//   • raw and handicapped orders that genuinely differ, so the Overall tab
//     and the masters category views disagree. The handicap is shown only where
//     it is applied: filter to a masters category and every row carries its
//     handicap and is ranked on it; the Overall tab is raw time alone, with no
//     handicap anywhere on the card;
//   • two crews in the same band in one category, for the band sub-filter;
//   • a quad averaging 60.5, to show the fraction being dropped to 60;
//   • every handicap coefficient in use — 1x and 2- at 0.025, 2x at 0.0216,
//     4x+ at 0.020 — so a coefficient wired to the wrong boat class shows up;
//   • a masters single at the base age of 27, carrying a band but a handicap of
//     exactly zero. Not the same thing as a senior entry, which has no band and
//     no handicap at all, and the two must not render alike;
//   • a band K single (85+, the open-ended top band) whose 261s handicap takes
//     the slowest raw time in the event to first place;
//   • two crews in one category on byte-identical handicaps, so the ranking
//     falls back to raw time;
//   • a senior single carrying a 10s penalty, so the official time is the
//     stopwatch plus the penalty and the handicap comes off that;
//   • a DNF, which never picks up a handicap.
//
// The masters fields on each boat are normally written by the
// computeMastersHandicap Cloud Function. They are computed here instead, with
// the same formulas, so the seed is useful without the Functions emulator
// running — see functions/src/types/masters.types.ts for the authority.

const MASTERS_EVENT_ID   = "seed-event-masters-001";
const MASTERS_DISTANCE_M = 3000;

/** USRowing handicap coefficients — seconds per 1000m is K * (age - 27)^2. */
const HANDICAP_K: Record<string, number> = { "1x": 0.025, "2-": 0.025, "2x": 0.0216, "4x+": 0.020 };

const BAND_RANGES: Array<{ band: string; minAge: number; maxAge: number | null }> = [
    { band: "A", minAge: 27, maxAge: 35 }, { band: "B", minAge: 36, maxAge: 42 },
    { band: "C", minAge: 43, maxAge: 49 }, { band: "D", minAge: 50, maxAge: 54 },
    { band: "E", minAge: 55, maxAge: 59 }, { band: "F", minAge: 60, maxAge: 64 },
    { band: "G", minAge: 65, maxAge: 69 }, { band: "H", minAge: 70, maxAge: 74 },
    { band: "I", minAge: 75, maxAge: 79 }, { band: "J", minAge: 80, maxAge: 84 },
    { band: "K", minAge: 85, maxAge: null },
];

function bandForAge(age: number): string | null {
    return BAND_RANGES.find(r => age >= r.minAge && (r.maxAge === null || age <= r.maxAge))?.band ?? null;
}

/** Seconds per 1000m. Zero at the base age of 27 and below it. */
function handicapPer1000(age: number, k: number): number {
    const delta = age - 27;
    return delta <= 0 ? 0 : k * delta * delta;
}

function handicapMs(age: number, boatClass: string, meters: number): number {
    return Math.round(handicapPer1000(age, HANDICAP_K[boatClass]) * (meters / 1000) * 1000);
}

// The regatta was rowed a fortnight ago. Masters ages run off the competition
// year, so every rower's date of birth is derived from the age they should race
// at — the seed then reads the same whatever year it is run in.
const MASTERS_EVENT_START = new Date(Date.now() - 14 * 86_400_000);
const MASTERS_EVENT_YEAR  = MASTERS_EVENT_START.getUTCFullYear();

/** A date of birth that puts this rower at `age` during the competition year. */
function dobForAge(age: number): string {
    return `${MASTERS_EVENT_YEAR - age}-05-20`;
}

type RegattaRower = {
    uid: string;
    displayName: string;
    gender: "male" | "female";
    /** Age during the competition year — the date of birth is derived from it. */
    age: number;
    clubId: string;
    clubName: string;
    clubShortName: string;
};

const NEPTUNE    = { clubId: "club-neptune",    clubName: "Neptune Rowing Club",     clubShortName: "Neptune RC"  };
const LEE_VALLEY = { clubId: "club-lee-valley", clubName: "Lee Valley Rowing Club",  clubShortName: "Lee Valley RC" };
const DCRC       = { clubId: "club-dcrc",       clubName: "Dublin City Rowing Club", clubShortName: "DCRC"        };
const GALWAY     = { clubId: "club-galway",     clubName: "Galway Rowing Club",      clubShortName: "Galway RC"   };

const MASTERS_ROWERS: RegattaRower[] = [
    // Men's masters singles — one per band from A up to H.
    { uid: "seed-masters-m01", displayName: "Declan Byrne",     gender: "male",   age: 30, ...NEPTUNE    },
    { uid: "seed-masters-m02", displayName: "Fergal O'Neill",   gender: "male",   age: 42, ...LEE_VALLEY },
    { uid: "seed-masters-m03", displayName: "Brendan Kelly",    gender: "male",   age: 50, ...DCRC       },
    { uid: "seed-masters-m04", displayName: "Tomás Ryan",       gender: "male",   age: 60, ...GALWAY     },
    { uid: "seed-masters-m05", displayName: "Micheál Doyle",    gender: "male",   age: 72, ...NEPTUNE    },
    { uid: "seed-masters-m06", displayName: "Gearóid Cullen",   gender: "male",   age: 45, ...LEE_VALLEY },

    // Women's masters singles.
    { uid: "seed-masters-w01", displayName: "Síle Fitzgerald",  gender: "female", age: 36, ...NEPTUNE    },
    { uid: "seed-masters-w02", displayName: "Nuala Grant",      gender: "female", age: 46, ...DCRC       },
    { uid: "seed-masters-w03", displayName: "Órla Lynch",       gender: "female", age: 56, ...GALWAY     },

    // Doubles — deliberately mixed ages, which the old per-band categories barred.
    { uid: "seed-masters-m07", displayName: "Pádraig Nolan",    gender: "male",   age: 48, ...NEPTUNE    },
    { uid: "seed-masters-m08", displayName: "Cathal Maguire",   gender: "male",   age: 32, ...NEPTUNE    },
    { uid: "seed-masters-m09", displayName: "Ruairí Hayes",     gender: "male",   age: 38, ...LEE_VALLEY },
    { uid: "seed-masters-m10", displayName: "Seán Gallagher",   gender: "male",   age: 40, ...LEE_VALLEY },
    { uid: "seed-masters-m11", displayName: "Eoin Sweeney",     gender: "male",   age: 54, ...DCRC       },
    { uid: "seed-masters-m12", displayName: "Colm Brady",       gender: "male",   age: 58, ...DCRC       },
    { uid: "seed-masters-m13", displayName: "Liam Farrell",     gender: "male",   age: 64, ...GALWAY     },
    { uid: "seed-masters-m14", displayName: "Barry Quinn",      gender: "male",   age: 68, ...GALWAY     },

    // Quads.
    { uid: "seed-masters-m15", displayName: "Niall Corrigan",   gender: "male",   age: 44, ...NEPTUNE    },
    { uid: "seed-masters-m16", displayName: "Donal Sheehan",    gender: "male",   age: 52, ...NEPTUNE    },
    { uid: "seed-masters-m17", displayName: "Aidan Keane",      gender: "male",   age: 38, ...NEPTUNE    },
    { uid: "seed-masters-m18", displayName: "Kevin Mulcahy",    gender: "male",   age: 46, ...NEPTUNE    },
    { uid: "seed-masters-m19", displayName: "Peadar Bourke",    gender: "male",   age: 61, ...DCRC       },
    { uid: "seed-masters-m20", displayName: "Frank Devlin",     gender: "male",   age: 57, ...DCRC       },
    { uid: "seed-masters-m21", displayName: "Oisín Maher",      gender: "male",   age: 65, ...DCRC       },
    { uid: "seed-masters-m22", displayName: "Éamon Traynor",    gender: "male",   age: 59, ...DCRC       },

    // Pairs — the 2- carries the same steep 0.025 coefficient as the single,
    // which nothing else in this regatta exercises.
    { uid: "seed-masters-m23", displayName: "Ronan Dunne",      gender: "male",   age: 44, ...LEE_VALLEY },
    { uid: "seed-masters-m24", displayName: "Turlough Blake",   gender: "male",   age: 46, ...LEE_VALLEY },
    { uid: "seed-masters-m25", displayName: "Séamus Redmond",   gender: "male",   age: 62, ...GALWAY     },
    { uid: "seed-masters-m26", displayName: "Malachy Tobin",    gender: "male",   age: 66, ...GALWAY     },

    // At the base age exactly: eligible for masters, handicap of zero.
    { uid: "seed-masters-m27", displayName: "Fionn Delaney",    gender: "male",   age: 27, ...NEPTUNE    },

    // Averages to 40, the same as the Neptune double already entered, so the
    // two crews come out on identical handicaps from different ages.
    { uid: "seed-masters-m28", displayName: "Garrett Moloney",  gender: "male",   age: 36, ...NEPTUNE    },
    { uid: "seed-masters-m29", displayName: "Cormac Whelan",    gender: "male",   age: 44, ...NEPTUNE    },

    // Band K — the open-ended top band, and the largest handicap in the event.
    { uid: "seed-masters-w04", displayName: "Máire Sexton",     gender: "female", age: 86, ...LEE_VALLEY },
];

const ROWER_BY_UID = new Map(MASTERS_ROWERS.map(r => [r.uid, r]));

type RegattaCrew = {
    boatId: string;
    bowNumber: number;
    categoryId: string;
    boatClass: "1x" | "2x" | "2-" | "4x+";
    boatSize: 1 | 2 | 4;
    clubName: string;
    rowerUids: string[];
    /** Stopwatch time, finish minus start. */
    elapsedSeconds: number;
    /** Penalty or correction the host applied; added to the stopwatch. */
    adjustmentSeconds?: number;
    status?: "finished" | "dnf";
    /** Dates of birth for crew members who are not in MASTERS_ROWERS. */
    externalDobs?: string[];
};

const MASTERS_CREWS: RegattaCrew[] = [
    // ── Men • Masters Open • 1x ───────────────────────────────────────────────
    // On handicap the order all but inverts. The exception is Fionn at the base
    // age of 27, whose handicap is zero: second fastest raw, last once the rest
    // of the field has its handicap applied. Bows 19+ throughout are the crews
    // added after the original draw, which is why they sit outside the run.
    { boatId: "seed-masters-boat-01", bowNumber:  1, categoryId: "Men • Masters Open • 1x", boatClass: "1x", boatSize: 1, clubName: "Neptune Rowing Club",     rowerUids: ["seed-masters-m01"], elapsedSeconds: 710 },
    { boatId: "seed-masters-boat-02", bowNumber:  2, categoryId: "Men • Masters Open • 1x", boatClass: "1x", boatSize: 1, clubName: "Lee Valley Rowing Club",  rowerUids: ["seed-masters-m02"], elapsedSeconds: 725 },
    { boatId: "seed-masters-boat-03", bowNumber:  3, categoryId: "Men • Masters Open • 1x", boatClass: "1x", boatSize: 1, clubName: "Dublin City Rowing Club", rowerUids: ["seed-masters-m03"], elapsedSeconds: 740 },
    { boatId: "seed-masters-boat-04", bowNumber:  4, categoryId: "Men • Masters Open • 1x", boatClass: "1x", boatSize: 1, clubName: "Galway Rowing Club",      rowerUids: ["seed-masters-m04"], elapsedSeconds: 785 },
    { boatId: "seed-masters-boat-05", bowNumber:  5, categoryId: "Men • Masters Open • 1x", boatClass: "1x", boatSize: 1, clubName: "Neptune Rowing Club",     rowerUids: ["seed-masters-m05"], elapsedSeconds: 862 },
    // Band A at the base age — mastersHandicapMs is 0, not null.
    { boatId: "seed-masters-boat-19", bowNumber: 19, categoryId: "Men • Masters Open • 1x", boatClass: "1x", boatSize: 1, clubName: "Neptune Rowing Club",     rowerUids: ["seed-masters-m27"], elapsedSeconds: 718 },
    // Did not finish — carries a band but never a handicapped time.
    { boatId: "seed-masters-boat-06", bowNumber:  6, categoryId: "Men • Masters Open • 1x", boatClass: "1x", boatSize: 1, clubName: "Lee Valley Rowing Club",  rowerUids: ["seed-masters-m06"], elapsedSeconds: 0, status: "dnf" },

    // ── Women • Masters Open • 1x ─────────────────────────────────────────────
    // A clean inversion: slowest raw wins on handicap. Máire at 86 is band K and
    // carries 261s over the 3000m — four minutes and ten seconds down on the
    // stopwatch, first by 3s once it is applied.
    { boatId: "seed-masters-boat-07", bowNumber:  7, categoryId: "Women • Masters Open • 1x", boatClass: "1x", boatSize: 1, clubName: "Neptune Rowing Club",     rowerUids: ["seed-masters-w01"], elapsedSeconds: 760 },
    { boatId: "seed-masters-boat-08", bowNumber:  8, categoryId: "Women • Masters Open • 1x", boatClass: "1x", boatSize: 1, clubName: "Dublin City Rowing Club", rowerUids: ["seed-masters-w02"], elapsedSeconds: 780 },
    { boatId: "seed-masters-boat-09", bowNumber:  9, categoryId: "Women • Masters Open • 1x", boatClass: "1x", boatSize: 1, clubName: "Galway Rowing Club",      rowerUids: ["seed-masters-w03"], elapsedSeconds: 815 },
    { boatId: "seed-masters-boat-20", bowNumber: 20, categoryId: "Women • Masters Open • 1x", boatClass: "1x", boatSize: 1, clubName: "Lee Valley Rowing Club",  rowerUids: ["seed-masters-w04"], elapsedSeconds: 1010 },

    // ── Men • Masters Open • 2x ───────────────────────────────────────────────
    // Every crew is mixed-age. The first two both average into band B, so the
    // band sub-filter has more than one boat to show.
    { boatId: "seed-masters-boat-10", bowNumber: 10, categoryId: "Men • Masters Open • 2x", boatClass: "2x", boatSize: 2, clubName: "Neptune Rowing Club",     rowerUids: ["seed-masters-m07", "seed-masters-m08"], elapsedSeconds: 662 },
    { boatId: "seed-masters-boat-11", bowNumber: 11, categoryId: "Men • Masters Open • 2x", boatClass: "2x", boatSize: 2, clubName: "Lee Valley Rowing Club",  rowerUids: ["seed-masters-m09", "seed-masters-m10"], elapsedSeconds: 658 },
    { boatId: "seed-masters-boat-12", bowNumber: 12, categoryId: "Men • Masters Open • 2x", boatClass: "2x", boatSize: 2, clubName: "Dublin City Rowing Club", rowerUids: ["seed-masters-m11", "seed-masters-m12"], elapsedSeconds: 712 },
    { boatId: "seed-masters-boat-13", bowNumber: 13, categoryId: "Men • Masters Open • 2x", boatClass: "2x", boatSize: 2, clubName: "Galway Rowing Club",      rowerUids: ["seed-masters-m13", "seed-masters-m14"], elapsedSeconds: 730 },
    // 36 + 44 averages to 40, exactly as 48 + 32 does on bow 10 — same band,
    // same handicap to the millisecond, so these two are separated by raw time
    // alone and the 8s between them survives the adjustment untouched.
    { boatId: "seed-masters-boat-21", bowNumber: 21, categoryId: "Men • Masters Open • 2x", boatClass: "2x", boatSize: 2, clubName: "Neptune Rowing Club",     rowerUids: ["seed-masters-m28", "seed-masters-m29"], elapsedSeconds: 670 },

    // ── Men • Masters Open • 2- ───────────────────────────────────────────────
    // The sweep pair takes the single's 0.025 coefficient rather than the
    // double's 0.0216, so a band F crew claws back 102s over 3000m: 70s adrift
    // on the stopwatch, 8s clear on handicap.
    { boatId: "seed-masters-boat-22", bowNumber: 22, categoryId: "Men • Masters Open • 2-", boatClass: "2-", boatSize: 2, clubName: "Lee Valley Rowing Club",  rowerUids: ["seed-masters-m23", "seed-masters-m24"], elapsedSeconds: 690 },
    { boatId: "seed-masters-boat-23", bowNumber: 23, categoryId: "Men • Masters Open • 2-", boatClass: "2-", boatSize: 2, clubName: "Galway Rowing Club",      rowerUids: ["seed-masters-m25", "seed-masters-m26"], elapsedSeconds: 760 },

    // ── Men • Masters Open • 4x+ ──────────────────────────────────────────────
    // The Dublin quad averages 60.5, which USRowing drops to 60 — band F, not G.
    // A coxswain, were one modelled, would not count toward the average.
    { boatId: "seed-masters-boat-14", bowNumber: 14, categoryId: "Men • Masters Open • 4x+", boatClass: "4x+", boatSize: 4, clubName: "Neptune Rowing Club",     rowerUids: ["seed-masters-m15", "seed-masters-m16", "seed-masters-m17", "seed-masters-m18"], elapsedSeconds: 620 },
    { boatId: "seed-masters-boat-15", bowNumber: 15, categoryId: "Men • Masters Open • 4x+", boatClass: "4x+", boatSize: 4, clubName: "Dublin City Rowing Club", rowerUids: ["seed-masters-m19", "seed-masters-m20", "seed-masters-m21", "seed-masters-m22"], elapsedSeconds: 665 },

    // ── Senior — no handicap anywhere, in any view ────────────────────────────
    // Jake's stopwatch is the quicker of the two, but a 10s penalty puts his
    // official time behind Ciarán's.
    { boatId: "seed-masters-boat-16", bowNumber: 16, categoryId: "Men • Senior Open • 1x",   boatClass: "1x", boatSize: 1, clubName: "Neptune Rowing Club",  rowerUids: ["test-rower-002"], elapsedSeconds: 705, externalDobs: ["1998-07-22"] },
    { boatId: "seed-masters-boat-17", bowNumber: 17, categoryId: "Men • Senior Open • 1x",   boatClass: "1x", boatSize: 1, clubName: "Vesper Boat Club",     rowerUids: ["test-rower-003"], elapsedSeconds: 698, adjustmentSeconds: 10, externalDobs: ["2002-11-08"] },
    { boatId: "seed-masters-boat-18", bowNumber: 18, categoryId: "Women • Senior Open • 1x", boatClass: "1x", boatSize: 1, clubName: "Neptune Rowing Club",  rowerUids: ["test-rower-001"], elapsedSeconds: 742, externalDobs: ["2000-03-15"] },
];

async function seedMastersRegatta() {
    console.log("\n── Masters & senior regatta (finished) ──────────────");

    const now     = new Date();
    const startAt = MASTERS_EVENT_START;
    const endAt   = new Date(startAt.getTime() + 8 * 3_600_000);
    const closeAt = new Date(startAt.getTime() - 7 * 86_400_000);

    // ── Rowers ───────────────────────────────────────────────────────────────
    for (const r of MASTERS_ROWERS) {
        const dateOfBirth = dobForAge(r.age);
        const email = `${r.uid}@test.com`;

        await db.doc(`users/${r.uid}`).set({
            uid:         r.uid,
            email,
            displayName: r.displayName,
            fullName:    r.displayName,
            gender:      r.gender,
            dateOfBirth,
            birthYear:   Number(dateOfBirth.slice(0, 4)),
            ageGroup:    "masters",
            isMinor:     false,
            consent: {
                termsAcceptedAt:             NOW,
                privacyAcceptedAt:           NOW,
                performanceTrackingAccepted: true,
                dataSharingAccepted:         false,
                givenBy:                     "self",
                givenByUid:                  r.uid,
                updatedAt:                   NOW,
            },
            permissions: {
                shareWithCoaches:      true,
                shareWithUniversities: false,
                shareWithFederations:  false,
            },
            roles: {
                rower: {
                    clubMemberships: [{
                        clubId:           r.clubId,
                        clubName:         r.clubName,
                        clubShortName:    r.clubShortName,
                        federationId:     "fed-rowing-ireland",
                        role:             "rower",
                        membershipStatus: "active",
                        joinedAt:         NOW,
                    }],
                    stats:        {},
                    performances: {},
                },
            },
            status:      { isActive: true, isVerified: true },
            hasSeenTour: false,
            createdAt:   NOW,
            updatedAt:   NOW,
        });

        await db.doc(`clubs/${r.clubId}/members/${r.uid}`).set({
            uid:         r.uid,
            clubId:      r.clubId,
            displayName: r.displayName,
            email,
            role:        "rower",
            status:      "active",
            joinedAt:    NOW,
            updatedAt:   NOW,
        });

        try {
            await auth.createUser({ uid: r.uid, email, password: "Test1234!", displayName: r.displayName, emailVerified: true });
        } catch (e: any) {
            if (e.code === "auth/uid-already-exists" || e.code === "auth/email-already-exists") {
                await auth.updateUser(r.uid, { email, displayName: r.displayName, emailVerified: true });
            } else {
                throw e;
            }
        }
    }
    console.log(`  ✓ ${MASTERS_ROWERS.length} masters rowers (ages ${Math.min(...MASTERS_ROWERS.map(r => r.age))}–${Math.max(...MASTERS_ROWERS.map(r => r.age))}, password Test1234!)`);

    // ── Event ────────────────────────────────────────────────────────────────
    const categories = [
        { id: "Men • Masters Open • 1x",   name: "Men • Masters Open • 1x"   },
        { id: "Women • Masters Open • 1x", name: "Women • Masters Open • 1x" },
        { id: "Men • Masters Open • 2x",   name: "Men • Masters Open • 2x"   },
        { id: "Men • Masters Open • 2-",   name: "Men • Masters Open • 2-"   },
        { id: "Men • Masters Open • 4x+",  name: "Men • Masters Open • 4x+"  },
        { id: "Men • Senior Open • 1x",    name: "Men • Senior Open • 1x"    },
        { id: "Women • Senior Open • 1x",  name: "Women • Senior Open • 1x"  },
    ];

    await db.doc(`events/${MASTERS_EVENT_ID}`).set({
        id:                 MASTERS_EVENT_ID,
        name:               "Blackrock Masters & Senior Head 2026",
        location:           "River Lee, Blackrock, Cork",
        description:        "Head race over 3000m. One masters bracket per boat class — crews of any ages race together, and results are shown both raw and on USRowing handicap.",
        lengthMeters:       MASTERS_DISTANCE_M,
        status:             "finished",
        clubId:             "club-neptune",
        hostId:             "seed-host-001",
        createdByUid:       "seed-host-001",
        createdByName:      "Seed Host",
        categories,
        // The app writes "Live" / "Category" / "Event" — see RaceTab.tsx.
        resultsPublishMode: "Live",
        bowsAssigned:       true,
        registrationOpen:   false,
        startAt:            Timestamp.fromDate(startAt),
        endAt:              Timestamp.fromDate(endAt),
        closeAt:            Timestamp.fromDate(closeAt),
        createdAt:          Timestamp.fromDate(now),
        updatedAt:          Timestamp.fromDate(now),
    });
    console.log(`  ✓ ${MASTERS_EVENT_ID} — "Blackrock Masters & Senior Head 2026" [finished, ${MASTERS_DISTANCE_M}m, ${categories.length} categories]`);

    // ── Boats ────────────────────────────────────────────────────────────────
    const raceStart = startAt.getTime() + 2 * 3_600_000;

    for (const crew of MASTERS_CREWS) {
        const dnf = crew.status === "dnf";
        const adjustmentMs = crew.adjustmentSeconds ?? 0;

        // Staggered starts, as a head race is rowed.
        const startedAt  = raceStart + crew.bowNumber * 20_000;
        const finishedAt = dnf ? null : startedAt + crew.elapsedSeconds * 1000;

        // Ages come from the roster, so the band and handicap below can never
        // drift from the dates of birth actually written above.
        const ages = crew.rowerUids.map((uid, i) =>
            ROWER_BY_UID.get(uid)?.age
            ?? (MASTERS_EVENT_YEAR - Number((crew.externalDobs ?? [])[i]?.slice(0, 4))),
        );
        const avgAge = Math.floor(ages.reduce((a, b) => a + b, 0) / ages.length);

        const isMasters = crew.categoryId.includes("Masters");
        const band      = isMasters ? bandForAge(avgAge) : null;
        const per1000   = band ? Number(handicapPer1000(avgAge, HANDICAP_K[crew.boatClass]).toFixed(3)) : null;
        const hcpMs     = band ? handicapMs(avgAge, crew.boatClass, MASTERS_DISTANCE_M) : null;

        await db.doc(`events/${MASTERS_EVENT_ID}/boats/${crew.boatId}`).set({
            id:            crew.boatId,
            eventId:       MASTERS_EVENT_ID,
            bowNumber:     crew.bowNumber,
            boatSize:      crew.boatSize,
            category:      crew.categoryId,
            categoryId:    crew.categoryId,
            categoryName:  crew.categoryId,
            clubName:      crew.clubName,
            rowerUids:     crew.rowerUids,
            status:        dnf ? "dnf" : "finished",
            activeRunId:   null,
            startedAt,
            finishedAt,
            // Matches what computeElapsedMs stores — the stopwatch plus the
            // adjustment. The results pages recompute from the timestamps.
            elapsedMs:     dnf ? null : crew.elapsedSeconds * 1000 + adjustmentMs * 1000,
            adjustmentMs,
            inviteCode:    null,
            invitedEmails: [],
            // Written by computeMastersHandicap in a real event.
            mastersAvgAge:           band ? avgAge   : null,
            mastersBand:             band,
            mastersHandicapPer1000s: per1000,
            mastersHandicapMs:       hcpMs,
            createdAt:     Timestamp.fromDate(now),
            updatedAt:     Timestamp.fromDate(now),
        });

        const names = crew.rowerUids.map(uid => ROWER_BY_UID.get(uid)?.displayName ?? uid).join(" / ");
        const timeLabel = dnf
            ? "DNF"
            : `${fmtMMSS(crew.elapsedSeconds * 1000 + adjustmentMs * 1000)}` +
              (hcpMs != null ? ` → ${fmtMMSS(crew.elapsedSeconds * 1000 + adjustmentMs * 1000 - hcpMs)} (−${(hcpMs / 1000).toFixed(1)}s)` : "");
        console.log(
            `  ✓ #${String(crew.bowNumber).padStart(2)} ${crew.categoryId.padEnd(28)} ` +
            `${band ? `M${band} avg ${avgAge}`.padEnd(12) : "senior".padEnd(12)} ${timeLabel.padEnd(30)} ${names}`,
        );
    }
}

/** "11:50.0" — matches how the results cards print a time. */
function fmtMMSS(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}.${Math.floor((ms % 1000) / 100)}`;
}

// ─── Concept2 Logbook links ───────────────────────────────────────────────────
// An indoor entry is refused unless the athlete's Concept2 Logbook is connected,
// and the gate reads the OAuth token bundle at users/{uid}/private/concept2 —
// NOT the `concept2` mirror on the user document, which is only what the UI
// renders. The two can disagree, and when they do the tokens are right.
//
// Three states are seeded on purpose, because all three happen for real:
//   linked      tokens + mirror. Can enter.
//   mirrorOnly  mirror says connected, tokens gone. The UI used to let these
//               athletes through and the entry was then refused; both now say no.
//   none        neither. The ordinary "connect it first" path.

type Concept2State = "linked" | "mirrorOnly" | "none";

const CONCEPT2_LINKS: Array<{ uid: string; username: string; state: Concept2State }> = [
    { uid: "test-rower-001", username: "aoife_murphy",   state: "linked"     },
    { uid: "test-rower-002", username: "ciaran_walsh",   state: "linked"     },
    { uid: "test-rower-005", username: "conor_doyle",    state: "linked"     },
    { uid: "test-rower-006", username: "siobhan_os",     state: "linked"     },
    { uid: "test-rower-009", username: "p_gallagher",    state: "linked"     },
    { uid: "test-rower-014", username: "d_sheehan",      state: "linked"     },
    { uid: "test-rower-013", username: "daithi_om",      state: "linked"     },
    // The bug this caught: the mirror says connected, the tokens are gone.
    { uid: "test-rower-007", username: "eamonn_fitz",    state: "mirrorOnly" },
    // An entrant in the seeded series, so their Logbook has to work.
    { uid: "test-rower-015", username: "t_hennessy",     state: "linked"     },
    // US-only (Vesper), and linked — so the Concept2 gate lets them through to
    // the club picker, where a Rowing Ireland series has nothing to offer them.
    { uid: "test-rower-003", username: "jake_anderson",  state: "linked"     },
    // Never connected — the plain gate.
    { uid: "test-rower-011", username: "",               state: "none"       },
];

async function seedConcept2Links() {
    console.log("\n── Concept2 Logbook links ───────────────────────────");

    const now = Timestamp.fromDate(new Date());

    for (const link of CONCEPT2_LINKS) {
        const tokenRef  = db.doc(`users/${link.uid}/private/concept2`);
        const c2UserId  = 900_000 + Number(link.uid.slice(-3));

        if (link.state === "linked") {
            await tokenRef.set({
                c2UserId,
                c2Username:   link.username,
                accessToken:  `seed-access-${link.uid}`,
                refreshToken: `seed-refresh-${link.uid}`,
                // Far enough out that getValidAccessToken never tries to refresh
                // against the real Concept2 API during a local test.
                expiresAt:    Timestamp.fromDate(new Date(Date.now() + 365 * 86_400_000)),
                scope:        "user:read,results:read",
                linkedAt:     now,
            });
            await db.doc(`concept2Links/${c2UserId}`).set({ uid: link.uid, linkedAt: now });
        } else {
            await tokenRef.delete().catch(() => { /* nothing to remove */ });
        }

        if (link.state === "linked" || link.state === "mirrorOnly") {
            await db.doc(`users/${link.uid}`).set(
                { concept2: { linked: true, username: link.username || "unknown", linkedAt: now } },
                { merge: true },
            );
        } else {
            await db.doc(`users/${link.uid}`).set(
                { concept2: FieldValue.delete() },
                { merge: true },
            );
        }

        console.log(`  ✓ ${link.uid.padEnd(16)} ${link.state}`);
    }
}

// ─── Retired fixtures ─────────────────────────────────────────────────────────
// Indoor racing is seeded only as a series now. These two standalone erg events
// were seeded by earlier versions of this script, and because seeding is
// idempotent through fixed document ids, dropping the seeder that wrote them is
// not enough to remove them — nothing overwrites a document that is no longer
// written. They have to be deleted explicitly, or every re-seed leaves them
// sitting in the events list contradicting the thing this script now sets up.
//
// Safe to keep here indefinitely: deleting an id that is already gone is a no-op.

const RETIRED_EVENT_IDS = ["seed-event-erg-001", "seed-event-erg-002"];

async function retireStandaloneErgEvents() {
    console.log("\n── Retiring standalone erg events ───────────────────");

    for (const eventId of RETIRED_EVENT_IDS) {
        const ref = db.doc(`events/${eventId}`);
        if (!(await ref.get()).exists) continue;

        // Subcollections do not go with the parent, so they would otherwise be
        // orphaned under a deleted event.
        for (const sub of ["boats", "ergScores", "rowerCategorySignups"]) {
            const removed = await clearCollection(`events/${eventId}/${sub}`);
            if (removed) console.log(`  · ${eventId}/${sub}: ${removed} removed`);
        }
        await ref.delete();
        console.log(`  ✓ ${eventId} deleted — indoor racing is series-only now`);
    }
}

// ─── Indoor series ────────────────────────────────────────────────────────────
// A series is a calendar of erg events entered ONCE. The entry lives at
// /indoorSeries/{id}/entries/{uid} and doubles as the standings row; each event
// still holds an ordinary boatSize-1 entry, because that is what a Concept2
// score attaches to.
//
// Points are (actualSpeed / baseSpeed)³ × baseScore — power, not speed, which is
// why a 1% faster piece is worth about 3% more. They are computed here with the
// same arithmetic as functions/src/indoorSeries/points.ts so the seeded
// standings agree with what a re-score would produce.

/** ms per 500m → m/s. */
function baseSpeed(paceMsPer500: number): number {
    return 500 / (paceMsPer500 / 1000);
}

/**
 * The distance curve, mirrored from functions/src/indoorSeries/points.ts.
 *
 * A stored target is a 2k anchor; each stage is judged against that anchor plus
 * the offset for its own distance. Seeding without this would write standings
 * that a re-score immediately contradicts.
 */
const ANCHOR_DISTANCE_METERS = 2000;

const DISTANCE_OFFSET_SECONDS: Array<[number, number]> = [
    [100, -6], [500, -10], [1000, -5], [2000, 0], [6000, 8], [10000, 12],
];

function offsetSecondsFor(distanceMeters: number): number {
    const curve = DISTANCE_OFFSET_SECONDS;
    if (distanceMeters <= curve[0][0]) return curve[0][1];
    if (distanceMeters >= curve[curve.length - 1][0]) return curve[curve.length - 1][1];
    for (let i = 1; i < curve.length; i += 1) {
        const [x1, y1] = curve[i - 1];
        const [x2, y2] = curve[i];
        if (distanceMeters <= x2) return y1 + ((distanceMeters - x1) / (x2 - x1)) * (y2 - y1);
    }
    return 0;
}

function paceForDistance(anchorMsPer500: number, distanceMeters: number): number {
    return anchorMsPer500
        + (offsetSecondsFor(distanceMeters) - offsetSecondsFor(ANCHOR_DISTANCE_METERS)) * 1000;
}

function seriesPoints(distanceMeters: number, timeMs: number, targetMsPer500: number, baseScore: number): number {
    const actual = distanceMeters / (timeMs / 1000);
    return Math.round((actual / baseSpeed(targetMsPer500)) ** 3 * baseScore);
}

/** "1:30" → 90000. Kept local so the fixture reads the way a host types. */
function pace(text: string): number {
    const [m, s] = text.split(":");
    return (Number(m) * 60 + Number(s)) * 1000;
}

async function seedIndoorSeries() {
    console.log("\n── Indoor series ────────────────────────────────────");

    const now = new Date();
    const day = 86_400_000;

    const SERIES_ID = "seed-series-001";
    const PAID_ID   = "seed-series-002";

    // Categories carry their own target split: a 1:30 man and a 1:41 woman who
    // both hit their standard score exactly the same, which is the whole reason
    // the split is per category rather than per event.
    // Targets are written per category AND per distance — the same shape the
    // wizard now stores, taken from targetPaces.json so the seeded series looks
    // like one a host actually made.
    const categories = [
        {
            id: "Men • Senior Open", name: "Men • Senior Open",
            basePaceMsPer500: pace("1:32"),
            paces: {
                "100": pace("1:26"), "500": pace("1:22"), "1000": pace("1:27"),
                "2000": pace("1:32"), "6000": pace("1:40"),
                "10000": pace("1:44"),
            },
        },
        {
            id: "Women • Senior Open", name: "Women • Senior Open",
            basePaceMsPer500: pace("1:46"),
            paces: {
                "100": pace("1:40"), "500": pace("1:36"), "1000": pace("1:41"),
                "2000": pace("1:46"), "6000": pace("1:54"),
                "10000": pace("1:58"),
            },
        },
        {
            id: "Men • Masters B Open", name: "Men • Masters B Open",
            basePaceMsPer500: pace("1:38"),
            paces: {
                "100": pace("1:32"), "500": pace("1:28"), "1000": pace("1:33"),
                "2000": pace("1:38"), "6000": pace("1:46"),
                "10000": pace("1:50"),
            },
        },
    ];

    // The calendar. Twelve stages, because the stage strip has to survive a
    // calendar that will not fit on screen and there is no way to see whether it
    // does with four.
    //
    // Base scores are what the host types; athletes never see them. What they see
    // is the multiplier against the CHEAPEST stage — 250 here — shown to one
    // decimal and hidden entirely below 1.1×. The spread below is chosen to put
    // every case on screen at once:
    //
    //   250 → 1.0×   no badge (the baseline itself)
    //   262 → 1.05×  no badge (just under the threshold — the near miss)
    //   275 → 1.1×   "1.1×"   (exactly on it)
    //   375 → 1.5×   "1.5×"   (a decimal)
    //   500 → 2×     "2×"     (a round one)
    //  3000 → 12×    "12×"    (a 6k is worth a lot of 500s)
    const events = [
        // ── Behind us, and scored ────────────────────────────────────────────
        { id: "seed-series-ev-1",  distance: 2000, baseScore: 1000, startOffset: -40 * day, endOffset: -30 * day },
        { id: "seed-series-ev-2",  distance:  500, baseScore:  250, startOffset: -20 * day, endOffset: -14 * day },
        // ── Open right now ───────────────────────────────────────────────────
        { id: "seed-series-ev-3",  distance: 6000, baseScore: 3000, startOffset:  -3 * day, endOffset:   4 * day },
        // ── Still to come ────────────────────────────────────────────────────
        { id: "seed-series-ev-4",  distance: 1000, baseScore:  500, startOffset:  20 * day, endOffset:  27 * day },
        // A sprint the host nudged, but not enough to be worth saying.
        { id: "seed-series-ev-5",  distance:  500, baseScore:  262, startOffset:  34 * day, endOffset:  41 * day },
        // And one nudged just far enough that it is.
        { id: "seed-series-ev-6",  distance:  500, baseScore:  275, startOffset:  48 * day, endOffset:  55 * day },
        { id: "seed-series-ev-7",  distance: 1000, baseScore:  375, startOffset:  62 * day, endOffset:  69 * day },
        { id: "seed-series-ev-8",  distance: 2000, baseScore: 1500, startOffset:  76 * day, endOffset:  83 * day },
        { id: "seed-series-ev-9",  distance:  100, baseScore:  250, startOffset:  90 * day, endOffset:  97 * day },
        { id: "seed-series-ev-10", distance: 1000, baseScore:  500, startOffset: 104 * day, endOffset: 111 * day },
        { id: "seed-series-ev-11", distance: 2000, baseScore: 1000, startOffset: 118 * day, endOffset: 125 * day },
        // The finale, worth the most in the series.
        { id: "seed-series-ev-12", distance: 6000, baseScore: 3500, startOffset: 132 * day, endOffset: 139 * day },
    ];

    const seriesStart = new Date(now.getTime() + events[0].startOffset);
    const seriesEnd   = new Date(now.getTime() + events[events.length - 1].endOffset);

    await db.doc(`indoorSeries/${SERIES_ID}`).set({
        id:            SERIES_ID,
        name:          "Neptune Winter Indoor Series",
        description:   "Twelve pieces across the season. Enter once, row whichever you like, and your fastest verified piece in each scores points towards the table. Some stages pay more than others — look for the badge. Prizes go to the club on your entry.",
        location:      "Remote",
        clubId:        "club-neptune",
        hostId:        "seed-host-001",
        createdByUid:  "seed-host-001",
        createdByName: "Seed Host",
        federationId:   "fed-rowing-ireland",
        federationName: "Rowing Ireland",
        season:        seriesStart.getUTCFullYear(),
        status:        "running",
        // Open to anyone — the control against the federation-only series below.
        entryScope:    "public",
        startAt:       Timestamp.fromDate(seriesStart),
        endAt:         Timestamp.fromDate(seriesEnd),
        entryFeeCents: 0,
        categories,
        categoryIds:   categories.map(c => c.id),
        entryCount:    0,   // rewritten below, once the entries are counted
        eventCount:    events.length,
        setupFeeCents: 1000,
        createdAt:     Timestamp.fromDate(seriesStart),
        updatedAt:     Timestamp.fromDate(now),
    });

    for (const [i, ev] of events.entries()) {
        const start = new Date(now.getTime() + ev.startOffset);
        const end   = new Date(now.getTime() + ev.endOffset);
        const status = end < now ? "finished" : start <= now ? "running" : "open";

        await db.doc(`events/${ev.id}`).set({
            id:                   ev.id,
            name:                 `${ev.distance >= 1000 ? `${ev.distance / 1000}km` : `${ev.distance}m`} · ${start.toLocaleDateString("en-IE", { day: "numeric", month: "short", timeZone: "UTC" })}`,
            location:             "Remote",
            description:          "Part of the Neptune Winter Indoor Series.",
            eventType:            "erg",
            ergConfig:            { machineType: "rower", distanceMeters: ev.distance },
            lengthMeters:         ev.distance,
            status,
            clubId:               "club-neptune",
            hostId:               "seed-host-001",
            createdByUid:         "seed-host-001",
            createdByName:        "Seed Host",
            categories:           categories.map(c => ({ id: c.id, name: c.name })),
            resultsPublishMode:   "Live",
            bowsAssigned:         false,
            autoAssignBowNumbers: false,
            startAt:              Timestamp.fromDate(start),
            endAt:                Timestamp.fromDate(end),
            closeAt:              Timestamp.fromDate(end),
            // What makes it part of the series, and what the points engine reads.
            indoorSeriesId:       SERIES_ID,
            seriesIndex:          i + 1,
            ergPoints:            { baseScore: ev.baseScore },
            setupFeeCents:        0,
            createdAt:            Timestamp.fromDate(seriesStart),
            updatedAt:            Timestamp.fromDate(now),
        });
    }

    // The field. `times` is their result in each scored event, in seconds —
    // absent means they did not row that one, which is the common case and the
    // reason a missing event scores nothing rather than zero.
    const FIELD: Array<{
        uid: string; name: string; clubId: string; clubName: string; categoryId: string;
        times: Partial<Record<string, number>>;
    }> = [
        {
            uid: "test-rower-005", name: "Conor Doyle", clubId: "club-neptune", clubName: "Neptune Rowing Club",
            categoryId: "Men • Senior Open",
            times: { "seed-series-ev-1": 368, "seed-series-ev-2": 86, "seed-series-ev-3": 1210 },
        },
        {
            uid: "test-rower-009", name: "Patrick Gallagher", clubId: "club-galway", clubName: "Galway Rowing Club",
            categoryId: "Men • Senior Open",
            times: { "seed-series-ev-1": 378, "seed-series-ev-2": 89 },
        },
        {
            // Two clubs, racing for the second — the representing-club choice
            // matters and is visible in the club table.
            uid: "test-rower-002", name: "Ciarán Walsh", clubId: "club-dcrc", clubName: "Dublin City Rowing Club",
            categoryId: "Men • Senior Open",
            times: { "seed-series-ev-1": 386, "seed-series-ev-3": 1265 },
        },
        {
            uid: "test-rower-001", name: "Aoife Murphy", clubId: "club-neptune", clubName: "Neptune Rowing Club",
            categoryId: "Women • Senior Open",
            times: { "seed-series-ev-1": 420, "seed-series-ev-2": 99, "seed-series-ev-3": 1390 },
        },
        {
            uid: "test-rower-014", name: "Deirdre Sheehan", clubId: "club-neptune", clubName: "Neptune Rowing Club",
            categoryId: "Women • Senior Open",
            times: { "seed-series-ev-1": 427, "seed-series-ev-2": 101 },
        },
        {
            uid: "test-rower-006", name: "Siobhán O'Sullivan", clubId: "club-dcrc", clubName: "Dublin City Rowing Club",
            categoryId: "Women • Senior Open",
            times: { "seed-series-ev-1": 424 },
        },
        {
            uid: "test-rower-013", name: "Daithí Ó'Murchú", clubId: "club-comercial", clubName: "Commercial Rowing Club",
            categoryId: "Men • Masters B Open",
            times: { "seed-series-ev-1": 403, "seed-series-ev-2": 92, "seed-series-ev-3": 1330 },
        },
        {
            // Entered and yet to post anything: the "0 points, nothing scored"
            // state the standings have to render without looking broken.
            uid: "test-rower-015", name: "Tomás Hennessy", clubId: "club-dcrc", clubName: "Dublin City Rowing Club",
            categoryId: "Men • Senior Open",
            times: {},
        },
    ];

    // A changed fixture must not leave orphans behind: score ids derive from the
    // Concept2 result id, and entry ids from the uid.
    for (const ev of events) {
        await clearCollection(`events/${ev.id}/ergScores`);
        await clearCollection(`events/${ev.id}/boats`);
    }
    await clearCollection(`indoorSeries/${SERIES_ID}/entries`);

    let entries = 0;
    let scores  = 0;

    for (const [n, athlete] of FIELD.entries()) {
        const category = categories.find(c => c.id === athlete.categoryId)!;
        const pointsByEvent: Record<string, unknown> = {};
        let totalPoints = 0;
        let eventsScored = 0;

        for (const [i, ev] of events.entries()) {
            const seconds = athlete.times[ev.id];
            const entryId = `series_${athlete.uid}`;
            const timeMs  = seconds ? seconds * 1000 : null;
            const scoreId = `${athlete.uid}__${8_000_000 + n * 20 + i}`;

            // Every entrant holds an entry in every event of the calendar —
            // that is what "enter once" means, and what a score attaches to.
            await db.doc(`events/${ev.id}/boats/${entryId}`).set({
                id:             entryId,
                eventId:        ev.id,
                indoorSeriesId: SERIES_ID,
                categoryId:     athlete.categoryId,
                categoryName:   athlete.categoryId,
                category:       athlete.categoryId,
                clubId:         athlete.clubId,
                clubName:       athlete.clubName,
                boatSize:       1,
                rowerUids:      [athlete.uid],
                createdByUid:   athlete.uid,
                invitedEmails:  [],
                inviteCode:     null,
                status:         "registered",
                adjustmentMs:   0,
                ergBestTimeMs:  timeMs,
                ergBestScoreId: timeMs ? scoreId : null,
                ergScoreCount:  timeMs ? 1 : 0,
                ergLastSyncAt:  Timestamp.fromDate(now),
                mastersAvgAge:           null,
                mastersBand:             null,
                mastersHandicapPer1000s: null,
                mastersHandicapMs:       null,
                createdAt:      Timestamp.fromDate(seriesStart),
                updatedAt:      Timestamp.fromDate(now),
            });

            // The duplicate guard an ordinary entry writes, so a series entrant
            // cannot also enter the same event standalone.
            await db.doc(`events/${ev.id}/rowerCategorySignups/${athlete.uid}__${athlete.categoryId}`).set({
                uid:            athlete.uid,
                categoryId:     athlete.categoryId,
                boatId:         entryId,
                indoorSeriesId: SERIES_ID,
                createdAt:      Timestamp.fromDate(seriesStart),
            });

            if (!timeMs) continue;

            await db.doc(`events/${ev.id}/ergScores/${scoreId}`).set({
                id:             scoreId,
                eventId:        ev.id,
                entryId,
                uid:            athlete.uid,
                categoryId:     athlete.categoryId,
                categoryName:   athlete.categoryId,
                clubId:         athlete.clubId,
                clubName:       athlete.clubName,
                source:         "concept2",
                c2ResultId:     8_000_000 + n * 20 + i,
                c2UserId:       900_000 + Number(athlete.uid.slice(-3)),
                machineType:    "rower",
                workoutType:    "FixedDistanceSplits",
                distanceMeters: ev.distance,
                timeTenths:     Math.round(timeMs / 100),
                timeMs,
                strokeRate:     28 + (n % 5),
                workoutAt:      Timestamp.fromDate(new Date(now.getTime() + ev.endOffset - day)),
                c2Verified:     true,
                importedAt:     Timestamp.fromDate(now),
                status:         "ranked",
            });
            scores += 1;

            // The explicit target for this stage's distance — what the backend
            // will resolve too, so seeded standings survive a re-score.
            const target = category.paces[String(ev.distance) as keyof typeof category.paces]
                ?? paceForDistance(category.basePaceMsPer500, ev.distance);
            const points = seriesPoints(ev.distance, timeMs, target, ev.baseScore);
            pointsByEvent[ev.id] = {
                points,
                timeMs,
                scoreId,
                computedAt: Timestamp.fromDate(now),
            };
            totalPoints += points;
            eventsScored += 1;
        }

        await db.doc(`indoorSeries/${SERIES_ID}/entries/${athlete.uid}`).set({
            uid:            athlete.uid,
            displayName:    athlete.name,
            clubId:         athlete.clubId,
            clubName:       athlete.clubName,
            categoryId:     athlete.categoryId,
            categoryName:   athlete.categoryId,
            enteredAt:      Timestamp.fromDate(seriesStart),
            totalPoints,
            eventsScored,
            pointsByEvent,
            lastComputedAt: Timestamp.fromDate(now),
        });
        entries += 1;

        // The default club their next indoor entry preselects.
        await db.doc(`users/${athlete.uid}`).set(
            { lastRepresentedClubId: athlete.clubId },
            { merge: true },
        );
    }

    await db.doc(`indoorSeries/${SERIES_ID}`).update({ entryCount: entries });

    console.log(`  ✓ ${SERIES_ID}  "Neptune Winter Indoor Series"  ${events.length} stages, ${entries} entrants, ${scores} scores`);
    console.log(`      stage multipliers are derived from the base scores, against the cheapest stage (${Math.min(...events.map(e => e.baseScore))}):`);
    console.log(`      ${events.map((e, i) => {
        const m = e.baseScore / Math.min(...events.map(x => x.baseScore));
        const r = Math.round(m * 10) / 10;
        return `${i + 1}:${r < 1.1 ? "—" : (Number.isInteger(r) ? r : r.toFixed(1)) + "x"}`;
    }).join("  ")}`);

    // ── A paid series with nobody in it, for testing entry checkout ──────────
    const paidStart = new Date(now.getTime() + 2 * day);
    const paidEnd   = new Date(now.getTime() + 60 * day);

    await db.doc(`indoorSeries/${PAID_ID}`).set({
        id:            PAID_ID,
        name:          "Z12 Challenge Sprint Series",
        description:   "Three short pieces, one entry fee. Every athlete is scored against their category's target split, so a 100m sprinter and a 2k specialist can share a table.",
        location:      "Remote",
        clubId:        "club-neptune",
        hostId:        "seed-host-001",
        createdByUid:  "seed-host-001",
        createdByName: "Seed Host",
        federationId:   "fed-rowing-ireland",
        // Carried so the restriction can name the federation to an athlete, who
        // cannot read /federations themselves.
        federationName: "Rowing Ireland",
        season:        paidStart.getUTCFullYear(),
        status:        "open",
        // Federation-only, for testing. Anyone can look at it; only a club in
        // Rowing Ireland can enter, and an athlete with clubs on both sides sees
        // just the eligible one in the picker.
        entryScope:    "federation",
        startAt:       Timestamp.fromDate(paidStart),
        endAt:         Timestamp.fromDate(paidEnd),
        // The host holds acct_test_mock_seed001, so this falls back to a direct
        // charge — a card number is all that is needed to test the flow.
        entryFeeCents: 4000,
        categories,
        categoryIds:   categories.map(c => c.id),
        entryCount:    0,
        eventCount:    3,
        setupFeeCents: 1000,
        createdAt:     Timestamp.fromDate(now),
        updatedAt:     Timestamp.fromDate(now),
    });

    const paidEvents = [
        { id: "seed-paid-series-ev-1", distance:  100, baseScore:  100, start:  2 * day, end: 16 * day },
        { id: "seed-paid-series-ev-2", distance:  500, baseScore:  250, start: 20 * day, end: 34 * day },
        { id: "seed-paid-series-ev-3", distance: 1000, baseScore:  500, start: 40 * day, end: 60 * day },
    ];

    for (const [i, ev] of paidEvents.entries()) {
        const start = new Date(now.getTime() + ev.start);
        const end   = new Date(now.getTime() + ev.end);
        await db.doc(`events/${ev.id}`).set({
            id:                   ev.id,
            name:                 `${ev.distance}m sprint`,
            location:             "Remote",
            description:          "Part of the Z12 Challenge Sprint Series.",
            eventType:            "erg",
            ergConfig:            { machineType: "rower", distanceMeters: ev.distance },
            lengthMeters:         ev.distance,
            status:               "open",
            clubId:               "club-neptune",
            hostId:               "seed-host-001",
            createdByUid:         "seed-host-001",
            createdByName:        "Seed Host",
            categories:           categories.map(c => ({ id: c.id, name: c.name })),
            resultsPublishMode:   "Live",
            bowsAssigned:         false,
            autoAssignBowNumbers: false,
            startAt:              Timestamp.fromDate(start),
            endAt:                Timestamp.fromDate(end),
            closeAt:              Timestamp.fromDate(end),
            indoorSeriesId:       PAID_ID,
            seriesIndex:          i + 1,
            federationId:         "fed-rowing-ireland",
            federationName:       "Rowing Ireland",
            entryScope:           "federation",
            ergPoints:            { baseScore: ev.baseScore },
            setupFeeCents:        0,
            createdAt:            Timestamp.fromDate(now),
            updatedAt:            Timestamp.fromDate(now),
        });
    }

    console.log(`  ✓ ${PAID_ID}  "Z12 Challenge Sprint Series"  3 events, $40 to enter, no entrants yet`);
}

// ─── Run ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log("🌱 Seeding Firebase emulator...");
    console.log(`   Project: z12-website`);
    console.log(`   Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    console.log(`   Auth:      ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);

    await seedFederations();
    await seedClubs();
    await seedAdminUsers();
    await seedUsers();
    await seedMemberships();
    await updateClubCounts();
    await seedTimingUsers();
    await seedTimingEvents();
    await seedMockPerformanceData();
    await seedClubCreationRequests();
    await seedFederationInvites();
    await seedCoachAssignments();
    await seedTrainingSessions();
    await seedStripeTestEvent();
    await seedVesperPaidEvent();
    await seedBookings();
    await seedSeriesGroups();
    await seedSeriesEvents();
    await seedBoatClassFeeEvent();
    await seedMastersRegatta();
    await retireStandaloneErgEvents();
    await seedConcept2Links();
    await seedIndoorSeries();
    await seedMultiRoleFedAdmin();

    console.log("\n✅ Seed complete!\n");

    console.log("Admin accounts (password: Test1234! for all):");
    console.log("─────────────────────────────────────────────");
    for (const u of ADMIN_USERS) {
        console.log(`  ${u.adminRole.padEnd(15)}  ${u.email.padEnd(35)}  ${u.displayName}`);
    }
    console.log(`  ${"federationAdmin".padEnd(15)}  ${"james.mangan@test.com".padEnd(35)}  James Mangan  (+ clubAdmin/club-nyac + coach + guardian, fed-usrowing)`);

    console.log("\nTest accounts (password: Test1234! for all):");
    console.log("─────────────────────────────────────────────");
    for (const u of TEST_USERS) {
        console.log(`  ${u.primaryRole.padEnd(5)}  ${u.email.padEnd(30)}  ${u.displayName}`);
    }

    console.log("\nTiming accounts (password: Test1234! for all):");
    console.log("─────────────────────────────────────────────");
    for (const h of CLUB_ADMIN_USERS) {
        console.log(`  ${"clubAdmin".padEnd(12)}  ${h.email.padEnd(25)}  ${h.displayName}  — ${h.clubId}`);
    }
    for (const t of TIMING_ADMINS) {
        console.log(`  ${"timing admin".padEnd(12)}  ${t.email.padEnd(25)}  ${t.displayName}  → [${t.hostIds.join(", ")}]`);
    }
    console.log(`  ${"rower".padEnd(12)}  ${TIMING_ROWER.email.padEnd(25)}  ${TIMING_ROWER.displayName}`);

    console.log("\nTiming events:");
    console.log("─────────────────────────────────────────────");
    for (const ev of TIMING_EVENTS) {
        console.log(`  events/${ev.id}  "${ev.name}"  [${ev.status}]`);
    }

    console.log("\nSeries events (Regional Series → National Series → National Event):");
    console.log("─────────────────────────────────────────────");
    console.log("  Rowing Ireland — two regions, each with its own National Series");
    console.log("    events/seed-event-regional-001         Munster Regional Series        [regional_series, 3000m, group-munster]");
    console.log("    events/seed-event-regional-002         Leinster Regional Series       [regional_series, 3000m, group-leinster]");
    console.log("    events/seed-event-national-series-001  Munster National Series        [national_series, 3000m, group-munster]");
    console.log("    events/seed-event-national-series-002  Leinster National Series       [national_series, 3000m, group-leinster]");
    console.log("    events/seed-event-national-001         RI National Championships      [national_event,  6000m, no group]");
    console.log("  USRowing — single region, hosted by Vesper (club.admin.vesper@test.com)");
    console.log("    events/seed-event-us-regional-001         Mid-Atlantic Regional Series [regional_series, 3000m, group-us-mid-atlantic]");
    console.log("    events/seed-event-us-national-series-001  Mid-Atlantic National Series [national_series, 3000m, group-us-mid-atlantic]");
    console.log("    events/seed-event-us-national-001         USRowing National Champs     [national_event,  6000m, no group]");
    console.log(`  All carry season=${SERIES_SEASON}, so awardQualifications can bind each tier to the next.`);
    console.log("");

    console.log("Masters & senior regatta (finished, with results):");
    console.log("─────────────────────────────────────────────");
    console.log("  events/seed-event-masters-001       Blackrock Masters & Senior Head 2026  [finished, 3000m, 6 categories]");
    console.log("      18 boats: 15 masters across bands A–H, 3 senior, 1 DNF, 1 with a 10s penalty");
    console.log("      Overall ranks on raw time and shows no handicap at all");
    console.log("      Filter to any masters category: rows carry the handicap and rank on it");
    console.log("      Every masters double and quad is mixed-age — the point of the single bracket");
    console.log("      Masters rowers: seed-masters-m01…m22 / w01…w03 @test.com (password Test1234!)");
    console.log("");

    console.log("Multi-class Irish event (free entry):");
    console.log("─────────────────────────────────────────────");
    console.log("  events/seed-event-multiclass-001    National Rowing Centre Head 2026  [free, 8 categories]");
    console.log("");

    console.log("US paid events:");
    console.log("─────────────────────────────────────────────");
    console.log("  events/seed-event-stripe-001        Harvard Fall Classic 2026  [1x: $50 · 2x: $45]  3 boats held");
    console.log("  events/seed-event-us-vesper-001     Vesper Boathouse Regatta 2026  [1x: $40 · 2x: $35]  1 boat held");
    console.log("");

    console.log("\nIndoor grant (who can create an indoor event or series):");
    console.log("─────────────────────────────────────────────");
    console.log("  club-neptune  allowedEventTypes: [open_water, erg]");
    console.log("      → club.admin.neptune@test.com can run the indoor series wizard at /host/series/new");
    console.log("      every other club is open water only, which is what an absent grant means");

    console.log("\nIndoor series:");
    console.log("─────────────────────────────────────────────");
    console.log("  /series/seed-series-001   Neptune Winter Indoor Series  — running, free, 12 stages, 8 entrants");
    console.log("      badge coverage: none (1.0x), near miss (1.05x), threshold (1.1x), decimal (1.5x), 2x/4x/6x, 12x/14x");
    console.log("      12 stages is enough that the stage strip has to scroll — which is the point of it");
    console.log("  /series/seed-series-002   Z12 Challenge Sprint Series   — open, $40, 3 stages, no entrants");
    console.log("      FEDERATION-ONLY (Rowing Ireland). Anyone can view it; only a Rowing Ireland");
    console.log("      club can enter. rower.one@test.com rows for Neptune (IE) and Vesper (US), so");
    console.log("      her club picker offers Neptune only; rower.three@test.com is Vesper-only and");
    console.log("      is refused outright. seed-series-001 is open to anyone, as the control.");
    console.log("  Host workspace: /host/series/seed-series-001  (sign in as the seed host)");

    console.log("\nConcept2 link state (who can enter an indoor event):");
    console.log("─────────────────────────────────────────────");
    for (const l of CONCEPT2_LINKS) {
        const what = l.state === "linked"
            ? "tokens + mirror — can enter"
            : l.state === "mirrorOnly"
                ? "mirror only, no tokens — must be refused"
                : "not connected — must be prompted";
        console.log(`  ${l.uid.padEnd(16)} ${what}`);
    }

    process.exit(0);
}

main().catch(e => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
});
