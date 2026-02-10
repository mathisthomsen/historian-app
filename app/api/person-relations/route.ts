import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireUser, getOrCreateLocalUser } from '../../lib/auth/requireUser';
const prisma = new PrismaClient();

// Define relationship types and their reciprocals
const RELATIONSHIP_TYPES = {
  // Family relationships
  'father': 'child',
  'mother': 'child', 
  'son': 'parent',
  'daughter': 'parent',
  'brother': 'sibling',
  'sister': 'sibling',
  'grandfather': 'grandchild',
  'grandmother': 'grandchild',
  'grandson': 'grandparent',
  'granddaughter': 'grandparent',
  'uncle': 'nephew/niece',
  'aunt': 'nephew/niece',
  'nephew': 'uncle/aunt',
  'niece': 'uncle/aunt',
  
  // Marriage relationships
  'husband': 'wife',
  'wife': 'husband',
  'spouse': 'spouse',
  
  // Professional relationships
  'colleague': 'colleague',
  'boss': 'employee',
  'employee': 'boss',
  'mentor': 'mentee',
  'mentee': 'mentor',
  'teacher': 'student',
  'student': 'teacher',
  
  // Other relationships
  'friend': 'friend',
  'neighbor': 'neighbor',
  'acquaintance': 'acquaintance',
  'business_partner': 'business_partner',
  'rival': 'rival',
  'enemy': 'enemy'
} as const;

type RelationshipType = keyof typeof RELATIONSHIP_TYPES;

// Helper function to get reciprocal relationship
function getReciprocalRelation(relationType: string): string {
  return RELATIONSHIP_TYPES[relationType as RelationshipType] || relationType;
}

// Helper function to validate relationship type
function isValidRelationshipType(relationType: string): boolean {
  return relationType in RELATIONSHIP_TYPES;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const localUser = await getOrCreateLocalUser(user);
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('personId');

    if (!personId) {
      return NextResponse.json({ error: 'Person ID is required' }, { status: 400 });
    }

    console.log('DEBUG: Available Prisma models:', Object.keys(prisma));
    // Get all relationships for the person (both outgoing and incoming)
    const relationships = await prisma.person_relations.findMany({
      where: {
        OR: [
          { from_person_id: parseInt(personId) },
          { to_person_id: parseInt(personId) }
        ],
        AND: [
          {
            OR: [
              { from_person: { userId: localUser.id } },
              { to_person: { userId: localUser.id } }
            ]
          }
        ]
      },
      include: {
        from_person: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            birth_date: true,
            death_date: true
          }
        },
        to_person: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            birth_date: true,
            death_date: true
          }
        }
      },
      orderBy: [
        { relation_type: 'asc' },
        { from_person: { first_name: 'asc' } }
      ]
    });

    // Transform the data to show relationships from the perspective of the target person
    const transformedRelationships = relationships.map(rel => {
      const isOutgoing = rel.from_person_id === parseInt(personId);
      const otherPerson = isOutgoing ? rel.to_person : rel.from_person;
      const relationType = isOutgoing ? rel.relation_type : getReciprocalRelation(rel.relation_type);
      
      return {
        id: rel.id,
        personId: otherPerson.id,
        personName: `${otherPerson.first_name || ''} ${otherPerson.last_name || ''}`.trim() || 'Unbekannt',
        relationType,
        isOutgoing,
        notes: rel.notes,
        otherPerson: {
          id: otherPerson.id,
          firstName: otherPerson.first_name,
          lastName: otherPerson.last_name,
          birthDate: otherPerson.birth_date,
          deathDate: otherPerson.death_date
        }
      };
    });

    return NextResponse.json(transformedRelationships);
  } catch (error) {
    console.error('Error fetching person relationships:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const localUser = await getOrCreateLocalUser(user);
    const body = await request.json();
    const { fromPersonId, toPersonId, relationType, notes } = body;

    // Validate required fields
    if (!fromPersonId || !toPersonId || !relationType) {
      return NextResponse.json({ 
        error: 'fromPersonId, toPersonId, and relationType are required' 
      }, { status: 400 });
    }

    // Validate relationship type
    if (!isValidRelationshipType(relationType)) {
      return NextResponse.json({ 
        error: 'Invalid relationship type',
        validTypes: Object.keys(RELATIONSHIP_TYPES)
      }, { status: 400 });
    }

    // Check if persons exist and belong to the user
    const [fromPerson, toPerson] = await Promise.all([
      prisma.persons.findFirst({
        where: { id: fromPersonId, userId: localUser.id }
      }),
      prisma.persons.findFirst({
        where: { id: toPersonId, userId: localUser.id }
      })
    ]);

    if (!fromPerson || !toPerson) {
      return NextResponse.json({ error: 'One or both persons not found' }, { status: 404 });
    }

    // Check if relationship already exists
    const existingRelation = await prisma.person_relations.findFirst({
      where: {
        OR: [
          {
            from_person_id: fromPersonId,
            to_person_id: toPersonId
          },
          {
            from_person_id: toPersonId,
            to_person_id: fromPersonId
          }
        ]
      }
    });

    if (existingRelation) {
      return NextResponse.json({ error: 'Relationship already exists' }, { status: 409 });
    }

    // Create the relationship
    const relationship = await prisma.person_relations.create({
      data: {
        from_person_id: fromPersonId,
        to_person_id: toPersonId,
        relation_type: relationType,
        notes: notes || null
      },
      include: {
        from_person: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        to_person: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Relationship created successfully',
      relationship: {
        id: relationship.id,
        fromPerson: {
          id: relationship.from_person.id,
          name: `${relationship.from_person.first_name || ''} ${relationship.from_person.last_name || ''}`.trim()
        },
        toPerson: {
          id: relationship.to_person.id,
          name: `${relationship.to_person.first_name || ''} ${relationship.to_person.last_name || ''}`.trim()
        },
        relationType: relationship.relation_type,
        reciprocalType: getReciprocalRelation(relationship.relation_type),
        notes: relationship.notes
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating person relationship:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get available relationship types
export async function OPTIONS() {
  return NextResponse.json({
    relationshipTypes: Object.keys(RELATIONSHIP_TYPES),
    reciprocals: RELATIONSHIP_TYPES
  });
} 