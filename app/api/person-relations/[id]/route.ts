import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const relationshipId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { relationType, notes } = body;

    // Validate required fields
    if (!relationType) {
      return NextResponse.json({ error: 'relationType is required' }, { status: 400 });
    }

    // Check if relationship exists and belongs to the user
    const existingRelationship = await prisma.person_relations.findFirst({
      where: {
        id: relationshipId,
        OR: [
          { from_person: { userId: user.id } },
          { to_person: { userId: user.id } }
        ]
      }
    });

    if (!existingRelationship) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    // Update the relationship
    const updatedRelationship = await prisma.person_relations.update({
      where: { id: relationshipId },
      data: {
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
      message: 'Relationship updated successfully',
      relationship: {
        id: updatedRelationship.id,
        fromPerson: {
          id: updatedRelationship.from_person.id,
          name: `${updatedRelationship.from_person.first_name || ''} ${updatedRelationship.from_person.last_name || ''}`.trim()
        },
        toPerson: {
          id: updatedRelationship.to_person.id,
          name: `${updatedRelationship.to_person.first_name || ''} ${updatedRelationship.to_person.last_name || ''}`.trim()
        },
        relationType: updatedRelationship.relation_type,
        notes: updatedRelationship.notes
      }
    });

  } catch (error) {
    console.error('Error updating person relationship:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const relationshipId = parseInt(resolvedParams.id);

    // Check if relationship exists and belongs to the user
    const existingRelationship = await prisma.person_relations.findFirst({
      where: {
        id: relationshipId,
        OR: [
          { from_person: { userId: user.id } },
          { to_person: { userId: user.id } }
        ]
      }
    });

    if (!existingRelationship) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    // Delete the relationship
    await prisma.person_relations.delete({
      where: { id: relationshipId }
    });

    return NextResponse.json({
      message: 'Relationship deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting person relationship:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 