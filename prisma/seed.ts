import { Certainty, PrismaClient, ProjectRole, SourceReliability, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";


const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Fixed IDs — deterministic, enables idempotent upserts
// ---------------------------------------------------------------------------

const IDS = {
  user: { admin: "seed-user-admin" },
  project: { demo: "seed-project-demo" },
  relationType: {
    verwandt: "seed-rt-verwandt",
    participated: "seed-rt-participated",
    bornIn: "seed-rt-born-in",
    colleague: "seed-rt-colleague",
  },
  person: {
    goethe: "seed-person-goethe",
    schiller: "seed-person-schiller",
    humboldt: "seed-person-humboldt",
    caroline: "seed-person-caroline",
  },
  personName: {
    goetheDE: "seed-pn-goethe-de",
    goetheLA: "seed-pn-goethe-la",
    schillerDE: "seed-pn-schiller-de",
    schillerLA: "seed-pn-schiller-la",
    humboldtDE: "seed-pn-humboldt-de",
    humboldtLA: "seed-pn-humboldt-la",
    carolineDE: "seed-pn-caroline-de",
    carolineLA: "seed-pn-caroline-la",
  },
  event: {
    weimar: "seed-event-weimar",
    classicism: "seed-event-classicism",
    cosima: "seed-event-cosima",
    americaExpedition: "seed-event-america-expedition",
  },
  source: {
    goetheBrief: "seed-source-goethe-brief",
    schillerMemoiren: "seed-source-schiller-memoiren",
    humboldtReisebericht: "seed-source-humboldt-reisebericht",
  },
  relation: {
    goetheFriendSchiller: "seed-rel-goethe-schiller",
    goetheParticipatedWeimar: "seed-rel-goethe-weimar",
    humboldtParticipatedExpedition: "seed-rel-humboldt-expedition",
    carolineColleagueHumboldt: "seed-rel-caroline-humboldt",
    schillerParticipatedClassicism: "seed-rel-schiller-classicism",
  },
  relationEvidence: {
    re1: "seed-re-1",
    re2: "seed-re-2",
    re3: "seed-re-3",
  },
};

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding database…");

  // ---- User ----------------------------------------------------------------
  const demoPasswordHash = await bcrypt.hash("Demo1234!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@evidoxa.dev" },
    update: { password_hash: demoPasswordHash, email_verified_at: new Date() },
    create: {
      id: IDS.user.admin,
      email: "admin@evidoxa.dev",
      name: "Evidoxa Admin",
      role: UserRole.ADMIN,
      password_hash: demoPasswordHash,
      email_verified_at: new Date(),
    },
  });

  // ---- Project -------------------------------------------------------------
  const project = await prisma.project.upsert({
    where: { id: IDS.project.demo },
    update: {},
    create: {
      id: IDS.project.demo,
      name: "Evidoxa Demo",
      description: "Demonstration project with historical seed data",
    },
  });

  // ---- UserProject (admin owns the demo project) ---------------------------
  await prisma.userProject.upsert({
    where: {
      user_id_project_id: { user_id: admin.id, project_id: project.id },
    },
    update: {},
    create: {
      user_id: admin.id,
      project_id: project.id,
      role: ProjectRole.OWNER,
    },
  });

  // ---- RelationTypes -------------------------------------------------------
  await prisma.relationType.upsert({
    where: { id: IDS.relationType.verwandt },
    update: {},
    create: {
      id: IDS.relationType.verwandt,
      project_id: project.id,
      name: "ist verwandt mit",
      inverse_name: "ist verwandt mit",
      description: "Verwandtschaftliche Beziehung",
      color: "#4f46e5",
      icon: "users",
      valid_from_types: ["PERSON"],
      valid_to_types: ["PERSON"],
    },
  });

  await prisma.relationType.upsert({
    where: { id: IDS.relationType.participated },
    update: {},
    create: {
      id: IDS.relationType.participated,
      project_id: project.id,
      name: "participated in",
      inverse_name: "had participant",
      description: "Person participated in an event",
      color: "#059669",
      icon: "calendar",
      valid_from_types: ["PERSON"],
      valid_to_types: ["EVENT"],
    },
  });

  await prisma.relationType.upsert({
    where: { id: IDS.relationType.bornIn },
    update: {},
    create: {
      id: IDS.relationType.bornIn,
      project_id: project.id,
      name: "was born in",
      inverse_name: "was birthplace of",
      description: "Birthplace relation",
      color: "#d97706",
      icon: "map-pin",
      valid_from_types: ["PERSON"],
      valid_to_types: ["LOCATION"],
    },
  });

  await prisma.relationType.upsert({
    where: { id: IDS.relationType.colleague },
    update: {},
    create: {
      id: IDS.relationType.colleague,
      project_id: project.id,
      name: "was colleague of",
      inverse_name: "was colleague of",
      description: "Professional or intellectual colleague",
      color: "#be185d",
      icon: "handshake",
      valid_from_types: ["PERSON"],
      valid_to_types: ["PERSON"],
    },
  });

  // ---- Persons -------------------------------------------------------------
  const goethe = await prisma.person.upsert({
    where: { id: IDS.person.goethe },
    update: {},
    create: {
      id: IDS.person.goethe,
      project_id: project.id,
      created_by_id: admin.id,
      first_name: "Johann Wolfgang",
      last_name: "von Goethe",
      birth_year: 1749,
      birth_date_certainty: Certainty.CERTAIN,
      birth_place: "Frankfurt am Main",
      death_year: 1832,
      death_date_certainty: Certainty.CERTAIN,
      death_place: "Weimar",
      notes: "Bedeutendster deutschsprachiger Dichter der Klassik",
    },
  });

  const schiller = await prisma.person.upsert({
    where: { id: IDS.person.schiller },
    update: {},
    create: {
      id: IDS.person.schiller,
      project_id: project.id,
      created_by_id: admin.id,
      first_name: "Johann Christoph Friedrich",
      last_name: "von Schiller",
      birth_year: 1759,
      birth_date_certainty: Certainty.CERTAIN,
      birth_place: "Marbach am Neckar",
      death_year: 1805,
      death_date_certainty: Certainty.CERTAIN,
      death_place: "Weimar",
      notes: "Dichter, Philosoph und Historiker der Weimarer Klassik",
    },
  });

  const humboldt = await prisma.person.upsert({
    where: { id: IDS.person.humboldt },
    update: {},
    create: {
      id: IDS.person.humboldt,
      project_id: project.id,
      created_by_id: admin.id,
      first_name: "Alexander",
      last_name: "von Humboldt",
      birth_year: 1769,
      birth_date_certainty: Certainty.CERTAIN,
      birth_place: "Berlin",
      death_year: 1859,
      death_date_certainty: Certainty.CERTAIN,
      death_place: "Berlin",
      notes: "Naturforscher und Weltreisender, Begründer der modernen Geographie",
    },
  });

  const caroline = await prisma.person.upsert({
    where: { id: IDS.person.caroline },
    update: {},
    create: {
      id: IDS.person.caroline,
      project_id: project.id,
      created_by_id: admin.id,
      first_name: "Caroline",
      last_name: "von Humboldt",
      birth_year: 1766,
      birth_date_certainty: Certainty.CERTAIN,
      birth_place: "Minden",
      death_year: 1829,
      death_date_certainty: Certainty.CERTAIN,
      death_place: "Tegel",
      notes: "Ehefrau Wilhelm von Humboldts, Bildungsreformerin",
    },
  });

  // ---- PersonNames (2 per person: primary DE + Latin variant) --------------
  await prisma.personName.upsert({
    where: { id: IDS.personName.goetheDE },
    update: {},
    create: {
      id: IDS.personName.goetheDE,
      person_id: goethe.id,
      name: "Johann Wolfgang von Goethe",
      language: "de",
      is_primary: true,
    },
  });

  await prisma.personName.upsert({
    where: { id: IDS.personName.goetheLA },
    update: {},
    create: {
      id: IDS.personName.goetheLA,
      person_id: goethe.id,
      name: "Ioannes Wolfgangus de Goethe",
      language: "la",
      is_primary: false,
    },
  });

  await prisma.personName.upsert({
    where: { id: IDS.personName.schillerDE },
    update: {},
    create: {
      id: IDS.personName.schillerDE,
      person_id: schiller.id,
      name: "Friedrich von Schiller",
      language: "de",
      is_primary: true,
    },
  });

  await prisma.personName.upsert({
    where: { id: IDS.personName.schillerLA },
    update: {},
    create: {
      id: IDS.personName.schillerLA,
      person_id: schiller.id,
      name: "Fridericus de Schiller",
      language: "la",
      is_primary: false,
    },
  });

  await prisma.personName.upsert({
    where: { id: IDS.personName.humboldtDE },
    update: {},
    create: {
      id: IDS.personName.humboldtDE,
      person_id: humboldt.id,
      name: "Alexander von Humboldt",
      language: "de",
      is_primary: true,
    },
  });

  await prisma.personName.upsert({
    where: { id: IDS.personName.humboldtLA },
    update: {},
    create: {
      id: IDS.personName.humboldtLA,
      person_id: humboldt.id,
      name: "Alexander de Humboldt",
      language: "la",
      is_primary: false,
    },
  });

  await prisma.personName.upsert({
    where: { id: IDS.personName.carolineDE },
    update: {},
    create: {
      id: IDS.personName.carolineDE,
      person_id: caroline.id,
      name: "Caroline von Humboldt",
      language: "de",
      is_primary: true,
    },
  });

  await prisma.personName.upsert({
    where: { id: IDS.personName.carolineLA },
    update: {},
    create: {
      id: IDS.personName.carolineLA,
      person_id: caroline.id,
      name: "Carolina de Humboldt",
      language: "la",
      is_primary: false,
    },
  });

  // ---- Events --------------------------------------------------------------
  const weimar = await prisma.event.upsert({
    where: { id: IDS.event.weimar },
    update: {},
    create: {
      id: IDS.event.weimar,
      project_id: project.id,
      created_by_id: admin.id,
      title: "Goethes Ankunft in Weimar",
      description: "Goethe zieht auf Einladung Herzog Carl Augusts nach Weimar",
      event_type: "Umzug",
      start_year: 1775,
      start_date_certainty: Certainty.CERTAIN,
      location: "Weimar",
    },
  });

  const classicism = await prisma.event.upsert({
    where: { id: IDS.event.classicism },
    update: {},
    create: {
      id: IDS.event.classicism,
      project_id: project.id,
      created_by_id: admin.id,
      title: "Weimarer Klassik",
      description: "Blütezeit der deutschen Klassik in Weimar",
      event_type: "Epoche",
      start_year: 1786,
      start_date_certainty: Certainty.CERTAIN,
      end_year: 1832,
      end_date_certainty: Certainty.PROBABLE,
      location: "Weimar",
    },
  });

  await prisma.event.upsert({
    where: { id: IDS.event.cosima },
    update: {},
    create: {
      id: IDS.event.cosima,
      project_id: project.id,
      created_by_id: admin.id,
      title: "Freundschaft Goethe–Schiller",
      description: "Beginn der engen Freundschaft und Zusammenarbeit zwischen Goethe und Schiller",
      event_type: "Beziehung",
      start_year: 1794,
      start_month: 7,
      start_date_certainty: Certainty.CERTAIN,
      end_year: 1805,
      end_date_certainty: Certainty.CERTAIN,
      location: "Weimar / Jena",
    },
  });

  const americaExpedition = await prisma.event.upsert({
    where: { id: IDS.event.americaExpedition },
    update: {},
    create: {
      id: IDS.event.americaExpedition,
      project_id: project.id,
      created_by_id: admin.id,
      title: "Amerikanische Forschungsreise",
      description: "Humboldts Forschungsreise durch Lateinamerika und die USA",
      event_type: "Expedition",
      start_year: 1799,
      start_date_certainty: Certainty.CERTAIN,
      end_year: 1804,
      end_date_certainty: Certainty.CERTAIN,
      location: "Lateinamerika, Vereinigte Staaten",
    },
  });

  // ---- Sources -------------------------------------------------------------
  const goetheBrief = await prisma.source.upsert({
    where: { id: IDS.source.goetheBrief },
    update: {},
    create: {
      id: IDS.source.goetheBrief,
      project_id: project.id,
      created_by_id: admin.id,
      title: "Goethes Briefwechsel mit Schiller",
      type: "letter",
      author: "Johann Wolfgang von Goethe",
      date: "1794–1805",
      repository: "Goethe- und Schiller-Archiv, Weimar",
      call_number: "GSA 28/1",
      reliability: SourceReliability.HIGH,
      notes: "Vollständige Briefedition, Weimarer Ausgabe 1828",
    },
  });

  const schillerMemoiren = await prisma.source.upsert({
    where: { id: IDS.source.schillerMemoiren },
    update: {},
    create: {
      id: IDS.source.schillerMemoiren,
      project_id: project.id,
      created_by_id: admin.id,
      title: "Schillers Tagebücher",
      type: "archival_document",
      author: "Friedrich von Schiller",
      date: "c. 1795–1804",
      repository: "Schiller-Nationalmuseum, Marbach",
      reliability: SourceReliability.HIGH,
      notes: "Handschriftliche Tagebücher aus der Weimarer Periode",
    },
  });

  const humboldtReisebericht = await prisma.source.upsert({
    where: { id: IDS.source.humboldtReisebericht },
    update: {},
    create: {
      id: IDS.source.humboldtReisebericht,
      project_id: project.id,
      created_by_id: admin.id,
      title: "Reise in die Aequinoctial-Gegenden des neuen Continents",
      type: "official_record",
      author: "Alexander von Humboldt",
      date: "1799–1804",
      repository: "Staatsbibliothek Berlin",
      call_number: "8° Gx 4567",
      reliability: SourceReliability.HIGH,
      notes: "Humboldts Hauptwerk zur Amerikanischen Expedition",
    },
  });

  // ---- Relations -----------------------------------------------------------
  // Rel 1: Goethe "ist verwandt mit" Schiller (close friends, not actual relatives —
  //        using verwandt loosely here; in a real project this would be "Freundschaft")
  const rel1 = await prisma.relation.upsert({
    where: { id: IDS.relation.goetheFriendSchiller },
    update: {},
    create: {
      id: IDS.relation.goetheFriendSchiller,
      project_id: project.id,
      created_by_id: admin.id,
      from_type: "PERSON",
      from_id: goethe.id,
      to_type: "PERSON",
      to_id: schiller.id,
      relation_type_id: IDS.relationType.colleague,
      certainty: Certainty.CERTAIN,
      valid_from_year: 1794,
      valid_from_month: 7,
      valid_from_cert: Certainty.CERTAIN,
      valid_to_year: 1805,
      valid_to_cert: Certainty.CERTAIN,
      notes: "Enge Freundschaft und literarische Zusammenarbeit",
    },
  });

  // Rel 2: Goethe participated in Weimar event
  const rel2 = await prisma.relation.upsert({
    where: { id: IDS.relation.goetheParticipatedWeimar },
    update: {},
    create: {
      id: IDS.relation.goetheParticipatedWeimar,
      project_id: project.id,
      created_by_id: admin.id,
      from_type: "PERSON",
      from_id: goethe.id,
      to_type: "EVENT",
      to_id: weimar.id,
      relation_type_id: IDS.relationType.participated,
      certainty: Certainty.CERTAIN,
      valid_from_year: 1775,
      valid_from_cert: Certainty.CERTAIN,
      notes: "Hauptakteur der Weimarer Klassik",
    },
  });

  // Rel 3: Humboldt participated in America expedition
  await prisma.relation.upsert({
    where: { id: IDS.relation.humboldtParticipatedExpedition },
    update: {},
    create: {
      id: IDS.relation.humboldtParticipatedExpedition,
      project_id: project.id,
      created_by_id: admin.id,
      from_type: "PERSON",
      from_id: humboldt.id,
      to_type: "EVENT",
      to_id: americaExpedition.id,
      relation_type_id: IDS.relationType.participated,
      certainty: Certainty.CERTAIN,
      notes: "Leitete die Expedition als Hauptforscher",
    },
  });

  // Rel 4: Caroline was colleague of Humboldt
  await prisma.relation.upsert({
    where: { id: IDS.relation.carolineColleagueHumboldt },
    update: {},
    create: {
      id: IDS.relation.carolineColleagueHumboldt,
      project_id: project.id,
      created_by_id: admin.id,
      from_type: "PERSON",
      from_id: caroline.id,
      to_type: "PERSON",
      to_id: humboldt.id,
      relation_type_id: IDS.relationType.colleague,
      certainty: Certainty.PROBABLE,
      notes: "Schwägerin und intellektuelle Partnerin",
    },
  });

  // Rel 5: Schiller participated in Weimarer Klassik
  const rel5 = await prisma.relation.upsert({
    where: { id: IDS.relation.schillerParticipatedClassicism },
    update: {},
    create: {
      id: IDS.relation.schillerParticipatedClassicism,
      project_id: project.id,
      created_by_id: admin.id,
      from_type: "PERSON",
      from_id: schiller.id,
      to_type: "EVENT",
      to_id: classicism.id,
      relation_type_id: IDS.relationType.participated,
      certainty: Certainty.CERTAIN,
      valid_from_year: 1799,
      valid_from_cert: Certainty.CERTAIN,
      valid_to_year: 1805,
      valid_to_cert: Certainty.CERTAIN,
      notes: "Zog 1799 nach Weimar, zentrale Figur der Klassik",
    },
  });

  // ---- RelationEvidence (3 records, at least 1 with page_reference) --------
  await prisma.relationEvidence.upsert({
    where: { id: IDS.relationEvidence.re1 },
    update: {},
    create: {
      id: IDS.relationEvidence.re1,
      relation_id: rel1.id,
      source_id: goetheBrief.id,
      page_reference: "S. 47, Brief vom 27. Juli 1794",
      quote: "Ihr Brief hat mir außerordentlich wohl gethan.",
      confidence: Certainty.CERTAIN,
      notes: "Erster erhaltener Brief der Freundschaft",
    },
  });

  await prisma.relationEvidence.upsert({
    where: { id: IDS.relationEvidence.re2 },
    update: {},
    create: {
      id: IDS.relationEvidence.re2,
      relation_id: rel2.id,
      source_id: schillerMemoiren.id,
      confidence: Certainty.PROBABLE,
      notes: "Schiller erwähnt Goethes Ankunft in Weimar",
    },
  });

  await prisma.relationEvidence.upsert({
    where: { id: IDS.relationEvidence.re3 },
    update: {},
    create: {
      id: IDS.relationEvidence.re3,
      relation_id: rel5.id,
      source_id: humboldtReisebericht.id,
      page_reference: "Bd. 1, S. 12",
      confidence: Certainty.POSSIBLE,
      notes: "Sekundärquelle; Humboldt erwähnt Schiller im Vorwort",
    },
  });

  // ---- Summary -------------------------------------------------------------
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.userProject.count(),
    prisma.relationType.count(),
    prisma.person.count(),
    prisma.personName.count(),
    prisma.event.count(),
    prisma.source.count(),
    prisma.relation.count(),
    prisma.relationEvidence.count(),
  ]);

  const [users, projects, userProjects, relationTypes, persons, personNames, events, sources, relations, relationEvidence] =
    counts;

  console.log("Seed complete:");
  console.log(`  users: ${users}`);
  console.log(`  projects: ${projects}`);
  console.log(`  user_projects: ${userProjects}`);
  console.log(`  relation_types: ${relationTypes}`);
  console.log(`  persons: ${persons}`);
  console.log(`  person_names: ${personNames}`);
  console.log(`  events: ${events}`);
  console.log(`  sources: ${sources}`);
  console.log(`  relations: ${relations}`);
  console.log(`  relation_evidence: ${relationEvidence}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
