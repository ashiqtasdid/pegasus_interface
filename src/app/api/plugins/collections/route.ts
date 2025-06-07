import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../lib/database';
import { auth } from '../../../../lib/auth';

// GET /api/plugins/collections - Get user's plugin collections
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await DatabaseService.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includePlugins = searchParams.get('includePlugins') === 'true';

    const collections = await DatabaseService.getUserCollections(user._id.toString(), { includePlugins });

    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Error fetching plugin collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plugin collections' },
      { status: 500 }
    );
  }
}

// POST /api/plugins/collections - Create a new plugin collection
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await DatabaseService.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { name, description, isPublic = false, pluginIds = [] } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    // Validate plugin IDs if provided
    if (pluginIds.length > 0) {
      for (const pluginId of pluginIds) {
        const plugin = await DatabaseService.getPluginById(pluginId);
        if (!plugin) {
          return NextResponse.json(
            { error: `Plugin with ID ${pluginId} not found` },
            { status: 404 }
          );
        }
      }
    }

    const collectionData = {
      userId: user._id.toString(),
      name: name.trim(),
      description: description?.trim() || '',
      tags: [], // Initialize with empty tags array
      isPublic: Boolean(isPublic),
      pluginIds: pluginIds || [],
      viewCount: 0, // Initialize view count
      followerCount: 0 // Initialize follower count
    };

    const collectionId = await DatabaseService.createPluginCollection(collectionData);

    // Log activity
    await DatabaseService.logUserActivity(
      user._id.toString(),
      'collection_created',
      'collection',
      collectionId,
      { name: name.trim(), pluginCount: pluginIds.length }
    );

    // Return the created collection data
    const createdCollection = {
      _id: collectionId,
      ...collectionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json({ collection: createdCollection }, { status: 201 });
  } catch (error) {
    console.error('Error creating plugin collection:', error);
    return NextResponse.json(
      { error: 'Failed to create plugin collection' },
      { status: 500 }
    );
  }
}

// PUT /api/plugins/collections - Update a plugin collection
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await DatabaseService.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { collectionId, name, description, isPublic } = await request.json();

    if (!collectionId) {
      return NextResponse.json(
        { error: 'collectionId is required' },
        { status: 400 }
      );
    }

    // Get existing collection to verify ownership
    const collections = await DatabaseService.getUserCollections(user._id.toString());
    const existingCollection = collections.find(c => c._id?.toString() === collectionId);

    if (!existingCollection) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Collection name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) updateData.description = description?.trim() || '';
    if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic);

    const updatedCollection = await DatabaseService.updatePluginCollection(
      collectionId,
      user._id.toString(),
      updateData
    );

    if (!updatedCollection) {
      return NextResponse.json(
        { error: 'Failed to update collection' },
        { status: 500 }
      );
    }

    // Log activity
    await DatabaseService.logUserActivity(
      user._id.toString(),
      'collection_updated',
      'collection',
      collectionId,
      { updates: Object.keys(updateData) }
    );

    return NextResponse.json({ collection: updatedCollection });
  } catch (error) {
    console.error('Error updating plugin collection:', error);
    return NextResponse.json(
      { error: 'Failed to update plugin collection' },
      { status: 500 }
    );
  }
}

// DELETE /api/plugins/collections - Delete a plugin collection
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await DatabaseService.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { collectionId } = await request.json();

    if (!collectionId) {
      return NextResponse.json(
        { error: 'collectionId is required' },
        { status: 400 }
      );
    }

    const success = await DatabaseService.deletePluginCollection(collectionId, user._id.toString());

    if (!success) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      );
    }

    // Log activity
    await DatabaseService.logUserActivity(
      user._id.toString(),
      'collection_deleted',
      'collection',
      collectionId,
      {}
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plugin collection:', error);
    return NextResponse.json(
      { error: 'Failed to delete plugin collection' },
      { status: 500 }
    );
  }
}
