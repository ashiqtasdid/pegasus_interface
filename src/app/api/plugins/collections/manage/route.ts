import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../../lib/database';
import { auth } from '../../../../../lib/auth';

// POST /api/plugins/collections/manage - Add or remove plugins from collections
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

    const { collectionId, pluginId, action } = await request.json();

    if (!collectionId || !pluginId || !action) {
      return NextResponse.json(
        { error: 'collectionId, pluginId, and action are required' },
        { status: 400 }
      );
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be either "add" or "remove"' },
        { status: 400 }
      );
    }

    // Verify collection ownership
    const collections = await DatabaseService.getUserCollections(user._id.toString());
    const collection = collections.find(c => c._id?.toString() === collectionId);

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      );
    }

    // Verify plugin exists
    const plugin = await DatabaseService.getPluginById(pluginId);
    if (!plugin) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
    }

    let success = false;

    if (action === 'add') {
      success = await DatabaseService.addPluginToCollection(collectionId, user._id.toString(), pluginId);
      if (success) {
        // Log activity
        await DatabaseService.logUserActivity(
          user._id.toString(),
          'plugin_added_to_collection',
          'collection',
          collectionId,
          { pluginId, pluginName: plugin.pluginName || plugin.displayName, collectionName: collection.name }
        );
      }
    } else {
      success = await DatabaseService.removePluginFromCollection(collectionId, pluginId, user._id.toString());
      if (success) {
        // Log activity
        await DatabaseService.logUserActivity(
          user._id.toString(),
          'plugin_removed_from_collection',
          'collection',
          collectionId,
          { pluginId, pluginName: plugin.pluginName || plugin.displayName, collectionName: collection.name }
        );
      }
    }

    if (!success) {
      const errorMsg = action === 'add' 
        ? 'Plugin is already in collection or failed to add'
        : 'Plugin is not in collection or failed to remove';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      action,
      collectionId,
      pluginId
    });
  } catch (error) {
    console.error('Error managing plugin collection:', error);
    return NextResponse.json(
      { error: 'Failed to manage plugin collection' },
      { status: 500 }
    );
  }
}

// GET /api/plugins/collections/manage - Get collection management info for a plugin
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
    const pluginId = searchParams.get('pluginId');

    if (!pluginId) {
      return NextResponse.json(
        { error: 'pluginId is required' },
        { status: 400 }
      );
    }

    // Verify plugin exists
    const plugin = await DatabaseService.getPluginById(pluginId);
    if (!plugin) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
    }

    // Get user's collections
    const collections = await DatabaseService.getUserCollections(user._id.toString());

    // Check which collections contain this plugin
    const collectionsWithPlugin = collections.map(collection => ({
      _id: collection._id,
      name: collection.name,
      description: collection.description,
      isPublic: collection.isPublic,
      pluginCount: collection.pluginIds?.length || 0,
      containsPlugin: collection.pluginIds?.includes(pluginId) || false
    }));

    return NextResponse.json({
      plugin: {
        _id: plugin._id,
        name: plugin.displayName || plugin.pluginName,
        description: plugin.description
      },
      collections: collectionsWithPlugin,
      totalCollections: collections.length
    });
  } catch (error) {
    console.error('Error getting collection management info:', error);
    return NextResponse.json(
      { error: 'Failed to get collection management info' },
      { status: 500 }
    );
  }
}
