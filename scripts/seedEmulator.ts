/**
 * seed-emulator.ts
 *
 * Populates the Firebase emulator with:
 *   - 2 federations (Rowing Ireland, USRowing)
 *   - 8 clubs (mix of Irish and US)
 *   - private config for each club
 *   - 5 admin users (1 platformAdmin, 2 federationAdmins, 2 clubAdmins) with custom claims
 *   - 18 test users (16 rowers + 2 coaches) with realistic clubMemberships
 *   - membership documents for each user
 *   - 1 sample clubCreationRequest (pending)
 *   - 1 sample federationInvite (pending)
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
import { getFirestore, Firestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

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

const HOST_USERS = [
    {
        uid:         "seed-host-001",
        email:       "host@seed.ie",
        displayName: "Seed Host",
        fullName:    "Seed Host",
        gender:      "unknown",
        dateOfBirth: "1990-01-01",
        location:    "National Rowing Centre, Cork",
    },
    {
        uid:         "seed-host-002",
        email:       "host2@seed.ie",
        displayName: "Seed Host Two",
        fullName:    "Seed Host Two",
        gender:      "female",
        dateOfBirth: "1985-07-20",
        location:    "Lee Valley Rowing Club, Cork",
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
        await db.doc(`clubs/${id}`).set({ id, ...data });

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
    console.log("\n── Timing users (hosts & timing admins) ─────────────");

    for (const h of HOST_USERS) {
        await db.doc(`users/${h.uid}`).set({
            uid:         h.uid,
            email:       h.email,
            displayName: h.displayName,
            fullName:    h.fullName,
            primaryRole: "host",
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
                host: { location: h.location },
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

        console.log(`  ✓ ${h.displayName} <${h.email}> [host] — ${h.location}`);
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

    // Make seed-host-001 look like an onboarded US Stripe Connect host
    await db.doc(`users/${HOST_ID}`).update({
        "roles.host.country":                  "US",
        "roles.host.stripeOnboarded":          true,
        "roles.host.stripeConnectedAccountId": "acct_test_mock_seed001",
    });
    console.log(`  ✓ seed-host-001 updated — country: US, stripeOnboarded: true`);

    const categories = [
        { id: "men-senior-1x",   name: "Men • Senior • 1x",   feeCents: 5000 },
        { id: "women-senior-1x", name: "Women • Senior • 1x", feeCents: 5000 },
        { id: "men-senior-2x",   name: "Men • Senior • 2x",   feeCents: 4500 },
    ];

    await db.doc(`events/${EVENT_ID}`).set({
        id:                 EVENT_ID,
        name:               "Cork Open Head 2026",
        location:           "National Rowing Centre, Cork",
        description:        "Open head race on a 2000m course. All senior categories welcome.",
        lengthMeters:       2000,
        status:             "open",
        verificationStatus: "pending",
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
    console.log(`  ✓ ${EVENT_ID} — "Cork Open Head 2026" [open] closes ${closeAt.toLocaleDateString("en-IE")}`);

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
            clubName:     "Neptune Rowing Club",
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
            clubName:     "Neptune Rowing Club",
            boatSize:     1,
            ...calcFeeBreakdown(5000),
        },
        {
            boatId:       "seed-stripe-boat-003",
            paymentId:    "seed-stripe-pay-003",
            piId:         "pi_test_seed_003",
            rowerUids:    ["test-rower-005", "test-rower-007"],
            creatorUid:   "test-rower-005",
            categoryId:   "men-senior-2x",
            categoryName: "Men • Senior • 2x",
            clubName:     "Neptune Rowing Club",
            boatSize:     2,
            ...calcFeeBreakdown(4500),
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

    console.log("\n✅ Seed complete!\n");

    console.log("Admin accounts (password: Test1234! for all):");
    console.log("─────────────────────────────────────────────");
    for (const u of ADMIN_USERS) {
        console.log(`  ${u.adminRole.padEnd(15)}  ${u.email.padEnd(35)}  ${u.displayName}`);
    }

    console.log("\nTest accounts (password: Test1234! for all):");
    console.log("─────────────────────────────────────────────");
    for (const u of TEST_USERS) {
        console.log(`  ${u.primaryRole.padEnd(5)}  ${u.email.padEnd(30)}  ${u.displayName}`);
    }

    console.log("\nTiming accounts (password: Test1234! for all):");
    console.log("─────────────────────────────────────────────");
    for (const h of HOST_USERS) {
        console.log(`  ${"host".padEnd(12)}  ${h.email.padEnd(25)}  ${h.displayName}`);
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
    console.log("");

    process.exit(0);
}

main().catch(e => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
});
