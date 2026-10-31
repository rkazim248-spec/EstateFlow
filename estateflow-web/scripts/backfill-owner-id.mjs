#!/usr/bin/env node
/**
 * Backfills `ownerId` on legacy top-level properties and clients.
 *
 * The Flutter app created records before the web app existed; those documents
 * have no owner. The owner-scoped rules make such records invisible, so run
 * this first if you intend to switch to firestore.owner-scoped.rules.
 *
 * This assigns every unowned record to ONE Firebase user. That is intentional:
 * the current workspace is shared, and there is no historical data that maps a
 * record to its real creator. Review the dry-run output before committing.
 *
 * Setup:
 *   cd estateflow-web
 *   npm install --no-save firebase-admin
 *   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\service-account.json"
 *
 * Usage:
 *   node scripts/backfill-owner-id.mjs --uid <firebase-uid>            # dry run
 *   node scripts/backfill-owner-id.mjs --uid <firebase-uid> --commit   # write
 *
 * Optional:
 *   --project estateflow-df9e9
 */

import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function readArgument(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const uid = readArgument("uid");
const projectId =
  readArgument("project") ?? process.env.FIREBASE_PROJECT_ID ?? "estateflow-df9e9";
const commit = process.argv.includes("--commit");

if (!uid) {
  console.error(
    "Missing --uid. Usage: node scripts/backfill-owner-id.mjs --uid <firebase-uid> [--commit]",
  );
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "Set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON file with Firestore access.",
  );
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();

const COLLECTIONS = ["properties", "clients"];
let totalUnowned = 0;
let totalWritten = 0;

for (const collectionName of COLLECTIONS) {
  const snapshot = await db.collection(collectionName).get();
  const unowned = snapshot.docs.filter((document) => {
    const ownerId = document.data().ownerId;
    return typeof ownerId !== "string" || ownerId.trim() === "";
  });

  totalUnowned += unowned.length;
  console.log(
    `${collectionName}: ${snapshot.size} documents, ${unowned.length} without ownerId.`,
  );

  if (unowned.length === 0) continue;

  for (const document of unowned.slice(0, 10)) {
    console.log(`  would set ownerId=${uid} on ${collectionName}/${document.id}`);
  }
  if (unowned.length > 10) {
    console.log(`  …and ${unowned.length - 10} more.`);
  }

  if (!commit) continue;

  for (let index = 0; index < unowned.length; index += 400) {
    const batch = db.batch();
    for (const document of unowned.slice(index, index + 400)) {
      batch.update(document.ref, {
        ownerId: uid,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    totalWritten += Math.min(400, unowned.length - index);
    console.log(
      `  committed ${Math.min(index + 400, unowned.length)}/${unowned.length} in ${collectionName}.`,
    );
  }
}

if (!commit) {
  console.log(
    `\nDry run complete. ${totalUnowned} document(s) would be assigned to uid ${uid}.`,
  );
  console.log("Re-run with --commit to write the changes.");
} else {
  console.log(`\nDone. Wrote ownerId on ${totalWritten} document(s).`);
  console.log(
    "Now copy firestore.owner-scoped.rules to firestore.rules and deploy the rules.",
  );
}
