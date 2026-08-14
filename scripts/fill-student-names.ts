import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { prisma } from "../lib/prisma";

const names: Record<string, string> = {
  MFA0232: "Dinithi Thamodya Wanigasooriya",
  MFA0368: "Hapuarachchige Dona Radheesha Oshani",
  MFC0767: "Mawanane Hewa Navindu Thathsara",
  MFA0362: "Haliyadda Wasala Mudaliyanselage Budhyanga Sathika Prabashwara Seenadhe",
  MFB0448: "Hikkaduwa Withanage Tharul Sansana",
  MFB0445: "Hewayale Thilina Rajitha Ediriweera",
  MFB0427: "Hettige Anton Mesandu Thulnitha Perera",
  MFB0570: "Kariyawasam Bovithanthri Tineth Kaveesha Madubhashana",
  MFB0612: "Kodisinghe Arachchige Sunera Sandaruwan Kodisinghe",

  MFB0630: "Kuda Withanage Isula Nimsath Kudawithana",
  MFD1472: "Yadeesh Nethsara",
  MFD1209: "Senerath Gamage Thameesha Pawan Abeywickrama",
  MFB0501: "Jayalath Pedige Eranga Bandara Jayalath",
  MFD1228: "Sheikh Abdullah",
  MFB0651: "Kurukulasooriya Shalom Anthoney Jetaime Fernando",
  MFB0588: "Kavisaahari Srishivakumaran",
  MFD1280: "Tarmika Krishnamoorthi",
  MFD1287: "Tharanya Srishivakumaran",

  MFB0567: "Kariyapperuma Athukoralage Dimath Thasnaka Athukorala",
  MFB0674: "Lithum Damsithu Ekanayake",
  MFC0868: "Morawakage Dinuth Sejan Morawaka",
  MFA0313: "Galhena Arachchilage Venuraka Nimsara Premadasa",
  MFA0217: "Denagama Vidanelage Chanitha Sendinu",
  MFB0436: "Hewa Karanayakage Don Malki Himasha",
  MFA0335: "Geekiyanage Dona Randini Sachindra Karunathilaka",
  MFD1245: "Sithumi Rihansi Kulathunga",

  MFA0108: "Aththanayake Pathiranalage Smbhawani Aththanayake",
  MFA0373: "Hasali Dihasna Liyanapathirana",
  MFD1213: "Senudi Dilsara Palapotha Weerathunga",
  MFD1200: "Selvaratnam Melkidexsan",
  MFC0893: "Nadagamuwage Idusha Manaka Prabhashwara Wanasinghe",
  MFA0145: "Bohingamuwa Appuhamilage Malindu Wisal Bohingamuwa",
  MFD1142: "Sahan Ali Obeidat",
  MFB0482: "J. A Savithu Dulnitha Jayasinghe",
  MFD1182: "Sanuka Nethum Lanka Geeganage",
  MFC0780: "Menula Sanod Samarasinghe",

  MFA0122: "Bamunu Arachchillage Yasuri Vihanga Gunawardhana",
  MFA0196: "Dahanayakage Dona Sithuki Sanya Dahanayaka",
  MFC0998: "Polwatta Gallage Sehas Senhiru Samarawickrama",
  MFA0177: "Chenitha Lakvidu Udupuldeniya",
  MFC0865: "Mohomed Iqbal Fathima Nuha",
  MFD1302: "Thennakoon Mudiyanselage Malitha Manodya Kumara Thennakoon",
  MFD1317: "Thumbe Gamage Senuja Dilmeth",
  MFC0987: "Pilapitiya Herath Mudiyanselage Shashendra Nipun Bandara",
  MFC1106: "Rawaththa Widana Kankanamge Pinidu Maneesha",
  MFD1154: "Samarakoon Jayasekara Mudiyanselage Dinuja Bandara Samar",
};

async function main() {
  let updated = 0;
  let skipped = 0;

  for (const [externalId, name] of Object.entries(names)) {
    const student = await prisma.student.findUnique({ where: { externalId } });
    if (!student) {
      console.warn(`! No student found with externalId ${externalId}`);
      continue;
    }
    if (student.name !== externalId) {
      console.log(`- Skipped ${externalId}: already named "${student.name}"`);
      skipped++;
      continue;
    }
    await prisma.student.update({ where: { id: student.id }, data: { name } });
    console.log(`+ ${externalId} -> ${name}`);
    updated++;
  }

  const stillUnnamed = await prisma.student.findMany({
    where: { externalId: { not: null } },
  });
  const unnamed = stillUnnamed.filter((s) => s.name === s.externalId);

  console.log(`\nUpdated ${updated}, skipped ${skipped} (already named).`);
  console.log(`Still unnamed (${unnamed.length}):`, unnamed.map((s) => s.externalId).join(", "));
}

main().finally(() => prisma.$disconnect());
