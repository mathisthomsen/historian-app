const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleData() {
  const userId = 'cmdx9ra0000008znc4n4022f6'; // Test user ID

  try {
    console.log('Creating sample life events and connecting them to historic events...');

    // Sample life events data with connections to historic events
    const lifeEventsData = [
      // Rudolf Neumann (ID: 60) - Medical career events
      {
        personId: 60,
        title: "Medical Studies at University of Leipzig",
        date: "1888-09-01",
        end_date: "1893-07-15",
        location: "Leipzig, Germany",
        description: "Rudolf Neumann began his medical studies at the University of Leipzig, specializing in dermatology and venereology.",
        eventType: "EDUCATION",
        relatedEventIds: [1, 2]
      },
      {
        personId: 60,
        title: "Appointment as Professor at University of Hamburg",
        date: "1905-04-01",
        location: "Hamburg, Germany",
        description: "Neumann was appointed as Professor of Dermatology at the University of Hamburg, establishing his academic career.",
        eventType: "CAREER",
        relatedEventIds: [3, 4]
      },
      {
        personId: 60,
        title: "Publication of 'Dermatologische Studien'",
        date: "1912-03-15",
        location: "Hamburg, Germany",
        description: "Neumann published his seminal work on dermatological studies, contributing significantly to the field.",
        eventType: "PUBLICATION",
        relatedEventIds: [5]
      },

      // Karl Otto Weber (ID: 59) - Revolutionary period
      {
        personId: 59,
        title: "Participation in 1848 Revolution",
        date: "1848-03-15",
        end_date: "1849-07-23",
        location: "Frankfurt am Main, Germany",
        description: "Weber actively participated in the German Revolution of 1848, advocating for democratic reforms.",
        eventType: "POLITICAL",
        relatedEventIds: [6, 7, 8]
      },
      {
        personId: 59,
        title: "Medical Practice in Heidelberg",
        date: "1850-01-01",
        end_date: "1867-11-05",
        location: "Heidelberg, Germany",
        description: "Weber established his medical practice in Heidelberg, becoming a respected physician in the region.",
        eventType: "CAREER",
        relatedEventIds: [9, 10]
      },

      // Paul Prym (ID: 58) - Academic career
      {
        personId: 58,
        title: "Mathematics Studies at University of Bonn",
        date: "1900-10-01",
        end_date: "1905-07-15",
        location: "Bonn, Germany",
        description: "Prym studied mathematics at the University of Bonn, focusing on complex analysis and function theory.",
        eventType: "EDUCATION",
        relatedEventIds: [11, 12]
      },
      {
        personId: 58,
        title: "Professorship at University of Bonn",
        date: "1910-04-01",
        location: "Bonn, Germany",
        description: "Prym was appointed Professor of Mathematics at the University of Bonn, succeeding his mentor.",
        eventType: "CAREER",
        relatedEventIds: [13, 14]
      },

      // Eduard Hummelsheim (ID: 57) - Medical innovations
      {
        personId: 57,
        title: "Development of Hummelsheim Procedure",
        date: "1908-06-01",
        location: "Köln, Germany",
        description: "Hummelsheim developed his innovative surgical procedure for treating strabismus, revolutionizing ophthalmology.",
        eventType: "INNOVATION",
        relatedEventIds: [15, 16]
      },
      {
        personId: 57,
        title: "World War I Medical Service",
        date: "1914-08-01",
        end_date: "1918-11-11",
        location: "Various locations, Germany",
        description: "Hummelsheim served as a military surgeon during World War I, treating wounded soldiers.",
        eventType: "MILITARY",
        relatedEventIds: [17, 18, 19]
      },

      // Carl von Mosengeil (ID: 56) - Physics research
      {
        personId: 56,
        title: "Research on Relativistic Physics",
        date: "1905-01-01",
        end_date: "1907-12-31",
        location: "Bonn, Germany",
        description: "Mosengeil conducted groundbreaking research on relativistic physics, particularly on the Doppler effect.",
        eventType: "RESEARCH",
        relatedEventIds: [20, 21]
      },
      {
        personId: 56,
        title: "Collaboration with Einstein",
        date: "1906-03-15",
        location: "Bonn, Germany",
        description: "Mosengeil collaborated with Albert Einstein on theoretical physics, contributing to the development of relativity theory.",
        eventType: "COLLABORATION",
        relatedEventIds: [22, 23]
      },

      // Erich Hoffmann (ID: 55) - Medical discoveries
      {
        personId: 55,
        title: "Discovery of Treponema pallidum",
        date: "1905-03-03",
        location: "Berlin, Germany",
        description: "Hoffmann and Fritz Schaudinn discovered the causative agent of syphilis, Treponema pallidum.",
        eventType: "DISCOVERY",
        relatedEventIds: [24, 25]
      },
      {
        personId: 55,
        title: "Professorship at University of Bonn",
        date: "1912-10-01",
        location: "Bonn, Germany",
        description: "Hoffmann was appointed Professor of Dermatology at the University of Bonn, continuing his research.",
        eventType: "CAREER",
        relatedEventIds: [26, 27]
      },

      // Max Schultze (ID: 54) - Microscopy innovations
      {
        personId: 54,
        title: "Development of Cell Theory",
        date: "1861-01-01",
        location: "Bonn, Germany",
        description: "Schultze developed his cell theory, defining cells as protoplasm with a nucleus, advancing microscopy.",
        eventType: "THEORY",
        relatedEventIds: [28, 29]
      },
      {
        personId: 54,
        title: "Founding of Microscopical Society",
        date: "1865-06-15",
        location: "Bonn, Germany",
        description: "Schultze founded the Microscopical Society, promoting scientific collaboration in microscopy.",
        eventType: "ORGANIZATION",
        relatedEventIds: [30, 31]
      },

      // Viktor Müller-Heß (ID: 53) - Forensic medicine
      {
        personId: 53,
        title: "Forensic Medicine Studies",
        date: "1902-10-01",
        end_date: "1907-07-15",
        location: "Vienna, Austria",
        description: "Müller-Heß studied forensic medicine in Vienna, specializing in legal medicine and pathology.",
        eventType: "EDUCATION",
        relatedEventIds: [32, 33]
      },
      {
        personId: 53,
        title: "World War II Medical Service",
        date: "1939-09-01",
        end_date: "1945-05-08",
        location: "Berlin, Germany",
        description: "Müller-Heß served as a forensic pathologist during World War II, investigating war-related deaths.",
        eventType: "MILITARY",
        relatedEventIds: [34, 35, 36]
      },

      // Paul Eversheim (ID: 52) - Academic career
      {
        personId: 52,
        title: "Mathematics and Physics Studies",
        date: "1892-10-01",
        end_date: "1897-07-15",
        location: "Bonn, Germany",
        description: "Eversheim studied mathematics and physics at the University of Bonn, focusing on theoretical physics.",
        eventType: "EDUCATION",
        relatedEventIds: [37, 38]
      },
      {
        personId: 52,
        title: "Research on Quantum Mechanics",
        date: "1920-01-01",
        end_date: "1928-03-08",
        location: "Bonn, Germany",
        description: "Eversheim conducted research on quantum mechanics, contributing to the development of modern physics.",
        eventType: "RESEARCH",
        relatedEventIds: [39, 40]
      },

      // Friedrich Trendelenburg (ID: 51) - Surgical innovations
      {
        personId: 51,
        title: "Development of Trendelenburg Position",
        date: "1885-06-01",
        location: "Leipzig, Germany",
        description: "Trendelenburg developed the surgical position named after him, revolutionizing abdominal surgery.",
        eventType: "INNOVATION",
        relatedEventIds: [41, 42]
      },
      {
        personId: 51,
        title: "Professorship at University of Leipzig",
        date: "1895-04-01",
        location: "Leipzig, Germany",
        description: "Trendelenburg was appointed Professor of Surgery at the University of Leipzig.",
        eventType: "CAREER",
        relatedEventIds: [43, 44]
      },

      // Theodor Rumpf (ID: 50) - Neurology research
      {
        personId: 50,
        title: "Neurology Studies in Berlin",
        date: "1875-10-01",
        end_date: "1880-07-15",
        location: "Berlin, Germany",
        description: "Rumpf studied neurology in Berlin, specializing in nervous system disorders.",
        eventType: "EDUCATION",
        relatedEventIds: [45, 46]
      },
      {
        personId: 50,
        title: "Research on Nervous System",
        date: "1885-01-01",
        end_date: "1934-10-06",
        location: "Volkmarshausen, Germany",
        description: "Rumpf conducted extensive research on the nervous system, publishing numerous papers.",
        eventType: "RESEARCH",
        relatedEventIds: [47, 48]
      }
    ];

    // Create life events
    for (const lifeEventData of lifeEventsData) {
      const { relatedEventIds, eventType, personId, date, ...lifeEvent } = lifeEventData;
      const event_id = relatedEventIds && relatedEventIds.length > 0 ? relatedEventIds[0] : null;
      // Convert dates to JS Date objects if present
      const start_date = date ? new Date(date) : (lifeEvent.start_date ? new Date(lifeEvent.start_date) : null);
      const end_date = lifeEvent.end_date ? new Date(lifeEvent.end_date) : null;
      
      const createdLifeEvent = await prisma.life_events.create({
        data: {
          ...lifeEvent,
          person_id: personId,
          userId: userId,
          event_id: event_id,
          start_date,
          end_date
        }
      });

      console.log(`Created life event: ${createdLifeEvent.title} for person ${personId}`);
    }

    console.log('Sample data creation completed successfully!');
    console.log(`Created ${lifeEventsData.length} life events`);

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData(); 