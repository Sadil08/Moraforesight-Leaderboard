import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { prisma } from "../lib/prisma";

type StudentRow = { externalId: string; name?: string };
type GroupRow = { teamName: string; students: StudentRow[] };

const groups: GroupRow[] = [
  {
    teamName: "Group 1",
    students: [
      { externalId: "MFA0252", name: "Kusal Darshana" },
      { externalId: "MFA0276", name: "Duonotha Idantha Nawarathne" },
      { externalId: "MFB0458", name: "Hussain Shiraj Rizal Ramly" },
      { externalId: "MFD1252", name: "Sobanahandi Nehan Wijesekara" },
      { externalId: "MFD1343", name: "Uss Arambage Thiviru Sandil" },
      { externalId: "MFD1314", name: "T.Nesandi Nihansa Rajamanna" },
      { externalId: "MFB0419", name: "Tonali Anjana" },
      { externalId: "MFD1431", name: "Wethum Hansana" },
      { externalId: "MFC1016", name: "Chanuga Rathnayake" },
      { externalId: "MFB0640", name: "Binula Uthmika" },
    ],
  },
  {
    teamName: "Pantheons",
    students: [
      { externalId: "MFD1372", name: "Pabasara Madushan" },
      { externalId: "MFB0462", name: "Isuru Samarasingha" },
      { externalId: "MFA0012", name: "Dinuki Akithya" },
      { externalId: "MFA0112", name: "Avishna Anantharuban" },
      { externalId: "MFA0141", name: "Bihansi Senarath Yapa" },
      { externalId: "MFC0846", name: "Mohamed Ansif" },
      { externalId: "MFA0171", name: "Chaniru Nethdinu" },
      { externalId: "MFB0626", name: "Methika Lesan Hansaja" },
      { externalId: "MFB0686", name: "L.N. Methunija" },
      { externalId: "MFB0715", name: "M.J.I. Fernando" },
    ],
  },
  {
    teamName: "Group 3",
    students: [
      { externalId: "MFC1154" },
      { externalId: "MFA0232" },
      { externalId: "MFA0368" },
      { externalId: "MFC0767" },
      { externalId: "MFA0362" },
      { externalId: "MFB0448" },
      { externalId: "MFB0445" },
      { externalId: "MFB0427" },
      { externalId: "MFB0570" },
      { externalId: "MFB0612" },
    ],
  },
  {
    teamName: "Group 4",
    students: [
      { externalId: "MFB0630" },
      { externalId: "MFD1472" },
      { externalId: "MFD1209" },
      { externalId: "MFB0501" },
      { externalId: "MFD1228" },
      { externalId: "MFB0651" },
      { externalId: "MFB0588" },
      { externalId: "MFD1280" },
      { externalId: "MFD1287" },
    ],
  },
  {
    teamName: "Group 5",
    students: [
      { externalId: "MFB0567" },
      { externalId: "MFB0674" },
      { externalId: "MFC0868" },
      { externalId: "MFA0313" },
      { externalId: "MFA0217" },
      { externalId: "MFB0436" },
      { externalId: "MFA0335" },
      { externalId: "MFD1245" },
      { externalId: "MFD1228" }, // duplicate of Group 4's MFD1228 — see console warning below
    ],
  },
  {
    teamName: "FitAura",
    students: [
      { externalId: "MFB0721", name: "Sechitha Wathmika" },
      { externalId: "MGB0521", name: "Pawara Nethsilu" },
      { externalId: "MFC1112", name: "Rishan Kaushika" },
      { externalId: "MFC0851", name: "M.F.M. Rahid" },
      { externalId: "MFD1348", name: "Chanul" },
      { externalId: "MFD1230", name: "Shevi" },
      { externalId: "MFA0102", name: "Nethmi Malmeepa" },
      { externalId: "MFB0614", name: "Nadula Nimnaka" },
      { externalId: "MFD1169", name: "Sandanindu Batheegama" },
      { externalId: "MFD1144", name: "Neyden Umar" },
    ],
  },
  {
    teamName: "ECLIPSE",
    students: [
      { externalId: "MFA0108" },
      { externalId: "MFA0373" },
      { externalId: "MFD1213" },
      { externalId: "MFD1200" },
      { externalId: "MFC0893" },
      { externalId: "MFA0145" },
      { externalId: "MFD1142" },
      { externalId: "MFB0482" },
      { externalId: "MFD1182" },
      { externalId: "MFC0780" },
    ],
  },
  {
    teamName: "Lumora",
    students: [
      { externalId: "MFA0323", name: "Nawanga Hansaraj" },
      { externalId: "MFD1242", name: "Sithika Deelana Jayasinghe" },
      { externalId: "MFB0603", name: "Kirubakaran Aakesh" },
      { externalId: "MFB0385", name: "Dharaka Sandayuru" },
      { externalId: "MFB0398", name: "Henujan" },
      { externalId: "MFA0207", name: "Danunika" },
      { externalId: "MFB0411", name: "Imalya" },
      { externalId: "MFD1227", name: "Shavindi" },
      { externalId: "MFD1428", name: "Thenula Devmith" },
      { externalId: "MFD1429", name: "Dilina Weragama" },
    ],
  },
  {
    teamName: "Group 9",
    students: [
      { externalId: "MFA0122" },
      { externalId: "MFA0196" },
      { externalId: "MFC0998" },
      { externalId: "MFA0177" },
      { externalId: "MFC0865" },
      { externalId: "MFD1302" },
      { externalId: "MFD1317" },
      { externalId: "MFC0987" },
      { externalId: "MFC1106" },
      { externalId: "MFD1154" },
    ],
  },
  {
    teamName: "Group 10",
    students: [
      { externalId: "MFD1267", name: "Sunira" },
      { externalId: "MFB0703", name: "Dinuja" },
      { externalId: "MFB0528", name: "Kaveen" },
      { externalId: "MFB0701", name: "Pesandu" },
      { externalId: "MFB0504", name: "Saswidu" },
      { externalId: "MFD1476", name: "Pevin" },
      { externalId: "MFC1113", name: "Risinu" },
      { externalId: "MFC0911", name: "Neha" },
      { externalId: "MFB0534", name: "Divyanga" },
      { externalId: "MFD1201", name: "Nethsara" },
    ],
  },
];

async function main() {
  for (const group of groups) {
    const team = await prisma.team.create({ data: { name: group.teamName } });
    console.log(`Created team: ${team.name}`);

    for (const student of group.students) {
      try {
        await prisma.student.create({
          data: {
            name: student.name ?? student.externalId,
            externalId: student.externalId,
            teamId: team.id,
          },
        });
      } catch (error) {
        console.warn(
          `  ! Skipped ${student.externalId} (${student.name ?? "no name"}) — already exists elsewhere:`,
          error instanceof Error ? error.message.split("\n")[0] : error,
        );
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
